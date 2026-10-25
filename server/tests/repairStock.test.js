// ฐานข้อมูลจำลองในหน่วยความจำ ไม่ต้องต่อ MySQL
const { test } = require("node:test");
const assert = require("node:assert");
const { moveStock, ensureStockAvailable } = require("../utils/repairStock");

const fakeTx = (parts) => ({
  part: {
    findMany: async ({ where }) =>
      parts.filter((p) => where.id.in.includes(p.id)),
    findUnique: async ({ where }) => parts.find((p) => p.id === where.id),
    update: async ({ where, data }) => {
      const p = parts.find((x) => x.id === where.id);
      p.stockQuantity += data.stockQuantity.increment;
    },
    updateMany: async ({ where, data }) => {
      const p = parts.find((x) => x.id === where.id);
      if (!p || p.stockQuantity < where.stockQuantity.gte) return { count: 0 };
      p.stockQuantity -= data.stockQuantity.decrement;
      return { count: 1 };
    },
  },
});

const part = (id, stockQuantity, extra = {}) => ({
  id,
  brand: "555",
  name: `อะไหล่ ${id}`,
  unit: "ตัว",
  attributes: null,
  category: { name: "ช่วงล่าง" },
  stockQuantity,
  ...extra,
});

test("ตัดได้เมื่อสต็อกพอ และไม่ตัดจนติดลบ", async () => {
  const parts = [part(1, 2)];
  const tx = fakeTx(parts);
  await moveStock(tx, parts[0], 1, 2, "decrement");
  assert.equal(parts[0].stockQuantity, 0);
  await assert.rejects(moveStock(tx, parts[0], 1, 1, "decrement"), {
    code: 400,
    message: "สต็อก 555 อะไหล่ 1 ไม่พอ (เหลือ 0 ตัว ต้องใช้ 1 ตัว)",
  });
  assert.equal(parts[0].stockQuantity, 0);
});

test("รวมยอดอะไหล่ตัวเดียวกันทุกบรรทัดก่อนเทียบ", async () => {
  const parts = [part(1, 3)];
  const lines = [
    { partId: 1, part: parts[0], quantity: 2 },
    { partId: 1, part: parts[0], quantity: 2 },
  ];
  await assert.rejects(ensureStockAvailable(fakeTx(parts), lines), {
    message: /เหลือ 3 ตัว ต้องใช้ 4 ตัว/,
  });
  await ensureStockAvailable(fakeTx(parts), lines.slice(0, 1));
});

test("ชุดน้ำมันเทียบลิตรกับตัวเก็บน้ำมัน", async () => {
  const source = part(9, 10, { unit: "ลิตร", category: { name: "น้ำมัน" } });
  const kit = { oilSourceId: 9, oilLiters: 6 };
  const tx = fakeTx([source]);
  await ensureStockAvailable(tx, [{ partId: 5, part: kit, quantity: 1 }]);
  await assert.rejects(
    ensureStockAvailable(tx, [{ partId: 5, part: kit, quantity: 2 }]),
    { message: /เหลือ 10 ลิตร ต้องใช้ 12 ลิตร/ },
  );
});

test("บรรทัดบริการไม่มีสต็อกให้เช็ก", async () => {
  await ensureStockAvailable(fakeTx([]), [{ serviceId: 3, quantity: 5 }]);
});
