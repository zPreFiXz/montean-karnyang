import { AlertCircle } from "lucide-react";

const FieldErrorList = ({ messages = [], className = "" }) => {
  const visible = messages.filter(Boolean);
  if (visible.length === 0) return null;

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {visible.map((message) => (
        <div key={message} className="flex items-center gap-1 px-1">
          <AlertCircle className="text-destructive h-4 w-4 flex-shrink-0" />
          <p className="text-destructive text-lg font-medium md:text-xl">
            {message}
          </p>
        </div>
      ))}
    </div>
  );
};
export default FieldErrorList;
