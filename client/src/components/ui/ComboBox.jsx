import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  Command,
  CommandInput,
  CommandEmpty,
  CommandGroup,
  CommandList,
  CommandItem,
} from "@/components/ui/command";
import { Check, ChevronsUpDown, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Label } from "@radix-ui/react-label";

const SEARCH_THRESHOLD = 10;
// 300px = ช่องค้นหา + รายการ 6 ตัวครึ่ง (ตัวที่โผล่ครึ่งใบคือสัญญาณว่าเลื่อนได้อีก)
// --radix-popover-content-available-height = ที่ว่างจริงระหว่างช่องกับขอบจอ
// ถ้าไม่คุมด้วยค่านี้ กล่องจะยื่นเลยขอบจอลงไป แล้วรายการล่างๆ จะกดไม่ถึงเพราะป็อปอัปเป็น fixed
// เพดานสามชั้น กันกล่องยื่นเลยขอบจอ:
// 300px = ช่องค้นหา + รายการ 6 ตัวครึ่ง (ตัวที่โผล่ครึ่งใบคือสัญญาณว่าเลื่อนได้อีก)
// 40svh  = เพดานตายตัวเผื่อกรณีที่ค่าจาก Radix คลาดเคลื่อน (มือถือมีแถบเบราว์เซอร์ยุบได้)
// var()  = ที่ว่างจริงระหว่างช่องกับขอบจอที่ Radix คำนวณให้
const POPOVER_MAX_HEIGHT =
  "min(300px, 40svh, var(--radix-popover-content-available-height, 40svh))";

