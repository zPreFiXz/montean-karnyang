const fs = require("fs");
const path = require("path");
const { bahtText } = require("./bahtText");

// ต้องตรงกับ client/public/payment-qr.svg
const PAYMENT_QR_SRC = `data:image/svg+xml;base64,${fs
  .readFileSync(path.join(__dirname, "..", "assets", "payment-qr.svg"))
  .toString("base64")}`;
const PAYMENT_QR_NAME = "มณเฑียรการยาง";
// ต้องตรงกับ client/public/promptpay-logo-bw.jpg
const PROMPTPAY_LOGO_SRC = `data:image/jpeg;base64,${fs
  .readFileSync(path.join(__dirname, "..", "assets", "promptpay-logo.jpg"))
  .toString("base64")}`;

// QR รับเงินท้ายแผ่น ใช้ทั้งใบเสร็จและใบวางบิล (ขนาดดู .qr-area ใน CSS ด้านล่าง)
const PAYMENT_QR_HTML = `<div class="qr-area"><div class="qr"><img class="pp" src="${PROMPTPAY_LOGO_SRC}" alt="พร้อมเพย์" /><img class="code" src="${PAYMENT_QR_SRC}" alt="QR รับเงิน" /><p class="name">${PAYMENT_QR_NAME}</p><p class="hint">สแกนเพื่อชำระเงิน</p></div></div>`;

// ฝังฟอนต์แทนโหลดจาก Google Fonts เพราะเครื่องที่ร้านอาจไม่มีเน็ตตอนสั่งพิมพ์
const fontFace = (weight, kind) => {
  const file = path.join(
    __dirname,
    "..",
    "assets",
    "fonts",
    `Athiti-${weight}-${kind}.woff2`,
  );
  if (!fs.existsSync(file)) return "";
  const base64 = fs.readFileSync(file).toString("base64");
  return `@font-face {
    font-family: "Athiti";
    font-style: normal;
    font-weight: ${weight};
    src: url(data:font/woff2;base64,${base64}) format("woff2");
  }`;
};

const FONT_FACES = [
  fontFace(400, "thai"),
  fontFace(400, "latin"),
  fontFace(600, "thai"),
  fontFace(600, "latin"),
].join("\n");

// หน้าตาต้องตรงกับตัวอย่างฝั่งหน้าเว็บ (client/src/utils/receipt.js, ReceiptPaper) แก้ต้องแก้ทั้งสองที่
const SHOP = {
  name: "ร้านมณเฑียรการยาง",
  address: "543 หมู่ที่ 5 ตำบลน้ำอ้อม อำเภอกันทรลักษ์ จังหวัดศรีสะเกษ 33110",
  contact: "โทร. 089-849-2861, 093-326-1705  เลขประจำตัวผู้เสียภาษี 3 33030032502 1",
};

const MIN_ROWS = 10;

// ตรงกับฝั่งหน้าเว็บ ชื่อยาวตกเป็นสองบรรทัด ถ้านับทุกแถวเป็นหนึ่งแผ่นจะล้น
// ประมาณบรรทัดจากความกว้างตัวอักษร (ช่องรายการกว้างราว 222 จุด) เผื่อไว้ราวหนึ่งในสิบ
const NAME_LINE_WIDTH = 204;
const THAI_COMBINING = /[\u0E31\u0E34-\u0E3A\u0E47-\u0E4E]/;
const charWidth = (ch) => {
  if (THAI_COMBINING.test(ch)) return 0;
  if (/[\u0E00-\u0E7F]/.test(ch)) return 6;
  if (/[A-Z]/.test(ch)) return 9;
  if (/[a-z]/.test(ch)) return 7;
  if (/[0-9]/.test(ch)) return 8;
  if (ch === " ") return 4;
  return 6;
};
const estimateNameLines = (text) => {
  const width = [...String(text || "")].reduce(
    (sum, ch) => sum + charWidth(ch),
    0,
  );
  return Math.max(1, Math.ceil(width / NAME_LINE_WIDTH));
};

const paginateRows = (rows, linesOf, maxLines = MIN_ROWS) => {
  const pages = [[]];
  let used = 0;
  for (const row of rows) {
    const lines = linesOf(row);
    if (used + lines > maxLines && pages[pages.length - 1].length > 0) {
      pages.push([]);
      used = 0;
    }
    pages[pages.length - 1].push(row);
    used += lines;
  }
  return pages;
};

// แผ่นที่รายการเต็มแล้วไม่มีที่ให้ QR จึงยกรายการท้ายไปแผ่นใหม่
// ค่าวัดจากหน้าเอกสารจริงใน Chrome
const QR_PAGE_LINES = 11;
// QR ขนาดเดียวทั้งใบเสร็จและใบวางบิล พอดีแผ่นสุดท้ายของใบเสร็จที่แน่นที่สุด (QR_PAGE_LINES บรรทัดรวมแถวสรุป)
// ต้องตรงกับ .receipt-qr ใน client/src/index.css
const QR_SIZE = "28mm";
// แถวใบวางบิลสูงตามจำนวนบรรทัดรายละเอียด (ดู billLines) จึงแบ่งแผ่นด้วยความสูงแทนจำนวนบิล
// ค่าวัดจากหน้าเอกสารจริงใน Chrome: แผ่นกลางมีที่ให้แถวราว 493px แผ่นสุดท้ายต้องเหลือที่ให้ยอดรวม
// ช่องเซ็น และ QR 28 มม. เต็มขนาด ต้องตรงกับ billPages ฝั่งหน้าเว็บ
const BILL_ROW_HEIGHT = { 1: 23.4, 2: 41.7 };
const BILL_PAGE_HEIGHT = 490;
const BILL_LAST_PAGE_HEIGHT = 230;
const billRowHeight = (repair) =>
  BILL_ROW_HEIGHT[billLines(repair).filter(Boolean).length] ??
  BILL_ROW_HEIGHT[2];
const billPageHeight = (repairs) =>
  repairs.reduce((sum, repair) => sum + billRowHeight(repair), 0);
const billPages = (repairs) => {
  const pages = [];
  let used = Infinity;
  for (const repair of repairs) {
    const height = billRowHeight(repair);
    if (used + height > BILL_PAGE_HEIGHT) {
      pages.push([]);
      used = 0;
    }
    pages[pages.length - 1].push(repair);
    used += height;
  }
  if (pages.length === 0) return [[]];
  // แผ่นสุดท้ายเกินที่ QR รับได้ แผ่นนี้ยังอยู่ในความสูงแผ่นกลาง จึงยกไปแค่บิลสุดท้ายใบเดียว
  const last = pages[pages.length - 1];
  if (billPageHeight(last) > BILL_LAST_PAGE_HEIGHT) {
    pages[pages.length - 1] = last.slice(0, -1);
    pages.push(last.slice(-1));
  }
  return pages;
};
const DELIVERY_PAGE_LINES = 14;
// มัดจำที่ยังหักจากยอด คืนเงินไปแล้วไม่ต้องหัก (ต้องตรงกับ depositOf ฝั่งหน้าเว็บ)
const depositOf = (repair) =>
  repair?.depositAmount && !repair?.depositRefundedAt
    ? Number(repair.depositAmount)
    : 0;
// แถวสรุปท้ายตาราง: แถวเหนือแถวเทา แถวเทา (มีจำนวนเงินเป็นตัวอักษร) และแถวใต้แถวเทา
// แถวเทาคือยอดที่ลูกค้าจ่ายจริง ส่วนลดและมัดจำหักอยู่เหนือแถวนี้ ใบรับเงินมัดจำบอกยอดทั้งบิลไว้ข้างใต้
// (ต้องตรงกับ receiptSummaryOf ฝั่งหน้าเว็บ)
const receiptSummaryOf = (repair, discountItems = []) => {
  const total = Number(repair.totalPrice || 0);
  const discountTotal = discountItems.reduce(
    (sum, item) => sum + Number(item.unitPrice) * Number(item.quantity),
    0,
  );
  const hasDiscount = discountTotal !== 0;
  const deposit = repair.isDeposit ? 0 : depositOf(repair);

  const above = [];
  if (hasDiscount || deposit) {
    // ยอดในบิลหักส่วนลดไปแล้ว ยอดก่อนหักจึงต้องบวกกลับ (ส่วนลดเก็บเป็นเลขติดลบ)
    above.push({
      key: "subtotal",
      label: "รวมเป็นเงิน",
      amount: total - discountTotal,
    });
  }
  if (hasDiscount) {
    for (const item of discountItems) {
      above.push({
        key: `discount-${item.id}`,
        label: item.itemName,
        amount: Number(item.unitPrice) * Number(item.quantity),
      });
    }
  }
  if (deposit) {
    above.push({ key: "deposit", label: "หักมัดจำ", amount: -deposit });
  }

  const sum = deposit
    ? { label: "ยอดสุทธิ", amount: total - deposit }
    : { label: "จำนวนเงินรวม", amount: total };

  const below = repair.isDeposit
    ? [
        { key: "bill-total", label: "ยอดรวมทั้งบิล", amount: repair.billTotal },
        {
          key: "remaining",
          label: "คงเหลือชำระ",
          amount: repair.billTotal - total,
          bold: true,
        },
      ]
    : [];

  return { above, sum, below, lines: above.length + 1 + below.length };
};
const makeRoomForQr = (pages, linesOf, summaryRows, limit) => {
  const last = [...pages[pages.length - 1]];
  const moved = [];
  let used = last.reduce((sum, row) => sum + linesOf(row), 0);

  while (used + summaryRows > limit && last.length > 1) {
    const row = last.pop();
    moved.unshift(row);
    used -= linesOf(row);
  }

  return moved.length ? [...pages.slice(0, -1), last, moved] : pages;
};

