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
import { createEmployeeSchema, editEmployeeSchema } from "@/utils/schemas";
import { createEmployee, updateEmployee } from "@/api/employee";
import { toastError } from "@/utils/handleError";

const EmployeeFormDialog = ({
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
    resolver: zodResolver(
      editingItem ? editEmployeeSchema : createEmployeeSchema,
    ),
    defaultValues: {
      zkUserId: "",
      name: "",
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (editingItem) {
        reset({
          zkUserId: editingItem.zkUserId || "",
          name: editingItem.name || "",
        });
      } else {
        reset({
          zkUserId: "",
          name: "",
        });
      }
    }
  }, [isOpen, editingItem, reset]);

  const handleAdd = async (data) => {
    try {
      await createEmployee({
        zkUserId: data.zkUserId,
        name: data.name,
      });
      toast.success("เพิ่มพนักงานเรียบร้อยแล้ว");
      handleClose();
      onSuccess?.();
    } catch (error) {
      toastError(error);
    }
  };

  const handleEdit = async (data) => {
    try {
      await updateEmployee(editingItem.id, {
        zkUserId: data.zkUserId,
        name: data.name,
      });
      toast.success("แก้ไขข้อมูลพนักงานเรียบร้อยแล้ว");
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
        <div className="relative mt-[16px] flex min-h-[44px] flex-shrink-0 items-center justify-center px-[64px]">
          <DialogTitle className="font-athiti text-subtle-dark text-center text-[22px] font-medium md:text-2xl">
            {editingItem ? "แก้ไขพนักงาน" : "เพิ่มพนักงาน"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {editingItem ? `แก้ไข ${editingItem.name}` : "เพิ่มพนักงาน"}
          </DialogDescription>
          <button
            onClick={handleClose}
            autoFocus={false}
            aria-label="ปิดหน้าต่าง"
            className="absolute top-1/2 right-[20px] flex h-11 w-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-black/5"
          >
            <X size={20} className="text-subtle-dark" />
          </button>
        </div>

        <div className="font-athiti flex flex-1 flex-col overflow-y-auto px-[20px]">
          <form
            onSubmit={handleSubmit(editingItem ? handleEdit : handleAdd)}
            className="space-y-[16px]"
          >
            <div>
              <FormInput
                register={register}
                name="zkUserId"
                label="รหัสพนักงาน (เครื่องสแกน)"
                placeholder="เช่น 1"
                errors={errors}
                customClass="px-0 pb-[16px]"
                color="subtle-dark"
                autoFocus={false}
              />

              <FormInput
                register={register}
                name="name"
                label="ชื่อ"
                placeholder="เช่น ภูมิ"
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
              label={editingItem ? "บันทึก" : "เพิ่มพนักงาน"}
              isLoading={isSubmitting}
              onClick={handleSubmit(editingItem ? handleEdit : handleAdd)}
              className="font-athiti bg-gradient-primary mr-0 ml-0"
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EmployeeFormDialog;
