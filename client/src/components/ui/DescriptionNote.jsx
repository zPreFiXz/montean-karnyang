// บันทึกของร้านในอะไหล่หรือบริการ (ต้องขันสลักใหม่, ใช้กับรุ่นนี้ไม่ได้) เป็นเรื่องที่ต้องเห็นก่อนหยิบใช้
// จึงเป็นหัวข้อของตัวเองต่อจากรูป ขึ้นก่อนข้อมูลทั่วไป ไม่ซ่อนเป็นแถวหนึ่งในกล่องข้อมูล
// หน้าตาเดียวกับหัวข้อ "รายละเอียดการซ่อม" ในหน้ารายละเอียดงานซ่อม
// ข้อความชิดซ้ายเพราะมักยาวหลายบรรทัด และไม่ใส่กฎตัดคำ ภาษาไทยจะได้ตัดตามคำ (ไม่ใช่ ตั้ง|ศูนย์)
const DescriptionNote = ({ text, className = "" }) => (
  <div className={className}>
    <p className="font-athiti text-normal mb-[8px] text-[22px] font-semibold md:text-2xl">
      รายละเอียด
    </p>
    <div className="rounded-[10px] bg-gray-50 p-[16px]">
      <p className="text-normal text-lg leading-relaxed font-medium whitespace-pre-line md:text-xl">
        {text}
      </p>
    </div>
  </div>
);

export default DescriptionNote;
