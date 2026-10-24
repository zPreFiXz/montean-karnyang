import { Wrench } from "lucide-react";
import ProductName from "@/components/bill/ProductName";
import SelectCheck from "@/components/suspension/SelectCheck";
import { onKeyActivate } from "@/utils/a11y";
import { formatCurrency } from "@/utils/formats";

const PerSideServiceCard = ({ service, selected, onToggle }) => (
  <div className="mt-4 px-5">
    <div
      role="button"
      tabIndex={0}
      aria-pressed={selected}
      onKeyDown={onKeyActivate(onToggle)}
      onClick={onToggle}
      className={`shadow-primary flex min-h-20 w-full cursor-pointer items-center justify-between gap-2 rounded-lg border-2 px-2 py-2 transition-colors duration-200 ${
        selected
          ? "bg-primary/5 border-primary"
          : "bg-surface border-transparent"
      }`}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <div className="shadow-primary bg-surface flex h-15 w-15 shrink-0 items-center justify-center rounded-lg border border-gray-200">
          <div className="text-subtle-light flex h-15 w-15 items-center justify-center">
            <Wrench className="h-9 w-9" />
          </div>
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <ProductName item={service} />
          <span
            className={`text-xl leading-tight font-semibold duration-200 md:text-[22px] ${
              selected ? "text-primary" : "text-subtle-dark"
            }`}
          >
            {formatCurrency(service.sellingPrice)}
          </span>
        </div>
      </div>
      <SelectCheck selected={selected} />
    </div>
  </div>
);

export default PerSideServiceCard;
