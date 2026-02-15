import { CarFront, Users } from "lucide-react";

export const publicLinks = [
  {
    href: "/vehicles/brand-models",
    label: "จัดการยี่ห้อและรุ่นรถ",
    icon: CarFront,
    iconClass: "text-primary",
  },
];

export const privateLinks = [
  {
    href: "/admin/employees",
    label: "จัดการบัญชีพนักงาน",
    icon: Users,
    iconClass: "text-status-completed",
  },
];
