// ตัวช่วยของใบเสร็จ ใบส่งของ ใบเสนอราคา และใบสั่งซ่อม แยกจาก ReceiptPaper ให้หน้าอื่นเรียกใช้ได้
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

// ข้อมูลร้านที่พิมพ์ไว้บนหัวใบเสร็จเล่มกระดาษ ใช้ชุดเดียวกันเพื่อให้ใบที่พิมพ์ออกมาหน้าตาเหมือนกัน
export const SHOP = {
  name: "ร้านมณเฑียรการยาง",
  address: "543 หมู่ที่ 5 ตำบลน้ำอ้อม อำเภอกันทรลักษ์ จังหวัดศรีสะเกษ 33110",
  contact:
    "โทร. 089-849-2861, 093-326-1705  เลขประจำตัวผู้เสียภาษี 3 33030032502 1",
};

// ใบเสร็จกระดาษมีเส้นว่างไว้เขียนเพิ่ม ใบที่พิมพ์จึงเติมแถวเปล่าให้ตารางสูงเท่ากันทุกใบ
export const MIN_ROWS = 10;

// ชื่อบัญชีที่ขึ้นเมื่อสแกน QR รับเงิน (ไฟล์ public/payment-qr.svg ต้องตรงกับ server/assets/payment-qr.svg)
export const PAYMENT_QR_NAME = "มณเฑียรการยาง";

// ช่องติ๊กวิธีจ่ายบนใบเสร็จ เรียงตามที่ร้านใช้บ่อย (เช็คไม่มีในระบบ เว้นไว้ให้ติ๊กมือ)
export const PAYMENT_BOXES = [
  { label: "เงินสด", method: "CASH" },
  { label: "สแกนจ่าย", method: "QR_CODE" },
  { label: "บัตรเครดิต", method: "CREDIT_CARD" },
  { label: "เช็ค", method: null },
];

// ช่างดูจากชนิดอะไหล่ ไม่ได้ดูยี่ห้อหรือรุ่น ชื่อในบิลมีทั้งสองอย่างต่อท้ายจนยาว
// ของช่วงล่างจึงตัดเหลือคำแรกของชื่อในคลัง ซึ่งเป็นชนิดอะไหล่พอดี (ลูกหมากบน คันชักนอก)
// ใบที่ปิดชื่อเต็มแล้ว หมวดเหล่านี้ยังต้องมียี่ห้อ (ตรงกับ FULL_NAME_CATEGORIES ฝั่งเซิร์ฟเวอร์)
const FULL_NAME_CATEGORIES = ["ยาง", "ยางเปอร์เซ็นต์", "แบตเตอรี่"];

// น้ำมันที่เลือกงานตอนลงบิล ชื่อบรรทัดถูกประกอบใหม่ ("VALVOLINE น้ำมันเฟืองท้าย (80W90)")
// ไม่มีชื่อในคลังอยู่ข้างใน แต่ระบบประกอบเอง ไม่ใช่ชื่อที่พิมพ์ทับ
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

// ชื่อที่พิมพ์ทับเองไม่แตะ (ไม่มีชื่อในคลังอยู่ข้างใน)
export const shortWorkName = (item) => {
  const name = shortWorkNameBase(item);
  const isTypedName = !String(item.itemName || "").includes(
    item.part?.name || "",
  );
  return item.part?.category?.name === INNER_TUBE_CATEGORY && !isTypedName
    ? withoutParentheses(name)
    : name;
};

