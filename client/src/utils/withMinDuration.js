// เซิร์ฟเวอร์ในวง LAN ตอบเร็วจนตัวหมุนกระพริบแวบเดียว จึงบังคับให้หมุนอย่างน้อยเท่านี้
// งานจริงเดินไปพร้อมตัวจับเวลา งานที่นานกว่านี้ไม่ถูกถ่วงเพิ่ม
const MIN_MS = 400;

export const withMinDuration = async (work, minMs = MIN_MS) => {
  const [result] = await Promise.all([
    typeof work === "function" ? work() : work,
    new Promise((resolve) => setTimeout(resolve, minMs)),
  ]);
  return result;
};
