// สำรองฐานข้อมูลทุกวันเป็น .zip ใส่รหัส (AES-256) ข้างในเป็นไฟล์ .sql
// เปิดด้วย 7-Zip หรือ WinRAR แล้วนำเข้า DBeaver ได้เลย เก็บในเครื่อง และคัดลอกไปโฟลเดอร์ Google Drive
// ตั้งค่าใน .env: BACKUP_PASSWORD (จำเป็น), BACKUP_DIR, BACKUP_DRIVE_DIR, BACKUP_KEEP_DAYS, MYSQLDUMP_PATH
const fs = require("fs");
const os = require("os");
const fsp = require("fs/promises");
const path = require("path");
const { spawn } = require("child_process");

// อ่าน .env จากโฟลเดอร์ server เสมอ ไม่ขึ้นกับว่า Task Scheduler เปิดสคริปต์จากโฟลเดอร์ไหน
require("dotenv").config({
  path: path.join(__dirname, "..", ".env"),
  quiet: true,
});

// ตั้งชื่อแบบเดียวกับที่ DBeaver ตั้งตอนสั่ง Dump เช่น dump-montean_karnyang-202611172251
const prefixOf = (database) => `dump-${database}-`;
const FILE_SUFFIX = ".zip";
// ค่าเริ่มต้นอยู่นอกโปรเจค ไฟล์สำรองมีข้อมูลลูกค้า ห้ามหลุดขึ้น git
const BACKUP_DIR =
  process.env.BACKUP_DIR || path.join(os.homedir(), "montean-backups");
const DRIVE_DIR = process.env.BACKUP_DRIVE_DIR || "";
const KEEP_DAYS = Number(process.env.BACKUP_KEEP_DAYS || 30);

// วินโดวส์มักไม่ได้ใส่ MySQL ไว้ใน PATH จึงไล่หาตำแหน่งติดตั้งปกติด้วย
const findMysqldump = () => {
  if (process.env.MYSQLDUMP_PATH) return process.env.MYSQLDUMP_PATH;
  if (process.platform !== "win32") return "mysqldump";
  const base = "C:\\Program Files\\MySQL";
  const found = fs.existsSync(base)
    ? fs
        .readdirSync(base)
        .filter((name) => name.startsWith("MySQL Server"))
        .sort()
        .reverse()
        .map((name) => path.join(base, name, "bin", "mysqldump.exe"))
        .find((file) => fs.existsSync(file))
    : null;
  const xampp = "C:\\xampp\\mysql\\bin\\mysqldump.exe";
  return found || (fs.existsSync(xampp) ? xampp : "mysqldump");
};

