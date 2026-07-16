const ZKLib = require("node-zklib");
const config = require("./config");

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
  let zk = null;

  const disconnect = async () => {
    if (!zk) return;
    try {
      await zk.disconnect();
    } catch {}
    zk = null;
  };

  const connect = async () => {
    await disconnect();

    zk = new ZKLib(ip, port, socketTimeoutMs, connectionTimeoutMs);
    try {
      await withTimeout(zk.createSocket(), connectTimeoutMs, "CONNECT_TIMEOUT");
    } catch (err) {
      await disconnect();
      throw err;
    }
    console.log(`[ZKTeco] Connected to ${ip}:${port}`);
  };

  const fetchLogs = async () => {
    if (!zk) throw new Error("ZKLib not connected");
    const data = await withTimeout(zk.getAttendances(), fetchTimeoutMs, "FETCH_TIMEOUT");
    return data?.data || [];
  };

  return { connect, disconnect, fetchLogs };
};

module.exports = { createDevice };
