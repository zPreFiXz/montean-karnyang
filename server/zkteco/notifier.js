const config = require("./config");
const {
  displayName,
  scanMessage,
  dayStartMessage,
  allClockedInMessage,
  allLunchReturnedMessage,
  dailySummary,
} = require("./formatter");
const telegram = require("./telegram");
const { getDateKey, getDayRange, getMinuteOfDay } = require("./time");

const { attendance: attCfg } = config;

// หน้าต่างส่ง: ตั้งแต่เวลาเป้าหมายไปอีก graceMinutes — กว้างพอให้ลองใหม่ได้หลายรอบ
// แต่ไม่กว้างจนข้อความไปโผล่ผิดเวลา ถ้าเลยหน้าต่างไปแล้วถือว่าข้ามวันนั้น
const isDue = (minuteNow, target) =>
  minuteNow >= target && minuteNow < target + attCfg.noticeGraceMinutes;

const createNotifier = ({ prisma }) => {
  // จำว่าข้อความรายวันแต่ละชนิดส่งของวันไหนไปแล้ว (อยู่ในหน่วยความจำ = รีสตาร์ทแล้วหาย)
  const sentOn = {
    dayStart: "",
    summary: "",
    allClockedIn: "",
    allLunchReturned: "",
  };

  const countDistinctEmployees = async (dateKey, where = {}) => {
    const { start, end } = getDayRange(dateKey);
    const rows = await prisma.attendance.findMany({
      where: { ...where, scannedAt: { gte: start, lte: end } },
      distinct: ["employeeId"],
      select: { employeeId: true },
    });
    return rows.length;
  };

  const countPresent = (dateKey) => countDistinctEmployees(dateKey);

  const countLunchReturned = (dateKey) =>
    countDistinctEmployees(dateKey, { type: { in: ["LUNCH_RETURN", "LUNCH_RETURN_LATE"] } });

  const lateEmployeesOf = async (dateKey, type) => {
    const { start, end } = getDayRange(dateKey);
    const scans = await prisma.attendance.findMany({
      where: { type, scannedAt: { gte: start, lte: end } },
      select: { statusLabel: true, employee: { select: { name: true } } },
      orderBy: { scannedAt: "asc" },
    });
    return scans.map((s) => ({ name: s.employee.name, statusLabel: s.statusLabel }));
  };

  // ตั้งธงก่อนส่งกันยิงซ้ำระหว่างรอ แล้วคืนธงถ้าส่งไม่ผ่านเพื่อให้รอบหน้าลองใหม่
  const sendOnce = async (kind, dateKey, buildMessage, errorLabel) => {
    if (sentOn[kind] === dateKey) return;
    sentOn[kind] = dateKey;
    try {
      await telegram.send(await buildMessage());
    } catch (err) {
      if (err?.ambiguous) {
        // timeout: Telegram อาจรับไปแล้ว คงธงไว้กันส่งซ้ำ — ข้อมูลยังเปิดดูได้ที่หน้ารายงาน
        console.error(`[Telegram] ${errorLabel} timed out — treated as sent:`, err);
        return;
      }
      sentOn[kind] = "";
      console.error(`[Telegram] ${errorLabel} failed:`, err);
    }
  };

  // เดาว่าข้อความประจำวันไหนส่งไปแล้ว กันเด้งซ้ำเมื่อ restart กลางวัน
  const initDailyFlags = async () => {
    const now = new Date();
    const dateKey = getDateKey(now);
    const minute = getMinuteOfDay(now);

    // ข้อความสองตัวนี้ไม่ทิ้งร่องรอยใน DB จึงกู้สถานะจาก "เลยเวลาส่งไปแล้วหรือยัง" อย่างเดียว
    // (worker เริ่มปกติ 06:25 ก่อนเวลาส่ง 06:30 เสมอ — ถ้าเลยเวลาแล้วแปลว่าเป็นการรีสตาร์ท)
    if (isDue(minute, attCfg.dayStartAtMinutes)) sentOn.dayStart = dateKey;
    if (isDue(minute, attCfg.summaryAtMinutes)) sentOn.summary = dateKey;

    const total = await prisma.employee.count();
    const present = await countPresent(dateKey);

    if (total && present >= total) sentOn.allClockedIn = dateKey;
    if (present && (await countLunchReturned(dateKey)) >= present) {
      sentOn.allLunchReturned = dateKey;
    }
  };

  const checkAllClockedIn = async (recordTime) => {
    const dateKey = getDateKey(recordTime);
    if (sentOn.allClockedIn === dateKey) return;

    const total = await prisma.employee.count();
    if (!total) return;
    if ((await countPresent(dateKey)) < total) return;

    await sendOnce(
      "allClockedIn",
      dateKey,
      async () => allClockedInMessage(await lateEmployeesOf(dateKey, "CLOCK_IN_LATE")),
      "All clocked-in message",
    );
  };

  const checkAllLunchReturned = async (recordTime) => {
    const dateKey = getDateKey(recordTime);
    if (sentOn.allLunchReturned === dateKey) return;

    // นับเฉพาะคนที่มาทำงานวันนั้น (มีสแกนแล้ว) ไม่รวมคนขาด/ลา
    const present = await countPresent(dateKey);
    if (!present) return;
    if ((await countLunchReturned(dateKey)) < present) return;

    await sendOnce(
      "allLunchReturned",
      dateKey,
      async () => allLunchReturnedMessage(await lateEmployeesOf(dateKey, "LUNCH_RETURN_LATE")),
      "All lunch-returned message",
    );
  };

  const checkDayStart = async () => {
    const now = new Date();
    if (!isDue(getMinuteOfDay(now), attCfg.dayStartAtMinutes)) return;
    await sendOnce("dayStart", getDateKey(now), async () => dayStartMessage(now), "Day start message");
  };

  const checkDailySummary = async () => {
    const now = new Date();
    if (!isDue(getMinuteOfDay(now), attCfg.summaryAtMinutes)) return;
    const dateKey = getDateKey(now);
    await sendOnce("summary", dateKey, () => dailySummary(prisma, dateKey), "Daily summary");
  };

  // ส่งแจ้งเตือนที่ค้าง (notifiedAt = null) รวมรายการช่วงเน็ตหลุด
  const flushScanNotifications = async () => {
    const { start, end } = getDayRange(getDateKey(new Date()));
    const pending = await prisma.attendance.findMany({
      where: { notifiedAt: null, scannedAt: { gte: start, lte: end } },
      select: {
        id: true,
        type: true,
        statusLabel: true,
        scannedAt: true,
        employee: { select: { name: true, zkUserId: true } },
      },
      orderBy: { scannedAt: "asc" },
    });

    for (const att of pending) {
      // มาร์คก่อนส่งเสมอ: ถ้าส่งผ่านแล้วค่อยมาร์คไม่ติด รอบหน้าจะแจ้งซ้ำ
      // เงื่อนไข notifiedAt: null อยู่ใน WHERE เพื่อให้การจองสิทธิ์เป็น atomic
      const claimed = await prisma.attendance.updateMany({
        where: { id: att.id, notifiedAt: null },
        data: { notifiedAt: new Date() },
      });
      if (claimed.count === 0) continue;

      try {
        await telegram.send(
          scanMessage(
            displayName(att.employee),
            att.employee.zkUserId,
            att.type,
            att.statusLabel,
            att.scannedAt,
          ),
        );
      } catch (err) {
        if (err?.ambiguous) {
          // timeout: Telegram อาจรับไปแล้ว ถ้าคืนสิทธิ์จะกลายเป็นแจ้งซ้ำ ยอมเสี่ยงตกหล่นดีกว่า
          console.error("[Telegram] Send timed out — treated as sent (may be missing):", err);
          continue;
        }
        // คืนสิทธิ์ให้รอบหน้าลองใหม่
        await prisma.attendance
          .update({ where: { id: att.id }, data: { notifiedAt: null } })
          .catch(() => {});
        console.error("[Telegram] Send notification failed (will retry):", err);
        break; // หยุดทั้งคิวเพื่อรักษาลำดับ ไว้ลองรอบหน้า
      }
    }
  };

  return {
    initDailyFlags,
    flushScanNotifications,
    checkAllClockedIn,
    checkAllLunchReturned,
    checkDayStart,
    checkDailySummary,
  };
};

module.exports = { createNotifier };
