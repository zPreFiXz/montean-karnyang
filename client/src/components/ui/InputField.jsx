import { Input } from "./input";

const InputField = ({ label, placeholder }) => {
  return (
    <div className="px-[20px] pt-[16px]">
      <p className="font-medium text-[18px] text-surface mb-[8px]">
        {label}
      </p>
      <Input
        type="text"
        placeholder={placeholder}
        className="w-full h-[40px] px-[12px] rounded-[20px] bg-surface"
      />
    </div>
  );
};
export default InputField;
