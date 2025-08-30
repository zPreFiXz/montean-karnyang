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
  options = [],
  value,
  onChange,
  placeholder,
  errors,
  name,
  disabled = false,
}) => {
  const [open, setOpen] = useState(false);
  const [triggerWidth, setTriggerWidth] = useState(0);
  const triggerRef = useRef(null);

  useEffect(() => {
    if (triggerRef.current) {
      setTriggerWidth(triggerRef.current.offsetWidth);
    }
  }, [open]);

  const selectedLabel = options.find((item) => item.id === value)?.name;
  const hasError = errors && errors[name];

  return (
    <div className="px-[20px] pt-[16px]">
      <Label className="block mb-[8px] font-medium text-[18px] text-subtle-dark">
        {label}
      </Label>
      <div className="relative">
        <Popover open={open && !disabled} onOpenChange={disabled ? undefined : setOpen}>
          <PopoverTrigger asChild>
            <Button
              ref={triggerRef}
              variant="outline"
              role="combobox"
              aria-expanded={open}
              disabled={disabled}
              className={cn(
                "justify-between w-full h-[40px] rounded-[20px] border-input font-normal text-[16px] text-foreground",
                !selectedLabel && "text-muted-foreground",
                hasError && "border-red-400 focus:border-red-500",
                disabled && "opacity-50 cursor-not-allowed"
              )}
              style={{
                "--tw-ring-color": hasError ? "#FF4545" : "#5b46f4",
                "--tw-border-opacity": "1",
              }}
              onFocus={(e) => {
                if (disabled) return;
                if (hasError) {
                  e.target.style.borderColor = "#FF4545";
                  e.target.style.borderWidth = "2px";
                  e.target.style.boxShadow = "0 0 0 3px rgba(255, 69, 69, 0.3)";
                } else {
                  e.target.style.borderColor = "#5b46f4";
                  e.target.style.borderWidth = "2px";
                  e.target.style.boxShadow = "0 0 0 3px rgba(91, 70, 244, 0.3)";
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
              <ChevronsUpDown className="shrink-0  h-4 w-4 ml-2 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="p-0"
            style={{ width: triggerWidth > 0 ? `${triggerWidth}px` : "auto" }}
          >
            <Command>
              <CommandInput
                placeholder="ค้นหา..."
                className="h-9 font-athiti text-subtle-dark"
              />
              <CommandEmpty>
                <p className="font-athiti text-[16px] text-subtle-dark">
                  ไม่มีหมวดหมู่ที่ตรงกัน
                </p>
              </CommandEmpty>
              <CommandGroup>
                {options
                  .sort((a, b) => a.id - b.id)
                  .map((item) => (
                    <CommandItem
                      key={item.id}
                      value={item.name}
                      onSelect={() => {
                        onChange(item.id);
                        setOpen(false);
                      }}
                      className="font-athiti text-[16px] text-subtle-dark"
                    >
                      <Check
                        className={cn(
                          "h-4 w-4 mr-2",
                          value === item.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {item.name}
                    </CommandItem>
                  ))}
              </CommandGroup>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
      {hasError && (
        <div className="flex items-center gap-[4px] px-[4px] mt-[6px]">
          <AlertCircle className="flex-shrink-0 w-4 h-4 text-delete" />
          <p className="font-medium text-[14px] text-delete">
            {errors[name].message}
          </p>
        </div>
      )}
    </div>
  );
};

export default ComboBox;
