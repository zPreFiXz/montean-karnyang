import { Label } from "@radix-ui/react-label";
import { useState, useEffect, useRef } from "react";
import { Plus, Trash, X } from "lucide-react";
import ComboBox from "../ui/ComboBox";
import { getVehicleBrands } from "@/api/vehicleBrand";

const VehicleCompatibilityInput = ({ setValue, initialData = null }) => {
  const [vehicles, setVehicles] = useState([{ brand: "", model: "" }]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [vehicleBrands, setVehicleBrands] = useState([]);
  const [brands, setBrands] = useState([]);
  const vehicleRefs = useRef([]);

  useEffect(() => {
    fetchVehicleBrands();
  }, []);

  useEffect(() => {
    if (initialData && Array.isArray(initialData) && !isInitialized) {
      setVehicles(initialData);
      setValue("compatibleVehicles", initialData);
      setIsInitialized(true);
    } else if (initialData === null && !isInitialized) {
      setVehicles([{ brand: "", model: "" }]);
      setValue("compatibleVehicles", null);
      setIsInitialized(true);
    }
  }, [setValue, initialData, isInitialized]);

  useEffect(() => {
    if (initialData && Array.isArray(initialData)) {
      setVehicles(initialData);
      setValue("compatibleVehicles", initialData);
    } else if (initialData === null) {
      setVehicles([{ brand: "", model: "" }]);
      setValue("compatibleVehicles", null);
    }
  }, [initialData, setValue]);

  const fetchVehicleBrands = async () => {
    try {
      const res = await getVehicleBrands();
      setVehicleBrands(res.data);

      const uniqueBrands = [...new Set(res.data.map((item) => item.brand))];
      setBrands(uniqueBrands.map((brand) => ({ id: brand, name: brand })));
    } catch (error) {
      console.log(error);
    }
  };

  const getAvailableModels = (brandName) => {
    if (!brandName || !vehicleBrands.length) return [];

    const modelsForBrand = vehicleBrands
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
      validVehicles.length > 0 ? validVehicles : null,
    );
  };

  const handleAddVehicle = () => {
    const newVehicles = [...vehicles, { brand: "", model: "" }];
    setVehicles(newVehicles);

    setTimeout(() => {
      const newIndex = newVehicles.length - 1;
      if (vehicleRefs.current[newIndex]) {
        vehicleRefs.current[newIndex].scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    }, 200);
  };

  const handleClearVehicle = (index) => {
    const newVehicles = vehicles.map((vehicle, i) =>
      i === index ? { brand: "", model: "" } : vehicle,
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
      <Label className="text-subtle-dark text-[22px] font-medium md:text-[24px]">
        รถที่รองรับ
      </Label>

      {vehicles.map((vehicle, index) => (
        <div
          key={index}
          ref={(el) => (vehicleRefs.current[index] = el)}
          className="mt-[8px] rounded-[10px] border p-[16px]"
        >
          <div className="mb-[8px] flex items-center justify-between">
            <p className="text-subtle-dark text-[20px] font-medium md:text-[22px]">
              รถคันที่ {index + 1}
            </p>

            <div className="flex">
              {vehicles.length === 1 && (vehicle.brand || vehicle.model) && (
                <button
                  type="button"
                  onClick={() => handleClearVehicle(index)}
                  className="text-destructive flex cursor-pointer items-center text-[18px] font-medium md:text-[20px]"
                >
                  <X className="mr-[4px] h-4 w-4" />
                  ล้างข้อมูล
                </button>
              )}

              {vehicles.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveVehicle(index)}
                  className="text-destructive flex cursor-pointer items-center text-[18px] font-medium md:text-[20px]"
                >
                  <Trash className="mr-[4px] h-4 w-4" />
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
        className="text-subtle-light mb-[16px] flex w-full cursor-pointer items-center justify-center gap-[8px] rounded-lg border-2 border-dashed border-gray-300 py-3 text-[18px] font-medium transition-colors hover:border-gray-400 hover:bg-gray-50 md:text-[20px]"
      >
        <Plus className="h-5 w-5" />
        เพิ่มรถรุ่นอื่น
      </button>
    </div>
  );
};

export default VehicleCompatibilityInput;
