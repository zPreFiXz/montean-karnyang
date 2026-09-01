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

// เก็บเป็นตัวเลขล้วน แต่ตอนอ่านให้คั่นเป็นกลุ่ม จะได้กวาดตาทวนกับที่ลูกค้าบอกได้ทีละท่อน
// มือถือ 10 หลักคั่น 3-3-4 เบอร์บ้าน 9 หลักคั่น 2-3-4 (02-123-4567)
// เลขที่ไม่เข้าสองแบบนี้คืนกลับไปตามเดิม ดีกว่าคั่นผิดที่แล้วอ่านเป็นเบอร์อื่น
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
