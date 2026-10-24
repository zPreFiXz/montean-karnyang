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
import { formatDateShort } from "@/utils/formats";
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

// จำผลไว้นอกคอมโพเนนต์ กดย้อนกลับมาจะมีรายการตั้งแต่เฟรมแรก
const usageCache = new Map();
const imageCache = new Map();
const cacheKey = (type, id) => `${type}-${id}`;

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
  const [itemImage, setItemImage] = useState(
    imageCache.get(cacheKey(type, id)) ?? null,
  );

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
        const url = res.data?.secureUrl || null;
        imageCache.set(cacheKey(type, id), url);
        if (!cancelled) setItemImage(url);
      } catch {
        // ไม่มีรูปก็แค่ขึ้นไอคอนแทน ไม่ต้องรบกวนด้วยข้อความ
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [type, id]);

  const isService = type === "service";

  const keyword = (searchParams.get("search") || "").trim();

  // สองตัวนี้เป็นรายการเปล่าไว้พิมพ์ชื่อทับ ชื่อในบิลจึงต่างกันทุกใบ
  const isRenamable =
    itemName === PART_PLACEHOLDER_SERVICE_NAME ||
    itemName === SERVICE_PLACEHOLDER_SERVICE_NAME;

  const visibleUsages =
    keyword && isRenamable
      ? usages.filter(({ itemNames }) =>
          (itemNames || []).some((name) => String(name).includes(keyword)),
        )
      : usages;

  // โชว์ชื่อเดียวแล้วบอกจำนวนที่เหลือ ถ้ากำลังค้นให้ชื่อที่ตรงขึ้นก่อน
  const billNameLabel = (names) => {
    const matched = keyword
      ? names.find((name) => String(name).includes(keyword))
      : null;
    const first = matched || names[0];
    const rest = names.length - 1;

    return rest > 0 ? `${first} และอีก ${rest}` : first;
  };

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
            {itemImage ? (
              <img
                src={itemImage}
                alt={itemName}
                className="h-full w-full rounded-lg object-cover"
              />
            ) : (
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
            )}
          </div>
          <p className="text-normal line-clamp-2 min-w-0 flex-1 text-xl leading-tight font-semibold break-words md:text-[22px]">
            {[itemBrand, itemName].filter(Boolean).join(" ")}
          </p>
        </div>

        {!isLoading && isRenamable && usages.length > 0 && (
          <div className="pt-4">
            <SearchBar placeholder="ค้นหาชื่อในบิล" />
          </div>
        )}

        <div className="mt-4 flex items-center gap-2">
          <p className="text-normal text-[22px] font-semibold md:text-2xl">
            รายการที่เคยใช้
          </p>
          {!isLoading && visibleUsages.length > 0 && (
            <span className="text-subtle-light shrink-0 text-lg font-medium md:text-xl">
              ({visibleUsages.length})
            </span>
          )}
        </div>

        {isLoading ? (
          <PageSpinner />
        ) : visibleUsages.length === 0 ? (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-subtle-light px-5 text-center text-xl text-balance md:text-[22px]">
              {keyword && isRenamable
                ? `ไม่พบ "${keyword}"`
                : `ไม่มีรายการที่เคยใช้${usageNoun}นี้`}
            </p>
          </div>
        ) : (
          visibleUsages.map(({ repair, itemNames }) => (
            <Link
              key={repair.id}
              to={`/repairs/${repair.id}`}
              className="bg-surface shadow-primary mt-4 block h-20 w-full rounded-lg"
            >
              <CarCard
                bg="primary"
                icon={
                  isSaleRepair(repair) ? (
                    <OutlineCardIcon icon={ShoppingBag} color="#1976d2" />
                  ) : isNoVehicleRepair(repair) ? (
                    <OutlineCardIcon icon={WrenchOutline} color="#1976d2" />
                  ) : (
                    <BrandIcons
                      brand={repair.vehicle?.vehicleModel?.brand}
                      color="#1976d2"
                    />
                  )
                }
                licensePlate={getRepairTitle(repair)}
                brand={getRepairSubtitle(repair)}
                note={
                  isRenamable && itemNames?.length
                    ? billNameLabel(itemNames)
                    : formatDateShort(repair.createdAt)
                }
              />
            </Link>
          ))
        )}
      </div>
    </div>
  );
};

export default InventoryUsage;
