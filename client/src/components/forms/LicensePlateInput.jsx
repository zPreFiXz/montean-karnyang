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
        type="text"
        placeholder={placeholder}
        pattern={pattern}
        maxLength={maxLength}
        onInput={onInput}
        className={`h-[40px] rounded-[20px] bg-surface ${
          error ? "border-red-400 focus:border-red-500" : ""
        }`}
        style={{
          "--tw-ring-color": error ? "#FF4545" : "#5b46f4",
          "--tw-border-opacity": "1",
        }}
        onFocus={(e) => {
          if (error) {
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
