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
import { Check, ChevronsUpDown, AlertCircle, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Label } from "@radix-ui/react-label";

const SEARCH_THRESHOLD = 10;
// เพดานสามชั้น กันกล่องยื่นเลยขอบจอจนกดรายการล่างไม่ถึง:
// 300px = ช่องค้นหา + รายการ 6 ตัวครึ่ง (ตัวที่โผล่ครึ่งใบบอกว่าเลื่อนได้อีก)
// 40svh = เผื่อค่าจาก Radix คลาดเคลื่อน (แถบเบราว์เซอร์มือถือยุบได้)
// var() = ที่ว่างจริงระหว่างช่องกับขอบจอที่ Radix คำนวณให้
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
  hideErrorMessage = false,
  // createLabel = ข้อความของแถวเพิ่ม เช่น (text) => `เพิ่มหน่วย "${text}"`
  creatable = false,
  createLabel = (text) => `เพิ่ม "${text}"`,
}) => {
  const showSearch =
    creatable || (searchable ?? options.length > SEARCH_THRESHOLD);

  const getIdentifier = (item) =>
    item && (item.id !== undefined && item.id !== null ? item.id : item.name);

  const selectedLabel =
    options.find((item) => getIdentifier(item) === value)?.name ??
    (creatable && value ? value : undefined);

  const [search, setSearch] = useState("");
  const typed = search.trim();
  const canCreate =
    creatable &&
    typed !== "" &&
    !options.some((item) => item.name.toLowerCase() === typed.toLowerCase());

  const [open, setOpen] = useState(false);
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
    // เปิดใหม่ต้องเริ่มจากรายการเต็ม ไม่ค้างคำที่พิมพ์ค้างไว้รอบก่อน
    if (!open) setSearch("");
  }, [open]);

  // cmdk ไฮไลท์ตัวแรกไว้เอง บนจอสัมผัสดูเหมือนถูกเลือกแล้ว จึงให้เกาะตัวที่เลือกจริงแทน
  useEffect(() => {
    if (open) setHighlighted(selectedLabel || "");
  }, [open, selectedLabel]);

  const hasError = errors && errors[name];

  return (
    <div>
      {label && (
        <Label
          className={`mb-2 block font-medium ${labelClass || "text-xl"} ${color}`}
        >
          {label}
        </Label>
      )}
      <div className="relative z-10">
        {/* modal จำเป็นเมื่ออยู่ในไดอะล็อก เพราะไดอะล็อกล็อกการเลื่อนทั้งหน้า ป็อปอัปที่วาดนอกกล่องจะเลื่อนไม่ได้ */}
        <Popover
          modal
          open={open && !disabled}
          onOpenChange={disabled ? undefined : setOpen}
        >
          <PopoverTrigger asChild>
            <Button
              ref={triggerRef}
              // ให้ตัวช่วยพาไปช่องที่ผิด (หาจาก name) เจอกล่องนี้ด้วย
              name={name}
              aria-invalid={hasError ? "true" : undefined}
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
                // ใช้คลาสไม่ใช่ตั้ง style ตอน onFocus เพราะตัวช่วยพาไปช่องที่ผิดโฟกัสก่อนกรอบแดงจะวาด
                // ถ้าตั้งตอนโฟกัสจะได้สีฟ้าค้างไว้ทั้งที่ช่องผิด
                "focus:!border-2 focus:ring-[3px]",
                hasError
                  ? "border-destructive focus:!border-destructive"
                  : "focus:!border-primary",
                disabled && "cursor-not-allowed opacity-50",
              )}
              style={{
                "--tw-ring-color": hasError
                  ? "rgba(255, 69, 69, 0.3)"
                  : "rgba(25, 118, 210, 0.35)",
                "--tw-border-opacity": "1",
              }}
            >
              <span className="truncate">{selectedLabel || placeholder}</span>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="z-50 my-1 p-0"
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
                  value={search}
                  onValueChange={setSearch}
                  placeholder={creatable ? "ค้นหาหรือเพิ่มใหม่" : "ค้นหา"}
                  className={`font-athiti text-normal h-9 font-medium ${
                    customClass || "text-lg md:text-xl"
                  }`}
                />
              )}
              {/* cmdk ใช้ CommandList เป็นตัวเลื่อน CommandGroup มี overflow-hidden ติดมา สั่งที่นั่นรายการยาวจะถูกตัด */}
              <CommandList className="max-h-none min-h-0 flex-1">
                {!canCreate && (
                  <CommandEmpty>
                    <p
                      className={`font-athiti text-subtle-dark font-medium ${
                        customClass || "text-lg md:text-xl"
                      }`}
                    >
                      ไม่พบรายการ
                    </p>
                  </CommandEmpty>
                )}
                {/* ไม่วาดตอนไม่มีรายการ ไม่งั้น padding ของกลุ่มค้างเป็นช่องว่างใต้ข้อความ */}
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
                {/* forceMount = ไม่ให้ตัวกรองของ cmdk ซ่อนแถวนี้ เพราะข้อความแถวไม่ตรงกับคำค้นเป๊ะ
                    อยู่ท้ายรายการ กด Enter จะได้ตัวที่มีอยู่แล้วก่อน ไม่สร้างซ้ำโดยไม่ตั้งใจ */}
                {canCreate && (
                  <CommandGroup forceMount>
                    <CommandItem
                      forceMount
                      value={`__create__${typed}`}
                      onSelect={() => {
                        onChange(typed);
                        setOpen(false);
                      }}
                      className={`font-athiti text-primary cursor-pointer font-semibold ${
                        customClass || "text-lg md:text-xl"
                      }`}
                    >
                      <Plus className="text-primary mr-2 h-4 w-4" />
                      {createLabel(typed)}
                    </CommandItem>
                  </CommandGroup>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
      {hasError && !hideErrorMessage && (
        <div className="mt-1.5 flex items-center gap-1 px-1">
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
