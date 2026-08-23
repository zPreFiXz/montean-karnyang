// เซิร์ฟเวอร์อยู่ในวง LAN ตอบกลับเร็วมาก (ราว 50-100ms) ตัวหมุนบนปุ่มจึงกระพริบแวบเดียว
// จนคนกดไม่แน่ใจว่ากดติดหรือเปล่า — บังคับให้สถานะกำลังบันทึกอยู่อย่างน้อยเท่านี้
//
// ต่างจากการหน่วงตรงๆ ตรงที่งานจริงเดินไปพร้อมตัวจับเวลา ถ้างานใช้เวลานานกว่านี้ก็ไม่ถูกถ่วงเพิ่ม
const MIN_MS = 400;

export const withMinDuration = async (work, minMs = MIN_MS) => {
  const [result] = await Promise.all([
    typeof work === "function" ? work() : work,
    new Promise((resolve) => setTimeout(resolve, minMs)),
  ]);
  return result;
};
