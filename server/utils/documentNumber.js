const crypto = require("crypto");

// เลขเอกสารแยกตามประเภท แต่ละประเภทเรียงต่อกันเองและเริ่ม 0001 ใหม่ทุกเดือน เช่น RE-6909-0001
// ต้องตรงกับการใส่เลขย้อนหลังใน migration 20260927000000_add_document_numbers
// 20260927010000_receipt_no_for_open_repairs และ 20260928000000_receipt_no_by_open_date
const PREFIX = {
  receipt: "RE",
  delivery: "DO",
  quotation: "QT",
  billing: "BL",
};

// นับเดือนตามเวลาไทยเสมอ เครื่องที่รันจะตั้งเขตเวลาไว้แบบไหนก็ได้เลขชุดเดียวกัน
const periodOf = (date) => {
  const thai = new Date(new Date(date).getTime() + 7 * 60 * 60 * 1000);
  const year = String((thai.getUTCFullYear() + 543) % 100).padStart(2, "0");
  const month = String(thai.getUTCMonth() + 1).padStart(2, "0");
  return `${year}${month}`;
};

const formatNo = (prefix, period, seq) =>
  `${prefix}-${period}-${String(seq).padStart(4, "0")}`;

// ต้องเรียกใน transaction เดียวกับที่บันทึกเลขลงเอกสาร ไม่งั้นเลขที่นับไปแล้วจะหายเป็นช่วงเมื่อบันทึกไม่ผ่าน
const nextDocumentNo = async (tx, prefix, date) => {
  const period = periodOf(date);
  const counter = await tx.documentCounter.upsert({
    where: { prefix_period: { prefix, period } },
    create: { prefix, period, lastNo: 1 },
    update: { lastNo: { increment: 1 } },
  });
  return formatNo(prefix, period, counter.lastNo);
};

// เลขที่จะได้ถ้าออกตอนนี้ ไว้แสดงในหน้าตัวอย่าง ไม่ได้จองเลข
const peekDocumentNo = async (db, prefix, date) => {
  const period = periodOf(date);
  const counter = await db.documentCounter.findUnique({
    where: { prefix_period: { prefix, period } },
  });
  return formatNo(prefix, period, (counter?.lastNo || 0) + 1);
};

// ออกเลขให้เอกสารที่สถานะตอนนี้ต้องใช้ เรียกหลังบันทึกบิลทุกครั้ง
// เลขที่ออกไปแล้วไม่เปลี่ยนอีก แม้สถานะจะย้อนกลับ ใบที่ลูกค้าถืออยู่จะได้ตรงกับระบบเสมอ
// ใบเสร็จออกเลขตั้งแต่เปิดบิล เพราะร้านพิมพ์ใบเสร็จไปยื่นให้ลูกค้าก่อนแล้วค่อยเก็บเงิน
// บิลที่กลายเป็นเครดิตทีหลังยังเก็บเลขใบเสร็จไว้ ใช้ตอนรับเงินจริง เลขจะได้ไม่ขาดช่วง
// ทุกใบนับเดือนจากวันเปิดบิล ตรงกับวันที่บนหัวใบ
const assignRepairDocumentNo = async (tx, repairId) => {
  const repair = await tx.repair.findUnique({
    where: { id: repairId },
    select: {
      status: true,
      receiptNo: true,
      deliveryNo: true,
      quotationNo: true,
      createdAt: true,
    },
  });
  if (!repair) return;

  const data = {};
  const needsReceipt = ["IN_PROGRESS", "COMPLETED", "PAID"].includes(
    repair.status,
  );
  if (needsReceipt && !repair.receiptNo) {
    data.receiptNo = await nextDocumentNo(tx, PREFIX.receipt, repair.createdAt);
  }
  if (repair.status === "CREDIT" && !repair.deliveryNo) {
    data.deliveryNo = await nextDocumentNo(
      tx,
      PREFIX.delivery,
      repair.createdAt,
    );
  }
  if (repair.status === "ESTIMATE" && !repair.quotationNo) {
    data.quotationNo = await nextDocumentNo(
      tx,
      PREFIX.quotation,
      repair.createdAt,
    );
  }

  if (Object.keys(data).length) {
    await tx.repair.update({ where: { id: repairId }, data });
  }
};

const DOC_NO_PATTERN = /^([A-Z]+)-(\d{4})-(\d+)$/;

