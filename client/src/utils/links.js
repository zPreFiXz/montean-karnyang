import { CarFront, Users, CalendarCheck } from "lucide-react";

export const publicLinks = [
  {
    href: "/vehicles/brands",
    label: "จัดการยี่ห้อและรุ่นรถ",
    icon: CarFront,
    iconClass: "text-primary",
  },
];

export const privateLinks = [
  {
    href: "/admin/users",
    label: "จัดการบัญชีผู้ใช้งาน",
    icon: Users,
    iconClass: "text-primary",
  },
  {
    href: "/admin/employees",
    label: "จัดการพนักงาน",
    icon: Users,
    iconClass: "text-status-completed",
  },
  {
    href: "/admin/reports/attendance",
    label: "รายงานสแกนรายวัน",
    icon: CalendarCheck,
    iconClass: "text-primary",
  },
];