// ต้องตรงกับ shortProvince ฝั่งหน้าเว็บ (client/src/utils/receipt.js)
const shortProvince = (province) =>
  province === "กรุงเทพมหานคร" ? "กรุงเทพฯ" : province || "";

// ต้องตรงกับ asIssued ฝั่งหน้าเว็บ (client/src/utils/receipt.js)
const asIssued = (repair) =>
  repair.status === "CANCELLED"
    ? { ...repair, status: repair.cancelledStatus || "PAID", isCancelled: true }
    : repair;

// ใบรับเงินมัดจำเป็นใบเสร็จของเงินมัดจำก้อนเดียว ใช้เลขของบิลเดิมอ้างอิง ลงวันที่รับมัดจำ
// (ต้องตรงกับ asDepositReceipt ฝั่งหน้าเว็บ)
const DEPOSIT_LINE_NAME = "เงินมัดจำค่าอะไหล่";
const asDepositReceipt = (repair) => {
  const deposit = Number(repair.depositAmount || 0);
  return {
    ...repair,
    isDeposit: true,
    type: "GENERAL",
    status: "PAID",
    receiptNo: receiptDocNo(repair),
    deliveryNo: null,
    paidAt: repair.depositPaidAt,
    paymentMethod: repair.depositMethod,
    totalPrice: deposit,
    billTotal: Number(repair.totalPrice || 0),
    depositAmount: null,
    repairItems: [
      {
        id: "deposit",
        itemName: DEPOSIT_LINE_NAME,
        quantity: 1,
        unitPrice: deposit,
      },
    ],
  };
};

// ยังไม่ซ่อม = ใบเสนอราคา, เครดิต = ใบส่งของ, เรียกใบเสร็จได้เฉพาะตอนรับเงินแล้ว
const receiptDocTitle = (repair) => {
  if (repair.isDeposit) return "ใบรับเงินมัดจำ";
  if (repair.status === "ESTIMATE") return "ใบเสนอราคา";
  if (repair.status === "CREDIT") return "ใบส่งของ";
  return "ใบเสร็จรับเงิน";
};

const receiptDocNo = (repair) => {
  if (repair.status === "ESTIMATE") return repair.quotationNo || repair.id;
  if (repair.status === "CREDIT") return repair.deliveryNo || repair.id;
  return repair.receiptNo || repair.id;
};

// ใบสั่งซ่อมใช้ตัวเลขชุดเดียวกับใบเสร็จ เปลี่ยนแค่คำนำหน้าเป็น JO (ต้องตรงกับ jobSheetNo ฝั่งหน้าเว็บ)
const jobSheetNo = (repair) =>
  repair.receiptNo ? repair.receiptNo.replace(/^RE-/, "JO-") : repair.id;

// ใบส่งของ และใบเสร็จของบิลเครดิตที่มาจ่ายแล้ว (ต้องตรงกับ isCreditDocument ฝั่งหน้าเว็บ)
const isCreditDocument = (repair) =>
  repair.status === "CREDIT" ||
  (repair.status === "PAID" && !!repair.deliveryNo);
// ช่องวิธีจ่ายมีเฉพาะหน่วยงาน (ต้องตรงกับ showsPaymentBoxes ฝั่งหน้าเว็บ)
const showsPaymentBoxes = (repair) =>
  isCreditDocument(repair) &&
  repair.customer?.organizationType === "GOVERNMENT";
// บิลเครดิตที่จ่ายแล้วไม่ต้องสแกนอีก (ตรงกับ hasPaymentQr ฝั่งหน้าเว็บ)
const hasPaymentQr = (repair) =>
  !repair.isCancelled &&
  !["ESTIMATE", "CREDIT"].includes(repair.status) &&
  !isCreditDocument(repair);

// บรรทัดธนาคารสองบรรทัด สองคอลัมน์ เลขที่กับจำนวนเงินกว้างเท่ากัน (ต้องตรงกับ paymentLineRows ฝั่งหน้าเว็บ)
const bankRows = (fields) => [fields.slice(0, 2), fields.slice(2)];

const PAYMENT_BOXES = [
  { label: "เงินสด/โอน", method: "CASH" },
  { label: "บัตรเครดิต", method: "CREDIT_CARD" },
  { label: "เช็ค", method: "CHEQUE" },
];

// ตรงกับ formatPlate/formatPhone ใน client/src/utils/formats.js
const formatPhone = (phoneNumber) => {
  const digits = String(phoneNumber ?? "").replace(/\D/g, "");
  if (digits.length === 10) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  if (digits.length === 9) {
    return `${digits.slice(0, 2)}-${digits.slice(2, 5)}-${digits.slice(5)}`;
  }
  return String(phoneNumber ?? "");
};

const formatPlate = (plateNumber) => {
  const text = String(plateNumber || "").trim();
  if (!text) return "";
  const parts = text.split(/[\s-]+/).filter(Boolean);
  return parts.length > 1 ? parts.join("-") : text;
};

// ตรงกับ getDisplayBrand ฝั่งหน้าเว็บ
const displayBrand = (model) => {
  if (!model) return "";
  const brand = model.brand || "";
  const name = model.model || "";
  if (brand === "อื่นๆ" || brand === "อื่น ๆ") return name;
  return `${brand} ${name}`.trim();
};

const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

const formatMoney = (value) =>
  Number(value || 0).toLocaleString("th-TH", { maximumFractionDigits: 2 });

// ของแถมคิดราคา 0 ในเล่มกระดาษร้านขีด - ไว้ ไม่ได้เขียนเลขศูนย์
const formatAmount = (value) =>
  Number(value) === 0 ? "-" : formatMoney(value);

const formatQuantity = (value) => {
  const number = Number(value || 0);
  return Number.isInteger(number) ? String(number) : String(number);
};

// ตรงกับ lineUnit ฝั่งหน้าเว็บ
const TYPED_UNIT_SERVICE_NAMES = ["อะไหล่อื่นๆ", "บริการอื่นๆ"];
const unitOf = (item) =>
  item.itemUnit ||
  item.part?.unit ||
  (TYPED_UNIT_SERVICE_NAMES.includes(item.service?.name)
    ? ""
    : item.service?.unit) ||
  "";

// ตรงกับ quantityLabel ฝั่งหน้าเว็บ
const SINGLE_QUANTITY_SERVICE_NAMES = ["ค่าแรง", "ตั้งศูนย์", "สลับยาง+ถ่วงล้อ"];
const quantityLabel = (item, quantity) => {
  const unit = unitOf(item);
  const isSingle =
    !unit || SINGLE_QUANTITY_SERVICE_NAMES.includes(item.service?.name);
  return isSingle && quantity === 1
    ? ""
    : `${formatQuantity(quantity)} ${unit}`.trim();
};

const mergeBySide = (items) => {
  const rows = [];
  const byKey = new Map();

  for (const item of items) {
    const side = item.side === "LEFT" ? "L" : item.side === "RIGHT" ? "R" : "";
    if (!side) {
      rows.push({ item, quantity: Number(item.quantity), sides: [] });
      continue;
    }

    const key = `${item.itemName}|${item.unitPrice}`;
    const existing = byKey.get(key);
    if (existing) {
      existing.quantity += Number(item.quantity);
      if (!existing.sides.includes(side)) existing.sides.push(side);
      continue;
    }

    const row = { item, quantity: Number(item.quantity), sides: [side] };
    byKey.set(key, row);
    rows.push(row);
  }

  return rows.map((row) => ({
    ...row,
    sideLabel:
      row.sides.includes("L") && row.sides.includes("R")
        ? "L-R"
        : row.sides[0] || "",
  }));
};

