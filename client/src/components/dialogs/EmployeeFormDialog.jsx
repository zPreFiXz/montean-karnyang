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
import { createEmployeeSchema, editEmployeeSchema } from "@/utils/schemas";
import { createEmployee, updateEmployee } from "@/api/employee";
import { cn } from "@/lib/utils";

const formatDateThai = (date) => {
  const thaiMonths = [
    "มกราคม",
    "กุมภาพันธ์",
    "มีนาคม",
    "เมษายน",
    "พฤษภาคม",
    "มิถุนายน",
    "กรกฎาคม",
    "สิงหาคม",
    "กันยายน",
    "ตุลาคม",
    "พฤศจิกายน",
    "ธันวาคม",
  ];

  const d = new Date(date);
  const day = d.getDate();
  const month = thaiMonths[d.getMonth()];
  const year = d.getFullYear();

  return `${day} ${month} ${year}`;
};

const formatDateISO = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const EmployeeFormDialog = ({
  isOpen,
  onClose,
  editingItem = null,
  onSuccess,
}) => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] =
    useState(false);
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
    resolver: zodResolver(
      editingItem ? editEmployeeSchema : createEmployeeSchema,
    ),
    defaultValues: {
      fullName: "",
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
        reset({
          fullName: editingItem.fullName || "",
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
          fullName: "",
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
        fullName: data.fullName,
        nickname: data.nickname,
        role: data.role,
        phoneNumber: data.phoneNumber,
        dateOfBirth: data.dateOfBirth,
      });
      toast.success("เพิ่มพนักงานเรียบร้อยแล้ว");
      handleClose();
      onSuccess?.();
    } catch (error) {
      console.log(error);
    }
  };

  const handleEdit = async (data) => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
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

      await updateEmployee(editingItem.id, updateData);
      toast.success("แก้ไขข้อมูลพนักงานเรียบร้อยแล้ว");
      handleClose();
      onSuccess?.();
    } catch (error) {
      console.log(error);
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
        className="flex h-[90vh] max-h-[650px] w-full flex-col p-0"
        showCloseButton={false}
        onOpenAutoFocus={(e) => {
          e.preventDefault();
        }}
      >
        <div className="relative flex-shrink-0 pt-[16px]">
          <DialogTitle className="font-athiti text-subtle-dark text-center text-[22px] font-semibold md:text-[24px]">
            {editingItem ? "แก้ไขบัญชีพนักงาน" : "เพิ่มบัญชีพนักงาน"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {editingItem
              ? `แก้ไข ${editingItem.fullName}`
              : "เพิ่มบัญชีพนักงาน"}
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
            onSubmit={handleSubmit(editingItem ? handleEdit : handleAdd)}
            className="space-y-[16px]"
          >
            <div>
              <FormInput
                register={register}
                name="fullName"
                label="ชื่อ-นามสกุล"
                placeholder="เช่น สมชาย ใจดี"
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
                label={editingItem ? "รหัสผ่านใหม่" : "รหัสผ่าน"}
                type={isPasswordVisible ? "text" : "password"}
                placeholder="••••••••"
                errors={errors}
                customClass="px-0 pb-[16px]"
                color="subtle-dark"
                rightSlot={
                  <button
                    type="button"
                    onClick={() => setIsPasswordVisible((v) => !v)}
                    className="text-subtle-light mt-[8px] cursor-pointer hover:text-gray-600"
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
                customClass="px-0 pb-[16px]"
                color="subtle-dark"
                rightSlot={
                  <button
                    type="button"
                    onClick={() => setIsConfirmPasswordVisible((v) => !v)}
                    className="text-subtle-light mt-[8px] cursor-pointer hover:text-gray-600"
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

              <div className="px-0 pb-[16px]">
                <Label
                  htmlFor="dateOfBirth"
                  className="text-subtle-dark mb-[8px] text-[22px] font-medium md:text-[24px]"
                >
                  วันเกิด
                </Label>
                <Controller
                  name="dateOfBirth"
                  control={control}
                  render={({ field }) => (
                    <div className="relative">
                      <Popover
                        open={isCalendarOpen}
                        onOpenChange={setIsCalendarOpen}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "bg-surface border-input relative h-[41px] w-full justify-start rounded-[20px] border pl-[12px] text-left text-[20px] font-medium md:text-[22px]",
                              "focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
                              !field.value &&
                                "text-subtle-dark text-[18px] font-light md:text-[20px]",
                              errors.dateOfBirth
                                ? "focus-visible:border-destructive border-destructive focus-visible:ring-destructive/30 pr-[44px]"
                                : "focus-visible:border-primary focus-visible:ring-primary/35 pr-[44px]",
                            )}
                          >
                            {field.value
                              ? formatDateThai(field.value)
                              : "-- เลือกวันเกิด --"}
                            <Calendar
                              className="text-subtle-light pointer-events-none absolute top-1/2 right-[12px] h-5 w-5 -translate-y-1/2"
                              strokeWidth={2.25}
                            />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent
                          className="w-auto p-0"
                          align="start"
                          onPointerDownOutside={(e) => {
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
                      {errors.dateOfBirth && (
                        <div className="mt-[6px] flex items-center gap-[4px] px-[4px]">
                          <AlertCircle className="text-destructive h-4 w-4 flex-shrink-0" />
                          <p className="text-destructive text-[18px] font-medium md:text-[20px]">
                            {errors.dateOfBirth.message}
                          </p>
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

              <div className="mb-[4px] px-0">
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
              className="font-athiti bg-gradient-primary mr-0 ml-0"
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EmployeeFormDialog;
