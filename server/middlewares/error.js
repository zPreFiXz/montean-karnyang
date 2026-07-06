const handleError = (err, req, res, next) => {
  console.error(err); // log จริงไว้ debug ฝั่ง server

  // ลบไม่ได้เพราะมีข้อมูลอื่นอ้างอิงอยู่ (onDelete: Restrict)
  if (err.code === "P2003" || err.code === "P2014") {
    return res
      .status(409)
      .json({ message: "ลบไม่ได้ เพราะมีข้อมูลอื่นอ้างอิงอยู่" });
  }

  // ใช้เฉพาะ status ที่เป็นตัวเลข (createError ตั้งเป็นเลข) ไม่งั้น 500
  const status = typeof err.code === "number" ? err.code : 500;

  // ส่งข้อความเฉพาะ error ที่ตั้งใจ (มี status ตัวเลข) ไม่งั้น fallback กันข้อมูลภายในหลุด
  const message =
    typeof err.code === "number" && err.message
      ? err.message
      : "เกิดข้อผิดพลาดภายในระบบ กรุณาลองใหม่อีกครั้ง";

  res.status(status).json({ message });
};

module.exports = handleError;
