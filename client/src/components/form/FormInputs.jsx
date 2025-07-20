import { Input } from "../ui/input";

const FormInputs = ({ register, name, label, type, placeholder, color }) => {
  const getTextColor = () => {
    if (color === "surface") return "text-surface";
    if (color === "primary") return "text-primary";
    if (color === "subtle-dark") return "text-subtle-dark";
  };

  return (
    <div className="px-[20px] pt-[16px]">
      <p className={`font-medium text-[18px] ${getTextColor()} mb-[8px]`}>
        {label}
      </p>
      <Input
        {...register(name)}
        type={type}
        placeholder={placeholder}
        className="w-full h-[40px] px-[12px] rounded-[20px] bg-surface"
      />
    </div>
  );
};
export default FormInputs;
