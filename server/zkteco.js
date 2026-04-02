const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });
require("events").EventEmitter.defaultMaxListeners = 0;

const ZKLib = require("node-zklib");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const CONFIG = {
  zkIp: process.env.ZKTECO_DEVICE_IP || "192.168.1.101",
  zkPort: Number(process.env.ZKTECO_DEVICE_PORT || 4370),
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

const TIME_RULES = {
  lateAfterMinutes: 8 * 60,
  stepStatuses: ["เข้างาน", "พักเที่ยง", "กลับจากพักเที่ยง", "เลิกงาน"],
  lunchBreakMinutes: 60,
};

const LINE_PUSH_URL = "https://api.line.me/v2/bot/message/push";

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

const getBangkokDateKey = (dateInput) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(dateInput));

const getBangkokDayRange = (dateKey) => {
  const start = new Date(`${dateKey}T00:00:00+07:00`);
  const end = new Date(`${dateKey}T23:59:59.999+07:00`);
  return { start, end };
};

const getMinutesInBangkok = (dateInput) => {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Bangkok",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
    .format(new Date(dateInput))
    .split(":");

  return Number(parts[0] || 0) * 60 + Number(parts[1] || 0);
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

const formatThaiDateLabel = (dateInput) => {
  return new Date(dateInput).toLocaleDateString("th-TH", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "Asia/Bangkok",
  });
};

const formatThaiTimeLabel = (dateInput) => {
  return new Date(dateInput).toLocaleTimeString("th-TH", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Bangkok",
  });
};

const parseThaiDateTime = (thaiDateTime) => {
  const [dateOnly = thaiDateTime, timePart = ""] =
    String(thaiDateTime).split(" เวลา ");
  const timeOnly = timePart || "-";
  return { dateOnly, timeOnly };
};

const createScanStatusResolver = () => {
  const dailyStepTracker = new Map();

  return (empId, recordTime) => {
    const eventTime = recordTime || new Date();
    const minutes = getMinutesInBangkok(eventTime);
    const trackerKey = `${empId}-${getBangkokDateKey(eventTime)}`;
    const tracker = dailyStepTracker.get(trackerKey) || {
      step: 0,
      lunchOutMinutes: null,
    };

    if (tracker.step === 0) {
      dailyStepTracker.set(trackerKey, { step: 1, lunchOutMinutes: null });
      if (minutes > TIME_RULES.lateAfterMinutes) {
        return `เข้างาน (สาย ${minutes - TIME_RULES.lateAfterMinutes} นาที)`;
      }
      return "เข้างาน";
    }

    if (tracker.step === 1) {
      dailyStepTracker.set(trackerKey, { step: 2, lunchOutMinutes: minutes });
      return TIME_RULES.stepStatuses[1];
    }

    if (tracker.step === 2) {
      const lunchOutMinutes = tracker.lunchOutMinutes ?? minutes;
      const restMinutes = Math.max(0, minutes - lunchOutMinutes);
      const lateMinutes = Math.max(
        0,
        restMinutes - TIME_RULES.lunchBreakMinutes,
      );
      dailyStepTracker.set(trackerKey, { step: 3, lunchOutMinutes });

      if (lateMinutes > 0) {
        return `กลับจากพักเที่ยง (สาย ${lateMinutes} นาที)`;
      }

      return `กลับจากพักเที่ยง (พัก ${restMinutes} นาที)`;
    }

    dailyStepTracker.set(trackerKey, {
      step: 3,
      lunchOutMinutes: tracker.lunchOutMinutes,
    });
    return TIME_RULES.stepStatuses[3];
  };
};

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

const findEmployeeByZkUserId = async (zkUserId) => {
  if (!zkUserId) return null;
  return prisma.employee.findUnique({
    where: { zkUserId: String(zkUserId) },
    select: { id: true, fullName: true },
  });
};

const saveAttendance = async (employeeId, status, scanTime) => {
  await prisma.attendance.create({
    data: { employeeId: employeeId || null, status, scanTime },
  });
};

const getEmployeeDisplayName = (employee) => {
  if (!employee) return "-";
  return employee.nickname
    ? `${employee.fullName} (${employee.nickname})`
    : employee.fullName;
};

const buildDailySummaryListText = (items) => {
  if (!items.length) return "- ไม่มี";
  return items
    .slice(0, 15)
    .map((name) => `• ${name}`)
    .join("\n");
};

