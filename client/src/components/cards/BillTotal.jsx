import { formatCurrency } from "@/utils/formats";

// กล่องยอดรวมท้ายรายการซ่อม ใช้หน้าตาเดียวกันทั้งหน้ากรอกบิล หน้าเช็กช่วงล่าง และหน้าสรุป
// count คือจำนวนที่คนเห็น (ซ้าย-ขวาของชิ้นเดียวกันนับเป็นรายการเดียว)
const BillTotal = ({ count, total, className = "my-[16px]" }) => (
  <div
    className={`border-primary/20 from-primary/10 to-primary/5 mx-[20px] rounded-[10px] border bg-gradient-to-r p-[16px] ${className}`}
  >
    <div className="flex items-center justify-between">
      <p className="text-subtle-dark text-xl font-semibold md:text-[22px]">
        รวม {count} รายการ
      </p>
      <p className="text-primary text-2xl font-semibold md:text-[26px]">
        {formatCurrency(total)}
      </p>
    </div>
  </div>
);

export default BillTotal;
