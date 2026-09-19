import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import {
  ChevronLeft,
  LoaderCircle,
  Store,
  Building2,
  CircleUserRound,
  ShoppingBag,
} from "lucide-react";
// ประแจของชุดไอคอนโปรเจคฝังเส้นสีขาวไว้ในตัว ใช้บนวงกลมสีทึบได้เลย
// ต่างจากของ lucide ที่รับสีตามข้อความ จะกลายเป็นสีเข้มบนพื้นม่วง
import { Wrench } from "@/components/icons/Icons";
import CarCard from "@/components/cards/CarCard";
import BrandIcons from "@/components/icons/BrandIcons";
import useRepairStore from "@/stores/useRepairStore";
import { listOrganizations } from "@/api/customer";
import {
  isSaleRepair,
  isNoVehicleRepair,
  getRepairTitle,
  getRepairSubtitle,
} from "@/utils/repairDisplay";
import { formatDateShort, formatMonth } from "@/utils/formats";
import { toastError } from "@/utils/handleError";
import {
  useScrollRestoration,
  useScrollTracking,
} from "@/utils/scrollPosition";

// จำผลไว้ กดย้อนกลับมาจะได้มีรายการโชว์ตั้งแต่เฟรมแรก ไม่ต้องขึ้นตัวหมุน
let cachedOrganizations = null;

// สามกอง: หน่วยงานกับร้านค้ารวมยอดเป็นรายชื่อ ส่วนลูกค้าทั่วไปดูเป็นรายบิล
// เพราะเป็นคนที่ติดเงินครั้งเดียวจบ ไม่ได้เปิดบิลต่อเนื่องแล้วมาเคลียร์ทีเดียว
const TABS = [
  { id: "government", label: "หน่วยงาน", icon: Building2 },
  { id: "shop", label: "ร้านค้า", icon: Store },
  { id: "general", label: "ลูกค้าทั่วไป", icon: CircleUserRound },
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

  const generalRepairs = repairs
    .filter(
      (repair) =>
        repair.status === "CREDIT" && !repair.customer?.organizationType,
    )
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const isGeneral = tab === "general";
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
      <div className="flex items-center gap-[8px] px-[20px] pt-[16px]">
        <button
          onClick={() =>
            window.history.length > 1
              ? navigate(-1)
              : navigate("/repairs?status=in-progress")
          }
          aria-label="ย้อนกลับ"
          className="bg-surface/20 flex h-[40px] w-[40px] shrink-0 cursor-pointer items-center justify-center rounded-full"
        >
          <ChevronLeft className="text-surface" />
        </button>
        <p className="text-surface min-w-0 flex-1 truncate text-2xl font-semibold md:text-[26px]">
          เครดิต
        </p>
      </div>

      {/* แถบเลือกกอง วางแบบเดียวกับแท็บสถานะการซ่อม */}
      <div className="scrollbar-hide mt-[16px] flex justify-start gap-[16px] overflow-x-auto px-[20px] xl:justify-center">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              const next = new URLSearchParams(searchParams);
              next.set("type", item.id);
              setSearchParams(next, { replace: true });
            }}
            className={`flex h-[45px] w-[106px] shrink-0 cursor-pointer items-center justify-center rounded-[10px] border-2 text-lg font-semibold duration-300 md:w-[120px] md:text-xl ${
              tab === item.id
                ? "text-surface bg-status-credit border-white"
                : "border-subtle-light text-subtle-light bg-surface"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="bg-surface shadow-primary mt-[16px] flex w-full flex-1 flex-col rounded-tl-2xl rounded-tr-2xl px-[20px] pb-[112px] xl:pb-[16px]">
        {isLoading ? (
          <div className="flex flex-1 items-center justify-center">
            <LoaderCircle className="text-primary h-8 w-8 animate-spin" />
          </div>
        ) : isEmpty ? (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-subtle-light px-[20px] text-center text-xl text-balance md:text-[22px]">
              {emptyMessage}
            </p>
          </div>
        ) : isGeneral ? (
          // ลูกค้าทั่วไปดูเป็นรายบิล เพราะติดเงินครั้งเดียวจบ ไม่ได้เปิดบิลต่อเนื่อง
          generalRepairs.map((item) => (
            <Link
              key={item.id}
              to={`/repairs/${item.id}`}
              state={{ from: "repair-status", statusSlug: "credit" }}
              className="mt-[16px] block w-full"
            >
              <CarCard
                bg="credit"
                icon={
                  isSaleRepair(item) ? (
                    <ShoppingBag className="text-surface h-6 w-6" />
                  ) : isNoVehicleRepair(item) ? (
                    <Wrench />
                  ) : (
                    <BrandIcons
                      brand={item.vehicle?.vehicleModel?.brand}
                      color="#7c3aed"
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
        ) : (
          visibleOrganizations.map((item) => (
            <Link
              key={item.id}
              to={`/organizations/${item.id}`}
              className="mt-[16px] block w-full"
            >
              {/* ใช้การ์ดตัวเดียวกับรายการบิลทุกหน้า ต่างแค่ของที่ใส่เข้าไป
                  ชื่อหน่วยงานแทนทะเบียน ประเภทกับจำนวนบิลแทนยี่ห้อรุ่น และยอดค้างแทนยอดบิล */}
              <CarCard
                bg="credit"
                icon={
                  item.organizationType === "SHOP" ? (
                    <Store className="text-surface h-6 w-6" />
                  ) : (
                    <Building2 className="text-surface h-6 w-6" />
                  )
                }
                licensePlate={item.name}
                // ไม่บอกประเภทซ้ำ เพราะกองที่เลือกอยู่กับไอคอนบอกไปแล้วสองชั้น
                // เดือนของบิลค้างที่เก่าสุดมาก่อน แล้วค่อยบอกว่ากี่บิล
                brand={
                  item.oldestUnpaidAt ? formatMonth(item.oldestUnpaidAt) : ""
                }
                note={`${item.creditCount} บิล`}
                price={item.creditTotal}
              />
            </Link>
          ))
        )}
      </div>
    </div>
  );
};

export default OrganizationList;
