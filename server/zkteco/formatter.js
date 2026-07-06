const config = require("./config");
const { formatThaiDate, formatThaiDateTime, getDayRange } = require("./time");

const displayName = (emp) => emp?.nickname ?? "ไม่ทราบชื่อ";

const bulletList = (items, max = 15) =>
  items
    .slice(0, max)
    .map((n) => `• ${n}`)
    .join("\n");

const scanMessage = (empName, empId, status, recordTime) => {
  const [dateOnly = "-", timePart = ""] = String(
    formatThaiDateTime(recordTime),
  ).split(" เวลา ");

  const header =
    status.startsWith("พักเที่ยง") || status.startsWith("กลับจากพักเที่ยง")
      ? "🍱 แจ้งเตือนเวลาพักเที่ยง"
      : "⏰ แจ้งเตือนเวลาเข้า-ออกงาน";

  return [
    header,
    "",
    `🆔 รหัส: ${empId}`,
    `👤 พนักงาน: ${empName}`,
    `📌 สถานะ: ${status}`,
    "",
    `📅 วันที่: ${dateOnly}`,
    `🕒 เวลา: ${timePart}`,
  ].join("\n");
};

const dailySummary = async (prisma, dateKey) => {
  const { start, end } = getDayRange(dateKey);
  const thaiDate = formatThaiDate(start);

  const employees = await prisma.employee.findMany({
    select: { id: true, nickname: true, zkUserId: true },
  });
  employees.sort((a, b) => Number(a.zkUserId) - Number(b.zkUserId));

  const attendances = await prisma.attendance.findMany({
    where: {
      employeeId: { in: employees.map((e) => e.id) },
      scanTime: { gte: start, lte: end },
    },
    select: { employeeId: true, status: true, scanTime: true },
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

    const lateScan = scans.find((s) => s.status.startsWith("เข้างาน (สาย"));
    const lunchOTScan = scans.find(
      (s) =>
        s.status.startsWith("กลับจากพักเที่ยง") && s.status.includes("สาย"),
    );

    if (scans.length === 4 && !lateScan && !lunchOTScan) {
      stats.onTime.push(name);
    } else if (
      scans.length === 2 &&
      scans[0].status.startsWith("เข้างาน") &&
      scans[1].status.startsWith("พักเที่ยง")
    ) {
      stats.halfDay.push(lateScan ? `${name} - ${lateScan.status}` : name);
    } else {
      if (lateScan) stats.late.push(`${name} - ${lateScan.status}`);
      if (lunchOTScan)
        stats.lunchOvertime.push(`${name} - ${lunchOTScan.status}`);
      if (scans.length !== 4) {
        const missing = config.attendance.stepStatuses.slice(scans.length, 4);
        const missingText = missing.length
          ? ` (${missing.join(", ")})`
          : "";
        stats.forgotScan.push(`${name}${missingText}`);
      }
    }
  }

  const totalAllEmployees = employees.length;

  const message = [
    "📊 รายงานสรุปเวลาเข้า-ออกงาน",
    "",
    `🗓 วันที่: ${thaiDate}`,
    `👥 พนักงานทั้งหมด: ${totalAllEmployees} คน`,
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

module.exports = { displayName, scanMessage, dailySummary };
