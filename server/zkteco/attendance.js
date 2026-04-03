const { EMPLOYEE_CACHE_TTL_MS, TIME_RULES } = require("./config");
const {
  getBangkokDateKey,
  getBangkokDayRange,
  getMinutesInBangkok,
} = require("./time");

const EMPLOYEE_SELECT = { id: true, fullName: true, nickname: true };
const EMPLOYEE_WITH_ZK_SELECT = { ...EMPLOYEE_SELECT, zkUserId: true };

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
    const cacheFresh = now - employeeCacheLoadedAt < EMPLOYEE_CACHE_TTL_MS;
    if (!force && employeeCache.size && cacheFresh) return;

    const employees = await prisma.employee.findMany({
      where: { isActive: true },
      select: EMPLOYEE_WITH_ZK_SELECT,
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
    const cacheKey = String(zkUserId);

    await warmEmployeeCache();
    const cached = employeeCache.get(cacheKey);
    if (cached) return cached;

    const employee = await prisma.employee.findUnique({
      where: { zkUserId: cacheKey },
      select: EMPLOYEE_SELECT,
    });

    if (employee) employeeCache.set(cacheKey, employee);

    return employee;
  };

  const resolveScanStatusFromDb = async (employeeId, recordTime) => {
    const eventTime = recordTime || new Date();
    const minutes = getMinutesInBangkok(eventTime);

    if (!employeeId) return null;

    const dateKey = getBangkokDateKey(eventTime);
    const { start, end } = getBangkokDayRange(dateKey);

    const records = await prisma.attendance.findMany({
      where: {
        employeeId,
        scanTime: {
          gte: start,
          lte: end,
        },
      },
      orderBy: {
        scanTime: "asc",
      },
      select: {
        scanTime: true,
      },
    });

    const currentStep = records.length;

    switch (records.length) {
      case 0:
        if (minutes > TIME_RULES.lateAfterMinutes) {
          return `เข้างาน (สาย ${minutes - TIME_RULES.lateAfterMinutes} นาที)`;
        }
        return "เข้างาน";
      case 1:
        return TIME_RULES.stepStatuses[1];
      case 2:
        return getLunchReturnStatus(
          eventTime,
          records[1]?.scanTime || eventTime,
        );
      default:
        return TIME_RULES.stepStatuses[3];
    }
  };

  const saveAttendance = async (employeeId, status, scanTime) => {
    await prisma.attendance.create({
      data: { employeeId: employeeId || null, status, scanTime },
    });
  };

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
