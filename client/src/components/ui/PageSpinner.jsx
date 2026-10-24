import { LoaderCircle } from "lucide-react";

// ยืดเต็มที่ว่างแล้ววางกึ่งกลาง ไม่ใช้ตำแหน่งตายตัวกลางจอ เพราะบนจอใหญ่จะไม่นับเมนูซ้ายแล้วเบ้ไปทางขวา
const PageSpinner = () => {
  return (
    <div className="flex flex-1 items-center justify-center">
      <LoaderCircle className="text-primary h-8 w-8 animate-spin" />
    </div>
  );
};

export default PageSpinner;
