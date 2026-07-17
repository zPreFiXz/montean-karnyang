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
  // cache กันยิง DB ทุกรอบเช็ค — ตัวตัดสินจริงคือตาราง DailyNotice (ทน restart)
  const sentNoticeCache = new Set();

  // จองสิทธิ์ส่งข้อความประจำวัน: true = ยังไม่เคยส่ง ให้ผู้เรียกส่งได้เลย
  const claimDailyNotice = async (kind, dateKey) => {
    const cacheKey = `${kind}:${dateKey}`;
    if (sentNoticeCache.has(cacheKey)) return false;
    try {
      await prisma.dailyNotice.create({ data: { kind, dateKey } });
      sentNoticeCache.add(cacheKey);
      return true;
    } catch (err) {
      if (err.code === "P2002") {
        sentNoticeCache.add(cacheKey); // มีคนส่งไปแล้ว (ก่อน restart)
        return false;
      }
      throw err;
    }
  };

  // คืนสิทธิ์เมื่อส่งไม่สำเร็จ จะได้ลองใหม่รอบถัดไป
  const releaseDailyNotice = async (kind, dateKey) => {
    sentNoticeCache.delete(`${kind}:${dateKey}`);
    await prisma.dailyNotice
      .deleteMany({ where: { kind, dateKey } })
      .catch((err) => console.error("[Notice] Release failed:", err));
  };

  // แจ้งครั้งเดียวต่อวัน เมื่อพนักงานทุกคนมีสแกนแรกของวันแล้ว
  const checkAllClockedIn = async (recordTime) => {
    const dateKey = getDateKey(recordTime);
    if (sentNoticeCache.has(`ALL_CLOCKED_IN:${dateKey}`)) return;

    const total = await prisma.employee.count();
    if (!total) return;

    const { start, end } = getDayRange(dateKey);
    const scanned = await prisma.attendance.findMany({
      where: { scannedAt: { gte: start, lte: end } },
      distinct: ["employeeId"],
      select: { employeeId: true },
    });
    if (scanned.length < total) return;

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

    if (!(await claimDailyNotice("ALL_CLOCKED_IN", dateKey))) return;
    try {
      await telegram.send(allClockedInMessage(lateEmployees));
    } catch (err) {
      await releaseDailyNotice("ALL_CLOCKED_IN", dateKey);
      console.error("[Telegram] All clocked-in message failed:", err);
    }
  };

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

      await checkAllClockedIn(recordTime);
    }
  };

  // ส่งแจ้งเตือนสแกนที่ยังไม่ได้ส่ง (notifiedAt = null) — ครอบทั้งสแกนใหม่
  // และรายการค้างจากช่วงเน็ตหลุด (บันทึก DB ได้แต่ส่ง Telegram ไม่ออก)
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
        break; // เน็ตน่าจะยังไม่มา หยุดรอบนี้ รักษาลำดับข้อความไว้รอบหน้า
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
    // แยกจาก try ของเครื่องสแกน: ปัญหาส่งแจ้งเตือนต้องไม่ไปกระตุ้น reconnect
    try {
      await flushScanNotifications();
    } catch (err) {
      console.error("[Notify] Flush pending notifications failed:", err);
    }
    polling = false;
  };

  // ถึงเวลาแล้ว (ส่งครั้งเดียวต่อวันผ่าน dedupe รายวัน) — ไม่ใช้หน้าต่างเวลาแคบ
  // เพื่อให้เปิดระบบสาย/เน็ตหลุดคาบเกี่ยวแล้วยังตามส่งได้ ระบบปิดทุกคืนจึงไม่ค้างข้ามวัน
  const isDue = (minuteNow, target) => minuteNow >= target;

  const checkDayStart = async () => {
    const now = new Date();
    const dateKey = getDateKey(now);
    if (!isDue(getMinuteOfDay(now), attCfg.dayStartAtMinutes)) return;
    if (!(await claimDailyNotice("DAY_START", dateKey))) return;
    try {
      await telegram.send(dayStartMessage(now));
    } catch (err) {
      await releaseDailyNotice("DAY_START", dateKey);
      console.error("[Telegram] Day start message failed:", err);
    }
  };

  const checkDailySummary = async () => {
    const now = new Date();
    const dateKey = getDateKey(now);
    if (!isDue(getMinuteOfDay(now), attCfg.summaryAtMinutes)) return;
    if (!(await claimDailyNotice("DAILY_SUMMARY", dateKey))) return;
    try {
      await telegram.send(await dailySummary(prisma, dateKey));
    } catch (err) {
      await releaseDailyNotice("DAILY_SUMMARY", dateKey);
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
