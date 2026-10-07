// ชุดน้ำมันเครื่องไม่มีสต็อกของตัวเอง สต็อกที่หน้าเว็บเห็นจึงคิดจากน้ำมันที่เหลือในตัวเก็บ
// เช่นน้ำมันเหลือ 15 ลิตร ชุด 7 ลิตรขายได้อีก 2 ชุด หน้าเปิดบิลจะได้กันเบิกเกินของจริง
// ไม่ตั้งสต็อกขั้นต่ำของชุด เตือนที่ตัวเก็บน้ำมันที่เดียว
const OIL_SOURCE_SELECT = {
  select: {
    id: true,
    brand: true,
    name: true,
    unit: true,
    stockQuantity: true,
  },
};

const withOilKitStock = (part) => {
  if (!part?.oilSourceId || !part.oilSource || !part.oilLiters) return part;
  const litres = Number(part.oilSource.stockQuantity) || 0;
  return {
    ...part,
    stockQuantity: Math.max(0, Math.floor(litres / Number(part.oilLiters))),
    minStockLevel: 0,
  };
};

module.exports = { OIL_SOURCE_SELECT, withOilKitStock };
