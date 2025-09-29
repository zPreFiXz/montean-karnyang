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
  CommandItem,
} from "@/components/ui/command";
import { Check, ChevronsUpDown, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Label } from "@radix-ui/react-label";

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
}) => {
  const [open, setOpen] = useState(false);
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

  const getIdentifier = (item) =>
    item && (item.id !== undefined && item.id !== null ? item.id : item.name);

  const selectedLabel = options.find(
    (item) => getIdentifier(item) === value
  )?.name;
  const hasError = errors && errors[name];

  return (
    <div>
      {label && (
        <Label
          className={`block mb-[8px] font-medium ${labelClass || (customClass
            ? "text-[18px] md:text-[20px]"
            : "text-[22px] md:text-[24px]") } ${color}`}
        >
          {label}
        </Label>
      )}
      <div className="relative z-10">
        <Popover
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
                "justify-between w-full h-[41px] rounded-[20px] border-input font-medium text-foreground",
                customClass || "text-[20px] md:text-[22px]",
                !selectedLabel &&
                  (customClass
                    ? "font-light text-muted-foreground"
                    : "font-light text-[18px] md:text-[20px] text-muted-foreground"),
                hasError && "border-red-400 focus:border-delete",
                disabled && "opacity-50 cursor-not-allowed"
              )}
              style={{
                "--tw-ring-color": hasError ? "#FF4545" : "#1976d2",
                "--tw-border-opacity": "1",
              }}
              onFocus={(e) => {
                if (disabled) return;
                if (hasError) {
                  e.target.style.borderColor = "#FF4545";
                  e.target.style.borderWidth = "2px";
                  e.target.style.boxShadow = "0 0 0 3px rgba(255, 69, 69, 0.3)";
                } else {
                  e.target.style.borderColor = "#1976d2";
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
              {selectedLabel || placeholder}
              <ChevronsUpDown className="shrink-0 h-4 w-4 ml-2 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="z-50 p-0 my-[4px]"
            style={{
              width: triggerWidth > 0 ? `${triggerWidth}px` : "auto",
              maxHeight: "300px",
            }}
            side="bottom"
            align="start"
            sideOffset={4}
            avoidCollisions={true}
            sticky="partial"
            onOpenAutoFocus={(e) => e.preventDefault()}
          >
            <Command className="max-h-[300px]">
              <CommandInput
                ref={inputRef}
                placeholder="ค้นหา..."
                className={`h-9 font-athiti font-medium text-normal ${
                  customClass || "text-[18px] md:text-[20px]"
                }`}
              />
              <CommandEmpty>
                <p
                  className={`font-athiti font-medium text-subtle-dark ${
                    customClass || "text-[18px] md:text-[20px]"
                  }`}
                >
                  ไม่พบข้อมูล
                </p>
              </CommandEmpty>
              <CommandGroup className="max-h-[250px] overflow-y-auto">
                {options.map((item) => {
                  const identifier = getIdentifier(item);
                  return (
                    <CommandItem
                      key={identifier}
                      value={item.name}
                      onSelect={() => {
                        onChange(identifier);
                        setOpen(false);
                        // Blur input เพื่อปิดแป้นพิมพ์
                        if (inputRef.current) {
                          inputRef.current.blur();
                        }
                      }}
                      className={`font-athiti font-medium text-normal ${
                        customClass || "text-[18px] md:text-[20px]"
                      }`}
                    >
                      <Check
                        className={cn(
                          "h-4 w-4 mr-2",
                          value === identifier ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {item.name}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
      {hasError && name !== "province" && (
        <div className="flex items-center gap-[4px] px-[4px] mt-[6px]">
          <AlertCircle className="flex-shrink-0 w-4 h-4 text-delete" />
          <p className="font-medium text-[18px] md:text-[20px] text-delete">
            {errors[name].message}
          </p>
        </div>
      )}
    </div>
  );
};

export default ComboBox;
