import { useEffect, useState } from "react";
import ComboBox from "@/components/ui/ComboBox";
import FormInput from "@/components/forms/FormInput";
import { listInventory } from "@/api/inventory";
import { OIL_CATEGORY } from "@/constants/categories";

const NOT_LINKED = { id: "", name: "ไม่ใช้ (นับสต็อกของตัวเอง)" };

// ชุดน้ำมันไม่มีสต็อกของตัวเอง ขายแล้วตัดน้ำมันที่ตัวเก็บตามลิตรของชุด
// ห้ามผูกต่อกันเป็นทอดหรือผูกกับตัวเอง
const OilKitFields = ({ register, setValue, watch, errors, selfId }) => {
  const [oils, setOils] = useState([]);

  useEffect(() => {
    let isCurrent = true;
    listInventory(OIL_CATEGORY)
      .then((res) => {
        if (!isCurrent) return;
        setOils(
          (res.data || [])
            .filter(
              (item) =>
                item.type === "part" &&
                item.unit === "ลิตร" &&
                !item.oilSourceId &&
                item.id !== selfId,
            )
            .map((item) => ({
              id: item.id,
              name: [item.brand, item.name].filter(Boolean).join(" "),
            })),
        );
      })
      .catch(() => {});
    return () => {
      isCurrent = false;
    };
  }, [selfId]);

  const sourceId = watch("oilSourceId") || "";

  return (
    <div className="mt-4 px-5">
      <ComboBox
        label="น้ำมันที่ใช้"
        color="text-subtle-dark"
        labelClass="text-xl"
        options={[NOT_LINKED, ...oils]}
        value={sourceId}
        onChange={(value) =>
          setValue("oilSourceId", value || "", {
            shouldDirty: true,
            shouldValidate: true,
          })
        }
        placeholder="-- เลือกน้ำมัน --"
        errors={errors}
        name="oilSourceId"
      />
      {sourceId !== "" && (
        <FormInput
          register={register}
          name="oilLiters"
          label="ใช้น้ำมันชุดละ (ลิตร)"
          type="text"
          placeholder="เช่น 7"
          color="subtle-dark"
          customClass="mt-4"
          errors={errors}
          inputMode="decimal"
          onInput={(e) => {
            e.target.value = e.target.value
              .replace(/[^0-9.]/g, "")
              .replace(/(\..*)\./g, "$1");
          }}
        />
      )}
    </div>
  );
};

export default OilKitFields;
