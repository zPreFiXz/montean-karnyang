import { useEffect } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import FormInput from "@/components/forms/FormInput";
import FormButton from "@/components/forms/FormButton";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { vehicleBrandModelSchema } from "@/utils/schemas";
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
  } = useForm({
    resolver: zodResolver(vehicleBrandModelSchema),
    defaultValues: { brand: "", model: "" },
  });

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

  // เพิ่มยี่ห้อ-รุ่น
  const handleAddVehicleBrand = async (data) => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      await createVehicleBrandModel({
        brand: data.brand,
        model: data.model,
      });
      toast.success("เพิ่มยี่ห้อและรุ่นรถเรียบร้อยแล้ว");
      handleClose();
      onSuccess?.();
    } catch (error) {
      console.error(error);

      const errorMessage = error.response?.data?.message;
      toast.error(errorMessage);
    }
  };

  // แก้ไขยี่ห้อ-รุ่น
  const handleEditVehicleBrand = async (data) => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      await updateVehicleBrandModel(editingItem.id, {
        brand: data.brand,
        model: data.model,
      });
      toast.success("แก้ไขยี่ห้อและรุ่นรถเรียบร้อยแล้ว");
      handleClose();
      onSuccess?.();
    } catch (error) {
      console.error(error);

      const errorMessage = error.response?.data?.message;
      toast.error(errorMessage);
    }
  };

  // ปิด dialog และ reset form
  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        className="flex flex-col w-full p-0"
        showCloseButton={false}
        onOpenAutoFocus={(e) => {
          // ป้องกันการโฟกัสอัตโนมัติที่ input เมื่อเปิด dialog เพื่อลดการเด้งแป้นพิมพ์ในมือถือ
          e.preventDefault();
        }}
      >
        <div className="relative flex-shrink-0 pt-[16px]">
          <DialogTitle className="font-athiti font-semibold text-center text-[22px] md:text-[24px] text-subtle-dark">
            {editingItem ? "แก้ไขยี่ห้อ-รุ่นรถ" : "เพิ่มยี่ห้อ-รุ่นรถ"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {editingItem
              ? `แก้ไขยี่ห้อ-รุ่นรถ ${editingItem.brand} ${editingItem.model}`
              : "เพิ่มยี่ห้อ-รุ่นรถใหม่"}
          </DialogDescription>

          <button
            onClick={handleClose}
            autoFocus
            tabIndex={-1}
            aria-label="ปิดหน้าต่าง"
            className="absolute top-[16px] right-[20px] flex items-center justify-center w-[32px] h-[32px] rounded-full bg-black/5"
          >
            <X size={18} className="text-subtle-dark" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 flex flex-col font-athiti px-[20px]">
          <form
            onSubmit={handleSubmit(
              editingItem ? handleEditVehicleBrand : handleAddVehicleBrand
            )}
            className="space-y-[16px]"
          >
            <div>
              <FormInput
                register={register}
                name="brand"
                label="ยี่ห้อรถ"
                placeholder="เช่น Toyota, Honda"
                errors={errors}
                customClass="px-0 pb-[16px]"
                color="subtle-dark"
                autoFocus={false}
              />
              <FormInput
                register={register}
                name="model"
                label="รุ่นรถ"
                placeholder="เช่น Revo, Brio"
                errors={errors}
                customClass="px-0 mb-[4px]"
                color="subtle-dark"
                autoFocus={false}
              />
            </div>
          </form>
        </div>

        {/* ส่วนท้าย */}
        <div className="flex-shrink-0 px-[16px] pb-[16px]">
          <div className="flex gap-[16px]">
            <FormButton
              label={editingItem ? "บันทึก" : "เพิ่มยี่ห้อ-รุ่นรถ"}
              isLoading={isSubmitting}
              onClick={handleSubmit(
                editingItem ? handleEditVehicleBrand : handleAddVehicleBrand
              )}
              className="ml-0 mr-0 font-athiti bg-gradient-primary"
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VehicleBrandFormDialog;
