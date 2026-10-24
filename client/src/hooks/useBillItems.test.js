// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import useBillItems from "@/hooks/useBillItems";
import { renderHook } from "@/test/renderHook";
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import BillItemDialogs from "@/components/bill/BillItemDialogs";
import BillItemRows from "@/components/bill/BillItemRows";

const part = (extra = {}) => ({
  id: 7,
  partNumber: "P-7",
  brand: "GS",
  name: "แบตเตอรี่ MF",
  sellingPrice: 2500,
  category: { name: "แบตเตอรี่" },
  ...extra,
});

describe("รายการซ่อมที่หน้ากรอกบิลกับหน้าเช็กช่วงล่างใช้ร่วมกัน", () => {
  it("หยิบชิ้นเดิมซ้ำเพิ่มจำนวน แต่ไม่เกินสต็อกที่เบิกได้", () => {
    const h = renderHook(useBillItems, {});
    // ไดอะล็อกส่งสต็อกที่เบิกได้มาทาง quantity
    for (let i = 0; i < 3; i++) {
      h.act(() =>
        h.result.current.handleAddItemToRepair(part({ quantity: 2 })),
      );
    }
    expect(h.result.current.repairItems).toHaveLength(1);
    expect(h.result.current.repairItems[0].quantity).toBe(2);
    expect(
      h.result.current.isAtStockLimit(h.result.current.repairItems[0]),
    ).toBe(true);
  });

  it("ของที่จองไว้นอกรายการ (แท็บช่วงล่าง) หักออกจากเพดาน", () => {
    const h = renderHook(useBillItems, { getReservedCount: () => 1 });
    h.act(() => h.result.current.handleAddItemToRepair(part({ quantity: 2 })));
    h.act(() => h.result.current.handleAddItemToRepair(part({ quantity: 2 })));
    expect(h.result.current.repairItems[0].quantity).toBe(1);
  });

  it("อะไหล่แยกซ้าย-ขวาถามข้างก่อน เลือกทั้งสองข้างได้บรรทัดเดียวสองชิ้น", () => {
    const h = renderHook(useBillItems, {});
    const perSide = part({ attributes: { perSide: true }, quantity: 10 });
    h.act(() => h.result.current.handleAddItemToRepair(perSide));
    expect(h.result.current.sidePickItem).not.toBeNull();
    expect(h.result.current.repairItems).toHaveLength(0);
    h.act(() => h.result.current.handlePickSide("both"));
    expect(h.result.current.repairItems[0]).toMatchObject({
      side: "both",
      quantity: 2,
      pickedSide: true,
    });
    h.act(() => h.result.current.handleIncreaseQuantity(0));
    expect(h.result.current.repairItems[0].quantity).toBe(4);
  });

  it("แก้ราคาส่วนลดเก็บเป็นเลขติดลบ แก้ชื่อแล้วจำว่าพิมพ์เอง", () => {
    const h = renderHook(useBillItems, {});
    const discount = {
      id: 99,
      name: "ส่วนลด",
      sellingPrice: 0,
      category: { name: "บริการ" },
    };
    h.act(() => h.result.current.handleAddItemToRepair(discount));
    h.act(() => h.result.current.handleAddItemToRepair(part({ quantity: 5 })));
    h.act(() => h.result.current.updateItemPrice(0, 100));
    h.act(() =>
      h.result.current.updateItemPrice(1, {
        price: 2400,
        name: "แบตใหม่ลูกค้าขอ",
      }),
    );
    expect(h.result.current.repairItems[0].sellingPrice).toBe(-100);
    expect(h.result.current.repairItems[1]).toMatchObject({
      sellingPrice: 2400,
      name: "แบตใหม่ลูกค้าขอ",
      hasCustomName: true,
    });
  });

  it("วาดหน้าต่างของรายการได้ตอนเปิดหน้าต่างอยู่ ไม่พังเพราะเรียกก่อนประกาศ", () => {
    let reserved;
    const h = renderHook(() => {
      const items = useBillItems({
        getReservedCount: (item) => reserved(item),
      });
      reserved = () => 0;
      return items;
    });
    h.act(() =>
      h.result.current.handleAddItemToRepair(
        part({ attributes: { perSide: true }, quantity: 3 }),
      ),
    );
    const root = createRoot(document.createElement("div"));
    expect(() =>
      act(() =>
        root.render(
          createElement("div", null, [
            createElement(BillItemDialogs, {
              key: "d",
              bill: h.result.current,
            }),
            createElement(BillItemRows, {
              key: "r",
              bill: h.result.current,
              onRowClick: () => {},
              transitionPrefix: "t",
            }),
          ]),
        ),
      ),
    ).not.toThrow();
    act(() => root.unmount());
  });
});
