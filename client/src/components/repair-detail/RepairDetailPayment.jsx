import { Edit } from "lucide-react";
import ComboBox from "@/components/ui/ComboBox";
import FieldErrorList from "@/components/forms/FieldErrorList";
import {
  getPaymentMethodText,
  PAYMENT_METHODS,
  PAYMENT_OPTIONS_WITH_CREDIT,
} from "@/constants/paymentMethods";

// บิลที่จ่ายแล้วเป็นข้อความ กดดินสอถึงจะกลายเป็นช่องเลือก เลือกแล้วบันทึกทันที
// ใบประเมินราคายังไม่มีการเก็บเงิน จึงมีแค่บรรทัดสถานะ
const RepairDetailPayment = ({
  ref,
  repair,
  statusInfo,
  isCancelled,
  isEditingPaidMethod,
  onEditPaidMethod,
  selectedMethod,
  onSelectMethod,
  error,
}) => {
  const methodText = getPaymentMethodText(repair.paymentMethod) || "ไม่ระบุ";
  const showMethod =
    repair.status !== "ESTIMATE" && !(isCancelled && !repair.paymentMethod);

  return (
    <div ref={ref} className="mb-4 px-5">
      <p className="text-normal mb-2 text-[22px] font-semibold md:text-2xl">
        {repair.status === "ESTIMATE" ? "สถานะ" : "การชำระเงิน"}
      </p>
      <div className="space-y-2 rounded-lg bg-gray-50 p-4">
        {showMethod && (
          <>
            <div className="flex items-center justify-between gap-2">
              <p className="text-subtle-dark text-lg font-medium md:text-xl">
                วิธีชำระเงิน:
              </p>
              {isCancelled ? (
                <p className="text-normal text-lg font-semibold md:text-xl">
                  {methodText}
                </p>
              ) : repair.status === "PAID" && !isEditingPaidMethod ? (
                <button
                  type="button"
                  onClick={onEditPaidMethod}
                  aria-label="แก้ไขวิธีชำระเงิน"
                  className="text-normal flex shrink-0 cursor-pointer items-center gap-1.5 text-lg font-semibold md:text-xl"
                >
                  {methodText}
                  <Edit className="text-primary h-4 w-4" />
                </button>
              ) : (
                <div className="w-52.5 shrink-0">
                  <ComboBox
                    options={
                      repair.status === "PAID" || repair.status === "CREDIT"
                        ? PAYMENT_METHODS
                        : PAYMENT_OPTIONS_WITH_CREDIT
                    }
                    value={selectedMethod}
                    onChange={onSelectMethod}
                    placeholder="-- เลือกวิธีชำระเงิน --"
                    customClass="text-lg md:text-xl"
                    name="paymentMethod"
                    errors={
                      error ? { paymentMethod: { message: error } } : undefined
                    }
                    hideErrorMessage
                  />
                </div>
              )}
            </div>
            <FieldErrorList messages={[error]} className="items-end" />
          </>
        )}
        <div className="flex justify-between">
          <p className="text-subtle-dark text-lg font-medium md:text-xl">
            สถานะการซ่อม:
          </p>
          <p className={`text-lg font-semibold md:text-xl ${statusInfo.color}`}>
            {statusInfo.text}
          </p>
        </div>
      </div>
    </div>
  );
};

export default RepairDetailPayment;
