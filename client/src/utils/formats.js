import { provinces } from "@/constants/provinces";

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

// แบบย่อสำหรับที่แคบ เช่น การ์ดที่มีราคาอยู่ข้างๆ — "25 ส.ค. 2569"
export function formatDateShort(dateString) {
  if (!dateString) return "ไม่ระบุ";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "ไม่ระบุ";
  return date.toLocaleDateString("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatTime(dateString) {
  if (!dateString) return "ไม่ระบุ";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "ไม่ระบุ";
  return date.toLocaleTimeString("th-TH", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatCurrency(amount) {
  if (amount === null || amount === undefined) return "ไม่ระบุ";
  if (typeof amount !== "number") return "0 บาท";
  return `${amount.toLocaleString()} บาท`;
}

export function getProvinceName(provinceId) {
  const province = provinces.find((p) => p.id === provinceId);
  return province ? province.name : provinceId;
}
