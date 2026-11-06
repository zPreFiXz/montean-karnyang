// ตรรกะชุดนี้ต้องตรงกับ server/utils/receiptHtml.js ที่ใช้พิมพ์จริง
import { formatDate, formatQuantity, formatPlate } from "@/utils/formats";
import { getDisplayBrand, isSaleRepair } from "@/utils/repairDisplay";
import { getPartType, isPerSide } from "@/utils/suspension";
import { splitSuspensionBlocks } from "@/utils/repairItemGroups";
import { getOilSize, ALL_OIL_USES, oilUseLineName } from "@/utils/oil";
import { VEHICLE_COMPATIBLE_CATEGORIES } from "@/constants/categories";
import {
  DEFAULT_LABOR_SERVICE_NAME,
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
  { label: "เช็ค", method: "CHEQUE" },
];

// ของช่วงล่างตัดเหลือคำแรกของชื่อในคลัง ซึ่งเป็นชนิดอะไหล่
// หมวดเหล่านี้ต้องมียี่ห้อเสมอ (ตรงกับ FULL_NAME_CATEGORIES ฝั่งเซิร์ฟเวอร์)
const FULL_NAME_CATEGORIES = ["ยาง", "ยางเปอร์เซ็นต์", "แบตเตอรี่"];

// ชื่อบรรทัดน้ำมันที่เลือกงานถูกระบบประกอบใหม่ ไม่ใช่ชื่อที่พิมพ์ทับ
const isOilUseLine = (item) =>
  !!item.part &&
  ALL_OIL_USES.some((use) => item.itemName === oilUseLineName(item.part, use));

// ยางในลูกค้าดูแค่ขนาด ชนิดจุ๊บในวงเล็บ ("ยางใน 750-16 (จุ๊บเหล็ก)") เป็นเรื่องของช่าง ใบจึงตัดออก
// (ต้องตรงกับ workName ใน server/utils/receiptHtml.js)
const INNER_TUBE_CATEGORY = "ยางใน";
const withoutParentheses = (name) =>
  String(name || "")
    .replace(/\s*\([^)]*\)/g, "")
    .trim();

// ใบเสร็จเขียนแค่คำแรกของชื่อในคลัง (สายพาน 12.5x1000 -> สายพาน) ใบสั่งซ่อมยังเต็มเพราะช่างต้องรู้รุ่น
// หมวดเหล่านี้คำแรกไม่ได้บอกว่าเป็นของอะไร (ยางเป็นชื่อรุ่น น้ำมันเป็นขนาดลิตร ใบปัดต้องรู้ขนาดนิ้ว) จึงใช้วิธีเดิม
// (ต้องตรงกับ KEEP_NAME_CATEGORIES ฝั่งเซิร์ฟเวอร์)
const KEEP_NAME_CATEGORIES = [
  ...FULL_NAME_CATEGORIES,
  "น้ำมัน",
  INNER_TUBE_CATEGORY,
  "ใบปัดน้ำฝน",
];

