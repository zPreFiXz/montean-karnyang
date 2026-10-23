import { describe, expect, it } from "vitest";
import { repairToForm } from "@/utils/repairForm";
import { partLine, repairWith, serviceLine } from "@/test/fixtures";

const vehicle = {
  fleetNo: "12",
  licensePlate: { plateNumber: "กข 1234", province: "ศรีสะเกษ" },
  vehicleModel: { brand: "Toyota", model: "Vigo" },
};

describe("แปลงบิลที่บันทึกแล้วกลับเป็นข้อมูลฟอร์ม", () => {
  it("งานซ่อมทั่วไปเปิดในหน้ากรอกบิล พร้อมข้อมูลรถและทะเบียนที่แยกตัวอักษรกับตัวเลข", () => {
    const repair = repairWith(
      [partLine({ name: "สายพาน", categoryName: "อื่นๆ" })],
      {
        vehicle,
        customer: { name: "สมชาย", phoneNumber: "0812345678" },
      },
    );
    const { path, repairData } = repairToForm(repair);
    expect(path).toBe("/repairs/new");
    expect(repairData).toMatchObject({
      name: "สมชาย",
      brand: "Toyota",
      model: "Vigo",
      plateLetters: "กข",
      plateNumbers: "1234",
      province: "ศรีสะเกษ",
      fleetNo: "12",
      noVehicle: false,
    });
  });

  it("บิลเครดิตยกวิธีชำระเป็นเครดิต บิลไม่มีรถเปิดในโหมดไม่ผูกรถ", () => {
    const { repairData } = repairToForm(repairWith([], { status: "CREDIT" }));
    expect(repairData.paymentMethod).toBe("CREDIT");
    expect(repairData.noVehicle).toBe(true);
  });

  it("ชื่อที่พิมพ์ทับเองยกกลับมาด้วย ชื่อปกติใช้ชื่อในคลัง", () => {
    const typed = partLine({
      id: 1,
      name: "สายพาน",
      itemName: "ค่าซ่อมพิเศษหน้าเครื่อง",
    });
    const normal = partLine({ id: 2, name: "สายพาน", brand: "GATES" });
    const { repairItems } = repairToForm(repairWith([typed, normal]));
    expect(repairItems[0]).toMatchObject({
      name: "ค่าซ่อมพิเศษหน้าเครื่อง",
      hasCustomName: true,
    });
    expect(repairItems[1]).toMatchObject({
      name: "สายพาน",
      hasCustomName: false,
      brand: "GATES",
    });
  });

  it("บิลช่วงล่างเปิดในหน้าเช็กช่วงล่าง ข้างเป็นตัวเล็กตามหน้าจอ", () => {
    const repair = repairWith(
      [
        partLine({ id: 1, name: "ลูกหมากปีกนกบน", side: "LEFT" }),
        partLine({ id: 1, name: "ลูกหมากปีกนกบน", side: "RIGHT" }),
        serviceLine({ name: "ค่าแรง", unitPrice: 0 }),
      ],
      { type: "SUSPENSION", vehicle },
    );
    const { path, repairItems } = repairToForm(repair);
    expect(path).toBe("/inspections/suspension");
    expect(repairItems.map((i) => i.side)).toEqual(["left", "right", null]);
  });

  // ระบบเดาว่าชื่อพิมพ์เองจากการที่ชื่อในบิลไม่มีชื่อในคลังอยู่ข้างใน
  // ชื่อที่พิมพ์เองแต่มีชื่อในคลังอยู่ด้วยจึงถูกนับเป็นชื่อปกติ (พฤติกรรมเดิม เทสต์นี้กันเปลี่ยนโดยไม่ตั้งใจ)
  it("ชื่อพิมพ์เองที่มีชื่อในคลังอยู่ข้างใน ถือเป็นชื่อปกติ", () => {
    const typed = partLine({ name: "สายพาน", itemName: "สายพานหน้าเครื่อง" });
    const { repairItems } = repairToForm(repairWith([typed]));
    expect(repairItems[0]).toMatchObject({
      name: "สายพาน",
      hasCustomName: false,
    });
  });
});
