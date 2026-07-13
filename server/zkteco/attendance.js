const config = require("./config");
const { getDateKey, getDayRange, getMinuteOfDay } = require("./time");

const { attendance: rules } = config;

// รหัสสถานะ ตรงกับ enum AttendanceType ใน schema.prisma
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

    // เผื่อพนักงานถูกเพิ่มหลัง warm ล่าสุด
    const emp = await prisma.employee.findUnique({
      where: { zkUserId: key },
      select: { id: true, name: true, zkUserId: true },
    });
    if (emp) cache.set(key, emp);
    return emp;
  };

  return { warm, find };
};

const lunchReturnStatus = (eventTime, lunchOutTime) => {
  const restMin = Math.max(0, Math.floor((new Date(eventTime) - new Date(lunchOutTime)) / 60_000));
  const lateMin = Math.max(0, restMin - rules.lunchBreakMinutes);
  return lateMin > 0
    ? { type: STATUS.LUNCH_RETURN_LATE, text: `กลับจากพักเที่ยง (พักเกิน ${lateMin} นาที)` }
    : { type: STATUS.LUNCH_RETURN, text: `กลับจากพักเที่ยง (พัก ${restMin} นาที)` };
};

// สถานะอิงจำนวนสแกนที่มีแล้ววันนี้: 0=เข้างาน 1=ออกพัก 2=กลับพัก 3+=เลิกงาน
// (stepStatuses index: 0 เข้างาน, 1 พักเที่ยง, 3 เลิกงาน)
const resolveStatus = async (prisma, employeeId, recordTime) => {
  const eventTime = recordTime || new Date();
  const { start, end } = getDayRange(getDateKey(eventTime));
  const records = await prisma.attendance.findMany({
    where: { employeeId, scanTime: { gte: start, lte: end } },
    orderBy: { scanTime: "asc" },
    select: { scanTime: true },
  });

  if (!records.length) {
    const late = getMinuteOfDay(eventTime) - rules.lateAfterMinutes;
    return late > 0
      ? { type: STATUS.CLOCK_IN_LATE, text: `เข้างาน (สาย ${late} นาที)` }
      : { type: STATUS.CLOCK_IN, text: rules.stepStatuses[0] };
  }
  if (records.length === 1) return { type: STATUS.LUNCH_OUT, text: rules.stepStatuses[1] };
  if (records.length === 2) return lunchReturnStatus(eventTime, records[1].scanTime);
  return { type: STATUS.CLOCK_OUT, text: rules.stepStatuses[3] };
};

const save = (prisma, employeeId, type, statusLabel, scanTime) =>
  prisma.attendance.create({ data: { employeeId, type, statusLabel, scanTime } });

module.exports = { STATUS, createEmployeeCache, resolveStatus, save };
