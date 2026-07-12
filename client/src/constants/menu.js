import { BoxSearch, CarRepair, DashboardBar, Document } from "@/components/icons/Icons";

// เมนูหลักที่ใช้ร่วมกันระหว่าง sidebar (desktop) และ bottom nav (mobile)
export const MENU_ITEMS = [
  { path: "/dashboard", label: "หน้าหลัก", shortLabel: "หน้าหลัก", icon: DashboardBar },
  { path: "/inspections/suspension", label: "เช็กช่วงล่าง", shortLabel: "เช็กช่วงล่าง", icon: CarRepair },
  { path: "/vehicles", label: "ประวัติลูกค้า", shortLabel: "ประวัติลูกค้า", icon: Document },
  { path: "/inventory", label: "สต็อกอะไหล่", shortLabel: "สต็อก", icon: BoxSearch },
];

// เช็คว่าเมนูควรแสดงสถานะ active หรือไม่
// หมายเหตุ: เมนู "ประวัติลูกค้า" (/vehicles) ครอบคลุมหน้ารายละเอียดงานซ่อมด้วย
export const isActivePath = (path, pathname) => {
  if (path === "/dashboard") {
    return pathname === path;
  }

  if (path === "/vehicles") {
    const isRepairDetail =
      pathname.startsWith("/repairs/") &&
      !pathname.includes("/new") &&
      !pathname.includes("/summary");
    return (
      pathname === path || pathname.startsWith(path + "/") || isRepairDetail
    );
  }

  return pathname === path || pathname.startsWith(path + "/");
};
