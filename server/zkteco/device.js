const ZKLib = require("node-zklib");
const config = require("./config");
const { log } = require("./log");

const withTimeout = (promise, ms, code) => {
  let timer;
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      timer = setTimeout(() => {
        const err = new Error(`${code} (>${ms}ms)`);
        err.code = code;
        reject(err);
      }, ms);
    }),
  ]).finally(() => clearTimeout(timer));
};

const createDevice = () => {
  const { ip, port, socketTimeoutMs, connectionTimeoutMs, connectTimeoutMs, fetchTimeoutMs } =
    config.device;
  let connection = null;

  const disconnect = async () => {
    if (!connection) return;
    try {
      await connection.disconnect();
    } catch {}
    connection = null;
  };

  const connect = async () => {
    await disconnect();

    connection = new ZKLib(ip, port, socketTimeoutMs, connectionTimeoutMs);
    try {
      await withTimeout(connection.createSocket(), connectTimeoutMs, "CONNECT_TIMEOUT");
    } catch (err) {
      await disconnect();
      throw err;
    }
    log.info("ZKTeco", `Connected to ${ip}:${port}`);
  };

  const fetchLogs = async () => {
    if (!connection) throw new Error("ZKLib not connected");
    const result = await withTimeout(connection.getAttendances(), fetchTimeoutMs, "FETCH_TIMEOUT");
    return result?.data || [];
  };

  // { userCounts, logCounts, logCapacity } — อ่านอย่างเดียว ใช้ดูว่าหน่วยความจำเครื่องใกล้เต็มหรือยัง
  const getInfo = async () => {
    if (!connection) throw new Error("ZKLib not connected");
    return withTimeout(connection.getInfo(), connectTimeoutMs, "INFO_TIMEOUT");
  };

  return { connect, disconnect, fetchLogs, getInfo };
};

module.exports = { createDevice };
