import { describe, expect, it } from "vitest";
import {
  itemToFormValues,
  toPartPayload,
  toServicePayload,
} from "@/utils/inventoryForm";

const tire = {
  type: "part",
  partNumber: "LL-1",
  brand: null,
  name: "GREEN-Max",
  costPrice: null,
  sellingPrice: 1800,
  unit: "ชิ้น",
  stockQuantity: 4,
  minStockLevel: 2,
  category: { name: "ยาง" },
  attributes: { width: "185", aspectRatio: "55", rimDiameter: "15" },
  tireLots: [
    { dotCode: "0126", quantity: 2 },
    { dotCode: "4825", quantity: 2 },
  ],
};

describe("แปลงรายการในคลังเป็นค่าในฟอร์ม", () => {
  it("ยาง: ค่า null เป็นข้อความว่าง หน่วยบังคับเป็นเส้น ล็อตเรียงเก่าไปใหม่", () => {
    const values = itemToFormValues(tire);
    expect(values.brand).toBe("");
    expect(values.costPrice).toBe("");
    expect(values.unit).toBe("เส้น");
    expect(values.construction).toBe("R");
    expect(values.tireLots).toEqual([
      { dotCode: "4825", quantity: "2" },
      { dotCode: "0126", quantity: "2" },
    ]);
  });

  it("บริการ: เอาเฉพาะช่องของบริการ", () => {
    const values = itemToFormValues({
      type: "service",
      name: "ตั้งลูกปืนล้อ",
      price: 300,
      unit: null,
      attributes: { perSide: true },
      category: { name: "บริการ" },
    });
    expect(values).toEqual({
      description: "",
      categoryKind: values.categoryKind,
      name: "ตั้งลูกปืนล้อ",
      price: 300,
      unit: "",
      suspensionType: "per-side",
    });
  });
});

describe("แปลงค่าในฟอร์มเป็นข้อมูลที่ส่งไปบันทึก", () => {
  const data = {
    partNumber: "P-1",
    brand: "555",
    name: "ลูกหมาก",
    costPrice: 300,
    sellingPrice: 500,
    unit: "ตัว",
    stockQuantity: 5,
    minStockLevel: 1,
    suspensionType: "per-side",
    tireLots: [{ dotCode: "0126", quantity: "3" }],
    categoryId: 9,
  };
  const kind = {
    isUsedTire: false,
    isTire: false,
    lotTracked: false,
    isOilKit: false,
    hasSideChoice: true,
  };

  it("อะไหล่แยกข้าง", () => {
    const payload = toPartPayload(data, null, kind);
    expect(payload.attributes).toEqual({ perSide: true });
    expect(payload.stockQuantity).toBe(5);
    expect(payload.tireLots).toBeUndefined();
    expect(payload.oilSourceId).toBeNull();
  });

  it("หมวดที่ไม่มีช่องข้าง ค่าเดิมไม่ติดไป", () => {
    expect(
      toPartPayload(data, null, { ...kind, hasSideChoice: false }).attributes,
    ).toEqual({ perSide: false });
  });

  it("ยางนับล็อต: ไม่ส่งจำนวนสต็อก ล็อตเป็นตัวเลข", () => {
    const payload = toPartPayload(data, null, {
      ...kind,
      isTire: true,
      lotTracked: true,
    });
    expect(payload.stockQuantity).toBeUndefined();
    expect(payload.tireLots).toEqual([{ dotCode: "0126", quantity: 3 }]);
    expect(payload.attributes.construction).toBe("R");
  });

  it("ยางเปอร์เซ็นต์ใช้ชื่อหมวดเป็นชื่อและไม่มียี่ห้อ", () => {
    const payload = toPartPayload(data, null, { ...kind, isUsedTire: true });
    expect(payload.name).toBe("ยางเปอร์เซ็นต์");
    expect(payload.brand).toBe("");
  });

  it("ชุดน้ำมันไม่มีขั้นต่ำของตัวเอง", () => {
    const payload = toPartPayload(
      { ...data, oilSourceId: "4", oilLiters: "3.5" },
      null,
      { ...kind, isOilKit: true },
    );
    expect(payload).toMatchObject({
      minStockLevel: 0,
      oilSourceId: 4,
      oilLiters: 3.5,
    });
  });

  it("บริการ: หน่วยว่างไม่ส่ง", () => {
    expect(
      toServicePayload(
        { name: "ปะยาง", price: 100, unit: "  ", suspensionType: "single" },
        undefined,
      ),
    ).toMatchObject({ unit: undefined, perSide: false });
  });
});
