import { CUSTOMER_FIELDS } from "@/constants/billForm";

// onCustomerField = ช่องที่ผิดอยู่ในกล่องข้อมูลลูกค้า ให้หน้านั้นกางกล่องออกก่อน
export const focusFirstInvalid = (errs, onCustomerField) => {
  const firstErrorField = Object.keys(errs || {})[0];
  if (!firstErrorField) return;

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

// พาไปช่องที่ผิดที่อยู่บนสุดของหน้า คืน false เมื่อช่องที่ผิดถูกซ่อนอยู่ทั้งหมด
export const focusTopmostInvalid = (errs) => {
  const visible = Object.keys(errs || {})
    .map((field) => document.querySelector(`[name="${field}"]`))
    .filter((el) => el && el.offsetParent !== null);
  if (visible.length === 0) return false;

  const first = visible.reduce((prev, curr) =>
    prev.getBoundingClientRect().top < curr.getBoundingClientRect().top
      ? prev
      : curr,
  );
  first.focus?.({ preventScroll: true });
  first.scrollIntoView({
    block: "center",
    inline: "nearest",
    behavior: "smooth",
  });
  return true;
};
