// เลื่อนไปหาแถวที่เพิ่งเพิ่ม เพื่อให้เห็นชัดว่ามีของใหม่โผล่มาแล้วต้องกรอกตรงไหนต่อ
// รอ 1 จังหวะให้แถวใหม่ถูกวาดก่อน ไม่งั้นจะคำนวณตำแหน่งจากความสูงที่ยังไม่มีแถวนั้น
const SETTLE_MS = 200;

export const scrollToNewRow = (getElement, block = "center") => {
  setTimeout(() => {
    const el = typeof getElement === "function" ? getElement() : getElement;
    if (!el || typeof el.scrollIntoView !== "function") return;

    el.scrollIntoView({ behavior: "smooth", block });
  }, SETTLE_MS);
};
