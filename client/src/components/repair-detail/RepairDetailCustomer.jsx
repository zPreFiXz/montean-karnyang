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
      <div className="mb-4 flex items-start gap-2 px-5">
        <div
          className={`mt-1.5 flex aspect-square h-[45px] w-[45px] items-center justify-center rounded-full ${statusInfo.bg}`}
        >
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
        {/* กรอกมาอย่างเดียว ข้อความจะสูงไม่ถึงวงกลม จึงดันให้อยู่กึ่งกลาง */}
        <div
          className={
            hasSingleCustomerLine
              ? "mt-1.5 flex min-h-[45px] min-w-0 flex-1 flex-col justify-center"
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
          {/* ขึ้นเฉพาะหน่วยงานกับร้านค้า ไม่ขึ้นป้ายลูกค้าทั่วไป */}
          {customer.organizationType && (
            <p className="text-subtle-dark text-lg leading-tight font-medium md:text-xl">
              {organizationLabel(customer.organizationType)}
            </p>
          )}
          {(customer.phoneNumber || customer.address || customer.taxId) && (
            <div
              className={`flex flex-wrap items-start gap-2 ${
                customer.name ? "mt-1" : ""
              }`}
            >
              {customer.phoneNumber && (
                <div className="flex flex-shrink-0 items-center gap-1">
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
                <div className="flex items-start gap-1">
                  <MapPin
                    size={16}
                    className="text-subtle-dark mt-0.5 flex-shrink-0"
                  />
                  <p className="text-subtle-dark text-lg leading-tight font-medium md:text-xl">
                    {customer.address}
                  </p>
                </div>
              )}
              {customer.taxId && (
                <div className="flex flex-shrink-0 items-center gap-1">
                  <IdCard size={16} className="text-subtle-dark" />
                  <p className="text-subtle-dark text-lg leading-tight font-medium md:text-xl">
                    {customer.taxId}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
        {onSetOrganization && (
          <button
            type="button"
            onClick={onSetOrganization}
            aria-label="ตั้งประเภทลูกค้า"
            title="ตั้งประเภทลูกค้า"
            className="bg-subtle-light/15 mt-1.5 flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full"
          >
            <SquarePen className="text-subtle-dark h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  );
};

export default RepairDetailCustomer;
