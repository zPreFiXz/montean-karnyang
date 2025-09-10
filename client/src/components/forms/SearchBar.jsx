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
  inputMode = "text"
}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [inputValue, setInputValue] = useState("");

  // ถ้าเป็น controlled mode ใช้ value จาก props
  // ถ้าไม่ใช่ ใช้ searchParams
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
      <div className="absolute left-[16px] h-full flex items-center text-subtle-dark pointer-events-none">
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
        className="w-full h-[41px] px-[40px] rounded-[20px] font-athiti font-medium text-[20px] md:text-[22px] bg-surface placeholder:font-light placeholder:text-[18px] md:placeholder:text-[20px] focus:outline-none"
        style={{
          "--tw-ring-color": "#1976d2",
          "--tw-border-opacity": "1",
        }}
        onFocus={(e) => {
          e.target.style.borderColor = "#1976d2";
          e.target.style.borderWidth = "2px";
          e.target.style.boxShadow = "0 0 0 3px rgba(25, 118, 210, 0.35)";
        }}
        onBlur={(e) => {
          e.target.style.borderColor = "";
          e.target.style.borderWidth = "";
          e.target.style.boxShadow = "";
        }}
      />

      {/* ปุ่มล้างการค้นหา */}
      {inputValue && (
        <button
          onClick={handleClear}
          className="absolute right-[16px] h-full flex items-center text-subtle-dark"
        >
          <X size={18} />
        </button>
      )}
    </div>
  );
};
export default SearchBar;
