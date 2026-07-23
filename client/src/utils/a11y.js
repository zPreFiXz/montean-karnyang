// ทำให้ element ที่ไม่ใช่ปุ่ม (เช่น div การ์ดที่คลิกได้) กดด้วย Enter/Space ได้
// ตามมาตรฐาน WAI-ARIA button — ใช้คู่กับ role="button" tabIndex={0}
export const onKeyActivate = (handler) => (event) => {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    handler(event);
  }
};
