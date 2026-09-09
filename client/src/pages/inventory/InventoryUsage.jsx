import { useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router";
import {
  ChevronLeft,
  LoaderCircle,
  ShoppingBag,
  Wrench as WrenchOutline,
} from "lucide-react";
import CarCard from "@/components/cards/CarCard";
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
import { toastError } from "@/utils/handleError";

// ประวัติการใช้ของอะไหล่หรือบริการหนึ่งตัว: บิลไหนบ้างที่เคยมีของชิ้นนี้
// ชื่อของมาทางพารามิเตอร์ ไม่ต้องยิงขอซ้ำ เพราะเข้าหน้านี้จากไดอะล็อกที่มีข้อมูลอยู่แล้ว
const InventoryUsage = () => {
  const { type, id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const itemName = searchParams.get("name") || "";
  const itemBrand = searchParams.get("brand") || "";
  const backTo = searchParams.get("from") || "/inventory";

  const [usages, setUsages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  // ชื่อกับยี่ห้อมาทางพารามิเตอร์ ขึ้นได้ทันที ส่วนรูปต้องขอจากคลัง
  const [itemImage, setItemImage] = useState(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await listInventoryRepairs(type, id);
        if (!cancelled) setUsages(res.data || []);
      } catch (error) {
        if (!cancelled) toastError(error);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    (async () => {
      try {
        const res = await getInventory(id, type);
        if (!cancelled) setItemImage(res.data?.secureUrl || null);
      } catch {
        // ไม่มีรูปก็แค่ขึ้นไอคอนแทน ไม่ต้องรบกวนด้วยข้อความ
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [type, id]);

  const isService = type === "service";

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
                {/* ประแจของ Icons ถูกกำหนดเส้นสีขาวไว้ ใช้ได้เฉพาะบนวงกลมสีเข้ม
                    กรอบรูปพื้นขาวจึงต้องใช้ตัวที่รับสีตามข้อความได้ */}
                {isService ? (
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

        <div className="mt-[16px] flex items-center gap-[8px]">
          <p className="text-normal text-[22px] font-semibold md:text-2xl">
            รายการที่เคยใช้
          </p>
          {!isLoading && usages.length > 0 && (
            <span className="text-subtle-light shrink-0 text-lg font-medium md:text-xl">
              ({usages.length})
            </span>
          )}
        </div>

        {isLoading ? (
          <div className="flex flex-1 items-center justify-center">
            <LoaderCircle className="text-primary h-8 w-8 animate-spin" />
          </div>
        ) : usages.length === 0 ? (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-subtle-light px-[20px] text-center text-xl text-balance md:text-[22px]">
              ไม่มีรายการที่เคยใช้{isService ? "บริการนี้" : "อะไหล่นี้"}
            </p>
          </div>
        ) : (
          usages.map(({ repair }) => (
            <Link
              key={repair.id}
              to={`/repairs/${repair.id}`}
              className="bg-surface shadow-primary mt-[16px] block h-[80px] w-full rounded-[10px]"
            >
              <CarCard
                bg="primary"
                icon={
                  isSaleRepair(repair) ? (
                    <ShoppingBag className="text-surface h-6 w-6" />
                  ) : isNoVehicleRepair(repair) ? (
                    <Wrench />
                  ) : (
                    <BrandIcons
                      brand={repair.vehicle?.vehicleModel?.brand}
                      color="#1976d2"
                    />
                  )
                }
                licensePlate={getRepairTitle(repair)}
                brand={getRepairSubtitle(repair)}
                // วันที่เปิดบิล = วันที่ของถูกเบิกไปใช้จริง
                note={formatDateShort(repair.createdAt)}
              />
            </Link>
          ))
        )}
      </div>
    </div>
  );
};

export default InventoryUsage;
