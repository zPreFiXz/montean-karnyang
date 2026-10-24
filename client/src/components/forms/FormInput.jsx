import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AlertCircle } from "lucide-react";

const FormInput = ({
  register,
  name,
  label,
  type,
  placeholder,
  textSize,
  color,
  errors = {},
  customClass,
  rightSlot,
  rules,
  rows,
  // คงกรอบแดงไว้ แล้วให้หน้าที่เรียกแสดงข้อความรวมใต้แถวเอง
  hideErrorMessage = false,
  ...props
}) => {
  const getTextColor = () => {
    if (color === "surface") return "text-surface";
    if (color === "primary") return "text-primary";
    if (color === "subtle-dark") return "text-subtle-dark";
  };

  return (
    <div className={`${customClass || "mt-4 px-5"} `}>
      <Label
        htmlFor={name}
        className={`mb-2 font-medium ${
          textSize ? textSize : "text-xl"
        } ${getTextColor()}`}
      >
        {label}
      </Label>

      <div className="relative">
        {rows ? (
          <Textarea
            {...(register ? register(name, rules) : {})}
            id={name}
            rows={rows}
            placeholder={placeholder}
            aria-invalid={errors[name] ? "true" : "false"}
            className={`bg-surface w-full resize-none px-3 py-2 text-xl font-medium placeholder:text-lg placeholder:font-light md:text-[22px] md:placeholder:text-xl ${
              errors[name]
                ? "border-destructive focus-visible:!border-destructive focus-visible:!ring-destructive/30 focus-visible:!border-2"
                : "focus-visible:!border-primary focus-visible:!ring-primary/35 focus-visible:!border-2"
            } rounded-[20px]`}
            style={{
              "--tw-ring-color": errors[name]
                ? "var(--color-destructive)"
                : "var(--color-primary)",
              "--tw-border-opacity": "1",
            }}
            {...props}
          />
        ) : (
          <Input
            {...(register ? register(name, rules) : {})}
            id={name}
            type={type}
            placeholder={placeholder}
            aria-invalid={errors[name] ? "true" : "false"}
            className={`h-[41px] w-full px-3 ${
              type === "date" ? "pr-11" : ""
            } bg-surface rounded-[20px] text-xl font-medium placeholder:text-lg placeholder:font-light md:text-[22px] md:placeholder:text-xl ${
              errors[name]
                ? "border-destructive focus-visible:!border-destructive focus-visible:!ring-destructive/30 focus-visible:!border-2"
                : "focus-visible:!border-primary focus-visible:!ring-primary/35 focus-visible:!border-2"
            }`}
            style={{
              "--tw-ring-color": errors[name]
                ? "var(--color-destructive)"
                : "var(--color-primary)",
              "--tw-border-opacity": "1",
            }}
            {...props}
          />
        )}

        {rightSlot && (
          <div
            className={`${
              errors[name] ? "right-10" : "right-3"
            } absolute top-1/2 -translate-y-1/2`}
          >
            {rightSlot}
          </div>
        )}

        {errors[name] && (
          <div
            className={`absolute right-3 ${
              rows ? "top-3" : "top-1/2 -translate-y-1/2 transform"
            }`}
          >
            <AlertCircle className="text-destructive h-5 w-5" />
          </div>
        )}
      </div>

      {errors[name] && !hideErrorMessage && (
        <div className="mt-1.5 flex items-center gap-1 px-1">
          <AlertCircle className="text-destructive h-4 w-4 flex-shrink-0" />
          <p className="text-destructive text-lg font-medium md:text-xl">
            {errors[name].message}
          </p>
        </div>
      )}
    </div>
  );
};
export default FormInput;
