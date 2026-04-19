const THAI_DATE_OPTS = {
  year: "numeric",
  month: "long",
  day: "numeric",
  timeZone: "Asia/Bangkok",
};

const THAI_TIME_OPTS = {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Asia/Bangkok",
};

const formatThaiDate = (value) =>
  new Date(value).toLocaleDateString("th-TH", THAI_DATE_OPTS);

const formatThaiTime = (value) =>
  new Date(value).toLocaleTimeString("th-TH", THAI_TIME_OPTS);

const formatThaiDateTime = (value) =>
  `${formatThaiDate(value)} เวลา ${formatThaiTime(value)} น.`;

const getBangkokDateKey = (value) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));

const getBangkokDayRange = (dateKey) => ({
  start: new Date(`${dateKey}T00:00:00+07:00`),
  end: new Date(`${dateKey}T23:59:59.999+07:00`),
});

const getMinutesInBangkok = (value) => {
  const [hour = 0, minute = 0] = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Bangkok",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
    .format(new Date(value))
    .split(":")
    .map(Number);

  return hour * 60 + minute;
};

module.exports = {
  formatThaiDate,
  formatThaiDateTime,
  getBangkokDateKey,
  getBangkokDayRange,
  getMinutesInBangkok,
};
