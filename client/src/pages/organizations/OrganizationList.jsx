import PageSpinner from "@/components/ui/PageSpinner";
import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import {
  Wrench as WrenchOutline,
  ChevronLeft,
  Store,
  Building2,
  CircleUserRound,
  ShoppingBag,
} from "lucide-react";
import CarCard from "@/components/cards/CarCard";
import OutlineCardIcon from "@/components/icons/OutlineCardIcon";
import BrandIcons from "@/components/icons/BrandIcons";
import useRepairStore from "@/stores/useRepairStore";
import { listOrganizations } from "@/api/customer";
import {
  isSaleRepair,
  isNoVehicleRepair,
  getRepairTitle,
  getRepairSubtitle,
} from "@/utils/repairDisplay";
import { formatDateShort, formatMonth, monthKey } from "@/utils/formats";
import { toastError } from "@/utils/handleError";
import {
  useScrollRestoration,
  useScrollTracking,
} from "@/utils/scrollPosition";

// จำผลไว้ กดย้อนกลับมาจะมีรายการตั้งแต่เฟรมแรก
let cachedOrganizations = null;

// ลูกค้าทั่วไปดูเป็นรายบิล เพราะติดเงินครั้งเดียวจบ
const TABS = [
  {
    id: "government",
    label: "หน่วยงาน",
    title: "รายการหน่วยงาน",
    icon: Building2,
  },
  { id: "shop", label: "ร้านค้า", title: "รายการร้านค้า", icon: Store },
  {
    id: "general",
    label: "ลูกค้าทั่วไป",
    title: "รายการบิลค้างชำระ",
    icon: CircleUserRound,
  },
];

const TYPE_OF_TAB = { government: "GOVERNMENT", shop: "SHOP" };

