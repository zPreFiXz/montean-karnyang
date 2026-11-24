const { test } = require("node:test");
const assert = require("node:assert");
const { encodeCode128, canEncode, _test } = require("../utils/code128");
const { _test: label } = require("../utils/printLabel");
const { encodeCostCode } = require("../utils/costCode");

test("ตาราง Code 128 ทุกตัวกว้าง 11 module แท่งรวมเป็นเลขคู่ และไม่ซ้ำกัน", () => {
  const { PATTERNS } = _test;
  assert.equal(PATTERNS.length, 106);
  assert.equal(new Set(PATTERNS).size, 106);
  for (const pattern of PATTERNS) {
    const widths = [...pattern].map(Number);
    assert.equal(
      widths.reduce((a, b) => a + b, 0),
      11,
      pattern,
    );
    // คุณสมบัติของ Code 128: ความกว้างแท่ง (ตำแหน่งคู่) รวมกันได้เลขคู่เสมอ
    assert.equal((widths[0] + widths[2] + widths[4]) % 2, 0, pattern);
  }
});

test("เข้ารหัสได้ความยาวตามสูตร และมีหลักตรวจสอบถูกต้อง", () => {
  const widths = encodeCode128("BRK-0412");
  // start + 8 ตัว + checksum = 10 ตัว x 11 module + stop 13
  assert.equal(
    widths.reduce((a, b) => a + b, 0),
    10 * 11 + 13,
  );
  // "A" = 33, checksum = (104 + 33) % 103 = 34
  const single = encodeCode128("A").join("");
  assert.equal(single.slice(6, 12), _test.PATTERNS[33]);
  assert.equal(single.slice(12, 18), _test.PATTERNS[34]);
});

test("รหัสภาษาไทยหรือว่างทำบาร์โค้ดไม่ได้", () => {
  assert.equal(canEncode("น้ำมัน01"), false);
  assert.equal(canEncode(""), false);
  assert.equal(encodeCode128("ยาง"), null);
});

test("งานพิมพ์ TSPL มีขนาดฉลาก รูปขนาดพอดี และจำนวนแผ่น", () => {
  const bits = Buffer.alloc(60 * 320, 0xff).toString("base64");
  const job = label.buildTsplJob(bits, 3);
  const text = job.toString("latin1");
  assert.match(text, /^SIZE 60 mm,40 mm\r\n/);
  assert.match(text, /BITMAP 0,0,60,320,0,/);
  assert.ok(text.endsWith("\r\nPRINT 3,1\r\n"));
  const header =
    text.indexOf("BITMAP 0,0,60,320,0,") + "BITMAP 0,0,60,320,0,".length;
  assert.equal(job.length - header - "\r\nPRINT 3,1\r\n".length, 60 * 320);
});

test("สติกเกอร์ 40 x 30 มม. ใช้ขนาดและจำนวนจุดของตัวเอง", () => {
  const bits = Buffer.alloc(40 * 240, 0xff).toString("base64");
  const text = label.buildTsplJob(bits, 1, "40x30").toString("latin1");
  assert.match(text, /^SIZE 40 mm,30 mm\r\n/);
  assert.match(text, /BITMAP 0,0,40,240,0,/);
});

test("สติกเกอร์ 40 x 20 มม. ใช้ขนาดและจำนวนจุดของตัวเอง", () => {
  const bits = Buffer.alloc(40 * 160, 0xff).toString("base64");
  const text = label.buildTsplJob(bits, 1, "40x20").toString("latin1");
  assert.match(text, /^SIZE 40 mm,20 mm\r\n/);
  assert.match(text, /BITMAP 0,0,40,160,0,/);
});

test("รหัสราคาทุนแปลงเลขเป็นตัวอักษรตามคำลับ (1-9 แล้ว 0)", () => {
  const letters = [..."ABCDEFGHIJ"];
  assert.equal(encodeCostCode(350, letters), "CEJ");
  assert.equal(encodeCostCode(1205.4, letters), "ABJE");
  // คำลับยังไม่ได้ตั้งหรือผิดรูปแบบ ไม่เดารหัสเอง
  assert.equal(encodeCostCode(350, null), null);
});

test("คำลับต้องเป็นภาษาอังกฤษ 9 หรือ 10 ตัวไม่ซ้ำ ตัวเล็กแปลงเป็นตัวใหญ่", () => {
  const { keyLetters } = require("../utils/costCode");
  const original = process.env.LABEL_COST_KEY;
  try {
    process.env.LABEL_COST_KEY = "blackhorse";
    assert.equal(encodeCostCode(350), "AKE");
    // 9 ตัว เลข 0 คงเป็นเลข 0
    process.env.LABEL_COST_KEY = "ABCDEFGHI";
    assert.equal(encodeCostCode(350), "CE0");
    assert.equal(encodeCostCode(12500), "ABE00");
    for (const bad of [
      "BLACKHOR",
      "BLACKHORSB",
      "มณฑรกยงสดบ",
      "BLACK HORS",
      "ABCDEFGHIJK",
      "BLACKOUTS",
    ]) {
      process.env.LABEL_COST_KEY = bad;
      assert.equal(keyLetters(), null, bad);
    }
  } finally {
    if (original === undefined) delete process.env.LABEL_COST_KEY;
    else process.env.LABEL_COST_KEY = original;
  }
});
