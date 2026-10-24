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

export function formatDateWithWeekday(dateString) {
  if (!dateString) return "ไม่ระบุ";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "ไม่ระบุ";
  // ภาษาไทยได้ "วันอังคารที่ ..." ตัดคำว่าวันออก
  return date
    .toLocaleDateString("th-TH", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
    .replace(/^วัน/, "");
}

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

export function formatMonth(dateString) {
  if (!dateString) return "ไม่ระบุ";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "ไม่ระบุ";
  return date.toLocaleDateString("th-TH", {
    year: "numeric",
    month: "long",
  });
}

// คิดจากเวลาท้องถิ่น ไม่ใช่ ISO เพราะบิลดึกๆ จะถูกนับเป็นเดือนถัดไป
export function monthKey(dateString) {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "";
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${date.getFullYear()}-${month}`;
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

// 3 ต้องขึ้นว่า 3 ไม่ใช่ 3.00 ส่วน 3.5 ต้องคงทศนิยมไว้
export function formatQuantity(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "0";
  return String(Number(number.toFixed(2)));
}

export function formatPriceRange(range) {
  if (!range) return "";
  const money = (value) => Number(value).toLocaleString("th-TH");
  return range.min === range.max
    ? `${money(range.min)} บาท`
    : `${money(range.min)}–${money(range.max)} บาท`;
}

export function formatCurrency(amount) {
  if (amount === null || amount === undefined) return "ไม่ระบุ";
  if (typeof amount !== "number") return "0 บาท";
  return `${amount.toLocaleString()} บาท`;
}

// มือถือ 10 หลักคั่น 3-3-4 เบอร์บ้าน 9 หลักคั่น 2-3-4 แบบอื่นคืนตามเดิม
export function formatPhone(phoneNumber) {
  const digits = String(phoneNumber ?? "").replace(/\D/g, "");
  if (digits.length === 10) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  if (digits.length === 9) {
    return `${digits.slice(0, 2)}-${digits.slice(2, 5)}-${digits.slice(5)}`;
  }
  return String(phoneNumber ?? "");
}

export function getProvinceName(provinceId) {
  const province = provinces.find((p) => p.id === provinceId);
  return province ? province.name : provinceId;
}

// ฐานข้อมูลเก็บเป็น "กษ 9037" แสดงด้วยขีด รับแบบมีขีดด้วยเผื่อข้อมูลเก่า
export function formatPlate(plateNumber) {
  const text = String(plateNumber || "").trim();
  if (!text) return "";
  const parts = text.split(/[\s-]+/).filter(Boolean);
  return parts.length > 1 ? parts.join("-") : text;
}
