import { Input } from "../ui/input";

const LicensePlateInput = ({
  register,
  name,
  placeholder,
  pattern,
  maxLength,
  onInput,
}) => {
  return (
    <Input
      {...register(name)}
      type="text"
      placeholder={placeholder}
      pattern={pattern}
      maxLength={maxLength}
      onInput={onInput}
      className="h-[40px] rounded-[20px] bg-surface"
      style={{
        "--tw-ring-color": "#5b46f4",
        "--tw-border-opacity": "1",
      }}
      onFocus={(e) => {
        e.target.style.borderColor = "#5b46f4";
        e.target.style.borderWidth = "2px";
        e.target.style.boxShadow = "0 0 0 3px rgba(91, 70, 244, 0.3)";
      }}
      onBlur={(e) => {
        e.target.style.borderColor = "";
        e.target.style.borderWidth = "";
        e.target.style.boxShadow = "";
      }}
    />
  );
};

export default LicensePlateInput;
