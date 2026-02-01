import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { AlertCircle } from "lucide-react";

const FormInput = ({
  register,
  name,
  label,
  type,
  placeholder,
  textSize,
  color,
  errors = {},
  customClass,
  rightSlot,
  rules,
  ...props
}) => {
  const getTextColor = () => {
    if (color === "surface") return "text-surface";
    if (color === "primary") return "text-primary";
    if (color === "subtle-dark") return "text-subtle-dark";
  };

  return (
    <div className={`${customClass || "mt-[16px] px-[20px]"} `}>
      <Label
        htmlFor={name}
        className={`mb-[8px] font-medium ${
          textSize ? textSize : "text-[22px] md:text-[24px]"
        } ${getTextColor()}`}
      >
        {label}
      </Label>
      <div className="relative">
        <Input
          {...(register ? register(name, rules) : {})}
          type={type}
          placeholder={placeholder}
          aria-invalid={errors[name] ? "true" : "false"}
          className={`h-[41px] w-full px-[12px] ${
            type === "date" ? "pr-[44px]" : ""
          } bg-surface rounded-[20px] text-[20px] font-medium placeholder:text-[18px] placeholder:font-light md:text-[22px] md:placeholder:text-[20px] ${
            errors[name]
              ? "focus:border-delete border-red-400 focus-visible:!border-2 focus-visible:!border-[#FF4545] focus-visible:!ring-[rgba(255,69,69,0.3)]"
              : "focus-visible:!border-2 focus-visible:!border-[#1976d2] focus-visible:!ring-[rgba(25,118,210,0.35)]"
          }`}
          style={{
            "--tw-ring-color": errors[name] ? "#FF4545" : "#1976d2",
            "--tw-border-opacity": "1",
          }}
          {...props}
        />

        {/* แสดงไอคอนทางขวาหากมีการส่ง rightSlot มา */}
        {rightSlot && (
          <div
            className={`${
              errors[name] ? "right-[40px]" : "right-[12px]"
            } absolute top-1/2 -translate-y-1/2`}
          >
            {rightSlot}
          </div>
        )}
        {errors[name] && (
          <div className="absolute top-1/2 right-[12px] -translate-y-1/2 transform">
            <AlertCircle className="text-delete h-5 w-5" />
          </div>
        )}
      </div>

      {/* แสดงข้อความผิดพลาดหากมี errors */}
      {errors[name] && (
        <div className="mt-[6px] flex items-center gap-[4px] px-[4px]">
          <AlertCircle className="text-delete h-4 w-4 flex-shrink-0" />
          <p className="text-delete text-[18px] font-medium md:text-[20px]">
            {errors[name].message}
          </p>
        </div>
      )}
    </div>
  );
};
export default FormInput;
