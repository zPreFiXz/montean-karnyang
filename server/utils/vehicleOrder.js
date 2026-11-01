const prisma = require("../config/prisma");

// ลำดับเดียวกับหน้าจัดการยี่ห้อและรุ่นรถ: ยี่ห้อตามที่โผล่ก่อนในลิสต์ แล้วตามลำดับรุ่นในยี่ห้อ
// ต้องตรงกับ vehicleRanker ใน client/src/utils/vehicleOrder.js
const vehicleRanker = (models) => {
  const brands = [];
  const ranks = new Map();
  models.forEach((item, index) => {
    if (!brands.includes(item.brand)) brands.push(item.brand);
    ranks.set(`${item.brand}|${item.model}`, index);
  });
  return (vehicle) => {
    const brandIndex = brands.indexOf(vehicle?.brand);
    const modelIndex = ranks.get(`${vehicle?.brand}|${vehicle?.model}`);
    return (
      (brandIndex === -1 ? brands.length : brandIndex) * 1e6 +
      (modelIndex ?? models.length)
    );
  };
};

// เรียงตอนส่งออก รุ่นที่บันทึกก่อนสลับลำดับในหน้าจัดการรุ่นรถก็ขึ้นตามลำดับใหม่
const loadVehicleSorter = async () => {
  const models = await prisma.vehicleModel.findMany({
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    select: { brand: true, model: true },
  });
  const rankOf = vehicleRanker(models);
  return (vehicles) =>
    Array.isArray(vehicles)
      ? [...vehicles].sort((a, b) => rankOf(a) - rankOf(b))
      : vehicles;
};

module.exports = { loadVehicleSorter };