// ใบสั่งซ่อมใช้ตัวนี้ตรงๆ ช่างยังต้องรู้ชนิดจุ๊บของยางใน
export const shortWorkNameBase = (item) => {
  // พิมพ์ชื่อทับไว้เอง = ตั้งใจให้ขึ้นแบบนั้น ไม่ต้องย่อทับ
  // ชื่อที่ระบบประกอบเองจะมีชื่อในคลังอยู่ข้างในเสมอ ถ้าไม่มีแปลว่าถูกพิมพ์ใหม่
  if (
    item.part?.name &&
    !String(item.itemName || "").includes(item.part.name) &&
    !isOilUseLine(item)
  ) {
    return item.itemName;
  }

  // หมวดที่อะไหล่ผูกกับรุ่นรถ ชื่อในคลังจะเป็น "ยี่ห้อ ชนิด รุ่นรถ" เสมอ
  // ตัดเหลือคำแรกซึ่งเป็นชนิดอะไหล่ (ลูกหมากบน คันชักนอก ผ้าเบรคหน้า)
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

  // หมวดอื่น (สายพาน ใบปัดน้ำฝน ฯลฯ) ชื่อในบิลประกอบจาก "ยี่ห้อ ชื่อ" ตัดยี่ห้อที่นำหน้าออก
  // ยางกับแบตเตอรี่เขียนเต็มเสมอ ลูกค้าซื้อตามยี่ห้อ และรับประกันก็ผูกกับยี่ห้อ
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

// บิลใบนี้มีของที่ย่อชื่อได้ไหม ถ้าไม่มีก็ไม่ต้องมีสวิตช์ให้กด
export const hasShortenableName = (items = []) =>
  items.some((item) => shortWorkName(item) !== item.itemName);

export const formatMoney = (value) =>
  Number(value || 0).toLocaleString("th-TH", { maximumFractionDigits: 2 });

// ของแถมคิดราคา 0 ในเล่มกระดาษร้านขีด - ไว้ ไม่ได้เขียนเลขศูนย์
export const formatAmount = (value) =>
  Number(value) === 0 ? "-" : formatMoney(value);

export const unitOf = lineUnit;

// เว้นช่องจำนวนไว้เมื่อเป็นหนึ่งเดียวและไม่มีหน่วยให้บอก (ค่าแรง บริการที่คิดเป็นครั้ง) เหมือนที่เขียนมือในเล่ม
// รวมถึงงานที่คิดครั้งเดียวต่อคันแม้จะตั้งหน่วยไว้
// เกินหนึ่งยังต้องเขียน ไม่งั้นราคาต่อหน่วยกับจำนวนเงินจะไม่ตรงกัน
export const quantityLabel = (item, quantity) => {
  const unit = unitOf(item);
  return (!unit || isSingleQuantityItem(item)) && quantity === 1
    ? ""
    : `${formatQuantity(quantity)} ${unit}`.trim();
};

// บิลเช็กช่วงล่างเก็บข้างที่ใส่ไว้กับแต่ละบรรทัด ใบจึงต้องบอกด้วยว่าเปลี่ยนของข้างไหน
// ของชิ้นเดียวกันที่ใส่ทั้งสองข้างยุบเป็นแถวเดียวแล้วห้อยท้ายว่า L-R
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

// ข้อมูลหัวใบที่ใบเสร็จกับใบสั่งงานใช้ร่วมกัน
// ชื่อเอกสารเปลี่ยนตามสถานะ เพราะเรียกว่าใบเสร็จรับเงินได้เฉพาะตอนรับเงินแล้วจริง
// ใบประเมินราคา = ยังไม่ได้ซ่อม เป็นใบเสนอราคา
// เครดิต = ซ่อมแล้วแต่ยังไม่ได้เงิน เป็นใบส่งของ
export const receiptDocTitle = (repair) => {
  if (repair?.status === "ESTIMATE") return "ใบเสนอราคา";
  if (repair?.status === "CREDIT") return "ใบส่งของ";
  return "ใบเสร็จรับเงิน";
};

// เลขที่ของใบตามชนิดเอกสารของสถานะตอนนี้ ต้องตรงกับ receiptDocNo ใน server/utils/receiptHtml.js
// ใบเสร็จมีเลขตั้งแต่เปิดบิล พิมพ์ไปเก็บเงินก่อนจ่ายได้ เลขเดียวกับหลังจ่าย
export const receiptDocNo = (repair) => {
  if (repair?.status === "ESTIMATE") return repair.quotationNo || repair.id;
  if (repair?.status === "CREDIT") return repair.deliveryNo || repair.id;
  return repair?.receiptNo || repair?.id;
};

// ใบสั่งซ่อมใช้ตัวเลขชุดเดียวกับใบเสร็จของบิลนั้น เปลี่ยนแค่คำนำหน้าเป็น JO ให้บอกชนิดใบถูก
// ช่างกับหน้าร้านจับคู่ใบกันด้วยตัวเลขได้ทันที (ต้องตรงกับ jobSheetNo ใน server/utils/receiptHtml.js)
export const jobSheetNo = (repair) =>
  repair?.receiptNo ? repair.receiptNo.replace(/^RE-/, "JO-") : repair?.id;

// กรุงเทพมหานครยาวจนดันยี่ห้อ-รุ่นในแถวรถให้ถูกตัด บนกระดาษจึงเขียนย่อแบบที่ใช้กันทั่วไป
// (ต้องตรงกับ shortProvince ใน server/utils/receiptHtml.js)
export const shortProvince = (province) =>
  province === "กรุงเทพมหานคร" ? "กรุงเทพฯ" : province || "";

export const receiptHeaderInfo = (repair) => {
  // วันเปิดบิล ไม่ใช่วันรับเงิน ต้องตรงกับ buildReceiptHtml ใน server/utils/receiptHtml.js
  const issuedAt = new Date(repair.createdAt || Date.now());
  const plate = repair.vehicle?.licensePlate;

  return {
    day: issuedAt.getDate(),
    month: issuedAt.toLocaleDateString("th-TH", { month: "long" }),
    // ปี พ.ศ. เต็มสี่หลัก อ่านชัดกว่าสองหลัก และเอกสารราชการที่ลูกค้าหน่วยงานใช้ก็เขียนแบบนี้
    year: String(issuedAt.getFullYear() + 543),
    vehicleName: getDisplayBrand(repair.vehicle?.vehicleModel) || "",
    plateText: plate?.plateNumber
      ? `${formatPlate(plate.plateNumber)} ${shortProvince(plate.province)}`.trim()
      : "",
    fleetNo: repair.vehicle?.fleetNo || "",
  };
};

// ชื่อยาวตกเป็นสองบรรทัดในใบเสร็จ แถวสูงเกือบเท่าตัว ถ้านับทุกแถวเป็นหนึ่ง
// แผ่นที่มีชื่อยาวหลายแถวจะล้นกระดาษ ท้ายใบ (ช่องลงชื่อ) ถูกตัดหายไปเงียบๆ
// จึงประมาณจำนวนบรรทัดจากความกว้างตัวอักษร (วัดจากฟอนต์ของใบเสร็จ ช่องรายการกว้างราว 236 จุด)
// เผื่อไว้ราวหนึ่งในสิบ ประมาณเกินดีกว่าขาด ขาดคือกระดาษล้น เกินแค่มีบรรทัดว่างเพิ่ม
// สระบน-ล่างกับวรรณยุกต์ซ้อนอยู่บนตัวอักษรอื่น ไม่กินความกว้าง
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

// แบ่งแผ่นตามจำนวนบรรทัดที่ใช้จริง แผ่นละไม่เกิน MIN_ROWS บรรทัด
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

// QR รับเงินใต้ช่องลงชื่อกินที่ท้ายแผ่นสุดท้าย บิลทั่วไปที่ว่างใต้ตารางพอ
// แต่แผ่นสุดท้ายที่รายการเต็มแล้วยังมีแถวส่วนลดต่อท้าย จะล้นแผ่น จึงยกรายการท้ายไปขึ้นแผ่นใหม่
// นับบรรทัดที่เห็นจริงในตาราง: รายการ + ยอดรวม (มีส่วนลดเพิ่มแถวรวมเป็นเงินกับแถวส่วนลดแต่ละแถว)
// ค่าวัดจากหน้าเอกสารจริงใน Chrome ใบส่งของไม่มี QR จึงรับได้มากกว่า แม้มีแถววิธีจ่ายกับบรรทัดต้นฉบับ/สำเนาเพิ่ม
const QR_PAGE_LINES = 11;
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

// ชื่อบนแถวของใบเสร็จ ตามสวิตช์ชื่ออะไหล่แบบเต็ม และห้อยข้างที่ใส่ไว้ท้ายชื่อ
const rowName = ({ item, sideLabel }, showBrand) => {
  const base = showBrand ? item.itemName : shortWorkName(item);
  return sideLabel ? `${base} (${sideLabel})` : base;
};

export const rowLines = (row, showBrand) =>
  estimateNameLines(rowName(row, showBrand));

// บิลที่มีรายการเกินหนึ่งหน้าให้แยกเป็นใบต่อไป แผ่นละ MIN_ROWS บรรทัด (นับบรรทัดที่ชื่อยาวตกลงมาด้วย)
// ยอดรวมกับส่วนลดต่อท้ายแผ่นสุดท้ายเสมอ ไม่นับเป็นหนึ่งใน MIN_ROWS
// กระดาษยังเหลือที่ใต้ตารางราวห้าบรรทัด รายการเต็มสิบบรรทัดก็ยังมีที่ให้ยอดรวมอยู่แผ่นเดียวกัน
export const buildReceiptPages = (repair, { showBrand = true } = {}) => {
  const allItems = repair?.repairItems || [];
  const discountItems = allItems.filter(isDiscountItem);
  const rows = mergeBySide(allItems.filter((item) => !isDiscountItem(item)));
  const linesOf = (row) => rowLines(row, showBrand);
  const discountTotal = discountItems.reduce(
    (sum, item) => sum + Number(item.unitPrice) * Number(item.quantity),
    0,
  );
  // ใบส่งของไม่มี QR แต่มีแถววิธีจ่ายเงินกับบรรทัดต้นฉบับ/สำเนาใต้ชื่อใบ แผ่นสุดท้ายจึงรับได้จำกัดเหมือนกัน
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

// ใบส่งของพิมพ์สองชุด ต้นฉบับให้ลูกค้า สำเนาให้ลูกค้าเซ็นรับแล้วร้านเก็บไว้ (ตรงกับ buildReceiptHtml ฝั่งเซิร์ฟเวอร์)
export const receiptCopyLabels = (repair) =>
  repair?.status === "CREDIT" ? ["ต้นฉบับ", "สำเนา"] : [null];

export const receiptPageCount = (repair, options) =>
  buildReceiptPages(repair, options).pages.length;
