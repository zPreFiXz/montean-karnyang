import { LoaderCircle } from "lucide-react";

const FormButton = ({ label, isLoading }) => {
  return (
    <button
      type="submit"
      disabled={isLoading}
      className="w-full h-[40px] mx-[20px] my-[16px] rounded-[20px] font-semibold text-surface bg-gradient-primary shadow-primary disabled:opacity-70 disabled:cursor-not-allowed transition-opacity duration-200 flex items-center justify-center"
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