export const shortWorkName = (item) => {
  const isTypedName = !String(item.itemName || "").includes(
    item.part?.name || "",
  );
  if (
    item.part?.name &&
    !isTypedName &&
    !KEEP_NAME_CATEGORIES.includes(item.part.category?.name)
  ) {
    return getPartType(item.part.name);
  }

  const name = shortWorkNameBase(item);
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

// บิลเครดิตที่จ่ายแล้วพิมพ์ใบส่งของซ้ำได้ ใบส่งของออกตอนยังไม่รู้ว่าจ่ายด้วยอะไร ช่องวิธีจ่ายจึงว่าง
// (ต้องตรงกับ asDeliveryNote ใน receiptHtml.js)
export const canReprintDeliveryNote = (repair) =>
  repair?.status === "PAID" && !!repair?.deliveryNo;
export const asDeliveryNote = (repair) => ({
  ...repair,
  status: "CREDIT",
  paymentMethod: null,
  chequeBank: null,
  chequeNo: null,
  chequeDate: null,
});

// ยังไม่ซ่อม = ใบเสนอราคา, เครดิต = ใบส่งของ, เรียกใบเสร็จได้เฉพาะตอนรับเงินแล้ว
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

// ใบเสร็จที่รับเงินแล้วลงวันที่รับเงิน บิลเครดิตที่มาจ่ายทีหลังจะได้ตรงกับวันที่หน่วยงานจ่ายจริง
// ใบอื่นและใบเสร็จที่ยังไม่จ่าย (พิมพ์ให้ก่อนเก็บเงิน) ลงวันเปิดบิล พิมพ์ซ้ำกี่ครั้งก็ได้วันเดิม
// (ต้องตรงกับ receiptDateOf ใน receiptHtml.js)
export const receiptDateOf = (repair) =>
  repair?.status === "PAID" && repair?.paidAt
    ? repair.paidAt
    : repair?.createdAt;

export const receiptHeaderInfo = (repair) => {
  const issuedAt = new Date(receiptDateOf(repair) || Date.now());
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
// จึงประมาณบรรทัดจากความกว้างตัวอักษร (ช่องรายการกว้างราว 222 จุด) เผื่อไว้ราวหนึ่งในสิบ
// สระบน-ล่างกับวรรณยุกต์ไม่กินความกว้าง
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
// รายละเอียดในใบวางบิล ยี่ห้อรุ่น / ทะเบียน (เบอร์รถ) ค่าอะไหล่กับค่าบริการมีบรรทัดเดียว
// (ต้องตรงกับ billLines ใน receiptHtml.js)
export const billLines = (repair) => {
  // ใบวางบิลเขียนจากฝั่งคนจ่าย จึงเป็น "ค่า…" ไม่ใช่ชื่อบิลแบบในแอป
  if (isSaleRepair(repair)) return ["ค่าอะไหล่", ""];
  if (!repair.vehicle) return ["ค่าบริการ", ""];

  const fleet = repair.vehicle.fleetNo
    ? `เบอร์รถ ${repair.vehicle.fleetNo}`
    : "";
  const model = getDisplayBrand(repair.vehicle.vehicleModel) || "งานซ่อม";
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

// แถวสูงตามจำนวนบรรทัดรายละเอียด จึงแบ่งแผ่นด้วยความสูงแทนจำนวนบิล
// ค่าวัดจากหน้าเอกสารจริงใน Chrome: แผ่นกลางมีที่ให้แถวราว 493px แผ่นสุดท้ายต้องเหลือที่ให้ยอดรวม
// ช่องเซ็น และ QR 28 มม. เต็มขนาด ต้องตรงกับ billPages ใน server/utils/receiptHtml.js
const BILL_ROW_HEIGHT = { 1: 23.4, 2: 41.7 };
const BILL_PAGE_HEIGHT = 490;
const BILL_LAST_PAGE_HEIGHT = 230;
const billRowHeight = (repair) =>
  BILL_ROW_HEIGHT[billLines(repair).filter(Boolean).length] ??
  BILL_ROW_HEIGHT[2];
export const billPageHeight = (repairs) =>
  repairs.reduce((sum, repair) => sum + billRowHeight(repair), 0);
export const BILL_PAGE_LIMITS = {
  page: BILL_PAGE_HEIGHT,
  lastPage: BILL_LAST_PAGE_HEIGHT,
};
export const billPages = (repairs) => {
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

const rowName = ({ item, sideLabel, note, noteRef }, showBrand) => {
  if (note) return `${note} ${noteRef}`;
  const base = showBrand ? item.itemName : shortWorkName(item);
  return sideLabel ? `${base} (${sideLabel})` : base;
};

export const rowLines = (row, showBrand) =>
  estimateNameLines(rowName(row, showBrand));

// ยอดรวมกับส่วนลดต่อท้ายแผ่นสุดท้ายเสมอ ไม่นับเป็นหนึ่งใน MIN_ROWS
// บิลช่วงล่างเรียงแบบหน้ารายละเอียดการซ่อม: รายการเพิ่มเติมคงลำดับที่บันทึก (บิลเก่าบางใบก้อนแท็บไม่ได้อยู่บนสุด)
// ก้อนแท็บเรียงเป็นกลุ่ม ซ้าย-ขวา ซ้าย ขวา อื่นๆ (ดู groupSuspensionDetailItems) ของสองข้างอยู่ตำแหน่งของข้างซ้าย
// ต้องตรงกับ receiptOrder ฝั่งเซิร์ฟเวอร์
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
    if (!item.side && isPerSide(item.part?.attributes)) return 0;
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
const receiptOrder = (repair, items) => {
  if (repair?.type !== "SUSPENSION") return items;
  const { before, tabItems, after } = splitSuspensionBlocks(
    items,
    repair.vehicle?.vehicleModel,
  );
  return [...before, ...orderTabItems(tabItems), ...after];
};

// ใบเสร็จของบิลเครดิตที่จ่ายด้วยเช็ค มีบรรทัดเดียวอ้างใบส่งของ ยอดเท่ายอดบิล รายการดูได้จากใบส่งของ
// (ต้องตรงกับ chequeNoteRow ใน receiptHtml.js)
export const chequeNoteRow = (repair) =>
  repair?.status === "PAID" &&
  repair?.paymentMethod === "CHEQUE" &&
  repair?.deliveryNo
    ? {
        note: "ได้รับเงินตามใบส่งของเลขที่",
        noteRef: repair.deliveryNo,
        amount: Number(repair.totalPrice || 0),
      }
    : null;

export const buildReceiptPages = (repair, { showBrand = true } = {}) => {
  const allItems = repair?.repairItems || [];
  const noteRow = chequeNoteRow(repair);
  const discountItems = noteRow ? [] : allItems.filter(isDiscountItem);
  const rows = noteRow
    ? [noteRow]
    : mergeBySide(
        receiptOrder(
          repair,
          allItems.filter((item) => !isDiscountItem(item)),
        ),
      );
  const linesOf = (row) => rowLines(row, showBrand);
  const discountTotal = discountItems.reduce(
    (sum, item) => sum + Number(item.unitPrice) * Number(item.quantity),
    0,
  );
  // ต้องตรงกับ receiptPagesHtml ฝั่งเซิร์ฟเวอร์
  const lastPageLimit = hasPaymentQr(repair)
    ? QR_PAGE_LINES
    : isCreditDocument(repair)
      ? // บรรทัดธนาคารมีสองบรรทัด แผ่นสุดท้ายจึงรับรายการได้น้อยลงหนึ่ง
        DELIVERY_PAGE_LINES -
        (showsPaymentBoxes(repair) ? paymentLineRows(repair).length : 0) +
        1
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

// ใบส่งของ และใบเสร็จของบิลเครดิตที่มาจ่ายแล้ว (ต้องตรงกับ receiptHtml.js)
const isCreditDocument = (repair) =>
  repair?.status === "CREDIT" ||
  (repair?.status === "PAID" && !!repair?.deliveryNo);

// ช่องวิธีจ่ายกับบรรทัดธนาคารมีเฉพาะเอกสารเครดิตของหน่วยงาน ร้านค้ากับลูกค้าทั่วไปเหลือแค่บรรทัดลงชื่อ
// (ต้องตรงกับ showsPaymentBoxes ใน receiptHtml.js)
export const showsPaymentBoxes = (repair) =>
  isCreditDocument(repair) &&
  repair?.customer?.organizationType === "GOVERNMENT";

// QR มีเฉพาะใบเสร็จ ใบเสนอราคายังไม่ถึงตอนจ่าย ใบส่งของลูกค้าจ่ายทีหลังตามใบวางบิล
// บิลเครดิตที่จ่ายแล้วไม่ต้องสแกนอีก
export const hasPaymentQr = (repair) =>
  !repair?.isCancelled &&
  !["ESTIMATE", "CREDIT"].includes(repair?.status) &&
  !isCreditDocument(repair);

// ค่าในบรรทัดใต้ช่องวิธีจ่าย มีเฉพาะจ่ายด้วยเช็ค จำนวนเงินเท่ายอดบิล (ต้องตรงกับ receiptHtml.js)
export const paymentLineFields = (repair) => {
  const isCheque = repair?.paymentMethod === "CHEQUE";
  const value = (text) => (isCheque ? text || "" : "");
  return [
    { label: "ธนาคาร", value: value(repair?.chequeBank) },
    { label: "เลขที่", value: value(repair?.chequeNo) },
    {
      label: "ลงวันที่",
      value: value(repair?.chequeDate && formatDate(repair.chequeDate)),
    },
    // หน่วยอยู่หลังเส้นประชิดขวาเสมอ ใบส่งของที่ยังว่างก็เขียนแค่ตัวเลข
    {
      label: "จำนวนเงิน",
      value: value(formatMoney(repair?.totalPrice)),
      suffix: "บาท",
    },
  ];
};

// จ่ายด้วยเช็คแบ่งเป็นสองบรรทัด ธนาคารกับเลขที่ / วันที่กับจำนวนเงิน ชื่อยาวจะได้ไม่ถูกตัด ใบที่ยังว่างคงบรรทัดเดียว
// (ต้องตรงกับ bankRows ใน receiptHtml.js)
// สองบรรทัดแบ่งครึ่งเป็นสองคอลัมน์ เลขที่กับจำนวนเงินเริ่มตรงกลางบรรทัด ใบที่ยังว่างก็วางแบบเดียวกับเช็ค
export const paymentLineRows = (repair) => {
  const fields = paymentLineFields(repair);
  return [fields.slice(0, 2), fields.slice(2)];
};

// ใบส่งของมีต้นฉบับให้ลูกค้า สำเนาให้ลูกค้าเซ็นรับแล้วร้านเก็บไว้ เลือกพิมพ์ทีละใบหรือทั้งคู่ก็ได้
// id ต้องตรงกับ COPY_CHOICES ใน server/utils/receiptHtml.js
export const COPY_CHOICES = [
  { id: "both", label: "ต้นฉบับและสำเนา", copies: ["ต้นฉบับ", "สำเนา"] },
  { id: "original", label: "ต้นฉบับ", copies: ["ต้นฉบับ"] },
  { id: "copy", label: "สำเนา", copies: ["สำเนา"] },
];

export const receiptCopyLabels = (repair, copyChoice = "both") =>
  repair?.status === "CREDIT"
    ? (
        COPY_CHOICES.find((choice) => choice.id === copyChoice) ??
        COPY_CHOICES[0]
      ).copies
    : [null];

export const receiptPageCount = (repair, options) =>
  buildReceiptPages(repair, options).pages.length;

export const JOB_SHEET = {
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

// ชื่อแถวของใบสั่งซ่อม (ต้องตรงกับ nameOf ใน buildJobSheetHtml)
export const jobRowName = ({ item, sideLabel }) => {
  const base = shortWorkNameBase(item);
  return sideLabel ? `${base} (${sideLabel})` : base;
};

// ค่าแรงกับส่วนลดไม่ต้องขึ้น ใบนี้ไม่เกี่ยวกับเงิน
export const jobSheetPages = (repair, nameOf = jobRowName) => {
  const allItems = (repair?.repairItems || []).filter(
    (item) =>
      !isDiscountItem(item) &&
      item.service?.name !== DEFAULT_LABOR_SERVICE_NAME &&
      item.itemName !== DEFAULT_LABOR_SERVICE_NAME,
  );
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
      JOB_SHEET.head +
      (pages.length === 1 && repair?.description
        ? JOB_SHEET.noteBase +
          JOB_SHEET.noteLine * jobLines(repair.description, JOB_SHEET.noteWidth)
        : 0);
  };
  // ไม่พอที่ก็ขึ้นแผ่นใหม่ ยกเว้นแผ่นนี้ยังไม่มีรายการเลย ขึ้นใหม่ก็ไม่ช่วย
  const place = (costOn, add) => {
    if (
      used + costOn(page) > JOB_SHEET.page &&
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
      ...pair.map((row) =>
        row ? jobLines(nameOf(row), JOB_SHEET.halfName) : 1,
      ),
    );
    place(
      (p) =>
        (p.sides.length ? 0 : JOB_SHEET.gap + JOB_SHEET.sideHead) +
        jobRowHeight(lines),
      (p) => p.sides.push(pair),
    );
  }
  for (const row of others) {
    place(
      (p) =>
        (p.others.length ? 0 : JOB_SHEET.gap + JOB_SHEET.listHead) +
        jobRowHeight(jobLines(nameOf(row), JOB_SHEET.fullName)),
      (p) => p.others.push(row),
    );
  }
  // แถวเพิ่มเติมไม่พอที่ในแผ่นสุดท้าย ก็ไม่ต้องมี ไม่ขึ้นแผ่นใหม่ที่มีแค่แถวว่าง
  const extraCost =
    (page.others.length
      ? JOB_SHEET.listHead
      : JOB_SHEET.gap + JOB_SHEET.listHead) +
    JOB_SHEET.blankRows * jobRowHeight(1);
  if (used + extraCost <= JOB_SHEET.page) page.extra = true;

  return { pages, hasSides };
};

// ใบวางบิลกับหน้าหน่วยงานเรียงบิลตามเลขใบส่งของ (ต้องตรงกับ byDeliveryNo ใน receiptHtml.js)
// เลขเป็น DO-ปปดด-ลำดับ เทียบเป็นข้อความได้ บิลที่ไม่มีเลขต่อท้ายตามลำดับที่เปิด
export const byDeliveryNo = (a, b) =>
  !a.deliveryNo !== !b.deliveryNo
    ? a.deliveryNo
      ? -1
      : 1
    : String(a.deliveryNo || "").localeCompare(String(b.deliveryNo || "")) ||
      a.id - b.id;
