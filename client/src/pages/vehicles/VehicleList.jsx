import { useEffect, useState, useRef } from "react";
import { Link, useSearchParams } from "react-router";
import { LoaderCircle } from "lucide-react";
import SearchBar from "@/components/forms/SearchBar";
import CarCard from "@/components/cards/CarCard";
import { listVehicles } from "@/api/vehicle";
import { Document } from "@/components/icons/Icons";
import BrandIcons from "@/components/icons/BrandIcons";
import { toastError } from "@/utils/handleError";
import { getDisplayBrand } from "@/utils/repairDisplay";

// numeric: true ให้เทียบกลุ่มตัวเลขตามค่าจริง ทะเบียน 999 จึงมาก่อน 1234
const plateCollator = new Intl.Collator("th", { numeric: true });

const VehicleList = () => {
  const [vehicles, setVehicles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const isInitializing = useRef(false);

  const search = searchParams.get("search");

  // ตัดกันตกบรรทัด — คำค้นอาจยาวเกินได้ถ้าใส่มาทาง URL ตรงๆ
  const searchTerm =
    search && search.length > 20 ? `${search.slice(0, 20)}…` : search;

  useEffect(() => {
    window.scrollTo(0, 0);

    if (isInitializing.current) return;
    isInitializing.current = true;

    const params = new URLSearchParams();
    setSearchParams(params);
    handleFilter(null);

    setTimeout(() => {
      isInitializing.current = false;
    }, 200);
  }, []);

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
    setIsLoading(true);
    try {
      const res = await listVehicles(search);
      setVehicles(sortVehicles(res.data));
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
            <div className="flex flex-1 items-center justify-center">
              <LoaderCircle className="text-primary h-8 w-8 animate-spin" />
            </div>
          ) : vehicles.length === 0 ? (
            <div className="flex flex-1 items-center justify-center">
              <p className="text-subtle-light px-[20px] text-center text-xl text-balance md:text-[22px]">
                {search ? `ไม่พบ "${searchTerm}"` : "ไม่มีประวัติรถ"}
              </p>
            </div>
          ) : (
            vehicles.map((item, index) => (
              <div key={index} className="mt-[16px]">
                <Link to={`/vehicles/${item.id}`}>
                  <CarCard
                    bg="primary"
                    icon={<BrandIcons brand={item.vehicleModel.brand} />}
                    licensePlate={
                      item.licensePlate
                        ? `${item.licensePlate.plateNumber} ${item.licensePlate.province}`
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
