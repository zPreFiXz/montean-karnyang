const { FONT_FACES } = require("./receiptHtml");
const { encodeCode128 } = require("./code128");

// เครื่องพิมพ์ฉลากทั่วไปหัวพิมพ์ 203 dpi = 8 จุดต่อมิลลิเมตร
// วาดหน้าเว็บขนาดเท่าจำนวนจุดจริง 1 พิกเซล = 1 จุด แท่งบาร์โค้ดจะไม่เบลอตอนแปลงเป็นขาวดำ
const DOTS_PER_MM = 8;

const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const formatPrice = (value) =>
  Number(value || 0).toLocaleString("th-TH", { maximumFractionDigits: 2 });

// แท่งกว้าง 2 จุด (0.25 มม.) สแกนง่ายสุด รหัสยาวจนไม่พอค่อยลดเหลือ 1 จุด ยังไม่พอก็ไม่พิมพ์บาร์โค้ด
const QUIET_ZONE_MODULES = 10;
const barcodeSvg = (text, maxWidth, height) => {
  const widths = encodeCode128(text);
  if (!widths) return "";

  const modules = widths.reduce((sum, w) => sum + w, 0);
  const moduleDots = [2, 1].find(
    (dots) => (modules + QUIET_ZONE_MODULES * 2) * dots <= maxWidth,
  );
  if (!moduleDots) return "";

  let x = 0;
  const bars = widths
    .map((w, i) => {
      const rect =
        i % 2 === 0
          ? `<rect x="${x * moduleDots}" y="0" width="${w * moduleDots}" height="${height}"/>`
          : "";
      x += w;
      return rect;
    })
    .join("");
  const width = modules * moduleDots;

  return `<svg class="barcode" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" shape-rendering="crispEdges">${bars}</svg>`;
};

// ฉลากติดสินค้า: ชื่อ (ย่อขนาดเองให้พอสองบรรทัด) บาร์โค้ดรหัสอะไหล่ และราคาขาย
const buildLabelHtml = ({
  name,
  partNumber,
  price,
  showPrice = true,
  widthMm = 60,
  heightMm = 40,
}) => {
  const width = widthMm * DOTS_PER_MM;
  const height = heightMm * DOTS_PER_MM;
  const padX = 2 * DOTS_PER_MM;
  const padY = 1.5 * DOTS_PER_MM;
  const barcode = barcodeSvg(partNumber, width - padX * 2, 64);

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
    display: flex; flex-direction: column; gap: 6px;
  }
  .name-box { flex: 1 1 auto; min-height: 0; display: flex; align-items: center; overflow: hidden; }
  .name {
    width: 100%; font-weight: 600; font-size: 56px; line-height: 1.15;
    word-break: break-word; text-align: center;
    display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 3; overflow: hidden;
  }
  .code { display: flex; flex-direction: column; align-items: center; }
  .barcode { display: block; }
  .barcode rect { fill: #000; }
  .part-number { font-weight: 600; font-size: ${barcode ? 24 : 32}px; line-height: 1.1; letter-spacing: 1px; }
  .price-row {
    display: flex; align-items: baseline; justify-content: center; gap: 8px;
    border-top: 3px solid #000; padding-top: 2px;
  }
  .price { font-weight: 600; font-size: 52px; line-height: 1; }
  .baht { font-weight: 600; font-size: 28px; }
</style>
</head>
<body>
  <div class="label">
    <div class="name-box"><p class="name">${escapeHtml(name)}</p></div>
    ${
      partNumber
        ? `<div class="code">${barcode}<p class="part-number">${escapeHtml(partNumber)}</p></div>`
        : ""
    }
    ${
      showPrice
        ? `<div class="price-row"><span class="price">${formatPrice(price)}</span><span class="baht">บาท</span></div>`
        : ""
    }
  </div>
</body>
</html>`;
};

module.exports = { buildLabelHtml, DOTS_PER_MM };
