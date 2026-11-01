import { describe, expect, it } from "vitest";
import { sortVehiclesByModelList } from "@/utils/vehicleOrder";

const models = [
  { brand: "Toyota", model: "Vigo" },
  { brand: "Isuzu", model: "D-Max" },
  { brand: "Toyota", model: "Revo" },
  { brand: "Isuzu", model: "MU-X" },
];

describe("เรียงรุ่นรถที่ใส่ได้ตามลิสต์รุ่นรถ", () => {
  it("ยี่ห้อตามที่โผล่ก่อน แล้วตามลำดับรุ่นในยี่ห้อ รุ่นที่ไม่อยู่ในลิสต์ไว้ท้ายยี่ห้อ", () => {
    const vehicles = [
      { brand: "Isuzu", model: "MU-X" },
      { brand: "Nissan", model: "Navara" },
      { brand: "Toyota", model: "Fortuner" },
      { brand: "Toyota", model: "Revo" },
      { brand: "Isuzu", model: "D-Max" },
      { brand: "Toyota", model: "Vigo" },
    ];
    expect(
      sortVehiclesByModelList(vehicles, models).map((v) => v.model),
    ).toEqual(["Vigo", "Revo", "Fortuner", "D-Max", "MU-X", "Navara"]);
  });
});
