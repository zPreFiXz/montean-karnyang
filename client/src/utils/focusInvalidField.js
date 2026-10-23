import { CUSTOMER_FIELDS } from "@/constants/billForm";

// กดบันทึกแล้วช่องที่ผิดอาจอยู่นอกจอ พาไปหาช่องแรกที่ผิด (ใช้ในหน้าเปิดบิล)
// onCustomerField = ช่องที่ผิดอยู่ในกล่องข้อมูลลูกค้า ให้หน้านั้นกางกล่องออกก่อน
export const focusFirstInvalid = (errs, onCustomerField) => {
  const firstErrorField = Object.keys(errs || {})[0];
  if (!firstErrorField) return;

  // ช่องที่ผิดอาจอยู่ในกล่องข้อมูลลูกค้าที่พับไว้ ถ้าไม่กางออกก่อน
  // การโฟกัสจะไม่เห็นอะไรเลย คนใช้จะงงว่ากดปุ่มแล้วไม่มีอะไรเกิดขึ้น
  if (CUSTOMER_FIELDS.includes(firstErrorField)) {
    onCustomerField?.();
  }

  setTimeout(() => {
    const el = document.querySelector(`[name="${firstErrorField}"]`);
    const isVisible = el && el.type !== "hidden" && el.offsetParent !== null;
    const target = isVisible ? el : el?.parentElement || null;
    if (!target) return;

    // preventScroll สำคัญ — โดยปริยาย focus() จะกระโดดไปหาช่องทันที
    // แล้วการเลื่อนแบบนุ่มที่ตามมาก็ไม่เหลืออะไรให้เลื่อน ภาพที่เห็นคือเด้งพรึบ
    if (isVisible) el.focus?.({ preventScroll: true });
    target.scrollIntoView({
      block: "center",
      inline: "nearest",
      behavior: "smooth",
    });
  }, 200);
};
