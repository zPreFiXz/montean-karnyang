import { ChevronRight } from "lucide-react";
import { formatCurrency } from "@/utils/formats";

// สีตามสถานะชุดเดียวกับหน้าสถานะการซ่อม เพื่อให้จำสีได้ทั้งระบบ
const statusStyle = {
  IN_PROGRESS: { bg: "bg-status-progress", text: "text-status-progress" },
  COMPLETED: { bg: "bg-status-completed", text: "text-status-completed" },
  PAID: { bg: "bg-status-paid", text: "text-status-paid" },
};

const RepairCard = ({
  icon: Icon,
  itemCount,
  customerName,
  dateText,
  price,
  status,
}) => {
  const style = statusStyle[status] || statusStyle.IN_PROGRESS;

  // ไม่ต้องมีชื่อสถานะ เพราะสีของวงกลมกับราคาบอกอยู่แล้ว
  // คั่นด้วยจุดกลางเฉพาะส่วนที่มีจริง จะได้ไม่เหลือตัวคั่นลอยเมื่อไม่ได้กรอกลูกค้า
  // จำนวนรายการมาก่อน เพราะสั้นและมีเสมอ ส่วนชื่อลูกค้ายาวไม่แน่นอน
  // บรรทัดนี้ถูกตัดท้ายเมื่อยาวเกินการ์ด เรียงแบบนี้จึงเห็นข้อมูลครบกว่า
  //
  // ไม่ใส่เวลา — ไล่ประวัติดูแค่วันที่ ถ้าใส่จะยาวจนของอื่นโดนตัดทิ้ง (เวลาดูได้ในหน้าบิล)
  const details = [
    itemCount ? `${itemCount} รายการ` : null,
    customerName || null,
  ].filter(Boolean);

  return (
    <div className="bg-surface shadow-primary flex h-[80px] w-full items-center justify-between gap-[8px] rounded-[10px] px-[16px]">
      <div className="flex min-w-0 flex-1 items-center gap-[8px]">
        <div
          className={`flex h-[45px] w-[45px] shrink-0 items-center justify-center rounded-full ${style.bg}`}
        >
          <Icon color="white" />
        </div>

        <div className="flex min-w-0 flex-1 flex-col">
          {/* วันที่เป็นบรรทัดหลัก เพราะคนไล่ประวัติด้วยวันที่ ไม่ใช่รหัสของระบบ
              ส่วนเวลาลงไปอยู่บรรทัดรอง — ไล่ประวัติไม่มีใครดูถึงนาที และบรรทัดแรกยาวจนแย่งสายตากับราคา */}
          <p
            className={`truncate text-lg leading-tight font-semibold md:text-xl ${style.text}`}
          >
            {dateText}
          </p>
          <p className="text-subtle-dark truncate text-base leading-tight font-medium md:text-lg">
            {details.join(" · ")}
          </p>
        </div>
      </div>

      {price ? (
        <p
          className={`shrink-0 text-[22px] font-semibold md:text-2xl ${style.text}`}
        >
          {formatCurrency(price)}
        </p>
      ) : (
        <div className="text-subtle-light flex h-[32px] w-[32px] shrink-0 items-center justify-center rounded-full bg-[#F6F6F6]">
          <ChevronRight />
        </div>
      )}
    </div>
  );
};
export default RepairCard;
