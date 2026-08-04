const TIMEZONE = "Asia/Bangkok";

const formatThaiDate = (value) =>
  new Date(value).toLocaleDateString("th-TH", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: TIMEZONE,
  });

const formatThaiTime = (value) =>
  new Date(value).toLocaleTimeString("th-TH", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: TIMEZONE,
  });

const getDateKey = (value) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));

const getDayRange = (dateKey) => ({
  start: new Date(`${dateKey}T00:00:00+07:00`),
  end: new Date(`${dateKey}T23:59:59.999+07:00`),
});

const getMinuteOfDay = (value) => {
  const [h = 0, m = 0] = new Intl.DateTimeFormat("en-GB", {
    timeZone: TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    // ระบุ h23 ให้ชัด: hour12:false บาง ICU คืน "24" แทน "00" ตอนเที่ยงคืน
    // ตอนนี้ worker ปิด 18:05 จึงยังไม่เจอเคสนี้ แต่กันไว้เผื่อเปลี่ยนไปรันค้าง 24 ชม.
    hourCycle: "h23",
  })
    .format(new Date(value))
    .split(":")
    .map(Number);

  return h * 60 + m;
};

module.exports = {
  formatThaiDate,
  formatThaiTime,
  getDateKey,
  getDayRange,
  getMinuteOfDay,
};
