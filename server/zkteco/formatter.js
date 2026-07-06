const config = require("./config");
const { STATUS } = require("./attendance");
const { formatThaiDate, formatThaiTime, getDayRange } = require("./time");

const displayName = (emp) => emp?.name ?? "ไม่ทราบชื่อ";

const bulletList = (items, max = 15) =>
  items
    .slice(0, max)
    .map((n) => `• ${n}`)
    .join("\n");

const LUNCH_TYPES = new Set([
  STATUS.LUNCH_OUT,
  STATUS.LUNCH_RETURN,
  STATUS.LUNCH_RETURN_LATE,
]);

const scanMessage = (empName, empId, type, statusText, recordTime) => {
  const header = LUNCH_TYPES.has(type)
    ? "🍱 บันทึกเวลาพักเที่ยง"
    : "⏰ บันทึกเวลาเข้า-ออกงาน";

  return [
    header,
    "",
    `🆔 รหัส: ${empId}`,
    `👤 พนักงาน: ${empName}`,
    `📌 สถานะ: ${statusText}`,
    "",
    `📅 วันที่ ${formatThaiDate(recordTime)}`,
    `🕒 เวลา ${formatThaiTime(recordTime)} น.`,
  ].join("\n");
};

// ข้อความเริ่มวันใหม่ (ส่งตอนเช้า) — คั่นแชทเป็นวันใหม่ + การมีข้อความนี้ = ระบบทำงานอยู่
const dayStartMessage = (date) => `🌅 วันที่ ${formatThaiDate(date)}`;

// เอาแค่ข้อความในวงเล็บของ status เช่น "เข้างาน (สาย 12 นาที)" -> "(สาย 12 นาที)"
const lateNote = (status) => status.match(/\(.*\)/)?.[0] ?? status;

const dailySummary = async (prisma, dateKey) => {
  const { start, end } = getDayRange(dateKey);
  const thaiDate = formatThaiDate(start);

  const employees = await prisma.employee.findMany({
    select: { id: true, name: true, zkUserId: true },
  });
  employees.sort((a, b) => Number(a.zkUserId) - Number(b.zkUserId));

  const attendances = await prisma.attendance.findMany({
    where: {
      employeeId: { in: employees.map((e) => e.id) },
      scanTime: { gte: start, lte: end },
    },
    select: { employeeId: true, type: true, statusText: true, scanTime: true },
    orderBy: { scanTime: "asc" },
  });

  const grouped = new Map(employees.map((e) => [e.id, { ...e, scans: [] }]));
  for (const att of attendances) grouped.get(att.employeeId)?.scans.push(att);

  const stats = {
    onTime: [],
    absent: [],
    halfDay: [],
    late: [],
    lunchOvertime: [],
    forgotScan: [],
  };

  for (const emp of grouped.values()) {
    const name = displayName(emp);
    const { scans } = emp;

    if (!scans.length) {
      stats.absent.push(name);
      continue;
    }

    const lateScan = scans.find((s) => s.type === STATUS.CLOCK_IN_LATE);
    const lunchOTScan = scans.find((s) => s.type === STATUS.LUNCH_RETURN_LATE);

    if (scans.length >= 4 && !lateScan && !lunchOTScan) {
      stats.onTime.push(name);
    } else if (
      scans.length === 2 &&
      (scans[0].type === STATUS.CLOCK_IN ||
        scans[0].type === STATUS.CLOCK_IN_LATE) &&
      scans[1].type === STATUS.LUNCH_OUT
    ) {
      stats.halfDay.push(
        lateScan ? `${name} ${lateNote(lateScan.statusText)}` : name,
      );
    } else {
      if (lateScan) stats.late.push(`${name} ${lateNote(lateScan.statusText)}`);
      if (lunchOTScan)
        stats.lunchOvertime.push(`${name} ${lateNote(lunchOTScan.statusText)}`);
      if (scans.length < 4) {
        const missing = config.attendance.stepStatuses.slice(scans.length, 4);
        const missingText = missing.length
          ? ` (ไม่ได้สแกน: ${missing.join(", ")})`
          : "";
        stats.forgotScan.push(`${name}${missingText}`);
      }
    }
  }

  const totalAllEmployees = employees.length;

  const message = [
    "📊 สรุปเวลาเข้า-ออกงานประจำวัน",
    "",
    `📅 วันที่ ${thaiDate}`,
    `👥 พนักงานทั้งหมด ${totalAllEmployees} คน`,
  ];

  const sections = [
    ["✅ ตรงเวลา", stats.onTime],
    ["❌ ขาด/ลา", stats.absent],
    ["🌤️ ลาครึ่งวัน", stats.halfDay],
    ["⏱️ มาสาย", stats.late],
    ["🍱 พักเกินเวลา", stats.lunchOvertime],
    ["⚠️ ลืมสแกน", stats.forgotScan],
  ];

  for (const [label, list] of sections) {
    if (list.length)
      message.push("", `${label} (${list.length} คน)`, bulletList(list));
  }

  return message.join("\n");
};

module.exports = { displayName, scanMessage, dayStartMessage, dailySummary };
