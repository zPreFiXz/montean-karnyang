import { describe, expect, it } from "vitest";
import { allowsDecimalQuantity } from "@/constants/categories";
import {
  isGearOilItem,
  isMultiUseOil,
  oilSizeOf,
  oilUseLineName,
  oilUsesOf,
} from "@/utils/oil";

const oil = (name, extra = {}) => ({
  name,
  brand: "VALVOLINE",
  unit: "ลิตร",
  partNumber: "X",
  category: { name: "น้ำมัน" },
  ...extra,
});

describe("งานที่เลือกได้ตอนหยิบน้ำมันลงบิล", () => {
  it("น้ำมันเครื่องขวดลิตรเลือกได้สามงาน", () => {
    expect(oilUsesOf(oil("SUPER COMMONRAIL (15W40)"))).toEqual([
      "น้ำมันเครื่อง",
      "น้ำมันเกียร์",
      "น้ำมันเฟืองท้าย",
    ]);
  });

  it("น้ำมันเกียร์ 80W90 / 85W140 เลือกเกียร์หรือเฟืองท้าย", () => {
    expect(oilUsesOf(oil("น้ำมันเกียร์ (80W90)"))).toEqual([
      "น้ำมันเกียร์",
      "น้ำมันเฟืองท้าย",
    ]);
    expect(
      oilUsesOf(oil("น้ำมันเกียร์ HIGH PERFORMANCE (85W140)")),
    ).toHaveLength(2);
  });

  it("น้ำมันเกียร์ออโต้กับ 75W85 ลงบิลเลยไม่ถาม", () => {
    expect(oilUsesOf(oil("น้ำมันเกียร์ MaxLife ATF"))).toEqual([]);
    expect(oilUsesOf(oil("น้ำมันเกียร์ SYNCHROMESH (75W85)"))).toEqual([]);
  });

  it("ชุดน้ำมันที่ผูกกับตัวเก็บไม่ใช่น้ำมันหลายงาน", () => {
    expect(
      isMultiUseOil(oil("SUPER COMMONRAIL (15W40)", { oilSourceId: 3 })),
    ).toBe(false);
  });

  it("ชื่อบรรทัดเป็น ยี่ห้อ งาน เกรด ไม่ซ้อนชื่องานเดิม", () => {
    const gear = oil("น้ำมันเกียร์ (80W90)");
    expect(oilUseLineName(gear, "น้ำมันเฟืองท้าย")).toBe(
      "VALVOLINE น้ำมันเฟืองท้าย (80W90)",
    );
    expect(
      oilUseLineName(oil("SUPER COMMONRAIL (15W40)"), "น้ำมันเครื่อง"),
    ).toBe("VALVOLINE น้ำมันเครื่อง SUPER COMMONRAIL (15W40)");
  });

  it("น้ำมันเกียร์กับเฟืองท้ายนับเป็นน้ำมันเกียร์", () => {
    expect(
      isGearOilItem({ itemName: "VALVOLINE น้ำมันเฟืองท้าย (80W90)" }),
    ).toBe(true);
  });

  it("ขนาดอ่านจากวงเล็บ น้ำมันขวดลิตรนับเป็น 1L", () => {
    expect(oilSizeOf(oil("(4L) น้ำมันเครื่อง+กรอง"))).toBe("4L");
    expect(oilSizeOf(oil("SUPER COMMONRAIL (15W40)"))).toBe("1L");
  });
});

describe("จำนวนทศนิยมในบิล", () => {
  const oil = (extra) => ({
    name: "น้ำมันเบรก (DOT3)",
    category: { name: "น้ำมัน" },
    ...extra,
  });

  it("ทุกอะไหล่ในหมวดน้ำมันใส่ทศนิยมได้", () => {
    expect(allowsDecimalQuantity(oil())).toBe(true);
    expect(allowsDecimalQuantity(oil({ name: "น้ำกลั่น" }))).toBe(true);
  });

  it("ชุดน้ำมันเครื่องที่ผูกตัวเก็บนับเป็นชุด", () => {
    expect(allowsDecimalQuantity(oil({ oilSourceId: 4 }))).toBe(false);
  });

  it("หมวดอื่นยังเป็นจำนวนเต็ม", () => {
    expect(
      allowsDecimalQuantity({
        name: "ผ้าเบรกหน้า",
        category: { name: "เบรก" },
      }),
    ).toBe(false);
  });
});
