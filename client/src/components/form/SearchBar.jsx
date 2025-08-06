import { useSearchParams } from "react-router";
import { Input } from "../ui/input";
import { Search, X } from "lucide-react";
import { useDebouncedCallback } from "use-debounce";
import { useState, useEffect } from "react";

const SearchBar = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [inputValue, setInputValue] = useState("");

  useEffect(() => {
    const searchParam = searchParams.get("search") || "";
    setInputValue(searchParam);
  }, [searchParams]);

  const updateSearch = useDebouncedCallback((value) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set("search", value);
    } else {
      params.delete("search");
    }
    setSearchParams(params);
  }, 500);

  const handleSearch = (e) => {
    const value = e.target.value;
    setInputValue(value);
    updateSearch(value);
  };

  const handleClear = () => {
    setInputValue("");
    const params = new URLSearchParams(searchParams);
    params.delete("search");
    setSearchParams(params);
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
        placeholder="ค้นหาชื่อ, ยี่ห้อ, รหัสอะไหล่"
        className="w-full h-[40px] px-[40px] rounded-[20px] bg-surface focus:outline-none"
        style={{
          "--tw-ring-color": "#5b46f4",
          "--tw-border-opacity": "1",
        }}
        onFocus={(e) => {
          e.target.style.borderColor = "#5b46f4";
          e.target.style.borderWidth = "2px";
          e.target.style.boxShadow = "0 0 0 3px rgba(91, 70, 244, 0.3)";
        }}
        onBlur={(e) => {
          e.target.style.borderColor = "";
          e.target.style.borderWidth = "";
          e.target.style.boxShadow = "";
        }}
      />

    {/* Clear button */}
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
