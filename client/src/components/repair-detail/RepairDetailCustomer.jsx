import {
  Building2,
  Store,
  CircleUserRound,
  MapPin,
  Phone,
  IdCard,
  SquarePen,
} from "lucide-react";
import OutlineCardIcon from "@/components/icons/OutlineCardIcon";
import { organizationLabel } from "@/constants/organizations";
import { formatPhone } from "@/utils/formats";

const RepairDetailCustomer = ({ customer, statusInfo, onSetOrganization }) => {
  const hasContact = !!(
    customer.phoneNumber ||
    customer.address ||
    customer.taxId
  );
  const hasSingleCustomerLine = !!customer.name !== hasContact;

  return (
    <div>
      <div className="mb-[16px] flex items-start gap-[8px] px-[20px]">
        <div
          className={`mt-[6px] flex aspect-square h-[45px] w-[45px] items-center justify-center rounded-full ${statusInfo.bg}`}
        >
          {/* ไอคอนบอกประเภทลูกค้าไปเลย กวาดตาแล้วรู้ว่าบิลนี้เป็นของใครแบบไหน
              ทั้งสามแบบใช้กรอบเดียวกับไอคอนอื่น จะได้ไม่มีวงไหนดูต่างออกไป */}
          <OutlineCardIcon
            icon={
              customer.organizationType === "GOVERNMENT"
                ? Building2
                : customer.organizationType === "SHOP"
                  ? Store
                  : CircleUserRound
            }
            color={statusInfo.iconColor}
          />
        </div>
        {/* กรอกมาอย่างเดียว (ชื่อล้วน หรือเบอร์ล้วน) ข้อความจะสูงไม่ถึงวงกลม
            ต้องดันให้อยู่กึ่งกลางแกนตั้งเทียบวงกลม ไม่งั้นจะลอยเกาะขอบบน */}
        <div
          className={
            hasSingleCustomerLine
              ? "mt-[6px] flex min-h-[45px] min-w-0 flex-1 flex-col justify-center"
              : "flex min-w-0 flex-1 flex-col"
          }
        >
          {customer.name && (
            <p
              className={`text-[22px] font-semibold md:text-2xl ${statusInfo.color} leading-tight`}
            >
              {customer.name}
            </p>
          )}
          {/* ขึ้นเฉพาะหน่วยงานกับร้านค้า ซึ่งเป็นข้อยกเว้นที่ต้องรู้
              ลูกค้าทั่วไปมีเกือบทุกบิล บอกไปก็ไม่ได้อะไรใหม่ ไม่มีบรรทัดนี้ก็แปลว่าทั่วไป
              ใช้สีเดียวกับบรรทัดยี่ห้อ-รุ่นรถ เพราะทำหน้าที่เดียวกันคือขยายบรรทัดบน */}
          {customer.organizationType && (
            <p className="text-subtle-dark text-lg leading-tight font-medium md:text-xl">
              {organizationLabel(customer.organizationType)}
            </p>
          )}
          {(customer.phoneNumber || customer.address || customer.taxId) && (
            <div
              className={`flex flex-wrap items-start gap-[8px] ${
                customer.name ? "mt-[4px]" : ""
              }`}
            >
              {customer.phoneNumber && (
                <div className="flex flex-shrink-0 items-center gap-[4px]">
                  <Phone size={16} className="text-subtle-dark" />
                  <a
                    href={`tel:${customer.phoneNumber}`}
                    className="text-subtle-dark text-lg leading-tight font-medium underline md:text-xl"
                  >
                    {formatPhone(customer.phoneNumber)}
                  </a>
                </div>
              )}
              {customer.address && (
                <div className="flex items-start gap-[4px]">
                  <MapPin
                    size={16}
                    className="text-subtle-dark mt-[2px] flex-shrink-0"
                  />
                  <p className="text-subtle-dark text-lg leading-tight font-medium md:text-xl">
                    {customer.address}
                  </p>
                </div>
              )}
              {customer.taxId && (
                <div className="flex flex-shrink-0 items-center gap-[4px]">
                  <IdCard size={16} className="text-subtle-dark" />
                  <p className="text-subtle-dark text-lg leading-tight font-medium md:text-xl">
                    {customer.taxId}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
        {/* ตั้งประเภทลูกค้าได้จากบิลเครดิต เพราะเป็นจังหวะที่รู้ว่าใครติดเงินไว้ */}
        {onSetOrganization && (
          <button
            type="button"
            onClick={onSetOrganization}
            aria-label="ตั้งประเภทลูกค้า"
            title="ตั้งประเภทลูกค้า"
            className="bg-subtle-light/15 mt-[6px] flex h-[40px] w-[40px] shrink-0 cursor-pointer items-center justify-center rounded-full"
          >
            <SquarePen className="text-subtle-dark h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  );
};

export default RepairDetailCustomer;
