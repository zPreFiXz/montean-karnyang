require("dotenv").config();
require("events").EventEmitter.defaultMaxListeners = 0;

const ZKLib = require("node-zklib");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const LINE_PUSH_URL = "https://api.line.me/v2/bot/message/push";
const CONFIG = {
  zkIp: process.env.ZKTECO_DEVICE_IP,
  zkPort: Number(process.env.ZKTECO_DEVICE_PORT),
  zkPollIntervalMs: Number(process.env.ZKTECO_POLL_INTERVAL_MS || 300),
  zkReconnectDelayMs: Number(process.env.ZKTECO_RECONNECT_DELAY_MS || 5000),
  zkSocketTimeoutMs: 10000,
  zkInportTimeoutMs: 4000,
  lineToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  lineTargetIds: Array.from(
    new Set(
      (process.env.LINE_TARGET_IDS || "")
        .split(/[\s,]+/)
        .map((id) => id.trim())
        .filter(Boolean),
    ),
  ),
  dedupeWindowMs: 2 * 60 * 1000,
};

const createZkClient = () =>
  new ZKLib(
    CONFIG.zkIp,
    CONFIG.zkPort,
    CONFIG.zkSocketTimeoutMs,
    CONFIG.zkInportTimeoutMs,
  );

const STATUS_TIME_RULES = {
  lateAfterMinutes: 8 * 60,
  lunchFromMinutes: 10 * 60,
  lunchBreakMinutes: 60,
  offWorkFromMinutes: 17 * 60,
};

const formatThaiDateTime = (dateInput) => {
  const date = new Date(dateInput);
  const dateText = date.toLocaleDateString("th-TH", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "Asia/Bangkok",
  });
  const timeText = date.toLocaleTimeString("th-TH", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Bangkok",
  });
  return `${dateText} เวลา ${timeText} น.`;
};

const getMinutesInBangkok = (dateInput) => {
  const date = new Date(dateInput);
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Bangkok",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const [hourText = "0", minuteText = "0"] = formatter.format(date).split(":");
  const hour = Number(hourText);
  const minute = Number(minuteText);

  return hour * 60 + minute;
};

const getLogKey = (log) =>
  `${String(log?.deviceUserId || "")}-${String(log?.recordTime || "")}`;

const parseThaiDateTime = (thaiDateTime) => {
  const [dateOnly = thaiDateTime, timePart = ""] =
    String(thaiDateTime).split(" เวลา ");
  const timeOnly = timePart || "-";
  return { dateOnly, timeOnly };
};

const getBangkokDateKey = (dateInput) => {
  const date = new Date(dateInput);
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
};

const createScanStatusResolver = () => {
  const lunchOutTracker = new Map();

  return (empId, recordTime) => {
    const eventTime = recordTime || new Date();
    const minutes = getMinutesInBangkok(eventTime);
    const dateKey = getBangkokDateKey(eventTime);
    const trackerKey = `${empId}-${dateKey}`;

    if (minutes >= STATUS_TIME_RULES.offWorkFromMinutes) {
      return "เลิกงาน";
    }

    if (minutes >= STATUS_TIME_RULES.lunchFromMinutes) {
      if (!lunchOutTracker.has(trackerKey)) {
        lunchOutTracker.set(trackerKey, { lunchOutMinutes: minutes });
        return "พักเที่ยง";
      }

      const tracker = lunchOutTracker.get(trackerKey);
      const lunchOutMinutes = tracker?.lunchOutMinutes ?? minutes;
      const lunchDuration = Math.max(0, minutes - lunchOutMinutes);

      if (lunchDuration > STATUS_TIME_RULES.lunchBreakMinutes) {
        const lateMinutes = lunchDuration - STATUS_TIME_RULES.lunchBreakMinutes;
        return `กลับจากพักเที่ยง (สาย ${lateMinutes} นาที)`;
      }

      return "กลับจากพักเที่ยง (ตรงเวลา)";
    }

    if (minutes > STATUS_TIME_RULES.lateAfterMinutes) {
      const lateMinutes = minutes - STATUS_TIME_RULES.lateAfterMinutes;
      return `เข้างาน (สาย ${lateMinutes} นาที)`;
    }

    return "เข้างาน";
  };
};

