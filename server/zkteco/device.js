const ZKLib = require("node-zklib");
const config = require("./config");

const withTimeout = (promise, ms) => {
  let timer;
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      timer = setTimeout(() => {
        const err = new Error(`Fetch timeout (>${ms}ms)`);
        err.code = "FETCH_TIMEOUT";
        reject(err);
      }, ms);
    }),
  ]).finally(() => clearTimeout(timer));
};

const createDevice = () => {
  const { ip, port, socketTimeoutMs, connectionTimeoutMs, fetchTimeoutMs } =
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
    await zk.createSocket();
    console.log(`[ZKTeco] Connected to ${ip}:${port}`);
  };

  const fetchLogs = async () => {
    if (!zk) throw new Error("ZKLib not connected");
    const data = await withTimeout(zk.getAttendances(), fetchTimeoutMs);
    return data?.data || [];
  };

  return { connect, disconnect, fetchLogs };
};

module.exports = { createDevice };
