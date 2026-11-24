// รหัสราคาทุนบนฉลาก: คำลับภาษาอังกฤษตัวไม่ซ้ำกัน ตัวที่ 1-9 แทนเลข 1-9
// คำลับ 9 ตัว = เลข 0 พิมพ์เป็นเลข 0 (ทุน 350 กับคำลับ "BLACKSMIT" = "AC0")
// คำลับ 10 ตัว = ตัวที่ 10 แทนเลข 0 (ทุน 350 กับคำลับ "BLACKHORSE" = "AKE")
// คำลับอยู่ใน .env (LABEL_COST_KEY) เท่านั้น ไม่อยู่ในโค้ดหรือหน้าเว็บ
const DIGITS = "1234567890";

// ตัวพิมพ์ใหญ่ล้วน พิมพ์คำลับตัวเล็กมาก็ใช้ได้ บนฉลากอ่านชัดกว่า
const keyLetters = () => {
  const key = String(process.env.LABEL_COST_KEY || "")
    .trim()
    .toUpperCase();
  if (!/^[A-Z]{9,10}$/.test(key) || new Set(key).size !== key.length) {
    return null;
  }
  if (key.length === 10) return [...key];
  // 9 ตัว: ช่องของเลข 0 เป็นเลข 0 เอง ห้ามมีตัว O ไม่งั้นบนฉลากแยกจากเลข 0 ไม่ออก
  if (key.includes("O")) return null;
  return [...key, "0"];
};

// คืน null ถ้ายังไม่ได้ตั้งคำลับหรือตั้งผิดรูปแบบ ให้ผู้เรียกแจ้งเตือนเอง
const encodeCostCode = (cost, letters = keyLetters()) => {
  if (!letters) return null;
  const digits = String(Math.round(Number(cost)));
  if (!/^\d+$/.test(digits)) return null;
  return [...digits].map((d) => letters[DIGITS.indexOf(d)]).join("");
};

module.exports = { encodeCostCode, keyLetters };
