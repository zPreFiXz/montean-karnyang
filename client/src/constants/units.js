import { useEffect, useState } from "react";
import { listUnits } from "@/api/inventory";

export const TIRE_UNIT = "เส้น";

export const NO_UNIT_OPTION = { id: "", name: "ไม่มีหน่วย" };

// ดึงครั้งเดียวต่อการเปิดแอป
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
    partUnitOptions: used.partUnits.map((name) => ({ name })),
    // บริการมีตัวเลือกไม่มีหน่วยนำหน้า เพราะบริการส่วนใหญ่คิดเป็นครั้ง
    serviceUnitOptions: [
      NO_UNIT_OPTION,
      ...used.serviceUnits.map((name) => ({ name })),
    ],
  };
};

export const invalidateUnitOptions = () => {
  usedUnitsCache = null;
};
