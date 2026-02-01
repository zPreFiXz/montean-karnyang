import { create } from "zustand";
import { getRepairs } from "@/api/repair";

// กรองรายการซ่อมที่มีสถานะ PAID และชำระเงินวันนี้
const filterTodayPaid = (repairs) => {
  const todayStr = new Date().toISOString().split("T")[0];
  return repairs.filter((repair) => {
    if (repair.status !== "PAID" || !repair.paidAt) return false;
    const paidDate = new Date(repair.paidAt).toISOString().split("T")[0];
    return paidDate === todayStr;
  });
};

const repairStore = (set, get) => ({
  repairs: [],

  // ดึงข้อมูลการซ่อมทั้งหมดจาก API
  fetchRepairs: async () => {
    const res = await getRepairs();
    set({ repairs: res.data });
    return res.data;
  },

  // นับจำนวนรายการซ่อมตามสถานะ
  getRepairCountByStatus: (status) => {
    const { repairs } = get();

    // กรณีสถานะเป็น PAID ให้กรองเฉพาะรายการที่ชำระเงินวันนี้
    if (status === "PAID") {
      return filterTodayPaid(repairs).length;
    }

    return repairs.filter((repair) => repair.status === status).length;
  },

  // คำนวณยอดขายวันนี้
  getTodaySales: () => {
    const { repairs } = get();
    const todayPaidRepairs = filterTodayPaid(repairs);

    return todayPaidRepairs.reduce((total, repair) => {
      return total + Number(repair.totalPrice);
    }, 0);
  },

  // ดึงรายการซ่อมล่าสุดตามสถานะ
  getLatestRepairByStatus: (status) => {
    const { repairs } = get();

    const filteredRepairs =
      status === "PAID"
        ? filterTodayPaid(repairs)
        : repairs.filter((repair) => repair.status === status);

    return filteredRepairs[0] ?? null;
  },

  // ดึงรายการซ่อมทั้งหมดตามสถานะ
  getRepairsByStatus: (status) => {
    const { repairs } = get();

    if (status === "PAID") {
      return filterTodayPaid(repairs);
    }

    return repairs.filter((repair) => repair.status === status);
  },
});

const useRepairStore = create(repairStore);

export default useRepairStore;
