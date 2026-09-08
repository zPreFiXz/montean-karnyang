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

// รายงานยอดขายดูเป็นวันๆ การรู้ว่าวันไหนของสัปดาห์ช่วยอ่านยอดได้มากกว่าเลขวันที่
// เช่นยอดตกวันจันทร์กับยอดพุ่งวันอาทิตย์ ซึ่งเป็นจังหวะปกติของร้าน
export function formatDateWithWeekday(dateString) {
  if (!dateString) return "ไม่ระบุ";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "ไม่ระบุ";
  // ภาษาไทยได้ "วันอังคารที่ 8 กันยายน 2569" — ตัดคำว่าวันข้างหน้าออกให้เหลือ "อังคารที่ ..."
  return date
    .toLocaleDateString("th-TH", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
    .replace(/^วัน/, "");
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

// จำนวนในบิลเก็บเป็นทศนิยมได้ (น้ำมันขายเป็นลิตร) แต่ของทั่วไปเป็นจำนวนเต็ม
// 3 ต้องขึ้นว่า 3 ไม่ใช่ 3.00 ส่วน 3.5 ต้องคงทศนิยมไว้
export function formatQuantity(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "0";
  return String(Number(number.toFixed(2)));
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
