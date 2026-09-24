import { useEffect, useState } from "react";
import { listUnits } from "@/api/inventory";

// เรียงตามความถี่การใช้งานจริง เพื่อให้หน่วยที่ใช้บ่อยอยู่บนสุด (ยางคิดเป็นกว่าครึ่งของคลัง)
// หมวดยางไม่ต้องเลือกหน่วย ฟอร์มกรอกค่านี้ให้เองแล้วซ่อนช่องไป
export const TIRE_UNIT = "เส้น";

export const PART_UNITS = [
  "เส้น",
  "ลูก",
  "หลอด",
  "ตัว",
  "คู่",
  "อัน",
  "ขวด",
  "ชุด",
  "แผ่น",
  "ลิตร",
];

// ตัวเลือกแรกของหน่วยบริการ ค่าว่าง = ไม่มีหน่วย
export const NO_UNIT_OPTION = { id: "", name: "ไม่มีหน่วย" };

const collator = new Intl.Collator("th");

// หน่วยตั้งต้นอยู่บนตามลำดับที่เรียงไว้ ที่เพิ่มกันเองต่อท้ายเรียงตามตัวอักษร
const toOptions = (defaults, used = []) => {
  const extra = [...new Set(used)]
    .filter((unit) => !defaults.includes(unit))
    .sort(collator.compare);
  return [...defaults, ...extra].map((name) => ({ name }));
};

// ดึงครั้งเดียวต่อการเปิดแอป เปิดฟอร์มซ้ำจะได้ไม่ต้องรอ
// หน่วยที่เพิ่งพิมพ์เพิ่มจะเข้ารายการหลังรีเฟรช ระหว่างนั้นช่องก็ยังแสดงค่าที่เลือกไว้ได้
let usedUnitsCache = null;

export const useUnitOptions = () => {
  const [used, setUsed] = useState(
    usedUnitsCache || { partUnits: [], serviceUnits: [] },
  );

  useEffect(() => {
    if (usedUnitsCache) return;
    let cancelled = false;
    listUnits()
      .then((res) => {
        usedUnitsCache = res.data;
        if (!cancelled) setUsed(res.data);
      })
      .catch(() => {
        // ดึงไม่ได้ก็ยังมีหน่วยตั้งต้นให้เลือก และพิมพ์เพิ่มเองได้
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return {
    partUnitOptions: toOptions(PART_UNITS, used.partUnits),
    // บริการไม่มีหน่วยตั้งต้น ใช้หน่วยที่ร้านเคยใช้จริงเท่านั้น เรียงตามที่ใช้บ่อยจากเซิร์ฟเวอร์
    serviceUnitOptions: [
      NO_UNIT_OPTION,
      ...used.serviceUnits.map((name) => ({ name })),
    ],
  };
};

// บันทึกแล้วล้างที่จำไว้ หน่วยใหม่จะได้โผล่ในรายการตอนเปิดฟอร์มครั้งถัดไป
export const invalidateUnitOptions = () => {
  usedUnitsCache = null;
};
