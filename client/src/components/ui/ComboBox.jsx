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
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Label } from "@radix-ui/react-label";

const ComboBox = ({ label, options = [], value, onChange, placeholder }) => {
  const [open, setOpen] = useState(false);
  const [triggerWidth, setTriggerWidth] = useState(0);
  const triggerRef = useRef(null);

  useEffect(() => {
    if (triggerRef.current) {
      setTriggerWidth(triggerRef.current.offsetWidth);
    }
  }, [open]);

  const selectedLabel = options.find((item) => item.id === value)?.name;

  return (
    <div className="px-[20px] pt-[16px]">
      <Label className="block mb-[8px] font-medium text-[18px] text-subtle-dark">
        {label}
      </Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            ref={triggerRef}
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "w-full h-[40px] justify-between border-input rounded-[20px] font-normal text-[16px] text-foreground",
              !selectedLabel && "text-muted-foreground"
            )}
          >
            {selectedLabel || placeholder}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
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
              {options.map((item) => (
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
                      "mr-2 h-4 w-4",
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
  );
};

export default ComboBox;
