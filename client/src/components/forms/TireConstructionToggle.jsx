import { BIAS, RADIAL } from "@/utils/tireSize";

// ดูจากตัวเลขบอกไม่ได้ว่าเป็นเรเดียลหรือผ้าใบ (8.25R16 ก็มี) จึงต้องให้กดเลือก
const TireConstructionToggle = ({ value, onChange }) => {
  const current = value === BIAS ? BIAS : RADIAL;
  const isRadial = current === RADIAL;

  return (
    <button
      type="button"
      onClick={() => onChange(isRadial ? BIAS : RADIAL)}
      aria-label={`ชนิดยาง: ${isRadial ? "เรเดียล" : "ผ้าใบ"} กดเพื่อสลับ`}
      title={
        isRadial
          ? "เรเดียล — กดเพื่อเปลี่ยนเป็นผ้าใบ"
          : "ผ้าใบ — กดเพื่อเปลี่ยนเป็นเรเดียล"
      }
      className="border-input text-subtle-dark bg-surface focus-visible:border-primary focus-visible:ring-primary/35 flex h-[41px] w-[41px] shrink-0 cursor-pointer items-center justify-center rounded-lg border text-xl font-semibold duration-300 outline-none focus-visible:border-2 focus-visible:ring-3 md:text-[22px]"
    >
      {isRadial ? "R" : "-"}
    </button>
  );
};

export default TireConstructionToggle;
