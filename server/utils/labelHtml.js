const { FONT_FACES } = require("./receiptHtml");

// เครื่องพิมพ์ฉลากทั่วไปหัวพิมพ์ 203 dpi = 8 จุดต่อมิลลิเมตร
// วาดหน้าเว็บขนาดเท่าจำนวนจุดจริง 1 พิกเซล = 1 จุด ตัวหนังสือจะไม่เบลอตอนแปลงเป็นขาวดำ
const DOTS_PER_MM = 8;

const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const formatPrice = (value) =>
  Number(value || 0).toLocaleString("th-TH", { maximumFractionDigits: 2 });

// ยี่ห้ออยู่บรรทัดบน ชื่อสินค้าบรรทัดล่าง ยี่ห้อตัวเล็กกว่าให้ชื่อสินค้าเด่นกว่า (ขนาดเป็น em ย่อตามชื่อตอนชื่อยาว)
const nameHtml = (name, brand) => {
  const text = String(name ?? "");
  const prefix = String(brand ?? "").trim();
  if (!prefix || !text.startsWith(prefix)) return escapeHtml(text);
  const rest = text.slice(prefix.length).trim();
  return `<span class="brand">${escapeHtml(prefix)}</span>${rest ? ` ${escapeHtml(rest)}` : ""}`;
};

// ฉลากติดสินค้า เรียงบนลงล่าง:
// 1. แถบรหัสตัวเล็กด้านบน รหัสอะไหล่-รหัสร้านที่สั่ง-รหัสทุน (BP-0412-PMCEJ) ดูเป็นรหัสสินค้าก้อนเดียว ลูกค้าไม่สะดุดตา
// 2. ชื่อสินค้าตรงกลาง กินที่มากสุด (ย่อขนาดเองจนพอกล่อง)
// 3. ราคาขายพร้อมหน่วยด้านล่าง (คู่ละ 650 บาท) แยกจากรหัสคนละขอบ ไม่อ่านปนกัน
const buildLabelHtml = ({
  name,
  brand,
  partNumber,
  price,
  unit,
  costCode,
  supplierCode,
  widthMm = 60,
  heightMm = 40,
}) => {
  const width = widthMm * DOTS_PER_MM;
  const height = heightMm * DOTS_PER_MM;
  // ขนาดตัวหนังสือออกแบบไว้ที่ 60 x 40 มม. สติกเกอร์เล็กกว่าย่อตามด้านที่หดมากกว่า (40 x 20 เตี้ยกว่ากว้าง)
  const k = Math.min(width / (60 * DOTS_PER_MM), height / (40 * DOTS_PER_MM));
  const px = (value) => Math.round(value * k);
  // ตัวหนังสือเล็กต่ำกว่า 2 มม. (16 จุด) อ่านไม่ออกบนสติกเกอร์จริง
  const padX = 2 * DOTS_PER_MM;
  const padY = 1.5 * DOTS_PER_MM;
  const codeMax = px(60);
  // เส้นคั่นบนและล่างหนาเท่ากัน
  const line = Math.max(2, px(3));
  // รหัสร้านกับรหัสทุนติดกันเป็นก้อนเดียว (BP-0412-PMCEJ)
  const code = [partNumber, `${supplierCode || ""}${costCode || ""}`]
    .filter(Boolean)
    .map(escapeHtml)
    .join("-");

  return `<!doctype html>
<html lang="th">
<head>
<meta charset="utf-8" />
<style>
  ${FONT_FACES}
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { width: ${width}px; height: ${height}px; background: #fff; overflow: hidden; }
  body { font-family: "Athiti", sans-serif; color: #000; }
  .label {
    width: ${width}px; height: ${height}px; padding: ${padY}px ${padX}px;
    display: flex; flex-direction: column; gap: ${px(6)}px;
  }
  .code {
    font-weight: 600; font-size: ${codeMax}px; line-height: 1.1;
    letter-spacing: 1px; text-align: center; white-space: nowrap; overflow: hidden;
    border-bottom: ${line}px solid #000; padding-bottom: ${px(4)}px;
  }
  .name-box { flex: 1 1 auto; min-height: 0; display: flex; align-items: center; overflow: hidden; }
  .name {
    width: 100%; font-weight: 600; font-size: ${px(60)}px; line-height: 1.15;
    word-break: break-word; text-align: center;
    display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 3; overflow: hidden;
  }
  .brand { display: block; font-size: 0.65em; }
  .price-row {
    display: flex; align-items: baseline; justify-content: center; gap: ${px(8)}px;
    border-top: ${line}px solid #000; padding-top: 2px;
  }
  .price { font-weight: 600; font-size: ${px(56)}px; line-height: 1; }
  .baht { font-weight: 600; font-size: ${Math.max(18, px(28))}px; }
</style>
</head>
<body>
  <div class="label">
    ${code ? `<p class="code" data-max="${codeMax}" data-min="16">${code}</p>` : ""}
    <div class="name-box"><p class="name" data-max="${px(60)}" data-min="${Math.max(16, px(22))}">${nameHtml(name, brand)}</p></div>
    <div class="price-row">${
      unit ? `<span class="baht">${escapeHtml(unit)}ละ</span>` : ""
    }<span class="price">${formatPrice(price)}</span><span class="baht">บาท</span></div>
  </div>
</body>
</html>`;
};

module.exports = { buildLabelHtml, DOTS_PER_MM };
