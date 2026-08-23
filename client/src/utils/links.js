import { CarFront, ShieldUser, Users, CalendarCheck } from "lucide-react";

export const publicLinks = [
  {
    href: "/vehicles/models",
    label: "จัดการยี่ห้อและรุ่นรถ",
    icon: CarFront,
    iconClass: "text-primary",
    // เมนูบนมือถือวางไอคอนขาวบนกระเบื้องสีทึบ ต่างจากบนจอใหญ่ที่เป็นไอคอนสีบนพื้นโปร่ง
    // ใช้สีจากชุดเดียวกับสถานะในระบบ ไล่ให้แต่ละเมนูไม่ซ้ำกัน จะได้จำตำแหน่งจากสีได้
    tileClass: "bg-primary",
  },
];

export const privateLinks = [
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
