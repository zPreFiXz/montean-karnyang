import { useEffect } from "react";
import DialogTitleBar from "@/components/dialogs/DialogTitleBar";
import { toast } from "sonner";
import FormInput from "@/components/forms/FormInput";
import FormButton from "@/components/forms/FormButton";
import ComboBox from "@/components/ui/ComboBox";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { vehicleModelSchema } from "@/utils/schemas";
import { createVehicleModel, updateVehicleModel } from "@/api/vehicleModel";
import { toastError } from "@/utils/handleError";
import { focusTopmostInvalid } from "@/utils/focusInvalidField";

const VehicleModelFormDialog = ({
  isOpen,
  onClose,
  editingItem = null,
  brands = [],
  onSuccess,
}) => {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    shouldFocusError: false,
    resolver: zodResolver(vehicleModelSchema),
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

  const handleAddVehicleModel = async (data) => {
    try {
      await createVehicleModel({
        brand: data.brand,
        model: data.model,
      });
      toast.success("เพิ่มยี่ห้อและรุ่นรถเรียบร้อยแล้ว");
      handleClose();
      onSuccess?.();
    } catch (error) {
      toastError(error);
    }
  };

  const handleEditVehicleModel = async (data) => {
    try {
      await updateVehicleModel(editingItem.id, {
        brand: data.brand,
        model: data.model,
      });
      toast.success("แก้ไขยี่ห้อและรุ่นรถเรียบร้อยแล้ว");
      handleClose();
      onSuccess?.();
    } catch (error) {
      toastError(error);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        className="flex max-h-[90svh] w-full flex-col p-0"
        showCloseButton={false}
        onOpenAutoFocus={(e) => {
          e.preventDefault();
        }}
      >
        <DialogTitleBar
          title={editingItem ? "แก้ไขยี่ห้อและรุ่นรถ" : "เพิ่มยี่ห้อและรุ่นรถ"}
          description={
            editingItem
              ? `แก้ไขยี่ห้อและรุ่นรถ ${editingItem.brand} ${editingItem.model}`
              : "เพิ่มยี่ห้อและรุ่นรถใหม่"
          }
          onClose={handleClose}
        />

        <div className="font-athiti flex flex-1 flex-col overflow-y-auto px-5">
          <form
            onSubmit={handleSubmit(
              editingItem ? handleEditVehicleModel : handleAddVehicleModel,
              focusTopmostInvalid,
            )}
            className="space-y-4"
          >
            <div>
              <div className="pb-4">
                <ComboBox
                  label="ยี่ห้อรถ"
                  color="text-subtle-dark"
                  options={brands.map((brand) => ({ id: brand, name: brand }))}
                  creatable
                  createLabel={(text) => `เพิ่มยี่ห้อ "${text}"`}
                  value={watch("brand")}
                  onChange={(value) =>
                    setValue("brand", value, {
                      shouldValidate: true,
                      shouldTouch: true,
                    })
                  }
                  placeholder="-- เลือกยี่ห้อรถ --"
                  errors={errors}
                  name="brand"
                />
              </div>

              <FormInput
                register={register}
                name="model"
                label="รุ่นรถ"
                placeholder="เช่น Vigo"
                errors={errors}
                customClass="px-0 mb-1"
                color="subtle-dark"
                autoFocus={false}
              />
            </div>
          </form>
        </div>

        <div className="flex-shrink-0 px-5 pb-4">
          <div className="flex gap-4">
            <FormButton
              label={editingItem ? "บันทึก" : "เพิ่มยี่ห้อและรุ่นรถ"}
              isLoading={isSubmitting}
              onClick={handleSubmit(
                editingItem ? handleEditVehicleModel : handleAddVehicleModel,
                focusTopmostInvalid,
              )}
              className="font-athiti bg-gradient-primary mr-0 ml-0"
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VehicleModelFormDialog;
