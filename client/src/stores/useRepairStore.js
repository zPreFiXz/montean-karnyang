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

  fetchRepairs: async () => {
    try {
      const res = await listRepairs();
      set({ repairs: res.data });
      return res.data;
    } catch (error) {
      toastError(error, "โหลดรายการซ่อมไม่สำเร็จ");
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
