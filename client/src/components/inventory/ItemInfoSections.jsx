import InfoRow from "@/components/inventory/InfoRow";
import { formatCurrency, formatQuantity } from "@/utils/formats";
import { isPerSide } from "@/utils/suspension";
import { groupVehiclesByBrand, summarizeTireLots } from "@/utils/inventoryItem";

const Heading = ({ children, className = "mt-4" }) => (
  <p
    className={`font-athiti text-normal text-[22px] font-semibold md:text-2xl ${className}`}
  >
    {children}
  </p>
);

const Box = ({ children }) => (
  <div className="space-y-2 rounded-lg bg-gray-50 p-4">{children}</div>
);

const withUnit = (quantity, unit) =>
  [formatQuantity(quantity), unit].filter(Boolean).join(" ");

const ItemInfoSections = ({
  item,
  isService,
  isOilKit,
  tracksLots,
  showCost,
  stockTextColor,
}) => {
  const lotRows = tracksLots ? summarizeTireLots(item.tireLots) : [];
  const vehicleGroups = groupVehiclesByBrand(item.compatibleVehicles);

  return (
    <>
      <div className="mt-4 space-y-2">
        {!isService && <Heading className="">ข้อมูลทั่วไป</Heading>}
        <Box>
          {!isService && item.partNumber && (
            <InfoRow label="รหัสอะไหล่:">{item.partNumber}</InfoRow>
          )}
          <InfoRow label="หมวดหมู่:">{item.category?.name}</InfoRow>
          {/* ช่วงล่างบอกทุกตัว หมวดอื่นบอกเฉพาะตัวที่แยกซ้าย-ขวา */}
          {(item.category?.name === "ช่วงล่าง" ||
            isPerSide(item.attributes)) && (
            <InfoRow label="ข้าง:">
              {isPerSide(item.attributes) ? "แยกซ้าย-ขวา" : "ไม่แยกข้าง"}
            </InfoRow>
          )}
        </Box>

        {!isService && <Heading>ข้อมูลราคา</Heading>}
        <Box>
          {showCost && !isService && item.costPrice && (
            <InfoRow label="ราคาต้นทุน:">
              {formatCurrency(Number(item.costPrice))}
            </InfoRow>
          )}
          <InfoRow
            label={isService ? "ราคา:" : "ราคาขาย:"}
            valueClass="text-primary"
          >
            {formatCurrency(Number(item.sellingPrice || item.price || 0))}
          </InfoRow>
          {/* ยางเปอร์เซ็นต์สภาพไม่เท่ากัน ช่วงราคาอย่างเดียวไม่บอกว่าส่วนใหญ่ขายราคาไหน */}
          {item.soldPrices?.length > 0 && (
            <div>
              <p className="text-subtle-dark text-lg font-medium md:text-xl">
                ประวัติราคาขาย:
              </p>
              {item.soldPrices.map(({ price, quantity }) => (
                <div
                  key={price}
                  className="flex justify-between pl-4 tabular-nums"
                >
                  <p className="text-normal text-lg font-semibold md:text-xl">
                    {formatCurrency(Number(price))}
                  </p>
                  <p className="text-subtle-dark text-lg font-semibold md:text-xl">
                    {withUnit(quantity, item.unit)}
                  </p>
                </div>
              ))}
            </div>
          )}
          {/* อะไหล่บอกหน่วยในกล่องสต็อกแล้ว */}
          {isService && item.unit && (
            <InfoRow label="หน่วย:">{item.unit}</InfoRow>
          )}
        </Box>

        {!isService && (
          <div className="space-y-2">
            <Heading>ข้อมูลสต็อก</Heading>
            <Box>
              {isOilKit ? (
                <>
                  <InfoRow label="ใช้น้ำมัน:">
                    {[item.oilSource.brand, item.oilSource.name]
                      .filter(Boolean)
                      .join(" ")}
                  </InfoRow>
                  <InfoRow label="น้ำมันเหลือ:">
                    {`${formatQuantity(item.oilSource.stockQuantity)} ลิตร`}
                  </InfoRow>
                  <InfoRow label="ใช้ชุดละ:">
                    {`${formatQuantity(item.oilLiters)} ลิตร`}
                  </InfoRow>
                </>
              ) : (
                <>
                  <InfoRow label="จำนวนสต็อก:" valueClass={stockTextColor}>
                    {item.stockQuantity} {item.unit}
                  </InfoRow>
                  <InfoRow label="สต็อกขั้นต่ำ:">
                    {item.minStockLevel} {item.unit}
                  </InfoRow>
                </>
              )}
              {lotRows.length > 0 && (
                <div className="space-y-2 border-t border-gray-200 pt-2">
                  <p className="text-subtle-dark text-lg font-medium md:text-xl">
                    สัปดาห์/ปีผลิต:
                  </p>
                  {lotRows.map((row) => (
                    <div key={row.label} className="flex justify-between">
                      <p className="text-subtle-dark pl-3 text-lg font-medium md:text-xl">
                        • {row.label}
                      </p>
                      <p className="text-normal text-lg font-semibold md:text-xl">
                        {row.quantity} {item.unit}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </Box>
          </div>
        )}
      </div>

      {!isService && vehicleGroups.length > 0 && (
        <div className="mt-4">
          <Heading className="mb-2">รุ่นรถที่ใส่ได้</Heading>
          {/* รุ่นครอบเป็นป้ายทีละอัน เพราะชื่อรุ่นมีเว้นวรรคในตัว (Pajero Sport) */}
          <Box>
            {vehicleGroups.map((group, groupIndex) => (
              <div
                key={group.brand}
                className={`flex gap-3 ${
                  groupIndex > 0 ? "border-t border-gray-200 pt-2" : ""
                }`}
              >
                <p className="text-subtle-dark w-27.5 shrink-0 pt-0.5 text-lg font-medium md:text-xl">
                  {group.brand}
                </p>
                <div className="flex min-w-0 flex-1 flex-wrap gap-1.5">
                  {group.models.map((model, index) => (
                    <p
                      key={`${model}-${index}`}
                      className="text-normal bg-surface rounded-md border border-gray-200 px-2 py-0.5 text-lg font-medium"
                    >
                      {model}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </Box>
        </div>
      )}
    </>
  );
};

export default ItemInfoSections;
