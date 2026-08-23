import { useState, useEffect } from "react";
import {
  ChevronLeft,
  ChevronUp,
  ChevronDown,
  Edit,
  Trash2,
  LoaderCircle,
} from "lucide-react";
import { Link } from "react-router";
import { toast } from "sonner";
import ComboBox from "@/components/ui/ComboBox";
import VehicleModelFormDialog from "@/components/dialogs/VehicleModelFormDialog";
import ConfirmDialog from "@/components/dialogs/ConfirmDialog";
import {
  deleteVehicleModel,
  listVehicleModels,
  reorderVehicleModels,
} from "@/api/vehicleModel";
import FormButton from "@/components/forms/FormButton";
import { toastError } from "@/utils/handleError";
import { withOtherBrandLast } from "@/utils/vehicleBrand";
import { withViewTransition } from "@/utils/viewTransition";

const VehicleModelList = () => {
  const [vehicleModels, setVehicleModels] = useState([]);
  const [selectedBrand, setSelectedBrand] = useState("");
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingItem, setDeletingItem] = useState(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchVehicleModels();
  }, []);

  const fetchVehicleModels = async () => {
    setIsLoading(true);
    try {
      const res = await listVehicleModels();
      setVehicleModels(res.data);
    } catch (error) {
      toastError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteVehicleModel = async (id) => {
    try {
      await deleteVehicleModel(id);
      // ลบรุ่นสุดท้ายของยี่ห้อที่กรองอยู่ = ยี่ห้อนั้นหายไปจากตัวเลือก ต้องคืนค่าเป็นทั้งหมด
      const isLastOfBrand =
        vehicleModels.filter((item) => item.brand === selectedBrand).length ===
        1;
      if (selectedBrand && isLastOfBrand) setSelectedBrand("");
      fetchVehicleModels();
      setIsDeleteDialogOpen(false);
      setDeletingItem(null);
      toast.success("ลบยี่ห้อและรุ่นรถเรียบร้อยแล้ว");
    } catch (error) {
      toastError(error);
    }
  };

  const handleDeleteClick = (item) => {
    setDeletingItem(item);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (deletingItem) {
      return handleDeleteVehicleModel(deletingItem.id);
    }
  };

  const handleDeleteCancel = () => {
    setIsDeleteDialogOpen(false);
    setDeletingItem(null);
  };

  const handleEditClick = (item) => {
    setEditingItem(item);
    setIsFormDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsFormDialogOpen(false);
    setEditingItem(null);
  };

  const uniqueBrands = withOtherBrandLast([
    ...new Set(vehicleModels.map((item) => item.brand)),
  ]);
  const brandOptions = [
    { id: "", name: "ทั้งหมด" },
    ...uniqueBrands.map((brand) => ({ id: brand, name: brand })),
  ];

  const filteredVehicleModels = selectedBrand
    ? vehicleModels.filter((item) => item.brand === selectedBrand)
    : vehicleModels;

  const groupedByBrand = {};
  filteredVehicleModels.forEach((item) => {
    if (!groupedByBrand[item.brand]) {
      groupedByBrand[item.brand] = [];
    }
    groupedByBrand[item.brand].push(item);
  });

  // ไม่เรียงใหม่ — เซิร์ฟเวอร์ส่งมาตาม sortOrder ที่จัดไว้แล้ว
  // (ยี่ห้อเรียงตามลำดับที่เจอครั้งแรกในลิสต์ จึงเป็นลำดับเดียวกัน)

  // ชื่อยี่ห้อเป็นภาษาไทย ใช้เป็นตัวระบุของ view transition ไม่ได้ จึงอ้างด้วย id ที่น้อยที่สุดในกลุ่ม
  // ซึ่งไม่เปลี่ยนตามการสลับลำดับรุ่น ต่างจากการหยิบ id ของรุ่นแรกมาใช้
  const brandTransitionName = (models) =>
    `brand-${Math.min(...models.map((item) => item.id))}`;

  // ย้ายรุ่นขึ้น-ลงภายในยี่ห้อเดียวกัน แล้วส่งลำดับทั้งชุดกลับไปบันทึก
  const moveModel = (brand, index, direction) => {
    const models = groupedByBrand[brand];
    const target = index + direction;
    if (target < 0 || target >= models.length) return;

    const reordered = [...models];
    [reordered[index], reordered[target]] = [
      reordered[target],
      reordered[index],
    ];

    const next = vehicleModels.map((item) =>
      item.brand === brand
        ? reordered[models.findIndex((m) => m.id === item.id)]
        : item,
    );
    saveOrder(next);
  };

  // ย้ายทั้งยี่ห้อ = ย้ายรุ่นทั้งก้อนไปพร้อมกัน
  const moveBrand = (brand, direction) => {
    const brands = Object.keys(groupedByBrand);
    const index = brands.indexOf(brand);
    const target = index + direction;
    if (target < 0 || target >= brands.length) return;

    const reordered = [...brands];
    [reordered[index], reordered[target]] = [
      reordered[target],
      reordered[index],
    ];

    const next = reordered.flatMap((b) => groupedByBrand[b]);
    saveOrder(next);
  };

  const saveOrder = async (orderedModels) => {
    // อัปเดตหน้าจอทันทีไม่ต้องรอเซิร์ฟเวอร์ ไม่งั้นกดเลื่อนรัวๆ จะกระตุก
    withViewTransition(() => setVehicleModels(orderedModels));
    try {
      await reorderVehicleModels(orderedModels.map((item) => item.id));
    } catch (error) {
      toastError(error);
      fetchVehicleModels();
    }
  };

  return (
    <div className="bg-gradient-primary shadow-primary flex min-h-svh w-full flex-col">
      <div className="flex items-center gap-[8px] px-[20px] pt-[16px]">
        <Link
          to="/dashboard"
          aria-label="ย้อนกลับ"
          className="bg-surface/20 flex h-[40px] w-[40px] shrink-0 cursor-pointer items-center justify-center rounded-full"
        >
          <ChevronLeft className="text-surface" />
        </Link>
        <p className="text-surface text-2xl font-semibold md:text-[26px]">
          จัดการยี่ห้อและรุ่นรถ
        </p>
      </div>
      <div className="bg-surface shadow-primary mt-[16px] flex w-full flex-1 flex-col rounded-tl-2xl rounded-tr-2xl pb-[112px] xl:pb-[16px]">
        {isLoading ? (
          <div className="flex flex-1 items-center justify-center">
            <LoaderCircle className="text-primary h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="flex flex-1 flex-col px-[20px] pt-[16px]">
            <ComboBox
              label="ยี่ห้อรถ"
              color="text-subtle-dark"
              options={brandOptions}
              value={selectedBrand}
              onChange={setSelectedBrand}
            />

            <FormButton
              label="+ เพิ่มยี่ห้อและรุ่นรถ"
              onClick={() => setIsFormDialogOpen(true)}
              className="bg-gradient-primary my-[16px] ml-0"
            />

            <VehicleModelFormDialog
              isOpen={isFormDialogOpen}
              onClose={handleCloseDialog}
              editingItem={editingItem}
              onSuccess={fetchVehicleModels}
            />

            <ConfirmDialog
              isOpen={isDeleteDialogOpen}
              onClose={handleDeleteCancel}
              onConfirm={handleDeleteConfirm}
              title="ยืนยันการลบยี่ห้อและรุ่นรถ"
              itemName={
                deletingItem?.brand !== "อื่นๆ"
                  ? `${deletingItem?.brand} ${deletingItem?.model}`
                  : deletingItem?.model || ""
              }
            />

            <div className="space-y-[16px]">
              {Object.entries(groupedByBrand).map(
                ([brand, models], brandIndex, brandList) => (
                  <div
                    key={brand}
                    style={{ viewTransitionName: brandTransitionName(models) }}
                    className="bg-surface shadow-primary rounded-[10px] p-[16px]"
                  >
                    <div className="mb-[16px] flex items-center justify-between gap-[8px] border-b border-gray-100 pb-[16px]">
                      <p className="text-primary text-xl font-semibold md:text-[22px]">
                        {brand}
                      </p>
                      {/* เลื่อนยี่ห้อ = ย้ายรุ่นทั้งก้อนไปพร้อมกัน */}
                      {!selectedBrand && brandList.length > 1 && (
                        <div className="flex shrink-0 gap-[4px]">
                          <button
                            type="button"
                            onClick={() => moveBrand(brand, -1)}
                            disabled={brandIndex === 0}
                            aria-label={`เลื่อน ${brand} ขึ้น`}
                            className="text-subtle-dark flex h-[32px] w-[32px] cursor-pointer items-center justify-center rounded-[8px] border border-gray-200 bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <ChevronUp className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveBrand(brand, 1)}
                            disabled={brandIndex === brandList.length - 1}
                            aria-label={`เลื่อน ${brand} ลง`}
                            className="text-subtle-dark flex h-[32px] w-[32px] cursor-pointer items-center justify-center rounded-[8px] border border-gray-200 bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <ChevronDown className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="space-y-[8px]">
                      {models.map((item, modelIndex) => (
                        <div
                          key={item.id}
                          style={{ viewTransitionName: `model-${item.id}` }}
                          className="flex items-center justify-between gap-[12px] rounded-[8px] bg-gray-50 p-[8px]"
                        >
                          <div className="flex min-w-0 items-center gap-[12px]">
                            {models.length > 1 && (
                              <div className="flex shrink-0 gap-[4px]">
                                <button
                                  type="button"
                                  onClick={() =>
                                    moveModel(brand, modelIndex, -1)
                                  }
                                  disabled={modelIndex === 0}
                                  aria-label={`เลื่อน ${item.model} ขึ้น`}
                                  className="text-subtle-dark bg-surface flex h-[28px] w-[28px] cursor-pointer items-center justify-center rounded-[8px] border border-gray-200 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                  <ChevronUp className="h-4 w-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    moveModel(brand, modelIndex, 1)
                                  }
                                  disabled={modelIndex === models.length - 1}
                                  aria-label={`เลื่อน ${item.model} ลง`}
                                  className="text-subtle-dark bg-surface flex h-[28px] w-[28px] cursor-pointer items-center justify-center rounded-[8px] border border-gray-200 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                  <ChevronDown className="h-4 w-4" />
                                </button>
                              </div>
                            )}
                            <p className="text-normal truncate text-lg font-medium md:text-xl">
                              {item.model}
                            </p>
                          </div>
                          <div className="flex shrink-0 gap-[8px]">
                            <button
                              onClick={() => handleEditClick(item)}
                              aria-label="แก้ไขรุ่นรถ"
                              className="text-surface bg-gradient-primary flex h-[36px] w-[36px] shrink-0 cursor-pointer items-center justify-center rounded-[10px]"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteClick(item)}
                              aria-label="ลบรุ่นรถ"
                              className="text-surface bg-destructive flex h-[36px] w-[36px] shrink-0 cursor-pointer items-center justify-center rounded-[10px]"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ),
              )}
            </div>

            {filteredVehicleModels.length === 0 && (
              <div className="flex flex-1 items-center justify-center">
                <p className="text-subtle-light text-center text-xl text-balance md:text-[22px]">
                  ไม่มียี่ห้อและรุ่นรถ
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default VehicleModelList;
