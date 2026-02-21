import { create } from "zustand";
import { getRepairs } from "@/api/repair";

// กรองรายการซ่อมที่มีสถานะ "PAID" และถูกจ่ายเงินในวันนี้
const filterTodayPaidRepairs = (repairs) => {
  const todayStr = new Date().toISOString().split("T")[0];
  return repairs.filter((repair) => {
    if (repair.status !== "PAID" || !repair.paidAt) return false;
    const paidDate = new Date(repair.paidAt).toISOString().split("T")[0];
    return paidDate === todayStr;
  });
};

const repairStore = (set, get) => ({
  repairs: [],

  // ดึงรายการซ่อมทั้งหมด
  fetchRepairs: async () => {
    try {
      const res = await getRepairs();
      set({ repairs: res.data });
      return res.data;
    } catch (error) {
      console.log(error);
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
    const { repairs } = get();

    if (status === "PAID") {
      return filterTodayPaidRepairs(repairs).length;
    }

    return repairs.filter((repair) => repair.status === status).length;
  },

  // ดึงยอดขายรวมของรายการซ่อมที่จ่ายเงินในวันนี้
  getTodaySales: () => {
    const { repairs } = get();
    const todayPaidRepairs = filterTodayPaidRepairs(repairs);

    return todayPaidRepairs.reduce((total, repair) => {
      return total + Number(repair.totalPrice);
    }, 0);
  },
});

const useRepairStore = create(repairStore);

export default useRepairStore;
