import { create } from "zustand";
import { listRepairs } from "@/api/repair";
import { toastError } from "@/utils/handleError";
import { toLocalDateKey } from "@/utils/date";

// กรองรายการซ่อมที่มีสถานะ "PAID" และถูกจ่ายเงินในวันนี้ (ตามเวลาไทย)
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

  // ดึงรายการซ่อมทั้งหมด
  fetchRepairs: async () => {
    try {
      const res = await listRepairs();
      set({ repairs: res.data });
      return res.data;
    } catch (error) {
      toastError(error, "โหลดรายการซ่อมไม่สำเร็จ");
    }
  },

  // ดึงรายการซ่อมทั้งหมดตามสถานะ
  getRepairsByStatus: (status) => {
    const { repairs } = get();

    if (status === "PAID") {
      return filterTodayPaidRepairs(repairs);
    }

    return repairs.filter((repair) => repair.status === status);
  },

  // ดึงจำนวนรายการซ่อมตามสถานะ
  getRepairCountByStatus: (status) => {
    return get().getRepairsByStatus(status).length;
  },

  // ดึงยอดขายรวมของรายการซ่อมที่จ่ายเงินในวันนี้
  getTodaySales: () => {
    const { repairs } = get();

    return filterTodayPaidRepairs(repairs).reduce(
      (total, repair) => total + Number(repair.totalPrice),
      0,
    );
  },
});

const useRepairStore = create(repairStore);

export default useRepairStore;
