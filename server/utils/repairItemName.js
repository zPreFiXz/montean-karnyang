const { formatTireSize } = require("./tireSize");

// snapshot ชื่อตอนบันทึก ต้องได้ข้อความเดียวกับการ์ดฝั่งหน้าเว็บ ไม่งั้นชื่อจะเปลี่ยนหลังลบอะไหล่
exports.buildPartItemName = (part) => {
  if (!part) return null;

  const attributes = part.attributes || null;
  // ต้องตรงกับ TIRE_CATEGORIES ฝั่งหน้าเว็บ ไม่งั้นชื่อในบิลจะไม่มีขนาดยางติดมา
  const isTire = ["ยาง", "ยางเปอร์เซ็นต์"].includes(part.category?.name);

  if (isTire) {
    const size = formatTireSize(attributes);
    // ยางมือสองไม่ได้ขายตามยี่ห้อหรือรุ่น ลูกค้าถามหาแค่ขนาด ชื่อจึงเป็นคำเดียวตามด้วยเบอร์
    // ต้องตรงกับ formatProductName ฝั่งหน้าเว็บ
    if (size && part.category?.name === "ยางเปอร์เซ็นต์") {
      return `ยางเปอร์เซ็นต์ ${size}`;
    }
    if (size) return [part.brand, size, part.name].filter(Boolean).join(" ");
  }

  return [part.brand, part.name].filter(Boolean).join(" ") || null;
};

exports.buildServiceItemName = (service) => service?.name || null;
