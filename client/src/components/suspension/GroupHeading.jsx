const GroupHeading = ({ title, count }) => (
  <div className="mt-4 flex items-center gap-2 px-5">
    <p className="text-subtle-dark text-lg font-semibold md:text-xl">{title}</p>
    <span className="text-subtle-light text-lg md:text-xl">({count})</span>
    <div className="bg-subtle-light/40 h-px flex-1" />
  </div>
);

export default GroupHeading;
