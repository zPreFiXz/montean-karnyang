const config = require("./config");
const { STATUS } = require("./attendance");
const { formatThaiDate, formatThaiTime, getDayRange } = require("./time");

const displayName = (emp) => emp?.name ?? "ไม่ระบุชื่อ";

const SHOW_CLOCK_IN_TIME = new Set(config.attendance.showClockInTimeUserIds.map(String));

const bulletList = (items) => items.map((name) => `• ${name}`).join("\n");

// statusLabel เก็บทั้งประโยค ("เข้างาน (สาย 22 นาที)") — หมวดในสรุปเอาเฉพาะส่วนในวงเล็บ
const lateNote = (status) => status.match(/\(.*\)/)?.[0] ?? status;

const withNote = (name, statusLabel) => `${name} ${lateNote(statusLabel)}`;

const LUNCH_TYPES = new Set([STATUS.LUNCH_OUT, STATUS.LUNCH_RETURN, STATUS.LUNCH_RETURN_LATE]);

const scanMessage = (empName, empId, type, statusLabel, recordTime) => {
  const header = LUNCH_TYPES.has(type)
    ? "🍱 แจ้งเตือนพักเที่ยง"
    : "⏰ แจ้งเตือนเข้า-ออกงาน";
  return [
    header,
    "",
    `🆔 รหัส: ${empId}`,
    `👤 พนักงาน: ${empName}`,
    `📌 สถานะ: ${statusLabel}`,
    "",
    `📅 วันที่ ${formatThaiDate(recordTime)}`,
    `🕒 เวลา ${formatThaiTime(recordTime)} น.`,
  ].join("\n");
};

const dayStartMessage = (date) => `🌅 วันที่ ${formatThaiDate(date)}`;

// lateEmployees: [{ name, statusLabel }] — ต่อท้ายหัวข้อเฉพาะเมื่อมีคนสาย/พักเกิน
const rosterCompleteMessage = (header, lateEmployees = []) =>
  lateEmployees.length
    ? [header, bulletList(lateEmployees.map((e) => withNote(e.name, e.statusLabel)))].join("\n")
    : header;

const allClockedInMessage = (lateEmployees) =>
  rosterCompleteMessage("✅ พนักงานเข้างานครบแล้ว", lateEmployees);

const allLunchReturnedMessage = (lateEmployees) =>
  rosterCompleteMessage("✅ พนักงานกลับจากพักเที่ยงครบแล้ว", lateEmployees);

const dailySummary = async (prisma, dateKey) => {
  const { start, end } = getDayRange(dateKey);

  const employees = await prisma.employee.findMany({
    select: { id: true, name: true, zkUserId: true },
  });
  employees.sort((a, b) => {
    const na = Number(a.zkUserId);
    const nb = Number(b.zkUserId);
    return Number.isNaN(na) || Number.isNaN(nb)
      ? String(a.zkUserId).localeCompare(String(b.zkUserId))
      : na - nb;
  });

  const attendances = await prisma.attendance.findMany({
    where: {
      employeeId: { in: employees.map((e) => e.id) },
      scannedAt: { gte: start, lte: end },
    },
    select: { employeeId: true, type: true, statusLabel: true, scannedAt: true },
    orderBy: { scannedAt: "asc" },
  });

  const grouped = new Map(employees.map((e) => [e.id, { ...e, scans: [] }]));
  for (const att of attendances) grouped.get(att.employeeId)?.scans.push(att);

  const stats = { onTime: [], absent: [], halfDay: [], late: [], lunchOvertime: [], incompleteScan: [] };

  for (const emp of grouped.values()) {
    const { scans } = emp;

    if (!scans.length) {
      stats.absent.push(displayName(emp));
      continue;
    }

    const name = displayName(emp);

    const nameWithClockIn = SHOW_CLOCK_IN_TIME.has(String(emp.zkUserId))
      ? `${name} (เข้างาน ${formatThaiTime(scans[0].scannedAt)} น.)`
      : name;

    const lateScan = scans.find((s) => s.type === STATUS.CLOCK_IN_LATE);
    const lunchOTScan = scans.find((s) => s.type === STATUS.LUNCH_RETURN_LATE);

    if (scans.length >= 4 && !lateScan && !lunchOTScan) {
      stats.onTime.push(nameWithClockIn);
    } else if (
      scans.length === 2 &&
      (scans[0].type === STATUS.CLOCK_IN || scans[0].type === STATUS.CLOCK_IN_LATE) &&
      scans[1].type === STATUS.LUNCH_OUT
    ) {
      stats.halfDay.push(lateScan ? withNote(name, lateScan.statusLabel) : name);
    } else {
      if (lateScan) stats.late.push(withNote(name, lateScan.statusLabel));
      if (lunchOTScan) stats.lunchOvertime.push(withNote(name, lunchOTScan.statusLabel));
      if (scans.length < 4) {
        const missing = config.attendance.stepStatuses.slice(scans.length, 4);
        stats.incompleteScan.push(
          missing.length ? `${name} (ไม่ได้สแกน: ${missing.join(", ")})` : name,
        );
      }
    }
  }

  const message = [
    "📊 สรุปเวลาเข้า-ออกงานประจำวัน",
    "",
    `📅 วันที่ ${formatThaiDate(start)}`,
    `👥 พนักงานทั้งหมด ${employees.length} คน`,
  ];

  const sections = [
    ["✅ ตรงเวลา", stats.onTime],
    ["❌ ขาด/ลา", stats.absent],
    ["🌗 ลาครึ่งวัน", stats.halfDay],
    ["⏱️ มาสาย", stats.late],
    ["🍱 พักเกินเวลา", stats.lunchOvertime],
    ["⚠️ สแกนไม่ครบ", stats.incompleteScan],
  ];
  for (const [label, list] of sections) {
    if (list.length) message.push("", `${label} (${list.length} คน)`, bulletList(list));
  }

  return message.join("\n");
};

module.exports = {
  displayName,
  scanMessage,
  dayStartMessage,
  allClockedInMessage,
  allLunchReturnedMessage,
  dailySummary,
};
