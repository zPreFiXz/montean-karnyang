import { formatCurrency } from "@/utils/formats";

// count คือจำนวนที่คนเห็น (ซ้าย-ขวาของชิ้นเดียวกันนับเป็นรายการเดียว)
const BillTotal = ({ count, total, className = "my-4" }) => (
  <div
    className={`border-primary/20 from-primary/10 to-primary/5 mx-5 rounded-lg border bg-gradient-to-r p-4 ${className}`}
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
