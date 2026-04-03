const CONFIG = {
  zkIp: process.env.ZKTECO_DEVICE_IP || "192.168.1.101",
  zkPort: Number(process.env.ZKTECO_DEVICE_PORT || 4370),
  zkPollIntervalMs: 200,
  zkReconnectDelayMs: 5000,
  zkSocketTimeoutMs: 10000,
  zkInportTimeoutMs: 4000,
  lineRequestTimeoutMs: 5000,
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

const EMPLOYEE_CACHE_TTL_MS = 5 * 60 * 1000;
const ZK_ATTENDANCE_TIMEOUT_MS = 5000;
const LINE_PUSH_URL = "https://api.line.me/v2/bot/message/push";

module.exports = {
  CONFIG,
  TIME_RULES,
  EMPLOYEE_CACHE_TTL_MS,
  ZK_ATTENDANCE_TIMEOUT_MS,
  LINE_PUSH_URL,
};
