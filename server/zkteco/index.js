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

const zkErrorMessage = (err) =>
  err?.err?.message || err?.message || String(err);

// คีย์ระบุ "การสแกน 1 ครั้ง" แบบไม่ซ้ำ = พนักงาน + เวลาสแกน
const scanKey = (employeeId, scanTime) =>
  `${employeeId}-${new Date(scanTime).getTime()}`;

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
  let lastDayStartDate = "";
  let lastSummaryDate = "";

  // ประมวลผลการสแกนของ "วันนี้" ที่ยังไม่มีใน DB
  // เทียบ log จากเครื่อง กับ DB → อันไหน DB ยังไม่มี = ยังไม่เคยบันทึก/แจ้ง
  // ทำให้ทนต่อเน็ตหลุดและ server รีสตาร์ท (DB คือแหล่งความจริง ไม่พึ่ง state ใน RAM)
  const reconcile = async (logs) => {
    const dateKey = getDateKey(new Date());
    const { start, end } = getDayRange(dateKey);

    const todayLogs = logs
      .filter((log) => {
        const t = new Date(log?.recordTime);
        return t >= start && t <= end;
      })
      .sort((a, b) => new Date(a.recordTime) - new Date(b.recordTime));

    if (!todayLogs.length) return;

    const existing = await prisma.attendance.findMany({
      where: { scanTime: { gte: start, lte: end } },
      select: { employeeId: true, scanTime: true },
    });
    const seen = new Set(
      existing.map((r) => scanKey(r.employeeId, r.scanTime)),
    );

    // เวลาสแกนล่าสุดต่อพนักงาน (ไว้กันการแตะซ้ำถี่ ๆ)
    const lastScan = new Map();
    for (const r of existing) {
      const t = new Date(r.scanTime).getTime();
      if (t > (lastScan.get(r.employeeId) ?? 0)) lastScan.set(r.employeeId, t);
    }
    const minGapMs = attCfg.minScanGapMinutes * 60_000;

    // ประมวลผลทีละรายการตามลำดับเวลา (resolveStatus อิงจำนวนสแกนที่มีใน DB)
    for (const log of todayLogs) {
      const empId = String(log?.deviceUserId || "");
      const recordTime = new Date(log?.recordTime);
      const emp = await employees.find(empId);

      // มีในเครื่องสแกนแต่ยังไม่ผูกกับพนักงานใน DB → ข้าม ไม่บันทึก ไม่แจ้ง
      // (เช่น ลืมสร้าง Employee หรือ zkUserId ไม่ตรงกัน)
      if (!emp) {
        console.warn(`[ZKTeco] Scan from unknown zkUserId=${empId} (no matching employee) — ignored`);
        continue;
      }

      const key = scanKey(emp.id, recordTime);
      if (seen.has(key)) continue;

      // แตะซ้ำห่างจากครั้งก่อนไม่ถึง minScanGap → ข้าม ไม่บันทึก ไม่แจ้ง
      const prevTime = lastScan.get(emp.id);
      if (prevTime && recordTime.getTime() - prevTime < minGapMs) continue;

      const status = await resolveStatus(prisma, emp.id, recordTime);
      const name = displayName(emp);

      try {
        await save(prisma, emp.id, status.type, status.text, recordTime);
        seen.add(key);
        lastScan.set(emp.id, recordTime.getTime());
      } catch (err) {
        console.error("[DB] Save attendance failed:", err);
        continue; // ยังไม่บันทึก → ไม่แจ้ง จะได้ลองใหม่รอบหน้า
      }

      telegram
        .send(scanMessage(name, empId, status.type, status.text, recordTime))
        .catch((err) =>
          console.error("[Telegram] Send notification failed:", err),
        );
    }
  };

  const poll = async () => {
    if (polling || reconnecting || !connected) return;
    polling = true;

    try {
      const logs = await device.fetchLogs();
      await reconcile(logs);
    } catch (err) {
      const message = zkErrorMessage(err);
      if (err.message === "FETCH_TIMEOUT") {
        console.warn(`[ZKTeco] Fetch timeout (>${deviceCfg.fetchTimeoutMs}ms) — reconnecting`);
      } else {
        console.error(`[ZKTeco] Polling error: ${message}`);
      }
      scheduleReconnect(message);
    } finally {
      polling = false;
    }
  };

  // จริงเมื่ออยู่ในหน้าต่าง [target, target+5) นาที
  // กันดริฟต์ข้ามนาที แต่ไม่ยิงย้อนหลังตอนเปิดเครื่องดึก ๆ (มี lastDate กันซ้ำอีกชั้น)
  const isWithinWindow = (minuteNow, target) =>
    minuteNow >= target && minuteNow < target + 5;

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

  // เช็คงานตามเวลา (เริ่มวัน / สรุปประจำวัน) ทุกนาที
  const checkSchedules = () => {
    checkDayStart();
    checkDailySummary();
  };

  const connect = async () => {
    await device.connect();

    employees
      .warm(true)
      .catch((err) => console.warn("[Cache] Employee warmup failed:", err));

    connected = true;
    reconnecting = false;
  };

  const scheduleReconnect = (reason) => {
    if (reconnecting) return;
    reconnecting = true;
    connected = false;

    console.warn(
      `[ZKTeco] Reconnecting in ${deviceCfg.reconnectDelayMs}ms (${reason})`,
    );

    setTimeout(async () => {
      try {
        await connect();
      } catch (err) {
        reconnecting = false;
        scheduleReconnect(zkErrorMessage(err));
      }
    }, deviceCfg.reconnectDelayMs);
  };

  const pollTimerId = setInterval(poll, deviceCfg.pollIntervalMs);
  const scheduleTimerId = setInterval(
    checkSchedules,
    attCfg.scheduleCheckIntervalMs,
  );

  const stop = () => {
    clearInterval(pollTimerId);
    clearInterval(scheduleTimerId);
    device.disconnect().catch(() => {});
  };

  connect()
    .then(poll) // ตามเก็บทันทีที่ต่อได้ ไม่ต้องรอรอบ poll ถัดไป
    .then(checkSchedules)
    .catch((err) => {
      console.error(`[ZKTeco] Initialization failed: ${zkErrorMessage(err)}`);
      scheduleReconnect(zkErrorMessage(err));
    });

  return stop;
};

module.exports = { startZktecoService };
