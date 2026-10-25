const { test } = require("node:test");
const assert = require("node:assert");
const { nextSessionExpiry } = require("../utils/sessionExpiry");

// เวลาไทย = UTC+7 → จันทร์ 06:30 ไทย = จันทร์ 23:30 UTC ของวันอาทิตย์
const bkk = (iso) => new Date(`${iso}+07:00`);

test("ล็อกอินกลางสัปดาห์ หมดอายุจันทร์หน้า 06:30", () => {
  assert.deepEqual(
    nextSessionExpiry(bkk("2026-10-28T14:00:00")),
    bkk("2026-11-02T06:30:00"),
  );
});

test("วันอาทิตย์ดึกๆ หมดอายุเช้าวันจันทร์ถัดมา", () => {
  assert.deepEqual(
    nextSessionExpiry(bkk("2026-11-01T23:50:00")),
    bkk("2026-11-02T06:30:00"),
  );
});

test("วันจันทร์ก่อน 06:30 หมดอายุ 06:30 ของวันนั้น", () => {
  assert.deepEqual(
    nextSessionExpiry(bkk("2026-11-02T06:00:00")),
    bkk("2026-11-02T06:30:00"),
  );
});

test("วันจันทร์ตั้งแต่ 06:30 ใช้ได้ถึงจันทร์หน้า", () => {
  assert.deepEqual(
    nextSessionExpiry(bkk("2026-11-02T06:30:00")),
    bkk("2026-11-09T06:30:00"),
  );
  assert.deepEqual(
    nextSessionExpiry(bkk("2026-11-02T08:00:00")),
    bkk("2026-11-09T06:30:00"),
  );
});
