// ตัวย่อเดียวกับที่ใบเสร็จเขียน (L) (R) (L-R)
const SIDE_LABELS = { left: "L", right: "R", both: "L-R" };

const SideBadge = ({ side }) =>
  SIDE_LABELS[side] ? (
    <span className="bg-primary text-surface absolute -top-1.5 -left-1.5 z-10 rounded-sm px-1.5 text-sm leading-5 font-semibold shadow-sm md:text-base">
      {SIDE_LABELS[side]}
    </span>
  ) : null;

export default SideBadge;
