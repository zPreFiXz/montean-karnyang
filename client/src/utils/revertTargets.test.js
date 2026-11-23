import { describe, expect, it } from "vitest";
import { revertTargetsOf } from "@/utils/repairDisplay";

describe("revertTargetsOf ถอยสถานะได้หลายขั้น", () => {
  it("ซ่อมเสร็จสิ้นถอยได้แค่กำลังซ่อม", () => {
    expect(revertTargetsOf({ status: "COMPLETED" })).toEqual(["IN_PROGRESS"]);
  });

  it("ชำระเงินแล้วที่ไม่เคยลงเครดิต ข้ามเครดิต", () => {
    expect(revertTargetsOf({ status: "PAID" })).toEqual([
      "COMPLETED",
      "IN_PROGRESS",
    ]);
  });

  it("ชำระเงินแล้วที่เคยลงเครดิต ถอยกลับเป็นเครดิตได้ เรียงจากใกล้ไปไกล", () => {
    expect(
      revertTargetsOf({ status: "PAID", deliveryNo: "DO-6911-0001" }),
    ).toEqual(["CREDIT", "COMPLETED", "IN_PROGRESS"]);
  });

  it("บิลที่มีมัดจำลงเครดิตไม่ได้ จึงไม่มีเครดิตให้เลือก", () => {
    expect(
      revertTargetsOf({
        status: "PAID",
        deliveryNo: "DO-6911-0001",
        depositAmount: 500,
      }),
    ).toEqual(["COMPLETED", "IN_PROGRESS"]);
  });

  it("เครดิตถอยเป็นซ่อมเสร็จสิ้นหรือกำลังซ่อม", () => {
    expect(revertTargetsOf({ status: "CREDIT", deliveryNo: "DO-1" })).toEqual([
      "COMPLETED",
      "IN_PROGRESS",
    ]);
  });

  it("ไม่มีให้ถอย: กำลังซ่อม ใบเสนอราคา ยกเลิกแล้ว และบิลขายอะไหล่", () => {
    expect(revertTargetsOf({ status: "IN_PROGRESS" })).toEqual([]);
    expect(revertTargetsOf({ status: "ESTIMATE" })).toEqual([]);
    expect(revertTargetsOf({ status: "CANCELLED" })).toEqual([]);
    expect(revertTargetsOf({ status: "PAID", type: "SALE" })).toEqual([]);
  });
});
