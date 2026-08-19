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

// map จาก enum ไม่ใช่ statusLabel: label เป็นข้อความสำหรับคนอ่านและมีส่วนที่ผันแปร
// ("เข้างาน (สาย 22 นาที)") ถ้าถ้อยคำเปลี่ยนเมื่อไหร่ slot จะว่างเงียบ ๆ โดยไม่มี error
const SLOT_KEY_BY_TYPE = {
  CLOCK_IN: "inWork",
  CLOCK_IN_LATE: "inWork",
  LUNCH_OUT: "lunchOut",
  LUNCH_RETURN: "lunchIn",
  LUNCH_RETURN_LATE: "lunchIn",
  CLOCK_OUT: "offWork",
};

exports.getAttendanceSummary = async (req, res, next) => {
  try {
    const dateKey = normalizeDateKey(req.query.date);
    const { start, end } = getBangkokDayRange(dateKey);

    const employees = await prisma.employee.findMany({
      orderBy: [{ name: "asc" }, { id: "asc" }],
      select: {
        id: true,
        zkUserId: true,
        name: true,
      },
    });

    const employeeIds = employees.map((employee) => employee.id);

    const attendances = employeeIds.length
      ? await prisma.attendance.findMany({
          where: {
            employeeId: { in: employeeIds },
            scannedAt: {
              gte: start,
              lte: end,
            },
          },
          select: {
            employeeId: true,
            type: true,
            statusLabel: true,
            scannedAt: true,
          },
          orderBy: {
            scannedAt: "asc",
          },
        })
      : [];

    // สแกนจากรหัสที่ไม่รู้จักถูก worker ข้ามไม่บันทึกลง DB (ดู zkteco/attendance.js)
    // และ employeeId เป็น required จึงไม่มีทางมีแถวไร้พนักงาน — ค่านี้เป็น 0 เสมอ
    // (เดิม query ด้วย employeeId: null ซึ่ง Prisma ปฏิเสธ ทำให้ endpoint นี้ 500 ทุกครั้ง)
    const unknownScanCount = 0;

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

      const slotKey = SLOT_KEY_BY_TYPE[attendance.type];
      if (!slotKey) continue;

      if (!item.slots[slotKey]) {
        item.slots[slotKey] = {
          status: attendance.statusLabel,
          scannedAt: attendance.scannedAt,
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
        name: item.name,
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
