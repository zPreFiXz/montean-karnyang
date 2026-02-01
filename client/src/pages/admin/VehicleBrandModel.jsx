import { useState, useEffect } from "react";
import { ChevronLeft, Edit, Trash2, LoaderCircle } from "lucide-react";
import { Link } from "react-router";

import { toast } from "sonner";
import ComboBox from "@/components/ui/ComboBox";
import VehicleBrandFormDialog from "@/components/dialogs/VehicleBrandFormDialog";
import DeleteConfirmDialog from "@/components/dialogs/DeleteConfirmDialog";
import { deleteVehicleBrandModel, getVehicleBrandModels } from "@/api/vehicleBrandModel";
import FormButton from "@/components/forms/FormButton";

const VehicleBrandModel = () => {
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

  const handledeleteVehicleBrandModel = async (id) => {
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
      return handledeleteVehicleBrandModel(deletingItem.id);
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
    <div className="bg-gradient-primary shadow-primary h-[87px] w-full">
      <div className="flex items-center gap-[8px] px-[20px] pt-[16px]">
        <Link to="/dashboard" className="text-surface mt-[2px]">
          <ChevronLeft />
        </Link>
        <p className="text-surface text-[24px] font-semibold md:text-[26px]">
          จัดการยี่ห้อและรุ่นรถ
        </p>
      </div>

      <div className="bg-surface shadow-primary mt-[16px] min-h-[calc(100vh-65px)] w-full rounded-tl-2xl rounded-tr-2xl pb-[112px] xl:pb-[16px]">
        {isLoading ? (
          <div className="flex h-[502px] items-center justify-center">
            <LoaderCircle className="text-primary h-8 w-8 animate-spin" />
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
              className="bg-gradient-primary my-[16px] ml-0"
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
              title="ยืนยันการลบ"
              message="ต้องการลบยี่ห้อและรุ่นรถนี้หรือไม่?"
              itemName={
                deletingItem?.brand !== "อื่นๆ"
                  ? `${deletingItem?.brand} ${deletingItem?.model}`
                  : deletingItem?.model || ""
              }
            />

            <div className="space-y-[16px]">
              {Object.entries(groupedByBrand).map(([brand, models]) => (
                <div key={brand} className="bg-surface shadow-primary rounded-[10px] p-[16px]">
                  <div className="mb-[16px] flex items-center gap-[8px] border-b border-gray-100 pb-[16px]">
                    <p className="text-primary text-[20px] font-semibold md:text-[22px]">{brand}</p>
                  </div>

                  {/* รายการยี่ห้อและรุ่นรถ */}
                  <div className="space-y-[8px]">
                    {models.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between rounded-[8px] bg-gray-50 p-[8px]"
                      >
                        <p className="text-normal text-[18px] font-medium md:text-[20px]">
                          {item.model}
                        </p>
                        <div className="flex gap-[8px]">
                          <button
                            onClick={() => startEdit(item)}
                            className="text-surface bg-gradient-primary flex cursor-pointer items-center gap-[4px] rounded-[10px] px-[12px] py-[6px] text-[14px] font-medium"
                          >
                            <Edit className="h-[14px] w-[14px]" />
                            <p className="font-semibold">แก้ไข</p>
                          </button>
                          <button
                            onClick={() => confirmDelete(item)}
                            className="text-surface bg-delete flex cursor-pointer items-center gap-[4px] rounded-[10px] px-[12px] py-[6px] text-[14px] font-medium"
                          >
                            <Trash2 className="h-[14px] w-[14px]" />
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

export default VehicleBrandModel;
