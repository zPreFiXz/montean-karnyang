import { create } from "zustand";
import { getRepairs } from "@/api/repair";

const repairStore = (set, get) => ({
  repairs: [],

  // ดึงข้อมูลการซ่อมทั้งหมดจาก API
  fetchRepairs: async () => {
    try {
      const res = await getRepairs();
      set({ repairs: res.data });
      return res.data;
    } catch (error) {
      console.error(error);
    }
  },

  // นับจำนวนรถยนต์ตามสถานะการซ่อม
  // status: 'IN_PROGRESS' | 'COMPLETED' | 'PAID'
  getRepairCountByStatus: (status) => {
    const { repairs } = get();

    if (status === "PAID") {
      // สำหรับสถานะ PAID ให้นับเฉพาะของวันนี้
      const today = new Date();
      const todayStr = today.toISOString().split("T")[0];

      return repairs.filter((repair) => {
        if (repair.status !== "PAID" || !repair.paidAt) {
          return false;
        }

        const paidDate = new Date(repair.paidAt).toISOString().split("T")[0];
        return paidDate === todayStr;
      }).length;
    }

    return repairs.filter((repair) => repair.status === status).length;
  },

  // คำนวณยอดขายของวันนี้ (เฉพาะรายการที่ชำระเงินแล้ว)
  getTodaySales: () => {
    const { repairs } = get();

    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];

    // กรองเฉพาะรายการที่ชำระเงินแล้วในวันนี้
    const todayPaidRepairs = repairs.filter((repair) => {
      if (repair.status !== "PAID" || !repair.paidAt) {
        return false;
      }

      // เช็คว่าชำระเงินในวันนี้หรือไม่
      const paidDate = new Date(repair.paidAt).toISOString().split("T")[0];
      return paidDate === todayStr;
    });

    // รวมยอดเงินทั้งหมด
    return todayPaidRepairs.reduce((total, repair) => {
      return total + parseFloat(repair.totalPrice);
    }, 0);
  },

  // หาการซ่อมล่าสุดตามสถานะที่ระบุ
  getLatestRepairByStatus: (status) => {
    const { repairs } = get();

    let filteredRepairs;

    if (status === "PAID") {
      // สำหรับสถานะ PAID ให้แสดงเฉพาะของวันนี้
      const today = new Date();
      const todayStr = today.toISOString().split("T")[0];

      filteredRepairs = repairs.filter((repair) => {
        if (repair.status !== "PAID" || !repair.paidAt) {
          return false;
        }

        const paidDate = new Date(repair.paidAt).toISOString().split("T")[0];
        return paidDate === todayStr;
      });
    } else {
      filteredRepairs = repairs.filter((repair) => repair.status === status);
    }

    return filteredRepairs.length > 0 ? filteredRepairs[0] : null;
  },
});

const useRepairStore = create(repairStore);

export default useRepairStore;
