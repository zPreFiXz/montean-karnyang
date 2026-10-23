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

// เนื้อในของใบเสร็จหนึ่งแผ่น กระดาษกับการย่อขนาดอยู่ที่ ReceiptPreviewDialog
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
  // ลูกค้าเซ็นซ้าย ร้านเซ็นขวา (ฝั่งผู้ออกเอกสาร) ทุกใบ
  // คนเซ็นตามหน้าที่ของใบ ใบส่งของกับใบเสนอราคายังไม่มีการรับเงิน (ต้องตรงกับ receiptHtml.js ฝั่งเซิร์ฟเวอร์)
  const signLabels =
    repair.status === "CREDIT"
      ? ["ผู้รับของ", "ผู้ส่งของ"]
      : repair.status === "ESTIMATE"
        ? ["ผู้อนุมัติ", "ผู้เสนอราคา"]
        : ["ผู้จ่ายเงิน", "ผู้รับเงิน"];

  // ส่วนลดไม่ใช่ของที่ขาย ยกออกจากตารางไปไว้เป็นแถวใต้ยอดรวมแทน อ่านง่ายกว่าปนอยู่กลางรายการ
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
      {/* เนื้อใบสูงตามจริง ที่ว่างที่เหลือทั้งหมดของแผ่นเป็นของ QR (แผ่นกระดาษเป็น flex แนวตั้ง ดู ReceiptPreviewDialog) */}
      <div className="flex-none">
        <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-[8px]">
          {/* ช่องซ้ายเว้นว่าง ชื่อเอกสารจึงอยู่กลางแผ่นเสมอ ไม่ถูกเลขที่ทางขวาดันเยื้อง */}
          <span />
          <div className="text-center">
            <p className="text-[15pt] font-semibold">
              {receiptDocTitle(repair)}
              {repair.isCancelled && " (ยกเลิก)"}
            </p>
            {copyLabel && <p>({copyLabel})</p>}
            <p className="text-[17pt] font-semibold">{SHOP.name}</p>
          </div>
          <p className="flex items-end justify-end gap-[4px] whitespace-nowrap">
            เลขที่
            {/* บิลหลายแผ่นเขียนเลขต่อเนื่องแบบ RE-6909-0001/1 RE-6909-0001/2 ตามแบบเอกสารต่อเนื่องของไทย */}
            <span className="min-w-[42px] border-b border-dotted border-black text-center font-semibold">
              {pageCount > 1
                ? `${receiptDocNo(repair)}/${pageIndex + 1}`
                : receiptDocNo(repair)}
            </span>
          </p>
        </div>

        <p className="mt-[2px] text-center">{SHOP.address}</p>
        <p className="text-center">{SHOP.contact}</p>

        <div className="mt-[8px] flex justify-end gap-[12px]">
          <p className="flex items-end gap-[4px]">
            วันที่
            <span className="w-[52px] border-b border-dotted border-black text-center font-semibold">
              {day}
            </span>
          </p>
          <p className="flex items-end gap-[4px]">
            เดือน
            <span className="w-[92px] border-b border-dotted border-black text-center font-semibold">
              {month}
            </span>
          </p>
          <p className="flex items-end gap-[4px]">
            พ.ศ.
            <span className="w-[52px] border-b border-dotted border-black text-center font-semibold">
              {year}
            </span>
          </p>
        </div>

        <div className="mt-[6px] space-y-[5px]">
          {/* ปิดสวิตช์แล้วเว้นช่องไว้เฉยๆ ไม่เอาบรรทัดออก
                ใบจะได้หน้าตาเหมือนเดิมทุกครั้งและเขียนมือเพิ่มทีหลังได้ */}
          {/* ชื่อลูกค้าเต็มบรรทัด ชื่อหน่วยงานยาวๆ จะไม่ถูกตัด (ต้องตรงกับ receiptHtml.js) */}
          <p className="flex items-end gap-[6px]">
            <span className="whitespace-nowrap">ชื่อลูกค้า</span>
            <span className="min-w-0 flex-1 truncate border-b border-dotted border-black text-center font-semibold">
              {showCustomer ? customerName : ""}
            </span>
          </p>
          <p className="flex items-end gap-[6px]">
            <span className="whitespace-nowrap">ที่อยู่</span>
            <span className="flex-1 border-b border-dotted border-black text-center font-semibold">
              {showCustomer ? customerAddress : ""}
            </span>
          </p>
          {/* เลขผู้เสียภาษีกับเบอร์โทรเป็นตัวเลขสั้นทั้งคู่ จึงแบ่งบรรทัดเดียวกันคนละครึ่ง
              ลูกค้าส่วนใหญ่ไม่มีเลขผู้เสียภาษี ช่องว่างไว้ให้เขียนมือได้เหมือนในเล่ม */}
          {/* ใช้คอลัมน์ชุดเดียวกับแถวรถ เบอร์โทรจึงตรงกับทะเบียนรถพอดี (ต้องตรงกับ p.halves ใน receiptHtml.js)
              เลขผู้เสียภาษีกินสองคอลัมน์แรก เพราะป้ายยาว ฝั่งซ้ายจึงกว้างพอใส่ป้ายกับเลข 13 หลัก */}
          <p className="grid grid-cols-[60px_minmax(0,1.7fr)_74px_1fr] items-end gap-[6px] whitespace-nowrap">
            <span className="col-span-2 flex items-end gap-[6px]">
              <span>เลขประจำตัวผู้เสียภาษีอากร</span>
              <span className="flex-1 border-b border-dotted border-black px-[4px] text-center font-semibold">
                {showCustomer ? customerTaxId : ""}
              </span>
            </span>
            <span>เบอร์โทรศัพท์</span>
            <span className="border-b border-dotted border-black text-center font-semibold">
              {showCustomer && customerPhone ? formatPhone(customerPhone) : ""}
            </span>
          </p>
          {/* รถอยู่บรรทัดของตัวเอง เพราะใบเสร็จของร้านยางต้องรู้ว่าเป็นของคันไหน */}
          <p className="grid grid-cols-[60px_minmax(0,1.7fr)_74px_1fr] items-end gap-[6px] whitespace-nowrap">
            <span>ยี่ห้อ-รุ่นรถ</span>
            {/* ยี่ห้อ-รุ่นยาวเกินยอมตัดเป็น … ฝั่งขวา (ทะเบียน เบอร์รถ) ห้ามตัด ถ้าไม่พอจะเบียดฝั่งซ้ายแทน */}
            <span className="truncate border-b border-dotted border-black text-center font-semibold">
              {vehicleName}
            </span>
            <span>ทะเบียนรถ</span>
            <span className="flex items-end gap-[6px]">
              <span className="flex-1 border-b border-dotted border-black text-center font-semibold">
                {plateText}
              </span>
              {/* รถส่วนใหญ่ไม่มีเบอร์ ขึ้นเฉพาะคันที่มี ช่องกว้างพอดีเลข */}
              {fleetNo && (
                <>
                  <span>เบอร์รถ</span>
                  <span className="border-b border-dotted border-black px-[2px] text-center font-semibold">
                    {fleetNo}
                  </span>
                </>
              )}
            </span>
          </p>
        </div>

        <table className="mt-[8px] w-full table-fixed border-collapse">
          <thead>
            <tr className="bg-gray-200">
              <th className="w-[62px] border border-black p-[3px] font-semibold">
                จำนวน
              </th>
              <th className="border border-black p-[3px] font-semibold">
                รายการ
              </th>
              <th className="w-[108px] border border-black p-[3px] font-semibold whitespace-nowrap">
                ราคาต่อหน่วย
              </th>
              <th className="w-[92px] border border-black p-[3px] font-semibold">
                จำนวนเงิน
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map(({ item, quantity, sideLabel }) => {
              const amount = Number(item.unitPrice) * quantity;
              return (
                <tr key={item.id}>
                  <td className="h-[22px] border border-black px-[3px] text-center">
                    {quantityLabel(item, quantity)}
                  </td>
                  <td className="border border-black px-[4px] break-words">
                    {showBrand ? item.itemName : shortWorkName(item)}
                    {sideLabel ? ` (${sideLabel})` : ""}
                  </td>
                  <td className="border border-black px-[4px] text-right">
                    {formatAmount(item.unitPrice)}
                  </td>
                  <td className="border border-black px-[4px] text-right">
                    {formatAmount(amount)}
                  </td>
                </tr>
              );
            })}
            {Array.from({ length: blankRows }).map((_, index) => (
              <tr key={`blank-${index}`}>
                <td className="h-[22px] border border-black" />
                <td className="border border-black" />
                <td className="border border-black" />
                <td className="border border-black" />
              </tr>
            ))}
            {hasDiscount && (
              <>
                <tr>
                  {/* ฝั่งซ้ายของสองแถวนี้ปล่อยโล่ง ไม่ต้องตีเส้นเป็นช่องเปล่า */}
                  <td colSpan={2} />
                  <td className="border border-black px-[4px] text-center whitespace-nowrap">
                    รวมเป็นเงิน
                  </td>
                  <td className="border border-black px-[4px] text-right">
                    {formatMoney(subtotal)}
                  </td>
                </tr>
                {/* ส่วนลดตั้งชื่อเองได้ และมีได้หลายบรรทัด แยกแถวละรายการตามชื่อที่ตั้งไว้ */}
                {discountItems.map((item) => (
                  <tr key={item.id}>
                    <td colSpan={2} />
                    <td className="border border-black px-[4px] text-center">
                      {item.itemName}
                    </td>
                    <td className="border border-black px-[4px] text-right">
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
                <td
                  colSpan={2}
                  className="border border-black px-[4px] py-[5px]"
                >
                  <span className="mr-[6px]">จำนวนเงินรวมทั้งสิ้น</span>
                  <span className="font-semibold">{bahtText(total)}</span>
                </td>
                <td className="border border-black px-[4px] text-center whitespace-nowrap">
                  จำนวนเงินรวม
                </td>
                {/* ยอดรวมคือตัวเลขที่ลูกค้ามองหา จึงใหญ่กว่ายอดของแต่ละรายการหนึ่งขั้น */}
                <td className="border border-black px-[4px] text-right text-[13pt] font-semibold">
                  {formatMoney(total)}
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* ช่องวิธีจ่ายกับแถวเช็คมีเฉพาะใบส่งของ ลูกค้าเครดิตจ่ายทีหลัง ต้องจดว่าจ่ายทางไหน
          ใบเสร็จกับใบเสนอราคาไม่ต้องมี (ต้องตรงกับ receiptHtml.js ฝั่งเซิร์ฟเวอร์)
          เล่มกระดาษมีแค่เงินสดกับเช็ค แต่ร้านรับโอนกับบัตรด้วย จึงเพิ่มอีกสองช่อง */}
        {repair.status === "CREDIT" && (
          <>
            <div className="mt-[8px] flex items-center gap-[20px]">
              {PAYMENT_BOXES.map((box) => (
                <span key={box.label} className="flex items-center gap-[6px]">
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

            {/* แถวของเช็คในเล่มจริง เว้นว่างไว้ให้เขียนมือเหมือนเดิม
          สี่ช่องกว้างเท่ากัน แบ่งที่ว่างเท่าๆ กัน อ่านเป็นแถวเดียวกันได้ */}
            <div className="mt-[6px] flex items-end gap-[8px]">
              {["ธนาคาร", "เลขที่", "ลงวันที่", "จำนวนเงิน"].map((label) => (
                <span key={label} className="flex flex-1 items-end gap-[4px]">
                  <span className="whitespace-nowrap">{label}</span>
                  <span className="flex-1 border-b border-dotted border-black" />
                </span>
              ))}
            </div>
          </>
        )}

        <div className="mt-[22px] flex justify-between gap-[16px]">
          <p className="flex flex-1 items-end gap-[4px]">
            ลงชื่อ
            <span className="flex-1 border-b border-dotted border-black" />
            {signLabels[0]}
          </p>
          <p className="flex flex-1 items-end gap-[4px]">
            ลงชื่อ
            <span className="flex-1 border-b border-dotted border-black" />
            {signLabels[1]}
          </p>
        </div>
      </div>

      {/* QR รับเงินกลางแผ่นใต้ช่องลงชื่อ เฉพาะแผ่นสุดท้ายที่มียอดรวม ใบเสนอราคายังไม่ถึงตอนจ่ายเงินจึงไม่มี
          ขนาดขยายเต็มที่ว่างท้ายแผ่น (สูตรอยู่ที่ .receipt-qr ใน index.css)
          แผ่นสุดท้ายที่แน่นเกินจะวาง QR ได้ ถูกยกรายการท้ายไปแผ่นใหม่ตั้งแต่ตอนแบ่งแผ่น (ดู makeRoomForQr) */}
      {showPaymentQr && (
        <div className="receipt-qr-area">
          <div className="receipt-qr">
            {/* โลโก้พร้อมเพย์บอกลูกค้าว่าสแกนด้วยแอปธนาคารไหนก็ได้ */}
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
