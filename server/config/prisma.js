const { PrismaClient, Prisma } = require('@prisma/client');

// คอลัมน์ทศนิยม (จำนวนในบิล, สต็อก) ถูกส่งกลับเป็นชนิด Decimal ซึ่งแปลงเป็น JSON เป็น "สตริง"
// หน้าเว็บทั้งระบบคิดเลขกับค่านี้เหมือนตัวเลขมาตลอด จึงบอกให้แปลงเป็นตัวเลขตอนส่งออก
// ไม่งั้นจะเจอบั๊กเงียบๆ แบบ "3.5" + 1 = "3.51"
Prisma.Decimal.prototype.toJSON = function toJSON() {
  return this.toNumber();
};

const prisma = new PrismaClient();

module.exports = prisma;
