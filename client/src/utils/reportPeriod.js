import { formatDateWithWeekday } from "@/utils/formats";

// ช่วงเวลาของหน้ารายงาน (วัน สัปดาห์ เดือน ปี) ใช้ร่วมกันระหว่างรายงานยอดขายกับสินค้าขายดี
// ยอดของสองหน้าจะได้นับช่วงเดียวกันเป๊ะ
export const PERIOD_TYPES = [
  { id: "daily", label: "วัน", pickLabel: "เลือกวัน" },
  { id: "weekly", label: "สัปดาห์", pickLabel: "เลือกสัปดาห์" },
  { id: "monthly", label: "เดือน", pickLabel: "เลือกเดือน" },
  { id: "yearly", label: "ปี", pickLabel: "เลือกปี" },
];

export const getPeriodType = (searchParams) => {
  const period = searchParams.get("period");
  return PERIOD_TYPES.some((type) => type.id === period) ? period : "daily";
};

export const getDateRange = (date, type) => {
  const startDate = new Date(date);
  let endDate = new Date(date);

  switch (type) {
    // สัปดาห์เริ่มวันจันทร์
    case "weekly": {
      const dayOfWeek = startDate.getDay();
      const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      startDate.setDate(startDate.getDate() - daysFromMonday);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
      endDate.setHours(23, 59, 59, 999);
      break;
    }
    case "monthly":
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + 1, 1);
      endDate.setDate(endDate.getDate() - 1);
      endDate.setHours(23, 59, 59, 999);
      break;
    case "yearly":
      startDate.setMonth(0, 1);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(startDate);
      endDate.setMonth(11, 31);
      endDate.setHours(23, 59, 59, 999);
      break;
    default:
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(startDate);
      endDate.setHours(23, 59, 59, 999);
      break;
  }

  return { startDate, endDate };
};

export const getDisplayDate = (date, type) => {
  const { startDate, endDate } = getDateRange(date, type);

  switch (type) {
    case "weekly":
      return `${startDate.toLocaleDateString("th-TH", {
        day: "numeric",
        month: "short",
      })} - ${endDate.toLocaleDateString("th-TH", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })}`;
    case "monthly":
      return date.toLocaleDateString("th-TH", {
        year: "numeric",
        month: "long",
      });
    case "yearly":
      return date.toLocaleDateString("th-TH", { year: "numeric" });
    default:
      return formatDateWithWeekday(date);
  }
};

export const shiftDate = (date, type, direction) => {
  const step = direction === "next" ? 1 : -1;
  const next = new Date(date);

  if (type === "weekly") next.setDate(next.getDate() + 7 * step);
  else if (type === "monthly") next.setMonth(next.getMonth() + step);
  else if (type === "yearly") next.setFullYear(next.getFullYear() + step);
  else next.setDate(next.getDate() + step);

  return next;
};
