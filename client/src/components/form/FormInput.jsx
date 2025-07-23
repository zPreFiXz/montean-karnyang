import { Input } from "../ui/input";

const LicensePlate = ({ register, name, type, placeholder, className }) => {
  return (
    <Input
      {...register(name)}
      type={type}
      placeholder={placeholder}
      className={className || "w-full h-[40px] px-[12px] rounded-[20px] bg-surface"}
    />
  );
};

export default LicensePlate;
