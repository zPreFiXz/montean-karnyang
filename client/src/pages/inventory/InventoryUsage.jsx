import PageSpinner from "@/components/ui/PageSpinner";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router";
import {
  ChevronLeft,
  LoaderCircle,
  ShoppingBag,
  Wrench as WrenchOutline,
  TicketPercent,
} from "lucide-react";
import CarCard from "@/components/cards/CarCard";
import SearchBar from "@/components/forms/SearchBar";
import OutlineCardIcon from "@/components/icons/OutlineCardIcon";
import BrandIcons from "@/components/icons/BrandIcons";
import { Wrench, SparePart } from "@/components/icons/Icons";
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
  isPartPlaceholderItem,
  PART_PLACEHOLDER_SERVICE_NAME,
  SERVICE_PLACEHOLDER_SERVICE_NAME,
} from "@/constants/services";
import { toastError } from "@/utils/handleError";
import {
  useScrollRestoration,
  useScrollTracking,
} from "@/utils/scrollPosition";

// จำผลของแต่ละชิ้นไว้ กดย้อนกลับมาจะได้มีรายการโชว์ตั้งแต่เฟรมแรก ไม่ต้องขึ้นตัวหมุน
// อยู่นอกคอมโพเนนต์เพราะต้องอยู่ข้ามการเปลี่ยนหน้า และหายไปเองเมื่อรีเฟรชเบราว์เซอร์
const usageCache = new Map();
const imageCache = new Map();
const cacheKey = (type, id) => `${type}-${id}`;

