import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// ฟอร์แมตวันที่เป็นรูปแบบไทย
export function formatDate(dateString) {
  if (!dateString) return "ไม่ระบุ";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "ไม่ระบุ";
  return date.toLocaleDateString("th-TH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// ฟอร์แมตเวลาเป็นรูปแบบไทย
export function formatTime(dateString) {
  if (!dateString) return "ไม่ระบุ";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "ไม่ระบุ";
  return date.toLocaleTimeString("th-TH", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ฟอร์แมตจำนวนเงินเป็นสกุลเงินบาท
export function formatCurrency(amount) {
  if (amount === null || amount === undefined) return "ไม่ระบุ";
  if (typeof amount !== "number") return "0 บาท";
  return `${amount.toLocaleString()} บาท`;
}
