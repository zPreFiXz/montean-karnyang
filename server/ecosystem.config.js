// คอนฟิก PM2 สำหรับรันที่เครื่องร้าน: แยก API กับ ZKTeco worker เป็นคนละ process
// ใช้งาน:  pm2 start ecosystem.config.js
// บูตอัตโนมัติตามเครื่อง:  pm2 startup แล้ว pm2 save
module.exports = {
  apps: [
    {
      name: "montean-api",
      script: "server.js",
      env: { NODE_ENV: "production" },
      max_memory_restart: "300M",
      // กัน restart รัวถ้าพังตั้งแต่บูต (เช่น .env ขาด)
      min_uptime: "10s",
      max_restarts: 10,
    },
    {
      name: "montean-worker",
      script: "worker.js",
      env: { NODE_ENV: "production" },
      max_memory_restart: "300M",
      min_uptime: "10s",
      max_restarts: 10,
      // worker มี watchdog บังคับปิดใน 5 วิ อยู่แล้ว ให้เวลา shutdown พอ
      kill_timeout: 8000,
    },
  ],
};