// ประวัติการใช้ของอะไหล่หรือบริการหนึ่งตัว: บิลไหนบ้างที่เคยมีของชิ้นนี้
// ชื่อของมาทางพารามิเตอร์ ไม่ต้องยิงขอซ้ำ เพราะเข้าหน้านี้จากไดอะล็อกที่มีข้อมูลอยู่แล้ว
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
  // ชื่อกับยี่ห้อมาทางพารามิเตอร์ ขึ้นได้ทันที ส่วนรูปต้องขอจากคลัง
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

  // เรียกตามสิ่งที่คนกำลังดูจริง ไม่ใช่ตามชนิดที่เก็บในระบบ
  // ส่วนลดกับอะไหล่อื่นๆ ถูกเก็บในหมวดบริการ แต่ความหมายคนละอย่างกับงานบริการ
  const [search, setSearch] = useState("");
  const keyword = search.trim();

  // เฉพาะสองตัวนี้เท่านั้นที่เป็นรายการเปล่าไว้พิมพ์ชื่อทับ ชื่อในบิลจึงต่างกันทุกใบ
  // ของอื่นใช้ชื่อจากคลังเหมือนกันหมด ไม่มีอะไรให้ค้น
  const isRenamable =
    itemName === PART_PLACEHOLDER_SERVICE_NAME ||
    itemName === SERVICE_PLACEHOLDER_SERVICE_NAME;

  // ค้นจากชื่อที่ตั้งไว้ในบิลอย่างเดียว เพราะนั่นคือสิ่งเดียวที่ต่างกันในแต่ละใบ
  const visibleUsages =
    keyword && isRenamable
      ? usages.filter(({ itemNames }) =>
          (itemNames || []).some((name) => String(name).includes(keyword)),
        )
      : usages;

  // บิลเดียวอาจมีหลายบรรทัดคนละชื่อ เอามาต่อกันทั้งหมดจะยาวจนโดนตัดท้าย
  // จึงโชว์ชื่อเดียวแล้วบอกจำนวนที่เหลือ และถ้ากำลังค้นอยู่ให้ชื่อที่ตรงกับคำค้นขึ้นก่อน
  // ใช้คำว่า "และอีก" ไม่ใช่ "+2" เพราะหน้านี้เต็มไปด้วยตัวเลขเงินกับจำนวนชิ้น
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
    : isService && !isPartPlaceholderItem({ name: itemName })
      ? "บริการ"
      : "อะไหล่";

  // กดเข้าไปดูบิลแล้วกดกลับ ต้องอยู่ตรงเดิม แยกตำแหน่งของแต่ละอะไหล่หรือบริการ
  const scrollKey = `usage:${type}-${id}`;
  useScrollTracking(scrollKey);
  useScrollRestoration(scrollKey, !isLoading);

  return (
    <div className="bg-gradient-primary shadow-primary flex min-h-svh w-full flex-col">
      <div className="flex items-center gap-[8px] px-[20px] pt-[16px]">
        <button
          // ถอยประวัติเหมือนหน้าแก้ไข เบราว์เซอร์จะคืนตำแหน่งที่เลื่อนค้างไว้ให้เอง
          // (เปิดลิงก์นี้ตรงๆ จะไม่มีประวัติให้ถอย จึงมีเส้นทางสำรองไว้)
          onClick={() =>
            window.history.length > 1 ? navigate(-1) : navigate(backTo)
          }
          aria-label="ย้อนกลับ"
          className="bg-surface/20 flex h-[40px] w-[40px] shrink-0 cursor-pointer items-center justify-center rounded-full"
        >
          <ChevronLeft className="text-surface" />
        </button>
        <p className="text-surface min-w-0 flex-1 truncate text-2xl font-semibold md:text-[26px]">
          ประวัติการใช้
        </p>
      </div>

      <div className="bg-surface shadow-primary mt-[16px] flex w-full flex-1 flex-col rounded-tl-2xl rounded-tr-2xl px-[20px] pb-[112px]">
        {/* ของที่กำลังดูประวัติอยู่ วางไว้บนสุดของเนื้อหา
            อ่านรูปกับชื่อได้เต็มๆ แล้วค่อยไล่ดูรายการงานถัดลงไป */}
        <div className="flex items-center gap-[8px] pt-[16px]">
          <div className="shadow-primary bg-surface flex h-[60px] w-[60px] shrink-0 items-center justify-center rounded-[10px] border border-gray-200">
            {itemImage ? (
              <img
                src={itemImage}
                alt={itemName}
                className="h-full w-full rounded-[10px] object-cover"
              />
            ) : (
              <div className="text-subtle-light flex h-[60px] w-[60px] items-center justify-center">
                {/* กติกาเดียวกับการ์ดในหน้าคลัง ส่วนลดใช้ป้ายลดราคา
                    "อะไหล่อื่นๆ" อยู่ในหมวดบริการแต่ความหมายคืออะไหล่ จึงใช้น็อต
                    (ประแจของ Icons ฝังเส้นสีขาวไว้ กรอบรูปพื้นขาวจึงต้องใช้ตัวที่รับสีตามข้อความ) */}
                {isDiscountItem({ name: itemName }) ? (
                  <TicketPercent className="h-9 w-9" />
                ) : isService && !isPartPlaceholderItem({ name: itemName }) ? (
                  <WrenchOutline className="h-9 w-9" />
                ) : (
                  <SparePart className="h-10 w-10" />
                )}
              </div>
            )}
          </div>
          {/* ยี่ห้อกับชื่อเป็นข้อความเดียวกัน ตัวเดียวกัน ตกบรรทัดพร้อมกันได้ไม่เกินสองบรรทัด */}
          <p className="text-normal line-clamp-2 min-w-0 flex-1 text-xl leading-tight font-semibold break-words md:text-[22px]">
            {[itemBrand, itemName].filter(Boolean).join(" ")}
          </p>
        </div>

        {/* รายการเปล่าอย่างอะไหล่อื่นๆ ถูกพิมพ์ชื่อทับเป็นรายใบ ชื่อจึงต่างกันทุกบิล
            ช่องค้นหาไว้ไล่หาบิลจากชื่อที่ตั้งไว้ตอนนั้น รวมถึงทะเบียนและชื่อลูกค้า */}
        {!isLoading && isRenamable && usages.length > 0 && (
          <div className="pt-[16px]">
            <SearchBar
              placeholder="ค้นหาชื่อในบิล"
              value={search}
              onSearch={setSearch}
            />
          </div>
        )}

        <div className="mt-[16px] flex items-center gap-[8px]">
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
            <p className="text-subtle-light px-[20px] text-center text-xl text-balance md:text-[22px]">
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
              className="bg-surface shadow-primary mt-[16px] block h-[80px] w-full rounded-[10px]"
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
                // รายการเปล่าตั้งชื่อเองรายใบ ชื่อในบิลบอกได้ว่าใช้ทำอะไร
                // บรรทัดเดียวใส่ได้สองอย่าง จึงสละวันที่ไป (ดูได้ในบิลตอนกดเข้าไป)
                // ของอื่นใช้ชื่อจากคลังเหมือนกันหมด จึงบอกวันที่เปิดบิลแทน
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
