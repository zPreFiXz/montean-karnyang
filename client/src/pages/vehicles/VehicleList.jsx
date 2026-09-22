import PageSpinner from "@/components/ui/PageSpinner";
import { useEffect, useState, useRef } from "react";
import { Link, useNavigationType, useSearchParams } from "react-router";
import { LoaderCircle } from "lucide-react";
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

// จำผลค้นล่าสุดของแต่ละคำค้นไว้ กดย้อนกลับมาจะได้มีรายการโชว์ตั้งแต่เฟรมแรก
// ไม่ต้องขึ้นตัวโหลดคั่นให้หน้ากระพริบ แล้วค่อยดึงใหม่ทับเงียบๆ
// อยู่นอกคอมโพเนนต์เพราะต้องอยู่ข้ามการเปลี่ยนหน้า และหายไปเองเมื่อรีเฟรชเบราว์เซอร์
const vehicleCache = new Map();
const cacheKey = (search) => search || "";

// numeric: true ให้เทียบกลุ่มตัวเลขตามค่าจริง ทะเบียน 999 จึงมาก่อน 1234
const plateCollator = new Intl.Collator("th", { numeric: true });

const VehicleList = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const isInitializing = useRef(false);
  // ประเภทการเข้าหน้าตอนแรกเท่านั้นที่บอกได้ว่าเป็นการย้อนกลับ
  // ค่าจะเปลี่ยนเมื่อพิมพ์ค้นหา (เพราะ setSearchParams นับเป็นการไปหน้าใหม่) จึงเก็บไว้ครั้งเดียว
  const isReturning = useRef(useNavigationType() === "POP");

  const search = searchParams.get("search");

  // เริ่มจากผลเดิมที่จำไว้ได้เลย ไม่ต้องรอเอฟเฟกต์ หน้าจึงไม่กระพริบเป็นตัวโหลดหนึ่งเฟรม
  const cachedVehicles = vehicleCache.get(cacheKey(search));
  const [vehicles, setVehicles] = useState(cachedVehicles || []);
  const [isLoading, setIsLoading] = useState(!cachedVehicles);

  // ตัดกันตกบรรทัด — คำค้นอาจยาวเกินได้ถ้าใส่มาทาง URL ตรงๆ
  const searchTerm =
    search && search.length > 20 ? `${search.slice(0, 20)}…` : search;

  // กลับมาจากหน้ารายละเอียด = ดูรายการเดิมต่อ คำค้นที่ติดอยู่ใน URL จึงคงไว้
  // (ไม่ต้องสั่งโหลดเอง เอฟเฟกต์ของ search ข้างล่างทำให้แล้วตั้งแต่เฟรมแรก)
  // เข้าจากเมนู = เริ่มดูใหม่ ต้องล้างคำค้นเก่าทิ้ง
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

  // เรียงฝั่งเบราว์เซอร์ เพราะ MySQL เรียงภาษาไทยกับตัวเลขในทะเบียนได้ไม่ตรงอย่างที่ต้องการ
  // (ต้องอ่าน 999 ว่าน้อยกว่า 1234 ไม่ใช่เทียบทีละตัวอักษร)
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
    // มีผลเดิมของคำค้นนี้อยู่แล้วก็โชว์ไปก่อน ไม่ต้องขึ้นตัวโหลด
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
      <div className="flex items-center gap-[8px] pt-[16px] pl-[20px]">
        <div className="bg-surface/20 flex h-[40px] w-[40px] items-center justify-center rounded-full">
          <Document color="#ffffff" />
        </div>
        <div>
          <p className="text-surface text-2xl font-semibold md:text-[26px]">
            ประวัติรถ
          </p>
        </div>
      </div>
      <div className="bg-surface shadow-primary mt-[16px] flex w-full flex-1 flex-col rounded-tl-2xl rounded-tr-2xl pb-[112px] xl:pb-[16px]">
        <div className="flex flex-1 flex-col px-[20px] pt-[16px]">
          {/* แถบค้นหา */}
          <SearchBar placeholder="ค้นหาทะเบียน, จังหวัด, ยี่ห้อ, รุ่นรถ, ชื่อลูกค้า" />

          {/* รายการรถ */}
          {isLoading ? (
            <PageSpinner />
          ) : vehicles.length === 0 ? (
            <div className="flex flex-1 items-center justify-center">
              <p className="text-subtle-light px-[20px] text-center text-xl text-balance md:text-[22px]">
                {search ? `ไม่พบ "${searchTerm}"` : "ไม่มีประวัติรถ"}
              </p>
            </div>
          ) : (
            vehicles.map((item, index) => (
              <div key={index} className="mt-[16px]">
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
