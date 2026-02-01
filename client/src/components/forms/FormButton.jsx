import { LoaderCircle } from "lucide-react";

const FormButton = ({ label, isLoading, disabled, onClick, className = "bg-gradient-primary", form }) => {
  return (
    <button
      type={onClick ? "button" : "submit"}
      form={form}
      disabled={isLoading || disabled}
      onClick={onClick}
      className={`text-surface shadow-primary mx-[20px] flex h-[41px] w-full cursor-pointer items-center justify-center rounded-[20px] text-[18px] font-semibold duration-300 disabled:cursor-not-allowed disabled:opacity-70 md:text-[20px] ${className}`}
    >
      {isLoading ? (
        <>
          <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
          {label}...
        </>
      ) : (
        label
      )}
    </button>
  );
};
export default FormButton;
