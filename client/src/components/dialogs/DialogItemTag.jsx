// ป้ายบอกว่ากำลังทำกับรายการไหน (ทะเบียน ชื่ออะไหล่ ชื่อลูกค้า) ใช้ในหน้าต่างยืนยันและแก้ไขทุกตัว
// พื้นฟ้าอ่อนตัวหนังสือน้ำเงินให้เด่นกว่าหัวข้อทั่วไป detail = บรรทัดรอง เช่น ยี่ห้อและรุ่นรถ
const DialogItemTag = ({ title, detail, className = "" }) => (
  <div
    className={`text-primary bg-primary/10 self-center rounded-lg px-5 py-2.5 text-center ${className}`}
  >
    <p className="text-xl leading-tight font-semibold break-words md:text-2xl">
      {title}
    </p>
    {detail && (
      <p className="mt-1 text-lg leading-tight font-medium md:text-xl">
        {detail}
      </p>
    )}
  </div>
);

export default DialogItemTag;
