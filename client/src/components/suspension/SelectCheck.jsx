import { Check } from "lucide-react";

const SelectCheck = ({ selected }) => (
  <div
    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors duration-200 ${
      selected
        ? "bg-gradient-primary text-surface border-transparent"
        : "border-subtle-mid text-transparent"
    }`}
  >
    <Check className="h-4 w-4" />
  </div>
);

export default SelectCheck;
