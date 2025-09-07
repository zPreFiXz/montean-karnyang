import { useEffect } from "react";
import { toast } from "sonner";
import FormButton from "@/components/forms/FormButton";
import FormInput from "@/components/forms/FormInput";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import {
  createVehicleBrandModel,
  updateVehicleBrandModel,
} from "@/api/vehicleBrandModel";

const VehicleBrandFormDialog = ({
  isOpen,
  onClose,
  editingItem = null,
  onSuccess,
}) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm();

  // Reset form เมื่อเปิด dialog หรือเปลี่ยน editingItem
  useEffect(() => {
    if (isOpen) {
      if (editingItem) {
        reset({
          brand: editingItem.brand,
          model: editingItem.model,
        });
      } else {
        reset({ brand: "", model: "" });
      }
    }
  }, [isOpen, editingItem, reset]);

  // เพิ่มยี่ห้อ-รุ่นใหม่
  const handleAddVehicleBrand = async (data) => {
    try {
      await createVehicleBrandModel({
        brand: data.brand,
        model: data.model,
      });
      toast.success("เพิ่มยี่ห้อ-รุ่นรถสำเร็จ");
      handleClose();
      onSuccess?.();
    } catch (error) {
      console.error(error);
      toast.error("เกิดข้อผิดพลาดในการเพิ่มข้อมูล");
    }
  };

  // แก้ไขยี่ห้อ-รุ่น
  const handleEditVehicleBrand = async (data) => {
    try {
      await updateVehicleBrandModel(editingItem.id, {
        brand: data.brand,
        model: data.model,
      });
      toast.success("แก้ไขยี่ห้อ-รุ่นรถสำเร็จ");
      handleClose();
      onSuccess?.();
    } catch (error) {
      console.error(error);
      toast.error("เกิดข้อผิดพลาดในการแก้ไขข้อมูล");
    }
  };

  // ปิด dialog และ reset form
  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-[24px] font-semibold text-text flex items-center gap-[8px]">
            <div className="w-[4px] h-[24px] bg-primary rounded-full"></div>
            {editingItem ? "แก้ไขยี่ห้อ-รุ่นรถ" : "เพิ่มยี่ห้อ-รุ่นรถใหม่"}
          </DialogTitle>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(
            editingItem ? handleEditVehicleBrand : handleAddVehicleBrand
          )}
          className="space-y-[20px] py-[16px]"
        >
          <div className="space-y-[16px]">
            <FormInput
              register={register}
              name="brand"
              label="ยี่ห้อรถ"
              placeholder="เช่น Toyota, Honda"
              errors={errors}
              rules={{ required: "กรุณากรอกยี่ห้อรถ" }}
            />
            <FormInput
              register={register}
              name="model"
              label="รุ่นรถ"
              placeholder="เช่น Camry, Civic"
              errors={errors}
              rules={{ required: "กรุณากรอกรุ่นรถ" }}
            />
          </div>

          <DialogFooter className="gap-[12px] sm:gap-[12px]">
            <button
              type="button"
              onClick={handleClose}
              className="px-[20px] py-[12px] border border-gray-300 text-text-secondary rounded-[8px] hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 font-medium"
            >
              ยกเลิก
            </button>
            <FormButton
              label={editingItem ? "บันทึกการแก้ไข" : "เพิ่มยี่ห้อ-รุ่น"}
              isLoading={isSubmitting}
              type="submit"
              className="px-[20px]"
            />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default VehicleBrandFormDialog;
