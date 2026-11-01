// ลำดับเดียวกับหน้าจัดการยี่ห้อและรุ่นรถ: ยี่ห้อตามที่โผล่ก่อนในลิสต์ แล้วตามลำดับรุ่นในยี่ห้อ
// models ต้องมาตาม sortOrder (ตามที่ listVehicleModels ส่งมา) ต้องตรงกับ server/utils/vehicleOrder.js
export const vehicleRanker = (models = []) => {
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

export const sortVehiclesByModelList = (vehicles, models) => {
  const rankOf = vehicleRanker(models);
  return [...vehicles].sort((a, b) => rankOf(a) - rankOf(b));
};
