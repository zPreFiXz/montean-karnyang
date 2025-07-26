import { Input } from "../ui/input";

const LicensePlateInput = ({ register, name, type, placeholder, className, pattern, maxLength, onInput }) => {
  return (
    <Input
      {...register(name)}
      type={type}
      placeholder={placeholder}
      pattern={pattern}
      maxLength={maxLength}
      onInput={onInput}
      className={className || "w-full h-[40px] px-[12px] rounded-[20px] bg-surface"}
    />
  );
};

export default LicensePlateInput;
