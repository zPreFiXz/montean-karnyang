// ตรรกะชุดนี้ต้องตรงกับ server/utils/receiptHtml.js ที่ใช้พิมพ์จริง
import { formatQuantity, formatPlate } from "@/utils/formats";
import { getDisplayBrand } from "@/utils/repairDisplay";
import { getPartType } from "@/utils/suspension";
import { getOilSize, OIL_USES, oilUseLineName } from "@/utils/oil";
import { VEHICLE_COMPATIBLE_CATEGORIES } from "@/constants/categories";
import {
  isDiscountItem,
  isSingleQuantityItem,
  lineUnit,
} from "@/constants/services";

export const SHOP = {
  name: "ร้านมณเฑียรการยาง",
  address: "543 หมู่ที่ 5 ตำบลน้ำอ้อม อำเภอกันทรลักษ์ จังหวัดศรีสะเกษ 33110",
  contact:
    "โทร. 089-849-2861, 093-326-1705  เลขประจำตัวผู้เสียภาษี 3 33030032502 1",
};

export const MIN_ROWS = 10;

// ชื่อบัญชีที่ขึ้นเมื่อสแกน QR รับเงิน (ไฟล์ public/payment-qr.svg ต้องตรงกับ server/assets/payment-qr.svg)
export const PAYMENT_QR_NAME = "มณเฑียรการยาง";

// เช็คไม่มีในระบบ เว้นไว้ให้ติ๊กมือ
export const PAYMENT_BOXES = [
  { label: "เงินสด", method: "CASH" },
  { label: "สแกนจ่าย", method: "QR_CODE" },
  { label: "บัตรเครดิต", method: "CREDIT_CARD" },
  { label: "เช็ค", method: null },
];

// ของช่วงล่างตัดเหลือคำแรกของชื่อในคลัง ซึ่งเป็นชนิดอะไหล่
// หมวดเหล่านี้ต้องมียี่ห้อเสมอ (ตรงกับ FULL_NAME_CATEGORIES ฝั่งเซิร์ฟเวอร์)
const FULL_NAME_CATEGORIES = ["ยาง", "ยางเปอร์เซ็นต์", "แบตเตอรี่"];

// ชื่อบรรทัดน้ำมันที่เลือกงานถูกระบบประกอบใหม่ ไม่ใช่ชื่อที่พิมพ์ทับ
const isOilUseLine = (item) =>
  !!item.part &&
  OIL_USES.some((use) => item.itemName === oilUseLineName(item.part, use));

// ยางในลูกค้าดูแค่ขนาด ชนิดจุ๊บในวงเล็บ ("ยางใน 750-16 (จุ๊บเหล็ก)") เป็นเรื่องของช่าง ใบจึงตัดออก
// (ต้องตรงกับ workName ใน server/utils/receiptHtml.js)
const INNER_TUBE_CATEGORY = "ยางใน";
const withoutParentheses = (name) =>
  String(name || "")
    .replace(/\s*\([^)]*\)/g, "")
    .trim();

export const shortWorkName = (item) => {
  const name = shortWorkNameBase(item);
  const isTypedName = !String(item.itemName || "").includes(
    item.part?.name || "",
  );
  return item.part?.category?.name === INNER_TUBE_CATEGORY && !isTypedName
    ? withoutParentheses(name)
    : name;
};

