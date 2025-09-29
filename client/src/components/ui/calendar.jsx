import * as React from "react";
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react";
import { DayPicker, getDefaultClassNames } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = "label",
  buttonVariant = "ghost",
  formatters,
  monthFormat = "short",
  components,
  ...props
}) {
  const defaultClassNames = getDefaultClassNames();

  const initialDisplay = React.useMemo(() => {
    const d = props.month ?? props.defaultMonth ?? new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  }, [props.month, props.defaultMonth]);

  const [viewYear, setViewYear] = React.useState(initialDisplay.getFullYear());
  const [viewMonth, setViewMonth] = React.useState(initialDisplay.getMonth());

  React.useEffect(() => {
    const d = props.month ?? props.defaultMonth;
    if (d) {
      const y = d.getFullYear();
      const m = d.getMonth();
      if (y !== viewYear) setViewYear(y);
      if (m !== viewMonth) setViewMonth(m);
    }
  }, [props.month, props.defaultMonth]);

  const months = React.useMemo(
    () => Array.from({ length: 12 }).map((_, i) => i),
    []
  );

  const formatMonth = (m, y) =>
    new Date(y, m, 1).toLocaleString("th-TH", { month: monthFormat }).trim();

  const handleMonthChange = (date) => {
    const y = date.getFullYear();
    const m = date.getMonth();
    setViewYear(y);
    setViewMonth(m);
    if (props.onMonthChange) props.onMonthChange(date);
  };
  const minYear =
    typeof props.fromYear === "number" ? props.fromYear : viewYear - 10;
  const maxYear =
    typeof props.toYear === "number" ? props.toYear : viewYear + 10;

  return (
    <div
      className={cn(
        "group/calendar w-fit rounded-md [--cell-size:--spacing(8)] p-3 bg-background shadow-sm",
        className
      )}
    >
      <div className="relative w-full h-(--cell-size)">
        <div className="flex items-center justify-center h-(--cell-size)">
          {captionLayout === "dropdown" ? (
            <div className="flex items-center gap-2">
              <Button
                variant={buttonVariant}
                size="icon"
                aria-label="Previous month"
                className="p-0"
                onClick={() =>
                  handleMonthChange(new Date(viewYear, viewMonth - 1, 1))
                }
              >
                <ChevronLeftIcon className="size-4" />
              </Button>

              <div className="relative rounded-md border border-input shadow-xs focus-within:border-primary focus-within:ring-primary/50 focus-within:ring-[3px]">
                <select
                  value={String(viewMonth)}
                  onChange={(e) => {
                    const m = parseInt(e.target.value, 10);
                    setViewMonth(m);
                    handleMonthChange(new Date(viewYear, m, 1));
                  }}
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

              <div className="relative rounded-md border border-input shadow-xs  focus-within:border-primary focus-within:ring-primary/50 focus-within:ring-[3px]">
                <select
                  value={String(viewYear)}
                  onChange={(e) => {
                    const y = parseInt(e.target.value, 10);
                    setViewYear(y);
                    handleMonthChange(new Date(y, viewMonth, 1));
                  }}
                  className="appearance-none h-(--cell-size) px-3 pr-8 rounded-md  font-athiti font-medium text-[16px] bg-transparent focus:outline-none"
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
              <Button
                variant={buttonVariant}
                size="icon"
                aria-label="Next month"
                className="p-0"
                onClick={() =>
                  handleMonthChange(new Date(viewYear, viewMonth + 1, 1))
                }
              >
                <ChevronRightIcon className="size-4" />
              </Button>
            </div>
          ) : (
            <div className=" flex items-center justify-center h-(--cell-size) px-2">
              <p className="font-medium text-[16px] select-none">{`${formatMonth(
                viewMonth,
                viewYear
              )} ${viewYear + 543}`}</p>
            </div>
          )}
        </div>
      </div>

      <DayPicker
        showOutsideDays={showOutsideDays}
        month={new Date(viewYear, viewMonth)}
        onMonthChange={handleMonthChange}
        className={cn(
          "font-athiti bg-background [[data-slot=card-content]_&]:bg-transparent [[data-slot=popover-content]_&]:bg-transparent",
          String.raw`rtl:**:.rdp-button\_next>svg]:rotate-180`,
          String.raw`rtl:**:[.rdp-button\_previous>svg]:rotate-180`
        )}
        captionLayout={captionLayout}
        formatters={{
          formatMonthDropdown: (date) =>
            date.toLocaleString("default", { month: monthFormat }),
          formatWeekdayName: (date) =>
            String(
              date.toLocaleDateString("th-TH", { weekday: "short" })
            ).replace(/\.$/, ""),
          ...formatters,
        }}
        classNames={{
          root: cn("flex justify-center w-full", defaultClassNames.root),
          months: cn(
            "relative flex flex-col md:flex-row items-center justify-center gap-4 mt-[12px]",
            defaultClassNames.months
          ),
          month: cn("flex flex-col w-auto gap-4", defaultClassNames.month),
          nav: cn(
            "absolute top-0 inset-x-0 flex justify-between items-center w-full gap-1",
            defaultClassNames.nav
          ),
          button_previous: cn(
            captionLayout === "dropdown"
              ? "hidden"
              : buttonVariants({ variant: buttonVariant }),
            captionLayout === "dropdown"
              ? ""
              : "size-(--cell-size) aria-disabled:opacity-50 p-0 select-none",
            defaultClassNames.button_previous
          ),
          button_next: cn(
            captionLayout === "dropdown"
              ? "hidden"
              : buttonVariants({ variant: buttonVariant }),
            captionLayout === "dropdown"
              ? ""
              : "size-(--cell-size) aria-disabled:opacity-50 p-0 select-none",
            defaultClassNames.button_next
          ),
          month_caption: cn(
            captionLayout === "dropdown"
              ? "hidden"
              : "flex items-center justify-center h-(--cell-size) w-full px-(--cell-size)",
            defaultClassNames.month_caption
          ),
          dropdowns: cn(
            "w-full flex items-center text-sm font-medium justify-center h-(--cell-size) gap-1.5",
            defaultClassNames.dropdowns
          ),
          dropdown_root: cn(
            "relative has-focus:border-primary border border-input shadow-xs has-focus:ring-primary/50 has-focus:ring-[3px] rounded-md",
            defaultClassNames.dropdown_root
          ),
          dropdown: cn(
            "absolute bg-popover inset-0 opacity-0",
            defaultClassNames.dropdown
          ),
          caption_label: cn(
            "select-none font-medium",
            captionLayout === "label"
              ? "text-sm"
              : "rounded-md pl-2 pr-1 flex items-center gap-1 text-sm h-8 [&>svg]:text-muted-foreground [&>svg]:size-3.5",
            defaultClassNames.caption_label
          ),
          table: "w-auto mx-auto border-collapse",
          weekdays: cn("flex", defaultClassNames.weekdays),
          weekday: cn(
            "text-muted-foreground rounded-md flex-1 font-semibold text-[16px] text-primary select-none",
            defaultClassNames.weekday
          ),
          week: cn("flex w-full mt-2", defaultClassNames.week),
          week_number_header: cn(
            "select-none w-(--cell-size)",
            defaultClassNames.week_number_header
          ),
          week_number: cn(
            "text-[0.8rem] select-none text-muted-foreground",
            defaultClassNames.week_number
          ),
          day: cn(
            "relative w-full h-full p-0 text-center [&:first-child[data-selected=true]_button]:rounded-l-md [&:last-child[data-selected=true]_button]:rounded-r-md group/day aspect-square select-none",
            defaultClassNames.day
          ),
          range_start: cn(
            "rounded-l-md bg-accent",
            defaultClassNames.range_start
          ),
          range_middle: cn("rounded-none", defaultClassNames.range_middle),
          range_end: cn("rounded-r-md bg-accent", defaultClassNames.range_end),
          today: cn(
            "bg-accent text-accent-foreground rounded-md data-[selected=true]:rounded-none",
            defaultClassNames.today
          ),
          outside: cn(
            "text-muted-foreground aria-selected:text-muted-foreground",
            defaultClassNames.outside
          ),
          disabled: cn(
            "text-muted-foreground opacity-50",
            defaultClassNames.disabled
          ),
          hidden: cn("invisible", defaultClassNames.hidden),
          ...classNames,
        }}
        components={{
          Root: ({ className, rootRef, ...props }) => {
            return (
              <div
                data-slot="calendar"
                ref={rootRef}
                className={cn(className)}
                {...props}
              />
            );
          },
          Chevron: ({ className, orientation, ...props }) => {
            if (orientation === "left") {
              return (
                <ChevronLeftIcon
                  className={cn("size-4", className)}
                  {...props}
                />
              );
            }

            if (orientation === "right") {
              return (
                <ChevronRightIcon
                  className={cn("size-4", className)}
                  {...props}
                />
              );
            }

            return (
              <ChevronDownIcon className={cn("size-4", className)} {...props} />
            );
          },
          DayButton: CalendarDayButton,
          WeekNumber: ({ children, ...props }) => {
            return (
              <td {...props}>
                <div className="flex items-center justify-center size-(--cell-size) text-center">
                  {children}
                </div>
              </td>
            );
          },
          ...components,
        }}
        {...props}
      />
    </div>
  );
}

