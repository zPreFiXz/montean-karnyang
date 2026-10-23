import { describe, expect, it } from "vitest";
import { partLine, serviceLine } from "@/test/fixtures";
import {
  collapseSidePairs,
  countDisplayedItems,
  expandBothSides,
  groupSuspensionDetailItems,
  isSuspensionTabItem,
  mergeSidesInOrder,
} from "@/utils/repairItemGroups";

const line = (side, quantity = 1, extra = {}) => ({
  id: 7,
  partNumber: "P-7",
  name: "ลูกหมากปีกนกบน",
  sellingPrice: 500,
  side,
  quantity,
  ...extra,
});

describe("ซ้าย-ขวาในหน้ากรอกบิล", () => {
  it("แตกบรรทัดทั้งสองข้างเป็นซ้ายหนึ่งขวาหนึ่งก่อนบันทึก", () => {
    const out = expandBothSides([line("both", 4)]);
    expect(out.map((i) => [i.side, i.quantity])).toEqual([
      ["left", 2],
      ["right", 2],
    ]);
  });

  it("รวมซ้ายขวาที่จำนวนเท่ากันกลับเป็นบรรทัดเดียวตอนเปิดแก้ไข", () => {
    const out = collapseSidePairs([line("left", 1), line("right", 1)]);
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({ side: "both", quantity: 2 });
  });

  it("จำนวนไม่เท่ากันคงไว้สองบรรทัด เพราะแบ่งกลับไม่ได้", () => {
    const out = collapseSidePairs([line("left", 2), line("right", 1)]);
    expect(out.map((i) => i.side)).toEqual(["left", "right"]);
  });

  it("แตกแล้วรวมกลับได้ของเดิม", () => {
    const items = [
      line("both", 2),
      line(null, 1, { id: 8, partNumber: "P-8" }),
    ];
    expect(collapseSidePairs(expandBothSides(items))).toEqual(items);
  });

  it("นับซ้าย-ขวาของชิ้นเดียวกันเป็นรายการเดียว", () => {
    const rows = mergeSidesInOrder([line("left"), line("right")]);
    expect(rows).toHaveLength(1);
    expect(rows[0].sideLabel).toBe("L-R");
    expect(countDisplayedItems([line("LEFT"), line("RIGHT")])).toBe(1);
  });
});

describe("แยกของในแท็บช่วงล่างจากรายการซ่อมเพิ่มเติม", () => {
  const suspension = { category: { name: "ช่วงล่าง" } };

  it("อะไหล่ช่วงล่างที่มีข้างอยู่ในแท็บ", () => {
    expect(isSuspensionTabItem({ ...line("left"), ...suspension })).toBe(true);
    expect(isSuspensionTabItem({ ...line("other"), ...suspension })).toBe(true);
  });

  it("ของที่เลือกข้างเองจากหน้างานซ่อมอยู่ในรายการเพิ่มเติม", () => {
    expect(
      isSuspensionTabItem({ ...line("left"), ...suspension, pickedSide: true }),
    ).toBe(false);
  });

  it("อะไหล่หมวดอื่นที่มีข้าง (เบรก) อยู่ในรายการเพิ่มเติม", () => {
    expect(
      isSuspensionTabItem({ ...line("left"), category: { name: "เบรก" } }),
    ).toBe(false);
  });

  it("บริการตั้งลูกปืนล้อรายข้างอยู่ในแท็บ", () => {
    expect(isSuspensionTabItem({ name: "ตั้งลูกปืนล้อ", side: "left" })).toBe(
      true,
    );
  });
});

describe("แยกกลุ่มรายการในหน้ารายละเอียดบิลช่วงล่าง", () => {
  const perSide = { perSide: true };

  it("ของที่มีทั้งสองฝั่งยุบเป็นซ้าย-ขวา ที่เหลือแยกตามฝั่ง", () => {
    const g = groupSuspensionDetailItems([
      partLine({ name: "ลูกหมาก", id: 1, side: "LEFT" }),
      partLine({ name: "ลูกหมาก", id: 1, side: "RIGHT" }),
      partLine({ name: "บูช", id: 2, side: "LEFT" }),
      partLine({ name: "โช้ค", id: 3, side: "OTHER" }),
    ]);
    expect(g.bothSides).toHaveLength(1);
    expect(g.leftOnly.map((i) => i.part.name)).toEqual(["บูช"]);
    expect(g.rightOnly).toEqual([]);
    expect(g.otherItems.map((i) => i.part.name)).toEqual(["โช้ค"]);
  });

  it("บิลเก่าที่ไม่ระบุฝั่ง แบ่งเป็นคู่ เศษไปฝั่งซ้าย", () => {
    const g = groupSuspensionDetailItems([
      partLine({ name: "ลูกหมาก", id: 1, quantity: 3, attributes: perSide }),
    ]);
    expect(g.bothSides).toHaveLength(1);
    expect(g.leftOnly).toHaveLength(1);
    expect(g.rightOnly).toHaveLength(0);
  });

  it("ของนอกหมวดช่วงล่างที่ไม่มีฝั่งไปอยู่รายการซ่อมเพิ่มเติม", () => {
    const g = groupSuspensionDetailItems([
      partLine({ name: "น้ำมันเครื่อง", categoryName: "น้ำมัน", id: 5 }),
      serviceLine({ name: "ค่าแรง" }),
      partLine({ name: "ยางกันฝุ่น", id: 6 }),
    ]);
    expect(g.generalItems).toHaveLength(2);
    expect(g.otherItems.map((i) => i.part.name)).toEqual(["ยางกันฝุ่น"]);
  });
});
