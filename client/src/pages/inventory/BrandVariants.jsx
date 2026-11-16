import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { ChevronLeft } from "lucide-react";
import { toast } from "sonner";
import PageSpinner from "@/components/ui/PageSpinner";
import FormButton from "@/components/forms/FormButton";
import ConfirmDialog from "@/components/dialogs/ConfirmDialog";
import { listBrandVariants, mergeBrandVariants } from "@/api/part";
import { toastError } from "@/utils/handleError";
import { withMinDuration } from "@/utils/withMinDuration";

// ยี่ห้อเดียวกันที่พิมพ์ตัวพิมพ์เล็กใหญ่ต่างกัน ค้นหาและกรองยี่ห้อจะแตกเป็นสองกลุ่ม
// เลือกตัวสะกดที่ถูกแล้วเปลี่ยนให้ทุกรายการใช้ตัวเดียวกัน
const BrandVariants = () => {
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  // ตัวสะกดที่เลือกของแต่ละยี่ห้อ ค่าเริ่มต้นคือตัวที่ใช้บ่อยที่สุด
  const [chosen, setChosen] = useState({});
  const [confirming, setConfirming] = useState(null);

  const load = async () => {
    try {
      const res = await listBrandVariants();
      const data = res.data || [];
      setGroups(data);
      setChosen(
        Object.fromEntries(
          data.map((group) => [group.key, group.spellings[0].brand]),
        ),
      );
    } catch (error) {
      toastError(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleMerge = async () => {
    const { key, brand } = confirming;
    const res = await withMinDuration(() => mergeBrandVariants(key, brand));
    toast.success(res.data?.message || "แก้ยี่ห้อเรียบร้อยแล้ว");
    setConfirming(null);
    await load();
  };

  return (
    <div className="bg-gradient-primary shadow-primary flex min-h-svh w-full flex-col">
      <div className="flex items-center gap-2 px-5 pt-4">
        <button
          onClick={() =>
            window.history.length > 1 ? navigate(-1) : navigate("/inventory")
          }
          aria-label="ย้อนกลับ"
          className="bg-surface/20 flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full"
        >
          <ChevronLeft className="text-surface" />
        </button>
        <p className="text-surface min-w-0 flex-1 truncate text-2xl font-semibold md:text-[26px]">
          ยี่ห้อที่ตัวพิมพ์ไม่ตรงกัน
        </p>
      </div>

      <div className="bg-surface shadow-primary mt-4 flex w-full flex-1 flex-col rounded-tl-2xl rounded-tr-2xl px-5 pb-28 xl:pb-4">
        {isLoading ? (
          <PageSpinner />
        ) : groups.length === 0 ? (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-subtle-light px-5 text-center text-xl text-balance md:text-[22px]">
              ไม่มียี่ห้อที่ตัวพิมพ์ไม่ตรงกัน
            </p>
          </div>
        ) : (
          groups.map((group) => {
            const selected = chosen[group.key];
            const toChange = group.spellings
              .filter((spelling) => spelling.brand !== selected)
              .reduce((sum, spelling) => sum + spelling.count, 0);
            return (
              <div key={group.key} className="mt-4">
                <div className="space-y-3 rounded-lg bg-gray-50 p-4">
                  <p className="text-subtle-dark text-lg font-medium md:text-xl">
                    เลือกตัวสะกดที่ถูกต้อง:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {group.spellings.map((spelling) => {
                      const isActive = selected === spelling.brand;
                      return (
                        <button
                          key={spelling.brand}
                          type="button"
                          onClick={() =>
                            setChosen((prev) => ({
                              ...prev,
                              [group.key]: spelling.brand,
                            }))
                          }
                          aria-pressed={isActive}
                          className={`flex h-[52px] min-w-0 flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border px-3 duration-300 ${
                            isActive
                              ? "border-primary bg-primary/5"
                              : "bg-surface border-gray-200"
                          }`}
                        >
                          <span
                            className={`truncate text-lg font-semibold md:text-xl ${
                              isActive ? "text-primary" : "text-normal"
                            }`}
                          >
                            {spelling.brand}
                          </span>
                          <span className="text-subtle-light shrink-0 text-base md:text-lg">
                            {spelling.count} รายการ
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <FormButton
                    label={`เปลี่ยนเป็น ${selected} (${toChange} รายการ)`}
                    onClick={() =>
                      setConfirming({
                        key: group.key,
                        brand: selected,
                        count: toChange,
                      })
                    }
                    className="bg-gradient-primary mr-0 ml-0"
                  />
                </div>
              </div>
            );
          })
        )}
      </div>

      <ConfirmDialog
        isOpen={!!confirming}
        onClose={() => setConfirming(null)}
        onConfirm={handleMerge}
        title="ยืนยันการแก้ยี่ห้อ"
        itemName={confirming?.brand || ""}
        note={
          confirming
            ? `อะไหล่ ${confirming.count} รายการจะใช้ยี่ห้อ ${confirming.brand} ชื่อในบิลเก่าเปลี่ยนตามด้วย`
            : ""
        }
        confirmLabel="แก้ยี่ห้อ"
        confirmClass="bg-gradient-primary"
        requireHold={false}
      />
    </div>
  );
};

export default BrandVariants;