// เลขของบิลที่เป็นเลขล่าสุดของชุดนั้นอยู่ ลบบิลแล้วคืนเลขนี้ให้บิลถัดไปได้ เลขจะไม่ขาดช่วง
// เลขที่มีบิลใหม่กว่าได้เลขต่อไปแล้ว คืนไม่ได้ ลบไปจะเป็นช่องว่างในลำดับ
const splitDocNosOnDelete = async (db, repair) => {
  const releasable = [];
  const skipped = [];

  for (const docNo of [
    repair.receiptNo,
    repair.deliveryNo,
    repair.quotationNo,
  ]) {
    const match = DOC_NO_PATTERN.exec(docNo || "");
    if (!match) continue;

    const [, prefix, period, seq] = match;
    const counter = await db.documentCounter.findUnique({
      where: { prefix_period: { prefix, period } },
    });
    if (counter?.lastNo === Number(seq)) {
      releasable.push({ prefix, period });
    } else {
      skipped.push(docNo);
    }
  }

  return { releasable, skipped };
};

const docNosSkippedOnDelete = async (db, repair) =>
  (await splitDocNosOnDelete(db, repair)).skipped;

// เรียกใน transaction เดียวกับที่ลบบิล ลบไม่ผ่านตัวนับก็ไม่ถอยตาม
const releaseRepairDocumentNo = async (tx, repair) => {
  const { releasable } = await splitDocNosOnDelete(tx, repair);
  for (const { prefix, period } of releasable) {
    await tx.documentCounter.update({
      where: { prefix_period: { prefix, period } },
      data: { lastNo: { decrement: 1 } },
    });
  }
};

// บิลที่เปลี่ยนเป็นใบเสนอราคายังไม่ได้ซ่อม ลูกค้าอาจไม่ตกลงเลย เลขใบเสร็จที่ได้ตอนเปิดบิลจึงยังไม่ควรจองไว้
// คืนได้เฉพาะตอนยังเป็นเลขล่าสุด (มักบันทึกเป็นใบเสนอราคาทันทีหลังเปิดบิล) ตกลงซ่อมแล้วค่อยได้เลขใหม่
// ถ้ามีบิลใหม่กว่าได้เลขถัดไปแล้ว เก็บเลขเดิมไว้ใช้ตอนตกลงซ่อม ดีกว่าปล่อยให้เลขขาดช่วง
const releaseReceiptNo = async (tx, repairId) => {
  const repair = await tx.repair.findUnique({
    where: { id: repairId },
    select: { receiptNo: true },
  });
  const { releasable } = await splitDocNosOnDelete(tx, {
    receiptNo: repair?.receiptNo,
  });
  if (!releasable.length) return;

  const [{ prefix, period }] = releasable;
  await tx.documentCounter.update({
    where: { prefix_period: { prefix, period } },
    data: { lastNo: { decrement: 1 } },
  });
  await tx.repair.update({
    where: { id: repairId },
    data: { receiptNo: null },
  });
};

const billingKeyOf = (repairIds) =>
  crypto
    .createHash("sha1")
    .update([...repairIds].sort((a, b) => a - b).join(","))
    .digest("hex");

// ใบวางบิลของชุดบิลเดิมได้เลขเดิม พิมพ์ซ้ำกี่รอบก็ตรงกับใบที่ส่งให้ลูกค้าไปแล้ว
const findBillingNo = async (db, customerId, repairIds) => {
  const note = await db.billingNote.findUnique({
    where: {
      customerId_repairKey: { customerId, repairKey: billingKeyOf(repairIds) },
    },
  });
  return note?.number || null;
};

const peekBillingNo = async (db, customerId, repairIds) =>
  (await findBillingNo(db, customerId, repairIds)) ||
  peekDocumentNo(db, PREFIX.billing, new Date());

const issueBillingNo = (prisma, customerId, repairIds) =>
  prisma.$transaction(async (tx) => {
    const existing = await findBillingNo(tx, customerId, repairIds);
    if (existing) return existing;

    const number = await nextDocumentNo(tx, PREFIX.billing, new Date());
    await tx.billingNote.create({
      data: { number, customerId, repairKey: billingKeyOf(repairIds) },
    });
    return number;
  });

module.exports = {
  assignRepairDocumentNo,
  releaseRepairDocumentNo,
  releaseReceiptNo,
  docNosSkippedOnDelete,
  peekBillingNo,
  issueBillingNo,
};
