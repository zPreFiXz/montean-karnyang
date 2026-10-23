// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import useSuspensionTabs from "@/hooks/useSuspensionTabs";
import { renderHook } from "@/test/renderHook";

const part = (id, name, { perSide = true, stock = 10, price = 500 } = {}) => ({
  id,
  name,
  partNumber: `P-${id}`,
  brand: "555",
  sellingPrice: price,
  stockQuantity: stock,
  attributes: { perSide },
  category: { name: "ช่วงล่าง" },
});

const upper = part(1, "ลูกหมากปีกนกบน VIGO");
const bush = part(2, "บูชปีกนกล่าง VIGO");
const rack = part(3, "คันส่งกลาง VIGO", { perSide: false });
const lastOne = part(4, "ลูกหมากแร็ค VIGO", { stock: 1 });
const service = { id: 90, name: "ตั้งลูกปืนล้อ", sellingPrice: 300 };
const props = (repairItems = []) => ({
  compatibleParts: [upper, bush, rack, lastOne],
  perSideService: service,
  repairItems,
});

describe("แท็บซ้าย/ขวา/อื่นๆ ของหน้าเช็กช่วงล่าง", () => {
  it("อะไหล่แยกข้างอยู่แท็บซ้ายขวา ที่ไม่แยกข้างอยู่แท็บอื่นๆ", () => {
    const { result } = renderHook(useSuspensionTabs, props());
    expect(result.current.getPartsForSide("left").map((p) => p.id)).toEqual([
      1, 2, 4,
    ]);
    expect(result.current.getPartsForSide("other").map((p) => p.id)).toEqual([
      3,
    ]);
  });

  it("ติ๊กแล้วได้บรรทัดในบิลพร้อมข้าง ราคา และยอดรวม", () => {
    const h = renderHook(useSuspensionTabs, props());
    h.act(() => h.result.current.handlePartSelection(upper, true, "left"));
    h.act(() => h.result.current.handlePartSelection(upper, true, "right"));
    h.act(() => h.result.current.handlePartSelection(rack, true, "other"));
    h.act(() => h.result.current.togglePerSideService("left"));
    const items = h.result.current.buildTabItems();
    expect(items.map((i) => [i.id, i.side, i.quantity])).toEqual([
      [1, "left", 1],
      [1, "right", 1],
      [3, "other", 1],
      [90, "left", 1],
    ]);
    expect(h.result.current.tabTotal).toBe(500 * 3 + 300);
    expect(h.result.current.countSelectedInTabs()).toBe(4);
    expect(h.result.current.hasTabSelection).toBe(true);
  });

  it("บูชปีกนกเพิ่มจำนวนได้ เอาออกแล้วจำนวนกลับเป็นหนึ่ง", () => {
    const h = renderHook(useSuspensionTabs, props());
    expect(h.result.current.allowsTabQuantity(bush)).toBe(true);
    expect(h.result.current.allowsTabQuantity(upper)).toBe(false);
    h.act(() => h.result.current.handlePartSelection(bush, true, "left"));
    h.act(() => h.result.current.setTabQty("left", bush.id, 3));
    expect(h.result.current.tabQty("left", bush.id)).toBe(3);
    h.act(() => h.result.current.handlePartSelection(bush, false, "left"));
    h.act(() => h.result.current.handlePartSelection(bush, true, "left"));
    expect(h.result.current.tabQty("left", bush.id)).toBe(1);
  });

  it("ของเหลือชิ้นเดียว ติ๊กข้างหนึ่งแล้วอีกข้างหลุด", () => {
    const h = renderHook(useSuspensionTabs, props());
    h.act(() => h.result.current.handlePartSelection(lastOne, true, "left"));
    h.act(() => h.result.current.handlePartSelection(lastOne, true, "right"));
    expect(h.result.current.isPartSelected(lastOne.id, "left")).toBe(false);
    expect(h.result.current.isPartSelected(lastOne.id, "right")).toBe(true);
  });

  it("นับของชิ้นเดียวกันในรายการซ่อมเพิ่มเติมรวมกับในแท็บ", () => {
    const extra = { ...upper, quantity: 2 };
    const h = renderHook(useSuspensionTabs, props([extra]));
    h.act(() => h.result.current.handlePartSelection(upper, true, "left"));
    expect(h.result.current.getCurrentSelectedCountForPart(upper)).toBe(3);
    expect(h.result.current.getTabSelectedCountForItem(extra)).toBe(1);
  });

  it("กู้จากบรรทัดในบิลแล้วสร้างกลับได้เหมือนเดิม รวมราคาที่แก้และจำนวนบูช", () => {
    const saved = [
      { ...upper, side: "left", quantity: 1, sellingPrice: 450 },
      { ...bush, side: "right", quantity: 2, sellingPrice: 500 },
      { ...rack, side: "other", quantity: 1, sellingPrice: 500 },
      { ...service, side: "right", quantity: 1 },
    ];
    const h = renderHook(useSuspensionTabs, props());
    h.act(() => h.result.current.restoreTabs(saved));
    const rebuilt = h.result.current.buildTabItems();
    expect(
      rebuilt.map((i) => [i.id, i.side, i.quantity, i.sellingPrice]),
    ).toEqual([
      [1, "left", 1, 450],
      [2, "right", 2, 500],
      [3, "other", 1, 500],
      [90, "right", 1, 300],
    ]);
  });

  it("แก้บิลเดิมที่ใช้ของชิ้นสุดท้ายไปแล้ว ยังเลือกได้ตามจำนวนเดิม", () => {
    const soldOut = { ...lastOne, stockQuantity: 0 };
    const h = renderHook(useSuspensionTabs, {
      ...props(),
      compatibleParts: [soldOut],
    });
    h.act(() =>
      h.result.current.restoreTabs([{ ...soldOut, side: "left", quantity: 1 }]),
    );
    expect(h.result.current.getAllowedUnitsForPart(soldOut)).toBe(1);
  });

  it("ล้างแท็บแล้วไม่เหลืออะไร", () => {
    const h = renderHook(useSuspensionTabs, props());
    h.act(() => h.result.current.handlePartSelection(upper, true, "left"));
    h.act(() => h.result.current.togglePerSideService("left"));
    h.act(() => h.result.current.clearTabs());
    expect(h.result.current.buildTabItems()).toEqual([]);
    expect(h.result.current.hasTabSelection).toBe(false);
  });
});