function CalendarDayButton({ className, day, modifiers, ...props }) {
  const defaultClassNames = getDefaultClassNames();

  const ref = React.useRef(null);
  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus();
  }, [modifiers.focused]);

  return (
    <Button
      ref={ref}
      variant="ghost"
      size="icon"
      data-day={day.date.toLocaleDateString()}
      data-selected-single={
        modifiers.selected &&
        !modifiers.range_start &&
        !modifiers.range_end &&
        !modifiers.range_middle
      }
      data-range-start={modifiers.range_start}
      data-range-end={modifiers.range_end}
      data-range-middle={modifiers.range_middle}
      className={cn(
        "min-w-[42px] min-h-[42px] text-[16px] data-[selected-single=true]:bg-primary data-[selected-single=true]:text-primary-foreground data-[range-middle=true]:bg-accent data-[range-middle=true]:text-accent-foreground data-[range-start=true]:bg-primary data-[range-start=true]:text-primary-foreground data-[range-end=true]:bg-primary data-[range-end=true]:text-primary-foreground group-data-[focused=true]/day:border-primary group-data-[focused=true]/day:ring-primary/50 dark:hover:text-accent-foreground flex aspect-square size-auto w-full flex-col gap-1 leading-none font-normal group-data-[focused=true]/day:relative group-data-[focused=true]/day:z-10 group-data-[focused=true]/day:ring-[3px] data-[range-end=true]:rounded-md data-[range-end=true]:rounded-r-md data-[range-middle=true]:rounded-none data-[range-start=true]:rounded-md data-[range-start=true]:rounded-l-md [&>p]:text-sm [&>p]:opacity-90",
        defaultClassNames.day,
        className
      )}
      {...props}
    />
  );
}

export { Calendar, CalendarDayButton };
