import { useState } from "react";
import { Calendar as CalendarIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import FieldErrorList from "@/components/forms/FieldErrorList";
import { formatDate } from "@/utils/formats";

// วันที่เก็บเป็น ปปปป-ดด-วว ตามเวลาท้องถิ่น ไม่ผ่าน toISOString ไม่งั้นวันเลื่อนตามเขตเวลา
const toDateValue = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const fromDateValue = (value) => {
  const [year, month, day] = String(value || "")
    .split("-")
    .map(Number);
  return year ? new Date(year, month - 1, day) : undefined;
};

// หน้าตาเหมือนช่องเลือกวิธีชำระเงิน เปิดปฏิทินแบบเดียวกับหน้ารายงาน ใช้ทั้งวันที่บนเช็คและกำหนดชำระ
const DateField = ({
  label,
  name,
  value,
  onChange,
  error,
  disabled = false,
  // ช่องที่ต้องมีวันที่เสมอ (เช่น วันที่รับของ) ไม่มีกากบาท
  clearable = true,
}) => {
  const [open, setOpen] = useState(false);
  const selected = fromDateValue(value);

  return (
    <>
      <div className="flex items-center justify-between gap-2">
        <p className="text-subtle-dark text-lg font-medium md:text-xl">
          {label}
        </p>
        {/* กากบาทอยู่นอกปุ่มเปิดปฏิทิน (ปุ่มซ้อนปุ่มไม่ได้) จึงวางทับมุมขวาของช่อง */}
        <div className="relative w-52.5 shrink-0 md:w-60">
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                name={name}
                variant="outline"
                disabled={disabled}
                aria-invalid={error ? "true" : undefined}
                className={`h-[41px] w-full cursor-pointer justify-between rounded-[20px] text-lg focus:!border-2 focus:ring-[3px] md:text-xl ${
                  selected
                    ? "text-foreground font-medium"
                    : "text-muted-foreground font-light"
                } ${
                  error
                    ? "border-destructive focus:!border-destructive"
                    : "border-input focus:!border-primary"
                }`}
                style={{
                  "--tw-ring-color": error
                    ? "rgba(255, 69, 69, 0.3)"
                    : "rgba(25, 118, 210, 0.35)",
                }}
              >
                <span className="truncate">
                  {selected ? formatDate(selected) : "-- เลือกวันที่ --"}
                </span>
                {selected && clearable ? (
                  <span className="h-4 w-4 shrink-0" />
                ) : (
                  <CalendarIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-auto p-0"
              align="end"
              onOpenAutoFocus={(e) => e.preventDefault()}
            >
              <Calendar
                mode="single"
                selected={selected}
                defaultMonth={selected || new Date()}
                // กดวันเดิมซ้ำก็ล้างวันที่ได้เหมือนกากบาท
                onSelect={(date) => {
                  onChange(date ? toDateValue(date) : "");
                  setOpen(false);
                }}
                captionLayout="dropdown"
                fromYear={2025}
                toYear={2035}
                monthFormat="long"
                className="rounded-md shadow-sm"
              />
            </PopoverContent>
          </Popover>
          {selected && !disabled && clearable && (
            <button
              type="button"
              onClick={() => onChange("")}
              aria-label="ล้างวันที่"
              className="text-subtle-dark absolute top-1/2 right-1 flex h-9 w-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
      <FieldErrorList messages={[error]} className="items-end" />
    </>
  );
};

export default DateField;