const ComboBox = ({
  label,
  labelClass = "",
  color,
  options = [],
  value,
  onChange,
  placeholder,
  errors,
  name,
  disabled = false,
  customClass = "",
  searchable,
}) => {
  // เกิน 10 ตัวเลือกค่อยมีช่องค้นหา — น้อยกว่านั้นกวาดตาหาเร็วกว่าพิมพ์
  // ส่งค่า searchable มาเองได้ถ้าต้องการบังคับ
  const showSearch = searchable ?? options.length > SEARCH_THRESHOLD;

  const getIdentifier = (item) =>
    item && (item.id !== undefined && item.id !== null ? item.id : item.name);

  const selectedLabel = options.find(
    (item) => getIdentifier(item) === value,
  )?.name;

  const [open, setOpen] = useState(false);
  // ตัวที่ถูกไฮไลท์อยู่ใน cmdk — คุมเองเพื่อไม่ให้ไปเกาะตัวแรกทุกครั้งที่เปิด
  const [highlighted, setHighlighted] = useState("");
  const [triggerWidth, setTriggerWidth] = useState(0);
  const triggerRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (triggerRef.current) {
      setTriggerWidth(triggerRef.current.offsetWidth);
    }
  }, [open]);

  useEffect(() => {
    if (!open && inputRef.current) {
      inputRef.current.blur();
    }
  }, [open]);

  // โดยปริยาย cmdk จะไฮไลท์ตัวแรกไว้ให้กด Enter ได้ทันที
  // แต่บนจอสัมผัสมันดูเหมือนตัวแรกถูกเลือกไว้แล้ว ทั้งที่ยังไม่ได้เลือกอะไร
  // จึงให้ไฮไลท์ไปเกาะตัวที่เลือกไว้จริง ถ้ายังไม่เลือกก็ไม่ต้องไฮไลท์อะไรเลย
  // (พอเริ่มพิมพ์ค้นหา cmdk จะเลื่อนไฮไลท์ไปที่ผลลัพธ์แรกเอง ซึ่งถูกแล้วสำหรับการกด Enter)
  useEffect(() => {
    if (open) setHighlighted(selectedLabel || "");
  }, [open, selectedLabel]);

  const hasError = errors && errors[name];

  return (
    <div>
      {label && (
        <Label
          // ขนาดเดียวกับป้ายชื่อของ FormInput เพื่อให้ฟอร์มเดียวกันดูเป็นชุดเดียว
          className={`mb-[8px] block font-medium ${labelClass || "text-xl"} ${color}`}
        >
          {label}
        </Label>
      )}
      <div className="relative z-10">
        {/* modal = ป็อปอัปจัดการล็อกการเลื่อนเอง
            จำเป็นเมื่อ ComboBox อยู่ในไดอะล็อก เพราะไดอะล็อกล็อกการเลื่อนทั้งหน้าไว้
            แล้วยอมให้เลื่อนเฉพาะของที่อยู่ในกล่องมัน ส่วนป็อปอัปถูกวาดที่ระดับ body ซึ่งอยู่นอกกล่อง
            ถ้าไม่ตั้ง รายการยาวๆ จะเลื่อนไม่ได้เลย (หน้าที่ไม่มีไดอะล็อกครอบไม่เจอปัญหานี้) */}
        <Popover
          modal
          open={open && !disabled}
          onOpenChange={disabled ? undefined : setOpen}
        >
          <PopoverTrigger asChild>
            <Button
              ref={triggerRef}
              variant="outline"
              role="combobox"
              aria-expanded={open}
              disabled={disabled}
              className={cn(
                "border-input text-foreground h-[41px] w-full cursor-pointer justify-between rounded-[20px] font-medium",
                customClass || "text-xl md:text-[22px]",
                !selectedLabel &&
                  (customClass
                    ? "text-muted-foreground font-light"
                    : "text-muted-foreground text-lg font-light md:text-xl"),
                hasError && "focus:border-destructive border-destructive",
                disabled && "cursor-not-allowed opacity-50",
              )}
              style={{
                "--tw-ring-color": hasError
                  ? "var(--color-destructive)"
                  : "var(--color-primary)",
                "--tw-border-opacity": "1",
              }}
              onFocus={(e) => {
                if (disabled) return;
                if (hasError) {
                  e.target.style.borderColor = "var(--color-destructive)";
                  e.target.style.borderWidth = "2px";
                  e.target.style.boxShadow = "0 0 0 3px rgba(255, 69, 69, 0.3)";
                } else {
                  e.target.style.borderColor = "var(--color-primary)";
                  e.target.style.borderWidth = "2px";
                  e.target.style.boxShadow = "0 0 0 3px rgba(25,118,210,0.35)";
                }
              }}
              onBlur={(e) => {
                if (disabled) return;
                e.target.style.borderColor = "";
                e.target.style.borderWidth = "";
                e.target.style.boxShadow = "";
              }}
            >
              {/* ตัดคำแทนที่จะดันลูกศรทะลุขอบ เวลาช่องแคบกว่าข้อความ (เช่นวางสองช่องในบรรทัดเดียว) */}
              <span className="truncate">{selectedLabel || placeholder}</span>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="z-50 my-[4px] p-0"
            style={{
              width: triggerWidth > 0 ? `${triggerWidth}px` : "auto",
              maxHeight: POPOVER_MAX_HEIGHT,
            }}
            side="bottom"
            align="start"
            sideOffset={4}
            avoidCollisions={true}
            collisionPadding={16}
            sticky="partial"
            onOpenAutoFocus={(e) => e.preventDefault()}
          >
            <Command
              value={highlighted}
              onValueChange={setHighlighted}
              className="flex flex-col"
              style={{ maxHeight: POPOVER_MAX_HEIGHT }}
              shouldFilter={showSearch}
            >
              {showSearch && (
                <CommandInput
                  ref={inputRef}
                  placeholder="ค้นหา"
                  className={`font-athiti text-normal h-9 font-medium ${
                    customClass || "text-lg md:text-xl"
                  }`}
                />
              )}
              {/* cmdk ใช้ CommandList เป็นตัวเลื่อนโดยเฉพาะ — ก่อนหน้านี้ไปสั่ง overflow ที่ CommandGroup
                  ซึ่งมี overflow-hidden ติดมาในตัวอยู่แล้ว รายการยาวจึงถูกตัดทิ้งโดยเลื่อนไม่ได้ */}
              <CommandList className="max-h-none min-h-0 flex-1">
                <CommandEmpty>
                  <p
                    className={`font-athiti text-subtle-dark font-medium ${
                      customClass || "text-lg md:text-xl"
                    }`}
                  >
                    ไม่พบรายการ
                  </p>
                </CommandEmpty>
                {/* ไม่วาดตอนไม่มีรายการ เพราะ padding ของกลุ่มจะค้างเป็นช่องว่าง 8px ใต้ข้อความ "ไม่พบรายการ" */}
                {options.length > 0 && (
                  <CommandGroup>
                    {options.map((item) => {
                      const identifier = getIdentifier(item);
                      return (
                        <CommandItem
                          key={identifier}
                          value={item.name}
                          onSelect={() => {
                            onChange(identifier);
                            setOpen(false);

                            if (inputRef.current) {
                              inputRef.current.blur();
                            }
                          }}
                          className={`font-athiti text-normal cursor-pointer font-medium ${
                            customClass || "text-lg md:text-xl"
                          }`}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              value === identifier
                                ? "opacity-100"
                                : "opacity-0",
                            )}
                          />
                          {item.name}
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
      {hasError && (
        <div className="mt-[6px] flex items-center gap-[4px] px-[4px]">
          <AlertCircle className="text-destructive h-4 w-4 flex-shrink-0" />
          <p className="text-destructive text-lg font-medium md:text-xl">
            {errors[name].message}
          </p>
        </div>
      )}
    </div>
  );
};

export default ComboBox;
