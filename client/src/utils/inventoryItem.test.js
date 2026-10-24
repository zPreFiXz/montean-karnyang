import { describe, expect, it } from "vitest";
import {
  groupVehiclesByBrand,
  stockStatusOf,
  summarizeTireLots,
} from "@/utils/inventoryItem";

describe("สถานะสต็อก", () => {
  const item = (stockQuantity, minStockLevel) => ({
    stockQuantity,
    minStockLevel,
    unit: "ชิ้น",
  });

  it("หมด / ต่ำกว่าขั้นต่ำ / ปกติ / เท่าขั้นต่ำถือว่าปกติ", () => {
    expect(stockStatusOf(item(0, 2)).tone).toBe("out");
    expect(stockStatusOf(item(1, 2))).toEqual({
      tone: "low",
      label: "สต็อกต่ำ · จำนวน 1 ชิ้น",
    });
    expect(stockStatusOf(item(5, 2)).tone).toBe("ok");
    expect(stockStatusOf(item(2, 2)).tone).toBe("ok");
  });

  it("ไม่ได้ตั้งขั้นต่ำ ไม่เตือนแม้เหลือ 0", () => {
    expect(stockStatusOf(item(0, 0)).tone).toBe("untracked");
  });

  it("ชุดน้ำมันบอกแค่จำนวนชุดหรือหมด", () => {
    expect(stockStatusOf(item(3, 0), true)).toEqual({
      tone: "ok",
      label: "จำนวน 3 ชิ้น",
    });
    expect(stockStatusOf(item(0, 0), true).tone).toBe("out");
  });
});

describe("ล็อตยางและรุ่นรถ", () => {
  it("รวม DOT ซ้ำ เรียงเก่าไปใหม่ ไม่มี DOT เป็นไม่ระบุ", () => {
    const rows = summarizeTireLots([
      { dotCode: "0126", quantity: 2 },
      { dotCode: "4825", quantity: 1 },
      { dotCode: "0126", quantity: 1 },
      { dotCode: "", quantity: 1 },
    ]);
    expect(
      rows
        .filter((r) => r.label !== "ไม่ระบุ")
        .map((r) => [r.label, r.quantity]),
    ).toEqual([
      ["4825", 1],
      ["0126", 3],
    ]);
    expect(rows.some((r) => r.label === "ไม่ระบุ")).toBe(true);
  });

  it("รวมรุ่นของยี่ห้อเดียวกัน คงลำดับเดิม", () => {
    expect(
      groupVehiclesByBrand([
        { brand: "TOYOTA", model: "VIGO" },
        { brand: "ISUZU", model: "D-MAX" },
        { brand: "TOYOTA", model: "REVO" },
      ]),
    ).toEqual([
      { brand: "TOYOTA", models: ["VIGO", "REVO"] },
      { brand: "ISUZU", models: ["D-MAX"] },
    ]);
  });
});
