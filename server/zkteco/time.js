const BANGKOK_TZ = "Asia/Bangkok";
const THAI_DATE_OPTS = {
  year: "numeric",
  month: "long",
  day: "numeric",
  timeZone: BANGKOK_TZ,
};
const THAI_TIME_OPTS = {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: BANGKOK_TZ,
};

const toDate = (dateInput) => new Date(dateInput);
const formatThaiDate = (dateInput) =>
  toDate(dateInput).toLocaleDateString("th-TH", THAI_DATE_OPTS);
const formatThaiTime = (dateInput) =>
  toDate(dateInput).toLocaleTimeString("th-TH", THAI_TIME_OPTS);

const getBangkokDateKey = (dateInput) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: BANGKOK_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(toDate(dateInput));

const getBangkokDayRange = (dateKey) => {
  const start = new Date(`${dateKey}T00:00:00+07:00`);
  const end = new Date(`${dateKey}T23:59:59.999+07:00`);
  return { start, end };
};

const getMinutesInBangkok = (dateInput) => {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: BANGKOK_TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
    .format(toDate(dateInput))
    .split(":");

  return Number(parts[0] || 0) * 60 + Number(parts[1] || 0);
};

const formatThaiDateTime = (dateInput) => {
  const dateText = formatThaiDate(dateInput);
  const timeText = formatThaiTime(dateInput);
  return `${dateText} เวลา ${timeText} น.`;
};

const formatThaiDateLabel = formatThaiDate;
const formatThaiTimeLabel = formatThaiTime;

module.exports = {
  getBangkokDateKey,
  getBangkokDayRange,
  getMinutesInBangkok,
  formatThaiDateTime,
  formatThaiDateLabel,
  formatThaiTimeLabel,
};