// แยกจากการวาด HTML ให้เทสต์เทียบกับฝั่งหน้าเว็บได้ (ต้องตรงกับ buildReceiptPages ใน client/src/utils/receipt.js)
// บิลช่วงล่างเรียงแบบหน้ารายละเอียดการซ่อม: รายการเพิ่มเติมคงลำดับที่บันทึก (บิลเก่าบางใบก้อนแท็บไม่ได้อยู่บนสุด)
// ก้อนแท็บเรียงเป็นกลุ่ม ซ้าย-ขวา ซ้าย ขวา อื่นๆ (ดู groupSuspensionDetailItems) ของสองข้างอยู่ตำแหน่งของข้างซ้าย
// ต้องตรงกับ receiptOrder และ splitSuspensionBlocks ฝั่งหน้าเว็บ
const orderTabItems = (items) => {
  const keyOf = (item) => `${item.itemName}|${item.unitPrice}`;
  const sidesOf = new Map();
  const firstLeft = new Map();
  items.forEach((item, index) => {
    if (item.side !== "LEFT" && item.side !== "RIGHT") return;
    const key = keyOf(item);
    if (!sidesOf.has(key)) sidesOf.set(key, new Set());
    sidesOf.get(key).add(item.side);
    if (item.side === "LEFT" && !firstLeft.has(key)) firstLeft.set(key, index);
  });
  const groupOf = (item) => {
    if (item.side === "LEFT" || item.side === "RIGHT") {
      if (sidesOf.get(keyOf(item)).size === 2) return 0;
      return item.side === "LEFT" ? 1 : 2;
    }
    // บิลเก่าที่ของแยกข้างไม่ได้ระบุฝั่ง หน้าเว็บจับเป็นคู่ซ้าย-ขวา
    const attributes = item.part?.attributes;
    const perSide =
      typeof attributes?.perSide === "boolean"
        ? attributes.perSide
        : attributes?.suspensionType === "left-right";
    if (!item.side && perSide) return 0;
    return 3;
  };
  return items
    .map((item, index) => {
      const group = groupOf(item);
      const pos = group === 0 ? (firstLeft.get(keyOf(item)) ?? index) : index;
      return { item, group, pos };
    })
    .sort((a, b) => a.group - b.group || a.pos - b.pos)
    .map(({ item }) => item);
};
// อะไหล่ช่วงล่างที่ไม่ได้ระบุรุ่นรถคันนี้ไม่อยู่ในแท็บ จึงเป็นรายการซ่อมเพิ่มเติม (ตรงกับ fitsVehicle ฝั่งหน้าเว็บ)
const fitsVehicle = (item, vehicle) => {
  if (!vehicle?.brand || !vehicle?.model) return true;
  const list = item.part?.compatibleVehicles;
  if (list === undefined) return true;
  const same = (a, b) => String(a || "").trim() === String(b || "").trim();
  return (
    Array.isArray(list) &&
    list.some(
      (v) => same(v?.brand, vehicle.brand) && same(v?.model, vehicle.model),
    )
  );
};
const isSavedTabItem = (item, vehicle) =>
  item.part?.category?.name === "ช่วงล่าง" || item.side === "OTHER"
    ? fitsVehicle(item, vehicle)
    : !!item.side && item.service?.name === "ตั้งลูกปืนล้อ";
const splitSuspensionBlocks = (items, vehicle) => {
  const isTab = (item) => isSavedTabItem(item, vehicle);
  const tabIndex = items.findIndex(isTab);
  if (tabIndex === -1) return { before: items, tabItems: [], after: [] };
  return {
    before: items.slice(0, tabIndex),
    tabItems: items.filter(isTab),
    after: items.slice(tabIndex).filter((item) => !isTab(item)),
  };
};
const receiptOrder = (repair, items) => {
  if (repair?.type !== "SUSPENSION") return items;
  const { before, tabItems, after } = splitSuspensionBlocks(
    items,
    repair.vehicle?.vehicleModel,
  );
  return [...before, ...orderTabItems(tabItems), ...after];
};

// ใบเสร็จของบิลเครดิตที่จ่ายด้วยเช็ค มีบรรทัดเดียวอ้างใบส่งของ (ต้องตรงกับ chequeNoteRow ฝั่งหน้าเว็บ)
const chequeNoteRow = (repair) =>
  repair.status === "PAID" &&
  repair.paymentMethod === "CHEQUE" &&
  repair.deliveryNo
    ? {
        note: "ได้รับเงินตามใบส่งของเลขที่",
        noteRef: repair.deliveryNo,
        amount: Number(repair.totalPrice || 0),
      }
    : null;

// ตั้งศูนย์ที่ค้างสิทธิ์ไว้หรือมาใช้สิทธิ์ (ต้องตรงกับ alignmentNoteOf ฝั่งหน้าเว็บ)
const alignmentNoteOf = (item) =>
  item.alignmentDeferred
    ? "ค้างตั้งศูนย์"
    : item.alignmentFromRepairId
      ? "ฟรีจากยางใหม่ 4 เส้น"
      : "";

const receiptPages = (repair, { showBrand = true } = {}) => {
  // ราคาติดลบมีแต่ส่วนลด ใช้รองรับบรรทัดที่ถูกเปลี่ยนชื่อ
  const isDiscount = (item) =>
    (item.service?.name || item.itemName) === "ส่วนลด" ||
    Number(item.unitPrice) < 0;
  const noteRow = chequeNoteRow(repair);
  const discountItems = noteRow
    ? []
    : (repair.repairItems || []).filter(isDiscount);
  const discountTotal = discountItems.reduce(
    (sum, item) => sum + Number(item.unitPrice) * Number(item.quantity),
    0,
  );

  const rows = noteRow
    ? [noteRow]
    : mergeBySide(
        receiptOrder(
          repair,
          (repair.repairItems || []).filter((item) => !isDiscount(item)),
        ),
      );
  const rowName = ({ item, sideLabel, note, noteRef }) => {
    if (note) return `${note} ${noteRef}`;
    const base = showBrand ? item.itemName : receiptWorkName(item);
    const alignment = alignmentNoteOf(item);
    const named = alignment ? `${base} (${alignment})` : base;
    return sideLabel ? `${named} (${sideLabel})` : named;
  };
  const rowLines = (row) => estimateNameLines(rowName(row));
  // ใบส่งของไม่มี QR แต่มีแถววิธีจ่ายเงินกับบรรทัดต้นฉบับ/สำเนาใต้ชื่อใบ แผ่นสุดท้ายจึงรับได้จำกัดเหมือนกัน
  const showPaymentQr = hasPaymentQr(repair);
  const lastPageLimit = showPaymentQr
    ? QR_PAGE_LINES
    : isCreditDocument(repair)
      ? // บรรทัดธนาคารมีสองบรรทัด แผ่นสุดท้ายจึงรับรายการได้น้อยลงหนึ่ง
        DELIVERY_PAGE_LINES -
        (showsPaymentBoxes(repair) ? bankRows([0, 1, 2, 3]).length : 0) +
        1
      : null;
  const pages = lastPageLimit
    ? makeRoomForQr(
        paginateRows(rows, rowLines),
        rowLines,
        receiptSummaryOf(repair, discountTotal ? discountItems : []).lines,
        lastPageLimit,
      )
    : paginateRows(rows, rowLines);
  return { pages, discountItems, discountTotal, rowName, rowLines };
};

// ใบเสร็จที่รับเงินแล้วลงวันที่รับเงิน ใบส่งของและใบเสร็จที่ซ่อมเสร็จแต่ยังไม่จ่ายลงวันที่ซ่อมเสร็จ ใบอื่นลงวันเปิดบิล (ต้องตรงกับ receiptDateOf ฝั่งหน้าเว็บ)
const receiptDateOf = (repair) => {
  if (repair.status === "PAID" && repair.paidAt) return repair.paidAt;
  if (
    (repair.status === "CREDIT" || repair.status === "COMPLETED") &&
    repair.completedAt
  ) {
    return repair.completedAt;
  }
  return repair.createdAt;
};

