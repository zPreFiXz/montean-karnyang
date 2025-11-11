import { useEffect, useState } from "react";
import { X, Eye, EyeOff, Calendar, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import FormInput from "@/components/forms/FormInput";
import ComboBox from "@/components/ui/ComboBox";
import FormButton from "@/components/forms/FormButton";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { employeeCreateSchema, employeeEditSchema } from "@/utils/schemas";
import { createEmployee, updateEmployee } from "@/api/employee";
import { cn } from "@/lib/utils";

// ฟังก์ชันจัดรูปแบบวันที่เป็นภาษาไทย
const formatDateThai = (date) => {
  const thaiMonths = [
    "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
    "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
  ];
  
  const d = new Date(date);
  const day = d.getDate();
  const month = thaiMonths[d.getMonth()];
  const year = d.getFullYear();
  
  return `${day} ${month} ${year}`;
};

// ฟังก์ชันจัดรูปแบบวันที่เป็น yyyy-MM-dd
const formatDateISO = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};

const EmployeeFormDialog = ({
  isOpen,
  onClose,
  editingItem = null,
  onSuccess,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    control,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(editingItem ? employeeEditSchema : employeeCreateSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      nickname: "",
      email: "",
      password: "",
      confirmPassword: "",
      dateOfBirth: "",
      phoneNumber: "",
      role: "",
    },
  });

  const roleValue = watch("role");

  useEffect(() => {
    if (isOpen) {
      if (editingItem) {
        const nameParts = editingItem.fullName?.split(" ") || ["", ""];
        const firstName = nameParts[0] || "";
        const lastName = nameParts.slice(1).join(" ") || "";
        reset({
          firstName,
          lastName,
          nickname: editingItem.nickname || "",
          email: editingItem.email || "",
          password: "",
          confirmPassword: "",
          dateOfBirth: editingItem.dateOfBirth
            ? String(editingItem.dateOfBirth).split("T")[0]
            : "",
          phoneNumber: editingItem.phoneNumber || "",
          role: editingItem.role || "",
        });
      } else {
        reset({
          firstName: "",
          lastName: "",
          nickname: "",
          email: "",
          password: "",
          confirmPassword: "",
          dateOfBirth: "",
          phoneNumber: "",
          role: "",
        });
      }
    }
  }, [isOpen, editingItem, reset]);

  const handleAdd = async (data) => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      await createEmployee({
        email: data.email,
        password: data.password,
        fullName: `${data.firstName} ${data.lastName}`,
        nickname: data.nickname,
        role: data.role,
        phoneNumber: data.phoneNumber,
        dateOfBirth: data.dateOfBirth,
      });
      toast.success("เพิ่มพนักงานเรียบร้อยแล้ว");
      handleClose();
      onSuccess?.();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message);
    }
  };

  const handleEdit = async (data) => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const updateData = {
        email: data.email,
        fullName: `${data.firstName} ${data.lastName}`,
        nickname: data.nickname,
        role: data.role,
        phoneNumber: data.phoneNumber,
        dateOfBirth: data.dateOfBirth,
      };

      if (data.password && data.password.trim() !== "") {
        updateData.password = data.password;
      }

      await updateEmployee(editingItem.id, updateData);
      toast.success("แก้ไขข้อมูลพนักงานเรียบร้อยแล้ว");
      handleClose();
      onSuccess?.();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message);
    }
  };

  const handleClose = () => {
    reset();
    setShowPassword(false);
    setShowConfirmPassword(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        className="flex flex-col w-full h-[90vh] max-h-[650px] p-0"
        showCloseButton={false}
        onOpenAutoFocus={(e) => {
          // ป้องกันการโฟกัสอัตโนมัติที่ input เมื่อเปิด dialog เพื่อลดการเด้งแป้นพิมพ์ในมือถือ
          e.preventDefault();
        }}
      >
        <div className="relative flex-shrink-0 pt-[16px]">
          <DialogTitle className="font-athiti font-semibold text-center text-[22px] md:text-[24px] text-subtle-dark">
            {editingItem ? "แก้ไขบัญชีพนักงาน" : "เพิ่มบัญชีพนักงาน"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {editingItem ? `แก้ไข ${editingItem.fullName}` : "เพิ่มบัญชีพนักงาน"}
          </DialogDescription>

          <button
            onClick={handleClose}
            autoFocus
            tabIndex={-1}
            aria-label="ปิดหน้าต่าง"
            className="absolute top-[16px] right-[20px] flex items-center justify-center w-[32px] h-[32px] rounded-full bg-black/5 cursor-pointer"
          >
            <X size={18} className="text-subtle-dark" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 flex flex-col font-athiti px-[20px]">
          <form
            onSubmit={handleSubmit(editingItem ? handleEdit : handleAdd)}
            className="space-y-[16px]"
          >
            <div>
              <FormInput
                register={register}
                name="firstName"
                label="ชื่อ"
                placeholder="เช่น สมชาย"
                errors={errors}
                customClass="px-0 pb-[16px]"
                color="subtle-dark"
                autoFocus={false}
              />
              <FormInput
                register={register}
                name="lastName"
                label="นามสกุล"
                placeholder="เช่น ใจดี"
                errors={errors}
                customClass="px-0 pb-[16px]"
                color="subtle-dark"
                autoFocus={false}
              />
              <FormInput
                register={register}
                name="nickname"
                label="ชื่อเล่น"
                placeholder="เช่น ชาย"
                errors={errors}
                customClass="px-0 pb-[16px]"
                color="subtle-dark"
                autoFocus={false}
              />
              <FormInput
                register={register}
                name="email"
                label="อีเมล"
                type="email"
                placeholder="เช่น somchai@gmail.com"
                errors={errors}
                customClass="px-0 pb-[16px]"
                color="subtle-dark"
                readOnly={Boolean(editingItem)}
                inputMode={editingItem ? "none" : "email"}
                disabled={Boolean(editingItem)}
                autoFocus={false}
              />
              <FormInput
                register={register}
                name="password"
                label={
                  editingItem
                    ? "รหัสผ่านใหม่"
                    : "รหัสผ่าน"
                }
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                errors={errors}
                customClass="px-0 pb-[16px]"
                color="subtle-dark"

                rightSlot={
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="mt-[8px] text-subtle-light hover:text-gray-600 cursor-pointer"
                    aria-label={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                }
                autoFocus={false}
              />
              <FormInput
                register={register}
                name="confirmPassword"
                label="ยืนยันรหัสผ่าน"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="••••••••"
                errors={errors}
                customClass="px-0 pb-[16px]"
                color="subtle-dark"
                rightSlot={
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    className="mt-[8px] text-subtle-light hover:text-gray-600 cursor-pointer"
                    aria-label={showConfirmPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                }
                autoFocus={false}
              />
              <div className="px-0 pb-[16px]">
                <Label
                  htmlFor="dateOfBirth"
                  className="mb-[8px] font-medium text-[22px] md:text-[24px] text-subtle-dark"
                >
                  วันเกิด
                </Label>
                <Controller
                  name="dateOfBirth"
                  control={control}
                  render={({ field }) => (
                    <div className="relative">
                      <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full h-[41px] px-[12px] rounded-[20px] font-medium text-[20px] md:text-[22px] bg-surface justify-start text-left border border-input",
                              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                              !field.value &&
                                "text-subtle-dark font-light text-[18px] md:text-[20px]",
                              errors.dateOfBirth
                                ? "border-red-400 focus-visible:border-delete focus-visible:ring-[rgba(255,69,69,0.3)]"
                                : "focus-visible:border-[#1976d2] focus-visible:ring-[rgba(25,118,210,0.35)]"
                            )}
                          >
                            {field.value
                              ? formatDateThai(field.value)
                              : "-- เลือกวันเกิด --"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent 
                          className="w-auto p-0" 
                          align="start"
                          onPointerDownOutside={(e) => {
                            // ป้องกันการปิด popup เมื่อคลิกที่ calendar
                            if (e.target.closest('[role="gridcell"]')) {
                              e.preventDefault();
                            }
                          }}
                        >
                          <CalendarComponent
                            mode="single"
                            selected={
                              field.value ? new Date(field.value) : undefined
                            }
                            onSelect={(date) => {
                              if (date) {
                                field.onChange(formatDateISO(date));
                                requestAnimationFrame(() => {
                                  setIsCalendarOpen(false);
                                });
                              }
                            }}
                            disabled={(date) =>
                              date > new Date() || date < new Date("1900-01-01")
                            }
                            captionLayout="dropdown"
                            fromYear={1900}
                            toYear={new Date().getFullYear()}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <div className="absolute right-[12px] top-1/2 transform -translate-y-1/2 pointer-events-none">
                        <Calendar className="w-5 h-5 text-subtle-light" />
                      </div>
                      {errors.dateOfBirth && (
                        <div className="flex items-center mt-[8px] text-red-500">
                          <AlertCircle className="w-4 h-4 mr-1" />
                          <span className="text-[14px] font-medium">
                            {errors.dateOfBirth.message}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                />
              </div>
              <FormInput
                register={register}
                name="phoneNumber"
                label="เบอร์โทรศัพท์"
                placeholder="เช่น 0812345678"
                errors={errors}
                customClass="px-0 pb-[16px]"
                color="subtle-dark"
                autoFocus={false}
              />
              <div className="px-0 mb-[4px]">
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

        <div className="flex-shrink-0 px-[16px] pb-[16px]">
          <div className="flex gap-[16px]">
            <FormButton
              label={editingItem ? "บันทึก" : "เพิ่มบัญชีพนักงาน"}
              isLoading={isSubmitting}
              onClick={handleSubmit(editingItem ? handleEdit : handleAdd)}
              className="ml-0 mr-0 font-athiti bg-gradient-primary"
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EmployeeFormDialog;
