import { useLocation, useNavigate } from "react-router";
import { toastError } from "@/utils/handleError";
import { withMinDuration } from "@/utils/withMinDuration";
import { groupBySidePairs } from "@/utils/repairItemGroups";
import { useEffect, useState } from "react";
import FormButton from "@/components/forms/FormButton";
import RepairItemCard from "@/components/cards/RepairItemCard";
import { formatCurrency, getProvinceName } from "@/utils/formats";
import { createRepair, updateRepair } from "@/api/repair";
import { toast } from "sonner";
import {
  Edit,
  ChevronLeft,
  ArrowLeftRight,
  ArrowLeft,
  ArrowRight,
  Ellipsis,
  Wrench,
  ClipboardList,
} from "lucide-react";
import ComboBox from "@/components/ui/ComboBox";
import {
  PAYMENT_METHODS,
  DEFAULT_PAYMENT_METHOD,
} from "@/constants/paymentMethods";

const RepairReview = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { repairData, repairItems, editRepairId } = location.state || {};
  const origin = location.state?.origin || location.state?.from;
  const statusSlug = location.state?.statusSlug;
  const vehicleId = location.state?.vehicleId;
  const isSale = repairData?.type === "SALE";
  // งานบริการไม่ได้ผูกกับรถ จึงไม่มีข้อมูลรถให้สรุปเหมือนบิลขาย
  const hasNoVehicle = isSale || !!repairData?.noVehicle;
  // บิลขายหน้าร้านเก็บเงินตอนสร้างบิลเลย จึงต้องรู้วิธีชำระเงินตั้งแต่ตรงนี้
  const [paymentMethod, setPaymentMethod] = useState(
    repairData?.paymentMethod || DEFAULT_PAYMENT_METHOD,
  );

  useEffect(() => {
    window.scrollTo(0, 0);

    if (!repairData || !repairItems) {
      navigate("/repairs/new", { replace: true });
    }
  }, [repairData, repairItems, navigate]);

  if (!repairData || !repairItems) {
    return null;
  }

  // ข้อมูลลูกค้าไม่บังคับกรอก — ถ้าไม่มีสักช่องก็ไม่ต้องแสดงส่วนนี้ในเอกสาร
  const hasCustomerInfo = Boolean(
    repairData.name || repairData.address || repairData.phoneNumber,
  );

  const totalPrice = repairItems.reduce(
    (total, item) => total + item.sellingPrice * item.quantity,
    0,
  );

  const getItemsBySide = (side) => {
    return repairItems.filter((item) => item.side === side);
  };

  // ของที่เปลี่ยนทั้งสองข้างยุบเป็นบรรทัดเดียว ที่เหลือแยกฝั่งตามเดิม
  const { bothSides, leftOnly, rightOnly } = groupBySidePairs(
    getItemsBySide("left"),
    getItemsBySide("right"),
  );
  const otherItems = getItemsBySide("other");
  const generalItems = repairItems.filter(
    (item) => !item.side || item.side === "general",
  );

  const handleConfirmRepair = async () => {
    setIsSubmitting(true);
    try {
      const repair = {
        name: repairData.name,
        address: repairData.address,
        phoneNumber: repairData.phoneNumber,
        brand: repairData.brand,
        model: repairData.model,
        // ทะเบียนไทยเขียนเว้นวรรค ไม่ใช่ขีด — ต้องตรงกับที่ RepairDetail แยกกลับตอนกดแก้ไข
        plate: `${repairData.plateLetters} ${repairData.plateNumbers}`,
        province: getProvinceName(repairData.province),
        description: repairData.description,
        ...(repairData.mileage ? { mileage: Number(repairData.mileage) } : {}),
        totalPrice: totalPrice,
        type: repairData.type,
        ...(repairData.noVehicle ? { noVehicle: true } : {}),
        ...(isSale ? { paymentMethod } : {}),
        repairItems: repairItems.map((item) => {
          const isPart = !!(item.partNumber && item.brand);
          return {
            ...(isPart ? { partId: item.id } : { serviceId: item.id }),
            // บริการพิมพ์ชื่อเองได้ (เช่นค่าแรงที่ระบุงานลงไป) ต้องส่งชื่อไปด้วย
            // ไม่งั้นเซิร์ฟเวอร์จะบันทึกชื่อจากคลังทับ ชื่อที่แก้ไว้จะหาย
            ...(isPart || !item.name ? {} : { itemName: item.name }),
            unitPrice: Number(item.sellingPrice),
            quantity: item.quantity,
            ...(item.side ? { side: item.side } : {}),
          };
        }),
      };

      if (editRepairId) {
        await withMinDuration(() => updateRepair(editRepairId, repair));
        toast.success("แก้ไขงานซ่อมเรียบร้อยแล้ว");
        if (statusSlug) {
          navigate(`/repairs?status=${statusSlug}`);
        } else if (vehicleId) {
          navigate(`/vehicles/${vehicleId}`);
        } else if (origin === "repair-status") {
          navigate(`/repairs?status=in-progress`);
        } else {
          navigate(`/repairs/${editRepairId}`);
        }
      } else {
        await withMinDuration(() => createRepair(repair));
        toast.success(
          isSale ? "ขายเรียบร้อยแล้ว" : "สร้างงานซ่อมเรียบร้อยแล้ว",
        );
        const isDesktop = window.innerWidth >= 1280;
        if (isDesktop) {
          navigate("/");
        } else {
          navigate(
            isSale ? "/repairs?status=paid" : "/repairs?status=in-progress",
          );
        }
      }
    } catch (error) {
      toastError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ปุ่มย้อนกลับ = กลับไปหน้าเดิมเฉยๆ (scrollToItems = false)
  // ปุ่มแก้ไขรายการซ่อม = ตั้งใจไปที่ส่วนรายการ จึงพาไปที่หัวข้อของส่วนนั้น
  const handleGoBack = (scrollToItems = false) => {
    const from = location.state?.from;
    const backState = {
      repairData,
      repairItems,
      scrollToItems,
      editRepairId,
      origin,
      statusSlug,
      vehicleId,
      ...(!repairData.name || !repairData.name.trim()
        ? { hideMoreFields: true }
        : {}),
    };

    if (from === "suspension") {
      navigate("/inspections/suspension", { state: backState, replace: true });
    } else {
      navigate("/repairs/new", { state: backState, replace: true });
    }
  };

  return (
    <div className="bg-gradient-primary shadow-primary flex min-h-[100svh] flex-col xl:min-h-[calc(100vh-73px)] xl:flex-row xl:items-start xl:gap-[16px] xl:bg-transparent xl:px-[16px] xl:pt-[24px] xl:pb-[24px] xl:shadow-none">
      {/* ข้อมูลลูกค้าและรถยนต์ */}
      <div className="xl:shadow-primary flex flex-1 flex-col xl:h-fit xl:w-1/2 xl:flex-initial xl:rounded-2xl xl:bg-white">
        <div className="flex items-center gap-[8px] px-[20px] pt-[16px]">
          <button
            onClick={() => handleGoBack()}
            className="bg-surface/20 xl:bg-primary/10 flex h-[40px] w-[40px] cursor-pointer items-center justify-center rounded-full"
          >
            <ChevronLeft className="text-surface xl:hidden" />
            <ChevronLeft className="text-primary hidden xl:block" />
          </button>
          <div>
            <p className="text-surface xl:text-primary text-2xl font-semibold md:text-[26px]">
              สรุปงานซ่อม
            </p>
          </div>
        </div>

        {/* Mobile */}
        <div className="bg-surface mt-[16px] flex w-full flex-1 flex-col rounded-tl-2xl rounded-tr-2xl pt-[16px] xl:mt-0 xl:rounded-none xl:bg-transparent xl:shadow-none">
          {/* ข้อมูลลูกค้าไม่บังคับกรอก — กรอกมาบ้างก็แสดงครบทุกช่อง (ที่ว่างขึ้น "ไม่ระบุ")
              เพื่อให้เห็นว่าอะไรยังขาด แต่ถ้าไม่กรอกเลยก็ไม่ต้องมีส่วนนี้ */}
          <div className="px-[20px]">
            {hasCustomerInfo && (
              <div className="mb-[16px]">
                <p className="text-normal mb-[8px] text-[22px] font-semibold md:text-2xl">
                  ข้อมูลลูกค้า
                </p>
                <div className="space-y-[8px] rounded-[10px] bg-gray-50 p-[16px]">
                  <div className="flex justify-between">
                    <p className="text-subtle-dark text-lg font-medium md:text-xl">
                      ชื่อลูกค้า:
                    </p>
                    <p className="text-normal text-lg font-semibold md:text-xl">
                      {repairData.name || "ไม่ระบุ"}
                    </p>
                  </div>
                  <div className="flex justify-between">
                    <p className="text-subtle-dark text-lg font-medium md:text-xl">
                      ที่อยู่:
                    </p>
                    <p className="text-normal max-w-[250px] text-right text-lg font-semibold break-words md:text-xl">
                      {repairData.address || "ไม่ระบุ"}
                    </p>
                  </div>
                  <div className="flex justify-between">
                    <p className="text-subtle-dark text-lg font-medium md:text-xl">
                      เบอร์โทรศัพท์:
                    </p>
                    <p className="text-normal text-lg font-semibold md:text-xl">
                      {repairData.phoneNumber || "ไม่ระบุ"}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* บิลขายหน้าร้านจ่ายเงินทันที เลือกวิธีชำระเงินก่อนยืนยัน
                งานบริการไม่ต้องเลือกตรงนี้ เพราะเก็บเงินทีหลังเหมือนงานซ่อม */}
            {isSale && (
              <div className="mb-[16px]">
                <ComboBox
                  label="วิธีชำระเงิน"
                  color="text-subtle-dark"
                  options={PAYMENT_METHODS}
                  value={paymentMethod}
                  onChange={setPaymentMethod}
                  name="paymentMethod"
                />
              </div>
            )}

            {/* ไม่แสดงเมื่อบิลไม่ได้ผูกกับรถ (ขายหน้าร้าน / งานบริการ) */}
            {!hasNoVehicle && (
              <div className="mb-[16px]">
                <p className="text-normal mb-[8px] text-[22px] font-semibold md:text-2xl">
                  ข้อมูลรถยนต์
                </p>
                <div className="space-y-[8px] rounded-[10px] bg-gray-50 p-[16px]">
                  <div className="flex justify-between">
                    <p className="text-subtle-dark text-lg font-medium md:text-xl">
                      ยี่ห้อ-รุ่น:
                    </p>
                    <p className="text-normal text-lg font-semibold md:text-xl">
                      {repairData.brand} {repairData.model}
                    </p>
                  </div>
                  <div className="flex justify-between">
                    <p className="text-subtle-dark text-lg font-medium md:text-xl">
                      ทะเบียนรถ:
                    </p>
                    <p className="text-normal text-lg font-semibold md:text-xl">
                      {repairData.plateLetters &&
                      repairData.plateNumbers &&
                      getProvinceName(repairData.province)
                        ? `${repairData.plateLetters} ${
                            repairData.plateNumbers
                          } ${getProvinceName(repairData.province)}`
                        : "ไม่ระบุ"}
                    </p>
                  </div>
                  <div className="flex items-start justify-between">
                    <p className="text-subtle-dark flex-shrink-0 text-lg font-medium md:text-xl">
                      เลขกิโลเมตร:
                    </p>
                    <p className="text-normal min-w-0 text-right text-lg leading-relaxed font-semibold break-words md:text-xl">
                      {repairData.mileage
                        ? `${Number(repairData.mileage).toLocaleString()} กม.`
                        : "ไม่ระบุ"}
                    </p>
                  </div>
                  <div className="flex items-start justify-between">
                    <p className="text-subtle-dark flex-shrink-0 text-lg font-medium md:text-xl">
                      รายละเอียดการซ่อม:
                    </p>
                    <p className="text-normal min-w-0 text-right text-lg leading-relaxed font-semibold break-words md:text-xl">
                      {repairData.description || "ไม่ระบุ"}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* รายการซ่อม */}
          <div className="xl:hidden">
            <div className="mb-[16px]">
              <div className="mb-[16px] flex items-center justify-between px-[20px]">
                <p className="text-[22px] font-semibold md:text-2xl">
                  รายการซ่อม
                </p>
                <button
                  onClick={() => handleGoBack(true)}
                  className="text-primary flex cursor-pointer items-center gap-[4px] text-xl font-semibold md:text-[22px]"
                >
                  <Edit className="h-5 w-5" />
                  แก้ไขรายการซ่อม
                </button>
              </div>

              {/* เปลี่ยนทั้งสองข้าง — ยุบเป็นบรรทัดเดียว */}
              {bothSides.length > 0 && (
                <div className="mb-[16px] px-[20px]">
                  <p className="text-primary mb-[8px] flex items-center gap-[4px] text-xl font-semibold md:text-[22px]">
                    <ArrowLeftRight className="mt-[2px]" />
                    รายการซ่อมฝั่งซ้าย-ขวา
                  </p>
                  <div className="space-y-[12px]">
                    {bothSides.map((item, index) => (
                      <RepairItemCard
                        key={`both-m-${index}`}
                        item={item}
                        variant="summary"
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* รายการฝั่งซ้าย */}
              {leftOnly.length > 0 && (
                <div className="mb-[16px] px-[20px]">
                  <p className="text-primary mb-[8px] flex items-center gap-[4px] text-xl font-semibold md:text-[22px]">
                    <ArrowLeft className="mt-[2px]" />
                    รายการซ่อมฝั่งซ้าย
                  </p>
                  <div className="space-y-[12px]">
                    {leftOnly.map((item, index) => (
                      <RepairItemCard
                        key={`left-${index}`}
                        item={item}
                        variant="summary"
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* รายการฝั่งขวา */}
              {rightOnly.length > 0 && (
                <div className="mb-[16px] px-[20px]">
                  <p className="text-primary mb-[8px] flex items-center gap-[4px] text-xl font-semibold md:text-[22px]">
                    <ArrowRight className="mt-[2px]" />
                    รายการซ่อมฝั่งขวา
                  </p>
                  <div className="space-y-[12px]">
                    {rightOnly.map((item, index) => (
                      <RepairItemCard
                        key={`right-${index}`}
                        item={item}
                        variant="summary"
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* รายการอื่นๆ */}
              {otherItems.length > 0 && (
                <div className="mb-[16px] px-[20px]">
                  <p className="text-primary mb-[8px] flex items-center gap-[4px] text-xl font-semibold md:text-[22px]">
                    <Ellipsis className="mt-[2px]" />
                    รายการซ่อมอื่นๆ
                  </p>
                  <div className="space-y-[12px]">
                    {otherItems.map((item, index) => (
                      <RepairItemCard
                        key={`other-${index}`}
                        item={item}
                        variant="summary"
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* รายการซ่อมเพิ่มเติม */}
              {generalItems.length > 0 && (
                <div className="mb-[16px] px-[20px]">
                  {location.state?.from === "suspension" && (
                    <p className="text-primary mb-[8px] flex items-center gap-[4px] text-xl font-semibold md:text-[22px]">
                      <Wrench className="mb-[2px] inline" />
                      รายการซ่อมเพิ่มเติม
                    </p>
                  )}
                  <div className="space-y-[12px]">
                    {generalItems.map((item, index) => (
                      <RepairItemCard
                        key={`general-${index}`}
                        item={item}
                        variant="summary"
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* สรุปยอดรวม */}
            <div className="border-primary/20 from-primary/10 to-primary/5 mx-[20px] my-[16px] rounded-[10px] border bg-gradient-to-r p-[16px]">
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <p className="text-subtle-dark text-xl font-semibold md:text-[22px]">
                    รวม {repairItems.length} รายการ
                  </p>
                </div>
                <div className="flex flex-col items-end">
                  <p className="text-primary text-2xl font-semibold md:text-[26px]">
                    {formatCurrency(totalPrice)}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex justify-center pb-[112px]">
              <FormButton
                label={
                  editRepairId
                    ? "บันทึก"
                    : isSale
                      ? "ขายและรับเงิน"
                      : "สร้างงานซ่อม"
                }
                isLoading={isSubmitting}
                onClick={handleConfirmRepair}
              />
            </div>
          </div>

          <div className="hidden pb-[24px] xl:block" />
        </div>
      </div>

      {/* Desktop: รายการซ่อม */}
      <div className="hidden w-1/2 xl:block">
        <div className="bg-surface shadow-primary h-fit rounded-2xl">
          <div className="flex items-center justify-between px-[20px] pt-[16px]">
            <div className="flex items-center gap-[8px]">
              <div className="bg-primary/10 flex h-[40px] w-[40px] items-center justify-center rounded-full">
                <ClipboardList className="text-primary h-5 w-5" />
              </div>
              <p className="text-[22px] font-semibold md:text-2xl">
                รายการซ่อม
              </p>
            </div>
            <button
              onClick={() => handleGoBack(true)}
              className="text-primary flex cursor-pointer items-center gap-[4px] text-xl font-semibold md:text-[22px]"
            >
              <Edit className="h-5 w-5" />
              แก้ไขรายการซ่อม
            </button>
          </div>
          <div className="px-[20px] pt-[16px]">
            {/* เปลี่ยนทั้งสองข้าง — ยุบเป็นบรรทัดเดียว */}
            {bothSides.length > 0 && (
              <div className="mb-[16px] px-[20px]">
                <p className="text-primary mb-[8px] flex items-center gap-[4px] text-xl font-semibold md:text-[22px]">
                  <ArrowLeftRight className="mt-[2px]" />
                  รายการซ่อมฝั่งซ้าย-ขวา
                </p>
                <div className="space-y-[12px]">
                  {bothSides.map((item, index) => (
                    <RepairItemCard
                      key={`both-d-${index}`}
                      item={item}
                      variant="summary"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* รายการฝั่งซ้าย */}
            {leftOnly.length > 0 && (
              <div className="mb-[16px]">
                <p className="text-primary mb-[8px] flex items-center gap-[4px] text-xl font-semibold md:text-[22px]">
                  <ArrowLeft className="mt-[2px]" />
                  รายการซ่อมฝั่งซ้าย
                </p>
                <div className="space-y-[12px]">
                  {leftOnly.map((item, index) => (
                    <RepairItemCard
                      key={`left-${index}`}
                      item={item}
                      variant="summary"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* รายการฝั่งขวา */}
            {rightOnly.length > 0 && (
              <div className="mb-[16px]">
                <p className="text-primary mb-[8px] flex items-center gap-[4px] text-xl font-semibold md:text-[22px]">
                  <ArrowRight className="mt-[2px]" />
                  รายการซ่อมฝั่งขวา
                </p>
                <div className="space-y-[12px]">
                  {rightOnly.map((item, index) => (
                    <RepairItemCard
                      key={`right-${index}`}
                      item={item}
                      variant="summary"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* รายการอื่นๆ */}
            {otherItems.length > 0 && (
              <div className="mb-[16px]">
                <p className="text-primary mb-[8px] flex items-center gap-[4px] text-xl font-semibold md:text-[22px]">
                  <Ellipsis className="mt-[2px]" />
                  รายการซ่อมอื่นๆ
                </p>
                <div className="space-y-[12px]">
                  {otherItems.map((item, index) => (
                    <RepairItemCard
                      key={`other-${index}`}
                      item={item}
                      variant="summary"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* รายการซ่อมเพิ่มเติม */}
            {generalItems.length > 0 && (
              <div className="mb-[16px]">
                {location.state?.from === "suspension" && (
                  <p className="text-primary mb-[8px] flex items-center gap-[4px] text-xl font-semibold md:text-[22px]">
                    <Wrench className="mb-[2px] inline" />
                    รายการซ่อมเพิ่มเติม
                  </p>
                )}
                <div className="space-y-[12px]">
                  {generalItems.map((item, index) => (
                    <RepairItemCard
                      key={`general-${index}`}
                      item={item}
                      variant="summary"
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Desktop: สรุปยอดรวม */}
          <div className="border-primary/20 from-primary/10 to-primary/5 mx-[20px] my-[16px] rounded-[10px] border bg-gradient-to-r p-[16px]">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <p className="text-subtle-dark text-xl font-semibold md:text-[22px]">
                  รวม {repairItems.length} รายการ
                </p>
              </div>
              <div className="flex flex-col items-end">
                <p className="text-primary text-2xl font-semibold md:text-[26px]">
                  {formatCurrency(totalPrice)}
                </p>
              </div>
            </div>
          </div>
          <div className="flex justify-center pb-[16px]">
            <FormButton
              label={
                editRepairId
                  ? "บันทึก"
                  : isSale
                    ? "ขายและรับเงิน"
                    : "สร้างงานซ่อม"
              }
              isLoading={isSubmitting}
              onClick={handleConfirmRepair}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default RepairReview;
