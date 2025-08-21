import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString) {
  if (!dateString) return "ไม่ระบุ";
  const date = new Date(dateString);
  return date.toLocaleDateString("th-TH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatTime(dateString) {
  if (!dateString) return "ไม่ระบุ";
  const date = new Date(dateString);
  return date.toLocaleTimeString("th-TH", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatCurrency(amount) {
  if (typeof amount !== "number") return "0 บาท";
  return `${amount.toLocaleString()} บาท`;
}
