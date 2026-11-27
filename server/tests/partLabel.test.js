const { test } = require("node:test");
const assert = require("node:assert");
const { _test: label } = require("../utils/printLabel");
const { encodeCostCode } = require("../utils/costCode");
const { buildLabelHtml } = require("../utils/labelHtml");

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

test("รหัสบนฉลาก รหัสร้านต่อรหัสทุนแยกจากรหัสอะไหล่ และยี่ห้อแยกบรรทัด", () => {
  const html = (data) =>
    buildLabelHtml({
      name: "555 ลูกหมากปีกนกล่าง",
      brand: "555",
      partNumber: "BP-0412",
      price: 650,
      unit: "คู่",
      ...data,
    });
  const both = html({ supplierCode: "PM", costCode: "CEJ" });
  assert.match(both, /class="code"[^>]*>BP-0412</);
  assert.match(both, /class="secret">PMCEJ</);
  assert.match(html({ costCode: "CEJ" }), /class="secret">CEJ</);
  assert.doesNotMatch(html({}), /class="secret"/);
  assert.match(html({}), /<span class="brand">555<\/span> ลูกหมากปีกนกล่าง/);
  assert.match(html({ partNumber: "<b>" }), /&lt;b&gt;/);
});

test("พิมพ์ฉลากที่เลือกร้านที่สั่งต้องมีราคาต้นทุน ตัวอย่างไม่บังคับ", () => {
  const { partLabelSchema, partLabelPrintSchema } = require("../utils/schemas");
  const noCost = { size: "60x40", supplierCode: "PM" };
  assert.equal(partLabelPrintSchema.safeParse(noCost).success, false);
  assert.equal(partLabelSchema.safeParse(noCost).success, true);
  assert.equal(
    partLabelPrintSchema.safeParse({ ...noCost, costPrice: 350 }).success,
    true,
  );
  assert.equal(partLabelPrintSchema.safeParse({ size: "60x40" }).success, true);
});

test("ไม่ระบุร้านแต่มีราคาทุน รหัสขึ้นต้นด้วย MT ไม่มีราคาทุนไม่พิมพ์รหัส", async () => {
  const { buildLabelHtml: build } = require("../utils/labelHtml");
  const original = process.env.LABEL_COST_KEY;
  process.env.LABEL_COST_KEY = "ABCDEFGHIJ";
  try {
    const part = {
      name: "ลูกหมาก",
      partNumber: "BP-0412",
      sellingPrice: 650,
      unit: "คู่",
    };
    const htmlOf = (opts) => build({ ...label.labelDataOf(part, opts) });
    assert.match(htmlOf({ costPrice: 350 }), /class="secret">MTCEJ</);
    assert.match(
      htmlOf({ costPrice: 350, supplierCode: "PM" }),
      /class="secret">PMCEJ</,
    );
    assert.doesNotMatch(htmlOf({}), /class="secret"/);
  } finally {
    if (original === undefined) delete process.env.LABEL_COST_KEY;
    else process.env.LABEL_COST_KEY = original;
  }
});
