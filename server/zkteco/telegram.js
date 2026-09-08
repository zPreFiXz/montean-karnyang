const config = require("./config");
const { log } = require("./log");

const MAX_RETRIES = 1;
const NETWORK_ERROR_CODES = new Set(["ENOTFOUND", "ECONNREFUSED", "ECONNRESET"]);

// ห้าม retry timeout: sendMessage ไม่ idempotent จะแจ้งเตือนซ้ำ
const isRetryable = (err) => NETWORK_ERROR_CODES.has(err?.code);

// timeout = ไม่รู้ว่า Telegram รับไปแล้วหรือยัง ผู้เรียกต้องไม่ลองส่งใหม่ ไม่งั้นได้ข้อความซ้ำ
const isAmbiguous = (err) => err?.name === "AbortError" || err?.ambiguous === true;

// 429 มาพร้อม parameters.retry_after บอกตรงๆ ว่าให้รอกี่วินาที ต้องเชื่อค่านี้
// ยิงซ้ำก่อนครบเวลา Telegram จะเพิ่มโทษให้ยาวขึ้นอีก
const parseRetryAfterMs = (bodyText) => {
  try {
    const seconds = JSON.parse(bodyText)?.parameters?.retry_after;
    if (Number.isFinite(seconds) && seconds > 0) return seconds * 1_000;
  } catch {
    /* ไม่ใช่ JSON ก็ปล่อยให้ผู้เรียกใช้ backoff ปกติ */
  }
  return 0;
};

const sendToChat = async (chatId, text, attempt = 0) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.telegram.requestTimeoutMs);
  try {
    const response = await fetch(
      `https://api.telegram.org/bot${config.telegram.botToken}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({ chat_id: chatId, text }),
      },
    );
    if (!response.ok) {
      const body = (await response.text()) || "";
      const error = new Error(`HTTP ${response.status}: ${body.slice(0, 200)}`);
      if (response.status === 429) error.retryAfterMs = parseRetryAfterMs(body);
      throw error;
    }
  } catch (err) {
    if (attempt < MAX_RETRIES && isRetryable(err)) return sendToChat(chatId, text, attempt + 1);
    throw err;
  } finally {
    clearTimeout(timer);
  }
};

const splitText = (text) => {
  const limit = config.telegram.textLimit;
  if (!text) return ["-"];
  if (text.length <= limit) return [text];

  const chunks = [];
  let current = "";
  for (const line of text.split("\n")) {
    const next = current ? `${current}\n${line}` : line;
    if (next.length <= limit) {
      current = next;
      continue;
    }
    if (current) chunks.push(current);
    if (line.length <= limit) {
      current = line;
    } else {
      for (let i = 0; i < line.length; i += limit) chunks.push(line.slice(i, i + limit));
      current = "";
    }
  }
  if (current) chunks.push(current);
  return chunks.length ? chunks : ["-"];
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// ประตูกลางของทุกการส่ง: ระหว่างถูกลงโทษห้ามแตะเน็ตเลย
// เดิมผู้เรียกยิงซ้ำทุก 30 วิ Telegram จึงเพิ่มโทษเรื่อยๆ จนแจ้งเตือนหายทั้งวัน
let pausedUntil = 0;
let lastSentAt = 0;
let consecutiveFailures = 0;

const backoffFor = (attempt, retryAfterMs) => {
  const { backoffMs, maxBackoffMs } = config.telegram;
  const stepped = backoffMs[Math.min(attempt, backoffMs.length - 1)];
  return Math.min(Math.max(retryAfterMs || 0, stepped), maxBackoffMs);
};

const send = async (message) => {
  const { botToken, chatIds, sendGapMs } = config.telegram;
  if (!botToken || !chatIds.length) {
    log.warn("Telegram", "Skipped: BOT_TOKEN or CHAT_IDS not configured");
    return;
  }

  const pauseLeftMs = pausedUntil - Date.now();
  if (pauseLeftMs > 0) {
    // ยังโดนลงโทษอยู่: โยน error เงียบๆ ให้ผู้เรียกคืนคิวไว้รอบหน้า ห้ามแตะเน็ต
    const error = new Error(`Backing off ${Math.ceil(pauseLeftMs / 1_000)}s before next send`);
    error.backoff = true;
    throw error;
  }

  // เว้นจังหวะจากข้อความก่อนหน้า — รอเฉยๆ ไม่ใช่โยน error เพราะคิวที่ค้างต้องได้ไปต่อในรอบเดียว
  const gapLeftMs = lastSentAt + sendGapMs - Date.now();
  if (gapLeftMs > 0) await delay(gapLeftMs);

  const chunks = splitText(typeof message === "string" ? message : JSON.stringify(message));

  const results = await Promise.allSettled(
    chatIds.map(async (chatId) => {
      for (const [index, chunk] of chunks.entries()) {
        if (index > 0) await delay(sendGapMs);
        await sendToChat(chatId, chunk);
      }
    }),
  );

  const rejected = results.filter((r) => r.status === "rejected");

  lastSentAt = Date.now();

  if (!rejected.length) {
    consecutiveFailures = 0;
    return;
  }

  const retryAfterMs = Math.max(0, ...rejected.map((r) => r.reason?.retryAfterMs || 0));
  const pauseMs = backoffFor(consecutiveFailures, retryAfterMs);
  consecutiveFailures += 1;
  pausedUntil = Date.now() + pauseMs;

  const error = new Error(
    `Send failed (${chatIds.length - rejected.length}/${chatIds.length} succeeded): ${rejected
      .map((r) => r.reason?.message || String(r.reason))
      .join(" | ")}`,
  );
  // ส่งไม่สำเร็จแบบไม่รู้ผล -> ผู้เรียกต้องถือว่าส่งไปแล้ว กันแจ้งซ้ำ
  error.ambiguous = rejected.some((r) => isAmbiguous(r.reason));
  error.pausedMs = pauseMs;

  log.warn(
    "Telegram",
    `Send failed (ครั้งที่ ${consecutiveFailures}) — พัก ${Math.round(pauseMs / 1_000)} วินาทีก่อนลองใหม่`,
  );
  throw error;
};

module.exports = { send };
