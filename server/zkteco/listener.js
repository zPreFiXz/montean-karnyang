const ZKLib = require("node-zklib");
const { CONFIG, ZK_ATTENDANCE_TIMEOUT_MS } = require("./config");
const { createAttendanceService } = require("./attendance");
const {
  createDailySummarySender,
  buildDailyAttendanceSummaryMessage,
  formatAttendanceMessage,
} = require("./messages");
const { sendTelegramMessage } = require("./telegram");

const toErrorMessage = (error) => error?.message || String(error);

const validateConfig = () => {
  if (!CONFIG.zkIp) throw new Error("Missing ZKTECO_DEVICE_IP");
  if (!Number.isFinite(CONFIG.zkPort) || CONFIG.zkPort <= 0) {
    throw new Error("Invalid ZKTECO_DEVICE_PORT");
  }
};

const createDedupeChecker = () => {
  const cache = new Map();
  return (key) => {
    const now = Date.now();
    for (const [cacheKey, time] of cache.entries()) {
      if (now - time > CONFIG.dedupeWindowMs) cache.delete(cacheKey);
    }
    if (cache.has(key)) return true;
    cache.set(key, now);
    return false;
  };
};

const getLogKey = (log) =>
  `${String(log?.deviceUserId || "")}-${String(log?.recordTime || "")}`;

const getNewLogs = (logs, lastSeenKey) => {
  if (!logs.length) return [];
  const lastIndex = lastSeenKey
    ? logs.findIndex((log) => getLogKey(log) === lastSeenKey)
    : logs.length - 1;
  return lastIndex >= 0 ? logs.slice(lastIndex + 1) : logs.slice(-1);
};

const withAttendanceTimeout = (zk) =>
  Promise.race([
    zk.getAttendances(),
    new Promise((_, reject) =>
      setTimeout(
        () => reject(new Error("ZK_ATTENDANCE_TIMEOUT")),
        ZK_ATTENDANCE_TIMEOUT_MS,
      ),
    ),
  ]);

const startZktecoListener = async (prisma) => {
  validateConfig();

  const {
    warmEmployeeCache,
    findEmployeeByZkUserId,
    resolveScanStatusFromDb,
    saveAttendance,
    getEmployeeDisplayName,
  } = createAttendanceService(prisma);

  let zk;
  let lastSeenKey = "";
  let polling = false;
  let connected = false;
  let reconnecting = false;
  const employeeChains = new Map();

  const isDuplicate = createDedupeChecker();
  const sendDailySummaryIfNeeded = createDailySummarySender(
    sendTelegramMessage,
    (dateKey) =>
      buildDailyAttendanceSummaryMessage(
        prisma,
        getEmployeeDisplayName,
        dateKey,
      ),
  );

  const queueEmployeeScan = (empId, task) => {
    const key = empId || "__unknown__";
    const previous = employeeChains.get(key) || Promise.resolve();

    const current = previous
      .catch(() => {})
      .then(task)
      .catch((error) =>
        console.error("Scan processing error:", toErrorMessage(error)),
      )
      .finally(() => {
        if (employeeChains.get(key) === current) employeeChains.delete(key);
      });

    employeeChains.set(key, current);
  };

  const processLog = (log) => {
    const logKey = getLogKey(log);
    if (isDuplicate(logKey)) {
      lastSeenKey = logKey;
      return;
    }

    const empId = String(log?.deviceUserId || "");
    const recordTime = log?.recordTime || new Date();

    queueEmployeeScan(empId, async () => {
      const employee = await findEmployeeByZkUserId(empId);
      const scanStatus = employee?.id
        ? await resolveScanStatusFromDb(employee.id, recordTime)
        : "เข้างาน";
      const empName =
        employee?.fullName || `ไม่พบข้อมูลพนักงาน (${empId || "-"})`;

      void sendTelegramMessage(
        formatAttendanceMessage(empName, empId, scanStatus, recordTime),
      ).catch((error) =>
        console.error("Failed to send Telegram:", toErrorMessage(error)),
      );

      try {
        await saveAttendance(employee?.id, scanStatus, recordTime);
      } catch (error) {
        console.error("Failed to save attendance:", toErrorMessage(error));
      }
    });

    lastSeenKey = logKey;
  };

  const pollOnce = async () => {
    let attendanceData = { data: [] };
    try {
      attendanceData = (await withAttendanceTimeout(zk)) || { data: [] };
    } catch (error) {
      if (error?.message !== "ZK_ATTENDANCE_TIMEOUT") throw error;
      console.warn(
        `Attendance fetch timeout (>${ZK_ATTENDANCE_TIMEOUT_MS}ms), skipping this poll`,
      );
    }

    for (const log of getNewLogs(attendanceData.data || [], lastSeenKey)) {
      processLog(log);
    }
  };

  const connect = async () => {
    zk = new ZKLib(
      CONFIG.zkIp,
      CONFIG.zkPort,
      CONFIG.zkSocketTimeoutMs,
      CONFIG.zkInportTimeoutMs,
    );

    await zk.createSocket();
    const initialData = (await zk.getAttendances())?.data || [];
    void warmEmployeeCache(true).catch((error) =>
      console.warn("Employee cache warmup failed:", toErrorMessage(error)),
    );

    if (initialData.length) {
      lastSeenKey = getLogKey(initialData[initialData.length - 1]);
    }

    connected = true;
    reconnecting = false;
    console.log("ZKTeco connected");
  };

  const scheduleReconnect = (message) => {
    if (reconnecting) return;
    reconnecting = true;
    connected = false;

    console.error(
      `ZKTeco reconnect scheduled in ${CONFIG.zkReconnectDelayMs}ms: ${message || "unknown error"}`,
    );

    setTimeout(async () => {
      try {
        await connect();
      } catch (error) {
        reconnecting = false;
        scheduleReconnect(toErrorMessage(error));
      }
    }, CONFIG.zkReconnectDelayMs);
  };

  try {
    await connect();
    setInterval(() => void sendDailySummaryIfNeeded(), 60 * 1000);
    void sendDailySummaryIfNeeded();

    setInterval(() => {
      if (polling || reconnecting || !connected) return;
      polling = true;

      void (async () => {
        try {
          await pollOnce();
        } catch (error) {
          const errorMessage = toErrorMessage(error);
          console.error("Polling error:", errorMessage);
          scheduleReconnect(errorMessage);
        } finally {
          polling = false;
        }
      })();
    }, CONFIG.zkPollIntervalMs);
  } catch (error) {
    const errorMessage = toErrorMessage(error);
    console.error("ZKTeco connection error:", errorMessage);
    scheduleReconnect(errorMessage);
  }
};

module.exports = {
  startZktecoListener,
};
