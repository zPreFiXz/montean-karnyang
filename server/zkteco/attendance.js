const config = require("./config");
const { getDateKey, getDayRange, getMinuteOfDay } = require("./time");

const { attendance: rules } = config;

const STATUS = {
  CLOCK_IN: "CLOCK_IN",
  CLOCK_IN_LATE: "CLOCK_IN_LATE",
  LUNCH_OUT: "LUNCH_OUT",
  LUNCH_RETURN: "LUNCH_RETURN",
  LUNCH_RETURN_LATE: "LUNCH_RETURN_LATE",
  CLOCK_OUT: "CLOCK_OUT",
};

const createEmployeeCache = (prisma) => {
  const cache = new Map();
  let loadedAt = 0;

  const warm = async (force = false) => {
    if (!force && cache.size && Date.now() - loadedAt < rules.employeeCacheTtlMs) return;
    const employees = await prisma.employee.findMany({
      select: { id: true, name: true, zkUserId: true },
    });
    cache.clear();
    for (const emp of employees) if (emp.zkUserId) cache.set(String(emp.zkUserId), emp);
    loadedAt = Date.now();
  };

  const find = async (zkUserId) => {
    if (!zkUserId) return null;
    const key = String(zkUserId);
    await warm();
    if (cache.has(key)) return cache.get(key);

    const emp = await prisma.employee.findUnique({
      where: { zkUserId: key },
      select: { id: true, name: true, zkUserId: true },
    });
    if (emp) cache.set(key, emp);
    return emp;
  };

  return { warm, find };
};

// แปลงนาทีเป็นข้อความ "X ชม. Y นาที" (ต่ำกว่า 60 นาทีแสดงแค่นาที)
const formatDuration = (totalMinutes) => {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours <= 0) return `${minutes} นาที`;
  if (minutes === 0) return `${hours} ชม.`;
  return `${hours} ชม. ${minutes} นาที`;
};

const lunchReturnStatus = (eventTime, lunchOutTime) => {
  // นาทีหน้าปัด (ตัดวินาที): ออก 12:00:30 กลับ 13:00:10 = 60 นาที ไม่ใช่ 59
  const restMin = Math.max(0, getMinuteOfDay(eventTime) - getMinuteOfDay(lunchOutTime));
  const lateMin = Math.max(0, restMin - rules.lunchBreakMinutes);
  return lateMin > 0
    ? { type: STATUS.LUNCH_RETURN_LATE, text: `กลับจากพักเที่ยง (พักเกิน ${formatDuration(lateMin)})` }
    : { type: STATUS.LUNCH_RETURN, text: `กลับจากพักเที่ยง (พัก ${formatDuration(restMin)})` };
};

// สถานะอิงจำนวนสแกนที่มีแล้ววันนี้: 0=เข้างาน 1=ออกพัก 2=กลับพัก 3+=เลิกงาน
const resolveStatus = async (prisma, employeeId, recordTime) => {
  const eventTime = recordTime || new Date();
  const { start, end } = getDayRange(getDateKey(eventTime));
  const records = await prisma.attendance.findMany({
    where: { employeeId, scannedAt: { gte: start, lte: end } },
    orderBy: { scannedAt: "asc" },
    select: { scannedAt: true },
  });

  if (!records.length) {
    const late = getMinuteOfDay(eventTime) - rules.lateAfterMinutes;
    return late > 0
      ? { type: STATUS.CLOCK_IN_LATE, text: `เข้างาน (สาย ${formatDuration(late)})` }
      : { type: STATUS.CLOCK_IN, text: rules.stepStatuses[0] };
  }
  if (records.length === 1) return { type: STATUS.LUNCH_OUT, text: rules.stepStatuses[1] };
  if (records.length === 2) return lunchReturnStatus(eventTime, records[1].scannedAt);
  return { type: STATUS.CLOCK_OUT, text: rules.stepStatuses[3] };
};

const save = (prisma, employeeId, type, statusLabel, scannedAt) =>
  prisma.attendance.create({ data: { employeeId, type, statusLabel, scannedAt } });

module.exports = { STATUS, createEmployeeCache, resolveStatus, save };
