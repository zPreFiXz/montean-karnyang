const config = require("./config");
const { createDevice } = require("./device");
const { createEmployeeCache } = require("./attendance");
const { createSync } = require("./sync");
const { createNotifier } = require("./notifier");
const { log } = require("./log");

const zkErrorMessage = (err) => err?.err?.message || err?.message || String(err);

const startZktecoService = async (prisma) => {
  const { device: deviceCfg, attendance: attCfg } = config;

  if (!deviceCfg.ip) throw new Error("Missing ZKTECO_DEVICE_IP");
  if (!Number.isFinite(deviceCfg.port) || deviceCfg.port <= 0) {
    throw new Error("Invalid ZKTECO_DEVICE_PORT");
  }

  const device = createDevice();
  const employees = createEmployeeCache(prisma);
  const sync = createSync({ prisma, employees });
  const notifier = createNotifier({ prisma });

  let polling = false;
  let reconnecting = false;
  let connected = false;
  let stopped = false;
  let reconnectTimerId = null;
  let reconnectAttempts = 0;

  // แค่รายงานตัวเลข ไม่ลบอะไร — log ของเครื่องยิ่งโตยิ่งดึงช้า และเต็มแล้วเครื่องอาจหยุดบันทึก
  const logDeviceUsage = async () => {
    try {
      const info = await device.getInfo();
      const { logCounts, logCapacity, userCounts } = info;
      const percent = logCapacity ? ((logCounts / logCapacity) * 100).toFixed(1) : "?";
      log.info(
        "ZKTeco",
        `Device log ${logCounts}/${logCapacity} (${percent}%), users: ${userCounts}`,
      );
      await notifier.checkDeviceLog(info);
    } catch (err) {
      log.warn("ZKTeco", "Read device info failed:", zkErrorMessage(err));
    }
  };

  const connect = async () => {
    await device.connect();
    employees.warm(true).catch((err) => log.warn("Cache", "Employee warmup failed:", err));
    connected = true;
    reconnecting = false;
    reconnectAttempts = 0;
    logDeviceUsage();
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
    log.warn("ZKTeco", `Reconnecting in ${delay}ms (${reason})`);
    reconnectTimerId = setTimeout(async () => {
      try {
        await connect();
      } catch (err) {
        reconnecting = false;
        scheduleReconnect(zkErrorMessage(err));
      }
    }, delay);
  };

  const pullFromDevice = async () => {
    try {
      await sync.reconcile(await device.fetchLogs());
    } catch (err) {
      const message = zkErrorMessage(err);
      if (err.code === "FETCH_TIMEOUT") {
        log.warn("ZKTeco", `Fetch timeout (>${deviceCfg.fetchTimeoutMs}ms) — reconnecting`);
      } else {
        log.error("ZKTeco", `Polling error: ${message}`);
      }
      scheduleReconnect(message);
    }
  };

  // แยกจากเครื่องสแกน: ปัญหาฝั่ง Telegram ต้องไม่กระตุ้น reconnect
  const pushNotifications = async () => {
    try {
      await notifier.flushScanNotifications();
      await notifier.checkAllClockedIn(new Date());
      await notifier.checkAllLunchReturned(new Date());
    } catch (err) {
      log.error("Notify", "Flush pending notifications failed:", err);
    }
  };

  const poll = async () => {
    if (polling || reconnecting || !connected) return;
    polling = true;
    try {
      await pullFromDevice();
      await pushNotifications();
    } finally {
      polling = false;
    }
  };

  const checkSchedules = () => {
    notifier.checkDayStart();
    notifier.checkDailySummary();
  };

  await notifier
    .initDailyFlags()
    .catch((err) =>
      log.error("Notify", "Init daily flags failed (may resend today's notices):", err),
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
      log.error("ZKTeco", `Initialization failed: ${zkErrorMessage(err)}`);
      scheduleReconnect(zkErrorMessage(err));
    });

  return stop;
};

module.exports = { startZktecoService };
