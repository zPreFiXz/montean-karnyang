const {
  formatThaiDate,
  formatThaiDateTime,
  getBangkokDateKey,
  getBangkokDayRange,
  getMinutesInBangkok,
} = require("./time");

const EMPLOYEE_SELECT = { id: true, fullName: true, nickname: true };

const buildSummaryListText = (items) =>
  items.length
    ? items
        .slice(0, 15)
        .map((name) => `• ${name}`)
        .join("\n")
    : "- ไม่มี";

const buildDailySummaryText = ({ thaiDateText, totalEmployees, stats }) =>
  [
    "📊 รายงานสรุปเวลาเข้า-เลิกงาน",
    "",
    `🗓 วันที่: ${thaiDateText}`,
    `👥 พนักงานทั้งหมด: ${totalEmployees} คน`,
    "",
    `✅ ตรงเวลา (${stats.onTime.length} คน)`,
    buildSummaryListText(stats.onTime),
    "",
    `❌ ขาด/ลา (${stats.absent.length} คน)`,
    buildSummaryListText(stats.absent),
    "",
    `⏱️ มาสาย (${stats.late.length} คน)`,
    buildSummaryListText(stats.late),
    "",
    `🍱 พักเกินเวลา (${stats.lunchOvertime.length} คน)`,
    buildSummaryListText(stats.lunchOvertime),
  ].join("\n");

const buildDailyAttendanceSummaryMessage = async (
  prisma,
  getEmployeeDisplayName,
  dateKey,
) => {
  const { start, end } = getBangkokDayRange(dateKey);
  const thaiDateText = formatThaiDate(start);

  const employees = await prisma.employee.findMany({
    where: { isActive: true },
    orderBy: [{ fullName: "asc" }, { id: "asc" }],
    select: EMPLOYEE_SELECT,
  });

  if (!employees.length) {
    return [
      "📊 รายงานสรุปเวลาเข้า-เลิกงาน",
      `🗓 วันที่: ${thaiDateText}`,
      "",
      "👥 พนักงานทั้งหมด: 0 คน",
      "ℹ️ ไม่มีรายชื่อพนักงานที่ใช้งานอยู่",
    ].join("\n");
  }

  const attendances = await prisma.attendance.findMany({
    where: {
      employeeId: { in: employees.map((employee) => employee.id) },
      scanTime: { gte: start, lte: end },
    },
    select: { employeeId: true, status: true, scanTime: true },
    orderBy: { scanTime: "asc" },
  });

  const grouped = new Map(
    employees.map((employee) => [
      employee.id,
      { ...employee, firstInWork: null, lunchOvertimeStatus: null },
    ]),
  );

  for (const attendance of attendances) {
    const item = grouped.get(attendance.employeeId);
    if (!item) continue;

    if (attendance.status.startsWith("เข้างาน") && !item.firstInWork) {
      item.firstInWork = attendance;
    }

    if (
      attendance.status.startsWith("กลับจากพักเที่ยง") &&
      (attendance.status.includes("สาย") ||
        attendance.status.includes("พักเกินเวลา")) &&
      !item.lunchOvertimeStatus
    ) {
      item.lunchOvertimeStatus = attendance.status;
    }
  }

  const stats = { absent: [], onTime: [], late: [], lunchOvertime: [] };
  for (const employee of grouped.values()) {
    if (!employee.firstInWork) {
      stats.absent.push(getEmployeeDisplayName(employee));
      continue;
    }

    const employeeName = getEmployeeDisplayName(employee);
    if (employee.firstInWork.status.startsWith("เข้างาน (สาย")) {
      stats.late.push(`${employeeName} - ${employee.firstInWork.status}`);
    } else {
      stats.onTime.push(employeeName);
    }

    if (employee.lunchOvertimeStatus) {
      stats.lunchOvertime.push(
        `${employeeName} - ${employee.lunchOvertimeStatus}`,
      );
    }
  }

  return buildDailySummaryText({
    thaiDateText,
    totalEmployees: employees.length,
    stats,
  });
};

const createDailySummarySender = (sendTelegramMessage, buildSummaryMessage) => {
  let lastSentDateKey = "";
  let running = false;

  return async () => {
    if (running) return;

    const now = new Date();
    const dateKey = getBangkokDateKey(now);
    if (getMinutesInBangkok(now) < 18 * 60 || lastSentDateKey === dateKey) {
      return;
    }

    running = true;
    try {
      await sendTelegramMessage(await buildSummaryMessage(dateKey));
      lastSentDateKey = dateKey;
    } catch (error) {
      console.error("Failed to send daily summary:", error.message);
    } finally {
      running = false;
    }
  };
};

const formatAttendanceMessage = (empName, empId, scanStatus, recordTime) => {
  const [dateOnly = "-", timePart = ""] = String(
    formatThaiDateTime(recordTime),
  ).split(" เวลา ");

  const header =
    scanStatus.startsWith("พักเที่ยง") ||
    scanStatus.startsWith("กลับจากพักเที่ยง")
      ? "🍱 บันทึกเวลาพักเที่ยง"
      : "⏰ บันทึกเวลาเข้า-เลิกงาน";

  return [
    header,
    "",
    `🆔 รหัส: ${empId || "-"}`,
    `👤 พนักงาน: ${empName}`,
    `📌 สถานะ: ${scanStatus}`,
    `📅 วันที่: ${dateOnly}`,
    `🕒 เวลา: ${timePart || "-"}`,
  ].join("\n");
};

module.exports = {
  formatAttendanceMessage,
  buildDailyAttendanceSummaryMessage,
  createDailySummarySender,
};
