const CarCard = ({ bg, color, icon: Icon, plateId, band, time, price, amount }) => {
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
      className="flex justify-between items-center w-full h-[80px] px-[16px] rounded-[10px] bg-surface shadow-primary"
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
            {[band, time && `${time} น.`].filter(Boolean).join(' | ') || ''}
          </p>
        </div>
      </div>
      <p className={`font-semibold text-[22px] ${textColorMap[bg]}`}>
        {price ? `${price} ฿` : ''}
      </p>
      <p className={`font-semibold text-[32px] ${textColorMap[bg]}`}>
        {amount ? `${amount} คัน` : ''}
      </p>
    </div>
  );
};
export default CarCard;
