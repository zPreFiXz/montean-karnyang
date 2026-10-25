// ทุกเครื่องหมดอายุพร้อมกันตอนเริ่มงานวันจันทร์ ล็อกอินครั้งเดียวแล้วใช้ได้ทั้งสัปดาห์
// ไทยไม่มีเวลาออมแสง บวก 7 ชั่วโมงจาก UTC ได้ตรงเสมอ
const BANGKOK_OFFSET_MS = 7 * 60 * 60 * 1000;
const EXPIRY_WEEKDAY = 1;
const EXPIRY_HOUR = 6;
const EXPIRY_MINUTE = 30;

const nextSessionExpiry = (now = new Date()) => {
  const local = new Date(now.getTime() + BANGKOK_OFFSET_MS);
  const daysAhead = (EXPIRY_WEEKDAY - local.getUTCDay() + 7) % 7;

  const target = new Date(local);
  target.setUTCDate(local.getUTCDate() + daysAhead);
  target.setUTCHours(EXPIRY_HOUR, EXPIRY_MINUTE, 0, 0);
  if (target <= local) target.setUTCDate(target.getUTCDate() + 7);

  return new Date(target.getTime() - BANGKOK_OFFSET_MS);
};

module.exports = { nextSessionExpiry };
