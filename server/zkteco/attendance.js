const config = require("./config");
const { getDateKey, getDayRange, getMinuteOfDay } = require("./time");

const { attendance: rules } = config;

const STEP = {
  CLOCK_IN: 0,
  LUNCH_OUT: 1,
  CLOCK_OUT: 3,
};

// รหัสสถานะ (ตรงกับ enum AttendanceType ใน schema.prisma)
// ใช้เป็น "ความหมาย" ของสแกน แทนการเดาจากข้อความไทย
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
    const now = Date.now();
    if (!force && cache.size && now - loadedAt < rules.employeeCacheTtlMs) return;

    const employees = await prisma.employee.findMany({
      select: { id: true, name: true, zkUserId: true },
    });

    cache.clear();
    for (const emp of employees) {
      if (emp.zkUserId) cache.set(String(emp.zkUserId), emp);
    }
    loadedAt = now;
  };

  const find = async (zkUserId) => {
    if (!zkUserId) return null;
    const key = String(zkUserId);

    await warm();
    if (cache.has(key)) return cache.get(key);

    const emp = await prisma.employee.findUnique({
      where: { zkUserId: key },
      select: { id: true, name: true },
    });

    if (emp) cache.set(key, emp);
    return emp;
  };

  return { warm, find };
};

const lunchReturnStatus = (eventTime, lunchOutTime) => {
  const restMin = Math.max(
    0,
    Math.floor((new Date(eventTime) - new Date(lunchOutTime)) / 60_000),
  );
  const lateMin = Math.max(0, restMin - rules.lunchBreakMinutes);
  return lateMin > 0
    ? {
        type: STATUS.LUNCH_RETURN_LATE,
        text: `กลับจากพักเที่ยง (พักเกิน ${lateMin} นาที)`,
      }
    : {
        type: STATUS.LUNCH_RETURN,
        text: `กลับจากพักเที่ยง (พัก ${restMin} นาที)`,
      };
};

const resolveStatus = async (prisma, employeeId, recordTime) => {
  const eventTime = recordTime || new Date();
  const minutes = getMinuteOfDay(eventTime);
  const { start, end } = getDayRange(getDateKey(eventTime));

  const records = await prisma.attendance.findMany({
    where: { employeeId, scanTime: { gte: start, lte: end } },
    orderBy: { scanTime: "asc" },
    select: { scanTime: true },
  });

  // สถานะอิงจาก "จำนวนสแกนที่มีแล้ววันนี้":
  //   0 ครั้ง  -> เข้างาน (เช็คสายด้วย)
  //   1 ครั้ง  -> ออกพักเที่ยง
  //   2 ครั้ง  -> กลับจากพักเที่ยง (คำนวณเวลาพักจากสแกนครั้งที่ 2)
  //   3+ ครั้ง -> เลิกงาน (สแกนเกินก็ยังนับเป็นเลิกงาน อันสุดท้าย = เวลาเลิกจริง)
  if (!records.length) {
    return minutes > rules.lateAfterMinutes
      ? {
          type: STATUS.CLOCK_IN_LATE,
          text: `เข้างาน (สาย ${minutes - rules.lateAfterMinutes} นาที)`,
        }
      : { type: STATUS.CLOCK_IN, text: rules.stepStatuses[STEP.CLOCK_IN] };
  }

  if (records.length === 1) {
    return { type: STATUS.LUNCH_OUT, text: rules.stepStatuses[STEP.LUNCH_OUT] };
  }
  if (records.length === 2) {
    const lunchOutTime = records[1].scanTime; // สแกนครั้งที่ 2 = ออกพักเที่ยง
    return lunchReturnStatus(eventTime, lunchOutTime);
  }

  return { type: STATUS.CLOCK_OUT, text: rules.stepStatuses[STEP.CLOCK_OUT] };
};

const save = (prisma, employeeId, type, statusText, scanTime) =>
  prisma.attendance.create({
    data: { employeeId, type, statusText, scanTime },
  });

module.exports = { STATUS, createEmployeeCache, resolveStatus, save };
