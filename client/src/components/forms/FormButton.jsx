import { LoaderCircle } from "lucide-react";

const FormButton = ({
  label,
  isLoading,
  disabled,
  onClick,
  className = "bg-gradient-primary",
}) => {
  return (
    <button
      type={onClick ? "button" : "submit"}
      disabled={isLoading || disabled}
      onClick={onClick}
      className={`flex items-center justify-center w-full h-[41px] mx-[20px] rounded-[20px] font-semibold text-[18px] md:text-[20px] text-surface shadow-primary disabled:opacity-70 disabled:cursor-not-allowed duration-200 ${className}`}
    >
      {isLoading ? (
        <>
          <LoaderCircle className="w-4 h-4 mr-2 animate-spin" />
          {label}...
        </>
      ) : (
        label
      )}
    </button>
  );
};
export default FormButton;
