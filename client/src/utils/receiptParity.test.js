// ใบเสร็จวาดสองที่: ตัวอย่างบนจอ (client/src/utils/receipt.js) กับใบที่พิมพ์จริง (server/utils/receiptHtml.js)
// สองฝั่งต้องแบ่งหน้าและตั้งชื่อบรรทัดตรงกันทุกกรณี เทสต์นี้ป้อนบิลชุดเดียวกันให้ทั้งสองฝั่งแล้วเทียบผล
import { createRequire } from "module";
import { describe, expect, it } from "vitest";
import {
  asIssued,
  billPages,
  billPageHeight,
  BILL_PAGE_LIMITS,
  buildReceiptPages,
  jobSheetPages,
  receiptDateOf,
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
  ["สายพาน 12.5x1000", "สายพาน", "BANDO"],
  ["ใบปัดน้ำฝน 18 นิ้ว", "ใบปัดน้ำฝน", "BOSCH"],
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
        side: i % 7 === 3 ? "LEFT" : i % 5 === 2 ? "RIGHT" : null,
      });
    });
    if (count % 2 === 0)
      items.push(serviceLine({ name: "ส่วนลด", unitPrice: -50 }));
    bills.push(
      repairWith(items, {
        type: count % 2 ? "SUSPENSION" : "GENERAL",
        status,
        cancelledStatus: status === "CANCELLED" ? "PAID" : null,
        // บิลเครดิตที่จ่ายแล้วยังมีเลขใบส่งของ ใบเสร็จจึงมีช่องวิธีจ่ายแทน QR
        deliveryNo: status === "CREDIT" || count % 2 ? "DO-6910-0001" : null,
        // เช็คมีบรรทัดธนาคารสองบรรทัด แผ่นสุดท้ายรับรายการได้น้อยลง
        paymentMethod: status === "PAID" && count % 3 === 2 ? "CHEQUE" : null,
        chequeBank: "ธนาคารเพื่อการเกษตรและสหกรณ์การเกษตร",
        chequeNo: "10234567",
        quotationNo: "QT-6910-0001",
        // ช่องวิธีจ่ายมีเฉพาะหน่วยงาน
        customer: { organizationType: count % 4 < 2 ? "GOVERNMENT" : "SHOP" },
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
      const clientName = ({ item, sideLabel, note, noteRef }) => {
        if (note) return `${note} ${noteRef}`;
        const base = showBrand ? item.itemName : shortWorkName(item);
        return sideLabel ? `${base} (${sideLabel})` : base;
      };
      expect(shape(c.pages, clientName)).toEqual(shape(s.pages, s.rowName));
      expect(c.discountItems).toEqual(s.discountItems);
    }
  });
});

// ใบวางบิลแบ่งแผ่นตามความสูงแถว (รถสองบรรทัด ค่าอะไหล่/ค่าบริการบรรทัดเดียว)
// แผ่นสุดท้ายรับได้น้อยกว่าเพราะต้องมีที่ให้ QR
describe("ใบวางบิลแบ่งแผ่นตรงกันทั้งสองฝั่ง", () => {
  const ids = (pages) => pages.map((page) => page.map((bill) => bill.id));
  const bill = (id) =>
    id % 3 === 0
      ? { id, type: "SALE" }
      : {
          id,
          type: "GENERAL",
          vehicle: {
            fleetNo: id % 2 ? "12" : null,
            licensePlate: { plateNumber: "กข 1234", province: "ศรีสะเกษ" },
            vehicleModel: { brand: "Toyota", model: "Revo" },
          },
        };
  for (const count of [0, 1, 5, 6, 7, 11, 12, 16, 17, 23, 37]) {
    it(`${count} บิล`, () => {
      const repairs = Array.from({ length: count }, (_, i) => bill(i + 1));
      const client = billPages(repairs);
      expect(ids(server.billPages(repairs))).toEqual(ids(client));
      expect(client.flat()).toHaveLength(count);
      expect(billPageHeight(client.at(-1))).toBeLessThanOrEqual(
        BILL_PAGE_LIMITS.lastPage,
      );
      for (const page of client) {
        expect(billPageHeight(page)).toBeLessThanOrEqual(BILL_PAGE_LIMITS.page);
      }
    });
  }
});

// ใบสั่งซ่อมแบ่งแผ่นตามความสูงโดยประมาณ ตัวอย่างบนจอต้องได้แผ่นเท่ากับใบที่พิมพ์
describe("ใบสั่งซ่อมแบ่งแผ่นตรงกันทั้งสองฝั่ง", () => {
  const shapeOf = ({ pages }) =>
    pages.map((page) => ({
      sides: page.sides.map((pair) => pair.map((row) => row?.item.id ?? null)),
      others: page.others.map((row) => row.item.id),
      extra: page.extra,
    }));
  for (const bill of bills) {
    it(`บิล ${bill.repairItems.length} รายการ ${bill.type}`, () => {
      const repair = { ...bill, description: "ช่วงล่างมีเสียง ".repeat(4) };
      expect(shapeOf(jobSheetPages(repair))).toEqual(
        shapeOf(server.jobSheetPages(repair)),
      );
    });
  }
});

// ใบเสร็จที่จ่ายแล้วลงวันที่รับเงิน ใบอื่นลงวันเปิดบิล
describe("วันที่บนใบเสร็จตรงกันทั้งสองฝั่ง", () => {
  const createdAt = "2026-10-06T03:00:00.000Z";
  const paidAt = "2026-11-05T03:00:00.000Z";
  it.each([
    [{ status: "PAID", createdAt, paidAt }, paidAt],
    [
      { status: "CANCELLED", cancelledStatus: "PAID", createdAt, paidAt },
      paidAt,
    ],
    [{ status: "CREDIT", createdAt }, createdAt],
    [{ status: "COMPLETED", createdAt }, createdAt],
    [{ status: "ESTIMATE", createdAt }, createdAt],
  ])("%o", (raw, expected) => {
    expect(receiptDateOf(asIssued(raw))).toBe(expected);
    expect(server.receiptDateOf(server.asIssued(raw))).toBe(expected);
  });
});
