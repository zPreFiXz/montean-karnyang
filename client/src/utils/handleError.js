import { toast } from "sonner";

// ดึงข้อความ error จาก response ของ server (รูปแบบ { message } หรือ { errors: [{field,message}] })
export const getErrorMessage = (error, fallbackMessage) => {
  const data = error?.response?.data;

  if (data?.message) return data.message;
  if (Array.isArray(data?.errors) && data.errors[0]?.message) {
    return data.errors[0].message;
  }
  if (error?.code === "ERR_NETWORK") {
    return "เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ กรุณาตรวจสอบอินเทอร์เน็ต";
  }

  return fallbackMessage || "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง";
};

// ใช้ใน catch ของทุกหน้า: แจ้งผู้ใช้ด้วย toast แทนการเงียบหาย
export const toastError = (error, fallbackMessage) => {
  // 401 ถูกจัดการโดย apiClient (redirect ไป login) ไม่ต้อง toast ซ้ำ
  if (error?.response?.status === 401) return;

  console.error(error);
  toast.error(getErrorMessage(error, fallbackMessage));
};