export const shortWorkNameBase = (item) => {
  // ชื่อที่ระบบประกอบมีชื่อในคลังอยู่ข้างในเสมอ ถ้าไม่มีแปลว่าถูกพิมพ์ทับ ไม่ต้องย่อ
  if (
    item.part?.name &&
    !String(item.itemName || "").includes(item.part.name) &&
    !isOilUseLine(item)
  ) {
    return item.itemName;
  }

  if (
    VEHICLE_COMPATIBLE_CATEGORIES.includes(item.part?.category?.name) &&
    item.part?.name
  ) {
    return getPartType(item.part.name);
  }

  // น้ำมันส่วนใหญ่เป็นบรรทัดที่พิมพ์ชื่อเอง ดูจากชื่อแทนหมวดหมู่
  // เอาแค่ขนาดลิตรกับชื่อของ ตัดยี่ห้อ เกรด และของแถมพ่วงท้ายออกให้หมด
  // "VALVOLINE (3L) น้ำมันเครื่อง+กรอง SYNPOWER ECO (0W30)" -> "(3L) น้ำมันเครื่อง+กรอง"
  // "VALVOLINE น้ำมันเบรค (DOT3)" -> "น้ำมันเบรค"
  const name = String(item.itemName || "");
  if (name.includes("น้ำมัน")) {
    const thai = name.match(/[ก-๙][ก-๙+\s-]*[ก-๙]/);
    if (thai) {
      const base = thai[0].trim();
      const size = getOilSize(name);
      if (base) return size ? `(${size}) ${base}` : base;
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

export const hasShortenableName = (items = []) =>
  items.some((item) => shortWorkName(item) !== item.itemName);

export const formatMoney = (value) =>
  Number(value || 0).toLocaleString("th-TH", { maximumFractionDigits: 2 });

// ของแถมคิดราคา 0 ในเล่มกระดาษร้านขีด - ไว้ ไม่ได้เขียนเลขศูนย์
export const formatAmount = (value) =>
  Number(value) === 0 ? "-" : formatMoney(value);

export const unitOf = lineUnit;

// เกินหนึ่งต้องเขียน ไม่งั้นราคาต่อหน่วยกับจำนวนเงินจะไม่ตรงกัน
export const quantityLabel = (item, quantity) => {
  const unit = unitOf(item);
  return (!unit || isSingleQuantityItem(item)) && quantity === 1
    ? ""
    : `${formatQuantity(quantity)} ${unit}`.trim();
};

export const mergeBySide = (items) => {
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

// บิลที่ยกเลิกพิมพ์เป็นใบเดิมก่อนยกเลิก (เลขเดิม ชื่อใบเดิม) แล้วติดคำว่ายกเลิกที่ชื่อใบ
// (ต้องตรงกับ asIssued ใน server/utils/receiptHtml.js)
export const asIssued = (repair) =>
  repair?.status === "CANCELLED"
    ? { ...repair, status: repair.cancelledStatus || "PAID", isCancelled: true }
    : repair;

// ใบประเมินราคา = ใบเสนอราคา, เครดิต = ใบส่งของ, เรียกใบเสร็จได้เฉพาะตอนรับเงินแล้ว
export const receiptDocTitle = (repair) => {
  if (repair?.status === "ESTIMATE") return "ใบเสนอราคา";
  if (repair?.status === "CREDIT") return "ใบส่งของ";
  return "ใบเสร็จรับเงิน";
};

// ต้องตรงกับ receiptDocNo ใน server/utils/receiptHtml.js
export const receiptDocNo = (repair) => {
  if (repair?.status === "ESTIMATE") return repair.quotationNo || repair.id;
  if (repair?.status === "CREDIT") return repair.deliveryNo || repair.id;
  return repair?.receiptNo || repair?.id;
};

// เลขชุดเดียวกับใบเสร็จ เปลี่ยนแค่คำนำหน้าเป็น JO (ต้องตรงกับ jobSheetNo ฝั่งเซิร์ฟเวอร์)
export const jobSheetNo = (repair) =>
  repair?.receiptNo ? repair.receiptNo.replace(/^RE-/, "JO-") : repair?.id;

// ต้องตรงกับ shortProvince ใน server/utils/receiptHtml.js
export const shortProvince = (province) =>
  province === "กรุงเทพมหานคร" ? "กรุงเทพฯ" : province || "";

export const receiptHeaderInfo = (repair) => {
  // วันเปิดบิล ไม่ใช่วันรับเงิน ต้องตรงกับ buildReceiptHtml ใน server/utils/receiptHtml.js
  const issuedAt = new Date(repair.createdAt || Date.now());
  const plate = repair.vehicle?.licensePlate;

  return {
    day: issuedAt.getDate(),
    month: issuedAt.toLocaleDateString("th-TH", { month: "long" }),
    year: String(issuedAt.getFullYear() + 543),
    vehicleName: getDisplayBrand(repair.vehicle?.vehicleModel) || "",
    plateText: plate?.plateNumber
      ? `${formatPlate(plate.plateNumber)} ${shortProvince(plate.province)}`.trim()
      : "",
    fleetNo: repair.vehicle?.fleetNo || "",
  };
};

// ชื่อยาวตกเป็นสองบรรทัด ถ้านับทุกแถวเป็นหนึ่ง แผ่นจะล้นจนช่องลงชื่อหาย
// จึงประมาณบรรทัดจากความกว้างตัวอักษร (ช่องรายการกว้างราว 236 จุด) เผื่อไว้ราวหนึ่งในสิบ
// สระบน-ล่างกับวรรณยุกต์ไม่กินความกว้าง
const NAME_LINE_WIDTH = 217;
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
export const estimateNameLines = (text) => {
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

// QR ท้ายแผ่นสุดท้ายกินที่ แผ่นที่รายการเต็มจึงยกรายการท้ายไปแผ่นใหม่
// ค่าวัดจากหน้าเอกสารจริงใน Chrome
const QR_PAGE_LINES = 11;
// ใบวางบิลหนึ่งบิลหนึ่งบรรทัด แผ่นสุดท้ายต้องเหลือที่ให้ยอดรวม ช่องเซ็น และ QR 28 มม.
// ค่าวัดจากหน้าเอกสารจริงใน Chrome ต้องตรงกับ billPages ใน server/utils/receiptHtml.js
const BILL_PAGE_ROWS = 18;
const BILL_LAST_PAGE_ROWS = 9;
export const billPages = (repairs) => {
  const pages = [];
  for (let i = 0; i < repairs.length; i += BILL_PAGE_ROWS) {
    pages.push(repairs.slice(i, i + BILL_PAGE_ROWS));
  }
  if (pages.length === 0) return [[]];
  // แผ่นสุดท้ายเกินที่ QR รับได้ แผ่นนี้รับได้ถึง BILL_PAGE_ROWS อยู่แล้ว จึงยกไปแค่บิลสุดท้ายใบเดียว
  const last = pages[pages.length - 1];
  if (last.length > BILL_LAST_PAGE_ROWS) {
    pages[pages.length - 1] = last.slice(0, -1);
    pages.push(last.slice(-1));
  }
  return pages;
};
const DELIVERY_PAGE_LINES = 14;
const summaryLinesOf = (discountCount) =>
  discountCount ? discountCount + 2 : 1;
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

const rowName = ({ item, sideLabel }, showBrand) => {
  const base = showBrand ? item.itemName : shortWorkName(item);
  return sideLabel ? `${base} (${sideLabel})` : base;
};

export const rowLines = (row, showBrand) =>
  estimateNameLines(rowName(row, showBrand));

// ยอดรวมกับส่วนลดต่อท้ายแผ่นสุดท้ายเสมอ ไม่นับเป็นหนึ่งใน MIN_ROWS
export const buildReceiptPages = (repair, { showBrand = true } = {}) => {
  const allItems = repair?.repairItems || [];
  const discountItems = allItems.filter(isDiscountItem);
  const rows = mergeBySide(allItems.filter((item) => !isDiscountItem(item)));
  const linesOf = (row) => rowLines(row, showBrand);
  const discountTotal = discountItems.reduce(
    (sum, item) => sum + Number(item.unitPrice) * Number(item.quantity),
    0,
  );
  // ต้องตรงกับ receiptPagesHtml ฝั่งเซิร์ฟเวอร์
  const lastPageLimit = hasPaymentQr(repair)
    ? QR_PAGE_LINES
    : repair?.status === "CREDIT"
      ? DELIVERY_PAGE_LINES
      : null;
  const pages = lastPageLimit
    ? makeRoomForQr(
        paginateRows(rows, linesOf),
        linesOf,
        summaryLinesOf(discountTotal ? discountItems.length : 0),
        lastPageLimit,
      )
    : paginateRows(rows, linesOf);

  return { pages, discountItems };
};

// QR มีเฉพาะใบเสร็จ ใบเสนอราคายังไม่ถึงตอนจ่าย ใบส่งของลูกค้าจ่ายทีหลังตามใบวางบิล
export const hasPaymentQr = (repair) =>
  !repair?.isCancelled && !["ESTIMATE", "CREDIT"].includes(repair?.status);

// ต้นฉบับให้ลูกค้า สำเนาให้ลูกค้าเซ็นรับแล้วร้านเก็บไว้ (ตรงกับฝั่งเซิร์ฟเวอร์)
export const receiptCopyLabels = (repair) =>
  repair?.status === "CREDIT" ? ["ต้นฉบับ", "สำเนา"] : [null];

export const receiptPageCount = (repair, options) =>
  buildReceiptPages(repair, options).pages.length;