const stamp = (date = new Date()) => {
  const p = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}${p(date.getMonth() + 1)}${p(date.getDate())}${p(date.getHours())}${p(date.getMinutes())}`;
};

const log = async (message) => {
  const line = `${new Date().toLocaleString("th-TH")} ${message}\n`;
  process.stdout.write(line);
  await fsp.appendFile(path.join(BACKUP_DIR, "backup.log"), line);
};

const removeOld = async (dir, prefix) => {
  const cutoff = Date.now() - KEEP_DAYS * 86_400_000;
  const names = await fsp.readdir(dir).catch(() => []);
  let removed = 0;
  for (const name of names) {
    if (!name.startsWith(prefix) || !name.endsWith(FILE_SUFFIX)) continue;
    const file = path.join(dir, name);
    if ((await fsp.stat(file)).mtimeMs < cutoff) {
      await fsp.unlink(file);
      removed++;
    }
  }
  return removed;
};

const main = async () => {
  // โหลดตรงนี้ ไม่ใช่บนสุด ลืม npm install แล้วจะได้มีบรรทัดบอกใน backup.log ไม่ใช่ปิดไปเงียบๆ
  const archiver = require("archiver");
  if (!archiver.isRegisteredFormat("zip-encrypted")) {
    archiver.registerFormat("zip-encrypted", require("archiver-zip-encrypted"));
  }

  const password = process.env.BACKUP_PASSWORD;
  if (!password || password.length < 8) {
    throw new Error("ตั้ง BACKUP_PASSWORD ใน .env อย่างน้อย 8 ตัวอักษรก่อน");
  }
  const url = new URL(process.env.DATABASE_URL || "");
  const database = decodeURIComponent(url.pathname.replace(/^\//, ""));
  if (!database) throw new Error("อ่านชื่อฐานข้อมูลจาก DATABASE_URL ไม่ได้");

  await fsp.mkdir(BACKUP_DIR, { recursive: true });
  const baseName = `${prefixOf(database)}${stamp()}`;
  const fileName = `${baseName}${FILE_SUFFIX}`;
  const target = path.join(BACKUP_DIR, fileName);
  const partial = `${target}.part`;

  // รหัสผ่านส่งทางตัวแปรสภาพแวดล้อม ไม่ใส่ในบรรทัดคำสั่ง จะได้ไม่โผล่ในรายการโปรเซส
  const dump = spawn(
    findMysqldump(),
    [
      `--host=${url.hostname}`,
      `--port=${url.port || 3306}`,
      `--user=${decodeURIComponent(url.username)}`,
      // อ่านสแนปช็อตเดียว ไม่ล็อกตาราง ร้านยังใช้งานได้ระหว่างสำรอง
      "--single-transaction",
      "--routines",
      "--triggers",
      "--no-tablespaces",
      "--default-character-set=utf8mb4",
      database,
    ],
    {
      env: { ...process.env, MYSQL_PWD: decodeURIComponent(url.password) },
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  let stderr = "";
  dump.stderr.on("data", (chunk) => (stderr += chunk));
  const exited = new Promise((resolve, reject) => {
    dump.on("error", reject);
    dump.on("close", resolve);
  });

  try {
    // ส่งผลจาก mysqldump เข้า zip ตรงๆ ไฟล์ .sql ที่อ่านได้ไม่เคยถูกเขียนลงดิสก์
    const output = fs.createWriteStream(partial);
    const archive = archiver.create("zip-encrypted", {
      zlib: { level: 9 },
      encryptionMethod: "aes256",
      password,
    });
    const written = new Promise((resolve, reject) => {
      output.on("close", resolve);
      archive.on("error", reject);
    });
    archive.pipe(output);
    archive.append(dump.stdout, { name: `${baseName}.sql` });
    await archive.finalize();
    await written;
    const code = await exited;
    if (code !== 0) {
      throw new Error(`mysqldump ล้มเหลว: ${stderr.trim().slice(0, 300)}`);
    }
    await fsp.rename(partial, target);
  } catch (error) {
    await fsp.unlink(partial).catch(() => {});
    throw error;
  }

  const size = (await fsp.stat(target)).size;
  await log(`สำรองสำเร็จ ${fileName} (${(size / 1024).toFixed(0)} KB)`);

  if (DRIVE_DIR) {
    await fsp.mkdir(DRIVE_DIR, { recursive: true });
    await fsp.copyFile(target, path.join(DRIVE_DIR, fileName));
    await log(`คัดลอกไปโฟลเดอร์ Google Drive แล้ว`);
  }

  const removed =
    (await removeOld(BACKUP_DIR, prefixOf(database))) +
    (DRIVE_DIR ? await removeOld(DRIVE_DIR, prefixOf(database)) : 0);
  if (removed)
    await log(`ลบไฟล์สำรองที่เก่ากว่า ${KEEP_DAYS} วัน ${removed} ไฟล์`);
};

main().catch(async (error) => {
  await fsp.mkdir(BACKUP_DIR, { recursive: true }).catch(() => {});
  await log(`สำรองไม่สำเร็จ: ${error.message}`).catch(() => {});
  process.exitCode = 1;
});
