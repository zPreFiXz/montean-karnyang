import PageSpinner from "@/components/ui/PageSpinner";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router";
import {
  Wrench as WrenchOutline,
  ChevronLeft,
  ShoppingBag,
  CalendarDays,
  Store,
  Printer,
} from "lucide-react";
import CarCard from "@/components/cards/CarCard";
import OutlineCardIcon from "@/components/icons/OutlineCardIcon";
import OrganizationBillPreviewDialog from "@/components/dialogs/OrganizationBillPreviewDialog";
import BrandIcons from "@/components/icons/BrandIcons";
import { listOrganizationRepairs } from "@/api/customer";
import {
  isSaleRepair,
  isNoVehicleRepair,
  getRepairTitle,
  getRepairSubtitle,
} from "@/utils/repairDisplay";
import { organizationLabel } from "@/constants/organizations";
import {
  formatCurrency,
  formatDateShort,
  formatMonth,
  monthKey,
} from "@/utils/formats";
import { toastError } from "@/utils/handleError";
import {
  useScrollRestoration,
  useScrollTracking,
} from "@/utils/scrollPosition";

const statusBgOf = (status) => {
  switch (status) {
    case "IN_PROGRESS":
      return "progress";
    case "COMPLETED":
      return "completed";
    case "PAID":
      return "paid";
    default:
      return "credit";
  }
};

const statusColorOf = (status) => {
  switch (status) {
    case "IN_PROGRESS":
      return "#ffb000";
    case "COMPLETED":
      return "#22c55e";
    case "PAID":
      return "#1976d2";
    default:
      return "#7c3aed";
  }
};

// ไม่มี month ใน URL = รายชื่อเดือน, มี month = บิลของเดือนนั้น
// อยู่ใน URL เพราะกดย้อนกลับต้องถอยจากเดือนกลับไปรายชื่อเดือนได้
const OrganizationHistory = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const month = searchParams.get("month");

  const [customer, setCustomer] = useState(null);
  const [repairs, setRepairs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

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
  const monthTotal = monthRepairs.reduce(
    (sum, repair) => sum + (Number(repair.totalPrice) || 0),
    0,
  );

  const monthLabel = month
    ? formatMonth(monthRepairs[0]?.date || `${month}-01`)
    : "";

  return (
    <div className="bg-gradient-primary shadow-primary flex min-h-svh w-full flex-col">
      <div className="flex items-center gap-2 px-5 pt-4">
        <button
          onClick={() =>
            window.history.length > 1
              ? navigate(-1)
              : navigate(`/organizations/${id}`)
          }
          aria-label="ย้อนกลับ"
          className="bg-surface/20 flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full"
        >
          <ChevronLeft className="text-surface" />
        </button>
        <p className="text-surface min-w-0 flex-1 truncate text-2xl font-semibold md:text-[26px]">
          {month ? monthLabel : "ประวัติย้อนหลัง"}
        </p>

        {!isLoading && month && monthRepairs.length > 0 && (
          <button
            type="button"
            onClick={() => setIsPreviewOpen(true)}
            aria-label="พิมพ์ใบวางบิล"
            title="พิมพ์ใบวางบิล"
            className="bg-surface/20 flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full"
          >
            <Printer className="text-surface h-5 w-5" />
          </button>
        )}
      </div>

      <div className="bg-surface shadow-primary mt-4 flex w-full flex-1 flex-col rounded-tl-2xl rounded-tr-2xl px-5 pb-28 xl:pb-4">
        {isLoading ? (
          <PageSpinner />
        ) : (
          <>
            {customer?.name && (
              <div className="mt-4 flex items-start gap-2">
                <div className="bg-status-credit mt-0.5 flex aspect-square h-[45px] w-[45px] items-center justify-center rounded-full">
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

            {month && monthRepairs.length > 0 && (
              <div className="border-status-credit/30 from-status-credit/10 to-status-credit/5 mt-4 rounded-lg border bg-gradient-to-r p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-subtle-dark text-xl font-semibold md:text-[22px]">
                    ทั้งหมด {monthRepairs.length} บิล
                  </p>
                  <p className="text-status-credit text-2xl leading-tight font-semibold md:text-[26px]">
                    {formatCurrency(monthTotal)}
                  </p>
                </div>
              </div>
            )}

            {month ? (
              monthRepairs.length === 0 ? (
                <div className="flex flex-1 items-center justify-center">
                  <p className="text-subtle-light px-5 text-center text-xl text-balance md:text-[22px]">
                    ไม่มีบิลในเดือนนี้
                  </p>
                </div>
              ) : (
                monthRepairs.map((item) => (
                  <Link
                    key={item.id}
                    to={`/repairs/${item.id}`}
                    className="mt-4 block w-full"
                  >
                    <CarCard
                      bg={statusBgOf(item.status)}
                      icon={
                        isSaleRepair(item) ? (
                          <OutlineCardIcon
                            icon={ShoppingBag}
                            color={statusColorOf(item.status)}
                          />
                        ) : isNoVehicleRepair(item) ? (
                          <OutlineCardIcon
                            icon={WrenchOutline}
                            color={statusColorOf(item.status)}
                          />
                        ) : (
                          <BrandIcons
                            brand={item.vehicle?.vehicleModel?.brand}
                            color={statusColorOf(item.status)}
                          />
                        )
                      }
                      licensePlate={getRepairTitle(item)}
                      brand={getRepairSubtitle(item)}
                      note={formatDateShort(item.createdAt)}
                      price={Number(item.totalPrice) || 0}
                    />
                  </Link>
                ))
              )
            ) : months.length === 0 ? (
              <div className="flex flex-1 items-center justify-center">
                <p className="text-subtle-light px-5 text-center text-xl text-balance md:text-[22px]">
                  ไม่มีประวัติย้อนหลัง
                </p>
              </div>
            ) : (
              months.map((group) => (
                <Link
                  key={group.key}
                  to={`/organizations/${id}/history?month=${group.key}`}
                  className="bg-surface shadow-primary mt-4 flex h-20 w-full items-center gap-2 rounded-lg px-4"
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
          </>
        )}
      </div>
      <OrganizationBillPreviewDialog
        customer={customer}
        repairs={monthRepairs}
        month={month}
        open={isPreviewOpen}
        onOpenChange={setIsPreviewOpen}
      />
    </div>
  );
};

export default OrganizationHistory;
