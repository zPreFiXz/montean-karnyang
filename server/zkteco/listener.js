const ZKLib = require("node-zklib");
const { CONFIG, ZK_ATTENDANCE_TIMEOUT_MS } = require("./config");
const {
  createDailySummarySender,
  buildDailyAttendanceSummaryMessage,
  formatAttendanceMessage,
} = require("./messages");
const { sendLineMessage } = require("./line");
const { createAttendanceService } = require("./attendance");

const validateConfig = () => {
  if (!CONFIG.zkIp) throw new Error("Missing ZKTECO_DEVICE_IP");
  if (!Number.isFinite(CONFIG.zkPort) || CONFIG.zkPort <= 0) {
    throw new Error("Invalid ZKTECO_DEVICE_PORT");
  }
};

const createZkClient = () =>
  new ZKLib(
    CONFIG.zkIp,
    CONFIG.zkPort,
    CONFIG.zkSocketTimeoutMs,
    CONFIG.zkInportTimeoutMs,
  );

const getLogKey = (log) =>
  `${String(log?.deviceUserId || "")}-${String(log?.recordTime || "")}`;

const createDedupeChecker = () => {
  const cache = new Map();

  return (key) => {
    const now = Date.now();
    for (const [cacheKey, timestamp] of cache.entries()) {
      if (now - timestamp > CONFIG.dedupeWindowMs) cache.delete(cacheKey);
    }
    if (cache.has(key)) return true;
    cache.set(key, now);
    return false;
  };
};

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
    new Promise((_, reject) => {
      setTimeout(
        () => reject(new Error("ZK_ATTENDANCE_TIMEOUT")),
        ZK_ATTENDANCE_TIMEOUT_MS,
      );
    }),
  ]);

const toErrorMessage = (error) => error?.message || String(error);
const startIntervalTask = (task, ms) => setInterval(() => void task(), ms);

const startZktecoListener = async (prisma) => {
  validateConfig();

  const {
    warmEmployeeCache,
    findEmployeeByZkUserId,
    resolveScanStatusFromDb,
    saveAttendance,
    getEmployeeDisplayName,
  } = createAttendanceService(prisma);

  let zk = null;
  let lastSeenKey = "";
  let polling = false;
  let connected = false;
  let reconnecting = false;
  const employeeProcessingChains = new Map();

  const isDuplicate = createDedupeChecker();
  const buildSummaryMessage = (dateKey) =>
    buildDailyAttendanceSummaryMessage(prisma, getEmployeeDisplayName, dateKey);
  const sendDailySummaryIfNeeded = createDailySummarySender(
    sendLineMessage,
    buildSummaryMessage,
  );

  const queueEmployeeScan = (empId, task) => {
    const chainKey = empId || "__unknown__";
    const previous =
      employeeProcessingChains.get(chainKey) || Promise.resolve();

    const current = previous
      .catch(() => {})
      .then(task)
      .catch((error) => {
        console.error(
          "Scan processing error:",
          error?.message || String(error),
        );
      })
      .finally(() => {
        if (employeeProcessingChains.get(chainKey) === current) {
          employeeProcessingChains.delete(chainKey);
        }
      });

    employeeProcessingChains.set(chainKey, current);
  };

  const processLog = (log) => {
    const logKey = getLogKey(log);
    if (isDuplicate(logKey)) {
      lastSeenKey = logKey;
      return;
    }

    const empId = String(log.deviceUserId || "");
    const recordTime = log.recordTime || new Date();

    queueEmployeeScan(empId, async () => {
      const employee = await findEmployeeByZkUserId(empId);
      const scanStatus = employee?.id
        ? await resolveScanStatusFromDb(employee.id, recordTime)
        : "เข้างาน";
      const empName =
        employee?.fullName || `ไม่พบข้อมูลพนักงาน (${empId || "-"})`;

      void sendLineMessage(
        formatAttendanceMessage(empName, empId, scanStatus, recordTime),
      ).catch((error) => {
        console.error("Failed to send LINE:", toErrorMessage(error));
      });

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

    const data = attendanceData.data || [];
    const newLogs = getNewLogs(data, lastSeenKey);
    if (!newLogs.length) return;

    for (const log of newLogs) processLog(log);
  };

  const connect = async () => {
    zk = createZkClient();
    await zk.createSocket();
    const initialData = (await zk.getAttendances())?.data || [];
    void warmEmployeeCache(true).catch((error) => {
      console.warn(
        "Employee cache warmup failed:",
        error?.message || String(error),
      );
    });
    if (initialData.length) {
      lastSeenKey = getLogKey(initialData[initialData.length - 1]);
    }

    connected = true;
    reconnecting = false;
    console.log("ZKTeco connected");
  };

  const scheduleReconnect = (message) => {
    const reason = message || "unknown error";
    if (reconnecting) return;
    reconnecting = true;
    connected = false;
    console.error(
      `ZKTeco reconnect scheduled in ${CONFIG.zkReconnectDelayMs}ms: ${reason}`,
    );

    setTimeout(async () => {
      try {
        await connect();
      } catch (error) {
        reconnecting = false;
        scheduleReconnect(error?.message || String(error));
      }
    }, CONFIG.zkReconnectDelayMs);
  };

  try {
    await connect();

    startIntervalTask(sendDailySummaryIfNeeded, 60 * 1000);

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
