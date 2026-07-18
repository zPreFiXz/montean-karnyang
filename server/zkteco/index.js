const config = require("./config");
const { createDevice } = require("./device");
const { createEmployeeCache, resolveStatus, save } = require("./attendance");
const {
  displayName,
  scanMessage,
  dayStartMessage,
  allClockedInMessage,
  dailySummary,
} = require("./formatter");
const telegram = require("./telegram");
const { getDateKey, getDayRange, getMinuteOfDay } = require("./time");

const zkErrorMessage = (err) => err?.err?.message || err?.message || String(err);

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
  let lastAllInDate = "";

  const countPresent = async (dateKey) => {
    const { start, end } = getDayRange(dateKey);
    const scanned = await prisma.attendance.findMany({
      where: { scannedAt: { gte: start, lte: end } },
      distinct: ["employeeId"],
      select: { employeeId: true },
    });
    return scanned.length;
  };

  // เดาว่าข้อความประจำวันไหนส่งไปแล้ว กันเด้งซ้ำเมื่อ restart กลางวัน
  const initDailyFlags = async () => {
    const now = new Date();
    const dateKey = getDateKey(now);
    const minute = getMinuteOfDay(now);
    const { start, end } = getDayRange(dateKey);

    const scansToday = await prisma.attendance.count({
      where: { scannedAt: { gte: start, lte: end } },
    });

    if (minute >= attCfg.dayStartAtMinutes && scansToday > 0) {
      lastDayStartDate = dateKey;
    }
    if (minute >= attCfg.summaryAtMinutes) {
      lastSummaryDate = dateKey;
    }
    const total = await prisma.employee.count();
    if (total && (await countPresent(dateKey)) >= total) {
      lastAllInDate = dateKey;
    }
  };

  const checkAllClockedIn = async (recordTime) => {
    const dateKey = getDateKey(recordTime);
    if (lastAllInDate === dateKey) return;

    const total = await prisma.employee.count();
    if (!total) return;
    if ((await countPresent(dateKey)) < total) return;

    const { start, end } = getDayRange(dateKey);
    const lateScans = await prisma.attendance.findMany({
      where: {
        type: "CLOCK_IN_LATE",
        scannedAt: { gte: start, lte: end },
      },
      select: { statusLabel: true, employee: { select: { name: true } } },
      orderBy: { scannedAt: "asc" },
    });
    const lateEmployees = lateScans.map((s) => ({
      name: s.employee.name,
      statusLabel: s.statusLabel,
    }));

    lastAllInDate = dateKey;
    try {
      await telegram.send(allClockedInMessage(lateEmployees));
    } catch (err) {
      lastAllInDate = ""; // ให้รอบถัดไปลองส่งใหม่
      console.error("[Telegram] All clocked-in message failed:", err);
    }
  };

  // DB เป็น source of truth: log ไหนยังไม่มีใน DB = ยังไม่เคยบันทึก/แจ้ง
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
        continue; // ยังไม่บันทึก = ยังไม่แจ้ง ไว้รอบหน้า
      }
    }
  };

  // ส่งแจ้งเตือนที่ค้าง (notifiedAt = null) รวมรายการช่วงเน็ตหลุด
  const flushScanNotifications = async () => {
    const { start, end } = getDayRange(getDateKey(new Date()));
    const pending = await prisma.attendance.findMany({
      where: { notifiedAt: null, scannedAt: { gte: start, lte: end } },
      select: {
        id: true,
        type: true,
        statusLabel: true,
        scannedAt: true,
        employee: { select: { name: true, zkUserId: true } },
      },
      orderBy: { scannedAt: "asc" },
    });

    for (const att of pending) {
      try {
        await telegram.send(
          scanMessage(displayName(att.employee), att.employee.zkUserId, att.type, att.statusLabel, att.scannedAt),
        );
      } catch (err) {
        console.error("[Telegram] Send notification failed (will retry):", err);
        break; // หยุดทั้งคิวเพื่อรักษาลำดับ ไว้ลองรอบหน้า
      }
      await prisma.attendance.update({
        where: { id: att.id },
        data: { notifiedAt: new Date() },
      });
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
    }
    // แยก try จากเครื่องสแกน: ปัญหาฝั่ง Telegram ต้องไม่กระตุ้น reconnect
    try {
      await flushScanNotifications();
      await checkAllClockedIn(new Date());
    } catch (err) {
      console.error("[Notify] Flush pending notifications failed:", err);
    }
    polling = false;
  };

  // ไม่ใช้หน้าต่างเวลาแคบ: เปิดระบบสาย/เน็ตหลุดคาบเกี่ยว แล้วยังตามส่งได้
  const isDue = (minuteNow, target) => minuteNow >= target;

  const checkDayStart = async () => {
    const now = new Date();
    const dateKey = getDateKey(now);
    if (!isDue(getMinuteOfDay(now), attCfg.dayStartAtMinutes)) return;
    if (lastDayStartDate === dateKey) return;
    lastDayStartDate = dateKey;
    try {
      await telegram.send(dayStartMessage(now));
    } catch (err) {
      lastDayStartDate = "";
      console.error("[Telegram] Day start message failed:", err);
    }
  };

  const checkDailySummary = async () => {
    const now = new Date();
    const dateKey = getDateKey(now);
    if (!isDue(getMinuteOfDay(now), attCfg.summaryAtMinutes)) return;
    if (lastSummaryDate === dateKey) return;
    lastSummaryDate = dateKey;
    try {
      await telegram.send(await dailySummary(prisma, dateKey));
    } catch (err) {
      lastSummaryDate = "";
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

  await initDailyFlags().catch((err) =>
    console.error("[Notice] Init daily flags failed (may resend today's notices):", err),
  );

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
    .then(poll)
    .then(checkSchedules)
    .catch((err) => {
      console.error(`[ZKTeco] Initialization failed: ${zkErrorMessage(err)}`);
      scheduleReconnect(zkErrorMessage(err));
    });

  return stop;
};

module.exports = { startZktecoService };
