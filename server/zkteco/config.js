// ตารางร้าน: ระบบเปิด 06:25 ปิด 18:05 / เครื่องสแกนเปิด 06:30
const config = {
  device: {
    ip: process.env.ZKTECO_DEVICE_IP,
    port: Number(process.env.ZKTECO_DEVICE_PORT || 4370),
    socketTimeoutMs: 10_000,
    connectionTimeoutMs: 4_000,
    connectTimeoutMs: 10_000,
    pollIntervalMs: 30_000,
    fetchTimeoutMs: 20_000,
    reconnectDelayMs: 10_000,
    reconnectMaxDelayMs: 30_000,
  },

  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN,
    chatIds: [...new Set(
      (process.env.TELEGRAM_CHAT_IDS || "")
        .split(/[\s,]+/)
        .map((id) => id.trim())
        .filter(Boolean),
    )],
    requestTimeoutMs: 15_000,
    textLimit: 4_096,
  },

  attendance: {
    lateAfterMinutes: 8 * 60,
    lunchBreakMinutes: 60,
    minScanGapMinutes: 5,
    stepStatuses: ["เข้างาน", "พักเที่ยง", "กลับจากพักเที่ยง", "เลิกงาน"],
    showClockInTimeUserIds: ["6"],
    employeeCacheTtlMs: 5 * 60 * 1_000,
    dayStartAtMinutes: 6 * 60 + 30,
    summaryAtMinutes: 18 * 60,
    scheduleCheckIntervalMs: 60_000,
    noticeGraceMinutes: 5,
    // เตือนเมื่อ log ในเครื่องสแกนใกล้เต็ม (เต็มแล้วบางรุ่นหยุดบันทึกการสแกน)
    // เครื่องจุ 100,000 แถว ใช้จริง ~25 แถว/วัน → เต็มในอีกราว 10 ปี
    // เตือนวันละครั้ง ค่านี้จึงเท่ากับจำนวนวันที่จะโดนเตือนด้วย: 98% = เหลือ ~79 วัน = 79 ข้อความ
    deviceLogWarnPercent: 98,
  },
};

module.exports = config;
