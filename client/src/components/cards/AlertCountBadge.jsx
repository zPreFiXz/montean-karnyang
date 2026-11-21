// ตัวเลขแดงมุมขวาบนแบบแจ้งเตือนบนไอคอนแอป พ่อแม่ต้องเป็น relative
const AlertCountBadge = ({ count }) =>
  count > 0 ? (
    <span className="bg-destructive text-surface absolute -top-1.5 -right-1.5 z-10 flex h-5.5 min-w-5.5 items-center justify-center rounded-full px-1.5 text-sm font-semibold shadow">
      {count}
    </span>
  ) : null;

export default AlertCountBadge;