const validateLineConfig = () => {
  if (!CONFIG.lineToken) {
    throw new Error("LINE configuration missing (channel access token)");
  }

  if (!CONFIG.lineTargetIds.length) {
    throw new Error("LINE configuration missing (target IDs)");
  }
};

const getLineHeaders = () => ({
  Authorization: `Bearer ${CONFIG.lineToken}`,
  "Content-Type": "application/json",
});

const sendPushToTarget = async (targetId, message) => {
  const response = await fetch(LINE_PUSH_URL, {
    method: "POST",
    headers: getLineHeaders(),
    body: JSON.stringify({
      to: targetId,
      messages: [message],
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    const requestId = response.headers.get("x-line-request-id") || "-";
    throw new Error(
      `LINE push API error (${targetId}): ${response.status} | requestId=${requestId} | ${errorBody}`,
    );
  }
};

const getRejectedReasons = (results) =>
  results
    .filter((result) => result.status === "rejected")
    .map((result) => result.reason?.message || String(result.reason));

const sendLineMessage = async (message) => {
  validateLineConfig();

  const results = await Promise.allSettled(
    CONFIG.lineTargetIds.map((targetId) => sendPushToTarget(targetId, message)),
  );

  const failures = getRejectedReasons(results);

  if (failures.length) {
    throw new Error(failures.join(" | "));
  }
};

const formatAttendanceMessage = (empName, empId, thaiDateTime, scanStatus) => {
  const { dateOnly, timeOnly } = parseThaiDateTime(thaiDateTime);

  return {
    type: "flex",
    altText: `⏰ ${scanStatus}: ${empName}`,
    contents: {
      type: "bubble",
      size: "mega",
      header: {
        type: "box",
        layout: "vertical",
        backgroundColor: "#1DAB47",
        paddingTop: "16px",
        paddingBottom: "16px",
        paddingAll: "12px",
        contents: [
          {
            type: "box",
            layout: "horizontal",
            contents: [
              {
                type: "text",
                text: "⏰ บันทึกเวลาเข้า-ออกงาน",
                size: "md",
                weight: "bold",
                color: "#ffffff",
                gravity: "center",
              },
            ],
          },
        ],
      },
      body: {
        type: "box",
        layout: "vertical",
        paddingAll: "20px",
        contents: [
          {
            type: "box",
            layout: "horizontal",
            spacing: "lg",
            contents: [
              {
                type: "text",
                text: "รหัส",
                color: "#8C8C8C",
                size: "md",
                flex: 3,
              },
              {
                type: "text",
                text: empId || "-",
                color: "#111111",
                size: "md",
                weight: "bold",
                flex: 7,
              },
            ],
          },
          {
            type: "box",
            layout: "horizontal",
            spacing: "lg",
            margin: "md",
            contents: [
              {
                type: "text",
                text: "พนักงาน",
                color: "#8C8C8C",
                size: "md",
                flex: 3,
              },
              {
                type: "text",
                text: empName,
                color: "#111111",
                size: "md",
                weight: "bold",
                wrap: true,
                flex: 7,
              },
            ],
          },
          {
            type: "box",
            layout: "horizontal",
            spacing: "lg",
            margin: "md",
            contents: [
              {
                type: "text",
                text: "สถานะ",
                color: "#8C8C8C",
                size: "md",
                flex: 3,
              },
              {
                type: "text",
                text: scanStatus,
                color: "#111111",
                size: "md",
                weight: "bold",
                wrap: true,
                flex: 7,
              },
            ],
          },
          {
            type: "separator",
            margin: "xl",
            color: "#EBEBEB",
          },
          {
            type: "box",
            layout: "vertical",
            margin: "xl",
            backgroundColor: "#F4FDF7",
            paddingAll: "16px",
            cornerRadius: "8px",
            alignItems: "center",
            contents: [
              {
                type: "text",
                text: `วันที่ ${dateOnly}`,
                size: "md",
                color: "#1DAB47",
                weight: "bold",
                wrap: true,
                margin: "sm",
              },
            ],
          },
          {
            type: "box",
            layout: "vertical",
            margin: "md",
            backgroundColor: "#FFF8F0",
            paddingAll: "16px",
            cornerRadius: "8px",
            alignItems: "center",
            contents: [
              {
                type: "text",
                text: `เวลา ${timeOnly}`,
                size: "md",
                color: "#FF6B35",
                weight: "bold",
                wrap: true,
                margin: "sm",
              },
            ],
          },
        ],
      },
    },
  };
};

const createDedupeChecker = () => {
  const sentCache = new Map();

  return (key) => {
    const now = Date.now();

    for (const [cacheKey, timestamp] of sentCache.entries()) {
      if (now - timestamp > CONFIG.dedupeWindowMs) {
        sentCache.delete(cacheKey);
      }
    }

    if (sentCache.has(key)) {
      return true;
    }

    sentCache.set(key, now);
    return false;
  };
};

const getNewLogs = (logs, lastSeenKey) => {
  if (!logs.length) {
    return [];
  }

  const lastIndex = lastSeenKey
    ? logs.findIndex((log) => getLogKey(log) === lastSeenKey)
    : logs.length - 1;

  return lastIndex >= 0 ? logs.slice(lastIndex + 1) : logs.slice(-1);
};

const findEmployeeByZkUserId = async (zkUserId) => {
  if (!zkUserId) return null;

  return prisma.employee.findUnique({
    where: {
      zkUserId: String(zkUserId),
    },
    select: {
      id: true,
      fullName: true,
    },
  });
};

const saveAttendance = async (employeeId, scanStatus, scanTime) => {
  await prisma.attendance.create({
    data: {
      status: scanStatus,
      scanTime,
      employeeId: employeeId || null,
    },
  });
};

const startZKTecoListener = async () => {
  let zk = null;
  let lastSeenKey = "";
  let polling = false;
  let reconnecting = false;
  let connected = false;
  const isDuplicate = createDedupeChecker();
  const resolveScanStatus = createScanStatusResolver();

  const connectZk = async () => {
    zk = createZkClient();
    await zk.createSocket();

    const initialData = (await zk.getAttendances())?.data || [];
    if (initialData.length) {
      lastSeenKey = getLogKey(initialData[initialData.length - 1]);
    }

    connected = true;
    reconnecting = false;
    console.log("ZKTeco connected");
  };

  const closeCurrentSocket = async () => {
    if (!zk) return;

    try {
      if (typeof zk.disconnect === "function") {
        await zk.disconnect();
      }
    } catch {
      // ignore close errors
    }
  };

  const scheduleReconnect = (sourceErrorMessage) => {
    if (reconnecting) return;

    reconnecting = true;
    connected = false;
    console.error(
      `ZKTeco reconnect scheduled in ${CONFIG.zkReconnectDelayMs}ms: ${sourceErrorMessage}`,
    );

    setTimeout(async () => {
      await closeCurrentSocket();

      try {
        await connectZk();
      } catch (reconnectError) {
        reconnecting = false;
        scheduleReconnect(reconnectError.message);
      }
    }, CONFIG.zkReconnectDelayMs);
  };

  try {
    await connectZk();

    setInterval(async () => {
      if (polling || reconnecting || !connected) return;
      polling = true;

      try {
        const data = (await zk.getAttendances())?.data || [];
        const newLogs = getNewLogs(data, lastSeenKey);
        if (!newLogs.length) return;

        for (const log of newLogs) {
          const logKey = getLogKey(log);
          if (isDuplicate(logKey)) {
            lastSeenKey = logKey;
            continue;
          }

          const empId = String(log.deviceUserId || "");
          const employee = await findEmployeeByZkUserId(empId);
          const empName =
            employee?.fullName || `ไม่พบข้อมูลพนักงาน (${empId || "-"})`;
          const thaiDateTime = formatThaiDateTime(log.recordTime || new Date());
          const scanStatus = resolveScanStatus(
            empId,
            log.recordTime || new Date(),
          );
          const lineMessage = formatAttendanceMessage(
            empName,
            empId,
            thaiDateTime,
            scanStatus,
          );

          void sendLineMessage(lineMessage).catch((error) => {
            console.error("Failed to send LINE:", error.message);
          });

          void saveAttendance(
            employee?.id,
            scanStatus,
            log.recordTime || new Date(),
          ).catch((error) => {
            console.error("Failed to save attendance:", error.message);
          });

          lastSeenKey = logKey;
        }
      } catch (error) {
        console.error("Polling error:", error.message);
        scheduleReconnect(error.message);
      } finally {
        polling = false;
      }
    }, CONFIG.zkPollIntervalMs);
  } catch (error) {
    console.error("ZKTeco connection error:", error.message);
    scheduleReconnect(error.message);
  }
};

startZKTecoListener();
