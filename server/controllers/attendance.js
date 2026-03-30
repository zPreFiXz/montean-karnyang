const prisma = require("../config/prisma");
const createError = require("../utils/createError");

const REQUIRED_SLOT_KEYS = ["inWork", "lunchOut", "lunchIn", "offWork"];

const getBangkokTodayKey = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

const getBangkokDayRange = (dateKey) => {
  const start = new Date(`${dateKey}T00:00:00+07:00`);
  const end = new Date(`${dateKey}T23:59:59.999+07:00`);

  return { start, end };
};

const createEmptySlots = () => ({
  inWork: null,
  lunchOut: null,
  lunchIn: null,
  offWork: null,
});

const normalizeDateKey = (value) => {
  const dateKey = String(value || "").trim();
  if (!dateKey) return getBangkokTodayKey();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
    createError(400, "รูปแบบวันที่ไม่ถูกต้อง (YYYY-MM-DD)");
  }

  return dateKey;
};

const mapStatusToSlotKey = (status) => {
  const text = String(status || "").trim();

  if (text.startsWith("เข้างาน")) return "inWork";
  if (text.startsWith("พักเที่ยง")) return "lunchOut";
  if (text.startsWith("กลับจากพักเที่ยง")) return "lunchIn";
  if (text.startsWith("เลิกงาน")) return "offWork";
  return null;
};

exports.getDailyAttendanceSummary = async (req, res, next) => {
  try {
    const dateKey = normalizeDateKey(req.query.date);
    const { start, end } = getBangkokDayRange(dateKey);

    const employees = await prisma.employee.findMany({
      where: { isActive: true },
      orderBy: [{ fullName: "asc" }, { id: "asc" }],
      select: {
        id: true,
        zkUserId: true,
        fullName: true,
        nickname: true,
        isActive: true,
      },
    });

    const employeeIds = employees.map((employee) => employee.id);

    const attendances = employeeIds.length
      ? await prisma.attendance.findMany({
          where: {
            employeeId: { in: employeeIds },
            scanTime: {
              gte: start,
              lte: end,
            },
          },
          select: {
            employeeId: true,
            status: true,
            scanTime: true,
          },
          orderBy: {
            scanTime: "asc",
          },
        })
      : [];

    const unknownScanCount = await prisma.attendance.count({
      where: {
        employeeId: null,
        scanTime: {
          gte: start,
          lte: end,
        },
      },
    });

    const groupedMap = new Map(
      employees.map((employee) => [
        employee.id,
        {
          ...employee,
          scanCount: 0,
          slots: createEmptySlots(),
        },
      ]),
    );

    for (const attendance of attendances) {
      const item = groupedMap.get(attendance.employeeId);
      if (!item) continue;

      item.scanCount += 1;

      const slotKey = mapStatusToSlotKey(attendance.status);
      if (!slotKey) continue;

      if (!item.slots[slotKey]) {
        item.slots[slotKey] = {
          status: attendance.status,
          scanTime: attendance.scanTime,
        };
      }
    }

    const summary = Array.from(groupedMap.values()).map((item) => {
      const missingSlots = REQUIRED_SLOT_KEYS.filter(
        (slotKey) => !item.slots[slotKey],
      );

      return {
        employeeId: item.id,
        zkUserId: item.zkUserId,
        fullName: item.fullName,
        nickname: item.nickname,
        scanCount: item.scanCount,
        requiredScans: REQUIRED_SLOT_KEYS.length,
        completed: missingSlots.length === 0,
        missingSlots,
        slots: item.slots,
      };
    });

    res.json({
      date: dateKey,
      requiredScans: REQUIRED_SLOT_KEYS.length,
      totalEmployees: summary.length,
      completeEmployees: summary.filter((item) => item.completed).length,
      unknownScanCount,
      summary,
    });
  } catch (error) {
    next(error);
  }
};
