import { useEffect, useState } from "react";
import { X, Eye, EyeOff } from "lucide-react";
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
import { createEmployee, updateEmployee } from "@/api/employee";

const EmployeeFormDialog = ({
  isOpen,
  onClose,
  editingEmployee = null,
  onSuccess,
}) => {
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm();

  useEffect(() => {
    if (isOpen) {
      if (editingEmployee) {
        reset({
          nickname: editingEmployee.nickname,
          email: editingEmployee.email,
          role: editingEmployee.role,
          fullName: editingEmployee.fullName,
          phoneNumber: editingEmployee.phoneNumber,
          dateOfBirth: editingEmployee.dateOfBirth?.split("T")[0] || "",
        });
      } else {
        reset({});
      }
    }
  }, [isOpen, editingEmployee, reset]);

  const handleAdd = async (data) => {
    try {
      await createEmployee({
        email: data.email,
        password: data.password,
        fullName: data.fullName,
        nickname: data.nickname,
        role: data.role,
        phoneNumber: data.phoneNumber,
        dateOfBirth: data.dateOfBirth || "1990-01-01",
      });
      toast.success("เพิ่มพนักงานสำเร็จ");
      handleClose();
      onSuccess?.();
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.message || "ไม่สามารถเพิ่มพนักงานได้");
    }
  };

  const handleEdit = async (data) => {
    try {
      const updateData = {
        email: data.email,
        fullName: data.fullName,
        nickname: data.nickname,
        role: data.role,
        phoneNumber: data.phoneNumber,
        dateOfBirth: data.dateOfBirth,
      };

      if (data.password && data.password.trim() !== "") {
        updateData.password = data.password;
      }

      await updateEmployee(editingEmployee.id, updateData);
      toast.success("แก้ไขข้อมูลพนักงานสำเร็จ");
      handleClose();
      onSuccess?.();
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.message || "ไม่สามารถแก้ไขข้อมูลพนักงานได้");
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="flex flex-col w-full p-0 max-h-[85vh]" showCloseButton={false}>
        <div className="relative flex-shrink-0 pt-[16px]">
          <DialogTitle className="font-athiti font-semibold text-center text-[22px] md:text-[24px] text-subtle-dark">
            {editingEmployee ? "แก้ไขข้อมูลพนักงาน" : "เพิ่มพนักงานใหม่"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {editingEmployee
              ? `แก้ไขข้อมูลพนักงาน ${editingEmployee.fullName}`
              : "เพิ่มพนักงานใหม่"}
          </DialogDescription>

          <button
            onClick={handleClose}
            autoFocus={false}
            tabIndex={-1}
            aria-label="ปิดหน้าต่าง"
            className="absolute top-[16px] right-[20px] flex items-center justify-center w-[32px] h-[32px] rounded-full bg-black/5"
          >
            <X size={18} className="text-subtle-dark" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 flex flex-col font-athiti px-[20px]">
          <form
            onSubmit={handleSubmit(editingEmployee ? handleEdit : handleAdd)}
            className="space-y-[16px]"
          >
            <div className="grid md:grid-cols-1 gap-[16px]">
              <FormInput
                register={register}
                name="fullName"
                label="ชื่อ-นามสกุล"
                placeholder="กรอกชื่อ และ นามสกุล"
                errors={errors}
                rules={{ required: "กรุณากรอกชื่อ-นามสกุล" }}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-[16px]">
              <FormInput
                register={register}
                name="nickname"
                label="ชื่อผู้ใช้"
                placeholder="กรอกชื่อผู้ใช้"
                errors={errors}
                rules={{ required: "กรุณากรอกชื่อผู้ใช้" }}
              />
              <FormInput
                register={register}
                name="email"
                label="อีเมล"
                type="email"
                placeholder="กรอกอีเมล"
                errors={errors}
                rules={{
                  required: "กรุณากรอกอีเมล",
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: "รูปแบบอีเมลไม่ถูกต้อง",
                  },
                }}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-[16px]">
              <div className="relative">
                <FormInput
                  register={register}
                  name="password"
                  label={editingEmployee ? "รหัสผ่านใหม่ (เว้นว่างไว้หากไม่ต้องการเปลี่ยน)" : "รหัสผ่าน"}
                  type={showPassword ? "text" : "password"}
                  placeholder="กรอกรหัสผ่าน"
                  errors={errors}
                  rules={
                    editingEmployee
                      ? { minLength: { value: 6, message: "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร" } }
                      : { required: "กรุณากรอกรหัสผ่าน", minLength: { value: 6, message: "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร" } }
                  }
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-[38px] text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              <FormInput
                register={register}
                name="dateOfBirth"
                label="วันเกิด"
                type="date"
                errors={errors}
                rules={{ required: "กรุณาเลือกวันเกิด" }}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-[16px]">
              <FormInput
                register={register}
                name="phoneNumber"
                label="เบอร์โทรศัพท์"
                placeholder="กรอกเบอร์โทรศัพท์"
                errors={errors}
                rules={{
                  required: "กรุณากรอกเบอร์โทรศัพท์",
                  pattern: { value: /^[0-9]{10}$/, message: "เบอร์โทรศัพท์ต้องเป็นตัวเลข 10 หลัก" },
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">ตำแหน่งงาน</label>
              <select
                {...register("role", { required: "กรุณาเลือกตำแหน่งงาน" })}
                className="w-full px-3 py-3 border border-gray-300 rounded-[8px] focus:ring-2 focus:ring-primary focus:border-primary"
              >
                <option value="">เลือกตำแหน่งงาน</option>
                <option value="EMPLOYEE">พนักงาน</option>
                <option value="MANAGER">ผู้จัดการ</option>
                <option value="ADMIN">ผู้ดูแลระบบ</option>
              </select>
              {errors.role && <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>}
            </div>

            <div className="flex gap-[12px] mb-[12px]">
              <FormButton
                label={editingEmployee ? "บันทึก" : "เพิ่มพนักงาน"}
                isLoading={isSubmitting}
                onClick={handleSubmit(editingEmployee ? handleEdit : handleAdd)}
                className="flex-1 mx-0"
              />
              <button
                type="button"
                onClick={handleClose}
                className="px-[16px] py-[12px] border border-gray-300 text-gray-700 rounded-[8px] hover:bg-gray-50 transition-colors"
              >
                ยกเลิก
              </button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EmployeeFormDialog;
