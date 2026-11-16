import { describe, expect, it } from "vitest";
import { brandOptionsOf, nameSuggestionsOf } from "@/utils/partHints";

const parts = [
  { brand: "ROKY", name: "บูชปีกนกบน Vigo" },
  { brand: "Roky", name: "บูชปีกนกล่าง Vigo" },
  { brand: "ROKY", name: "ยางกันโคลง Vigo" },
  { brand: "555", name: "ลูกหมากปีกนกบน Vigo" },
  { brand: "555", name: "ลูกหมากปีกนกบน Revo" },
  { brand: null, name: "ลูกหมากปีกนกล่าง Vigo" },
];

describe("ยี่ห้อที่แนะนำ", () => {
  it("รวมตัวพิมพ์ต่างกัน เรียงตามที่ใช้บ่อย", () => {
    expect(brandOptionsOf(parts).map((o) => o.name)).toEqual(["ROKY", "555"]);
  });
});

describe("ชื่อที่แนะนำ", () => {
  it("อะไหล่แนะนำชนิดตามคำที่พิมพ์ ชนิดที่ใช้บ่อยขึ้นก่อน", () => {
    expect(nameSuggestionsOf(parts, { typed: "ลูกหมาก" })).toEqual([
      "ลูกหมากปีกนกบน",
      "ลูกหมากปีกนกล่าง",
    ]);
  });
  it("พิมพ์เลยคำแรกแล้วไม่แนะนำ", () => {
    expect(nameSuggestionsOf(parts, { typed: "ลูกหมากปีกนกบน V" })).toEqual([]);
  });
  it("ยางแนะนำรุ่นของยี่ห้อที่เลือก", () => {
    const tires = [
      { brand: "LINGLONG", name: "CrossWind HP010" },
      { brand: "LINGLONG", name: "CrossWind HP010" },
      { brand: "MAXXIS", name: "MA579" },
    ];
    expect(
      nameSuggestionsOf(tires, { isTire: true, brand: "linglong", typed: "" }),
    ).toEqual(["CrossWind HP010"]);
  });
});
