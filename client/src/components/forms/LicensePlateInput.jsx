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
        className={`bg-surface h-[41px] rounded-[20px] text-[18px] font-medium placeholder:font-light md:text-[20px] ${
          error
            ? "focus:border-delete border-red-400 focus-visible:!border-2 focus-visible:!border-[#FF4545] focus-visible:!ring-[rgba(255,69,69,0.3)]"
            : "focus-visible:!border-2 focus-visible:!border-[#1976d2] focus-visible:!ring-[rgba(25,118,210,0.35)]"
        }`}
        style={{
          "--tw-ring-color": error ? "#FF4545" : "#1976d2",
          "--tw-border-opacity": "1",
        }}
      />

      {/* แสดงไอคอนแจ้งเตือนหากมี error */}
      {error && (
        <div className="absolute top-1/2 right-[8px] -translate-y-1/2 transform">
          <AlertCircle className="text-delete h-4 w-4" />
        </div>
      )}
    </div>
  );
};

export default LicensePlateInput;