const receiptPagesHtml = (
  repair,
  { showCustomer = true, showBrand = true, copyLabel = null } = {},
) => {
  const docTitle = receiptDocTitle(repair);
  const issuedAt = new Date(receiptDateOf(repair) || Date.now());
  const day = issuedAt.getDate();
  const month = issuedAt.toLocaleDateString("th-TH", { month: "long" });
  const year = String(issuedAt.getFullYear() + 543);

  const plate = repair.vehicle?.licensePlate;
  const plateText = plate?.plateNumber
    ? `${formatPlate(plate.plateNumber)} ${shortProvince(plate.province)}`.trim()
    : "";
  const model = repair.vehicle?.vehicleModel;
  const vehicleName = displayBrand(model);
  // ต้องตรงกับ ReceiptPaper ฝั่งหน้าเว็บ
  const fleetHtml = repair.vehicle?.fleetNo
    ? `<span style="white-space:nowrap">เบอร์รถ</span><span class="dotted fleet">${escapeHtml(repair.vehicle.fleetNo)}</span>`
    : "";

  const { pages, discountItems, rowName, rowLines } = receiptPages(repair, {
    showBrand,
  });
  const summary = receiptSummaryOf(repair, discountItems);
  const summaryRows = summary.lines;
  // QR มีเฉพาะใบเสร็จ ใบเสนอราคายังไม่ถึงตอนจ่าย ใบส่งของลูกค้าจ่ายทีหลังตามใบวางบิล
  const showPaymentQr = hasPaymentQr(repair);
  // ต้องตรงกับ ReceiptPaper ฝั่งหน้าเว็บ
  const signLabels =
    repair.status === "CREDIT"
      ? ["ผู้รับของ", "ผู้ส่งของ"]
      : repair.status === "ESTIMATE"
        ? ["ผู้อนุมัติ", "ผู้เสนอราคา"]
        : ["ผู้จ่ายเงิน", "ผู้รับเงิน"];

  const rowHtml = ({
    item,
    quantity,
    sideLabel,
    note,
    noteRef,
    amount: noteAmount,
  }) => {
    if (note)
      return `<tr>
        <td class="c"></td>
        <td class="wrap">${escapeHtml(note)} <span style="white-space:nowrap">${escapeHtml(noteRef)}</span></td>
        <td class="r"></td>
        <td class="r">${formatAmount(noteAmount)}</td>
      </tr>`;
    const amount = Number(item.unitPrice) * quantity;
    const name = rowName({ item, sideLabel });
    return `<tr>
        <td class="c">${escapeHtml(quantityLabel(item, quantity))}</td>
        <td class="wrap">${escapeHtml(name)}</td>
        <td class="r">${formatAmount(item.unitPrice)}</td>
        <td class="r">${formatAmount(amount)}</td>
      </tr>`;
  };

  const summaryRowHtml = (row) => `<tr>
        <td colspan="2" class="blank"></td>
        <td class="c">${escapeHtml(row.label)}</td>
        <td class="r"${row.bold ? ' style="font-weight:600"' : ""}>${formatMoney(row.amount)}</td>
      </tr>`;
  const summaryHtml = `${summary.above.map(summaryRowHtml).join("")}
      <tr class="sum">
        <td colspan="2">จำนวนเงินรวมทั้งสิ้น <span class="sum-text">${escapeHtml(bahtText(summary.sum.amount))}</span></td>
        <td class="c">${summary.sum.label}</td>
        <td class="r" style="font-weight:600;font-size:13pt">${formatMoney(summary.sum.amount)}</td>
      </tr>${summary.below.map(summaryRowHtml).join("")}`;

  // ปิดข้อมูลลูกค้า = เว้นช่องไว้ ไม่เอาบรรทัดออก (ต้องตรงกับ ReceiptPaper ฝั่งหน้าเว็บ)
  const phone = showCustomer ? formatPhone(repair.customer?.phoneNumber) : "";
  const customerFields = `<p>ชื่อลูกค้า<span class="dotted v cut">${
    showCustomer ? escapeHtml(repair.customer?.name || "") : ""
  }</span></p>
    <p>ที่อยู่<span class="dotted v">${
      showCustomer ? escapeHtml(repair.customer?.address || "") : ""
    }</span></p>
    <p class="halves"><span class="half">เลขประจำตัวผู้เสียภาษีอากร<span class="dotted v">${
      showCustomer ? escapeHtml(repair.customer?.taxId || "") : ""
    }</span></span><span class="half">เบอร์โทรศัพท์<span class="dotted v">${escapeHtml(phone)}</span></span></p>`;

  const pageHtml = (pageRows, pageIndex) => {
    const isLastPage = pageIndex === pages.length - 1;
    const usedLines = pageRows.reduce((sum, row) => sum + rowLines(row), 0);
    const blankRows = Math.max(
      0,
      MIN_ROWS - usedLines - (isLastPage ? summaryRows : 0),
    );
    const emptyRows = Array.from({ length: blankRows })
      .map(() => "<tr><td></td><td></td><td></td><td></td></tr>")
      .join("");
    // บิลหลายแผ่นเขียนเลขต่อเนื่องแบบ RE-6909-0001/1 RE-6909-0001/2 ตามแบบเอกสารต่อเนื่องของไทย
    const docNo = receiptDocNo(repair);
    const receiptNo = pages.length > 1 ? `${docNo}/${pageIndex + 1}` : docNo;

    return `<div class="receipt-paper receipt-fill"><div class="page-body">
  <div class="head">
    <span></span>
    <div class="title">
      <div class="doc">${docTitle}${repair.isCancelled ? " (ยกเลิก)" : ""}</div>
      ${copyLabel ? `<div class="copy">(${copyLabel})</div>` : ""}
      <div class="shop">${SHOP.name}</div>
    </div>
    <p class="side">เลขที่<span class="dotted" style="min-width:42px;text-align:center;font-weight:600">${receiptNo}</span></p>
  </div>

  <p class="center" style="margin:2px 0 0">${SHOP.address}</p>
  <p class="center" style="margin:0">${SHOP.contact}</p>

  <div class="date-row">
    <p style="margin:0;display:flex;align-items:flex-end;gap:4px">วันที่<span class="dotted v">${day}</span></p>
    <p style="margin:0;display:flex;align-items:flex-end;gap:4px">เดือน<span class="dotted v" style="min-width:92px">${escapeHtml(month)}</span></p>
    <p style="margin:0;display:flex;align-items:flex-end;gap:4px">พ.ศ.<span class="dotted v">${year}</span></p>
  </div>

  <div class="fields">
${customerFields}
    <p class="pair">ยี่ห้อ-รุ่นรถ<span class="dotted v cut">${escapeHtml(vehicleName)}</span>ทะเบียนรถ<span class="car-right"><span class="dotted v">${escapeHtml(plateText)}</span>${fleetHtml}</span></p>
  </div>

  <table>
    <thead>
      <tr>
        <th class="qty">จำนวน</th>
        <th>รายการ</th>
        <th class="unit">ราคาต่อหน่วย</th>
        <th class="amount">จำนวนเงิน</th>
      </tr>
    </thead>
    <tbody>
      ${pageRows.map(rowHtml).join("")}
      ${emptyRows}
      ${isLastPage ? summaryHtml : ""}
    </tbody>
  </table>

  ${paymentHtml}

  <div class="sign">
    <p>ลงชื่อ<span class="dotted" style="flex:1"></span>${signLabels[0]}</p>
    <p>ลงชื่อ<span class="dotted" style="flex:1"></span>${signLabels[1]}</p>
  </div>

  </div>
  ${isLastPage && showPaymentQr ? paymentQrHtml : ""}
</div>`;
  };

  // ช่องวิธีจ่ายมีเฉพาะใบส่งของ (ต้องตรงกับ ReceiptPaper ฝั่งหน้าเว็บ)
  const paymentBoxes = PAYMENT_BOXES.map(
    (box) =>
      `<span class="pay"><span class="box">${
        box.method && repair.paymentMethod === box.method ? "✓" : ""
      }</span>${box.label}</span>`,
  ).join("");
  // มีเฉพาะจ่ายด้วยเช็ค จำนวนเงินเท่ายอดบิล (ตรงกับ paymentLineFields ฝั่งหน้าเว็บ)
  const isCheque = repair.paymentMethod === "CHEQUE";
  const bankFields = [
    ["ธนาคาร", repair.chequeBank],
    ["เลขที่", repair.chequeNo],
    [
      "ลงวันที่",
      repair.chequeDate &&
        new Date(repair.chequeDate).toLocaleDateString("th-TH", {
          day: "numeric",
          month: "long",
          year: "numeric",
        }),
    ],
    // หน่วยอยู่หลังเส้นประชิดขวาเสมอ (ตรงกับ suffix ใน paymentLineFields)
    ["จำนวนเงิน", formatMoney(repair.totalPrice), "บาท"],
  ]
    .map(([label, value, suffix]) => [label, isCheque ? value : "", suffix])
    .map(
      ([label, value, suffix]) =>
        `<span class="bank-field">${label}<span class="dotted">${escapeHtml(value || "")}</span>${suffix || ""}</span>`,
    );
  const bankHtml = bankRows(bankFields)
    .map(
      (row) =>
        `<div class="bank bank-grid">\n    ${row.join("\n    ")}\n  </div>`,
    )
    .join("\n  ");
  const paymentHtml = showsPaymentBoxes(repair)
    ? `<div class="pays">${paymentBoxes}</div>

  ${bankHtml}`
    : "";

  const paymentQrHtml = PAYMENT_QR_HTML;

  // คืนเฉพาะแผ่นกระดาษ เพื่อให้เอาไปต่อกับใบอื่นในเอกสารเดียวได้
  return pages.map(pageHtml).join("");
};

