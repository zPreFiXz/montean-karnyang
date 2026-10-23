import { describe, expect, it } from "vitest";
import {
  MIN_ROWS,
  asIssued,
  buildReceiptPages,
  receiptDocNo,
  receiptDocTitle,
  shortWorkName,
  shortWorkNameBase,
} from "@/utils/receipt";
import { partLine, repairWith, serviceLine } from "@/test/fixtures";

const manyLines = (n) =>
  Array.from({ length: n }, (_, i) =>
    partLine({ id: i + 1, name: `สายพาน ${i + 1}`, categoryName: "อื่นๆ" }),
  );

describe("แบ่งหน้าใบเสร็จ", () => {
  it("ทุกบรรทัดอยู่ครบ เรียงตามเดิม ไม่ซ้ำ ไม่หาย", () => {
    for (const n of [1, 9, 10, 11, 12, 25]) {
      for (const status of ["PAID", "CREDIT", "ESTIMATE"]) {
        const items = manyLines(n);
        const { pages } = buildReceiptPages(repairWith(items, { status }));
        const flat = pages.flat().map((row) => row.item);
        expect(flat).toEqual(items);
      }
    }
  });

  it("ไม่มีแผ่นไหนเกินสิบบรรทัด", () => {
    const { pages } = buildReceiptPages(repairWith(manyLines(25)));
    for (const page of pages) expect(page.length).toBeLessThanOrEqual(MIN_ROWS);
  });

  it("ใบเสร็จที่มี QR แผ่นสุดท้ายรับได้น้อยกว่าใบเสนอราคา", () => {
    const paid = buildReceiptPages(
      repairWith(manyLines(10), { status: "PAID" }),
    );
    const estimate = buildReceiptPages(
      repairWith(manyLines(10), { status: "ESTIMATE" }),
    );
    expect(estimate.pages).toHaveLength(1);
    expect(paid.pages.length).toBeGreaterThanOrEqual(estimate.pages.length);
  });

  it("ส่วนลดไม่อยู่ในตาราง แยกออกมาเป็นแถวใต้ยอดรวม", () => {
    const discount = serviceLine({ name: "ส่วนลด", unitPrice: -100 });
    const { pages, discountItems } = buildReceiptPages(
      repairWith([...manyLines(2), discount]),
    );
    expect(discountItems).toEqual([discount]);
    expect(pages.flat()).toHaveLength(2);
  });

  it("ซ้ายกับขวาของชิ้นเดียวกันรวมเป็นแถวเดียว (L-R)", () => {
    const left = partLine({ name: "ลูกหมากปีกนกบน", side: "LEFT" });
    const right = partLine({ name: "ลูกหมากปีกนกบน", side: "RIGHT" });
    const { pages } = buildReceiptPages(repairWith([left, right]));
    expect(pages.flat()).toHaveLength(1);
    expect(pages[0][0]).toMatchObject({ sideLabel: "L-R", quantity: 2 });
  });
});

describe("ชื่อบนใบเสร็จแบบย่อ", () => {
  it("อะไหล่ช่วงล่างเหลือแค่ชนิด", () => {
    const item = partLine({ brand: "555", name: "ลูกหมากปีกนกบน VIGO 4WD" });
    expect(shortWorkName(item)).toBe("ลูกหมากปีกนกบน");
  });

  it("ชื่อที่พิมพ์ทับเองไม่ย่อ", () => {
    const item = partLine({
      name: "ลูกหมากปีกนกบน VIGO",
      itemName: "ค่าเปลี่ยนลูกหมาก",
    });
    expect(shortWorkName(item)).toBe("ค่าเปลี่ยนลูกหมาก");
  });

  it("ยางกับแบตเตอรี่เขียนเต็มพร้อมยี่ห้อ", () => {
    const item = partLine({
      brand: "GS",
      name: "แบตเตอรี่ MF 55B24L",
      categoryName: "แบตเตอรี่",
    });
    expect(shortWorkName(item)).toBe("GS แบตเตอรี่ MF 55B24L");
  });

  it("น้ำมันที่เลือกงานไว้ย่อได้ เหลือชื่องาน", () => {
    const item = partLine({
      brand: "VALVOLINE",
      name: "น้ำมันเกียร์ (80W90)",
      categoryName: "น้ำมัน",
      itemName: "VALVOLINE น้ำมันเฟืองท้าย (80W90)",
    });
    expect(shortWorkName(item)).toBe("น้ำมันเฟืองท้าย");
  });

  it("ยางในตัดชนิดจุ๊บในวงเล็บ แต่ใบสั่งซ่อมยังมี", () => {
    const item = partLine({
      brand: "PRI",
      name: "ยางใน 750-16 (จุ๊บเหล็ก)",
      categoryName: "ยางใน",
    });
    expect(shortWorkName(item)).toBe("ยางใน 750-16");
    expect(shortWorkNameBase(item)).toBe("ยางใน 750-16 (จุ๊บเหล็ก)");
  });
});

describe("ชื่อและเลขของเอกสาร", () => {
  const base = {
    receiptNo: "RE-6910-0005",
    deliveryNo: "DO-6910-0002",
    quotationNo: "QT-6910-0001",
  };

  it("ชื่อใบและเลขตามสถานะ", () => {
    expect([
      receiptDocTitle({ ...base, status: "PAID" }),
      receiptDocNo({ ...base, status: "PAID" }),
    ]).toEqual(["ใบเสร็จรับเงิน", "RE-6910-0005"]);
    expect([
      receiptDocTitle({ ...base, status: "CREDIT" }),
      receiptDocNo({ ...base, status: "CREDIT" }),
    ]).toEqual(["ใบส่งของ", "DO-6910-0002"]);
    expect([
      receiptDocTitle({ ...base, status: "ESTIMATE" }),
      receiptDocNo({ ...base, status: "ESTIMATE" }),
    ]).toEqual(["ใบเสนอราคา", "QT-6910-0001"]);
  });

  it("บิลที่ยกเลิกพิมพ์เป็นใบเดิมก่อนยกเลิก", () => {
    const issued = asIssued({
      ...base,
      status: "CANCELLED",
      cancelledStatus: "CREDIT",
    });
    expect(issued).toMatchObject({ status: "CREDIT", isCancelled: true });
    expect(receiptDocNo(issued)).toBe("DO-6910-0002");
  });
});
