const TIMEZONE = "Asia/Bangkok";

// sv-SE ให้รูปแบบ "2026-08-05 06:25:13" ซึ่งอ่านง่ายและเรียงตามตัวอักษรได้ตรงกับเรียงตามเวลา
// ใช้เวลาไทยเสมอ ไม่อิงโซนเวลาของเครื่องที่รัน — จะได้เทียบกับตารางร้านและข้อความ Telegram ได้ตรงกัน
const timestamp = () =>
  new Intl.DateTimeFormat("sv-SE", {
    timeZone: TIMEZONE,
    dateStyle: "short",
    timeStyle: "medium",
  }).format(new Date());

const write = (fn, tag, args) => fn(`${timestamp()} [${tag}]`, ...args);

const log = {
  info: (tag, ...args) => write(console.log, tag, args),
  warn: (tag, ...args) => write(console.warn, tag, args),
  error: (tag, ...args) => write(console.error, tag, args),
};

module.exports = { log };
