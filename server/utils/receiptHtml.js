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
    "โทร. 089-8492861, 093-3261705  เลขประจำตัวผู้เสียภาษี 3 33030032502 1",
};

const MIN_ROWS = 12;

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

const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

const formatMoney = (value) =>
  Number(value || 0).toLocaleString("th-TH", { maximumFractionDigits: 2 });

const formatQuantity = (value) => {
  const number = Number(value || 0);
  return Number.isInteger(number) ? String(number) : String(number);
};

// อะไหล่ที่ซื้อมาใช้เลยไม่มีของในคลัง จึงนับเป็นชิ้น ส่วนงานบริการไม่มีหน่วย
const unitOf = (item) => {
  if (item.part?.unit) return item.part.unit;
  const isPartLine = item.service?.name === "อะไหล่อื่นๆ";
  return isPartLine ? "ชิ้น" : "";
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
const buildReceiptHtml = (repair, { showCustomer = true } = {}) => {
  const issuedAt = new Date(repair.paidAt || repair.createdAt || Date.now());
  const day = issuedAt.getDate();
  const month = issuedAt.toLocaleDateString("th-TH", { month: "long" });
  const year = String(issuedAt.getFullYear() + 543).slice(-2);

  const plate = repair.vehicle?.licensePlate;
  const plateText = plate?.plateNumber
    ? `${formatPlate(plate.plateNumber)} ${plate.province || ""}`.trim()
    : "";
  const model = repair.vehicle?.vehicleModel;
  const vehicleName = model ? `${model.brand} ${model.model}`.trim() : "";

  const rows = mergeBySide(repair.repairItems || []);
  const blankRows = Math.max(0, MIN_ROWS - rows.length);
  const total = Number(repair.totalPrice || 0);

  const itemRows = rows
    .map(({ item, quantity, sideLabel }) => {
      const amount = Number(item.unitPrice) * quantity;
      const name = sideLabel
        ? `${item.itemName} (${sideLabel})`
        : item.itemName;
      return `<tr>
        <td class="c">${escapeHtml(`${formatQuantity(quantity)} ${unitOf(item)}`.trim())}</td>
        <td class="wrap">${escapeHtml(name)}</td>
        <td class="r">${formatMoney(item.unitPrice)}</td>
        <td class="r">${formatMoney(amount)}</td>
      </tr>`;
    })
    .join("");

  const emptyRows = Array.from({ length: blankRows })
    .map(() => "<tr><td></td><td></td><td></td><td></td></tr>")
    .join("");

  // ปิดข้อมูลลูกค้า = เว้นช่องไว้ ไม่เอาบรรทัดออก ใบจะได้หน้าตาเหมือนกันทุกครั้ง
  const customerFields = `<p>ชื่อลูกค้า<span class="dotted v">${
    showCustomer ? escapeHtml(repair.customer?.name || "") : ""
  }</span></p>
    <p>ที่อยู่<span class="dotted v">${
      showCustomer ? escapeHtml(repair.customer?.address || "") : ""
    }</span></p>
    <p>เลขประจำตัวผู้เสียภาษีอากร<span class="dotted v"></span></p>`;

  const paymentBoxes = PAYMENT_BOXES.map(
    (box) =>
      `<span class="pay"><span class="box">${
        box.method && repair.paymentMethod === box.method ? "✓" : ""
      }</span>${box.label}</span>`,
  ).join("");

  return `<!doctype html>
<html lang="th">
<head>
<meta charset="utf-8" />
<title>ใบเสร็จรับเงิน ${repair.id}</title>
<style>
  ${FONT_FACES}
  @page { size: A5 portrait; margin: 0; }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    width: 148mm;
    height: 210mm;
    padding: 10mm;
    overflow: hidden;
    color: #000;
    background: #fff;
    font-family: "Athiti", "Sarabun", "Tahoma", sans-serif;
    font-size: 11pt;
    line-height: 1.25;
  }
  .head { display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; }
  .head .side { white-space: nowrap; display: flex; align-items: flex-end; gap: 4px; }
  .dotted { border-bottom: 1px dotted #000; }
  .title { text-align: center; }
  .title .doc { font-size: 15pt; font-weight: 600; }
  .title .shop { font-size: 17pt; font-weight: 600; }
  .center { text-align: center; }
  .date-row { display: flex; justify-content: center; gap: 12px; margin-top: 8px; }
  .date-row span.v { min-width: 52px; text-align: center; font-weight: 600; }
  .fields { margin-top: 6px; }
  .fields p { display: flex; align-items: flex-end; gap: 6px; margin: 0 0 5px; }
  .fields .v { flex: 1; text-align: center; font-weight: 600; }
  table { width: 100%; border-collapse: collapse; table-layout: fixed; margin-top: 8px; font-size: inherit; }
  th, td { border: 1px solid #000; padding: 2px 4px; height: 22px; }
  th { font-weight: 600; text-align: center; }
  th.qty, td.qty { width: 62px; }
  th.unit, td.unit { width: 92px; white-space: nowrap; }
  th.amount, td.amount { width: 92px; }
  td.c { text-align: center; }
  td.r { text-align: right; }
  td.wrap { word-break: break-word; }
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
</style>
</head>
<body>
  <div class="head">
    <p class="side">เล่มที่<span class="dotted" style="width:70px"></span></p>
    <div class="title">
      <div class="doc">ใบเสร็จรับเงิน</div>
      <div class="shop">${SHOP.name}</div>
    </div>
    <p class="side">เลขที่<span class="dotted" style="min-width:42px;text-align:center;font-weight:600">${repair.id}</span></p>
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
      ${itemRows}
      ${emptyRows}
      <tr>
        <td colspan="2">จำนวนเงินรวมทั้งสิ้น <span class="sum-text">${escapeHtml(bahtText(total))}</span></td>
        <td class="c">จำนวนเงินรวม</td>
        <td class="r" style="font-weight:600">${formatMoney(total)}</td>
      </tr>
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
</body>
</html>`;
};

// ช่างดูจากชนิดอะไหล่ ไม่ได้ดูยี่ห้อหรือรุ่น จึงตัดชื่อของช่วงล่างเหลือคำแรกของชื่อในคลัง
// (ตรงกับ workName ใน client/src/components/receipt/JobSheetPaper.jsx)
const workName = (item) =>
  item.part?.category?.name === "ช่วงล่าง" && item.part?.name
    ? String(item.part.name).trim().split(/\s+/)[0]
    : item.itemName;

// ใบสั่งซ่อมสำหรับช่าง: ทะเบียนตัวใหญ่สุด รายการงานมีช่องติ๊ก ไม่มีราคา
// (ตรงกับ client/src/components/receipt/JobSheetPaper.jsx แก้ต้องแก้คู่กัน)
const buildJobSheetHtml = (repair) => {
  const plate = repair.vehicle?.licensePlate;
  const plateText = plate?.plateNumber
    ? `${formatPlate(plate.plateNumber)} ${plate.province || ""}`.trim()
    : "";
  const model = repair.vehicle?.vehicleModel;
  const vehicleName = model ? `${model.brand} ${model.model}`.trim() : "";

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
  const blankRows = hasSides ? 4 : Math.max(0, 10 - rows.length);

  const workRow = ({ item, quantity, sideLabel }) => {
    const base = workName(item);
    const name = sideLabel ? `${base} (${sideLabel})` : base;
    return `<tr>
        <td class="tick"></td>
        <td class="wrap">${escapeHtml(name)}</td>
        <td class="c">${escapeHtml(`${formatQuantity(quantity)} ${unitOf(item)}`.trim())}</td>
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
          label: "ฝั่งซ้าย (L)",
          items: allItems.filter((i) => i.side === "LEFT"),
        },
        {
          label: "ฝั่งขวา (R)",
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
  .head { display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; }
  .head .doc { font-size: 16pt; font-weight: 600; }
  .dotted { border-bottom: 1px dotted #000; display: inline-block; text-align: center; font-weight: 600; }
  .car { border: 2px solid #000; padding: 8px; margin-top: 6px; }
  .car .row { display: flex; align-items: flex-end; justify-content: space-between; gap: 12px; white-space: nowrap; }
  /* ทะเบียนกับยี่ห้อรุ่นสำคัญพอกันสำหรับช่าง จึงตัวเท่ากันทั้งคู่ */
  .car .plate, .car .model { font-size: 18pt; font-weight: 700; line-height: 1; }
  .car .model { min-width: 0; overflow: hidden; text-overflow: ellipsis; }
  .car .meta { display: flex; gap: 24px; margin-top: 6px; }
  h2 { font-size: 13pt; margin: 10px 0 4px; }
  table { width: 100%; border-collapse: collapse; table-layout: fixed; font-size: 12pt; margin-top: 10px; }
  th, td { border: 1px solid #000; padding: 4px 6px; height: 34px; }
  th { font-weight: 600; text-align: center; }
  th.tick, td.tick { width: 34px; }
  th.qty, td.qty { width: 96px; }
  td.c { text-align: center; }
  td.wrap { word-break: break-word; }
  td.group { background: #e5e7eb; font-weight: 600; height: 26px; }
  /* หมายเหตุเป็นเส้นบรรทัดให้เขียนต่อ ไม่ใช่กรอบ */
  .note { margin-top: 10px; }
  .note-row { display: flex; align-items: flex-end; gap: 6px; margin: 0; }
  .note-label { white-space: nowrap; font-weight: 600; }
  .note-line { flex: 1; text-align: left; }
  .sign { display: flex; gap: 16px; margin-top: 10px; }
  .sign p { display: flex; align-items: flex-end; gap: 4px; flex: 1; margin: 0; }
  .sign .dotted { flex: 1; }
</style>
</head>
<body>
  <div class="head">
    <p class="doc" style="margin:0">ใบสั่งซ่อม</p>
    <p style="margin:0">เลขที่ <span class="dotted" style="min-width:42px">${repair.id}</span></p>
  </div>

  <div class="car">
    <div class="row">
      <div class="plate">${escapeHtml(plateText || "ไม่ระบุทะเบียนรถ")}</div>
      <div class="model">${escapeHtml(vehicleName)}</div>
    </div>
  </div>

  <table>
    <thead>
      <tr><th class="tick">✓</th><th>รายการ</th><th class="qty">จำนวน</th></tr>
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

module.exports = { buildReceiptHtml, buildJobSheetHtml };
