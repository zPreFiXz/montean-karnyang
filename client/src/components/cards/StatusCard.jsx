const StatusCard = ({ bg, icon: Icon, label, amount }) => {
  const bgColorMap = {
    "in-progress": "bg-[var(--color-in-progress)]",
    completed: "bg-[var(--color-completed)]",
    paid: "bg-[var(--color-paid)]",
  };

  return (
    <div
      className={`shadow-primary flex h-[80px] w-full items-center justify-between rounded-[10px] px-[16px] ${bgColorMap[bg]}`}
    >
      <div className="flex items-center gap-[8px]">
        <Icon />
        <p className="text-surface text-[22px] font-medium">{label}</p>
      </div>
      <p className="text-surface text-[32px] font-medium">{amount} คัน</p>
    </div>
  );
};
export default StatusCard;
