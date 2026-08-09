import { AlertCircle } from "lucide-react";

// ใช้กับกลุ่มช่องกรอกที่อยู่แถวเดียวกัน (หน้ายาง/แก้มยาง/ขอบ, สัปดาห์/ปีผลิต+จำนวน)
// แต่ละช่องแคบเกินกว่าจะใส่ข้อความของตัวเอง จึงยกมารวมไว้ใต้แถว บรรทัดละข้อความ
const FieldErrorList = ({ messages = [], className = "" }) => {
  const visible = messages.filter(Boolean);
  if (visible.length === 0) return null;

  return (
    <div className={`flex flex-col gap-[4px] ${className}`}>
      {visible.map((message) => (
        <div key={message} className="flex items-center gap-[4px] px-[4px]">
          <AlertCircle className="text-destructive h-4 w-4 flex-shrink-0" />
          <p className="text-destructive text-lg font-medium md:text-xl">
            {message}
          </p>
        </div>
      ))}
    </div>
  );
};
export default FieldErrorList;
