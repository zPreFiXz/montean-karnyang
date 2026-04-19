const CONFIG = {
  zkIp: process.env.ZKTECO_DEVICE_IP || "192.168.1.101",
  zkPort: Number(process.env.ZKTECO_DEVICE_PORT || 4370),
  zkPollIntervalMs: 200,
  zkReconnectDelayMs: 5000,
  zkSocketTimeoutMs: 10000,
  zkInportTimeoutMs: 4000,
  telegramRequestTimeoutMs: 5000,
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN,
  telegramChatIds: Array.from(
    new Set(
      (process.env.TELEGRAM_CHAT_IDS || "")
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
const TELEGRAM_TEXT_LIMIT = 4096;

module.exports = {
  CONFIG,
  TIME_RULES,
  EMPLOYEE_CACHE_TTL_MS,
  ZK_ATTENDANCE_TIMEOUT_MS,
  TELEGRAM_TEXT_LIMIT,
};
