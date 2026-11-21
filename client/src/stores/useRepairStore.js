import { create } from "zustand";
import { listRepairs } from "@/api/repair";
import { toastError } from "@/utils/handleError";
import { toLocalDateKey } from "@/utils/date";
import { salesEntriesOf } from "@/utils/salesEntries";

// จ่ายเงินวันนี้ตามเวลาไทย
const filterTodayPaidRepairs = (repairs) => {
  const todayKey = toLocalDateKey();
  return repairs.filter(
    (repair) =>
      repair.status === "PAID" &&
      repair.paidAt &&
      toLocalDateKey(repair.paidAt) === todayKey,
  );
};

const repairStore = (set, get) => ({
  repairs: [],

  // หน้าหลัก สถานะการซ่อม หน้าเครดิต และยอดขายวันนี้ ใช้แค่บิลที่ยังไม่ปิดกับเงินเข้าออกวันนี้
  // ไม่ดึงทุกบิล ข้อมูลโตปีละพันบิลจนโหลดช้าผ่าน Wi-Fi ร้าน (รายงานยอดขายดึงช่วงของตัวเองแยก)
  fetchRepairs: async () => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    try {
      const res = await listRepairs({
        from: start.toISOString(),
        to: end.toISOString(),
      });
      set({ repairs: res.data });
      return res.data;
    } catch (error) {
      toastError(error, "โหลดรายการซ่อมไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    }
  },

  getRepairsByStatus: (status) => {
    const { repairs } = get();

    if (status === "PAID") {
      return filterTodayPaidRepairs(repairs);
    }

    return repairs.filter((repair) => repair.status === status);
  },

  getRepairCountByStatus: (status) => {
    return get().getRepairsByStatus(status).length;
  },

  getTodaySales: () => {
    const todayKey = toLocalDateKey();
    return salesEntriesOf(
      get().repairs,
      (at) => toLocalDateKey(at) === todayKey,
    ).reduce((total, entry) => total + entry.amount, 0);
  },
});

const useRepairStore = create(repairStore);

export default useRepairStore;