const RECEIPT_STYLES = `
  ${FONT_FACES}
  @page { size: A5 portrait; margin: 0; }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    color: #000;
    background: #fff;
    font-family: "Athiti", "Sarabun", "Tahoma", sans-serif;
    font-size: 11pt;
    line-height: 1.25;
  }
  /* บิลยาวเกินหนึ่งหน้าถูกแยกเป็นหลายแผ่น แต่ละแผ่นเป็นกระดาษ A5 ของตัวเอง */
  .receipt-paper {
    width: 148mm;
    height: 210mm;
    padding: 10mm;
    overflow: hidden;
    break-after: page;
  }
  .receipt-paper:last-of-type { break-after: auto; }
  /* สามช่องกว้างเท่ากันซ้ายขวา ช่องซ้ายเว้นว่าง ชื่อเอกสารจึงอยู่กลางแผ่นเสมอ ไม่ถูกเลขที่ทางขวาดันเยื้อง */
  .head { display: grid; grid-template-columns: 1fr auto 1fr; align-items: start; gap: 8px; }
  .head .side { white-space: nowrap; display: flex; align-items: flex-end; gap: 4px; }
  .head .side:last-child { justify-content: flex-end; }
  .dotted { border-bottom: 1px dotted #000; }
  .title { text-align: center; }
  .title .doc { font-size: 15pt; font-weight: 600; }
  .title .copy { font-size: 11pt; }
  .title .shop { font-size: 17pt; font-weight: 600; }
  .center { text-align: center; }
  .date-row { display: flex; justify-content: flex-end; gap: 12px; margin-top: 8px; }
  .date-row span.v { min-width: 52px; text-align: center; font-weight: 600; }
  .fields { margin-top: 6px; }
  .fields p { display: flex; align-items: flex-end; gap: 6px; margin: 0 0 5px; }
  .fields .v { flex: 1; text-align: center; font-weight: 600; }
  /* แถวรถต้องอยู่บรรทัดเดียว ไม่งั้นแผ่นสูงเกินที่คิดไว้ตอนแบ่งแผ่น ทะเบียนห้ามตัด ยี่ห้อ-รุ่นยอมหดแล้วต่อท้ายด้วย … */
  /* แถวชื่อลูกค้ากับแถวรถแบ่งครึ่งซ้ายขวาเท่ากัน ช่องกรอกของสองแถวตรงกันเป็นคอลัมน์ อ่านง่าย
     ป้ายกว้างเท่าป้ายที่ยาวที่สุดของคอลัมน์ (ยี่ห้อ-รุ่นรถ / เบอร์โทรศัพท์) ต้องตรงกับ ReceiptPaper ฝั่งหน้าเว็บ
     ฝั่งซ้ายกว้างกว่าเล็กน้อยให้ชื่อหน่วยงานเต็มอย่าง "องค์การบริหารส่วนตำบลน้ำอ้อม" ไม่ถูกตัด
     ฝั่งซ้ายยาวเกินยอมตัดเป็น … ฝั่งขวา (ทะเบียน เบอร์รถ) ห้ามตัด ถ้าไม่พอจะเบียดฝั่งซ้ายแทน */
  /* แถวเลขผู้เสียภาษี/เบอร์โทรใช้คอลัมน์ชุดเดียวกับแถวรถ เบอร์โทรจึงตรงกับทะเบียนรถพอดี
     เลขผู้เสียภาษีกินสองคอลัมน์แรก (ป้ายยาว) ฝั่งซ้ายจึงต้องกว้างพอใส่ป้ายกับเลข 13 หลัก */
  .fields p.halves { display: grid; grid-template-columns: 60px minmax(0, 1.7fr) 74px 1fr; gap: 6px; white-space: nowrap; }
  .fields p.halves .half:first-child { grid-column: span 2; }
  .fields p.halves .half:last-child { display: contents; }
  .fields .half { display: flex; align-items: flex-end; gap: 6px; }
  .fields .half .v { padding: 0 4px; }
  .fields p.pair { display: grid; grid-template-columns: 60px minmax(0, 1.7fr) 74px 1fr; white-space: nowrap; }
  .fields .cut { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .fields .car-right { display: flex; align-items: flex-end; gap: 6px; white-space: nowrap; }
  .fields .car-right .v { white-space: nowrap; }
  .fields .fleet { flex: none; padding: 0 2px; text-align: center; font-weight: 600; white-space: nowrap; }
  table { width: 100%; border-collapse: collapse; table-layout: fixed; margin-top: 8px; font-size: inherit; }
  thead tr, tr.sum { background: #e5e7eb; }
  th, td { border: 1px solid #000; padding: 2px 4px; height: 22px; }
  th { font-weight: 600; text-align: center; }
  /* กว้างพอให้ "10 แกลลอน" อยู่บรรทัดเดียว (ตรงกับหัวตารางใน ReceiptPaper) */
  th.qty, td.qty { width: 76px; }
  th.unit, td.unit { width: 92px; white-space: nowrap; }
  th.amount, td.amount { width: 92px; }
  td.c { text-align: center; }
  td.r { text-align: right; }
  td.wrap { word-break: break-word; }
  /* ฝั่งซ้ายของแถวยอดรวมกับส่วนลดปล่อยโล่ง ไม่ต้องตีเส้นเป็นช่องเปล่า */
  td.blank { border: none; }
  .sum-text { font-weight: 600; }
  .pays { display: flex; align-items: center; gap: 20px; margin-top: 8px; }
  .pay { display: flex; align-items: center; gap: 6px; }
  .box { width: 13px; height: 13px; border: 1px solid #000; display: inline-flex; align-items: center; justify-content: center; font-size: 8pt; line-height: 1; }
  .bank { align-items: flex-end; gap: 8px; margin-top: 6px; }
  .bank-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .bank-field { display: flex; align-items: flex-end; gap: 4px; min-width: 0; white-space: nowrap; }
  .bank-field .dotted { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; text-align: center; font-weight: 600; }
  /* กลุ่ม QR เริ่มใต้ช่องลงชื่อ 8 จุด แล้วขยายเต็มที่ว่างที่เหลือจนถึงขอบล่าง บิลสั้นได้ QR ใหญ่ บิลแน่นได้เล็กลง
     แสดงครบชุดเสมอ (โลโก้ QR ชื่อร้าน บรรทัดสแกน) แผ่นสุดท้ายรับรายการได้ตาม QR_PAGE_LINES ให้ QR ได้ขนาด QR_SIZE เต็มเสมอ
     (บิล 10 รายการไม่มีส่วนลดยังจบในแผ่นเดียว)
     ขนาดคิดจากความสูงที่เหลือจริง (cqh): โลโก้สูง 0.2345 เท่าของ QR บวกระยะใต้โลโก้ ชื่อร้าน บรรทัดสแกน รวม 43px
     ต้องตรงกับ .receipt-qr ใน client/src/index.css */
  /* ขอบล่างแคบกว่าด้านอื่น เอาที่ให้ QR เครื่องพิมพ์ส่วนใหญ่พิมพ์ได้ถึง 4 มม. จากขอบ (ต้องตรงกับ pb-[4mm] ฝั่งหน้าเว็บ) */
  .receipt-fill { display: flex; flex-direction: column; padding-bottom: 4mm; }
  .receipt-fill .page-body { flex: none; }
  .qr-area { flex: 1 1 0; min-height: 0; padding-top: 8px; container-type: size; display: flex; justify-content: center; align-items: flex-start; }
  .qr { --q: min(calc((100cqh - 44px) / 1.2345), ${QR_SIZE}); display: flex; flex-direction: column; align-items: center; white-space: nowrap; line-height: 1.25; }
  .qr .pp { display: block; width: calc(var(--q) * 0.7); height: auto; margin-bottom: 4px; }
  .qr .code { display: block; width: var(--q); height: var(--q); }
  .qr .name { margin: 2px 0 0; font-size: 11pt; font-weight: 600; }
  .qr .hint { margin: 0; font-size: 11pt; }
  .sign { display: flex; gap: 16px; margin-top: 22px; }
  td.one-line { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  /* ใบวางบิล: ทะเบียนกับเบอร์รถ / ยี่ห้อรุ่น สองบรรทัดทุกแถว (ตรงกับ CreditSummaryPaper) */
  td.two-line div { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .sign p { display: flex; align-items: flex-end; gap: 4px; flex: 1; margin: 0; }
`;

const receiptDocument = (title, body) => `<!doctype html>
<html lang="th">
<head>
<meta charset="utf-8" />
<title>${title}</title>
<style>
${RECEIPT_STYLES}
</style>
</head>
<body>
${body}
</body>
</html>`;

// ใบส่งของเลือกพิมพ์ต้นฉบับ สำเนา หรือทั้งคู่ (ต้องตรงกับ COPY_CHOICES ใน client/src/utils/receipt.js)
const COPY_CHOICES = {
  both: ["ต้นฉบับ", "สำเนา"],
  original: ["ต้นฉบับ"],
  copy: ["สำเนา"],
};

// บิลเครดิตที่จ่ายแล้วพิมพ์ใบส่งของซ้ำได้ ช่องวิธีจ่ายว่างเหมือนตอนออกใบส่งของ (ต้องตรงกับ asDeliveryNote ฝั่งหน้าเว็บ)
const asDeliveryNote = (repair) =>
  repair.status === "PAID" && repair.deliveryNo
    ? {
        ...repair,
        status: "CREDIT",
        paymentMethod: null,
        chequeBank: null,
        chequeNo: null,
        chequeDate: null,
      }
    : repair;

