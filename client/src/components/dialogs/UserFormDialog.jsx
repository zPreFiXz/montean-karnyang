import { useEffect, useState } from "react";
import DialogTitleBar from "@/components/dialogs/DialogTitleBar";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import FormInput from "@/components/forms/FormInput";
import ComboBox from "@/components/ui/ComboBox";
import FormButton from "@/components/forms/FormButton";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createUserAccountSchema,
  editUserAccountSchema,
} from "@/utils/schemas";
import { createUser, updateUser } from "@/api/user";
import { toastError } from "@/utils/handleError";

const UserFormDialog = ({ isOpen, onClose, editingItem = null, onSuccess }) => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] =
    useState(false);
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(
      editingItem ? editUserAccountSchema : createUserAccountSchema,
    ),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      role: "",
    },
  });

  const roleValue = watch("role");

  useEffect(() => {
    if (isOpen) {
      if (editingItem) {
        reset({
          name: editingItem.name || "",
          email: editingItem.email || "",
          password: "",
          confirmPassword: "",
          role: editingItem.role || "",
        });
      } else {
        reset({
          name: "",
          email: "",
          password: "",
          confirmPassword: "",
          role: "",
        });
      }
    }
  }, [isOpen, editingItem, reset]);

  const handleAdd = async (data) => {
    try {
      await createUser({
        email: data.email,
        password: data.password,
        name: data.name,
        role: data.role,
      });
      toast.success("เพิ่มบัญชีผู้ใช้งานเรียบร้อยแล้ว");
      handleClose();
      onSuccess?.();
    } catch (error) {
      toastError(error);
    }
  };

  const handleEdit = async (data) => {
    try {
      const updateData = {
        email: data.email,
        name: data.name,
        role: data.role,
      };

      if (data.password && data.password.trim() !== "") {
        updateData.password = data.password;
      }

      await updateUser(editingItem.id, updateData);
      toast.success("แก้ไขบัญชีผู้ใช้งานเรียบร้อยแล้ว");
      handleClose();
      onSuccess?.();
    } catch (error) {
      toastError(error);
    }
  };

  const handleClose = () => {
    reset();
    setIsPasswordVisible(false);
    setIsConfirmPasswordVisible(false);
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
          title={editingItem ? "แก้ไขบัญชีผู้ใช้งาน" : "เพิ่มบัญชีผู้ใช้งาน"}
          description={
            editingItem ? `แก้ไข ${editingItem.name}` : "เพิ่มบัญชีผู้ใช้งาน"
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
                name="name"
                label="ชื่อ"
                placeholder="เช่น ภูมิ"
                errors={errors}
                customClass="px-0 pb-4"
                color="subtle-dark"
                autoFocus={false}
              />

              <FormInput
                register={register}
                name="email"
                label="อีเมล"
                type="email"
                placeholder="name@example.com"
                errors={errors}
                customClass="px-0 pb-4"
                color="subtle-dark"
                readOnly={Boolean(editingItem)}
                inputMode={editingItem ? "none" : "email"}
                disabled={Boolean(editingItem)}
                autoFocus={false}
              />

              <FormInput
                register={register}
                name="password"
                label={editingItem ? "รหัสผ่านใหม่" : "รหัสผ่าน"}
                type={isPasswordVisible ? "text" : "password"}
                placeholder="••••••••"
                errors={errors}
                customClass="px-0 pb-4"
                color="subtle-dark"
                rightSlot={
                  <button
                    type="button"
                    onClick={() => setIsPasswordVisible((v) => !v)}
                    className="text-subtle-light mt-2 cursor-pointer hover:text-gray-600"
                    aria-label={
                      isPasswordVisible ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"
                    }
                  >
                    {isPasswordVisible ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                }
                autoFocus={false}
              />

              <FormInput
                register={register}
                name="confirmPassword"
                label="ยืนยันรหัสผ่าน"
                type={isConfirmPasswordVisible ? "text" : "password"}
                placeholder="••••••••"
                errors={errors}
                customClass="px-0 mb-1"
                color="subtle-dark"
                rightSlot={
                  <button
                    type="button"
                    onClick={() => setIsConfirmPasswordVisible((v) => !v)}
                    className="text-subtle-light mt-2 cursor-pointer hover:text-gray-600"
                    aria-label={
                      isConfirmPasswordVisible ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"
                    }
                  >
                    {isConfirmPasswordVisible ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                }
                autoFocus={false}
              />

              <div className="mb-1 px-0">
                <ComboBox
                  label="บทบาท"
                  color="text-subtle-dark"
                  options={[
                    { id: "ADMIN", name: "แอดมิน" },
                    { id: "EMPLOYEE", name: "พนักงาน" },
                  ]}
                  value={roleValue || ""}
                  onChange={(val) =>
                    setValue("role", val, { shouldValidate: true })
                  }
                  placeholder="-- เลือกบทบาท --"
                  errors={errors}
                  name="role"
                />
                <input
                  type="hidden"
                  value={roleValue || ""}
                  {...register("role", { required: "กรุณาเลือบทบาท" })}
                />
              </div>
            </div>
          </form>
        </div>

        <div className="flex-shrink-0 px-4 pb-4">
          <div className="flex gap-4">
            <FormButton
              label={editingItem ? "บันทึก" : "เพิ่มบัญชีผู้ใช้งาน"}
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

export default UserFormDialog;
