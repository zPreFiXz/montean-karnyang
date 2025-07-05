const StatusCard = ({ bg, icon: Icon }) => {
  const colorMap = {
    progress: "bg-[var(--color-progress)]",
    done: "bg-[var(--color-done)]",
    payment: "bg-[var(--color-payment)]",
  };

  return (
    <div
      className={`flex justify-between items-center w-[353px] h-[80px] px-[16px] rounded-[10px] ${colorMap[bg]}`}
      style={{ boxShadow: "0px 0px 50px 0 rgba(0,0,0,0.1)" }}
    >
      <div className="flex items-center gap-[8px]">
        <div className="flex justify-start items-center w-7 h-7 relative gap-2.5 px-1.5 py-[5px] rounded-[13.5px] bg-surface">
          <Icon />
        </div>
        <p className="font-medium text-[22px] text-surface">กำลังซ่อม</p>
      </div>
      <p className="font-medium text-[32px] text-surface">5 คัน</p>
    </div>
  );
};
export default StatusCard;
