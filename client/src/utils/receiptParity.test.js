// ใบเสร็จวาดสองที่: ตัวอย่างบนจอ (client/src/utils/receipt.js) กับใบที่พิมพ์จริง (server/utils/receiptHtml.js)
// สองฝั่งต้องแบ่งหน้าและตั้งชื่อบรรทัดตรงกันทุกกรณี เทสต์นี้ป้อนบิลชุดเดียวกันให้ทั้งสองฝั่งแล้วเทียบผล
import { createRequire } from "module";
import { describe, expect, it } from "vitest";
import {
  asIssued,
  buildReceiptPages,
  receiptDocNo,
  receiptDocTitle,
  shortWorkName,
} from "@/utils/receipt";
import { partLine, repairWith, serviceLine } from "@/test/fixtures";

const require = createRequire(import.meta.url);
const server = require("../../../server/utils/receiptHtml.js")._test;

const longName = "ผ้าเบรกหน้า ".repeat(6).trim();
const bills = [];
const names = [
  ["ลูกหมากปีกนกบน VIGO 4WD", "ช่วงล่าง", "555"],
  ["น้ำมันเกียร์ (80W90)", "น้ำมัน", "VALVOLINE"],
  ["ยางใน 750-16 (จุ๊บเหล็ก)", "ยางใน", "PRI"],
  ["แบตเตอรี่ MF 55B24L", "แบตเตอรี่", "GS"],
  [longName, "เบรก", "BENDIX"],
];
for (const count of [1, 8, 10, 11, 14, 22]) {
  for (const status of ["PAID", "CREDIT", "ESTIMATE", "CANCELLED"]) {
    const items = Array.from({ length: count }, (_, i) => {
      const [name, categoryName, brand] = names[i % names.length];
      return partLine({
        id: i + 1,
        name,
        categoryName,
        brand,
        side: i % 7 === 3 ? "LEFT" : null,
      });
    });
    if (count % 2 === 0)
      items.push(serviceLine({ name: "ส่วนลด", unitPrice: -50 }));
    bills.push(
      repairWith(items, {
        status,
        cancelledStatus: status === "CANCELLED" ? "PAID" : null,
        deliveryNo: "DO-6910-0001",
        quotationNo: "QT-6910-0001",
      }),
    );
  }
}

const shape = (pages, nameOf) =>
  pages.map((page) =>
    page.map((row) => [nameOf(row), row.quantity, row.sideLabel]),
  );

describe("ตัวอย่างบนจอกับใบที่พิมพ์ตรงกัน", () => {
  it.each(bills.map((b, i) => [i, b]))("บิลชุดที่ %i", (_, raw) => {
    const client = asIssued(raw);
    const serverBill = server.asIssued(raw);
    expect(receiptDocTitle(client)).toBe(server.receiptDocTitle(serverBill));
    expect(receiptDocNo(client)).toBe(server.receiptDocNo(serverBill));

    for (const showBrand of [true, false]) {
      const c = buildReceiptPages(client, { showBrand });
      const s = server.receiptPages(serverBill, { showBrand });
      const clientName = ({ item, sideLabel }) => {
        const base = showBrand ? item.itemName : shortWorkName(item);
        return sideLabel ? `${base} (${sideLabel})` : base;
      };
      expect(shape(c.pages, clientName)).toEqual(shape(s.pages, s.rowName));
      expect(c.discountItems).toEqual(s.discountItems);
    }
  });
});
