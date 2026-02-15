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
            ? "border-destructive focus-visible:!border-destructive focus-visible:!ring-destructive/30 focus-visible:!border-2"
            : "focus-visible:!border-primary focus-visible:!ring-primary/35 focus-visible:!border-2"
        }`}
        style={{
          "--tw-ring-color": error
            ? "var(--color-destructive)"
            : "var(--color-primary)",
          "--tw-border-opacity": "1",
        }}
      />
      {error && (
        <div className="absolute top-1/2 right-[8px] -translate-y-1/2 transform">
          <AlertCircle className="text-destructive h-4 w-4" />
        </div>
      )}
    </div>
  );
};

export default LicensePlateInput;
