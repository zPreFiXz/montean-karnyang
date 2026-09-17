import { useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router";
import {
  ChevronLeft,
  LoaderCircle,
  Wrench,
  ShoppingBag,
  CalendarDays,
  Store,
} from "lucide-react";
import RepairCard from "@/components/cards/RepairCard";
import { listOrganizationRepairs } from "@/api/customer";
import { isSaleRepair } from "@/utils/repairDisplay";
import { organizationLabel } from "@/constants/organizations";
import {
  formatCurrency,
  formatDate,
  formatMonth,
  monthKey,
} from "@/utils/formats";
import { toastError } from "@/utils/handleError";
import {
  useScrollRestoration,
  useScrollTracking,
} from "@/utils/scrollPosition";

// ประวัติบิลของหน่วยงานหรือร้านค้ารายเดียว แยกเป็นรายเดือน
// หน้าเดียวสองสถานะ: ไม่มี month ใน URL = รายชื่อเดือน, มี month = บิลของเดือนนั้น
// อยู่ใน URL เพราะกดย้อนกลับต้องถอยจากเดือนกลับไปรายชื่อเดือนได้
const OrganizationHistory = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const month = searchParams.get("month");

  const [customer, setCustomer] = useState(null);
  const [repairs, setRepairs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await listOrganizationRepairs(id, "all");
        if (cancelled) return;
        setCustomer(res.data?.customer || null);
        setRepairs(res.data?.repairs || []);
      } catch (error) {
        if (!cancelled) toastError(error);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  const scrollKey = `organization-history:${id}:${month || ""}`;
  useScrollTracking(scrollKey);
  useScrollRestoration(scrollKey, !isLoading);

  // รวมเป็นเดือน เรียงใหม่สุดขึ้นก่อน เพราะคนดูย้อนหลังเริ่มจากเดือนล่าสุดเสมอ
  const months = [];
  const byKey = new Map();
  repairs.forEach((repair) => {
    const key = monthKey(repair.createdAt);
    if (!byKey.has(key)) {
      const group = { key, date: repair.createdAt, count: 0, total: 0 };
      byKey.set(key, group);
      months.push(group);
    }
    const group = byKey.get(key);
    group.count += 1;
    group.total += Number(repair.totalPrice) || 0;
  });
  months.sort((a, b) => b.key.localeCompare(a.key));

  const monthRepairs = month
    ? repairs.filter((repair) => monthKey(repair.createdAt) === month)
    : [];
  const monthLabel = month
    ? formatMonth(monthRepairs[0]?.date || `${month}-01`)
    : "";

  return (
    <div className="bg-gradient-primary shadow-primary flex min-h-svh w-full flex-col">
      <div className="flex items-center gap-[8px] px-[20px] pt-[16px]">
        <button
          onClick={() =>
            window.history.length > 1
              ? navigate(-1)
              : navigate(`/organizations/${id}`)
          }
          aria-label="ย้อนกลับ"
          className="bg-surface/20 flex h-[40px] w-[40px] shrink-0 cursor-pointer items-center justify-center rounded-full"
        >
          <ChevronLeft className="text-surface" />
        </button>
        <p className="text-surface min-w-0 flex-1 truncate text-2xl font-semibold md:text-[26px]">
          {month ? monthLabel : "ประวัติย้อนหลัง"}
        </p>
      </div>

      <div className="bg-surface shadow-primary mt-[16px] flex w-full flex-1 flex-col rounded-tl-2xl rounded-tr-2xl px-[20px] pb-[112px] xl:pb-[16px]">
        {/* หัวของหน่วยงาน วางแบบเดียวกับหน้ารายละเอียด สองหน้าจะได้ต่อกันเป็นเรื่องเดียว */}
        {customer?.name && (
          <div className="mt-[16px] flex items-start gap-[8px]">
            <div className="bg-status-credit mt-[2px] flex aspect-square h-[45px] w-[45px] items-center justify-center rounded-full">
              <Store className="text-surface h-6 w-6" />
            </div>
            <div className="flex min-w-0 flex-1 flex-col">
              <p className="text-status-credit text-[22px] leading-tight font-semibold md:text-2xl">
                {customer.name}
              </p>
              {customer.organizationType && (
                <p className="text-subtle-dark text-lg leading-tight font-medium md:text-xl">
                  {organizationLabel(customer.organizationType)}
                </p>
              )}
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex flex-1 items-center justify-center">
            <LoaderCircle className="text-primary h-8 w-8 animate-spin" />
          </div>
        ) : month ? (
          monthRepairs.length === 0 ? (
            <div className="flex flex-1 items-center justify-center">
              <p className="text-subtle-light px-[20px] text-center text-xl text-balance md:text-[22px]">
                ไม่มีบิลในเดือนนี้
              </p>
            </div>
          ) : (
            monthRepairs.map((item) => (
              <Link
                key={item.id}
                to={`/repairs/${item.id}`}
                className="mt-[16px] block w-full"
              >
                <RepairCard
                  icon={isSaleRepair(item) ? ShoppingBag : Wrench}
                  itemCount={item.repairItems?.length}
                  dateText={formatDate(item.createdAt)}
                  price={Number(item.totalPrice) || 0}
                  status={item.status}
                />
              </Link>
            ))
          )
        ) : months.length === 0 ? (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-subtle-light px-[20px] text-center text-xl text-balance md:text-[22px]">
              ไม่มีประวัติย้อนหลัง
            </p>
          </div>
        ) : (
          months.map((group) => (
            <Link
              key={group.key}
              to={`/organizations/${id}/history?month=${group.key}`}
              className="bg-surface shadow-primary mt-[16px] flex h-[80px] w-full items-center gap-[8px] rounded-[10px] px-[16px]"
            >
              <div className="bg-status-credit flex h-[45px] w-[45px] shrink-0 items-center justify-center rounded-full">
                <CalendarDays className="text-surface h-6 w-6" />
              </div>
              <div className="flex min-w-0 flex-1 flex-col">
                <p className="text-status-credit truncate text-lg leading-tight font-semibold md:text-xl">
                  {formatMonth(group.date)}
                </p>
                <p className="text-subtle-dark truncate text-base leading-tight font-medium md:text-lg">
                  {group.count} บิล
                </p>
              </div>
              <p className="text-status-credit shrink-0 text-[22px] font-semibold md:text-2xl">
                {formatCurrency(group.total)}
              </p>
            </Link>
          ))
        )}
      </div>
    </div>
  );
};

export default OrganizationHistory;
