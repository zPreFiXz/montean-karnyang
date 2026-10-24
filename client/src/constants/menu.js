import { CarFront, ShieldUser, Users, CalendarCheck } from "lucide-react";
import {
  BoxSearch,
  CarRepair,
  DashboardBar,
  Document,
} from "@/components/icons/Icons";

export const MENU_ITEMS = [
  {
    path: "/dashboard",
    label: "หน้าหลัก",
    shortLabel: "หน้าหลัก",
    icon: DashboardBar,
  },
  {
    path: "/inspections/suspension",
    label: "เช็กช่วงล่าง",
    shortLabel: "เช็กช่วงล่าง",
    icon: CarRepair,
  },
  {
    path: "/vehicles",
    label: "ประวัติรถ",
    shortLabel: "ประวัติรถ",
    icon: Document,
  },
  {
    path: "/inventory",
    label: "สต็อกอะไหล่",
    shortLabel: "สต็อก",
    icon: BoxSearch,
  },
];

// เมนู "ประวัติรถ" ครอบคลุมหน้ารายละเอียดงานซ่อมด้วย
export const isActivePath = (path, pathname) => {
  if (path === "/dashboard") {
    return pathname === path;
  }

  if (path === "/vehicles") {
    // ระบุรูปแบบหน้ารายละเอียดตรงๆ ไม่ใช่ไล่ยกเว้นทีละหน้า
    const isRepairDetail = /^\/repairs\/\d+$/.test(pathname);

    // /vehicles/models เป็นหน้าตั้งค่าของผู้ดูแล ไม่ใช่ประวัติรถ เข้าจากหน้าหลักเท่านั้น
    const isVehicleModelAdmin = pathname.startsWith("/vehicles/models");

    return (
      !isVehicleModelAdmin &&
      (pathname === path || pathname.startsWith(path + "/") || isRepairDetail)
    );
  }

  return pathname === path || pathname.startsWith(path + "/");
};

export const MANAGEMENT_LINKS = [
  {
    href: "/vehicles/models",
    label: "จัดการยี่ห้อและรุ่นรถ",
    icon: CarFront,
    iconClass: "text-primary",
    tileClass: "bg-primary",
  },
];

export const ADMIN_LINKS = [
  {
    href: "/admin/employees",
    label: "จัดการพนักงาน",
    icon: Users,
    iconClass: "text-status-completed",
    tileClass: "bg-status-completed",
  },
  {
    href: "/admin/users",
    label: "จัดการบัญชีผู้ใช้งาน",
    icon: ShieldUser,
    iconClass: "text-primary-dark",
    tileClass: "bg-primary-dark",
  },
  {
    href: "/admin/reports/attendance",
    label: "รายงานเวลาเข้า-ออกงาน",
    icon: CalendarCheck,
    iconClass: "text-status-progress",
    tileClass: "bg-status-progress",
  },
];
