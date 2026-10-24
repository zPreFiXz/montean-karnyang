import {
  Ban,
  CheckCircle2,
  CircleEllipsis,
  ClipboardList,
  Clock,
  CreditCard,
  Wallet,
} from "lucide-react";

export const DEFAULT_STATUS_INFO = {
  text: "ไม่ทราบสถานะ",
  color: "text-subtle-dark",
  bg: "bg-gray-200",
  softBorder: "border-gray-300",
  softBg: "from-gray-200/60 to-gray-100/40",
  iconColor: "#6b7280",
  icon: CircleEllipsis,
};

export const getStatusInfo = (status) => {
  switch (status) {
    case "ESTIMATE":
      return {
        text: "ใบประเมินราคา",
        color: "text-status-estimate",
        bg: "bg-status-estimate",
        softBorder: "border-status-estimate/30",
        softBg: "from-status-estimate/10 to-status-estimate/5",
        iconColor: "#06b6d4",
        icon: ClipboardList,
      };
    case "IN_PROGRESS":
      return {
        text: "กำลังซ่อม",
        color: "text-status-progress",
        bg: "bg-status-progress",
        softBorder: "border-status-progress/30",
        softBg: "from-status-progress/10 to-status-progress/5",
        iconColor: "#ffb000",
        icon: Clock,
      };
    case "COMPLETED":
      return {
        text: "ซ่อมเสร็จสิ้น",
        color: "text-status-completed",
        bg: "bg-status-completed",
        softBorder: "border-status-completed/30",
        softBg: "from-status-completed/10 to-status-completed/5",
        iconColor: "#22c55e",
        icon: CheckCircle2,
      };
    case "CREDIT":
      return {
        text: "เครดิต",
        color: "text-status-credit",
        bg: "bg-status-credit",
        softBorder: "border-status-credit/30",
        softBg: "from-status-credit/10 to-status-credit/5",
        iconColor: "#7c3aed",
        icon: Wallet,
      };
    case "CANCELLED":
      return {
        text: "ยกเลิกแล้ว",
        color: "text-destructive",
        bg: "bg-destructive",
        softBorder: "border-destructive/30",
        softBg: "from-destructive/10 to-destructive/5",
        iconColor: "#ef4444",
        icon: Ban,
      };
    case "PAID":
      return {
        text: "ชำระเงินแล้ว",
        color: "text-status-paid",
        bg: "bg-status-paid",
        softBorder: "border-status-paid/30",
        softBg: "from-status-paid/10 to-status-paid/5",
        iconColor: "#1976d2",
        icon: CreditCard,
      };
  }
  return DEFAULT_STATUS_INFO;
};

export const getNextStatus = (currentStatus) => {
  switch (currentStatus) {
    case "ESTIMATE":
      return "IN_PROGRESS";
    case "IN_PROGRESS":
      return "COMPLETED";
    case "COMPLETED":
    case "CREDIT":
      return "PAID";
  }
};

// เลือกเครดิตแล้วปุ่มต้องไม่เขียนว่าชำระเงิน คนกดจะเข้าใจว่าเก็บเงินไปแล้ว

export const getNextStatusButtonClass = (currentStatus) => {
  switch (currentStatus) {
    case "ESTIMATE":
      return "bg-status-progress";
    case "IN_PROGRESS":
      return "bg-status-completed";
    case "COMPLETED":
    case "CREDIT":
      return "bg-status-paid";
  }
};
