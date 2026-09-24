const fs = require("fs");
const path = require("path");
const { bahtText } = require("./bahtText");

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

// เรียกว่าใบเสร็จรับเงินได้เฉพาะตอนรับเงินแล้วจริง
// ใบประเมินราคา = ยังไม่ได้ซ่อม เป็นใบเสนอราคา / เครดิต = ซ่อมแล้วแต่ยังไม่ได้เงิน เป็นใบส่งของ
const receiptDocTitle = (repair) => {
  if (repair.status === "ESTIMATE") return "ใบเสนอราคา";
  if (repair.status === "CREDIT") return "ใบส่งของ";
  return "ใบเสร็จรับเงิน";
};

const PAYMENT_BOXES = [
  { label: "เงินสด", method: "CASH" },
  { label: "สแกนจ่าย", method: "QR_CODE" },
  { label: "บัตรเครดิต", method: "CREDIT_CARD" },
  { label: "เช็ค", method: null },
];

// ทะเบียนเก็บเป็น "กษ 9037" แต่แสดงคั่นด้วยขีด ให้ตรงกับที่หน้าเว็บแสดง
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

// งานที่คิดครั้งเดียวต่อคันเว้นช่องจำนวนไว้ (ตรงกับ SINGLE_QUANTITY_SERVICE_NAMES ฝั่งหน้าเว็บ)
// บิลเก่าที่เคยใส่เกินหนึ่งยังต้องเขียน ไม่งั้นราคาต่อหน่วยกับจำนวนเงินจะไม่ตรงกัน
const SINGLE_QUANTITY_SERVICE_NAMES = ["ค่าแรง", "ตั้งศูนย์", "สลับยาง+ถ่วงล้อ"];
const quantityLabel = (item, quantity) =>
  SINGLE_QUANTITY_SERVICE_NAMES.includes(item.service?.name) && quantity === 1
    ? ""
    : `${formatQuantity(quantity)} ${unitOf(item)}`.trim();

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
  { showCustomer = true, showBrand = true } = {},
) => {
  // ชื่อเอกสารเปลี่ยนตามสถานะ (ตรงกับ receiptDocTitle ฝั่งหน้าเว็บ)
  const docTitle = receiptDocTitle(repair);
  const issuedAt = new Date(repair.paidAt || repair.createdAt || Date.now());
  const day = issuedAt.getDate();
  const month = issuedAt.toLocaleDateString("th-TH", { month: "long" });
  const year = String(issuedAt.getFullYear() + 543).slice(-2);

  const plate = repair.vehicle?.licensePlate;
  const plateText = plate?.plateNumber
    ? `${formatPlate(plate.plateNumber)} ${plate.province || ""}`.trim()
    : "";
  const model = repair.vehicle?.vehicleModel;
  const vehicleName = displayBrand(model);

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
  // บิลที่มีรายการเกินหนึ่งหน้าให้แยกเป็นใบต่อไป แผ่นละ MIN_ROWS บรรทัด
  // ยอดรวมกับส่วนลดอยู่แผ่นสุดท้ายแผ่นเดียว (ตรงกับ buildReceiptPages ฝั่งหน้าเว็บ)
  const pages = [];
  for (
    let start = 0;
    start < rows.length || pages.length === 0;
    start += MIN_ROWS
  ) {
    pages.push(rows.slice(start, start + MIN_ROWS));
  }

  const summaryRows = discountItems.length ? discountItems.length + 1 : 1;
  if (pages[pages.length - 1].length + summaryRows > MIN_ROWS) pages.push([]);
  // ยอดในบิลหักส่วนลดไปแล้ว ยอดก่อนหักจึงต้องบวกกลับ (ส่วนลดเก็บเป็นเลขติดลบ)
  const total = Number(repair.totalPrice || 0);
  const subtotal = total - discountTotal;

  const rowHtml = ({ item, quantity, sideLabel }) => {
    const amount = Number(item.unitPrice) * quantity;
    const base = showBrand ? item.itemName : workName(item);
    const name = sideLabel ? `${base} (${sideLabel})` : base;
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
  const customerFields = `<p>ชื่อลูกค้า<span class="dotted v">${
    showCustomer ? escapeHtml(repair.customer?.name || "") : ""
  }</span></p>
    <p>ที่อยู่<span class="dotted v">${
      showCustomer ? escapeHtml(repair.customer?.address || "") : ""
    }</span></p>
    <p>เลขประจำตัวผู้เสียภาษีอากร<span class="dotted v">${
      showCustomer ? escapeHtml(repair.customer?.taxId || "") : ""
    }</span></p>`;

  // เนื้อของกระดาษหนึ่งแผ่น เรียกซ้ำตามจำนวนหน้า
  const pageHtml = (pageRows, pageIndex) => {
    const isLastPage = pageIndex === pages.length - 1;
    const blankRows = Math.max(
      0,
      MIN_ROWS - pageRows.length - (isLastPage ? summaryRows : 0),
    );
    const emptyRows = Array.from({ length: blankRows })
      .map(() => "<tr><td></td><td></td><td></td><td></td></tr>")
      .join("");
    // บิลหลายแผ่นเขียนเลขต่อเนื่องแบบ 122/1 122/2 ตามแบบเอกสารต่อเนื่องของไทย
    const receiptNo =
      pages.length > 1 ? `${repair.id}/${pageIndex + 1}` : repair.id;

    return `<div class="receipt-paper">
  <div class="head">
    <p class="side">เล่มที่<span class="dotted" style="width:70px"></span></p>
    <div class="title">
      <div class="doc">${docTitle}</div>
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
    <p>ยี่ห้อ-รุ่นรถ<span class="dotted v">${escapeHtml(vehicleName)}</span>ทะเบียนรถ<span class="dotted v">${escapeHtml(plateText)}</span></p>
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

  <div class="pays">${paymentBoxes}</div>

  <div class="bank">
    <span class="bank-field">ธนาคาร<span class="dotted"></span></span>
    <span class="bank-field">เลขที่<span class="dotted"></span></span>
    <span class="bank-field">ลงวันที่<span class="dotted"></span></span>
    <span class="bank-field">จำนวนเงิน<span class="dotted"></span></span>
  </div>

  <div class="sign">
    <p>ลงชื่อ<span class="dotted" style="flex:1"></span>ผู้รับเงิน</p>
    <p>ลงชื่อ<span class="dotted" style="flex:1"></span>ผู้จ่ายเงิน</p>
  </div>
</div>`;
  };

  const paymentBoxes = PAYMENT_BOXES.map(
    (box) =>
      `<span class="pay"><span class="box">${
        box.method && repair.paymentMethod === box.method ? "✓" : ""
      }</span>${box.label}</span>`,
  ).join("");

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
  .head { display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; }
  .head .side { white-space: nowrap; display: flex; align-items: flex-end; gap: 4px; }
  .dotted { border-bottom: 1px dotted #000; }
  .title { text-align: center; }
  .title .doc { font-size: 15pt; font-weight: 600; }
  .title .shop { font-size: 17pt; font-weight: 600; }
  .center { text-align: center; }
  .date-row { display: flex; justify-content: flex-end; gap: 12px; margin-top: 8px; }
  .date-row span.v { min-width: 52px; text-align: center; font-weight: 600; }
  .fields { margin-top: 6px; }
  .fields p { display: flex; align-items: flex-end; gap: 6px; margin: 0 0 5px; }
  .fields .v { flex: 1; text-align: center; font-weight: 600; }
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

const buildReceiptHtml = (repair, options) =>
  receiptDocument(
    `${receiptDocTitle(repair)} ${repair.id}`,
    receiptPagesHtml(repair, options),
  );

// ช่างดูจากชนิดอะไหล่ ไม่ได้ดูยี่ห้อหรือรุ่น จึงตัดชื่อของช่วงล่างเหลือคำแรกของชื่อในคลัง
// (ตรงกับ workName ใน client/src/components/receipt/JobSheetPaper.jsx)
// หมวดที่อะไหล่ผูกกับรุ่นรถ ต้องตรงกับ VEHICLE_COMPATIBLE_CATEGORIES ฝั่งหน้าเว็บ
const VEHICLE_COMPATIBLE_CATEGORIES = [
  "ช่วงล่าง",
  "เบรค",
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
    ? `${formatPlate(plate.plateNumber)} ${plate.province || ""}`.trim()
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
<title>ใบสั่งซ่อม ${repair.id}</title>
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
    <p class="no">เลขที่<span class="dotted" style="min-width:42px;text-align:center;font-weight:600">${repair.id}</span></p>
  </div>

  <div class="car">
    <div class="plate">${escapeHtml(plateText || "ไม่ระบุทะเบียนรถ")}</div>
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

  const plate = repair.vehicle?.licensePlate;
  if (plate?.plateNumber) {
    return `${formatPlate(plate.plateNumber)} ${plate.province || ""}`.trim();
  }
  // รถที่ไม่มีทะเบียน บอกยี่ห้อกับรุ่นแทน จะได้ยังรู้ว่าเป็นคันไหน
  return displayBrand(repair.vehicle?.vehicleModel) || "งานซ่อม";
};

// ใบวางบิลของหน่วยงานหรือร้านค้า: แผ่นเดียวจบ สรุปว่ามีบิลอะไรบ้างรวมเท่าไหร่
// (ใบเสร็จของแต่ละบิลพิมพ์แยกจากหน้าบิลนั้นได้อยู่แล้ว ไม่ต้องแนบมาด้วยทุกครั้ง)
const buildOrganizationBillHtml = (customer, repairs) => {
  const total = repairs.reduce(
    (sum, repair) => sum + Number(repair.totalPrice || 0),
    0,
  );

  const rows = repairs
    .map(
      (repair) => `<tr>
        <td class="c">${repair.id}</td>
        <td class="c">${escapeHtml(formatThaiDate(repair.createdAt))}</td>
        <td>${escapeHtml(repairTitle(repair))}</td>
        <td class="r">${formatMoney(Number(repair.totalPrice || 0))}</td>
      </tr>`,
    )
    .join("");

  const summary = `<div class="receipt-paper">
  <div class="head" style="justify-content:center">
    <div class="title">
      <div class="doc">ใบวางบิล</div>
      <div class="shop">${SHOP.name}</div>
    </div>
  </div>

  <p class="center" style="margin:2px 0 0">${SHOP.address}</p>
  <p class="center" style="margin:0">${SHOP.contact}</p>

  <p style="margin:12px 0 0;display:flex;align-items:flex-end;gap:6px">ชื่อลูกค้า<span class="dotted" style="flex:1;text-align:center;font-weight:600">${escapeHtml(customer?.name || "")}</span><span style="white-space:nowrap">จำนวน ${repairs.length} บิล</span></p>

  <table style="margin-top:8px">
    <thead>
      <tr>
        <th style="width:52px">เลขที่</th>
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
