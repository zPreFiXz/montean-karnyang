// helper วันที่แบบเขตเวลาไทย: ห้ามใช้ toISOString().split("T")[0]
// เพราะ toISOString เป็น UTC ทำให้ข้อมูลช่วงค่ำถูกจัดเข้าวันถัดไป/ก่อนหน้า

const BANGKOK_DATE_FORMAT = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Bangkok",
});

// คืนค่า "YYYY-MM-DD" ตามเวลาไทย ใช้เป็น key จัดกลุ่มรายวัน
export const toLocalDateKey = (date = new Date()) =>
  BANGKOK_DATE_FORMAT.format(date instanceof Date ? date : new Date(date));

// เช็คว่า timestamp อยู่ในวันเดียวกัน (เวลาไทย) กับวันนี้หรือไม่
export const isToday = (date) => toLocalDateKey(date) === toLocalDateKey();
