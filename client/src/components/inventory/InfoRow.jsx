const InfoRow = ({ label, children, valueClass = "text-normal" }) => (
  <div className="flex justify-between gap-2">
    <p className="text-subtle-dark shrink-0 text-lg font-medium md:text-xl">
      {label}
    </p>
    <p className={`text-right text-lg font-semibold md:text-xl ${valueClass}`}>
      {children}
    </p>
  </div>
);

export default InfoRow;
