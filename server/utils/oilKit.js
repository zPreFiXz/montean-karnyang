// ชุดน้ำมันไม่มีสต็อกของตัวเอง สต็อกคิดจากน้ำมันที่เหลือในตัวเก็บ เตือนที่ตัวเก็บที่เดียว
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
