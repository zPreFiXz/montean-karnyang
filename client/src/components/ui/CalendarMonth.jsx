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

  const initialMonth =
    selected instanceof Date ? selected.getMonth() : new Date().getMonth();

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

  const months = React.useMemo(
    () => Array.from({ length: 12 }).map((_, i) => i),
    []
  );

  const commit = (y, m) => {
    if (onSelect) onSelect(new Date(y, m, 1));
  };

  const formatMonth = (m, y) =>
    new Date(y, m, 1).toLocaleString("th-TH", { month: monthFormat }).trim();

  return (
    <div
      className={cn(
        "group/calendar w-fit [--cell-size:--spacing(8)] p-3 rounded-md bg-background shadow-sm",
        className
      )}
    >
      <div className="relative w-full h-(--cell-size)">
        <div className="flex items-center justify-center h-(--cell-size)">
          {captionLayout === "dropdown" ? (
            <div className="flex items-center gap-2">
              <div className="relative rounded-md border border-input shadow-xs focus-within:border-primary focus-within:ring-primary/50 focus-within:ring-[3px]">
                <select
                  value={String(viewMonth)}
                  onChange={(e) => {
                    const m = parseInt(e.target.value, 10);
                    setViewMonth(m);
                    commit(viewYear, m);
                  }}
                  ref={monthSelectRef}
                  className="appearance-none h-(--cell-size) pl-3 pr-6 rounded-md font-athiti font-medium text-[16px] bg-transparent focus:outline-none"
                >
                  {months.map((m) => (
                    <option key={m} value={String(m)}>
                      {formatMonth(m, viewYear)}
                    </option>
                  ))}
                </select>
                <ChevronDownIcon className="absolute right-2 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
              </div>

              <div className="relative rounded-md border border-input shadow-xs focus-within:border-primary focus-within:ring-primary/50 focus-within:ring-[3px]">
                <select
                  value={String(viewYear)}
                  onChange={(e) => {
                    const y = parseInt(e.target.value, 10);
                    setViewYear(y);
                    commit(y, viewMonth);
                  }}
                  className="appearance-none h-(--cell-size) px-3 pr-8 rounded-md font-athiti font-medium text-[16px] bg-transparent focus:outline-none"
                >
                  {Array.from({ length: maxYear - minYear + 1 }).map(
                    (_, idx) => {
                      const y = minYear + idx;
                      const be = y + 543;
                      return (
                        <option key={y} value={String(y)}>
                          {be}
                        </option>
                      );
                    }
                  )}
                </select>
                <ChevronDownIcon className="absolute right-2 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-(--cell-size) px-2">
              <p className="font-medium text-[16px] select-none">{`${formatMonth(
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
