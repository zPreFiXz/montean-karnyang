const config = require("./config");
const { createDevice } = require("./device");
const { createEmployeeCache, resolveStatus, save } = require("./attendance");
const {
  displayName,
  scanMessage,
  dayStartMessage,
  dailySummary,
} = require("./formatter");
const telegram = require("./telegram");
const { getDateKey, getDayRange, getMinuteOfDay } = require("./time");

const zkErrorMessage = (err) => err?.err?.message || err?.message || String(err);

// คีย์ระบุการสแกน 1 ครั้งแบบไม่ซ้ำ = พนักงาน + เวลาสแกน
const scanKey = (employeeId, scannedAt) => `${employeeId}-${new Date(scannedAt).getTime()}`;

const startZktecoService = async (prisma) => {
  const { device: deviceCfg, attendance: attCfg } = config;

  if (!deviceCfg.ip) throw new Error("Missing ZKTECO_DEVICE_IP");
  if (!Number.isFinite(deviceCfg.port) || deviceCfg.port <= 0) {
    throw new Error("Invalid ZKTECO_DEVICE_PORT");
  }

  const device = createDevice();
  const employees = createEmployeeCache(prisma);

  let polling = false;
  let reconnecting = false;
  let connected = false;
  let stopped = false;
  let reconnectTimerId = null;
  let reconnectAttempts = 0;
  let lastDayStartDate = "";
  let lastSummaryDate = "";

  // เทียบ log จากเครื่องกับ DB → อันที่ DB ยังไม่มี = ยังไม่เคยบันทึก/แจ้ง
  // (DB เป็น source of truth ทนเน็ตหลุด/รีสตาร์ท)
  const reconcile = async (logs) => {
    const { start, end } = getDayRange(getDateKey(new Date()));

    const todayLogs = logs
      .filter((log) => {
        const t = new Date(log?.recordTime);
        return t >= start && t <= end;
      })
      .sort((a, b) => new Date(a.recordTime) - new Date(b.recordTime));

    if (!todayLogs.length) return;

    const existing = await prisma.attendance.findMany({
      where: { scannedAt: { gte: start, lte: end } },
      select: { employeeId: true, scannedAt: true },
    });
    const seen = new Set(existing.map((r) => scanKey(r.employeeId, r.scannedAt)));

    // เวลาสแกนล่าสุดต่อพนักงาน (กันแตะซ้ำถี่ ๆ)
    const lastScan = new Map();
    for (const r of existing) {
      const t = new Date(r.scannedAt).getTime();
      if (t > (lastScan.get(r.employeeId) ?? 0)) lastScan.set(r.employeeId, t);
    }
    const minGapMs = attCfg.minScanGapMinutes * 60_000;

    for (const log of todayLogs) {
      const empId = String(log?.deviceUserId || "");
      const recordTime = new Date(log?.recordTime);
      const emp = await employees.find(empId);

      if (!emp) {
        console.warn(`[ZKTeco] Scan from unknown zkUserId=${empId} — ignored`);
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
        console.error("[DB] Save attendance failed:", err);
        continue; // ยังไม่บันทึก → ไม่แจ้ง จะลองใหม่รอบหน้า
      }

      telegram
        .send(scanMessage(displayName(emp), empId, status.type, status.text, recordTime))
        .catch((err) => console.error("[Telegram] Send notification failed:", err));
    }
  };

  const poll = async () => {
    if (polling || reconnecting || !connected) return;
    polling = true;
    try {
      await reconcile(await device.fetchLogs());
    } catch (err) {
      const message = zkErrorMessage(err);
      if (err.code === "FETCH_TIMEOUT") {
        console.warn(`[ZKTeco] Fetch timeout (>${deviceCfg.fetchTimeoutMs}ms) — reconnecting`);
      } else {
        console.error(`[ZKTeco] Polling error: ${message}`);
      }
      scheduleReconnect(message);
    } finally {
      polling = false;
    }
  };

  // จริงเมื่ออยู่ในหน้าต่าง [target, target+5) นาที (กันดริฟต์ข้ามนาที)
  const isWithinWindow = (minuteNow, target) => minuteNow >= target && minuteNow < target + 5;

  const checkDayStart = async () => {
    const now = new Date();
    const dateKey = getDateKey(now);
    if (!isWithinWindow(getMinuteOfDay(now), attCfg.dayStartAtMinutes)) return;
    if (lastDayStartDate === dateKey) return;
    try {
      await telegram.send(dayStartMessage(now));
      lastDayStartDate = dateKey;
    } catch (err) {
      console.error("[Telegram] Day start message failed:", err);
    }
  };

  const checkDailySummary = async () => {
    const now = new Date();
    const dateKey = getDateKey(now);
    if (!isWithinWindow(getMinuteOfDay(now), attCfg.summaryAtMinutes)) return;
    if (lastSummaryDate === dateKey) return;
    try {
      await telegram.send(await dailySummary(prisma, dateKey));
      lastSummaryDate = dateKey;
    } catch (err) {
      console.error("[Telegram] Daily summary failed:", err);
    }
  };

  const checkSchedules = () => {
    checkDayStart();
    checkDailySummary();
  };

  const connect = async () => {
    await device.connect();
    employees.warm(true).catch((err) => console.warn("[Cache] Employee warmup failed:", err));
    connected = true;
    reconnecting = false;
    reconnectAttempts = 0;
  };

  // exponential backoff: 10s, 20s, 40s, ... เพดาน reconnectMaxDelayMs
  const scheduleReconnect = (reason) => {
    if (reconnecting || stopped) return;
    reconnecting = true;
    connected = false;
    const delay = Math.min(
      deviceCfg.reconnectDelayMs * 2 ** reconnectAttempts,
      deviceCfg.reconnectMaxDelayMs,
    );
    reconnectAttempts += 1;
    console.warn(`[ZKTeco] Reconnecting in ${delay}ms (${reason})`);
    reconnectTimerId = setTimeout(async () => {
      try {
        await connect();
      } catch (err) {
        reconnecting = false;
        scheduleReconnect(zkErrorMessage(err));
      }
    }, delay);
  };

  const pollTimerId = setInterval(poll, deviceCfg.pollIntervalMs);
  const scheduleTimerId = setInterval(checkSchedules, attCfg.scheduleCheckIntervalMs);

  const stop = () => {
    stopped = true;
    clearInterval(pollTimerId);
    clearInterval(scheduleTimerId);
    clearTimeout(reconnectTimerId);
    device.disconnect().catch(() => {});
  };

  connect()
    .then(poll) // ตามเก็บทันทีที่ต่อได้
    .then(checkSchedules)
    .catch((err) => {
      console.error(`[ZKTeco] Initialization failed: ${zkErrorMessage(err)}`);
      scheduleReconnect(zkErrorMessage(err));
    });

  return stop;
};

module.exports = { startZktecoService };
