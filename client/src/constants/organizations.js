// ลูกค้าที่เปิดบิลเครดิตประจำ แยกเป็นสองแบบตามที่ร้านใช้เรียกกันจริง
export const ORGANIZATION_TYPES = [
  { value: "GOVERNMENT", label: "หน่วยงาน" },
  { value: "SHOP", label: "ร้านค้า" },
];

export const organizationLabel = (type) =>
  ORGANIZATION_TYPES.find((item) => item.value === type)?.label || "";

// กองย่อยในหน้าเครดิตของแต่ละประเภท ว่าง = ลูกค้าทั่วไป
export const creditPathFor = (organizationType) => {
  if (organizationType === "GOVERNMENT")
    return "/organizations?type=government";
  if (organizationType === "SHOP") return "/organizations?type=shop";
  return "/organizations?type=general";
};
