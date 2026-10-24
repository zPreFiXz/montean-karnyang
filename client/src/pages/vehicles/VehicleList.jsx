import PageSpinner from "@/components/ui/PageSpinner";
import { useEffect, useState, useRef } from "react";
import { Link, useNavigationType, useSearchParams } from "react-router";
import SearchBar from "@/components/forms/SearchBar";
import CarCard from "@/components/cards/CarCard";
import { listVehicles } from "@/api/vehicle";
import { Document } from "@/components/icons/Icons";
import BrandIcons from "@/components/icons/BrandIcons";
import { toastError } from "@/utils/handleError";
import { getDisplayBrand } from "@/utils/repairDisplay";
import { formatPlate } from "@/utils/formats";
import {
  saveScrollPosition,
  useScrollRestoration,
} from "@/utils/scrollPosition";

const SCROLL_KEY = "vehicles";

// จำผลไว้นอกคอมโพเนนต์ กดย้อนกลับมาจะมีรายการตั้งแต่เฟรมแรก
const vehicleCache = new Map();
const cacheKey = (search) => search || "";

// numeric: true ให้เทียบกลุ่มตัวเลขตามค่าจริง ทะเบียน 999 จึงมาก่อน 1234
const plateCollator = new Intl.Collator("th", { numeric: true });

const VehicleList = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const isInitializing = useRef(false);
  // ค่าจะเปลี่ยนเมื่อพิมพ์ค้นหา (setSearchParams นับเป็นการไปหน้าใหม่) จึงเก็บไว้ครั้งเดียวตอนเข้าหน้า
  const isReturning = useRef(useNavigationType() === "POP");

  const search = searchParams.get("search");

  const cachedVehicles = vehicleCache.get(cacheKey(search));
  const [vehicles, setVehicles] = useState(cachedVehicles || []);
  const [isLoading, setIsLoading] = useState(!cachedVehicles);

  const searchTerm =
    search && search.length > 20 ? `${search.slice(0, 20)}…` : search;

  // กลับมาจากหน้ารายละเอียด = ดูรายการเดิมต่อ คงคำค้นไว้ เข้าจากเมนู = ล้างคำค้นเก่า
  useEffect(() => {
    if (isReturning.current) return;

    if (isInitializing.current) return;
    isInitializing.current = true;

    const params = new URLSearchParams();
    setSearchParams(params);
    handleFilter(null);

    setTimeout(() => {
      isInitializing.current = false;
    }, 200);
  }, []);

  useScrollRestoration(SCROLL_KEY, !isLoading);

  useEffect(() => {
    if (isInitializing.current) return;

    if (search) {
      handleFilter(search);
    } else {
      handleFilter(null);
    }
  }, [search]);

  // เรียงฝั่งเบราว์เซอร์ เพราะ MySQL เรียงเลขในทะเบียนแบบตัวอักษร (999 ต้องมาก่อน 1234)
  const sortVehicles = (list = []) =>
    [...list].sort((a, b) => {
      const fields = [
        [a.licensePlate?.plateNumber, b.licensePlate?.plateNumber],
        [a.licensePlate?.province, b.licensePlate?.province],
        [a.vehicleModel?.brand, b.vehicleModel?.brand],
        [a.vehicleModel?.model, b.vehicleModel?.model],
      ];

      for (const [left, right] of fields) {
        // รถที่ไม่มีทะเบียนไปอยู่ท้ายสุด ไม่ใช่แทรกอยู่ต้นลิสต์เพราะค่าว่างเรียงมาก่อนเสมอ
        if (!left && right) return 1;
        if (left && !right) return -1;

        const result = plateCollator.compare(left || "", right || "");
        if (result !== 0) return result;
      }

      return 0;
    });

  const handleFilter = async (search) => {
    const cached = vehicleCache.get(cacheKey(search));
    if (cached) {
      setVehicles(cached);
      setIsLoading(false);
    } else {
      setIsLoading(true);
    }
    try {
      const res = await listVehicles(search);
      const sorted = sortVehicles(res.data);
      vehicleCache.set(cacheKey(search), sorted);
      setVehicles(sorted);
    } catch (error) {
      toastError(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gradient-primary shadow-primary flex min-h-svh w-full flex-col">
      <div className="flex items-center gap-2 pt-4 pl-5">
        <div className="bg-surface/20 flex h-10 w-10 items-center justify-center rounded-full">
          <Document color="#ffffff" />
        </div>
        <div className="flex items-center gap-2">
          <p className="text-surface text-2xl font-semibold md:text-[26px]">
            ประวัติรถ
          </p>
          {!isLoading && vehicles.length > 0 && (
            <span className="text-surface/70 shrink-0 text-xl font-medium md:text-[22px]">
              ({vehicles.length})
            </span>
          )}
        </div>
      </div>
      <div className="bg-surface shadow-primary mt-4 flex w-full flex-1 flex-col rounded-tl-2xl rounded-tr-2xl pb-28 xl:pb-4">
        <div className="flex flex-1 flex-col px-5 pt-4">
          <SearchBar placeholder="ค้นหาทะเบียน, จังหวัด, ยี่ห้อ, รุ่นรถ, ชื่อลูกค้า" />

          {isLoading ? (
            <PageSpinner />
          ) : vehicles.length === 0 ? (
            <div className="flex flex-1 items-center justify-center">
              <p className="text-subtle-light px-5 text-center text-xl text-balance md:text-[22px]">
                {search ? `ไม่พบ "${searchTerm}"` : "ไม่มีประวัติรถ"}
              </p>
            </div>
          ) : (
            vehicles.map((item, index) => (
              <div key={index} className="mt-4">
                <Link
                  to={`/vehicles/${item.id}`}
                  onClick={() => saveScrollPosition(SCROLL_KEY)}
                >
                  <CarCard
                    bg="primary"
                    icon={<BrandIcons brand={item.vehicleModel.brand} />}
                    licensePlate={
                      item.licensePlate
                        ? `${formatPlate(item.licensePlate.plateNumber)} ${item.licensePlate.province}`
                        : "ไม่ระบุทะเบียนรถ"
                    }
                    brand={getDisplayBrand(item.vehicleModel)}
                    note={item.repairs?.[0]?.customer?.name}
                  />
                </Link>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
export default VehicleList;
