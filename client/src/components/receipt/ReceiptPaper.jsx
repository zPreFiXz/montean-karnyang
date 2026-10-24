import { formatPhone } from "@/utils/formats";
import { bahtText } from "@/utils/bahtText";
import {
  MIN_ROWS,
  PAYMENT_BOXES,
  PAYMENT_QR_NAME,
  SHOP,
  buildReceiptPages,
  formatAmount,
  formatMoney,
  hasPaymentQr,
  quantityLabel,
  receiptDocNo,
  receiptDocTitle,
  receiptHeaderInfo,
  rowLines,
  shortWorkName,
} from "@/utils/receipt";

const ReceiptPaper = ({
  repair,
  showCustomer = true,
  showBrand = true,
  pageIndex = 0,
  copyLabel = null,
}) => {
  const { day, month, year, vehicleName, plateText, fleetNo } =
    receiptHeaderInfo(repair);
  const customerName = repair.customer?.name || "";
  const customerAddress = repair.customer?.address || "";
  const customerTaxId = repair.customer?.taxId || "";
  const customerPhone = repair.customer?.phoneNumber || "";

  const { pages, discountItems } = buildReceiptPages(repair, { showBrand });
  const pageCount = pages.length;
  const items = pages[pageIndex] || [];
  const isLastPage = pageIndex === pageCount - 1;
  const showPaymentQr = isLastPage && hasPaymentQr(repair);
  // ต้องตรงกับ receiptHtml.js ฝั่งเซิร์ฟเวอร์
  const signLabels =
    repair.status === "CREDIT"
      ? ["ผู้รับของ", "ผู้ส่งของ"]
      : repair.status === "ESTIMATE"
        ? ["ผู้อนุมัติ", "ผู้เสนอราคา"]
        : ["ผู้จ่ายเงิน", "ผู้รับเงิน"];

  const discountTotal = discountItems.reduce(
    (sum, item) => sum + Number(item.unitPrice) * Number(item.quantity),
    0,
  );
  const hasDiscount = isLastPage && discountTotal !== 0;
  const summaryRows = isLastPage
    ? hasDiscount
      ? discountItems.length + 1
      : 1
    : 0;
  const usedLines = items.reduce(
    (sum, row) => sum + rowLines(row, showBrand),
    0,
  );
  const blankRows = Math.max(0, MIN_ROWS - usedLines - summaryRows);
  // ยอดในบิลหักส่วนลดไปแล้ว ยอดก่อนหักจึงต้องบวกกลับ (ส่วนลดเก็บเป็นเลขติดลบ)
  const total = Number(repair.totalPrice || 0);
  const subtotal = total - discountTotal;

  return (
    <>
      <div className="flex-none">
        <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-2">
          <span />
          <div className="text-center">
            <p className="text-[15pt] font-semibold">
              {receiptDocTitle(repair)}
              {repair.isCancelled && " (ยกเลิก)"}
            </p>
            {copyLabel && <p>({copyLabel})</p>}
            <p className="text-[17pt] font-semibold">{SHOP.name}</p>
          </div>
          <p className="flex items-end justify-end gap-1 whitespace-nowrap">
            เลขที่
            {/* บิลหลายแผ่นเขียนเลขต่อเนื่องแบบ RE-6909-0001/1 RE-6909-0001/2 ตามแบบเอกสารต่อเนื่องของไทย */}
            <span className="min-w-10.5 border-b border-dotted border-black text-center font-semibold">
              {pageCount > 1
                ? `${receiptDocNo(repair)}/${pageIndex + 1}`
                : receiptDocNo(repair)}
            </span>
          </p>
        </div>

        <p className="mt-0.5 text-center">{SHOP.address}</p>
        <p className="text-center">{SHOP.contact}</p>

        <div className="mt-2 flex justify-end gap-3">
          <p className="flex items-end gap-1">
            วันที่
            <span className="w-13 border-b border-dotted border-black text-center font-semibold">
              {day}
            </span>
          </p>
          <p className="flex items-end gap-1">
            เดือน
            <span className="w-23 border-b border-dotted border-black text-center font-semibold">
              {month}
            </span>
          </p>
          <p className="flex items-end gap-1">
            พ.ศ.
            <span className="w-13 border-b border-dotted border-black text-center font-semibold">
              {year}
            </span>
          </p>
        </div>

        <div className="mt-1.5 space-y-[5px]">
          {/* ต้องตรงกับ receiptHtml.js */}
          <p className="flex items-end gap-1.5">
            <span className="whitespace-nowrap">ชื่อลูกค้า</span>
            <span className="min-w-0 flex-1 truncate border-b border-dotted border-black text-center font-semibold">
              {showCustomer ? customerName : ""}
            </span>
          </p>
          <p className="flex items-end gap-1.5">
            <span className="whitespace-nowrap">ที่อยู่</span>
            <span className="flex-1 border-b border-dotted border-black text-center font-semibold">
              {showCustomer ? customerAddress : ""}
            </span>
          </p>
          {/* ต้องตรงกับ p.halves ใน receiptHtml.js */}
          <p className="grid grid-cols-[60px_minmax(0,1.7fr)_74px_1fr] items-end gap-1.5 whitespace-nowrap">
            <span className="col-span-2 flex items-end gap-1.5">
              <span>เลขประจำตัวผู้เสียภาษีอากร</span>
              <span className="flex-1 border-b border-dotted border-black px-1 text-center font-semibold">
                {showCustomer ? customerTaxId : ""}
              </span>
            </span>
            <span>เบอร์โทรศัพท์</span>
            <span className="border-b border-dotted border-black text-center font-semibold">
              {showCustomer && customerPhone ? formatPhone(customerPhone) : ""}
            </span>
          </p>
          <p className="grid grid-cols-[60px_minmax(0,1.7fr)_74px_1fr] items-end gap-1.5 whitespace-nowrap">
            <span>ยี่ห้อ-รุ่นรถ</span>
            {/* ยี่ห้อ-รุ่นยาวเกินยอมตัดเป็น … ฝั่งขวา (ทะเบียน เบอร์รถ) ห้ามตัด ถ้าไม่พอจะเบียดฝั่งซ้ายแทน */}
            <span className="truncate border-b border-dotted border-black text-center font-semibold">
              {vehicleName}
            </span>
            <span>ทะเบียนรถ</span>
            <span className="flex items-end gap-1.5">
              <span className="flex-1 border-b border-dotted border-black text-center font-semibold">
                {plateText}
              </span>
              {fleetNo && (
                <>
                  <span>เบอร์รถ</span>
                  <span className="border-b border-dotted border-black px-0.5 text-center font-semibold">
                    {fleetNo}
                  </span>
                </>
              )}
            </span>
          </p>
        </div>

        <table className="mt-2 w-full table-fixed border-collapse">
          <thead>
            <tr className="bg-gray-200">
              <th className="w-15.5 border border-black p-[3px] font-semibold">
                จำนวน
              </th>
              <th className="border border-black p-[3px] font-semibold">
                รายการ
              </th>
              <th className="w-27 border border-black p-[3px] font-semibold whitespace-nowrap">
                ราคาต่อหน่วย
              </th>
              <th className="w-23 border border-black p-[3px] font-semibold">
                จำนวนเงิน
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map(({ item, quantity, sideLabel }) => {
              const amount = Number(item.unitPrice) * quantity;
              return (
                <tr key={item.id}>
                  <td className="h-5.5 border border-black px-[3px] text-center">
                    {quantityLabel(item, quantity)}
                  </td>
                  <td className="border border-black px-1 break-words">
                    {showBrand ? item.itemName : shortWorkName(item)}
                    {sideLabel ? ` (${sideLabel})` : ""}
                  </td>
                  <td className="border border-black px-1 text-right">
                    {formatAmount(item.unitPrice)}
                  </td>
                  <td className="border border-black px-1 text-right">
                    {formatAmount(amount)}
                  </td>
                </tr>
              );
            })}
            {Array.from({ length: blankRows }).map((_, index) => (
              <tr key={`blank-${index}`}>
                <td className="h-5.5 border border-black" />
                <td className="border border-black" />
                <td className="border border-black" />
                <td className="border border-black" />
              </tr>
            ))}
            {hasDiscount && (
              <>
                <tr>
                  <td colSpan={2} />
                  <td className="border border-black px-1 text-center whitespace-nowrap">
                    รวมเป็นเงิน
                  </td>
                  <td className="border border-black px-1 text-right">
                    {formatMoney(subtotal)}
                  </td>
                </tr>
                {discountItems.map((item) => (
                  <tr key={item.id}>
                    <td colSpan={2} />
                    <td className="border border-black px-1 text-center">
                      {item.itemName}
                    </td>
                    <td className="border border-black px-1 text-right">
                      {formatMoney(
                        Number(item.unitPrice) * Number(item.quantity),
                      )}
                    </td>
                  </tr>
                ))}
              </>
            )}
            {isLastPage && (
              <tr className="bg-gray-200">
                <td colSpan={2} className="border border-black px-1 py-[5px]">
                  <span className="mr-1.5">จำนวนเงินรวมทั้งสิ้น</span>
                  <span className="font-semibold">{bahtText(total)}</span>
                </td>
                <td className="border border-black px-1 text-center whitespace-nowrap">
                  จำนวนเงินรวม
                </td>
                <td className="border border-black px-1 text-right text-[13pt] font-semibold">
                  {formatMoney(total)}
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* ช่องวิธีจ่ายมีเฉพาะใบส่งของ (ต้องตรงกับ receiptHtml.js) */}
        {repair.status === "CREDIT" && (
          <>
            <div className="mt-2 flex items-center gap-5">
              {PAYMENT_BOXES.map((box) => (
                <span key={box.label} className="flex items-center gap-1.5">
                  <span className="flex h-[13px] w-[13px] items-center justify-center border border-black text-[10px] leading-none">
                    {/* เช็คไม่มีในระบบ (method เป็นว่าง) บิลที่ยังไม่ได้เก็บเงินก็ว่างเหมือนกัน
                  ต้องเช็คว่ามีวิธีจ่ายจริงก่อน ไม่งั้นจะไปติ๊กช่องเช็คให้เอง */}
                    {box.method && repair.paymentMethod === box.method
                      ? "✓"
                      : ""}
                  </span>
                  {box.label}
                </span>
              ))}
            </div>

            <div className="mt-1.5 flex items-end gap-2">
              {["ธนาคาร", "เลขที่", "ลงวันที่", "จำนวนเงิน"].map((label) => (
                <span key={label} className="flex flex-1 items-end gap-1">
                  <span className="whitespace-nowrap">{label}</span>
                  <span className="flex-1 border-b border-dotted border-black" />
                </span>
              ))}
            </div>
          </>
        )}

        <div className="mt-5.5 flex justify-between gap-4">
          <p className="flex flex-1 items-end gap-1">
            ลงชื่อ
            <span className="flex-1 border-b border-dotted border-black" />
            {signLabels[0]}
          </p>
          <p className="flex flex-1 items-end gap-1">
            ลงชื่อ
            <span className="flex-1 border-b border-dotted border-black" />
            {signLabels[1]}
          </p>
        </div>
      </div>

      {/* ขยายเต็มที่ว่างท้ายแผ่น (ดู .receipt-qr ใน index.css)
          แผ่นที่แน่นเกินถูกยกรายการท้ายไปแผ่นใหม่ตั้งแต่ตอนแบ่งแผ่น */}
      {showPaymentQr && (
        <div className="receipt-qr-area">
          <div className="receipt-qr">
            <img
              src="/promptpay-logo-bw.jpg"
              alt="พร้อมเพย์"
              className="receipt-qr-logo"
            />
            <img
              src="/payment-qr.svg"
              alt="QR รับเงิน"
              className="receipt-qr-code"
            />
            <p className="receipt-qr-name">{PAYMENT_QR_NAME}</p>
            <p className="receipt-qr-hint">สแกนเพื่อชำระเงิน</p>
          </div>
        </div>
      )}
    </>
  );
};

export default ReceiptPaper;
