import { useSearchParams } from "react-router";
import { Search, X } from "lucide-react";
import { useDebouncedCallback } from "use-debounce";
import { useState, useEffect } from "react";
import { Input } from "../ui/input";

const SearchBar = ({
  placeholder,
  onSearch = null,
  value = null,
  autoFocus = false,
  inputMode = "text",
}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [inputValue, setInputValue] = useState("");

  const isControlled = onSearch !== null && value !== null;

  useEffect(() => {
    if (isControlled) {
      setInputValue(value);
    } else {
      const searchParam = searchParams.get("search") || "";
      setInputValue(searchParam);
    }
  }, [isControlled, value, searchParams]);

  const updateSearch = useDebouncedCallback((value) => {
    if (isControlled) {
      onSearch(value);
    } else {
      const params = new URLSearchParams(searchParams);
      if (value) {
        params.set("search", value);
      } else {
        params.delete("search");
      }
      setSearchParams(params);
    }
  }, 500);

  const handleSearch = (e) => {
    const value = e.target.value;
    setInputValue(value);
    updateSearch(value);
  };

  const handleClear = () => {
    setInputValue("");
    if (isControlled) {
      onSearch("");
    } else {
      const params = new URLSearchParams(searchParams);
      params.delete("search");
      setSearchParams(params);
    }
  };

  return (
    <div className="relative flex items-center">
      <div className="text-subtle-dark pointer-events-none absolute left-[16px] flex h-full items-center">
        <Search size={20} />
      </div>

      <Input
        type="text"
        value={inputValue}
        onChange={handleSearch}
        placeholder={placeholder}
        autoFocus={autoFocus}
        inputMode={inputMode}
        onTouchStart={(e) => {
          if (inputMode === "none") {
            e.target.inputMode = "text";
          }
        }}
        onClick={(e) => {
          if (inputMode === "none") {
            e.target.inputMode = "text";
          }
        }}
        className="font-athiti bg-surface h-[41px] w-full rounded-[20px] px-[40px] text-[20px] font-medium placeholder:text-[18px] placeholder:font-light focus:outline-none md:text-[22px] md:placeholder:text-[20px]"
        style={{
          "--tw-ring-color": "var(--color-primary)",
          "--tw-border-opacity": "1",
        }}
        onFocus={(e) => {
          e.target.style.borderColor = "var(--color-primary)";
          e.target.style.borderWidth = "2px";
          e.target.style.boxShadow = "0 0 0 3px rgba(25, 118, 210, 0.35)";
        }}
        onBlur={(e) => {
          e.target.style.borderColor = "";
          e.target.style.borderWidth = "";
          e.target.style.boxShadow = "";
        }}
      />
      
      {inputValue && (
        <button
          onClick={handleClear}
          className="text-subtle-dark absolute right-[16px] flex h-full items-center"
        >
          <X size={18} />
        </button>
      )}
    </div>
  );
};
export default SearchBar;
