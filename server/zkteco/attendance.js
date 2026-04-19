const { EMPLOYEE_CACHE_TTL_MS, TIME_RULES } = require("./config");
const {
  getBangkokDateKey,
  getBangkokDayRange,
  getMinutesInBangkok,
} = require("./time");

const EMPLOYEE_SELECT = { id: true, fullName: true, nickname: true };

const getLunchReturnStatus = (eventTime, lunchOutTime) => {
  const restMinutes = Math.max(
    0,
    Math.floor((new Date(eventTime) - new Date(lunchOutTime)) / 60000),
  );
  const lateMinutes = Math.max(0, restMinutes - TIME_RULES.lunchBreakMinutes);
  return lateMinutes > 0
    ? `กลับจากพักเที่ยง (สาย ${lateMinutes} นาที)`
    : `กลับจากพักเที่ยง (พัก ${restMinutes} นาที)`;
};

const createAttendanceService = (prisma) => {
  const employeeCache = new Map();
  let employeeCacheLoadedAt = 0;

  const warmEmployeeCache = async (force = false) => {
    const now = Date.now();
    if (
      !force &&
      employeeCache.size &&
      now - employeeCacheLoadedAt < EMPLOYEE_CACHE_TTL_MS
    ) {
      return;
    }

    const employees = await prisma.employee.findMany({
      where: { isActive: true },
      select: { ...EMPLOYEE_SELECT, zkUserId: true },
    });

    employeeCache.clear();
    for (const employee of employees) {
      if (!employee.zkUserId) continue;
      employeeCache.set(String(employee.zkUserId), {
        id: employee.id,
        fullName: employee.fullName,
        nickname: employee.nickname,
      });
    }
    employeeCacheLoadedAt = now;
  };

  const findEmployeeByZkUserId = async (zkUserId) => {
    if (!zkUserId) return null;
    const key = String(zkUserId);
    await warmEmployeeCache();
    if (employeeCache.has(key)) return employeeCache.get(key);

    const employee = await prisma.employee.findUnique({
      where: { zkUserId: key },
      select: EMPLOYEE_SELECT,
    });

    if (employee) employeeCache.set(key, employee);
    return employee;
  };

  const resolveScanStatusFromDb = async (employeeId, recordTime) => {
    const eventTime = recordTime || new Date();
    if (!employeeId) return null;

    const minutes = getMinutesInBangkok(eventTime);
    const { start, end } = getBangkokDayRange(getBangkokDateKey(eventTime));
    const records = await prisma.attendance.findMany({
      where: { employeeId, scanTime: { gte: start, lte: end } },
      orderBy: { scanTime: "asc" },
      select: { scanTime: true },
    });

    if (!records.length) {
      return minutes > TIME_RULES.lateAfterMinutes
        ? `เข้างาน (สาย ${minutes - TIME_RULES.lateAfterMinutes} นาที)`
        : "เข้างาน";
    }

    if (records.length === 1) return TIME_RULES.stepStatuses[1];
    if (records.length === 2) {
      return getLunchReturnStatus(eventTime, records[1]?.scanTime || eventTime);
    }

    return TIME_RULES.stepStatuses[3];
  };

  const saveAttendance = (employeeId, status, scanTime) =>
    prisma.attendance.create({
      data: { employeeId: employeeId || null, status, scanTime },
    });

  const getEmployeeDisplayName = (employee) =>
    !employee
      ? "-"
      : employee.nickname
        ? `${employee.fullName} (${employee.nickname})`
        : employee.fullName;

  return {
    warmEmployeeCache,
    findEmployeeByZkUserId,
    resolveScanStatusFromDb,
    saveAttendance,
    getEmployeeDisplayName,
  };
};

module.exports = {
  createAttendanceService,
};
