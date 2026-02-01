import { useEffect, useState, useRef } from "react";
import { Link, useSearchParams } from "react-router";
import { LoaderCircle } from "lucide-react";
import { TIMING } from "@/utils/constants";
import SearchBar from "@/components/forms/SearchBar";
import CarCard from "@/components/cards/CarCard";
import { getVehicles } from "@/api/vehicle";
import { Document } from "@/components/icons/Icons";
import { getBrandIcon } from "@/components/icons/BrandIcons";

const Vehicles = () => {
  const [vehicles, setVehicles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const isInitializing = useRef(false);

  const search = searchParams.get("search");

  useEffect(() => {
    window.scrollTo(0, 0);

    if (isInitializing.current) return;
    isInitializing.current = true;

    const params = new URLSearchParams();
    setSearchParams(params);
    handleFilter(null);

    setTimeout(() => {
      isInitializing.current = false;
    }, TIMING.SCROLL_DELAY);
  }, []);

  useEffect(() => {
    if (isInitializing.current) return;

    if (search) {
      handleFilter(search);
    } else {
      handleFilter(null);
    }
  }, [search]);

  const handleFilter = async (search) => {
    try {
      const res = await getVehicles(search);
      setVehicles(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gradient-primary shadow-primary h-[87px] w-full">
      <div className="flex items-center gap-[8px] pt-[16px] pl-[20px]">
        <div className="bg-surface/20 flex h-[40px] w-[40px] items-center justify-center rounded-full">
          <Document color="#ffffff" />
        </div>
        <div>
          <p className="text-surface text-[24px] font-semibold md:text-[26px]">ประวัติลูกค้า</p>
        </div>
      </div>

      <div className="bg-surface shadow-primary mt-[16px] min-h-[calc(100vh-65px)] w-full rounded-tl-2xl rounded-tr-2xl pb-[112px] xl:pb-[16px]">
        <div className="px-[20px] pt-[16px]">
          {/* แถบค้นหา */}
          <SearchBar placeholder="ค้นหาทะเบียน, จังหวัด, ยี่ห้อ, รุ่นรถ" />

          {/* รายการรถ */}
          {isLoading ? (
            <div className="flex h-[490px] items-center justify-center">
              <LoaderCircle className="text-primary h-8 w-8 animate-spin" />
            </div>
          ) : vehicles.length === 0 ? (
            <div className="flex h-[490px] items-center justify-center">
              <p className="text-subtle-light text-[20px] font-medium md:text-[22px]">
                ไม่พบลูกค้า
              </p>
            </div>
          ) : (
            vehicles.map((item, index) => (
              <div key={index} className="mt-[16px]">
                <Link to={`/vehicles/${item.id}`}>
                  <CarCard
                    bg="primary"
                    color="#1976d2"
                    icon={getBrandIcon(item.vehicleBrandModel.brand, "#1976d2")}
                    licensePlate={
                      item.licensePlate
                        ? `${item.licensePlate.plateNumber} ${item.licensePlate.province}`
                        : "ไม่ระบุทะเบียนรถ"
                    }
                    brand={`${item.vehicleBrandModel.brand} ${item.vehicleBrandModel.model}`}
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
export default Vehicles;
