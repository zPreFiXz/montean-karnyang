import PageSpinner from "@/components/ui/PageSpinner";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router";
import {
  ChevronLeft,
  ShoppingBag,
  Wrench as WrenchOutline,
  TicketPercent,
} from "lucide-react";
import CarCard from "@/components/cards/CarCard";
import SearchBar from "@/components/forms/SearchBar";
import OutlineCardIcon from "@/components/icons/OutlineCardIcon";
import BrandIcons from "@/components/icons/BrandIcons";
import { SparePart } from "@/components/icons/Icons";
import { getInventory, listInventoryRepairs } from "@/api/inventory";
import {
  isSaleRepair,
  isNoVehicleRepair,
  getRepairTitle,
  getRepairSubtitle,
} from "@/utils/repairDisplay";
import { formatMonth, monthKey } from "@/utils/formats";
import { getStatusInfo } from "@/constants/repairStatus";
import {
  isDiscountItem,
  isPartLikeItem,
  PART_PLACEHOLDER_SERVICE_NAME,
  SERVICE_PLACEHOLDER_SERVICE_NAME,
} from "@/constants/services";
import { toastError } from "@/utils/handleError";
import {
  useScrollRestoration,
  useScrollTracking,
} from "@/utils/scrollPosition";
import ItemImage from "@/components/ui/ItemImage";

// จำผลไว้นอกคอมโพเนนต์ กดย้อนกลับมาจะมีรายการตั้งแต่เฟรมแรก
const usageCache = new Map();
const itemCache = new Map();
const cacheKey = (type, id) => `${type}-${id}`;

const CARD_BG = {
  ESTIMATE: "estimate",
  IN_PROGRESS: "progress",
  COMPLETED: "completed",
  PAID: "paid",
  CREDIT: "credit",
};

