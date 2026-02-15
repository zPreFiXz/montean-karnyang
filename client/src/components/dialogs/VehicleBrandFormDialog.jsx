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
      toast.error(
        error.response?.data?.message || "เพิ่มยี่ห้อและรุ่นรถไม่สำเร็จ",
      );
    }
  };

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
      toast.error(
        error.response?.data?.message || "แก้ไขยี่ห้อและรุ่นรถไม่สำเร็จ",
      );
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        className="flex w-full flex-col p-0"
        showCloseButton={false}
        onOpenAutoFocus={(e) => {
          e.preventDefault();
        }}
      >
        <div className="relative flex-shrink-0 pt-[16px]">
          <DialogTitle className="font-athiti text-subtle-dark text-center text-[22px] font-semibold md:text-[24px]">
            {editingItem ? "แก้ไขยี่ห้อและรุ่นรถ" : "เพิ่มยี่ห้อและรุ่นรถ"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {editingItem
              ? `แก้ไขยี่ห้อและรุ่นรถ ${editingItem.brand} ${editingItem.model}`
              : "เพิ่มยี่ห้อและรุ่นรถใหม่"}
          </DialogDescription>
          <button
            onClick={handleClose}
            autoFocus={false}
            tabIndex={-1}
            aria-label="ปิดหน้าต่าง"
            className="absolute top-[16px] right-[20px] flex h-[32px] w-[32px] cursor-pointer items-center justify-center rounded-full bg-black/5"
          >
            <X size={18} className="text-subtle-dark" />
          </button>
        </div>
        <div className="font-athiti flex flex-1 flex-col overflow-y-auto px-[20px]">
          <form
            onSubmit={handleSubmit(
              editingItem ? handleEditVehicleBrand : handleAddVehicleBrand,
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
        <div className="flex-shrink-0 px-[16px] pb-[16px]">
          <div className="flex gap-[16px]">
            <FormButton
              label={editingItem ? "บันทึก" : "เพิ่มยี่ห้อและรุ่นรถ"}
              isLoading={isSubmitting}
              onClick={handleSubmit(
                editingItem ? handleEditVehicleBrand : handleAddVehicleBrand,
              )}
              className="font-athiti bg-gradient-primary mr-0 ml-0"
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VehicleBrandFormDialog;
