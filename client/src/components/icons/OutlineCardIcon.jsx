// วงกลมพื้นขาวมีแค่เส้นขอบ แบบเดียวกับกรอบโลโก้ยี่ห้อรถ
// ใช้กับการ์ดที่ไม่มีโลโก้รถให้ใช้ เช่นงานบริการ ขายอะไหล่ หน่วยงาน และร้านค้า
// ขนาดต้องเท่ากรอบโลโก้พอดี เพราะวางทับวงกลมสีทึบของการ์ดอีกที
const OutlineCardIcon = ({ icon: Icon, color = "#1976d2" }) => {
  return (
    <div
      className="bg-surface flex h-[45px] w-[45px] items-center justify-center rounded-full border-2"
      style={{ borderColor: color }}
    >
      <Icon className="h-6 w-6" style={{ color }} />
    </div>
  );
};

export default OutlineCardIcon;
