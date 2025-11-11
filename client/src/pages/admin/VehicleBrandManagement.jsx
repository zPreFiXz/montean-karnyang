import { useState, useEffect } from "react";
import { ChevronLeft, Edit, Trash2, LoaderCircle } from "lucide-react";
import { Link } from "react-router";

import { toast } from "sonner";
import ComboBox from "@/components/ui/ComboBox";
import VehicleBrandFormDialog from "@/components/dialogs/VehicleBrandFormDialog";
import DeleteConfirmDialog from "@/components/dialogs/DeleteConfirmDialog";
import {
  deleteVehicleBrandModel,
  getVehicleBrandModels,
} from "@/api/vehicleBrandModel";
import FormButton from "@/components/forms/FormButton";

const VehicleBrandManagement = () => {
  const [vehicleBrands, setVehicleBrands] = useState([]);
  const [selectedBrand, setSelectedBrand] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingItem, setDeletingItem] = useState(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchVehicleBrandModels();
  }, []);

  const fetchVehicleBrandModels = async () => {
    try {
      const res = await getVehicleBrandModels();
      setVehicleBrands(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteVehicleBrand = async (id) => {
    try {
      await deleteVehicleBrandModel(id);
      fetchVehicleBrandModels();
      setShowDeleteDialog(false);
      setDeletingItem(null);
      toast.success("ลบยี่ห้อและรุ่นรถเรียบร้อยแล้ว");
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message);
    }
  };

  const confirmDelete = (item) => {
    setDeletingItem(item);
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = () => {
    if (deletingItem) {
      return handleDeleteVehicleBrand(deletingItem.id);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteDialog(false);
    setDeletingItem(null);
  };

  const startEdit = (item) => {
    setEditingItem(item);
    setShowAddForm(true);
  };

  const handleCloseDialog = () => {
    setShowAddForm(false);
    setEditingItem(null);
  };

  // สร้าง options และกรองข้อมูล
  const uniqueBrands = [...new Set(vehicleBrands.map((item) => item.brand))];
  const brandOptions = [
    { id: "", name: "ทั้งหมด" },
    ...uniqueBrands.map((brand) => ({ id: brand, name: brand })),
  ];

  const filteredVehicleBrands = selectedBrand
    ? vehicleBrands.filter((item) => item.brand === selectedBrand)
    : vehicleBrands;

  const groupedByBrand = {};
  filteredVehicleBrands.forEach((item) => {
    if (!groupedByBrand[item.brand]) {
      groupedByBrand[item.brand] = [];
    }
    groupedByBrand[item.brand].push(item);
  });

  // เรียงลำดับตาม id ในฐานข้อมูล
  Object.keys(groupedByBrand).forEach((brand) => {
    groupedByBrand[brand].sort((a, b) => a.id - b.id);
  });

  return (
    <div className="w-full h-[84px] bg-gradient-primary shadow-primary">
      <div className="flex items-center gap-[8px] px-[20px] pt-[16px]">
        <Link to="/dashboard" className="mt-[2px] text-surface">
          <ChevronLeft />
        </Link>
        <p className="font-semibold text-[24px] md:text-[26px] text-surface">
          จัดการยี่ห้อและรุ่นรถ
        </p>
      </div>

      <div className="w-full h-[calc(100vh-68px)] mt-[16px] rounded-tl-2xl rounded-tr-2xl bg-surface shadow-primary">
        {isLoading ? (
          <div className="flex justify-center items-center h-[502px]">
            <LoaderCircle className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="px-[20px] py-[16px] pb-[112px]">
            <ComboBox
              label="ยี่ห้อ"
              color="text-subtle-dark"
              options={brandOptions}
              value={selectedBrand}
              onChange={setSelectedBrand}
            />
            <FormButton
              label="+ เพิ่มยี่ห้อและรุ่นรถ"
              onClick={() => setShowAddForm(true)}
              className="my-[16px] ml-0 bg-gradient-primary"
            />

            {/* Dialog */}
            <VehicleBrandFormDialog
              isOpen={showAddForm}
              onClose={handleCloseDialog}
              editingItem={editingItem}
              onSuccess={fetchVehicleBrandModels}
            />

            {/* Delete Confirmation Dialog */}
            <DeleteConfirmDialog
              isOpen={showDeleteDialog}
              onClose={handleDeleteCancel}
              onConfirm={handleDeleteConfirm}
              title="ยืนยันการลบยี่ห้อและรุ่นรถ"
              message="คุณแน่ใจหรือไม่ว่าต้องการลบยี่ห้อและรุ่นรถนี้?"
              itemName={
                deletingItem?.brand !== "อื่นๆ"
                  ? `${deletingItem?.brand} ${deletingItem?.model}`
                  : deletingItem?.model || ""
              }
            />

            <div className="space-y-[16px]">
              {Object.entries(groupedByBrand).map(([brand, models]) => (
                <div
                  key={brand}
                  className="p-[16px] rounded-[10px] bg-surface shadow-primary"
                >
                  <div className="flex items-center gap-[8px] pb-[16px] mb-[16px] border-b border-gray-100">
                    <p className="font-semibold text-[20px] md:text-[22px] text-primary">
                      {brand}
                    </p>
                  </div>

                  {/* รายการยี่ห้อและรุ่นรถ */}
                  <div className="space-y-[8px]">
                    {models.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-[8px] rounded-[8px] bg-gray-50"
                      >
                        <p className="font-medium text-[18px] md:text-[20px] text-normal">
                          {item.model}
                        </p>
                        <div className="flex gap-[8px]">
                          <button
                            onClick={() => startEdit(item)}
                            className="flex items-center gap-[4px] px-[12px] py-[6px] rounded-[10px] font-medium text-[14px] text-surface bg-gradient-primary cursor-pointer"
                          >
                            <Edit className="w-[14px] h-[14px]" />
                            <p className="font-semibold">แก้ไข</p>
                          </button>
                          <button
                            onClick={() => confirmDelete(item)}
                            className="flex items-center gap-[4px] px-[12px] py-[6px] rounded-[10px] font-medium text-[14px] text-surface bg-delete cursor-pointer"
                          >
                            <Trash2 className="w-[14px] h-[14px]" />
                            <p className="font-semibold">ลบ</p>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VehicleBrandManagement;
