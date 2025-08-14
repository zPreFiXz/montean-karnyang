import { LoaderCircle } from "lucide-react";

const FormButton = ({ label, isLoading, onClick }) => {
  return (
    <button
      type={onClick ? "button" : "submit"}
      disabled={isLoading}
      onClick={onClick}
      className="flex items-center justify-center w-full h-[40px] mx-[20px] my-[16px] rounded-[20px] font-semibold text-surface bg-gradient-primary duration-200 shadow-primary disabled:opacity-70 disabled:cursor-not-allowed"
    >
      {isLoading ? (
        <>
          <LoaderCircle className="w-4 h-4 mr-2 animate-spin" />
          กำลัง{label}...
        </>
      ) : (
        label
      )}
    </button>
  );
};
export default FormButton;
