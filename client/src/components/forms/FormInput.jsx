import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { AlertCircle } from "lucide-react";

const FormInput = ({
  register,
  name,
  label,
  type,
  placeholder,
  color,
  errors,
  ...props
}) => {
  const getTextColor = () => {
    if (color === "surface") return "text-surface";
    if (color === "primary") return "text-primary";
    if (color === "subtle-dark") return "text-subtle-dark";
  };

  return (
    <div className="px-[20px] mt-[16px]">
      <Label
        htmlFor={name}
        className={`mb-[8px] font-medium text-[18px] ${getTextColor()}`}
      >
        {label}
      </Label>
      <div className="relative">
        <Input
          {...register(name)}
          type={type}
          placeholder={placeholder}
          className={`w-full h-[40px] px-[12px] rounded-[20px] bg-surface ${
            errors[name] && "border-red-400 focus:border-red-500"
          }`}
          style={{
            "--tw-ring-color": errors[name] ? "#FF4545" : "#5b46f4",
            "--tw-border-opacity": "1",
          }}
          onFocus={(e) => {
            if (errors[name]) {
              e.target.style.borderColor = "#FF4545";
              e.target.style.borderWidth = "2px";
              e.target.style.boxShadow = "0 0 0 3px rgba(255, 69, 69, 0.3)";
            } else {
              e.target.style.borderColor = "#5b46f4";
              e.target.style.borderWidth = "2px";
              e.target.style.boxShadow = "0 0 0 3px rgba(91, 70, 244, 0.3)";
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
          <div className="absolute right-[12px] top-1/2 transform -translate-y-1/2">
            <AlertCircle className="w-5 h-5 text-delete" />
          </div>
        )}
      </div>
      {errors[name] && (
        <div className="flex items-center gap-[4px] px-[4px] mt-[6px]">
          <AlertCircle className="flex-shrink-0 w-4 h-4 text-delete" />
          <p className="text-delete text-[14px] font-medium">
            {errors[name].message}
          </p>
        </div>
      )}
    </div>
  );
};
export default FormInput;
