import { useSearchParams } from "react-router";
import { Input } from "../ui/input";
import { Search } from "lucide-react";
import { useDebouncedCallback } from "use-debounce";

const SearchBar = ({ value }) => {
  const [searchParams, setSearchParams] = useSearchParams();

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
    updateSearch(e.target.value);
  };

  return (
    <div className="relative flex items-center">
      <div className="absolute left-[12px] h-full flex items-center text-subtle-dark pointer-events-none">
        <Search size={20} />
      </div>
      <Input
        type="text"
        value={value}
        onChange={handleSearch}
        placeholder="ค้นหาชื่อ, ยี่ห้อ, รหัสอะไหล่"
        className="w-full h-[40px] pl-[40px] pr-[16px] rounded-[20px] bg-surface focus:outline-none"
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
    </div>
  );
};
export default SearchBar;
