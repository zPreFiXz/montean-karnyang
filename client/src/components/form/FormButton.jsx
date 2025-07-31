const FormButton = ({ label }) => {
  return (
    <button
      type="submit"
      className="w-full h-[40px] mx-[20px] my-[16px] rounded-[20px] font-semibold text-surface bg-gradient-primary shadow-primary"
    >
      {label}
    </button>
  );
};
export default FormButton;
