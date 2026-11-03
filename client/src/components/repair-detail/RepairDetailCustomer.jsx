import { MapPin, Phone, IdCard, SquarePen } from "lucide-react";
import OutlineCardIcon from "@/components/icons/OutlineCardIcon";
import { organizationIcon, organizationLabel } from "@/constants/organizations";
import { formatPhone } from "@/utils/formats";

const RepairDetailCustomer = ({ customer, statusInfo, onSetOrganization }) => {
  const hasContact = !!(
    customer.phoneNumber ||
    customer.address ||
    customer.taxId
  );
  const hasSingleCustomerLine = !!customer.name !== hasContact;
  const typeLabel =
    organizationLabel(customer.organizationType) ||
    (onSetOrganization ? "ลูกค้าทั่วไป" : "");

  return (
    <div>
      <div className="mb-4 flex items-start gap-2 px-5">
        <div
          className={`mt-1.5 flex aspect-square h-[45px] w-[45px] items-center justify-center rounded-full ${statusInfo.bg}`}
        >
          <OutlineCardIcon
            icon={organizationIcon(customer.organizationType)}
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
          {/* บรรทัดประเภทลูกค้าคู่กับปุ่มเปลี่ยน ลูกค้าทั่วไปจึงขึ้นชื่อประเภทด้วยเฉพาะตอนมีปุ่ม
              จะได้รู้ว่าตอนนี้เป็นประเภทไหนก่อนกดเปลี่ยน ไม่มีปุ่มก็ไม่ขึ้นป้ายลูกค้าทั่วไปเหมือนเดิม */}
          {typeLabel && (
            <div className="text-subtle-dark flex flex-wrap items-center gap-x-1.5 text-lg leading-tight font-medium md:text-xl">
              <span>{typeLabel}</span>
              {onSetOrganization && (
                <>
                  <span className="text-subtle-light">|</span>
                  <button
                    type="button"
                    onClick={onSetOrganization}
                    className="text-primary flex cursor-pointer items-center gap-1 font-semibold"
                  >
                    <SquarePen className="h-4 w-4" />
                    เปลี่ยนประเภท
                  </button>
                </>
              )}
            </div>
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
      </div>
    </div>
  );
};

export default RepairDetailCustomer;