const buildReceiptHtml = (
  rawRepair,
  { copyChoice, asDelivery = false, asDeposit = false, ...options } = {},
) => {
  const issued = asIssued(rawRepair);
  const repair = asDelivery
    ? asDeliveryNote(issued)
    : asDeposit && issued.depositAmount
      ? asDepositReceipt(issued)
      : issued;
  return receiptDocument(
    `${receiptDocTitle(repair)} ${receiptDocNo(repair)}`,
    repair.status === "CREDIT"
      ? (COPY_CHOICES[copyChoice] || COPY_CHOICES.both)
          .map((copyLabel) =>
            receiptPagesHtml(repair, { ...options, copyLabel }),
          )
          .join("")
      : receiptPagesHtml(repair, options),
  );
};

// ต้องตรงกับ workName ใน JobSheetPaper และ VEHICLE_COMPATIBLE_CATEGORIES ฝั่งหน้าเว็บ
const VEHICLE_COMPATIBLE_CATEGORIES = [
  "ช่วงล่าง",
  "เบรก",
  "โช้คอัพ",
  "ระบบส่งกำลัง",
  "กรอง",
  "ไส้กรอง",
];

// ใบที่ปิดชื่อเต็มแล้ว หมวดเหล่านี้ยังต้องมียี่ห้อ (ตรงกับ FULL_NAME_CATEGORIES ฝั่งหน้าเว็บ)
const FULL_NAME_CATEGORIES = ["ยาง", "ยางเปอร์เซ็นต์", "แบตเตอรี่"];

// ต้องประกอบแบบเดียวกับ oilUseLineName ใน client/src/utils/oil.js
const OIL_USES = ["น้ำมันเครื่อง", "น้ำมันเกียร์", "น้ำมันเฟืองท้าย", "น้ำมันพาวเวอร์"];
const isOilUseLine = (item) => {
  if (!item.part) return false;
  const grade = String(item.part.name || "").replace(
    /^น้ำมัน(เครื่อง|เกียร์|เฟืองท้าย|พาวเวอร์)\s*/,
    "",
  );
  return OIL_USES.some(
    (use) =>
      item.itemName === [item.part.brand, use, grade].filter(Boolean).join(" "),
  );
};

// ต้องตรงกับ shortWorkName ฝั่งหน้าเว็บ ใบสั่งซ่อมใช้ workName ตรงๆ ช่างยังต้องรู้ชนิดจุ๊บ
const INNER_TUBE_CATEGORY = "ยางใน";
// ใบเสร็จเขียนแค่คำแรกของชื่อในคลัง ยกเว้นหมวดที่คำแรกไม่ได้บอกว่าเป็นของอะไร (ตรงกับ shortWorkName)
const KEEP_NAME_CATEGORIES = [
  ...FULL_NAME_CATEGORIES,
  "น้ำมัน",
  INNER_TUBE_CATEGORY,
  "ใบปัดน้ำฝน",
];
const receiptWorkName = (item) => {
  const isTypedName = !String(item.itemName || "").includes(
    item.part?.name || "",
  );
  if (
    item.part?.name &&
    !isTypedName &&
    !KEEP_NAME_CATEGORIES.includes(item.part.category?.name)
  ) {
    return String(item.part.name).trim().split(/\s+/)[0];
  }

  const name = workName(item);
  return item.part?.category?.name === INNER_TUBE_CATEGORY && !isTypedName
    ? String(name || "")
        .replace(/\s*\([^)]*\)/g, "")
        .trim()
    : name;
};

const workName = (item) => {
  if (
    item.part?.name &&
    !String(item.itemName || "").includes(item.part.name) &&
    !isOilUseLine(item)
  ) {
    return item.itemName;
  }
  // บริการที่พิมพ์ชื่อทับขึ้นตามที่พิมพ์ ไม่ย่อแบบชื่อน้ำมัน (ต้องตรงกับ shortWorkNameBase ฝั่งหน้าเว็บ)
  if (
    !item.part &&
    item.service?.name &&
    item.itemName &&
    item.itemName !== item.service.name
  ) {
    return item.itemName;
  }

  // ชื่อในคลังของหมวดพวกนี้เป็น "ยี่ห้อ ชนิด รุ่นรถ" ตัดเหลือคำแรกซึ่งเป็นชนิดอะไหล่
  if (
    VEHICLE_COMPATIBLE_CATEGORIES.includes(item.part?.category?.name) &&
    item.part?.name
  ) {
    return String(item.part.name).trim().split(/\s+/)[0];
  }

  const name = String(item.itemName || "");
  if (name.includes("น้ำมัน")) {
    const thai = name.match(/[ก-๙][ก-๙+\s-]*[ก-๙]/);
    if (thai) {
      const base = thai[0].trim();
      const size = name.match(/\(\s*(\d+(?:\.\d+)?)\s*L\s*\)/i);
      if (base) return size ? `(${Number(size[1])}L) ${base}` : base;
    }
  }

  // ยางกับแบตเตอรี่เขียนเต็มเสมอ เพราะรับประกันผูกกับยี่ห้อ
  const brand = String(item.part?.brand || "").trim();
  if (
    brand &&
    !FULL_NAME_CATEGORIES.includes(item.part?.category?.name) &&
    name.startsWith(`${brand} `)
  ) {
    return name.slice(brand.length + 1).trim();
  }

  return item.itemName;
};

// ตรงกับ client/src/components/receipt/JobSheetPaper.jsx แก้ต้องแก้คู่กัน
// ใบสั่งซ่อมแบ่งแผ่นตามความสูงโดยประมาณ ชื่อยาวขึ้นหลายบรรทัด แถวจึงสูงไม่เท่ากัน
// ทุกแผ่นมีหัวใบกับทะเบียน รายละเอียดการซ่อมอยู่แผ่นแรก แถวเพิ่มเติมอยู่แผ่นสุดท้าย
// ค่าเป็นพิกเซลของกระดาษ A5 ตัวอักษร 12pt เผื่อไว้เล็กน้อย (ต้องตรงกับ jobSheetPages ฝั่งหน้าเว็บ)
const JOB = {
  // วัดจากกระดาษจริง ความกว้างชื่อหักที่เสียไปตอนตัดคำขึ้นบรรทัดใหม่แล้ว
  page: 714,
  head: 112,
  noteBase: 51,
  noteLine: 28,
  // ข้อความรายละเอียดตัว 16pt ใช้ที่มากกว่าตัว 12pt ราวหนึ่งในสาม
  noteWidth: 340,
  gap: 10,
  sideHead: 34,
  listHead: 34,
  fullName: 350,
  halfName: 150,
  blankRows: 2,
};
const jobCharWidth = (ch) => {
  if (THAI_COMBINING.test(ch)) return 0;
  if (/[\u0E00-\u0E7F]/.test(ch)) return 10;
  if (/[A-Z]/.test(ch)) return 9.5;
  if (/[a-z]/.test(ch)) return 8;
  if (/[0-9]/.test(ch)) return 9;
  if (ch === " ") return 4.5;
  return 7.5;
};
const jobLines = (text, width) =>
  String(text || "")
    .split("\n")
    .reduce(
      (sum, line) =>
        sum +
        Math.max(
          1,
          Math.ceil(
            [...line].reduce((w, ch) => w + jobCharWidth(ch), 0) / width,
          ),
        ),
      0,
    );
const jobRowHeight = (lines) => Math.max(34, 11 + lines * 20);

