const CarCard = ({ bg, color, icon: Icon, plateId, band, time, price }) => {
  const bgColorMap = {
    "in-progress": "bg-[var(--color-in-progress)]",
    completed: "bg-[var(--color-completed)]",
    paid: "bg-[var(--color-paid)]",
  };

  const textColorMap = {
    "in-progress": "text-[var(--color-in-progress)]",
    completed: "text-[var(--color-completed)]",
    paid: "text-[var(--color-paid)]",
  };

  return (
    <div
      className="flex justify-between items-center w-full h-[80px] px-[16px] rounded-[10px] bg-surface"
      style={{ boxShadow: "0px 0px 50px 0 rgba(0,0,0,0.1)" }}
    >
      <div className="flex items-center gap-[8px]">
        <div
          className={`flex justify-center items-center w-[45px] h-[45px] rounded-full ${bgColorMap[bg]}`}
        >
          <Icon color={color} />
        </div>
        <div className="gap-[8px]">
          <p className={`font-semibold text-[18px] ${textColorMap[bg]}`}>
            {plateId}
          </p>
          <p className="font-medium text-[14px] text-subtle-dark">
            {band} | {time} น.
          </p>
        </div>
      </div>
      <p className={`font-semibold text-[22px] ${textColorMap[bg]}`}>
        {price} ฿
      </p>
    </div>
  );
};
export default CarCard;
