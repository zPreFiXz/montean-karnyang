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
    (item) => getIdentifier(item) === value,
  )?.name;
  const hasError = errors && errors[name];

  return (
    <div>
      {label && (
        <Label
          className={`mb-[8px] block font-medium ${
            labelClass ||
            (customClass
              ? "text-[18px] md:text-[20px]"
              : "text-[22px] md:text-[24px]")
          } ${color}`}
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
                "border-input text-foreground h-[41px] w-full cursor-pointer justify-between rounded-[20px] font-medium",
                customClass || "text-[20px] md:text-[22px]",
                !selectedLabel &&
                  (customClass
                    ? "text-muted-foreground font-light"
                    : "text-muted-foreground text-[18px] font-light md:text-[20px]"),
                hasError && "focus:border-destructive border-destructive",
                disabled && "cursor-not-allowed opacity-50",
              )}
              style={{
                "--tw-ring-color": hasError ? "var(--color-destructive)" : "var(--color-primary)",
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
              {selectedLabel || placeholder}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="z-50 my-[4px] p-0"
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
                className={`font-athiti text-normal h-9 font-medium ${
                  customClass || "text-[18px] md:text-[20px]"
                }`}
              />
              <CommandEmpty>
                <p
                  className={`font-athiti text-subtle-dark font-medium ${
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

                        if (inputRef.current) {
                          inputRef.current.blur();
                        }
                      }}
                      className={`font-athiti text-normal cursor-pointer font-medium ${
                        customClass || "text-[18px] md:text-[20px]"
                      }`}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value === identifier ? "opacity-100" : "opacity-0",
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
        <div className="mt-[6px] flex items-center gap-[4px] px-[4px]">
          <AlertCircle className="text-destructive h-4 w-4 flex-shrink-0" />
          <p className="text-destructive text-[18px] font-medium md:text-[20px]">
            {errors[name].message}
          </p>
        </div>
      )}
    </div>
  );
};

export default ComboBox;
