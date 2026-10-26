export const keepDigits = (e) => {
  e.target.value = e.target.value.replace(/[^0-9]/g, "");
};

// ฐานข้อมูลเก็บสต็อกทศนิยม 2 ตำแหน่ง พิมพ์เกินจะถูกปัดตอนบันทึก จึงตัดตั้งแต่ตอนพิมพ์
export const cleanDecimal = (value) =>
  value
    .replace(/[^0-9.]/g, "")
    .replace(/(\..*)\./g, "$1")
    .replace(/^(\d*\.\d{0,2}).*$/, "$1");

export const keepDecimal = (e) => {
  e.target.value = cleanDecimal(e.target.value);
};

// ช่องตัวเลขของเบราว์เซอร์ไม่รับทศนิยมตอนกดบันทึก จึงใช้ช่องข้อความกับแป้นตัวเลขแทน
export const quantityInputProps = (allowDecimal) =>
  allowDecimal
    ? { type: "text", inputMode: "decimal", onInput: keepDecimal }
    : { type: "number", inputMode: "numeric", onInput: keepDigits };
