// เลขที่บิลต้องเรียงต่อกันไม่ขาดช่วง เทสต์นี้ใช้ฐานข้อมูลจำลองในหน่วยความจำ ไม่ต้องต่อ MySQL
const { test } = require("node:test");
const assert = require("node:assert/strict");
const {
  assignRepairDocumentNo,
  releaseRepairDocumentNo,
  releaseReceiptNo,
  docNosSkippedOnDelete,
} = require("../utils/documentNumber");

const fakeDb = (repairs) => {
  const counters = new Map();
  const key = ({ prefix, period }) => `${prefix}:${period}`;
  return {
    counters,
    repairs,
    documentCounter: {
      findUnique: async ({ where }) =>
        counters.get(key(where.prefix_period)) || null,
      upsert: async ({ where, create }) => {
        const k = key(where.prefix_period);
        const row = counters.get(k) || { ...create, lastNo: 0 };
        row.lastNo += 1;
        counters.set(k, row);
        return row;
      },
      update: async ({ where, data }) => {
        const row = counters.get(key(where.prefix_period));
        row.lastNo -= data.lastNo.decrement;
        return row;
      },
    },
    repair: {
      findUnique: async ({ where }) =>
        repairs.find((r) => r.id === where.id) || null,
      update: async ({ where, data }) =>
        Object.assign(
          repairs.find((r) => r.id === where.id),
          data,
        ),
    },
  };
};

// 20 ต.ค. 2569 เวลาไทย = เดือน 6910
const OCT = new Date("2026-10-20T03:00:00Z");
const bill = (id, status, extra = {}) => ({
  id,
  status,
  createdAt: OCT,
  ...extra,
});

test("ออกเลขใบเสร็จเรียงต่อกันในเดือนเดียวกัน", async () => {
  const db = fakeDb([bill(1, "IN_PROGRESS"), bill(2, "PAID")]);
  await assignRepairDocumentNo(db, 1);
  await assignRepairDocumentNo(db, 2);
  assert.deepEqual(
    db.repairs.map((r) => r.receiptNo),
    ["RE-6910-0001", "RE-6910-0002"],
  );
});

test("นับเดือนตามเวลาไทย บิลหลังเที่ยงคืนวันสิ้นเดือนเป็นเดือนใหม่", async () => {
  // 31 ต.ค. 18:00 UTC = 1 พ.ย. 01:00 เวลาไทย
  const db = fakeDb([
    bill(1, "PAID", { createdAt: new Date("2026-10-31T18:00:00Z") }),
  ]);
  await assignRepairDocumentNo(db, 1);
  assert.equal(db.repairs[0].receiptNo, "RE-6911-0001");
});

test("ออกเลขแล้วไม่ออกซ้ำ เครดิตได้เลขใบส่งของเพิ่ม เลขใบเสร็จเดิมยังอยู่", async () => {
  const db = fakeDb([bill(1, "IN_PROGRESS")]);
  await assignRepairDocumentNo(db, 1);
  db.repairs[0].status = "CREDIT";
  await assignRepairDocumentNo(db, 1);
  await assignRepairDocumentNo(db, 1);
  assert.equal(db.repairs[0].receiptNo, "RE-6910-0001");
  assert.equal(db.repairs[0].deliveryNo, "DO-6910-0001");
});

test("ใบประเมินราคาได้เลข QT ไม่ได้เลขใบเสร็จ", async () => {
  const db = fakeDb([bill(1, "ESTIMATE")]);
  await assignRepairDocumentNo(db, 1);
  assert.equal(db.repairs[0].quotationNo, "QT-6910-0001");
  assert.equal(db.repairs[0].receiptNo, undefined);
});

test("บิลที่ยกเลิกไม่ได้เลขใหม่", async () => {
  const db = fakeDb([bill(1, "CANCELLED")]);
  await assignRepairDocumentNo(db, 1);
  assert.equal(db.repairs[0].receiptNo, undefined);
});

test("ลบบิลล่าสุดคืนเลขให้บิลถัดไป บิลกลางๆ คืนไม่ได้และบอกว่าเลขไหนจะขาด", async () => {
  const db = fakeDb([bill(1, "PAID"), bill(2, "PAID")]);
  await assignRepairDocumentNo(db, 1);
  await assignRepairDocumentNo(db, 2);

  assert.deepEqual(await docNosSkippedOnDelete(db, db.repairs[0]), [
    "RE-6910-0001",
  ]);
  assert.deepEqual(await docNosSkippedOnDelete(db, db.repairs[1]), []);

  await releaseRepairDocumentNo(db, db.repairs[1]);
  db.repairs.push(bill(3, "PAID"));
  await assignRepairDocumentNo(db, 3);
  assert.equal(db.repairs[2].receiptNo, "RE-6910-0002");
});

test("บิลเครดิตต้องเป็นเลขล่าสุดทั้ง RE และ DO ถึงจะลบได้", async () => {
  const db = fakeDb([bill(1, "IN_PROGRESS"), bill(2, "PAID")]);
  await assignRepairDocumentNo(db, 1);
  await assignRepairDocumentNo(db, 2);
  db.repairs[0].status = "CREDIT";
  await assignRepairDocumentNo(db, 1);
  // DO ล่าสุด แต่ RE ไม่ใช่ (บิล 2 ได้ RE ถัดไปแล้ว)
  assert.deepEqual(await docNosSkippedOnDelete(db, db.repairs[0]), [
    "RE-6910-0001",
  ]);
});

test("เปลี่ยนเป็นใบประเมินทันทีหลังเปิดบิล คืนเลขใบเสร็จ", async () => {
  const db = fakeDb([bill(1, "IN_PROGRESS")]);
  await assignRepairDocumentNo(db, 1);
  await releaseReceiptNo(db, 1);
  assert.equal(db.repairs[0].receiptNo, null);
  assert.equal(db.counters.get("RE:6910").lastNo, 0);
});
