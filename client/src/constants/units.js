import { useEffect, useState } from "react";
import { listUnits } from "@/api/inventory";

// หมวดยางไม่ต้องเลือกหน่วย ฟอร์มกรอกค่านี้ให้เองแล้วซ่อนช่องไป
export const TIRE_UNIT = "เส้น";

// ตัวเลือกแรกของหน่วยบริการ ค่าว่าง = ไม่มีหน่วย
export const NO_UNIT_OPTION = { id: "", name: "ไม่มีหน่วย" };

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
        // ดึงไม่ได้ก็ยังพิมพ์หน่วยเพิ่มเองได้ ช่องเลือกหน่วยรับค่าที่พิมพ์ใหม่อยู่แล้ว
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return {
    // ไม่มีรายการตั้งต้น ใช้หน่วยที่ร้านเคยใช้จริง เรียงตามที่ใช้บ่อยจากเซิร์ฟเวอร์
    partUnitOptions: used.partUnits.map((name) => ({ name })),
    // บริการมีตัวเลือกไม่มีหน่วยนำหน้า เพราะบริการส่วนใหญ่คิดเป็นครั้ง
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
