import { Input } from "../ui/input";
import { Label } from "../ui/label";

const FormInput = ({
  register,
  name,
  label,
  type,
  placeholder,
  color,
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
      <Input
        {...register(name, type === "number" ? { valueAsNumber: true } : {})}
        type={type}
        placeholder={placeholder}
        className="w-full h-[40px] px-[12px] rounded-[20px] bg-surface"
        style={{
          "--tw-ring-color": "#5b46f4",
          "--tw-border-opacity": "1",
        }}
        onFocus={(e) => {
          e.target.style.borderColor = "#5b46f4";
          e.target.style.borderWidth = "2px";
          e.target.style.boxShadow = "0 0 0 3px rgba(91, 70, 244, 0.3)";
        }}
        onBlur={(e) => {
          e.target.style.borderColor = "";
          e.target.style.borderWidth = "";
          e.target.style.boxShadow = "";
        }}
        {...props}
      />
    </div>
  );
};
export default FormInput;
