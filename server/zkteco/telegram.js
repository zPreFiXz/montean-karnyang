const config = require("./config");

const MAX_RETRIES = 1;
const NETWORK_ERROR_CODES = new Set(["ENOTFOUND", "ECONNREFUSED", "ECONNRESET"]);

// ห้าม retry timeout: sendMessage ไม่ idempotent จะแจ้งเตือนซ้ำ
const isRetryable = (err) => NETWORK_ERROR_CODES.has(err?.code);

// timeout = ไม่รู้ว่า Telegram รับไปแล้วหรือยัง ผู้เรียกต้องไม่ลองส่งใหม่ ไม่งั้นได้ข้อความซ้ำ
const isAmbiguous = (err) => err?.name === "AbortError" || err?.ambiguous === true;

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
      throw new Error(`HTTP ${response.status}: ${(await response.text()).slice(0, 200)}`);
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

const send = async (message) => {
  const { botToken, chatIds } = config.telegram;
  if (!botToken || !chatIds.length) {
    console.warn("[Telegram] Skipped: BOT_TOKEN or CHAT_IDS not configured");
    return;
  }

  const chunks = splitText(typeof message === "string" ? message : JSON.stringify(message));

  const results = await Promise.allSettled(
    chatIds.map(async (chatId) => {
      for (const chunk of chunks) await sendToChat(chatId, chunk);
    }),
  );

  const failures = results
    .filter((r) => r.status === "rejected")
    .map((r) => r.reason?.message || String(r.reason));

  if (failures.length) {
    const error = new Error(
      `Send failed (${chatIds.length - failures.length}/${chatIds.length} succeeded): ${failures.join(" | ")}`,
    );
    // ส่งไม่สำเร็จแบบไม่รู้ผล -> ผู้เรียกต้องถือว่าส่งไปแล้ว กันแจ้งซ้ำ
    error.ambiguous = results.some((r) => r.status === "rejected" && isAmbiguous(r.reason));
    throw error;
  }
};

module.exports = { send };
