import { create } from "zustand";
import { getRepairs } from "@/api/repair";

// กรองรายการซ่อมที่มีสถานะ "PAID" และจ่ายเงินในวันนี้
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

  // ดึงรายการซ่อมทั้งหมดจากเซิร์ฟเวอร์และเก็บไว้ในสโตร์
  fetchRepairs: async () => {
    const res = await getRepairs();
    set({ repairs: res.data });
    return res.data;
  },

  // นับจำนวนรายการซ่อมตามสถานะ
  getRepairCountByStatus: (status) => {
    const { repairs } = get();

    if (status === "PAID") {
      return filterTodayPaidRepairs(repairs).length;
    }

    return repairs.filter((repair) => repair.status === status).length;
  },

  // คำนวณยอดขายรวมของวันนี้
  getTodaySales: () => {
    const { repairs } = get();
    const todayPaidRepairs = filterTodayPaidRepairs(repairs);

    return todayPaidRepairs.reduce((total, repair) => {
      return total + Number(repair.totalPrice);
    }, 0);
  },

  // ดึงรายการซ่อมล่าสุดตามสถานะ
  getLatestRepairByStatus: (status) => {
    const { repairs } = get();

    const filteredRepairs =
      status === "PAID"
        ? filterTodayPaidRepairs(repairs)
        : repairs.filter((repair) => repair.status === status);

    return filteredRepairs[0] ?? null;
  },

  // ดึงรายการซ่อมตามสถานะ
  getRepairsByStatus: (status) => {
    const { repairs } = get();

    if (status === "PAID") {
      return filterTodayPaidRepairs(repairs);
    }

    return repairs.filter((repair) => repair.status === status);
  },
});

const useRepairStore = create(repairStore);

export default useRepairStore;