const buildDailyAttendanceSummaryMessage = async (dateKey) => {
  const { start, end } = getBangkokDayRange(dateKey);
  const thaiDateText = formatThaiDateLabel(start);
  const thaiTimeText = formatThaiTimeLabel(new Date());

  const employees = await prisma.employee.findMany({
    where: { isActive: true },
    orderBy: [{ fullName: "asc" }, { id: "asc" }],
    select: {
      id: true,
      fullName: true,
      nickname: true,
    },
  });

  if (!employees.length) {
    return {
      type: "flex",
      altText: `สรุปเวลาเข้างาน วันที่ ${thaiDateText}`,
      contents: {
        type: "bubble",
        size: "mega",
        body: {
          type: "box",
          layout: "vertical",
          spacing: "md",
          contents: [
            {
              type: "text",
              text: "📋 สรุปเวลาเข้างานประจำวัน",
              weight: "bold",
              size: "md",
              color: "#1DAB47",
            },
            {
              type: "text",
              text: `วันที่ ${thaiDateText}`,
              size: "sm",
              color: "#666666",
            },
            {
              type: "text",
              text: `เวลา ${thaiTimeText} น.`,
              size: "sm",
              color: "#666666",
            },
            {
              type: "separator",
              margin: "md",
            },
            {
              type: "text",
              text: "ไม่มีรายชื่อพนักงานที่ใช้งานอยู่",
              size: "sm",
              wrap: true,
            },
          ],
        },
      },
    };
  }

  const employeeIds = employees.map((employee) => employee.id);
  const attendances = await prisma.attendance.findMany({
    where: {
      employeeId: { in: employeeIds },
      scanTime: {
        gte: start,
        lte: end,
      },
    },
    select: {
      employeeId: true,
      status: true,
      scanTime: true,
    },
    orderBy: {
      scanTime: "asc",
    },
  });

  const grouped = new Map(
    employees.map((employee) => [
      employee.id,
      {
        ...employee,
        firstInWork: null,
        lunchOvertimeStatus: null,
      },
    ]),
  );

  for (const attendance of attendances) {
    const item = grouped.get(attendance.employeeId);
    if (!item) continue;

    if (attendance.status.startsWith("เข้างาน") && !item.firstInWork) {
      item.firstInWork = attendance;
    }

    const isLunchReturn = attendance.status.startsWith("กลับจากพักเที่ยง");
    const isOvertimeLunch =
      attendance.status.includes("สาย") ||
      attendance.status.includes("พักเกินเวลา");

    if (isLunchReturn && isOvertimeLunch && !item.lunchOvertimeStatus) {
      item.lunchOvertimeStatus = attendance.status;
    }
  }

  const absentOrLeave = [];
  const late = [];
  const lunchOvertime = [];

  for (const employee of grouped.values()) {
    if (!employee.firstInWork) {
      absentOrLeave.push(getEmployeeDisplayName(employee));
      continue;
    }

    if (employee.firstInWork.status.startsWith("เข้างาน (สาย")) {
      late.push(
        `${getEmployeeDisplayName(employee)} - ${employee.firstInWork.status}`,
      );
    }

    if (employee.lunchOvertimeStatus) {
      lunchOvertime.push(
        `${getEmployeeDisplayName(employee)} - ${employee.lunchOvertimeStatus}`,
      );
    }
  }

  return {
    type: "flex",
    altText: `สรุปเวลาเข้างาน วันที่ ${thaiDateText}`,
    contents: {
      type: "bubble",
      size: "giga",
      header: {
        type: "box",
        layout: "vertical",
        backgroundColor: "#1DAB47",
        paddingAll: "14px",
        contents: [
          {
            type: "text",
            text: "📋 สรุปเวลาเข้างานประจำวัน",
            color: "#FFFFFF",
            weight: "bold",
            size: "md",
          },
          {
            type: "text",
            text: `วันที่ ${thaiDateText} • ${thaiTimeText} น.`,
            color: "#E8F8ED",
            size: "xs",
            margin: "sm",
            wrap: true,
          },
        ],
      },
      body: {
        type: "box",
        layout: "vertical",
        spacing: "lg",
        paddingAll: "16px",
        contents: [
          {
            type: "box",
            layout: "vertical",
            spacing: "xs",
            contents: [
              {
                type: "text",
                text: `ขาด/ลา (${absentOrLeave.length})`,
                weight: "bold",
                size: "sm",
                color: "#B00020",
              },
              {
                type: "text",
                text: buildDailySummaryListText(absentOrLeave),
                size: "xs",
                color: "#444444",
                wrap: true,
              },
            ],
          },
          {
            type: "separator",
          },
          {
            type: "box",
            layout: "vertical",
            spacing: "xs",
            contents: [
              {
                type: "text",
                text: `มาสาย (${late.length})`,
                weight: "bold",
                size: "sm",
                color: "#A35A00",
              },
              {
                type: "text",
                text: buildDailySummaryListText(late),
                size: "xs",
                color: "#444444",
                wrap: true,
              },
            ],
          },
          {
            type: "separator",
          },
          {
            type: "box",
            layout: "vertical",
            spacing: "xs",
            contents: [
              {
                type: "text",
                text: `พักเกินเวลา (${lunchOvertime.length})`,
                weight: "bold",
                size: "sm",
                color: "#6A1B9A",
              },
              {
                type: "text",
                text: buildDailySummaryListText(lunchOvertime),
                size: "xs",
                color: "#444444",
                wrap: true,
              },
            ],
          },
        ],
      },
    },
  };
};

