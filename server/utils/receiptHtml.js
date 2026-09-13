const { bahtText } = require("./bahtText");

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

const buildReceiptHtml = (repair) => {
  const issuedAt = new Date(repair.paidAt || repair.createdAt || Date.now());
  const day = issuedAt.getDate();
  const month = issuedAt.toLocaleDateString("th-TH", { month: "long" });
  const year = String(issuedAt.getFullYear() + 543).slice(-2);

  const plate = repair.vehicle?.licensePlate;
  const plateText = plate?.plateNumber
    ? `${plate.plateNumber} ${plate.province || ""}`.trim()
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
    font-size: 9.5pt;
    line-height: 1.25;
  }
  .head { display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; }
  .head .side { white-space: nowrap; display: flex; align-items: flex-end; gap: 4px; }
  .dotted { border-bottom: 1px dotted #000; }
  .title { text-align: center; }
  .title .doc { font-size: 13pt; font-weight: 600; }
  .title .shop { font-size: 15pt; font-weight: 600; }
  .center { text-align: center; }
  .date-row { display: flex; justify-content: center; gap: 12px; margin-top: 8px; }
  .date-row span.v { min-width: 52px; text-align: center; font-weight: 600; }
  .fields { margin-top: 6px; }
  .fields p { display: flex; align-items: flex-end; gap: 6px; margin: 0 0 5px; }
  .fields .v { flex: 1; text-align: center; font-weight: 600; }
  table { width: 100%; border-collapse: collapse; table-layout: fixed; margin-top: 8px; }
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
  .bank { display: flex; align-items: flex-end; gap: 6px; margin-top: 6px; }
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
    <p>ชื่อลูกค้า<span class="dotted v">${escapeHtml(repair.customer?.name || "")}</span></p>
    <p>ที่อยู่<span class="dotted v">${escapeHtml(repair.customer?.address || "")}</span></p>
    <p>เลขประจำตัวผู้เสียภาษีอากร<span class="dotted v"></span></p>
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
    ธนาคาร<span class="dotted" style="width:110px"></span>
    เลขที่<span class="dotted" style="width:80px"></span>
    ลงวันที่<span class="dotted" style="width:80px"></span>
    จำนวนเงิน<span class="dotted" style="flex:1"></span>
  </div>

  <div class="sign">
    <p>ลงชื่อ<span class="dotted" style="flex:1"></span>ผู้รับเงิน</p>
    <p>ลงชื่อ<span class="dotted" style="flex:1"></span>ผู้จ่ายเงิน</p>
  </div>
</body>
</html>`;
};

module.exports = { buildReceiptHtml };
