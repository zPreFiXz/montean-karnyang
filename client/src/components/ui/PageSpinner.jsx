import { LoaderCircle } from "lucide-react";

// ตัวหมุนตอนโหลดครั้งแรกของหน้า ยืดเต็มที่ว่างที่เหลือแล้ววางไว้กึ่งกลาง
// กล่องเนื้อหาของทุกหน้าเว้นระยะขอบล่างกันแท็บไว้อยู่แล้ว กึ่งกลางของกล่อง
// จึงเท่ากับกึ่งกลางของพื้นที่เหนือแท็บพอดี และบนจอใหญ่ก็ไม่เบ้ไปทับเมนูซ้าย
//
// (เคยลองวางทับกลางจอด้วยตำแหน่งตายตัว แต่บนจอใหญ่มันวัดจากขอบจอทั้งหมด
//  ไม่ได้นับเมนูด้านซ้าย ตัวหมุนเลยเบ้ไปทางขวา)
const PageSpinner = () => {
  return (
    <div className="flex flex-1 items-center justify-center">
      <LoaderCircle className="text-primary h-8 w-8 animate-spin" />
    </div>
  );
};

export default PageSpinner;
