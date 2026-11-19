// ถอดรหัสไฟล์สำรองกลับเป็น .sql สำหรับกู้คืน
// ใช้: npm run backup:decrypt -- <ไฟล์.sql.gz.enc> [ไฟล์ปลายทาง.sql]
require("dotenv").config({ quiet: true });
const fs = require("fs");
const zlib = require("zlib");
const { decryptBuffer } = require("./backupCrypto");

const [input, output = input?.replace(/\.gz\.enc$/, "")] =
  process.argv.slice(2);

try {
  if (!input) throw new Error("ระบุไฟล์สำรองที่จะถอดรหัส");
  const password = process.env.BACKUP_PASSWORD;
  if (!password) throw new Error("ตั้ง BACKUP_PASSWORD ใน .env ก่อน");
  const sql = zlib.gunzipSync(decryptBuffer(fs.readFileSync(input), password));
  fs.writeFileSync(output, sql);
  console.log(`ถอดรหัสแล้ว: ${output}`);
} catch (error) {
  console.error(`ถอดรหัสไม่สำเร็จ: ${error.message}`);
  process.exitCode = 1;
}
