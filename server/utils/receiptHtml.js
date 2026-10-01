const fs = require("fs");
const path = require("path");
const { bahtText } = require("./bahtText");

// QR รับเงินพร้อมเพย์ของร้าน (Thai QR ไม่ระบุยอด) ฝังในไฟล์เหมือนฟอนต์ ไม่ต้องพึ่งเน็ตตอนพิมพ์
// ต้องตรงกับ client/public/payment-qr.svg
const PAYMENT_QR_SRC = `data:image/svg+xml;base64,${fs
  .readFileSync(path.join(__dirname, "..", "assets", "payment-qr.svg"))
  .toString("base64")}`;
const PAYMENT_QR_NAME = "มณเฑียรการยาง";
// โลโก้พร้อมเพย์เหนือ QR บอกลูกค้าว่าสแกนด้วยแอปธนาคารไหนก็ได้ (ต้องตรงกับ client/public/promptpay-logo-bw.jpg)
const PROMPTPAY_LOGO_SRC = `data:image/jpeg;base64,${fs
  .readFileSync(path.join(__dirname, "..", "assets", "promptpay-logo.jpg"))
  .toString("base64")}`;

// ฝังฟอนต์ Athiti ลงในไฟล์เลย ใบที่พิมพ์จะได้ตัวหนังสือเหมือนตัวอย่างบนจอ
// ฝังแทนการโหลดจาก Google Fonts เพราะเครื่องที่ร้านอาจไม่มีเน็ตตอนสั่งพิมพ์
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

// อ่านครั้งเดียวตอนเซิร์ฟเวอร์เริ่มทำงาน ไม่ต้องอ่านไฟล์ใหม่ทุกใบที่พิมพ์
const FONT_FACES = [
  fontFace(400, "thai"),
  fontFace(400, "latin"),
  fontFace(600, "thai"),
  fontFace(600, "latin"),
].join("\n");

// แม่แบบใบเสร็จสำหรับสั่งพิมพ์ผ่านเซิร์ฟเวอร์ (กดพิมพ์จากมือถือแล้วกระดาษออกที่ร้าน)
// ต้องให้หน้าตาตรงกับไดอะล็อกตัวอย่างฝั่งหน้าเว็บ (client ReceiptPreviewDialog)
// แก้หน้าตาใบเสร็จเมื่อไหร่ต้องแก้ทั้งสองที่
const SHOP = {
  name: "ร้านมณเฑียรการยาง",
  address: "543 หมู่ที่ 5 ตำบลน้ำอ้อม อำเภอกันทรลักษ์ จังหวัดศรีสะเกษ 33110",
  contact:
    "โทร. 089-849-2861, 093-326-1705  เลขประจำตัวผู้เสียภาษี 3 33030032502 1",
};

const MIN_ROWS = 10;

