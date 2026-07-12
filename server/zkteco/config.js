const config = {
  device: {
    ip: process.env.ZKTECO_DEVICE_IP,
    port: Number(process.env.ZKTECO_DEVICE_PORT || 4370),
    socketTimeoutMs: 10_000,
    connectionTimeoutMs: 4_000,
    pollIntervalMs: 30_000,
    fetchTimeoutMs: 20_000,
    reconnectDelayMs: 10_000,
  },

  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN,
    chatIds: [...new Set(
      (process.env.TELEGRAM_CHAT_IDS || "")
        .split(/[\s,]+/)
        .map((id) => id.trim())
        .filter(Boolean),
    )],
    requestTimeoutMs: 5_000,
    textLimit: 4_096,
  },

  attendance: {
    lateAfterMinutes: 8 * 60,
    lunchBreakMinutes: 60,
    // สแกนซ้ำห่างจากครั้งก่อนไม่ถึงเท่านี้ = แตะซ้ำ ไม่นับเป็นสแกนใหม่
    minScanGapMinutes: 5,
    stepStatuses: ["เข้างาน", "พักเที่ยง", "กลับจากพักเที่ยง", "เลิกงาน"],
    employeeCacheTtlMs: 5 * 60 * 1_000,
    dayStartAtMinutes: 6 * 60 + 30, // 06:30 แจ้งเริ่มวันใหม่ + ยืนยันระบบทำงาน
    summaryAtMinutes: 18 * 60,
    scheduleCheckIntervalMs: 60_000,
  },
};

module.exports = config;
