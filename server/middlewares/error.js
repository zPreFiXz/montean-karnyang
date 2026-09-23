const handleError = (err, req, res, next) => {
  // ข้อมูลอ้างอิงกันไม่ครบ ตอนลบคือยังมีของอื่นใช้อยู่ (onDelete: Restrict)
  // ตอนบันทึกคือไปอ้างถึงของที่ไม่มีในระบบ จึงต้องแยกข้อความ ไม่งั้นกดบันทึกแล้วขึ้นว่าลบไม่ได้
  if (err.code === "P2003" || err.code === "P2014") {
    console.warn(`[API] 409 ${req.method} ${req.originalUrl} — foreign key ${err.meta?.field_name || ""}`);
    return res.status(409).json({
      message:
        req.method === "DELETE"
          ? "ลบไม่ได้ เพราะมีข้อมูลอื่นอ้างอิงอยู่"
          : "บันทึกไม่ได้ เพราะมีรายการที่ไม่มีอยู่ในระบบแล้ว",
    });
  }

  // ใช้เฉพาะ status ที่เป็นตัวเลข (createError ตั้งเป็นเลข) ไม่งั้น 500
  const status = typeof err.code === "number" ? err.code : 500;

  // 4xx = ผู้ใช้/คำขอมีปัญหา เป็นเรื่องปกติของระบบที่เปิดใช้งานจริง ไม่ต้องมี stack trace
  // 5xx = ระบบเราพัง ต้องเห็น stack เพื่อตามแก้
  if (status >= 500) {
    console.error(`[API] ${status} ${req.method} ${req.originalUrl}`, err);
  } else {
    console.warn(`[API] ${status} ${req.method} ${req.originalUrl} — ${err.message}`);
  }

  // ส่งข้อความเฉพาะ error ที่ตั้งใจ (มี status ตัวเลข) ไม่งั้น fallback กันข้อมูลภายในหลุด
  const message =
    typeof err.code === "number" && err.message
      ? err.message
      : "เกิดข้อผิดพลาดภายในระบบ กรุณาลองใหม่อีกครั้ง";

  res.status(status).json({ message });
};

module.exports = handleError;
