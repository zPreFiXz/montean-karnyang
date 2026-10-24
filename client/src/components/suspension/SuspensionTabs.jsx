import { SUSPENSION_TABS } from "@/utils/suspension";

const TAB_LABELS = { left: "ซ้าย", right: "ขวา", other: "อื่นๆ" };

// แถบเลื่อนวางด้วย translateX ตามลำดับที่ ไม่ใช่ 33.33%
// เพราะกล่องมีขอบใน 4px ปุ่มจึงกว้าง (100% - 8px)/3 คิดเป็นเปอร์เซ็นต์แถบจะเยื้อง
const SuspensionTabs = ({ activeTab, onChange }) => (
  <div className="mx-5 mt-4 flex justify-center">
    <div
      role="tablist"
      className="relative flex w-full max-w-sm rounded-lg bg-gray-100 p-1"
    >
      <div
        aria-hidden="true"
        className="bg-gradient-primary absolute top-1 bottom-1 left-1 w-[calc((100%-8px)/3)] rounded-lg shadow-lg duration-300 ease-out"
        style={{
          transform: `translateX(${SUSPENSION_TABS.indexOf(activeTab) * 100}%)`,
        }}
      />
      {SUSPENSION_TABS.map((tab) => (
        <button
          key={tab}
          type="button"
          role="tab"
          aria-selected={activeTab === tab}
          onClick={() => onChange(tab)}
          className={`relative z-10 flex h-10 flex-1 cursor-pointer items-center justify-center rounded-lg text-lg font-semibold duration-300 ease-out md:text-xl ${
            activeTab === tab ? "text-white" : "text-subtle-dark"
          }`}
        >
          {TAB_LABELS[tab]}
        </button>
      ))}
    </div>
  </div>
);

export default SuspensionTabs;