const createDailySummarySender = () => {
  let lastSentDateKey = "";
  let running = false;

  return async () => {
    if (running) return;

    const now = new Date();
    const dateKey = getBangkokDateKey(now);
    const currentMinutes = getMinutesInBangkok(now);

    if (currentMinutes < 18 * 60 || lastSentDateKey === dateKey) {
      return;
    }

    running = true;

    try {
      const message = await buildDailyAttendanceSummaryMessage(dateKey);
      await sendLineMessage(message);
      lastSentDateKey = dateKey;
      console.log(`Daily attendance summary sent for ${dateKey}`);
    } catch (error) {
      console.error("Failed to send daily summary:", error.message);
    } finally {
      running = false;
    }
  };
};

const sendLineMessage = async (message) => {
  if (!CONFIG.lineToken || !CONFIG.lineTargetIds.length) return;

  const headers = {
    Authorization: `Bearer ${CONFIG.lineToken}`,
    "Content-Type": "application/json",
  };

  const results = await Promise.allSettled(
    CONFIG.lineTargetIds.map((targetId) =>
      fetch(LINE_PUSH_URL, {
        method: "POST",
        headers,
        body: JSON.stringify({
          to: targetId,
          messages: [message],
        }),
      }).then(async (response) => {
        if (!response.ok) {
          const body = await response.text();
          throw new Error(`${targetId}: ${response.status} ${body}`);
        }
      }),
    ),
  );

  const failures = results
    .filter((result) => result.status === "rejected")
    .map((result) => result.reason?.message || String(result.reason));

  if (failures.length) {
    throw new Error(failures.join(" | "));
  }
};

const formatAttendanceMessage = (empName, empId, scanStatus, recordTime) => {
  const thaiDateTime = formatThaiDateTime(recordTime);
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

const startZktecoListener = async () => {
  validateConfig();

  let zk = null;
  let lastSeenKey = "";
  let polling = false;
  let connected = false;
  let reconnecting = false;

  const isDuplicate = createDedupeChecker();
  const resolveScanStatus = createScanStatusResolver();
  const sendDailySummaryIfNeeded = createDailySummarySender();

  const connect = async () => {
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

  const closeSocket = async () => {
    if (!zk || typeof zk.disconnect !== "function") return;
    try {
      await zk.disconnect();
    } catch {}
  };

  const scheduleReconnect = (message) => {
    if (reconnecting) return;
    reconnecting = true;
    connected = false;
    console.error(
      `ZKTeco reconnect scheduled in ${CONFIG.zkReconnectDelayMs}ms: ${message}`,
    );

    setTimeout(async () => {
      await closeSocket();
      try {
        await connect();
      } catch (error) {
        reconnecting = false;
        scheduleReconnect(error.message);
      }
    }, CONFIG.zkReconnectDelayMs);
  };

  try {
    await connect();

    setInterval(() => {
      void sendDailySummaryIfNeeded();
    }, 60 * 1000);

    void sendDailySummaryIfNeeded();

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
          const recordTime = log.recordTime || new Date();
          const scanStatus = resolveScanStatus(empId, recordTime);
          const employee = await findEmployeeByZkUserId(empId);
          const empName =
            employee?.fullName || `ไม่พบข้อมูลพนักงาน (${empId || "-"})`;

          void sendLineMessage(
            formatAttendanceMessage(empName, empId, scanStatus, recordTime),
          ).catch((error) => {
            console.error("Failed to send LINE:", error.message);
          });

          void saveAttendance(employee?.id, scanStatus, recordTime).catch(
            (error) => {
              console.error("Failed to save attendance:", error.message);
            },
          );

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

startZktecoListener();
