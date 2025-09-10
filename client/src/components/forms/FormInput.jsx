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
  errors,
  customClass,
  ...props
}) => {
  const getTextColor = () => {
    if (color === "surface") return "text-surface";
    if (color === "primary") return "text-primary";
    if (color === "subtle-dark") return "text-subtle-dark";
  };

  return (
    <div className={`${customClass || "px-[20px]"} mt-[16px]`}>
      <Label
        htmlFor={name}
        className={`mb-[8px] font-medium ${
          textSize ? textSize : "text-[20px] md:text-[22px]"
        } ${getTextColor()}`}
      >
        {label}
      </Label>
      <div className="relative">
        <Input
          {...register(name)}
          type={type}
          placeholder={placeholder}
          className={`w-full h-[41px] px-[12px] rounded-[20px] font-medium text-[20px] md:text-[22px] bg-surface placeholder:font-light placeholder:text-[18px] md:placeholder:text-[20px] ${
            errors[name] && "border-red-400 focus:border-red-500"
          }`}
          style={{
            "--tw-ring-color": errors[name] ? "#FF4545" : "#1976d2",
            "--tw-border-opacity": "1",
          }}
          onFocus={(e) => {
            if (errors[name]) {
              e.target.style.borderColor = "#FF4545";
              e.target.style.borderWidth = "2px";
              e.target.style.boxShadow = "0 0 0 3px rgba(255, 69, 69, 0.3)";
            } else {
              e.target.style.borderColor = "#0d47a1";
              e.target.style.borderWidth = "2px";
              e.target.style.boxShadow = "0 0 0 3px rgba(13, 71, 161, 0.3)";
            }
          }}
          onBlur={(e) => {
            e.target.style.borderColor = "";
            e.target.style.borderWidth = "";
            e.target.style.boxShadow = "";
          }}
          {...props}
        />
        {errors[name] && (
          <div className="absolute top-1/2 right-[12px] transform -translate-y-1/2">
            <AlertCircle className="w-5 h-5 text-delete" />
          </div>
        )}
      </div>
      {errors[name] && (
        <div className="flex items-center gap-[4px] px-[4px] mt-[6px]">
          <AlertCircle className="flex-shrink-0 w-4 h-4 text-delete" />
          <p className="font-medium text-delete text-[16px]">
            {errors[name].message}
          </p>
        </div>
      )}
    </div>
  );
};
export default FormInput;
