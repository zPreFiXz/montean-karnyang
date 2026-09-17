// ลูกค้าที่เปิดบิลเครดิตประจำ แยกเป็นสองแบบตามที่ร้านใช้เรียกกันจริง
export const ORGANIZATION_TYPES = [
  { value: "GOVERNMENT", label: "หน่วยงาน" },
  { value: "SHOP", label: "ร้านค้า" },
];

export const organizationLabel = (type) =>
  ORGANIZATION_TYPES.find((item) => item.value === type)?.label || "";
