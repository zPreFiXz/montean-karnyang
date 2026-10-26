import { describe, expect, it } from "vitest";
import { cleanDecimal } from "@/utils/numberInput";

describe("ช่องจำนวนทศนิยม", () => {
  it("พิมพ์ได้ไม่เกิน 2 ตำแหน่ง", () => {
    expect(cleanDecimal("1.567")).toBe("1.56");
    expect(cleanDecimal("0.946")).toBe("0.94");
    expect(cleanDecimal("3.5")).toBe("3.5");
  });

  it("ตัดตัวอักษรกับจุดที่เกินออก แต่ยังพิมพ์จุดค้างไว้ได้", () => {
    expect(cleanDecimal("abc1.23x")).toBe("1.23");
    expect(cleanDecimal("1..2")).toBe("1.2");
    expect(cleanDecimal("2.")).toBe("2.");
  });
});
