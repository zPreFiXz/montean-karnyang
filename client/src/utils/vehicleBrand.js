export const OTHER_BRAND = "อื่นๆ";

// ยี่ห้อเรียงตาม id ในฐานข้อมูล ตรึงไว้อย่างเดียวคือ "อื่นๆ" ให้อยู่ท้ายเสมอ
export const withOtherBrandLast = (brands = []) => [
  ...brands.filter((b) => b !== OTHER_BRAND),
  ...brands.filter((b) => b === OTHER_BRAND),
];
