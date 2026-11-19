const crypto = require("crypto");
const { Transform } = require("stream");

// รูปแบบไฟล์: MAGIC(8) | salt(16) | iv(12) | ข้อมูลเข้ารหัส | authTag(16)
// AES-256-GCM ตรวจได้ด้วยว่าไฟล์ถูกแก้หรือรหัสผิด กุญแจได้จาก scrypt ของรหัสผ่าน
const MAGIC = Buffer.from("MKBAK001");
const SALT_LEN = 16;
const IV_LEN = 12;
const TAG_LEN = 16;

const deriveKey = (password, salt) => crypto.scryptSync(password, salt, 32);

const createEncryptStream = (password) => {
  const salt = crypto.randomBytes(SALT_LEN);
  const iv = crypto.randomBytes(IV_LEN);
  const cipher = crypto.createCipheriv(
    "aes-256-gcm",
    deriveKey(password, salt),
    iv,
  );
  let headerSent = false;
  return new Transform({
    transform(chunk, _enc, done) {
      if (!headerSent) {
        this.push(Buffer.concat([MAGIC, salt, iv]));
        headerSent = true;
      }
      done(null, cipher.update(chunk));
    },
    flush(done) {
      if (!headerSent) this.push(Buffer.concat([MAGIC, salt, iv]));
      this.push(cipher.final());
      this.push(cipher.getAuthTag());
      done();
    },
  });
};

// ไฟล์สำรองเล็ก (ไม่กี่ MB) อ่านทั้งก้อนได้ ไม่ต้องแยกท้ายไฟล์ออกจากสตรีม
const decryptBuffer = (data, password) => {
  if (!data.subarray(0, MAGIC.length).equals(MAGIC)) {
    throw new Error("ไม่ใช่ไฟล์สำรองของระบบนี้");
  }
  let offset = MAGIC.length;
  const salt = data.subarray(offset, (offset += SALT_LEN));
  const iv = data.subarray(offset, (offset += IV_LEN));
  const body = data.subarray(offset, data.length - TAG_LEN);
  const tag = data.subarray(data.length - TAG_LEN);
  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    deriveKey(password, salt),
    iv,
  );
  decipher.setAuthTag(tag);
  try {
    return Buffer.concat([decipher.update(body), decipher.final()]);
  } catch {
    throw new Error("รหัสผ่านไม่ถูกต้อง หรือไฟล์เสียหาย");
  }
};

module.exports = { createEncryptStream, decryptBuffer };
