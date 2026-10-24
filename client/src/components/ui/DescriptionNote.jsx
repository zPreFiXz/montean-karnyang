// ไม่ใส่กฎตัดคำ ภาษาไทยจะได้ตัดตามคำ (ไม่ใช่ ตั้ง|ศูนย์)
const DescriptionNote = ({ text, className = "" }) => (
  <div className={className}>
    <p className="font-athiti text-normal mb-2 text-[22px] font-semibold md:text-2xl">
      รายละเอียด
    </p>
    <div className="rounded-lg bg-gray-50 p-4">
      <p className="text-normal text-lg leading-relaxed font-medium whitespace-pre-line md:text-xl">
        {text}
      </p>
    </div>
  </div>
);

export default DescriptionNote;