const InventoryUsage = () => {
  const { type, id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const itemName = searchParams.get("name") || "";
  const itemBrand = searchParams.get("brand") || "";
  const backTo = searchParams.get("from") || "/inventory";

  const cached = usageCache.get(cacheKey(type, id));
  const [usages, setUsages] = useState(cached || []);
  const [isLoading, setIsLoading] = useState(!cached);
  const [item, setItem] = useState(itemCache.get(cacheKey(type, id)) ?? null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await listInventoryRepairs(type, id);
        const data = res.data || [];
        usageCache.set(cacheKey(type, id), data);
        if (!cancelled) setUsages(data);
      } catch (error) {
        if (!cancelled) toastError(error);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    (async () => {
      try {
        const res = await getInventory(id, type);
        const data = res.data || null;
        itemCache.set(cacheKey(type, id), data);
        if (!cancelled) setItem(data);
      } catch {
        // ไม่มีรูปก็แค่ขึ้นไอคอนแทน ไม่ต้องรบกวนด้วยข้อความ
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [type, id]);

  const isService = type === "service";

  // สองตัวนี้เป็นรายการเปล่าไว้พิมพ์ชื่อทับ ชื่อในบิลจึงต่างกันทุกใบ มีแค่สองตัวนี้ที่ค้นหาได้
  const isRenamable =
    itemName === PART_PLACEHOLDER_SERVICE_NAME ||
    itemName === SERVICE_PLACEHOLDER_SERVICE_NAME;

  const keyword = isRenamable
    ? (searchParams.get("search") || "").trim().toLowerCase()
    : "";

  const matchesKeyword = ({ repair, itemNames }) =>
    [
      [
        repair.vehicle?.vehicleModel?.brand,
        repair.vehicle?.vehicleModel?.model,
      ].join(" "),
      ...(itemNames || []),
    ].some((text) =>
      String(text || "")
        .toLowerCase()
        .includes(keyword),
    );

  const visibleUsages = keyword ? usages.filter(matchesKeyword) : usages;

  const monthGroups = [];
  for (const usage of visibleUsages) {
    const key = monthKey(usage.repair.createdAt);
    const last = monthGroups[monthGroups.length - 1];
    if (last?.key === key) last.usages.push(usage);
    else
      monthGroups.push({
        key,
        title: formatMonth(usage.repair.createdAt),
        usages: [usage],
      });
  }

  // ถ้ากำลังค้นให้ชื่อที่ตรงขึ้นก่อน
  const billNameLabel = (names) =>
    (keyword &&
      names.find((name) => String(name).toLowerCase().includes(keyword))) ||
    names[0];

  const usageNoun = isDiscountItem({ name: itemName })
    ? "ส่วนลด"
    : isService && !isPartLikeItem({ name: itemName })
      ? "บริการ"
      : "อะไหล่";

  const scrollKey = `usage:${type}-${id}`;
  useScrollTracking(scrollKey);
  useScrollRestoration(scrollKey, !isLoading);

  return (
    <div className="bg-gradient-primary shadow-primary flex min-h-svh w-full flex-col">
      <div className="flex items-center gap-2 px-5 pt-4">
        <button
          // ถอยประวัติ เบราว์เซอร์จะคืนตำแหน่งให้เอง (เปิดลิงก์ตรงๆ ไม่มีประวัติ จึงมีเส้นทางสำรอง)
          onClick={() =>
            window.history.length > 1 ? navigate(-1) : navigate(backTo)
          }
          aria-label="ย้อนกลับ"
          className="bg-surface/20 flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full"
        >
          <ChevronLeft className="text-surface" />
        </button>
        <p className="text-surface min-w-0 flex-1 truncate text-2xl font-semibold md:text-[26px]">
          ประวัติการใช้
        </p>
      </div>

      <div className="bg-surface shadow-primary mt-4 flex w-full flex-1 flex-col rounded-tl-2xl rounded-tr-2xl px-5 pb-28">
        <div className="flex items-center gap-2 pt-4">
          <div className="shadow-primary bg-surface flex h-15 w-15 shrink-0 items-center justify-center rounded-lg border border-gray-200">
            <ItemImage
              src={item?.secureUrl}
              alt={itemName}
              className="h-full w-full rounded-lg object-cover"
              fallback={
                <div className="text-subtle-light flex h-15 w-15 items-center justify-center">
                  {/* ประแจของ Icons ฝังเส้นสีขาวไว้ กรอบพื้นขาวจึงต้องใช้ตัวที่รับสีตามข้อความ */}
                  {isDiscountItem({ name: itemName }) ? (
                    <TicketPercent className="h-9 w-9" />
                  ) : isService && !isPartLikeItem({ name: itemName }) ? (
                    <WrenchOutline className="h-9 w-9" />
                  ) : (
                    <SparePart className="h-10 w-10" />
                  )}
                </div>
              }
            />
          </div>
          <p className="text-normal line-clamp-2 min-w-0 flex-1 text-xl leading-tight font-semibold break-words md:text-[22px]">
            {[itemBrand, itemName].filter(Boolean).join(" ")}
          </p>
        </div>

        {!isLoading && isRenamable && usages.length > 0 && (
          <div className="pt-4">
            <SearchBar placeholder="ค้นหาชื่อในบิล, ยี่ห้อ, รุ่นรถ" />
          </div>
        )}

        {isLoading ? (
          <PageSpinner />
        ) : visibleUsages.length === 0 ? (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-subtle-light px-5 text-center text-xl text-balance md:text-[22px]">
              {keyword
                ? `ไม่พบรายการที่ตรงกับ "${searchParams.get("search").trim()}"`
                : `ไม่มีรายการที่เคยใช้${usageNoun}นี้`}
            </p>
          </div>
        ) : (
          monthGroups.map((group) => (
            <div key={group.key}>
              <div className="mt-4 flex items-center gap-2">
                <p className="text-subtle-dark text-lg font-semibold md:text-xl">
                  {group.title}
                </p>
                <span className="text-subtle-light text-lg md:text-xl">
                  ({group.usages.length})
                </span>
                <div className="bg-subtle-light/40 h-px flex-1" />
              </div>
              {group.usages.map(({ repair, itemNames }) => {
                const status = getStatusInfo(repair.status);
                const detail =
                  isRenamable && itemNames?.length
                    ? billNameLabel(itemNames)
                    : null;
                return (
                  <Link
                    key={repair.id}
                    to={`/repairs/${repair.id}`}
                    className="mt-4 block w-full"
                  >
                    <CarCard
                      bg={CARD_BG[repair.status] || "primary"}
                      icon={
                        isSaleRepair(repair) ? (
                          <OutlineCardIcon
                            icon={ShoppingBag}
                            color={status.iconColor}
                          />
                        ) : isNoVehicleRepair(repair) ? (
                          <OutlineCardIcon
                            icon={WrenchOutline}
                            color={status.iconColor}
                          />
                        ) : (
                          <BrandIcons
                            brand={repair.vehicle?.vehicleModel?.brand}
                            color={status.iconColor}
                          />
                        )
                      }
                      licensePlate={getRepairTitle(repair)}
                      brand={getRepairSubtitle(repair)}
                      note={detail}
                    />
                  </Link>
                );
              })}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default InventoryUsage;
