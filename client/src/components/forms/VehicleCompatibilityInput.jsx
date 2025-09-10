import { Label } from "@radix-ui/react-label";
import { useState, useEffect, useRef } from "react";
import { Trash, X } from "lucide-react";
import ComboBox from "../ui/ComboBox";
import { getVehicleBrandModels } from "@/api/vehicleBrandModel";

const VehicleCompatibilityInput = ({ setValue, initialData = null }) => {
  const [vehicles, setVehicles] = useState([{ brand: "", model: "" }]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [vehicleBrandModels, setVehicleBrandModels] = useState([]);
  const [brands, setBrands] = useState([]);
  const vehicleRefs = useRef([]);

  useEffect(() => {
    fetchVehicleBrandModels();
  }, []);

  useEffect(() => {
    if (initialData && Array.isArray(initialData) && !isInitialized) {
      // ถ้ามีข้อมูลเริ่มต้น ให้ตั้งค่า
      setVehicles(initialData);
      setValue("compatibleVehicles", initialData);
      setIsInitialized(true);
    } else if (initialData === null && !isInitialized) {
      // ถ้าไม่มีข้อมูลเริ่มต้น ให้ reset
      setVehicles([{ brand: "", model: "" }]);
      setValue("compatibleVehicles", null);
      setIsInitialized(true);
    }
  }, [setValue, initialData, isInitialized]);

  // Reset เมื่อ initialData เปลี่ยน
  useEffect(() => {
    if (initialData && Array.isArray(initialData)) {
      setVehicles(initialData);
      setValue("compatibleVehicles", initialData);
    } else if (initialData === null) {
      setVehicles([{ brand: "", model: "" }]);
      setValue("compatibleVehicles", null);
    }
  }, [initialData, setValue]);

  const fetchVehicleBrandModels = async () => {
    try {
      const res = await getVehicleBrandModels();
      setVehicleBrandModels(res.data);

      // สร้างรายการ brands ที่ไม่ซ้ำกัน
      const uniqueBrands = [...new Set(res.data.map((item) => item.brand))];
      setBrands(uniqueBrands.map((brand) => ({ id: brand, name: brand })));
    } catch (error) {
      console.error(error);
    }
  };

  const getAvailableModels = (brandName) => {
    if (!brandName || !vehicleBrandModels.length) return [];

    const modelsForBrand = vehicleBrandModels
      .filter((item) => item.brand === brandName)
      .map((item) => ({ id: item.model, name: item.model }));

    return modelsForBrand;
  };

  const updateFormValue = (vehicleList) => {
    const validVehicles = vehicleList
      .filter((v) => v.brand.trim() && v.model.trim())
      .map((v) => ({ brand: v.brand.trim(), model: v.model.trim() }));

    setValue(
      "compatibleVehicles",
      validVehicles.length > 0 ? validVehicles : null
    );
  };

  const handleAddVehicle = () => {
    const newVehicles = [...vehicles, { brand: "", model: "" }];
    setVehicles(newVehicles);

    // เลื่อนไปยังรถคันใหม่หลังจากเพิ่ม
    setTimeout(() => {
      const newIndex = newVehicles.length - 1;
      if (vehicleRefs.current[newIndex]) {
        vehicleRefs.current[newIndex].scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    }, 100);
  };

  const handleClearVehicle = (index) => {
    const newVehicles = vehicles.map((vehicle, i) =>
      i === index ? { brand: "", model: "" } : vehicle
    );
    setVehicles(newVehicles);
    updateFormValue(newVehicles);
  };

  const handleRemoveVehicle = (index) => {
    if (vehicles.length <= 1) return;
    const newVehicles = vehicles.filter((_, i) => i !== index);
    setVehicles(newVehicles);
    updateFormValue(newVehicles);
  };

  const handleUpdateVehicle = (index, field, value) => {
    const newVehicles = vehicles.map((vehicle, i) => {
      if (i === index) {
        if (field === "brand") {
          // ถ้าเปลี่ยนยี่ห้อ ให้ลบรุ่นที่เลือกไว้ออก
          return { brand: value, model: "" };
        } else {
          return { ...vehicle, [field]: value };
        }
      }
      return vehicle;
    });
    setVehicles(newVehicles);
    updateFormValue(newVehicles);
  };

  return (
    <div className="space-y-[16px] px-[20px] pt-[16px]">
      <Label className="font-medium text-[22px] md:text-[24px] text-subtle-dark">
        รถที่เข้ากันได้
      </Label>

      {/* แสดงรายการรถที่เข้ากันได้ */}
      {vehicles.map((vehicle, index) => (
        <div
          key={index}
          ref={(el) => (vehicleRefs.current[index] = el)}
          className="p-[16px] mt-[8px] rounded-[10px] border"
        >
          <div className="flex justify-between items-center mb-[8px]">
            <span className="font-medium text-[20px] md:text-[22px] text-subtle-dark">
              รถคันที่ {index + 1}
            </span>
            <div className="flex">
              {vehicles.length === 1 && (vehicle.brand || vehicle.model) && (
                <button
                  type="button"
                  onClick={() => handleClearVehicle(index)}
                  className="flex items-center font-medium text-[18px] md:text-[20px] text-delete cursor-pointer"
                >
                  <X className="w-4 h-4 mr-[4px]" />
                  ล้างข้อมูล
                </button>
              )}
              {vehicles.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveVehicle(index)}
                  className="flex items-center font-medium text-[18px] md:text-[20px] text-delete cursor-pointer"
                >
                  <Trash className="w-4 h-4 mr-[4px]" />
                  ลบ
                </button>
              )}
            </div>
          </div>
          <div>
            <div>
              <ComboBox
                label="ยี่ห้อ"
                color="text-subtle-dark"
                options={brands}
                value={vehicle.brand}
                onChange={(value) => handleUpdateVehicle(index, "brand", value)}
                placeholder="-- เลือกยี่ห้อรถ --"
                name="brand"
                customClass="text-[18px] md:text-[20px]"
              />
            </div>
            <div className="mt-[12px]">
              <ComboBox
                label="รุ่น"
                color="text-subtle-dark"
                options={getAvailableModels(vehicle.brand)}
                value={vehicle.model}
                onChange={(value) => handleUpdateVehicle(index, "model", value)}
                placeholder="-- เลือกรุ่นรถ --"
                name="model"
                disabled={!vehicle.brand}
                customClass="text-[18px] md:text-[20px]"
              />
            </div>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={handleAddVehicle}
        className="w-full py-2 mb-[16px] rounded-lg border-2 border-dashed border-gray-300 hover:border-primary font-medium text-[18px] md:text-[20px] text-subtle-light hover:text-primary cursor-pointer"
      >
        + เพิ่มรถรุ่นอื่น
      </button>
    </div>
  );
};

export default VehicleCompatibilityInput;
