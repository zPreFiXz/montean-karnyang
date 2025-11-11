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
    <div className={`${customClass || "px-[20px] mt-[16px]"} `}>
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
          className={`w-full h-[41px] px-[12px] ${
            type === "date" ? "pr-[44px]" : ""
          } rounded-[20px] font-medium text-[20px] md:text-[22px] bg-surface placeholder:font-light placeholder:text-[18px] md:placeholder:text-[20px] ${
            errors[name]
              ? "border-red-400 focus:border-delete focus-visible:!border-[#FF4545] focus-visible:!ring-[rgba(255,69,69,0.3)] focus-visible:!border-2"
              : "focus-visible:!border-[#1976d2] focus-visible:!ring-[rgba(25,118,210,0.35)] focus-visible:!border-2"
          }`}
          style={{
            "--tw-ring-color": errors[name] ? "#FF4545" : "#1976d2",
            "--tw-border-opacity": "1",
          }}
          {...props}
        />
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
          <div className="absolute top-1/2 right-[12px] transform -translate-y-1/2">
            <AlertCircle className="w-5 h-5 text-delete" />
          </div>
        )}
      </div>
      {errors[name] && (
        <div className="flex items-center gap-[4px] px-[4px] mt-[6px]">
          <AlertCircle className="flex-shrink-0 w-4 h-4 text-delete" />
          <p className="font-medium text-delete text-[18px] md:text-[20px]">
            {errors[name].message}
          </p>
        </div>
      )}
    </div>
  );
};
export default FormInput;
