import { useEffect, useState } from "react";
import { listChequeBanks } from "@/api/repair";

// ดึงครั้งเดียวต่อการเปิดแอป บันทึกเช็คธนาคารใหม่แล้วค่อยล้าง (invalidateChequeBanks)
let banksCache = null;

const useChequeBankOptions = (enabled) => {
  const [banks, setBanks] = useState(banksCache || []);

  useEffect(() => {
    if (!enabled || banksCache) return;
    let cancelled = false;
    listChequeBanks()
      .then((res) => {
        banksCache = res.data || [];
        if (!cancelled) setBanks(banksCache);
      })
      .catch(() => {
        // ดึงไม่ได้ก็ยังพิมพ์ชื่อธนาคารเองได้ ช่องรับค่าที่พิมพ์ใหม่อยู่แล้ว
      });
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return banks.map((name) => ({ name }));
};

export const invalidateChequeBanks = () => {
  banksCache = null;
};

export default useChequeBankOptions;
