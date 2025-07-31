import { Input } from "../ui/input";
import { Label } from "../ui/label";

const FormInput = ({ register, name, label, type, placeholder, color }) => {
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
      />
    </div>
  );
};
export default FormInput;
