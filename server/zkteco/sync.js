const config = require("./config");
const { resolveStatus, save } = require("./attendance");
const { getDateKey, getDayRange } = require("./time");
const { log } = require("./log");

const { attendance: attCfg } = config;

const scanKey = (employeeId, scannedAt) => `${employeeId}-${new Date(scannedAt).getTime()}`;

// log จากเครื่องถูกดึงมาทั้งหมดทุกรอบ จึงต้องกรองเหลือเฉพาะของวันนี้แล้วเรียงเก่า -> ใหม่
const todayLogsOf = (logs, start, end) =>
  logs
    .filter((entry) => {
      const t = new Date(entry?.recordTime);
      return t >= start && t <= end;
    })
    .sort((a, b) => new Date(a.recordTime) - new Date(b.recordTime));

// เวลาสแกนล่าสุดของแต่ละคน ใช้เทียบระยะห่างกันสแกนรัว
const lastScanOf = (rows) => {
  const lastScan = new Map();
  for (const row of rows) {
    const t = new Date(row.scannedAt).getTime();
    if (t > (lastScan.get(row.employeeId) ?? 0)) lastScan.set(row.employeeId, t);
  }
  return lastScan;
};

const createSync = ({ prisma, employees }) => {
  // DB เป็น source of truth: log ไหนยังไม่มีใน DB = ยังไม่เคยบันทึก/แจ้ง
  const reconcile = async (logs) => {
    const { start, end } = getDayRange(getDateKey(new Date()));
    const todayLogs = todayLogsOf(logs, start, end);
    if (!todayLogs.length) return;

    const existing = await prisma.attendance.findMany({
      where: { scannedAt: { gte: start, lte: end } },
      select: { employeeId: true, scannedAt: true },
    });

    const seen = new Set(existing.map((r) => scanKey(r.employeeId, r.scannedAt)));
    const lastScan = lastScanOf(existing);
    const minGapMs = attCfg.minScanGapMinutes * 60_000;

    for (const entry of todayLogs) {
      const zkUserId = String(entry?.deviceUserId || "");
      const recordTime = new Date(entry?.recordTime);
      const emp = await employees.find(zkUserId);

      if (!emp) {
        log.warn("ZKTeco", `Scan from unknown zkUserId=${zkUserId} — ignored`);
        continue;
      }

      const key = scanKey(emp.id, recordTime);
      if (seen.has(key)) continue;

      const prevTime = lastScan.get(emp.id);
      if (prevTime && recordTime.getTime() - prevTime < minGapMs) continue;

      const status = await resolveStatus(prisma, emp.id, recordTime);

      try {
        await save(prisma, emp.id, status.type, status.text, recordTime);
        seen.add(key);
        lastScan.set(emp.id, recordTime.getTime());
      } catch (err) {
        log.error("DB", "Save attendance failed:", err);
        continue; // ยังไม่บันทึก = ยังไม่แจ้ง ไว้รอบหน้า
      }
    }
  };

  return { reconcile };
};

module.exports = { createSync };
