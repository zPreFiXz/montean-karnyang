import { Fragment } from "react";
import {
  billLines,
  purchaseAmountOf,
  PAYMENT_QR_NAME,
  SHOP,
  receiptDateOf,
} from "@/utils/receipt";
import { bahtText } from "@/utils/bahtText";
import { formatPhone, formatQuantity } from "@/utils/formats";

// ต้องตรงกับ buildOrganizationBillHtml ใน server/utils/receiptHtml.js
const money = (value) => Number(value || 0).toLocaleString("th-TH");
// ปีสองหลัก (3 พ.ย. 69) ช่องวันที่จะได้แคบ (ตรงกับ billDate ใน receiptHtml.js)
const billDate = (value) =>
  new Date(value).toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
    year: "2-digit",
  });

// แถวอะไหล่ที่รับจากร้าน: ชื่อ / จำนวน × ราคา (ต้องตรงกับ purchaseLines ใน receiptHtml.js)
const purchaseLines = (purchase) => [
  purchase.itemName,
  `${formatQuantity(purchase.quantity)}${purchase.unit ? ` ${purchase.unit}` : ""} × ${money(purchase.unitPrice)}`,
];

// entries = แถวของแผ่นนี้จาก billSheets (บิล แล้วต่อด้วยอะไหล่ที่รับจากร้าน)
// billTotal / purchaseTotal = ยอดรวมทุกแผ่น hasPurchases = ร้านค้าที่มีรายการหักกลบ
// ยอดรวม ช่องเซ็น และ QR อยู่เฉพาะแผ่นสุดท้าย (ต้องตรงกับ buildOrganizationBillHtml)
const CreditSummaryPaper = ({
  customer,
  entries,
  billTotal,
  purchaseTotal = 0,
  hasPurchases = false,
  docNo,
  isLastPage = true,
}) => {
  const billedAt = new Date();
  // ติดลบ = ร้านเราต้องจ่ายร้านเขา ไม่มี QR รับเงิน
  const net = billTotal - purchaseTotal;
  const cell = "border border-black px-1";

  return (
    <>
      <div className="flex-none">
        <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-2">
          <span />
          <div className="text-center">
            <p className="text-[15pt] font-semibold">ใบวางบิล</p>
            <p className="text-[17pt] font-semibold">{SHOP.name}</p>
          </div>
          <p className="flex items-end justify-end gap-1 whitespace-nowrap">
            เลขที่
            <span className="min-w-10.5 border-b border-dotted border-black text-center font-semibold">
              {docNo || ""}
            </span>
          </p>
        </div>

        <p className="mt-0.5 text-center">{SHOP.address}</p>
        <p className="text-center">{SHOP.contact}</p>

        {/* ต้องตรงกับ buildOrganizationBillHtml วันที่วางบิลคือวันที่พิมพ์ */}
        <div className="mt-2 flex justify-end gap-3">
          <p className="flex items-end gap-1">
            วันที่
            <span className="w-13 border-b border-dotted border-black text-center font-semibold">
              {billedAt.getDate()}
            </span>
          </p>
          <p className="flex items-end gap-1">
            เดือน
            <span className="w-23 border-b border-dotted border-black text-center font-semibold">
              {billedAt.toLocaleDateString("th-TH", { month: "long" })}
            </span>
          </p>
          <p className="flex items-end gap-1">
            พ.ศ.
            <span className="w-13 border-b border-dotted border-black text-center font-semibold">
              {billedAt.getFullYear() + 543}
            </span>
          </p>
        </div>

        <div className="mt-1.5 space-y-[5px]">
          <p className="flex items-end gap-1.5">
            <span className="whitespace-nowrap">ชื่อลูกค้า</span>
            <span className="min-w-0 flex-1 truncate border-b border-dotted border-black text-center font-semibold">
              {customer?.name || ""}
            </span>
          </p>
          <p className="flex items-end gap-1.5">
            <span className="whitespace-nowrap">ที่อยู่</span>
            {/* บรรทัดเดียวเสมอ ไม่งั้นความสูงหัวกระดาษเปลี่ยนแล้วจำนวนบิลต่อแผ่นที่คำนวณไว้จะผิด */}
            <span className="min-w-0 flex-1 truncate border-b border-dotted border-black text-center font-semibold">
              {customer?.address || ""}
            </span>
          </p>
          <p className="grid grid-cols-[60px_minmax(0,1.7fr)_74px_1fr] items-end gap-1.5 whitespace-nowrap">
            <span className="col-span-2 flex items-end gap-1.5">
              <span>เลขประจำตัวผู้เสียภาษีอากร</span>
              <span className="flex-1 border-b border-dotted border-black px-1 text-center font-semibold">
                {customer?.taxId || ""}
              </span>
            </span>
            <span>เบอร์โทรศัพท์</span>
            <span className="border-b border-dotted border-black text-center font-semibold">
              {customer?.phoneNumber ? formatPhone(customer.phoneNumber) : ""}
            </span>
          </p>
        </div>

        <table className="mt-2 w-full table-fixed border-collapse">
          <thead>
            <tr className="bg-gray-200">
              <th className="w-10 border border-black p-[3px] font-semibold">
                ลำดับ
              </th>
              {/* เลขที่ วันที่ และจำนวนเงินหดเท่าที่จำเป็น ช่องรายละเอียดจะได้กว้างพอใส่ยี่ห้อรุ่นกับทะเบียน (ตรงกับ receiptHtml.js) */}
              <th className="w-26 border border-black p-[3px] font-semibold">
                เลขที่ใบส่งของ
              </th>
              <th className="w-18.5 border border-black p-[3px] font-semibold">
                วันที่
              </th>
              <th className="border border-black p-[3px] font-semibold">
                รายละเอียด
              </th>
              <th className="w-20 border border-black p-[3px] font-semibold">
                จำนวนเงิน
              </th>
            </tr>
          </thead>
          <tbody>
            {entries.map(({ kind, item, index }) =>
              kind === "bill" ? (
                <tr key={`bill-${item.id}`}>
                  <td className={`${cell} text-center`}>{index + 1}</td>
                  {/* บิลเครดิตอ้างเลขใบส่งของที่ลูกค้าเซ็นรับไว้ */}
                  <td className={`${cell} text-center whitespace-nowrap`}>
                    {item.deliveryNo || item.receiptNo || item.id}
                  </td>
                  <td className={`${cell} text-center whitespace-nowrap`}>
                    {billDate(receiptDateOf(item))}
                  </td>
                  {/* ขอบบนล่าง 2px เท่าเซลล์ของใบพิมพ์ แถวจะสูงเท่ากัน */}
                  <td className={`${cell} py-0.5`}>
                    {billLines(item)
                      .filter(Boolean)
                      .map((line) => (
                        <div key={line} className="truncate">
                          {line}
                        </div>
                      ))}
                  </td>
                  <td className={`${cell} text-right`}>
                    {money(item.totalPrice)}
                  </td>
                </tr>
              ) : (
                <Fragment key={`purchase-${item.id}`}>
                  {index === 0 && (
                    <tr>
                      <td colSpan={5} className={`${cell} font-semibold`}>
                        อะไหล่ที่{SHOP.name}รับจากร้าน (หักกลบ)
                      </td>
                    </tr>
                  )}
                  <tr>
                    <td className={`${cell} text-center`}>{index + 1}</td>
                    <td className={`${cell} text-center`}>-</td>
                    <td className={`${cell} text-center whitespace-nowrap`}>
                      {billDate(item.takenAt)}
                    </td>
                    <td className={`${cell} py-0.5`}>
                      {purchaseLines(item).map((line) => (
                        <div key={line} className="truncate">
                          {line}
                        </div>
                      ))}
                    </td>
                    <td className={`${cell} text-right`}>
                      {money(purchaseAmountOf(item))}
                    </td>
                  </tr>
                </Fragment>
              ),
            )}
            {isLastPage && hasPurchases && (
              <>
                <tr>
                  <td colSpan={4} className={cell}>
                    รวมค่าบิล
                  </td>
                  <td className={`${cell} text-right`}>{money(billTotal)}</td>
                </tr>
                <tr>
                  <td colSpan={4} className={cell}>
                    หัก ค่าอะไหล่ที่รับจากร้าน
                  </td>
                  <td className={`${cell} text-right`}>
                    {money(purchaseTotal)}
                  </td>
                </tr>
              </>
            )}
            {isLastPage && (
              <tr className="bg-gray-200">
                <td colSpan={4} className={`${cell} py-[5px]`}>
                  <span className="mr-1.5">
                    {!hasPurchases
                      ? "จำนวนเงินรวมทั้งสิ้น"
                      : net >= 0
                        ? "ยอดสุทธิที่ต้องชำระ"
                        : `${SHOP.name}ต้องชำระ`}
                  </span>
                  <span className="font-semibold">
                    {bahtText(Math.abs(net))}
                  </span>
                </td>
                <td className={`${cell} text-right text-[13pt] font-semibold`}>
                  {money(Math.abs(net))}
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* ลูกค้าซ้าย ร้านขวา แบบเดียวกับใบเสร็จและใบส่งของ (ต้องตรงกับ buildOrganizationBillHtml) */}
        {isLastPage ? (
          <div className="mt-5.5 flex justify-between gap-4">
            {["ผู้รับวางบิล", "ผู้วางบิล"].map((label) => (
              <p key={label} className="flex flex-1 items-end gap-1">
                ลงชื่อ
                <span className="flex-1 border-b border-dotted border-black" />
                {label}
              </p>
            ))}
          </div>
        ) : null}
      </div>

      {/* ลูกค้าจ่ายตามใบวางบิล QR จึงอยู่ที่นี่ ขนาดเท่าใบเสร็จ (ดู .receipt-qr ใน index.css) */}
      {isLastPage && net > 0 && (
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

export default CreditSummaryPaper;
