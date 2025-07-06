import { CircleUserRound, ChevronDown } from "lucide-react";

const User = () => {
  return (
    <div className="flex items-center gap-[8px]">
      <CircleUserRound className="w-[32px] h-[32px] stroke-[1.5] text-subtle-dark" />
      <p className="font-medium text-[22px] text-subtle-dark">
        ภาคภูมิ สุขชาติ
      </p>
      <ChevronDown className="text-subtle-dark" />
    </div>
  );
};
export default User;
