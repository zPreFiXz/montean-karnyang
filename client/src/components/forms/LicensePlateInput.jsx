import { Input } from "../ui/input";
import { AlertCircle } from "lucide-react";

const LicensePlateInput = ({
  register,
  name,
  placeholder,
  pattern,
  maxLength,
  onInput,
  error,
}) => {
  return (
    <div className="relative">
      <Input
        {...register(name)}
        type={name === "plateNumbers" ? "tel" : "text"}
        inputMode={name === "plateNumbers" ? "numeric" : undefined}
        placeholder={placeholder}
        pattern={pattern}
        maxLength={maxLength}
        onInput={onInput}
        className={`h-[41px] rounded-[20px] font-medium text-[18px] md:text-[20px] bg-surface placeholder:font-light ${
          error
              ? "border-red-400 focus:border-delete focus-visible:!border-[#FF4545] focus-visible:!ring-[rgba(255,69,69,0.3)] focus-visible:!border-2"
              : "focus-visible:!border-[#1976d2] focus-visible:!ring-[rgba(25,118,210,0.35)] focus-visible:!border-2"
          }`}
        style={{
          "--tw-ring-color": error ? "#FF4545" : "#1976d2",
          "--tw-border-opacity": "1",
        }}
      />
      {error && (
        <div className="absolute top-1/2 right-[8px] transform -translate-y-1/2">
          <AlertCircle className="w-4 h-4 text-delete" />
        </div>
      )}
    </div>
  );
};

export default LicensePlateInput;
