const StatusCard = ({ bg, icon: Icon, label, amount }) => {
  const bgColorMap = {
    progress: "bg-status-progress",
    completed: "bg-status-completed",
    paid: "bg-status-paid",
  };

  return (
    <div
      className={`shadow-primary flex h-[80px] w-full items-center justify-between rounded-[10px] px-[16px] ${bgColorMap[bg]}`}
    >
      <div className="flex items-center gap-[8px]">
        <Icon />
        <p className="text-surface text-[22px] font-medium md:text-[24px]">
          {label}
        </p>
      </div>
      
      <p className="text-surface text-[32px] font-semibold md:text-[34px]">
        {amount} คัน
      </p>
    </div>
  );
};
export default StatusCard;
