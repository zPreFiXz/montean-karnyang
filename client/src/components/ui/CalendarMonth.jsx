import * as React from "react";
import { cn } from "@/lib/utils";
import { ChevronDownIcon } from "lucide-react";

function CalendarMonth({
  className,
  selected,
  onSelect,
  fromYear,
  toYear,
  captionLayout = "dropdown",
  year,
  autoFocus = false,
  monthFormat = "short",
}) {
  const monthSelectRef = React.useRef(null);
  const initialYear = React.useMemo(() => {
    if (selected instanceof Date) return selected.getFullYear();
    return typeof year === "number" ? year : new Date().getFullYear();
  }, [selected, year]);

  const initialMonth = selected instanceof Date ? selected.getMonth() : new Date().getMonth();

  const [viewYear, setViewYear] = React.useState(initialYear);
  const [viewMonth, setViewMonth] = React.useState(initialMonth);

  React.useEffect(() => {
    if (selected instanceof Date) {
      const y = selected.getFullYear();
      const m = selected.getMonth();
      if (y !== viewYear) setViewYear(y);
      if (m !== viewMonth) setViewMonth(m);
    } else if (typeof year === "number" && year !== viewYear) {
      setViewYear(year);
    }
    if (autoFocus && monthSelectRef.current) {
      monthSelectRef.current.focus();
    }
  }, [selected, year]);

  const minYear = React.useMemo(
    () => (typeof fromYear === "number" ? fromYear : initialYear - 10),
    [fromYear, initialYear]
  );
  const maxYear = React.useMemo(
    () => (typeof toYear === "number" ? toYear : initialYear + 10),
    [toYear, initialYear]
  );

  const months = React.useMemo(() => Array.from({ length: 12 }).map((_, i) => i), []);

  const commit = (y, m) => {
    if (onSelect) onSelect(new Date(y, m, 1));
  };

  const formatMonth = (m, y) =>
    new Date(y, m, 1).toLocaleString("th-TH", { month: monthFormat }).trim();

  return (
    <div
      className={cn(
        "group/calendar bg-background w-fit rounded-md p-3 shadow-sm [--cell-size:--spacing(8)]",
        className
      )}
    >
      <div className="relative h-(--cell-size) w-full">
        <div className="flex h-(--cell-size) items-center justify-center">
          {captionLayout === "dropdown" ? (
            <div className="flex items-center gap-2">
              <div className="border-input focus-within:border-primary focus-within:ring-primary/50 relative rounded-md border shadow-xs focus-within:ring-[3px]">
                <select
                  value={String(viewMonth)}
                  onChange={(e) => {
                    const m = parseInt(e.target.value, 10);
                    setViewMonth(m);
                    commit(viewYear, m);
                  }}
                  ref={monthSelectRef}
                  className="font-athiti h-(--cell-size) cursor-pointer appearance-none rounded-md bg-transparent pr-6 pl-3 text-[16px] font-medium focus:outline-none"
                >
                  {months.map((m) => (
                    <option key={m} value={String(m)}>
                      {formatMonth(m, viewYear)}
                    </option>
                  ))}
                </select>
                <ChevronDownIcon className="text-muted-foreground pointer-events-none absolute top-1/2 right-2 size-3.5 -translate-y-1/2" />
              </div>

              <div className="border-input focus-within:border-primary focus-within:ring-primary/50 relative rounded-md border shadow-xs focus-within:ring-[3px]">
                <select
                  value={String(viewYear)}
                  onChange={(e) => {
                    const y = parseInt(e.target.value, 10);
                    setViewYear(y);
                    commit(y, viewMonth);
                  }}
                  className="font-athiti h-(--cell-size) cursor-pointer appearance-none rounded-md bg-transparent px-3 pr-8 text-[16px] font-medium focus:outline-none"
                >
                  {Array.from({ length: maxYear - minYear + 1 }).map((_, idx) => {
                    const y = minYear + idx;
                    const be = y + 543;
                    return (
                      <option key={y} value={String(y)}>
                        {be}
                      </option>
                    );
                  })}
                </select>
                <ChevronDownIcon className="text-muted-foreground pointer-events-none absolute top-1/2 right-2 size-3.5 -translate-y-1/2" />
              </div>
            </div>
          ) : (
            <div className="flex h-(--cell-size) items-center justify-center px-2">
              <p className="text-[16px] font-medium select-none">{`${formatMonth(
                viewMonth,
                viewYear
              )} ${viewYear + 543}`}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export { CalendarMonth };