// ตรงกับ estimateNameLines ฝั่งหน้าเว็บ (ReceiptPaper) แก้ต้องแก้คู่กัน
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
const estimateNameLines = (text) => {
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

// กรุงเทพมหานครยาวจนดันยี่ห้อ-รุ่นในแถวรถให้ถูกตัด บนกระดาษจึงเขียนย่อแบบที่ใช้กันทั่วไป
// (ต้องตรงกับ shortProvince ใน client/src/components/receipt/ReceiptPaper.jsx)
const shortProvince = (province) =>
  province === "กรุงเทพมหานคร" ? "กรุงเทพฯ" : province || "";

// เรียกว่าใบเสร็จรับเงินได้เฉพาะตอนรับเงินแล้วจริง
// ใบประเมินราคา = ยังไม่ได้ซ่อม เป็นใบเสนอราคา / เครดิต = ซ่อมแล้วแต่ยังไม่ได้เงิน เป็นใบส่งของ
const receiptDocTitle = (repair) => {
  if (repair.status === "ESTIMATE") return "ใบเสนอราคา";
  if (repair.status === "CREDIT") return "ใบส่งของ";
  return "ใบเสร็จรับเงิน";
};

// เลขที่ของใบที่กำลังพิมพ์ ตามชนิดเอกสารของสถานะตอนนี้
// ใบเสร็จมีเลขตั้งแต่เปิดบิล พิมพ์ไปเก็บเงินก่อนจ่ายได้ เลขเดียวกับหลังจ่าย
const receiptDocNo = (repair) => {
  if (repair.status === "ESTIMATE") return repair.quotationNo || repair.id;
  if (repair.status === "CREDIT") return repair.deliveryNo || repair.id;
  return repair.receiptNo || repair.id;
};

// ใบสั่งซ่อมใช้ตัวเลขชุดเดียวกับใบเสร็จ เปลี่ยนแค่คำนำหน้าเป็น JO (ต้องตรงกับ jobSheetNo ฝั่งหน้าเว็บ)
const jobSheetNo = (repair) =>
  repair.receiptNo ? repair.receiptNo.replace(/^RE-/, "JO-") : repair.id;

const PAYMENT_BOXES = [
  { label: "เงินสด", method: "CASH" },
  { label: "สแกนจ่าย", method: "QR_CODE" },
  { label: "บัตรเครดิต", method: "CREDIT_CARD" },
  { label: "เช็ค", method: null },
];

// ทะเบียนเก็บเป็น "กษ 9037" แต่แสดงคั่นด้วยขีด ให้ตรงกับที่หน้าเว็บแสดง
// 0812345678 → 081-234-5678 (ตรงกับ formatPhone ใน client/src/utils/formats.js)
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

// ยี่ห้อ "อื่นๆ" เป็นตัวเลือกสำรอง ไม่ใช่ยี่ห้อจริง จึงไม่ต้องเอาไปโชว์หน้าชื่อรุ่น
// (ตรงกับ getDisplayBrand ฝั่งหน้าเว็บ)
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

// ตรงกับ lineUnit ฝั่งหน้าเว็บ: หน่วยที่พิมพ์ในบิลก่อน ไม่มีค่อยใช้หน่วยของอะไหล่หรือบริการตอนนี้
// รายการเปล่า (อะไหล่อื่นๆ บริการอื่นๆ) ไม่ใช้หน่วยของตัวบริการ เพราะแต่ละบรรทัดเป็นของคนละอย่าง
const TYPED_UNIT_SERVICE_NAMES = ["อะไหล่อื่นๆ", "บริการอื่นๆ"];
const unitOf = (item) =>
  item.itemUnit ||
  item.part?.unit ||
  (TYPED_UNIT_SERVICE_NAMES.includes(item.service?.name)
    ? ""
    : item.service?.unit) ||
  "";

// เว้นช่องจำนวนไว้เมื่อเป็นหนึ่งเดียวและไม่มีหน่วยให้บอก (ค่าแรง บริการที่คิดเป็นครั้ง)
// รวมถึงงานที่คิดครั้งเดียวต่อคันแม้จะตั้งหน่วยไว้ (ตรงกับ quantityLabel ฝั่งหน้าเว็บ)
// เกินหนึ่งยังต้องเขียน ไม่งั้นราคาต่อหน่วยกับจำนวนเงินจะไม่ตรงกัน
const SINGLE_QUANTITY_SERVICE_NAMES = [
  "ค่าแรง",
  "ตั้งศูนย์",
  "สลับยาง+ถ่วงล้อ",
];
const quantityLabel = (item, quantity) => {
  const unit = unitOf(item);
  const isSingle =
    !unit || SINGLE_QUANTITY_SERVICE_NAMES.includes(item.service?.name);
  return isSingle && quantity === 1
    ? ""
    : `${formatQuantity(quantity)} ${unit}`.trim();
};

// ของชิ้นเดียวกันที่ใส่ทั้งสองข้างยุบเป็นแถวเดียวแล้วห้อยท้ายว่า L-R
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

// showCustomer = false คือใบที่ไม่เอาชื่อ ที่อยู่ และเลขผู้เสียภาษีของลูกค้าติดไปด้วย
// แผ่นกระดาษของใบเสร็จหนึ่งใบ (ไม่รวมโครงเอกสาร) ใบยาวเกินหนึ่งแผ่นจะได้หลายแผ่น
const receiptPagesHtml = (
  repair,
  { showCustomer = true, showBrand = true, copyLabel = null } = {},
) => {
  // ชื่อเอกสารเปลี่ยนตามสถานะ (ตรงกับ receiptDocTitle ฝั่งหน้าเว็บ)
  const docTitle = receiptDocTitle(repair);
  // วันเปิดบิล ไม่ใช่วันรับเงิน ร้านพิมพ์ใบเสร็จไปยื่นก่อนเก็บเงิน พิมพ์ซ้ำหลังจ่ายแล้วต้องได้ใบเหมือนเดิม
  // ใบเสนอราคาที่ลูกค้าตกลงซ่อม วันเปิดบิลถูกนับใหม่เป็นวันเริ่มซ่อมอยู่แล้ว
  const issuedAt = new Date(repair.createdAt || Date.now());
  const day = issuedAt.getDate();
  const month = issuedAt.toLocaleDateString("th-TH", { month: "long" });
  const year = String(issuedAt.getFullYear() + 543);

  const plate = repair.vehicle?.licensePlate;
  const plateText = plate?.plateNumber
    ? `${formatPlate(plate.plateNumber)} ${shortProvince(plate.province)}`.trim()
    : "";
  const model = repair.vehicle?.vehicleModel;
  const vehicleName = displayBrand(model);
  // รถส่วนใหญ่ไม่มีเบอร์ ขึ้นเฉพาะคันที่มี ไม่เว้นช่องว่างรกใบ (ต้องตรงกับ ReceiptPaper ฝั่งหน้าเว็บ)
  // เบอร์รถมีแค่ไม่กี่ตัว ช่องกว้างพอดีเลข ไม่จองที่ไว้ ยี่ห้อ-รุ่นกับทะเบียนจะได้ที่มากที่สุด
  const fleetHtml = repair.vehicle?.fleetNo
    ? `<span style="white-space:nowrap">เบอร์รถ</span><span class="dotted fleet">${escapeHtml(repair.vehicle.fleetNo)}</span>`
    : "";

  // ส่วนลดไม่ใช่ของที่ขาย ยกออกจากตารางไปไว้เป็นแถวใต้ยอดรวมแทน (ตรงกับ ReceiptPaper ฝั่งหน้าเว็บ)
  // ราคาติดลบมีแต่ส่วนลดเท่านั้น ใช้เป็นตาข่ายรองรับบรรทัดที่ถูกเปลี่ยนชื่อ
  const isDiscount = (item) =>
    (item.service?.name || item.itemName) === "ส่วนลด" ||
    Number(item.unitPrice) < 0;
  const discountItems = (repair.repairItems || []).filter(isDiscount);
  const discountTotal = discountItems.reduce(
    (sum, item) => sum + Number(item.unitPrice) * Number(item.quantity),
    0,
  );
  const hasDiscount = discountTotal !== 0;

  const rows = mergeBySide(
    (repair.repairItems || []).filter((item) => !isDiscount(item)),
  );
  // บิลที่มีรายการเกินหนึ่งหน้าให้แยกเป็นใบต่อไป แผ่นละ MIN_ROWS บรรทัด (นับบรรทัดที่ชื่อยาวตกลงมาด้วย)
  // ยอดรวมกับส่วนลดต่อท้ายแผ่นสุดท้ายเสมอ (ตรงกับ buildReceiptPages ฝั่งหน้าเว็บ)
  const rowName = ({ item, sideLabel }) => {
    const base = showBrand ? item.itemName : workName(item);
    return sideLabel ? `${base} (${sideLabel})` : base;
  };
  const rowLines = (row) => estimateNameLines(rowName(row));
  const summaryRows = discountItems.length ? discountItems.length + 1 : 1;
  // QR มีเฉพาะใบเสร็จ ใบเสนอราคายังไม่ถึงตอนจ่าย ใบส่งของลูกค้าจ่ายทีหลังตามใบวางบิล
  const showPaymentQr = !["ESTIMATE", "CREDIT"].includes(repair.status);
  // คนเซ็นตามหน้าที่ของใบ ใบส่งของกับใบเสนอราคายังไม่มีการรับเงิน (ต้องตรงกับ ReceiptPaper ฝั่งหน้าเว็บ)
  const signLabels =
    repair.status === "CREDIT"
      ? ["ผู้รับของ", "ผู้ส่งของ"]
      : repair.status === "ESTIMATE"
        ? ["ผู้เสนอราคา", "ผู้อนุมัติ"]
        : ["ผู้รับเงิน", "ผู้จ่ายเงิน"];
  // ใบส่งของไม่มี QR แต่มีแถววิธีจ่ายเงินกับบรรทัดต้นฉบับ/สำเนาใต้ชื่อใบ แผ่นสุดท้ายจึงรับได้จำกัดเหมือนกัน
  const lastPageLimit = showPaymentQr
    ? QR_PAGE_LINES
    : repair.status === "CREDIT"
      ? DELIVERY_PAGE_LINES
      : null;
  const pages = lastPageLimit
    ? makeRoomForQr(
        paginateRows(rows, rowLines),
        rowLines,
        summaryLinesOf(discountTotal ? discountItems.length : 0),
        lastPageLimit,
      )
    : paginateRows(rows, rowLines);

  // แถวยอดรวมกับส่วนลดต่อท้ายแผ่นสุดท้ายเสมอ ไม่นับเป็นหนึ่งใน MIN_ROWS รายการ
  // กระดาษยังเหลือที่ใต้ตารางราวห้าบรรทัด รายการเต็มสิบแถวก็ยังมีที่ให้ยอดรวมอยู่แผ่นเดียวกัน
  // ไม่ขึ้นแผ่นใหม่ที่มีแต่ยอดรวม และไม่ยกรายการไปแผ่นใหม่ให้บิลสิบรายการกลายเป็นสองแผ่น
  // ยอดในบิลหักส่วนลดไปแล้ว ยอดก่อนหักจึงต้องบวกกลับ (ส่วนลดเก็บเป็นเลขติดลบ)
  const total = Number(repair.totalPrice || 0);
  const subtotal = total - discountTotal;

  const rowHtml = ({ item, quantity, sideLabel }) => {
    const amount = Number(item.unitPrice) * quantity;
    const name = rowName({ item, sideLabel });
    return `<tr>
        <td class="c">${escapeHtml(quantityLabel(item, quantity))}</td>
        <td class="wrap">${escapeHtml(name)}</td>
        <td class="r">${formatAmount(item.unitPrice)}</td>
        <td class="r">${formatAmount(amount)}</td>
      </tr>`;
  };

  const summaryHtml = `${
    hasDiscount
      ? `<tr>
        <td colspan="2" class="blank"></td>
        <td class="c">รวมเป็นเงิน</td>
        <td class="r">${formatMoney(subtotal)}</td>
      </tr>
      ${discountItems
        .map(
          (item) => `<tr>
        <td colspan="2" class="blank"></td>
        <td class="c">${escapeHtml(item.itemName)}</td>
        <td class="r">${formatMoney(Number(item.unitPrice) * Number(item.quantity))}</td>
      </tr>`,
        )
        .join("")}`
      : ""
  }
      <tr class="sum">
        <td colspan="2">จำนวนเงินรวมทั้งสิ้น <span class="sum-text">${escapeHtml(bahtText(total))}</span></td>
        <td class="c">จำนวนเงินรวม</td>
        <td class="r" style="font-weight:600;font-size:13pt">${formatMoney(total)}</td>
      </tr>`;

  // ปิดข้อมูลลูกค้า = เว้นช่องไว้ ไม่เอาบรรทัดออก ใบจะได้หน้าตาเหมือนกันทุกครั้ง
  // เบอร์โทรอยู่ท้ายบรรทัดชื่อ ใบไม่สูงขึ้น ขึ้นเฉพาะลูกค้าที่มีเบอร์ และปิดตามสวิตช์ข้อมูลลูกค้า
  // (ต้องตรงกับ ReceiptPaper ฝั่งหน้าเว็บ)
  const phone = showCustomer ? formatPhone(repair.customer?.phoneNumber) : "";
  const customerFields = `<p class="pair">ชื่อลูกค้า<span class="dotted v cut">${
    showCustomer ? escapeHtml(repair.customer?.name || "") : ""
  }</span>เบอร์โทรศัพท์<span class="dotted v">${escapeHtml(phone)}</span></p>
    <p>ที่อยู่<span class="dotted v">${
      showCustomer ? escapeHtml(repair.customer?.address || "") : ""
    }</span></p>
    <p>เลขประจำตัวผู้เสียภาษีอากร<span class="dotted v">${
      showCustomer ? escapeHtml(repair.customer?.taxId || "") : ""
    }</span></p>`;

  // เนื้อของกระดาษหนึ่งแผ่น เรียกซ้ำตามจำนวนหน้า
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
      <div class="doc">${docTitle}</div>
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

  // ช่องวิธีจ่ายกับแถวเช็คมีเฉพาะใบส่งของ ลูกค้าเครดิตจ่ายทีหลัง ต้องจดว่าจ่ายทางไหน
  // ใบเสร็จกับใบเสนอราคาไม่ต้องมี (ต้องตรงกับ ReceiptPaper ฝั่งหน้าเว็บ)
  const paymentBoxes = PAYMENT_BOXES.map(
    (box) =>
      `<span class="pay"><span class="box">${
        box.method && repair.paymentMethod === box.method ? "✓" : ""
      }</span>${box.label}</span>`,
  ).join("");
  const paymentHtml =
    repair.status === "CREDIT"
      ? `<div class="pays">${paymentBoxes}</div>

  <div class="bank">
    <span class="bank-field">ธนาคาร<span class="dotted"></span></span>
    <span class="bank-field">เลขที่<span class="dotted"></span></span>
    <span class="bank-field">ลงวันที่<span class="dotted"></span></span>
    <span class="bank-field">จำนวนเงิน<span class="dotted"></span></span>
  </div>`
      : "";

  // ชิดขวาใต้ช่องลงชื่อ เฉพาะแผ่นสุดท้ายที่มียอดรวม ใบเสนอราคายังไม่ถึงตอนจ่ายเงินจึงไม่มี
  const paymentQrHtml = `<div class="qr-area"><div class="qr"><img class="pp" src="${PROMPTPAY_LOGO_SRC}" alt="พร้อมเพย์" /><img class="code" src="${PAYMENT_QR_SRC}" alt="QR รับเงิน" /><p class="name">${PAYMENT_QR_NAME}</p><p class="hint">สแกนเพื่อชำระเงิน</p></div></div>`;

  // คืนเฉพาะแผ่นกระดาษ เพื่อให้เอาไปต่อกับใบอื่นในเอกสารเดียวได้
  return pages.map(pageHtml).join("");
};

// โครงเอกสารกับสไตล์ใช้ร่วมกันทุกใบ จะได้ไม่ต้องก๊อปสไตล์ไปวางซ้ำเวลาพิมพ์หลายใบ
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
  .fields p.pair { display: grid; grid-template-columns: 60px minmax(0, 1.22fr) 74px 1fr; white-space: nowrap; }
  .fields .cut { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .fields .car-right { display: flex; align-items: flex-end; gap: 6px; white-space: nowrap; }
  .fields .car-right .v { white-space: nowrap; }
  .fields .fleet { flex: none; padding: 0 2px; text-align: center; font-weight: 600; white-space: nowrap; }
  table { width: 100%; border-collapse: collapse; table-layout: fixed; margin-top: 8px; font-size: inherit; }
  thead tr, tr.sum { background: #e5e7eb; }
  th, td { border: 1px solid #000; padding: 2px 4px; height: 22px; }
  th { font-weight: 600; text-align: center; }
  th.qty, td.qty { width: 62px; }
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
  /* สี่ช่องกว้างเท่ากัน แบ่งที่ว่างเท่าๆ กัน */
  .bank { display: flex; align-items: flex-end; gap: 8px; margin-top: 6px; }
  .bank-field { display: flex; align-items: flex-end; gap: 4px; flex: 1; white-space: nowrap; }
  .bank-field .dotted { flex: 1; }
  /* กลุ่ม QR เริ่มใต้ช่องลงชื่อ 8 จุด แล้วขยายเต็มที่ว่างที่เหลือจนถึงขอบล่าง บิลสั้นได้ QR ใหญ่ บิลแน่นได้เล็กลง
     แสดงครบชุดเสมอ (โลโก้ QR ชื่อร้าน บรรทัดสแกน) แผ่นสุดท้ายรับรายการได้ตาม QR_PAGE_LINES ให้ QR ไม่เล็กกว่า 22 มม.
     (บิล 10 รายการไม่มีส่วนลดยังจบในแผ่นเดียว)
     ขนาดคิดจากความสูงที่เหลือจริง (cqh): โลโก้สูง 0.2345 เท่าของ QR บวกระยะใต้โลโก้ ชื่อร้าน บรรทัดสแกน รวม 43px
     ต้องตรงกับ .receipt-qr ใน client/src/index.css */
  .receipt-fill { display: flex; flex-direction: column; }
  .receipt-fill .page-body { flex: none; }
  .qr-area { flex: 1 1 0; min-height: 0; padding-top: 8px; container-type: size; display: flex; justify-content: center; align-items: flex-start; }
  .qr { --q: calc((100cqh - 44px) / 1.2345); display: flex; flex-direction: column; align-items: center; white-space: nowrap; line-height: 1.25; }
  .qr .pp { display: block; width: calc(var(--q) * 0.7); height: auto; margin-bottom: 4px; }
  .qr .code { display: block; width: var(--q); height: var(--q); }
  .qr .name { margin: 2px 0 0; font-size: 11pt; font-weight: 600; }
  .qr .hint { margin: 0; font-size: 11pt; }
  .sign { display: flex; gap: 16px; margin-top: 22px; }
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

// ใบส่งของพิมพ์สองชุดในงานพิมพ์เดียว ต้นฉบับให้ลูกค้า สำเนาให้ลูกค้าเซ็นรับแล้วร้านเก็บไว้
// withCopy = false คือเอาเฉพาะต้นฉบับ (บันทึกเป็นรูปส่งให้ลูกค้า ไม่ต้องมีสำเนา)
const buildReceiptHtml = (repair, { withCopy = true, ...options } = {}) =>
  receiptDocument(
    `${receiptDocTitle(repair)} ${receiptDocNo(repair)}`,
    repair.status === "CREDIT"
      ? [
          receiptPagesHtml(repair, { ...options, copyLabel: "ต้นฉบับ" }),
          ...(withCopy
            ? [receiptPagesHtml(repair, { ...options, copyLabel: "สำเนา" })]
            : []),
        ].join("")
      : receiptPagesHtml(repair, options),
  );

// ช่างดูจากชนิดอะไหล่ ไม่ได้ดูยี่ห้อหรือรุ่น จึงตัดชื่อของช่วงล่างเหลือคำแรกของชื่อในคลัง
// (ตรงกับ workName ใน client/src/components/receipt/JobSheetPaper.jsx)
// หมวดที่อะไหล่ผูกกับรุ่นรถ ต้องตรงกับ VEHICLE_COMPATIBLE_CATEGORIES ฝั่งหน้าเว็บ
const VEHICLE_COMPATIBLE_CATEGORIES = [
  "ช่วงล่าง",
  "เบรก",
  "โช๊คอัพ",
  "ระบบส่งกำลัง",
  "กรอง",
  "ไส้กรอง",
];

// ใบที่ปิดชื่อเต็มแล้ว หมวดเหล่านี้ยังต้องมียี่ห้อ (ตรงกับ FULL_NAME_CATEGORIES ฝั่งหน้าเว็บ)
const FULL_NAME_CATEGORIES = ["ยาง", "ยางเปอร์เซ็นต์", "แบตเตอรี่"];

const workName = (item) => {
  // พิมพ์ชื่อทับไว้เอง = ตั้งใจให้ขึ้นแบบนั้น ไม่ต้องย่อทับ (ตรงกับ shortWorkName ฝั่งหน้าเว็บ)
  if (
    item.part?.name &&
    !String(item.itemName || "").includes(item.part.name)
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

  // น้ำมันส่วนใหญ่เป็นบรรทัดที่พิมพ์ชื่อเอง ดูจากชื่อแทนหมวดหมู่
  // เอาแค่ขนาดลิตรกับชื่อของ ตัดยี่ห้อ เกรด และของแถมพ่วงท้ายออกให้หมด
  // (ตรงกับ shortWorkName ฝั่งหน้าเว็บ)
  const name = String(item.itemName || "");
  if (name.includes("น้ำมัน")) {
    const thai = name.match(/[ก-๙][ก-๙+\s-]*[ก-๙]/);
    if (thai) {
      const base = thai[0].trim();
      const size = name.match(/\(\s*(\d+(?:\.\d+)?)\s*L\s*\)/i);
      if (base) return size ? `(${Number(size[1])}L) ${base}` : base;
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

// ใบสั่งซ่อมสำหรับช่าง: ทะเบียนตัวใหญ่สุด รายการงานมีช่องติ๊ก ไม่มีราคา
// (ตรงกับ client/src/components/receipt/JobSheetPaper.jsx แก้ต้องแก้คู่กัน)
const buildJobSheetHtml = (repair) => {
  const plate = repair.vehicle?.licensePlate;
  const plateText = plate?.plateNumber
    ? `${formatPlate(plate.plateNumber)} ${shortProvince(plate.province)}`.trim()
    : "";
  const model = repair.vehicle?.vehicleModel;
  const vehicleName = displayBrand(model);

  // ใบนี้เป็นใบของช่าง ไม่เกี่ยวกับเงิน ค่าแรงกับส่วนลดจึงไม่ต้องขึ้น
  // ช่างสองคนทำคนละฝั่ง จึงแบ่งงานเป็นท่อนตามฝั่ง (ตรงกับ JobSheetPaper ฝั่งหน้าเว็บ)
  const allItems = (repair.repairItems || []).filter((item) => {
    const name = item.service?.name || item.itemName;
    return name !== "ค่าแรง" && name !== "ส่วนลด" && item.itemName !== "ค่าแรง";
  });
  const hasSides = allItems.some(
    (item) => item.side === "LEFT" || item.side === "RIGHT",
  );
  const rows = mergeBySide(allItems);
  // แถวว่างท้ายตารางไว้เขียนงานที่เจอหน้างาน สองแถวเท่ากันทุกบิล
  const blankRows = 2;

  const workRow = ({ item, quantity, sideLabel }) => {
    const base = workName(item);
    const name = sideLabel ? `${base} (${sideLabel})` : base;
    return `<tr>
        <td class="tick"></td>
        <td class="wrap">${escapeHtml(name)}</td>
        <td class="qty">${escapeHtml(`${formatQuantity(quantity)} ${unitOf(item)}`.trim())}</td>
      </tr>`;
  };

  const groupRow = (label) =>
    `<tr><td colspan="3" class="group">${label}</td></tr>`;

  // ไม่มีรายละเอียดก็ไม่ต้องมีบรรทัดเปล่าให้รกใบ
  const noteBlock = repair.description
    ? `<div class="note">
    <p class="note-row"><span class="note-label">รายละเอียดการซ่อม</span><span class="dotted note-line">${escapeHtml(repair.description)}</span></p>
  </div>`
    : "";

  const itemRows = hasSides
    ? [
        {
          label: "ข้างซ้าย (L)",
          items: allItems.filter((i) => i.side === "LEFT"),
        },
        {
          label: "ข้างขวา (R)",
          items: allItems.filter((i) => i.side === "RIGHT"),
        },
        {
          label: "อื่นๆ",
          items: allItems.filter(
            (i) => i.side !== "LEFT" && i.side !== "RIGHT",
          ),
        },
      ]
        .filter((group) => group.items.length > 0)
        .map(
          (group) =>
            groupRow(group.label) +
            mergeBySide(group.items)
              .map((row) => workRow({ ...row, sideLabel: "" }))
              .join(""),
        )
        .join("")
    : rows.map(workRow).join("");

  const emptyRows = Array.from({ length: blankRows })
    .map(() => '<tr><td class="tick"></td><td></td><td></td></tr>')
    .join("");

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
    margin: 0; width: 148mm; height: 210mm; padding: 10mm; overflow: hidden;
    color: #000; background: #fff;
    font-family: "Athiti", "Sarabun", "Tahoma", sans-serif;
    font-size: 11pt; line-height: 1.25;
  }
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
  th.tick, td.tick { width: 36px; text-align: center; }
  th.qty, td.qty { width: 92px; text-align: center; }
  td.c { text-align: center; }
  td.wrap { word-break: break-word; }
  td.group { background: #e5e7eb; font-weight: 600; height: 26px; font-size: 16px; }
  /* รายละเอียดการซ่อมเป็นบรรทัดเดียว ข้อความชิดซ้ายเหมือนการเขียนมือ */
  .note { margin-top: 10px; font-size: 16px; }
  .note-row { display: flex; align-items: flex-end; gap: 6px; margin: 0; }
  .note-label { white-space: nowrap; font-weight: 600; }
  .note-line { flex: 1; text-align: left; }
</style>
</head>
<body>
  <div class="head">
    <p class="doc">ใบสั่งซ่อม</p>
    <p class="no">เลขที่<span class="dotted" style="min-width:42px;text-align:center;font-weight:600">${jobSheetNo(repair)}</span></p>
  </div>

  <div class="car">
    <div class="plate">${escapeHtml(plateText || "ไม่ระบุทะเบียนรถ")}${
      repair.vehicle?.fleetNo
        ? `<span style="margin-left:8px;font-size:16pt">เบอร์รถ ${escapeHtml(repair.vehicle.fleetNo)}</span>`
        : ""
    }</div>
    <div class="model">${escapeHtml(vehicleName)}</div>
  </div>

  <table>
    <thead>
      <tr><th class="tick">✓</th><th class="name">รายการ</th><th class="qty">จำนวน</th></tr>
    </thead>
    <tbody>
      ${itemRows}
      ${groupRow("เพิ่มเติม")}
      ${emptyRows}
    </tbody>
  </table>

  ${noteBlock}
</body>
</html>`;
};

const ORGANIZATION_LABELS = { GOVERNMENT: "หน่วยงาน", SHOP: "ร้านค้า" };

const formatThaiDate = (value) => {
  const date = new Date(value || Date.now());
  return date.toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

// คำเดียวกับหัวการ์ดในหน้าเว็บ (ดู getRepairTitle ใน client/src/utils/repairDisplay.js)
const repairTitle = (repair) => {
  if (repair.type === "SALE") return "ขายอะไหล่หน้าร้าน";
  if (!repair.vehicle) return "งานบริการ";

  // บริษัทที่มีรถหลายคันเรียกรถด้วยเบอร์ ฝ่ายบัญชีจะเทียบกับรายการของเขาได้ง่าย
  const fleet = repair.vehicle.fleetNo
    ? ` เบอร์รถ ${repair.vehicle.fleetNo}`
    : "";
  const plate = repair.vehicle.licensePlate;
  if (plate?.plateNumber) {
    return `${`${formatPlate(plate.plateNumber)} ${shortProvince(plate.province)}`.trim()}${fleet}`;
  }
  // รถที่ไม่มีทะเบียน บอกยี่ห้อกับรุ่นแทน จะได้ยังรู้ว่าเป็นคันไหน
  return `${displayBrand(repair.vehicle.vehicleModel) || "งานซ่อม"}${fleet}`;
};

// ใบวางบิลของหน่วยงานหรือร้านค้า: แผ่นเดียวจบ สรุปว่ามีบิลอะไรบ้างรวมเท่าไหร่
// (ใบเสร็จของแต่ละบิลพิมพ์แยกจากหน้าบิลนั้นได้อยู่แล้ว ไม่ต้องแนบมาด้วยทุกครั้ง)
const buildOrganizationBillHtml = (customer, repairs, billingNo) => {
  const total = repairs.reduce(
    (sum, repair) => sum + Number(repair.totalPrice || 0),
    0,
  );

  const rows = repairs
    .map(
      (repair) => `<tr>
        <td class="c" style="white-space:nowrap">${escapeHtml(repair.deliveryNo || repair.receiptNo || String(repair.id))}</td>
        <td class="c">${escapeHtml(formatThaiDate(repair.createdAt))}</td>
        <td>${escapeHtml(repairTitle(repair))}</td>
        <td class="r">${formatMoney(Number(repair.totalPrice || 0))}</td>
      </tr>`,
    )
    .join("");

  const summary = `<div class="receipt-paper">
  <div class="head">
    <span></span>
    <div class="title">
      <div class="doc">ใบวางบิล</div>
      <div class="shop">${SHOP.name}</div>
    </div>
    <p class="side">เลขที่<span class="dotted" style="min-width:42px;text-align:center;font-weight:600">${escapeHtml(billingNo || "")}</span></p>
  </div>

  <p class="center" style="margin:2px 0 0">${SHOP.address}</p>
  <p class="center" style="margin:0">${SHOP.contact}</p>

  <p style="margin:12px 0 0;display:flex;align-items:flex-end;gap:6px">ชื่อลูกค้า<span class="dotted" style="flex:1;text-align:center;font-weight:600">${escapeHtml(customer?.name || "")}</span><span style="white-space:nowrap">จำนวน ${repairs.length} บิล</span></p>

  <table style="margin-top:8px">
    <thead>
      <tr>
        <th style="width:112px">เลขที่</th>
        <th style="width:86px">วันที่</th>
        <th>รายการ</th>
        <th style="width:92px">จำนวนเงิน</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
      <tr class="sum">
        <td colspan="3">จำนวนเงินรวมทั้งสิ้น <span style="font-weight:600">${escapeHtml(bahtText(total))}</span></td>
        <td class="r" style="font-weight:600;font-size:13pt">${formatMoney(total)}</td>
      </tr>
    </tbody>
  </table>

</div>`;

  return receiptDocument(`ใบวางบิล ${customer?.name || ""}`.trim(), summary);
};

module.exports = {
  buildReceiptHtml,
  buildJobSheetHtml,
  buildOrganizationBillHtml,
};