const jobSheetPages = (repair, nameOf) => {
  const allItems = (repair.repairItems || []).filter((item) => {
    const name = item.service?.name || item.itemName;
    // ตั้งศูนย์ที่ค้างไว้ยังไม่ได้ทำวันนี้ ช่างไม่ต้องเห็น
    return (
      name !== "ค่าแรง" &&
      name !== "ส่วนลด" &&
      item.itemName !== "ค่าแรง" &&
      !item.alignmentDeferred
    );
  });
  const hasSides = allItems.some(
    (item) => item.side === "LEFT" || item.side === "RIGHT",
  );
  // เรียงแบบใบเสร็จและหน้ารายละเอียด: ของที่ใส่ทั้งสองข้างก่อน ตามด้วยข้างเดียว แล้วงานอื่นๆ
  // ของชิ้นเดียวกันสองข้างอยู่แถวเดียวกัน ที่เหลือของแต่ละข้างเรียงต่อกันในคอลัมน์ของตัวเอง
  const ordered = receiptOrder(repair, allItems);
  const keyOf = ({ item }) => `${item.itemName}|${item.unitPrice}`;
  // อยู่ในคอลัมน์ของข้างนั้นแล้ว ชื่อไม่ต้องมี (L) (R) ต่อท้าย
  const sideRows = (side) =>
    hasSides
      ? mergeBySide(ordered.filter((item) => item.side === side)).map(
          (row) => ({ ...row, sideLabel: "" }),
        )
      : [];
  const left = sideRows("LEFT");
  const right = sideRows("RIGHT");
  const rightKeys = new Set(right.map(keyOf));
  const leftKeys = new Set(left.map(keyOf));
  const leftOnly = left.filter((row) => !rightKeys.has(keyOf(row)));
  const rightOnly = right.filter((row) => !leftKeys.has(keyOf(row)));
  const pairs = [
    ...left
      .filter((row) => rightKeys.has(keyOf(row)))
      .map((row) => [row, right.find((other) => keyOf(other) === keyOf(row))]),
    ...Array.from({ length: Math.max(leftOnly.length, rightOnly.length) }).map(
      (_, i) => [leftOnly[i] || null, rightOnly[i] || null],
    ),
  ];
  const others = mergeBySide(
    hasSides
      ? ordered.filter((i) => i.side !== "LEFT" && i.side !== "RIGHT")
      : ordered,
  );

  const pages = [];
  let page;
  let used = 0;
  const newPage = () => {
    page = { sides: [], others: [], extra: false };
    pages.push(page);
    used =
      JOB.head +
      (pages.length === 1 && repair.description
        ? JOB.noteBase +
          JOB.noteLine * jobLines(repair.description, JOB.noteWidth)
        : 0);
  };
  // ไม่พอที่ก็ขึ้นแผ่นใหม่ ยกเว้นแผ่นนี้ยังไม่มีรายการเลย ขึ้นใหม่ก็ไม่ช่วย
  const place = (costOn, add) => {
    if (
      used + costOn(page) > JOB.page &&
      (page.sides.length || page.others.length)
    ) {
      newPage();
    }
    used += costOn(page);
    add(page);
  };
  newPage();

  for (const pair of pairs) {
    const lines = Math.max(
      ...pair.map((row) => (row ? jobLines(nameOf(row), JOB.halfName) : 1)),
    );
    place(
      (p) =>
        (p.sides.length ? 0 : JOB.gap + JOB.sideHead) + jobRowHeight(lines),
      (p) => p.sides.push(pair),
    );
  }
  for (const row of others) {
    place(
      (p) =>
        (p.others.length ? 0 : JOB.gap + JOB.listHead) +
        jobRowHeight(jobLines(nameOf(row), JOB.fullName)),
      (p) => p.others.push(row),
    );
  }
  // แถวเพิ่มเติมไม่พอที่ในแผ่นสุดท้าย ก็ไม่ต้องมี ไม่ขึ้นแผ่นใหม่ที่มีแค่แถวว่าง
  const extraCost =
    (page.others.length ? JOB.listHead : JOB.gap + JOB.listHead) +
    JOB.blankRows * jobRowHeight(1);
  if (used + extraCost <= JOB.page) page.extra = true;

  return { pages, hasSides };
};

const buildJobSheetHtml = (repair) => {
  const plate = repair.vehicle?.licensePlate;
  const plateText = plate?.plateNumber
    ? `${formatPlate(plate.plateNumber)} ${shortProvince(plate.province)}`.trim()
    : "";
  const model = repair.vehicle?.vehicleModel;
  const vehicleName = displayBrand(model);
  const nameOf = ({ item, sideLabel }) => {
    const base = workName(item);
    return sideLabel ? `${base} (${sideLabel})` : base;
  };
  const { pages, hasSides } = jobSheetPages(repair, nameOf);

  // งานที่ไม่มีหน่วยและทำครั้งเดียว เช่น ตั้งศูนย์ ไม่ต้องบอกจำนวน (ต้องตรงกับ jobQuantity ฝั่งหน้าเว็บ)
  const jobQuantity = (item, quantity) =>
    !unitOf(item) && Number(quantity) === 1
      ? ""
      : `${formatQuantity(quantity)} ${unitOf(item)}`.trim();

  const workRow = (row) => `<tr>
        <td class="wrap">${escapeHtml(nameOf(row))}</td>
        <td class="qty">${escapeHtml(jobQuantity(row.item, row.quantity))}</td>
      </tr>`;

  // หัวข้อเพิ่มเติมเป็นแถวหัวตารางอีกแถว มีช่องจำนวนเหมือนหัวข้ออื่นๆ
  const headRow = (label) =>
    `<tr class="head-row"><th class="name">${label}</th><th class="qty">จำนวน</th></tr>`;

  const noteBlock = repair.description
    ? `<div class="note">
    <p class="note-label">รายละเอียดการซ่อม</p>
    <p class="note-text">${escapeHtml(repair.description)}</p>
  </div>`
    : "";

  // บิลแยกข้าง: ข้างซ้ายอยู่ครึ่งซ้ายของกระดาษ ข้างขวาครึ่งขวา ตรงกับตัวรถ ไม่ต้องพึ่งแถบเทาซึ่งพิมพ์ขาวดำแล้วจาง
  // ข้างที่รายการน้อยกว่าเติมแถวว่างให้ยาวเท่ากัน ไว้จดงานที่เจอเพิ่มของข้างนั้น (ต้องตรงกับ JobSheetPaper)
  const halfCells = (row, isRight) => {
    const edge = isRight ? ' class="split"' : "";
    if (!row) return `<td${edge}></td><td></td>`;
    return `<td class="wrap${isRight ? " split" : ""}">${escapeHtml(nameOf(row))}</td>
        <td class="c">${escapeHtml(jobQuantity(row.item, row.quantity))}</td>`;
  };
  const sideTable = (pairs) =>
    pairs.length
      ? `<table class="sides">
    <colgroup><col /><col class="half-qty" /><col /><col class="half-qty" /></colgroup>
    <thead>
      <tr><th colspan="2" class="side">ข้างซ้าย (L)</th><th colspan="2" class="side split">ข้างขวา (R)</th></tr>
    </thead>
    <tbody>
      ${pairs.map(([l, r]) => `<tr>${halfCells(l, false)}${halfCells(r, true)}</tr>`).join("")}
    </tbody>
  </table>`
      : "";

  // ตารางเต็มกว้าง: งานที่ไม่แยกข้าง แผ่นสุดท้ายตามด้วยแถวว่างไว้เขียนงานเพิ่มเติม
  const emptyRows = Array.from({ length: JOB.blankRows })
    .map(() => "<tr><td></td><td></td></tr>")
    .join("");
  const listTable = (page) => {
    if (!page.others.length && !page.extra) return "";
    const heading = page.others.length
      ? hasSides
        ? "อื่นๆ"
        : "รายการ"
      : "เพิ่มเติม";
    const extraRows = page.extra
      ? `${page.others.length ? headRow("เพิ่มเติม") : ""}${emptyRows}`
      : "";
    return `<table>
    <thead>
      <tr><th class="name">${heading}</th><th class="qty">จำนวน</th></tr>
    </thead>
    <tbody>
      ${page.others.map(workRow).join("")}${extraRows}
    </tbody>
  </table>`;
  };

  // หลายแผ่นเขียนเลขต่อเนื่องแบบใบเสร็จ JO-6910-0001/1 JO-6910-0001/2
  const docNo = jobSheetNo(repair);
  const pageHtml = (page, index) => `<div class="receipt-paper">
  <div class="head">
    <p class="doc">ใบสั่งซ่อม</p>
    <p class="no">เลขที่<span class="dotted" style="min-width:42px;text-align:center;font-weight:600">${
      pages.length > 1 ? `${docNo}/${index + 1}` : docNo
    }</span></p>
  </div>

  <div class="car">
    <div class="plate">${escapeHtml(plateText || "ไม่ระบุทะเบียนรถ")}${
      repair.vehicle?.fleetNo
        ? `<span style="margin-left:8px;font-size:16pt">เบอร์รถ ${escapeHtml(repair.vehicle.fleetNo)}</span>`
        : ""
    }</div>
    <div class="model">${escapeHtml(vehicleName)}</div>
  </div>

  ${index === 0 ? noteBlock : ""}

  ${sideTable(page.sides)}

  ${listTable(page)}
</div>`;

  return `<!doctype html>
<html lang="th">
<head>
<meta charset="utf-8" />
<title>ใบสั่งซ่อม ${jobSheetNo(repair)}</title>
<style>
  ${FONT_FACES}
  @page { size: A5 portrait; margin: 0; }
  * { box-sizing: border-box; }
  body {
    margin: 0; color: #000; background: #fff;
    font-family: "Athiti", "Sarabun", "Tahoma", sans-serif;
    font-size: 11pt; line-height: 1.25;
  }
  /* แต่ละแผ่นเป็นกระดาษ A5 ของตัวเอง */
  .receipt-paper { width: 148mm; height: 210mm; padding: 10mm; overflow: hidden; break-after: page; }
  .receipt-paper:last-of-type { break-after: auto; }
  /* หัวใบมีเส้นคาดหนาแทนพื้นทึบ ประหยัดหมึกและอ่านง่ายพอกัน */
  .head { display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #000; padding-bottom: 4px; }
  .head .doc { font-size: 17pt; font-weight: 600; line-height: 1; }
  .head .no { font-size: 12pt; line-height: 1; display: flex; align-items: flex-end; gap: 4px; white-space: nowrap; }
  /* เส้นประใต้เลขที่ ให้หน้าตาเข้าชุดกับใบเสร็จ */
  .head .no .dotted { border-bottom: 1px dotted #000; }
  /* ทะเบียนคือสิ่งที่ช่างใช้จับคู่ใบกับรถ จึงตัวใหญ่ที่สุดบนใบ */
  .car { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; white-space: nowrap; margin-top: 10px; }
  .car .plate { font-size: 22pt; font-weight: 600; line-height: 1; }
  .car .model { font-size: 16pt; font-weight: 600; line-height: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; }
  table { width: 100%; border-collapse: collapse; table-layout: fixed; font-size: 12pt; margin-top: 10px; }
  th, td { border: 1px solid #000; padding: 5px 8px; height: 34px; }
  thead tr { background: #e5e7eb; }
  th { font-weight: 600; text-align: center; }
  th.name { text-align: left; }
  th.qty, td.qty { width: 92px; text-align: center; }
  td.c { text-align: center; }
  td.wrap { word-break: break-word; }
  tr.head-row { background: #e5e7eb; }
  /* อาการที่ลูกค้าแจ้ง ช่างต้องอ่านก่อนลงมือ จึงเป็นกล่องเด่นเหนือตาราง (ต้องตรงกับ JobSheetPaper) */
  /* เส้นกับแถบหัวข้อแบบเดียวกับตารางรายการ เด่นด้วยขนาดตัวอักษร */
  .note { margin-top: 10px; border: 1px solid #000; }
  .note-label { margin: 0; background: #e5e7eb; border-bottom: 1px solid #000; padding: 3px 8px; font-size: 16px; font-weight: 600; }
  /* หัวข้อข้างตัวใหญ่ และเส้นกลางหนาแบ่งสองข้าง มองออกแม้พิมพ์ขาวดำ */
  table.sides th.side { font-size: 14pt; padding: 4px 8px; }
  table.sides .split { border-left: 2px solid #000; }
  table.sides col.half-qty { width: 62px; }
  table.sides td { padding: 5px 4px; }
  .note-text { margin: 0; padding: 5px 8px 6px; font-size: 16pt; font-weight: 600; line-height: 1.3; white-space: pre-wrap; word-break: break-word; }
</style>
</head>
<body>
  ${pages.map(pageHtml).join("")}
</body>
</html>`;
};

