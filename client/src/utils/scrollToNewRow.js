// รอให้แถวใหม่ถูกวาดก่อน ไม่งั้นคำนวณตำแหน่งจากความสูงที่ยังไม่มีแถวนั้น
const SETTLE_MS = 200;

export const scrollToNewRow = (getElement, block = "center") => {
  setTimeout(() => {
    const el = typeof getElement === "function" ? getElement() : getElement;
    if (!el || typeof el.scrollIntoView !== "function") return;

    el.scrollIntoView({ behavior: "smooth", block });
  }, SETTLE_MS);
};
