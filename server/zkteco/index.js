const config = require("./config");
const { createDevice, getNewLogs, logKey } = require("./device");
const { createEmployeeCache, resolveStatus, save } = require("./attendance");
const { displayName, scanMessage, dailySummary } = require("./formatter");
const telegram = require("./telegram");
const { getDateKey, getMinuteOfDay } = require("./time");

const zkErrorMessage = (err) =>
  err?.err?.message || err?.message || String(err);

const createDeduper = (windowMs) => {
  const seen = new Map();
  return (key) => {
    const now = Date.now();
    for (const [k, t] of seen) {
      if (now - t > windowMs) seen.delete(k);
    }
    if (seen.has(key)) return true;
    seen.set(key, now);
    return false;
  };
};

const startZktecoService = async (prisma) => {
  const { device: deviceCfg, attendance: attCfg } = config;

  if (!deviceCfg.ip) throw new Error("Missing ZKTECO_DEVICE_IP");
  if (!Number.isFinite(deviceCfg.port) || deviceCfg.port <= 0) {
    throw new Error("Invalid ZKTECO_DEVICE_PORT");
  }

  const device = createDevice();
  const employees = createEmployeeCache(prisma);
  const isDupe = createDeduper(deviceCfg.dedupeWindowMs);
  const chains = new Map();

  let lastSeenKey = "";
  let polling = false;
  let reconnecting = false;
  let connected = false;
  let lastSummaryDate = "";

  const processLog = (log) => {
    const key = logKey(log);
    if (isDupe(key)) return;

    const empId = String(log?.deviceUserId || "");
    const recordTime = log?.recordTime || new Date();

    const prev = chains.get(empId) || Promise.resolve();
    const task = prev
      .catch((err) => console.error("[ZKTeco] Chain error:", err))
      .then(async () => {
        const emp = await employees.find(empId);
        const status = await resolveStatus(prisma, emp?.id, recordTime);

        const name = displayName(emp);

        telegram
          .send(scanMessage(name, empId, status, recordTime))
          .catch((err) => console.error("[Telegram] Send notification failed:", err));

        try {
          await save(prisma, emp?.id, status, recordTime);
        } catch (err) {
          console.error("[DB] Save attendance failed:", err);
        }
      })
      .finally(() => {
        if (chains.get(empId) === task) chains.delete(empId);
      });

    chains.set(empId, task);
  };

  const poll = async () => {
    if (polling || reconnecting || !connected) return;
    polling = true;

    try {
      const logs = await device.fetchLogs();
      for (const log of getNewLogs(logs, lastSeenKey)) {
        processLog(log);
        lastSeenKey = logKey(log);
      }
    } catch (err) {
      if (err.message === "FETCH_TIMEOUT") {
        console.warn(`[ZKTeco] Fetch timeout (>${deviceCfg.fetchTimeoutMs}ms) — reconnecting`);
      } else {
        console.error(`[ZKTeco] Polling error: ${zkErrorMessage(err)}`);
      }
      scheduleReconnect(zkErrorMessage(err));
    } finally {
      polling = false;
    }
  };

  const checkDailySummary = async () => {
    const now = new Date();
    const dateKey = getDateKey(now);
    if (getMinuteOfDay(now) !== attCfg.summaryAtMinutes) return;
    if (lastSummaryDate === dateKey) return;

    try {
      await telegram.send(await dailySummary(prisma, dateKey));
      lastSummaryDate = dateKey;
    } catch (err) {
      console.error("[Telegram] Daily summary failed:", err);
    }
  };

  const connect = async () => {
    await device.connect();
    const logs = await device.fetchLogs();
    if (logs.length) lastSeenKey = logKey(logs[logs.length - 1]);

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
  const summaryTimerId = setInterval(checkDailySummary, 60_000);

  const stop = () => {
    clearInterval(pollTimerId);
    clearInterval(summaryTimerId);
    device.disconnect().catch(() => {});
  };

  connect()
    .then(checkDailySummary)
    .catch((err) => {
      console.error(`[ZKTeco] Initialization failed: ${zkErrorMessage(err)}`);
      scheduleReconnect(zkErrorMessage(err));
    });

  return stop;
};

module.exports = { startZktecoService };
