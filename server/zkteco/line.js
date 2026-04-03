const { CONFIG, LINE_PUSH_URL } = require("./config");

const ERROR_CODE_MAP = {
  ENOTFOUND: { type: "dns", message: "DNS resolution failed" },
  ECONNREFUSED: { type: "connection", message: "connection refused" },
  ECONNRESET: { type: "network", message: "connection reset" },
};

const classifyLineError = (error) => {
  const defaultMessage = String(error?.message || error);

  if (error?.name === "AbortError") {
    return {
      type: "timeout",
      message: `request timeout (${CONFIG.lineRequestTimeoutMs}ms)`,
    };
  }

  if (ERROR_CODE_MAP[error?.code]) {
    return ERROR_CODE_MAP[error.code];
  }

  if (
    error?.message?.includes("fetch") ||
    error?.message?.includes("network")
  ) {
    return { type: "network", message: defaultMessage };
  }

  return { type: "unknown", message: defaultMessage };
};

const isRetryableError = ({ type }, attempt) =>
  attempt < 2 && (type === "timeout" || type === "network");

const sendLineMessageToTarget = async (targetId, message, attempt = 1) => {
  const headers = {
    Authorization: `Bearer ${CONFIG.lineToken}`,
    "Content-Type": "application/json",
  };

  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    CONFIG.lineRequestTimeoutMs,
  );

  try {
    const response = await fetch(LINE_PUSH_URL, {
      method: "POST",
      headers,
      signal: controller.signal,
      body: JSON.stringify({
        to: targetId,
        messages: [message],
      }),
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`HTTP ${response.status}: ${body.substring(0, 200)}`);
    }

    return { success: true, targetId };
  } catch (error) {
    const lineError = classifyLineError(error);
    if (isRetryableError(lineError, attempt)) {
      console.warn(
        `LINE retry [${targetId}] attempt ${attempt}: ${lineError.type} - ${lineError.message}`,
      );
      return sendLineMessageToTarget(targetId, message, attempt + 1);
    }

    throw new Error(`[${targetId}] ${lineError.type}: ${lineError.message}`);
  } finally {
    clearTimeout(timeout);
  }
};

const sendLineMessage = async (message) => {
  if (!CONFIG.lineToken || !CONFIG.lineTargetIds.length) return;

  const results = await Promise.allSettled(
    CONFIG.lineTargetIds.map((targetId) =>
      sendLineMessageToTarget(targetId, message),
    ),
  );

  const failures = results
    .filter((result) => result.status === "rejected")
    .map((result) => result.reason?.message || String(result.reason));

  if (failures.length) {
    const msgType = message.type || "unknown";
    const totalTargets = CONFIG.lineTargetIds.length;
    const successCount = CONFIG.lineTargetIds.length - failures.length;
    const errorMsg = `LINE push [${msgType}] failed (${successCount}/${totalTargets} ok): ${failures.join(" | ")}`;
    console.error(errorMsg);
    throw new Error(errorMsg);
  }
};

module.exports = {
  sendLineMessage,
};