// ใบวางบิล: ยี่ห้อรุ่น / ทะเบียน (เบอร์รถ) ค่าอะไหล่กับค่าบริการมีบรรทัดเดียว (ต้องตรงกับ billLines ใน CreditSummaryPaper)
const billLines = (repair) => {
  // ใบวางบิลเขียนจากฝั่งคนจ่าย จึงเป็น "ค่า…" ไม่ใช่ชื่อบิลแบบในแอป
  if (repair.type === "SALE") return ["ค่าอะไหล่", ""];
  if (!repair.vehicle) return ["ค่าบริการ", ""];

  const fleet = repair.vehicle.fleetNo
    ? `เบอร์รถ ${repair.vehicle.fleetNo}`
    : "";
  const model = displayBrand(repair.vehicle.vehicleModel) || "งานซ่อม";
  const plate = repair.vehicle.licensePlate;
  if (plate?.plateNumber && plate?.province) {
    const plateText =
      `${formatPlate(plate.plateNumber)} ${shortProvince(plate.province)}`.trim();
    // ในวงเล็บใส่แค่ตัวเลข มีคำว่าเบอร์รถด้วยจะยาวจนเลขถูกตัด
    return [
      model,
      repair.vehicle.fleetNo
        ? `${plateText} (${repair.vehicle.fleetNo})`
        : plateText,
    ];
  }
  return [model, fleet];
};

// ปีสองหลัก (3 พ.ย. 69) ช่องวันที่จะได้แคบ เหลือที่ให้ยี่ห้อรุ่น (ตรงกับ billDate ใน CreditSummaryPaper)
const billDate = (value) =>
  new Date(value).toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
    year: "2-digit",
  });

const buildOrganizationBillHtml = (customer, repairs, billingNo) => {
  // วันที่วางบิลคือวันที่พิมพ์ ต่างจากใบเสร็จที่ใช้วันเปิดบิล
  const billedAt = new Date();
  const total = repairs.reduce(
    (sum, repair) => sum + Number(repair.totalPrice || 0),
    0,
  );
  const pages = billPages(repairs);

  const rowHtml = (repair, index) => `<tr>
        <td class="c">${index + 1}</td>
        <td class="c" style="white-space:nowrap">${escapeHtml(repair.deliveryNo || repair.receiptNo || String(repair.id))}</td>
        <td class="c" style="white-space:nowrap">${escapeHtml(billDate(receiptDateOf(repair)))}</td>
        <td class="two-line">${billLines(repair)
          .filter(Boolean)
          .map((line) => `<div>${escapeHtml(line)}</div>`)
          .join("")}</td>
        <td class="r">${formatMoney(Number(repair.totalPrice || 0))}</td>
      </tr>`;

  let rowNo = 0;
  const pageHtml = (pageRepairs, pageIndex) => {
    const isLastPage = pageIndex === pages.length - 1;
    // หลายแผ่นเขียนเลขต่อเนื่องแบบใบเสร็จ BL-6910-0001/1 BL-6910-0001/2
    const docNo =
      pages.length > 1
        ? `${billingNo || ""}/${pageIndex + 1}`
        : billingNo || "";
    const rows = pageRepairs.map((repair) => rowHtml(repair, rowNo++)).join("");

    // ลูกค้าจ่ายตามใบวางบิล QR จึงอยู่ที่นี่ ไม่ใช่ใบส่งของ
    return `<div class="receipt-paper receipt-fill"><div class="page-body">
  <div class="head">
    <span></span>
    <div class="title">
      <div class="doc">ใบวางบิล</div>
      <div class="shop">${SHOP.name}</div>
    </div>
    <p class="side">เลขที่<span class="dotted" style="min-width:42px;text-align:center;font-weight:600">${escapeHtml(docNo)}</span></p>
  </div>

  <p class="center" style="margin:2px 0 0">${SHOP.address}</p>
  <p class="center" style="margin:0">${SHOP.contact}</p>

  <div class="date-row">
    <p style="margin:0;display:flex;align-items:flex-end;gap:4px">วันที่<span class="dotted v">${billedAt.getDate()}</span></p>
    <p style="margin:0;display:flex;align-items:flex-end;gap:4px">เดือน<span class="dotted v" style="min-width:92px">${escapeHtml(billedAt.toLocaleDateString("th-TH", { month: "long" }))}</span></p>
    <p style="margin:0;display:flex;align-items:flex-end;gap:4px">พ.ศ.<span class="dotted v">${billedAt.getFullYear() + 543}</span></p>
  </div>

  <div class="fields">
    <p>ชื่อลูกค้า<span class="dotted v cut">${escapeHtml(customer?.name || "")}</span></p>
    <p>ที่อยู่<span class="dotted v cut">${escapeHtml(customer?.address || "")}</span></p>
    <p class="halves"><span class="half">เลขประจำตัวผู้เสียภาษีอากร<span class="dotted v">${escapeHtml(customer?.taxId || "")}</span></span><span class="half">เบอร์โทรศัพท์<span class="dotted v">${escapeHtml(formatPhone(customer?.phoneNumber))}</span></span></p>
    <p>วันนัดชำระ<span class="dotted v"></span></p>
  </div>

  <table style="margin-top:8px">
    <thead>
      <tr>
        <th style="width:40px">ลำดับ</th>
        <th style="width:104px">เลขที่ใบส่งของ</th>
        <th style="width:74px">วันที่</th>
        <th>รายละเอียด</th>
        <th style="width:80px">จำนวนเงิน</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
      ${
        isLastPage
          ? `<tr class="sum">
        <td colspan="4">จำนวนเงินรวมทั้งสิ้น <span style="font-weight:600">${escapeHtml(bahtText(total))}</span></td>
        <td class="r" style="font-weight:600;font-size:13pt">${formatMoney(total)}</td>
      </tr>`
          : ""
      }
    </tbody>
  </table>

  ${
    isLastPage
      ? `<div class="sign">
    <p>ลงชื่อ<span class="dotted" style="flex:1"></span>ผู้รับวางบิล</p>
    <p>ลงชื่อ<span class="dotted" style="flex:1"></span>ผู้วางบิล</p>
  </div>`
      : ""
  }

  </div>
  ${isLastPage ? PAYMENT_QR_HTML : ""}
</div>`;
  };

  return receiptDocument(
    `ใบวางบิล ${customer?.name || ""}`.trim(),
    pages.map(pageHtml).join(""),
  );
};

module.exports = {
  buildReceiptHtml,
  buildJobSheetHtml,
  buildOrganizationBillHtml,
  // ใช้ในเทสต์เทียบกับฝั่งหน้าเว็บเท่านั้น
  _test: {
    asIssued,
    receiptSummaryOf,
    asDepositReceipt,
    receiptPages,
    receiptDocNo,
    receiptDocTitle,
    billPages,
    receiptDateOf,
    jobSheetPages: (repair) =>
      jobSheetPages(repair, ({ item, sideLabel }) =>
        sideLabel ? `${workName(item)} (${sideLabel})` : workName(item),
      ),
  },
};
