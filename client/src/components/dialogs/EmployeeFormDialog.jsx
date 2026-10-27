import { useEffect } from "react";
import DialogTitleBar from "@/components/dialogs/DialogTitleBar";
import { toast } from "sonner";
import FormInput from "@/components/forms/FormInput";
import FormButton from "@/components/forms/FormButton";
import { Dialog, DialogContent } from "@/components/ui/dialog";
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
        <DialogTitleBar
          title={editingItem ? "แก้ไขพนักงาน" : "เพิ่มพนักงาน"}
          description={
            editingItem ? `แก้ไข ${editingItem.name}` : "เพิ่มพนักงาน"
          }
          onClose={handleClose}
        />

        <div className="font-athiti flex flex-1 flex-col overflow-y-auto px-5">
          <form
            onSubmit={handleSubmit(editingItem ? handleEdit : handleAdd)}
            className="space-y-4"
          >
            <div>
              <FormInput
                register={register}
                name="zkUserId"
                label="รหัสพนักงาน (เครื่องสแกน)"
                placeholder="เช่น 1"
                errors={errors}
                customClass="px-0 pb-4"
                color="subtle-dark"
                autoFocus={false}
              />

              <FormInput
                register={register}
                name="name"
                label="ชื่อ"
                placeholder="เช่น สมชาย ใจดี"
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
