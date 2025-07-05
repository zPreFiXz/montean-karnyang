import { Plus } from "./icons/Icon";
import { Button } from "./ui/button";

const LeftSidebar = () => {
  return (
    <div
      className="hidden lg:flex justify-center w-[269px] min-h-[calc(100vh-73px)]"
      style={{ boxShadow: "0px 0px 50px 0 rgba(0,0,0,0.1)" }}
    >
      <Button className="flex justify-center items-center w-[237px] h-[65px] mt-[24px] rounded-[10px] bg-gradient-to-r from-[#5b46f4] to-[#8663f8]  hover:opacity-90 hover:scale-105 transition-all duration-300 cursor-pointer">
       <Plus />
        <p className="font-medium text-[22px] text-surface">รายการซ่อมใหม่</p>
      </Button>
    </div>
  );
};
export default LeftSidebar;