const OrganizationList = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = TABS.some((item) => item.id === searchParams.get("type"))
    ? searchParams.get("type")
    : "government";

  const { repairs, fetchRepairs } = useRepairStore();
  const [organizations, setOrganizations] = useState(cachedOrganizations || []);
  const [isLoading, setIsLoading] = useState(!cachedOrganizations);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await listOrganizations();
        const data = res.data || [];
        cachedOrganizations = data;
        if (!cancelled) setOrganizations(data);
      } catch (error) {
        if (!cancelled) toastError(error);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    fetchRepairs();

    return () => {
      cancelled = true;
    };
  }, [fetchRepairs]);

  // แต่ละกองจำตำแหน่งของตัวเอง สลับกองแล้วไม่ค้างตำแหน่งของกองก่อนหน้า
  const scrollKey = `organizations:${tab}`;
  useScrollTracking(scrollKey);
  useScrollRestoration(scrollKey, !isLoading);

  const visibleOrganizations = organizations.filter(
    (item) => item.organizationType === TYPE_OF_TAB[tab],
  );

  // แยกตามเดือนของบิลค้างที่เก่าสุด เดือนเก่าสุดขึ้นก่อน
  const unpaidByMonth = new Map();
  visibleOrganizations
    .filter((item) => item.creditCount > 0)
    .sort((a, b) => new Date(a.oldestUnpaidAt) - new Date(b.oldestUnpaidAt))
    .forEach((item) => {
      const key = monthKey(item.oldestUnpaidAt);
      if (!unpaidByMonth.has(key)) {
        unpaidByMonth.set(key, {
          name: formatMonth(item.oldestUnpaidAt),
          items: [],
        });
      }
      unpaidByMonth.get(key).items.push(item);
    });
  const organizationGroups = [
    ...unpaidByMonth.values(),
    {
      name: "ไม่มีบิลค้าง",
      items: visibleOrganizations.filter((item) => !(item.creditCount > 0)),
    },
  ].filter((group) => group.items.length > 0);

  const generalRepairs = repairs
    .filter(
      (repair) =>
        repair.status === "CREDIT" && !repair.customer?.organizationType,
    )
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const isGeneral = tab === "general";
  const activeTab = TABS.find((item) => item.id === tab);
  const visibleCount = isGeneral
    ? generalRepairs.length
    : visibleOrganizations.length;
  const isEmpty = isGeneral
    ? generalRepairs.length === 0
    : visibleOrganizations.length === 0;

  const emptyMessage = isGeneral
    ? "ไม่มีบิลค้างชำระ"
    : tab === "shop"
      ? "ไม่มีร้านค้า"
      : "ไม่มีหน่วยงาน";

  return (
    <div className="bg-gradient-primary shadow-primary flex min-h-svh w-full flex-col">
      <div className="flex items-center gap-2 px-5 pt-4">
        <button
          onClick={() =>
            window.history.length > 1
              ? navigate(-1)
              : navigate("/repairs?status=in-progress")
          }
          aria-label="ย้อนกลับ"
          className="bg-surface/20 flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full"
        >
          <ChevronLeft className="text-surface" />
        </button>
        <p className="text-surface min-w-0 flex-1 truncate text-2xl font-semibold md:text-[26px]">
          เครดิต
        </p>
      </div>

      <div className="scrollbar-hide mt-4 flex justify-start gap-4 overflow-x-auto px-5 xl:justify-center">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              const next = new URLSearchParams(searchParams);
              next.set("type", item.id);
              setSearchParams(next, { replace: true });
            }}
            className={`flex h-[45px] w-26.5 shrink-0 cursor-pointer items-center justify-center rounded-lg border-2 text-lg font-semibold duration-300 md:w-30 md:text-xl ${
              tab === item.id
                ? "text-surface bg-status-credit border-white"
                : "border-subtle-light text-subtle-light bg-surface"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="bg-surface shadow-primary mt-4 flex w-full flex-1 flex-col rounded-tl-2xl rounded-tr-2xl px-5 pb-28 xl:pb-4">
        <div className="flex items-center gap-2 pt-4">
          <div className="bg-status-credit text-surface flex h-10 w-10 shrink-0 items-center justify-center rounded-full">
            <activeTab.icon className="h-5 w-5" />
          </div>
          <p className="text-normal text-[22px] font-semibold md:text-2xl">
            {activeTab.title}
          </p>
          {!isLoading && visibleCount > 0 && (
            <span className="text-subtle-light shrink-0 text-lg font-medium md:text-xl">
              ({visibleCount})
            </span>
          )}
        </div>

        {isLoading ? (
          <PageSpinner />
        ) : isEmpty ? (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-subtle-light px-5 text-center text-xl text-balance md:text-[22px]">
              {emptyMessage}
            </p>
          </div>
        ) : isGeneral ? (
          generalRepairs.map((item) => (
            <Link
              key={item.id}
              to={`/repairs/${item.id}`}
              state={{ from: "repair-status", statusSlug: "credit" }}
              className="mt-4 block w-full"
            >
              <CarCard
                bg="credit"
                icon={
                  isSaleRepair(item) ? (
                    <OutlineCardIcon icon={ShoppingBag} color="#7c3aed" />
                  ) : isNoVehicleRepair(item) ? (
                    <OutlineCardIcon icon={WrenchOutline} color="#7c3aed" />
                  ) : (
                    <BrandIcons
                      brand={item.vehicle?.vehicleModel?.brand}
                      color="#7c3aed"
                    />
                  )
                }
                licensePlate={item.customer?.name || getRepairTitle(item)}
                brand={
                  item.customer?.name
                    ? getRepairTitle(item)
                    : getRepairSubtitle(item)
                }
                note={formatDateShort(item.createdAt)}
                price={Number(item.totalPrice) || 0}
              />
            </Link>
          ))
        ) : (
          organizationGroups.map((group) => (
            <div key={group.name}>
              <div className="mt-4 flex items-center gap-2">
                <p className="text-subtle-dark text-lg font-semibold md:text-xl">
                  {group.name}
                </p>
                <span className="text-subtle-light text-lg md:text-xl">
                  ({group.items.length})
                </span>
                <div className="bg-subtle-light/40 h-px flex-1" />
              </div>
              {group.items.map((item) => (
                <Link
                  key={item.id}
                  to={`/organizations/${item.id}`}
                  state={{ organization: item }}
                  className="mt-4 block w-full"
                >
                  <CarCard
                    bg="credit"
                    icon={
                      item.organizationType === "SHOP" ? (
                        <OutlineCardIcon icon={Store} color="#7c3aed" />
                      ) : (
                        <OutlineCardIcon icon={Building2} color="#7c3aed" />
                      )
                    }
                    licensePlate={item.name}
                    brand={`${item.creditCount} บิล`}
                    price={item.creditTotal}
                  />
                </Link>
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default OrganizationList;
