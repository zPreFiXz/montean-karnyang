import { useState } from "react";
import { Calendar as CalendarIcon, Edit, HandCoins, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { formatCurrency, formatDate } from "@/utils/formats";
import { depositOf, depositTermsOf } from "@/utils/receipt";
import { isSaleRepair } from "@/utils/repairDisplay";
import ComboBox from "@/components/ui/ComboBox";
import FieldErrorList from "@/components/forms/FieldErrorList";
import FormButton from "@/components/forms/FormButton";
import { Input } from "@/components/ui/input";
import useChequeBankOptions from "@/hooks/useChequeBankOptions";
import {
  ALL_PAYMENT_METHODS,
  CHEQUE_METHOD_ID,
  canPayByCheque,
  getPaymentMethodText,
  PAYMENT_METHODS,
  PAYMENT_OPTIONS_WITH_CREDIT,
} from "@/constants/paymentMethods";

const InfoRow = ({ label, children }) => (
  <div className="flex justify-between gap-2">
    <p className="text-subtle-dark text-lg font-medium md:text-xl">{label}</p>
    <p className="text-normal text-right text-lg font-semibold break-words md:text-xl">
      {children}
    </p>
  </div>
);

// ช่องกรอกอยู่ขวาหัวข้อ กว้างเท่าช่องเลือกวิธีชำระเงิน แถวจะได้ตรงกัน
const ChequeField = ({ name, label, error, onChange, ...props }) => (
  <>
    <div className="flex items-center justify-between gap-2">
      <label
        htmlFor={name}
        className="text-subtle-dark text-lg font-medium md:text-xl"
      >
        {label}
      </label>
      <Input
        id={name}
        aria-invalid={error ? "true" : "false"}
        onChange={(e) => onChange(e.target.value)}
        className={`bg-surface h-[41px] w-52.5 shrink-0 rounded-[20px] px-3 text-lg font-medium placeholder:text-lg placeholder:font-light md:text-xl md:placeholder:text-xl ${
          error
            ? "border-destructive focus-visible:!border-destructive focus-visible:!ring-destructive/30 focus-visible:!border-2"
            : "focus-visible:!border-primary focus-visible:!ring-primary/35 focus-visible:!border-2"
        }`}
        {...props}
      />
    </div>
    <FieldErrorList messages={[error]} className="items-end" />
  </>
);

// วันที่เก็บเป็น ปปปป-ดด-วว ตามเวลาท้องถิ่น ไม่ผ่าน toISOString ไม่งั้นวันเลื่อนตามเขตเวลา
const toDateValue = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const fromDateValue = (value) => {
  const [year, month, day] = String(value || "")
    .split("-")
    .map(Number);
  return year ? new Date(year, month - 1, day) : undefined;
};

// หน้าตาเหมือนช่องเลือกวิธีชำระเงิน เปิดปฏิทินแบบเดียวกับหน้ารายงาน
const ChequeDateField = ({ value, onChange, error }) => {
  const [open, setOpen] = useState(false);
  const selected = fromDateValue(value);

  return (
    <>
      <div className="flex items-center justify-between gap-2">
        <p className="text-subtle-dark text-lg font-medium md:text-xl">
          ลงวันที่:
        </p>
        {/* กากบาทอยู่นอกปุ่มเปิดปฏิทิน (ปุ่มซ้อนปุ่มไม่ได้) จึงวางทับมุมขวาของช่อง */}
        <div className="relative w-52.5 shrink-0">
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                name="chequeDate"
                variant="outline"
                aria-invalid={error ? "true" : undefined}
                className={`h-[41px] w-full cursor-pointer justify-between rounded-[20px] text-lg focus:!border-2 focus:ring-[3px] md:text-xl ${
                  selected
                    ? "text-foreground font-medium"
                    : "text-muted-foreground font-light"
                } ${
                  error
                    ? "border-destructive focus:!border-destructive"
                    : "border-input focus:!border-primary"
                }`}
                style={{
                  "--tw-ring-color": error
                    ? "rgba(255, 69, 69, 0.3)"
                    : "rgba(25, 118, 210, 0.35)",
                }}
              >
                <span className="truncate">
                  {selected ? formatDate(selected) : "-- เลือกวันที่ --"}
                </span>
                {selected ? (
                  <span className="h-4 w-4 shrink-0" />
                ) : (
                  <CalendarIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-auto p-0"
              align="end"
              onOpenAutoFocus={(e) => e.preventDefault()}
            >
              <Calendar
                mode="single"
                selected={selected}
                defaultMonth={selected || new Date()}
                // กดวันเดิมซ้ำก็ล้างวันที่ได้เหมือนกากบาท
                onSelect={(date) => {
                  onChange(date ? toDateValue(date) : "");
                  setOpen(false);
                }}
                captionLayout="dropdown"
                fromYear={2025}
                toYear={2035}
                monthFormat="long"
                className="rounded-md shadow-sm"
              />
            </PopoverContent>
          </Popover>
          {selected && (
            <button
              type="button"
              onClick={() => onChange("")}
              aria-label="ล้างวันที่"
              className="text-destructive absolute top-1/2 right-1 flex h-9 w-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
      <FieldErrorList messages={[error]} className="items-end" />
    </>
  );
};

// บิลที่จ่ายแล้วเป็นข้อความ กดแก้ไขที่หัวข้อถึงจะกลายเป็นช่องเลือก
// ทุกวิธีต้องกดบันทึก เปลี่ยนใจกดยกเลิกได้ ข้อมูลเงินของบิลที่จ่ายแล้วจะได้ไม่เปลี่ยนเพราะเผลอเลือก
// ใบเสนอราคายังไม่มีการเก็บเงิน จึงมีแค่บรรทัดสถานะ
const RepairDetailPayment = ({
  ref,
  repair,
  statusInfo,
  isCancelled,
  isEditingPaidMethod,
  onEditPaidMethod,
  onCancelEditPaidMethod,
  selectedMethod,
  onSelectMethod,
  error,
  cheque,
  onChequeChange,
  chequeErrors = {},
  onSavePaidMethod,
  isSavingPaidMethod,
  canSavePaidMethod,
  // ไม่ส่งมา = บิลนี้รับหรือแก้มัดจำไม่ได้แล้ว
  onEditDeposit,
}) => {
  const methodText = getPaymentMethodText(repair.paymentMethod) || "ไม่ระบุ";
  const showMethod =
    repair.status !== "ESTIMATE" && !(isCancelled && !repair.paymentMethod);
  const isPaidView =
    isCancelled || (repair.status === "PAID" && !isEditingPaidMethod);
  // บิลที่รับมัดจำไว้ลงเครดิตไม่ได้ (ต้องตรงกับ updateRepairStatus ฝั่งเซิร์ฟเวอร์)
  const baseOptions =
    repair.status === "PAID" ||
    repair.status === "CREDIT" ||
    repair.depositAmount
      ? PAYMENT_METHODS
      : PAYMENT_OPTIONS_WITH_CREDIT;
  const options = canPayByCheque(repair) ? ALL_PAYMENT_METHODS : baseOptions;
  const isChequeSelected = !isPaidView && selectedMethod === CHEQUE_METHOD_ID;
  const bankOptions = useChequeBankOptions(isChequeSelected);

  return (
    <div ref={ref} className="mb-4 px-5">
      {/* ปุ่มแก้ไขอยู่ที่หัวข้อแบบเดียวกับรายการซ่อม เพราะแก้ได้ทั้งวิธีจ่ายและข้อมูลเช็ค */}
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-normal text-[22px] font-semibold md:text-2xl">
          {repair.status === "ESTIMATE" && !onEditDeposit
            ? "สถานะ"
            : "การชำระเงิน"}
        </p>
        {/* ปุ่มอยู่ที่หัวข้อแบบเดียวกับแก้ไขการชำระเงิน บิลที่จ่ายแล้วแก้มัดจำไม่ได้ จึงไม่ชนกัน */}
        {onEditDeposit && (
          <button
            type="button"
            onClick={onEditDeposit}
            className="text-primary flex cursor-pointer items-center gap-1 text-xl font-semibold md:text-[22px]"
          >
            {repair.depositAmount ? (
              <Edit className="h-5 w-5" />
            ) : (
              <HandCoins className="h-5 w-5" />
            )}
            {repair.depositAmount
              ? depositTermsOf(repair).edit
              : depositTermsOf(repair).action}
          </button>
        )}
        {repair.status === "PAID" &&
          !isCancelled &&
          (isEditingPaidMethod ? (
            <button
              type="button"
              onClick={onCancelEditPaidMethod}
              className="text-destructive flex cursor-pointer items-center gap-1 text-xl font-semibold md:text-[22px]"
            >
              <X className="h-5 w-5" />
              ยกเลิก
            </button>
          ) : (
            <button
              type="button"
              onClick={onEditPaidMethod}
              className="text-primary flex cursor-pointer items-center gap-1 text-xl font-semibold md:text-[22px]"
            >
              <Edit className="h-5 w-5" />
              แก้ไขการชำระเงิน
            </button>
          ))}
      </div>
      <div className="space-y-2 rounded-lg bg-gray-50 p-4">
        {showMethod && (
          <>
            <div className="flex items-center justify-between gap-2">
              <p className="text-subtle-dark text-lg font-medium md:text-xl">
                วิธีชำระเงิน:
              </p>
              {isPaidView ? (
                <p className="text-normal text-lg font-semibold md:text-xl">
                  {methodText}
                </p>
              ) : (
                <div className="w-52.5 shrink-0">
                  <ComboBox
                    options={options}
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

            {isPaidView && repair.paymentMethod === CHEQUE_METHOD_ID && (
              <>
                <InfoRow label="ธนาคาร:">
                  {repair.chequeBank || "ไม่ระบุ"}
                </InfoRow>
                <InfoRow label="เลขที่:">
                  {repair.chequeNo || "ไม่ระบุ"}
                </InfoRow>
                {/* วันที่ไม่บังคับลง ไม่ได้ลงไว้ก็ไม่ต้องมีบรรทัดนี้ */}
                {repair.chequeDate && (
                  <InfoRow label="ลงวันที่:">
                    {formatDate(repair.chequeDate)}
                  </InfoRow>
                )}
              </>
            )}

            {isChequeSelected && (
              <>
                {/* เลือกธนาคารที่เคยรับเช็คได้ แบบเดียวกับช่องหน่วยในหน้าสต็อก */}
                <div className="flex items-center justify-between gap-2">
                  <p className="text-subtle-dark text-lg font-medium md:text-xl">
                    ธนาคาร:
                  </p>
                  <div className="w-52.5 shrink-0">
                    <ComboBox
                      options={bankOptions}
                      value={cheque.bank}
                      onChange={(value) => onChequeChange("bank", value)}
                      placeholder="-- เลือกธนาคาร --"
                      customClass="text-lg md:text-xl"
                      name="chequeBank"
                      creatable
                      errors={chequeErrors}
                      hideErrorMessage
                    />
                  </div>
                </div>
                <FieldErrorList
                  messages={[chequeErrors.chequeBank?.message]}
                  className="items-end"
                />
                <ChequeField
                  name="chequeNo"
                  label="เลขที่:"
                  placeholder="เช่น 12345678"
                  maxLength={50}
                  inputMode="numeric"
                  value={cheque.no}
                  onChange={(value) => onChequeChange("no", value)}
                  error={chequeErrors.chequeNo?.message}
                />
                <ChequeDateField
                  value={cheque.date}
                  onChange={(value) => onChequeChange("date", value)}
                  error={chequeErrors.chequeDate?.message}
                />
              </>
            )}
          </>
        )}
        {repair.depositAmount > 0 && (
          <>
            {/* วันที่รับ คืน หรือริบมัดจำอยู่ในส่วนวันเวลา */}
            <InfoRow label={depositTermsOf(repair).row}>
              {formatCurrency(Number(repair.depositAmount))}
              {repair.depositMethod &&
                ` (${getPaymentMethodText(repair.depositMethod)})`}
            </InfoRow>
            {depositOf(repair) > 0 && !isCancelled && (
              <div className="flex justify-between gap-2">
                <p className="text-subtle-dark text-lg font-medium md:text-xl">
                  {repair.status === "PAID"
                    ? "ชำระส่วนที่เหลือ:"
                    : "คงเหลือชำระ:"}
                </p>
                <p
                  className={`text-lg font-semibold md:text-xl ${statusInfo.color}`}
                >
                  {formatCurrency(
                    Number(repair.totalPrice) - depositOf(repair),
                  )}
                </p>
              </div>
            )}
          </>
        )}
        <div className="flex justify-between">
          <p className="text-subtle-dark text-lg font-medium md:text-xl">
            {/* บิลขายไม่มีงานซ่อม จึงเรียกสถานะของบิลแทน */}
            {isSaleRepair(repair) ? "สถานะบิล:" : "สถานะการซ่อม:"}
          </p>
          <p className={`text-lg font-semibold md:text-xl ${statusInfo.color}`}>
            {statusInfo.text}
          </p>
        </div>
        {/* ปุ่มบันทึกอยู่ท้ายกล่อง กรอกเสร็จจากบนลงล่างแล้วเจอเป็นอย่างสุดท้าย */}
        {repair.status === "PAID" && isEditingPaidMethod && (
          <div className="pt-2">
            <FormButton
              label="บันทึกการชำระเงิน"
              isLoading={isSavingPaidMethod}
              disabled={!canSavePaidMethod}
              onClick={onSavePaidMethod}
              className="bg-gradient-primary mr-0 ml-0"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default RepairDetailPayment;
