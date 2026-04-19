const { CONFIG, TELEGRAM_TEXT_LIMIT } = require("./config");

const ERROR_CODE_MAP = {
  ENOTFOUND: { type: "dns", message: "DNS resolution failed" },
  ECONNREFUSED: { type: "connection", message: "connection refused" },
  ECONNRESET: { type: "network", message: "connection reset" },
};

const classifyTelegramError = (error) => {
  if (error?.name === "AbortError") {
    return {
      type: "timeout",
      message: `request timeout (${CONFIG.telegramRequestTimeoutMs}ms)`,
    };
  }

  if (ERROR_CODE_MAP[error?.code]) return ERROR_CODE_MAP[error.code];

  const message = String(error?.message || error);
  if (message.includes("fetch") || message.includes("network")) {
    return { type: "network", message };
  }

  return { type: "unknown", message };
};

const splitTelegramMessageText = (text) => {
  if (!text) return ["-"];
  if (text.length <= TELEGRAM_TEXT_LIMIT) return [text];

  const chunks = [];
  let current = "";

  for (const line of text.split("\n")) {
    const candidate = current ? `${current}\n${line}` : line;
    if (candidate.length <= TELEGRAM_TEXT_LIMIT) {
      current = candidate;
      continue;
    }

    if (current) chunks.push(current);
    if (line.length <= TELEGRAM_TEXT_LIMIT) {
      current = line;
      continue;
    }

    for (let index = 0; index < line.length; index += TELEGRAM_TEXT_LIMIT) {
      chunks.push(line.slice(index, index + TELEGRAM_TEXT_LIMIT));
    }
    current = "";
  }

  if (current) chunks.push(current);
  return chunks.length ? chunks : ["-"];
};

const sendTelegramMessageToChat = async (chatId, text, attempt = 1) => {
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    CONFIG.telegramRequestTimeoutMs,
  );

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${CONFIG.telegramBotToken}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({ chat_id: chatId, text }),
      },
    );

    clearTimeout(timeout);
    if (!response.ok) {
      const body = await response.text();
      throw new Error(`HTTP ${response.status}: ${body.substring(0, 200)}`);
    }
  } catch (error) {
    const detail = classifyTelegramError(error);
    if (attempt < 2 && ["timeout", "network"].includes(detail.type)) {
      console.warn(
        `Telegram retry [${chatId}] attempt ${attempt}: ${detail.type} - ${detail.message}`,
      );
      return sendTelegramMessageToChat(chatId, text, attempt + 1);
    }

    throw new Error(`[${chatId}] ${detail.type}: ${detail.message}`);
  } finally {
    clearTimeout(timeout);
  }
};

const normalizeMessageText = (message) =>
  typeof message === "string"
    ? message
    : message == null
      ? ""
      : JSON.stringify(message);

const sendTelegramMessage = async (message) => {
  if (!CONFIG.telegramBotToken || !CONFIG.telegramChatIds.length) {
    console.warn(
      "Skip Telegram send: missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_IDS",
    );
    return;
  }

  const chunks = splitTelegramMessageText(normalizeMessageText(message));
  const results = await Promise.allSettled(
    CONFIG.telegramChatIds.map(async (chatId) => {
      for (const chunk of chunks) {
        await sendTelegramMessageToChat(chatId, chunk);
      }
    }),
  );

  const failures = results
    .filter((result) => result.status === "rejected")
    .map((result) => result.reason?.message || String(result.reason));

  if (failures.length) {
    const totalTargets = CONFIG.telegramChatIds.length;
    const successCount = totalTargets - failures.length;
    const errorMsg = `Telegram send failed (${successCount}/${totalTargets} ok): ${failures.join(" | ")}`;
    console.error(errorMsg);
    throw new Error(errorMsg);
  }
};

module.exports = {
  sendTelegramMessage,
};
