import { describe, expect, it } from "vitest";
import {
  groupInventory,
  oilGroupOptions,
  sortForCategory,
  uniqSorted,
} from "@/utils/inventoryGroups";

const item = (name, category, extra = {}) => ({
  name,
  category: { name: category },
  ...extra,
});
const names = (groups) =>
  groups.map((g) => [g.name, g.items.map((i) => i.name)]);

describe("จัดกลุ่มรายการในคลัง", () => {
  it("เบรกแยกหัวข้อตามลำดับที่กำหนด สะกด เบรค ก็เข้ากลุ่ม", () => {
    const items = sortForCategory("เบรก", [
      item("สายเบรก", "เบรก"),
      item("ก้ามเบรคหลัง", "เบรก"),
      item("ตะปูเบรก", "เบรก"),
    ]);
    expect(names(groupInventory("เบรก", items))).toEqual([
      ["ตะปูเบรก", ["ตะปูเบรก"]],
      ["ก้ามเบรกหลัง", ["ก้ามเบรคหลัง"]],
      ["อื่นๆ", ["สายเบรก"]],
    ]);
  });

  it("ยางในแบ่งตามขอบจากขนาดในชื่อ ไม่มีขอบไว้ท้าย", () => {
    const items = sortForCategory("ยางใน", [
      item("ยางในมอไซค์", "ยางใน"),
      item("ยางใน 750-16", "ยางใน"),
      item("ยางใน 600-14", "ยางใน"),
    ]);
    expect(groupInventory("ยางใน", items).map((g) => g.name)).toEqual([
      "ขอบ 14",
      "ขอบ 16",
      "ไม่ระบุขอบ",
    ]);
  });

  it("ทั้งหมด: เรียงตามแถบหมวด ไม่มีหมวดหมู่อยู่เหนือบริการ", () => {
    const items = [
      item("ตั้งศูนย์", "บริการ"),
      item("ส่วนลด", "บริการ"),
      item("GS 55", "แบตเตอรี่"),
    ];
    expect(
      groupInventory("ทั้งหมด", items, ["แบตเตอรี่", "บริการ"]).map(
        (g) => g.name,
      ),
    ).toEqual(["แบตเตอรี่", "ไม่มีหมวดหมู่", "บริการ"]);
  });

  it("หมวดที่ไม่มีหัวข้อย่อยคืน null และไม่โชว์รายการไม่มีหมวดหมู่", () => {
    expect(groupInventory("แบตเตอรี่", [])).toBeNull();
    expect(sortForCategory("บริการ", [item("ส่วนลด", "บริการ")])).toEqual([]);
  });

  it("ตัวเลือกน้ำมันเรียงขนาดก่อนแล้วตามชนิด", () => {
    expect(
      oilGroupOptions([
        item("น้ำกลั่น", "น้ำมัน"),
        item("(4L) น้ำมันเครื่อง", "น้ำมัน"),
        item("(1L) น้ำมันเครื่อง", "น้ำมัน"),
      ]),
    ).toEqual(["1L", "4L", "น้ำกลั่น"]);
  });

  it("ขนาดยางทศนิยมไว้ท้าย", () => {
    expect(uniqSorted(["7.00", "205", "195", "205"])).toEqual([
      "195",
      "205",
      "7.00",
    ]);
  });
});
