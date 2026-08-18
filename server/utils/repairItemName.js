// ชื่อรายการซ่อมถูกเก็บเป็น snapshot ตอนบันทึก เพราะอะไหล่ถูกลบได้แล้วประวัติต้องยังอ่านรู้เรื่อง
// ต้องได้ข้อความเดียวกับที่การ์ดฝั่งหน้าจอประกอบขึ้น (RepairItemCard) ไม่งั้นชื่อจะเปลี่ยนหลังลบอะไหล่
exports.buildPartItemName = (part) => {
  if (!part) return null;

  const attributes = part.attributes || null;
  const isTire = part.category?.name === "ยาง";

  if (isTire && attributes?.width && attributes?.rimDiameter) {
    const size = attributes.aspectRatio
      ? `${attributes.width}/${attributes.aspectRatio}R${attributes.rimDiameter}`
      : `${attributes.width}R${attributes.rimDiameter}`;
    return [part.brand, size, part.name].filter(Boolean).join(" ");
  }

  return [part.brand, part.name].filter(Boolean).join(" ") || null;
};

exports.buildServiceItemName = (service) => service?.name || null;
