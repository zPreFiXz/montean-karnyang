const StatusCard = ({ bg, icon: Icon, label, amount }) => {
  const bgColorMap = {
    "in-progress": "bg-[var(--color-in-progress)]",
    completed: "bg-[var(--color-completed)]",
    paid: "bg-[var(--color-paid)]",
  };

  return (
    <div
      className={`flex justify-between items-center w-full h-[80px] px-[16px] rounded-[10px] ${bgColorMap[bg]}`}
      style={{ boxShadow: "0px 0px 50px 0 rgba(0,0,0,0.1)" }}
    >
      <div className="flex items-center gap-[8px]">
        <Icon />
        <p className="font-medium text-[22px] text-surface">{label}</p>
      </div>
      <p className="font-medium text-[32px] text-surface">{amount} คัน</p>
    </div>
  );
};
export default StatusCard;
