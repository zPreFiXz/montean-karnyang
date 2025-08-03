import { useState, useEffect } from "react";

const VehicleCompatibilityInput = ({ setValue }) => {
  const [vehicles, setVehicles] = useState([{ brand: "", model: "" }]);

  useEffect(() => {
    setValue("compatibleVehicles", null);
  }, [setValue]);

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
    setVehicles([...vehicles, { brand: "", model: "" }]);
  };

  const handleRemoveVehicle = (index) => {
    if (vehicles.length <= 1) return;
    const newVehicles = vehicles.filter((_, i) => i !== index);
    setVehicles(newVehicles);
    updateFormValue(newVehicles);
  };

  const handleUpdateVehicle = (index, field, value) => {
    const newVehicles = vehicles.map((vehicle, i) =>
      i === index ? { ...vehicle, [field]: value } : vehicle
    );
    setVehicles(newVehicles);
    updateFormValue(newVehicles);
  };

  return (
    <div className="space-y-4">
      {vehicles.map((vehicle, index) => (
        <div
          key={index}
          className="border border-gray-200 rounded-lg p-4 bg-gray-50"
        >
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm font-medium text-gray-600">
              รถคันที่ {index + 1}
            </span>
            {vehicles.length > 1 && (
              <button
                type="button"
                onClick={() => handleRemoveVehicle(index)}
                className="text-red-500 hover:text-red-700 text-sm"
              >
                ลบ
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                ยี่ห้อ
              </label>
              <input
                type="text"
                value={vehicle.brand}
                onChange={(e) =>
                  handleUpdateVehicle(index, "brand", e.target.value)
                }
                placeholder="เช่น Toyota"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                รุ่น
              </label>
              <input
                type="text"
                value={vehicle.model}
                onChange={(e) =>
                  handleUpdateVehicle(index, "model", e.target.value)
                }
                placeholder="เช่น Vios"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={handleAddVehicle}
        className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors"
      >
        + เพิ่มรถรุ่นอื่น
      </button>
    </div>
  );
};

export default VehicleCompatibilityInput;
