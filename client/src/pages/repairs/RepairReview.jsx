import { useLocation, useNavigate } from "react-router";
import { hasTypedUnit } from "@/constants/services";
import { toastError } from "@/utils/handleError";
import { withMinDuration } from "@/utils/withMinDuration";
import {
  expandBothSides,
  groupBySidePairs,
  mergeSidesInOrder,
} from "@/utils/repairItemGroups";
import { useEffect, useState } from "react";
import FormButton from "@/components/forms/FormButton";
import RepairItemCard from "@/components/cards/RepairItemCard";
import { formatCurrency, formatPhone, getProvinceName } from "@/utils/formats";
import { createRepair, updateRepair } from "@/api/repair";
import { clearAllDrafts } from "@/utils/repairDraft";
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
import PartPreviewDialog from "@/components/dialogs/PartPreviewDialog";
import {
  PAYMENT_OPTIONS_WITH_CREDIT,
  CREDIT_OPTION_ID,
} from "@/constants/paymentMethods";
import { usePrefetchPages } from "@/routes/pageImports";
import { getDisplayBrand } from "@/utils/repairDisplay";

const RepairReview = () => {
  // เตรียมโค้ดของหน้าที่มักไปต่อจากหน้านี้ กดแล้วจะได้ไม่ต้องรอโหลด
  usePrefetchPages(["RepairList", "RepairDetail"]);

  const location = useLocation();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  // กดการ์ดในหน้าสรุปเพื่อดูรูปกับรายละเอียดก่อนยืนยัน เหมือนหน้าเช็กช่วงล่าง
  const [previewItem, setPreviewItem] = useState(null);

  const { repairData, repairItems, editRepairId } = location.state || {};
  const origin = location.state?.origin || location.state?.from;
  const statusSlug = location.state?.statusSlug;
  const returnTo = location.state?.returnTo;
  const currentDate = location.state?.currentDate;
  const vehicleId = location.state?.vehicleId;
  const backIdx = location.state?.backIdx;
  const isSale = repairData?.type === "SALE";
  // งานบริการไม่ได้ผูกกับรถ จึงไม่มีข้อมูลรถให้สรุปเหมือนบิลขาย
  const hasNoVehicle = isSale || !!repairData?.noVehicle;
  // บิลขายหน้าร้านเก็บเงินตอนสร้างบิลเลย จึงต้องรู้วิธีชำระเงินตั้งแต่ตรงนี้
  // ไม่ตั้งค่าเริ่มต้นเป็นเงินสด ต้องเลือกเองทุกใบ ไม่งั้นบิลที่รับเงินทางอื่นจะถูกบันทึกเป็นเงินสด
  // เพราะกดยืนยันผ่านไปโดยไม่ได้แตะช่องนี้
  const [paymentMethod, setPaymentMethod] = useState(
    repairData?.paymentMethod || "",
  );

  // หัวเรื่องบอกว่ากำลังสรุปบิลแบบไหน ใช้คำเดียวกับปุ่มเลือกประเภทบิลในหน้ากรอก
  // บิลช่วงล่างเป็นงานซ่อมที่ผูกกับรถเหมือนกัน แต่มาจากคนละหน้าและหน้าตาสรุปต่างกัน
  const reviewTitle = isSale
    ? "สรุปขายอะไหล่"
    : hasNoVehicle
      ? "สรุปงานบริการ"
      : repairData?.type === "SUSPENSION"
        ? "สรุปเช็กช่วงล่าง"
        : "สรุปงานซ่อม";

  // เลือกเครดิต = ยังไม่ได้รับเงิน ปุ่มกับข้อความแจ้งต้องบอกให้ตรงกับสิ่งที่จะเกิดขึ้น
  const isCreditChoice = isSale && paymentMethod === CREDIT_OPTION_ID;

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
    repairData.name ||
    repairData.address ||
    repairData.phoneNumber ||
    repairData.taxId,
  );

  const totalPrice = repairItems.reduce(
    (total, item) => total + item.sellingPrice * item.quantity,
    0,
  );

  const getItemsBySide = (side) => {
    return repairItems.filter((item) => item.side === side);
  };

  // แบ่งหัวข้อตามฝั่งเฉพาะบิลเช็กช่วงล่าง ที่ช่างทำงานเป็นฝั่งๆ
  // งานซ่อมทั่วไปเรียงรายการเดียวตามลำดับในบิล ฝั่งดูจากป้ายที่มุมรูปแทน (เหมือนหน้ากรอกบิล)
  const isSuspensionBill = location.state?.from === "suspension";

  // ของที่เปลี่ยนทั้งสองข้างยุบเป็นบรรทัดเดียว ที่เหลือแยกฝั่งตามเดิม
  const { bothSides, leftOnly, rightOnly } = isSuspensionBill
    ? groupBySidePairs(getItemsBySide("left"), getItemsBySide("right"))
    : { bothSides: [], leftOnly: [], rightOnly: [] };
  const otherItems = isSuspensionBill ? getItemsBySide("other") : [];
  const generalRows = isSuspensionBill
    ? repairItems
        .filter((item) => !item.side || item.side === "general")
        .map((item) => ({ item, sideLabel: "" }))
    : mergeSidesInOrder(repairItems);

  // นับตามการ์ดที่เห็น ของที่ใส่ทั้งซ้ายและขวานับเป็นรายการเดียว ไม่ใช่สองบรรทัดในฐานข้อมูล
  const displayedItemCount =
    bothSides.length +
    leftOnly.length +
    rightOnly.length +
    otherItems.length +
    generalRows.length;

  const handleConfirmRepair = async () => {
    if (isSale && !paymentMethod) {
      toast.error("กรุณาเลือกวิธีชำระเงิน");
      return;
    }

    setIsSubmitting(true);
    try {
      const repair = {
        name: repairData.name,
        address: repairData.address,
        taxId: repairData.taxId,
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
        // บรรทัดทั้งสองข้างจากหน้ากรอกบิล แตกเป็นซ้ายหนึ่งขวาหนึ่งก่อนบันทึก ฐานข้อมูลเก็บเป็นรายข้าง
        repairItems: expandBothSides(repairItems).map((item) => {
          // ดูแค่รหัสอะไหล่ บริการไม่มีรหัส ส่วนยี่ห้อเว้นว่างได้ (ยางเปอร์เซ็นต์ไม่มียี่ห้อ)
          // ถ้าเช็กยี่ห้อด้วย อะไหล่ที่ไม่มียี่ห้อจะถูกส่งเป็นบริการแล้วบันทึกไม่ผ่าน
          const isPart = !!item.partNumber;
          return {
            ...(isPart ? { partId: item.id } : { serviceId: item.id }),
            // ชื่อที่พิมพ์เองต้องส่งไปด้วย ไม่งั้นเซิร์ฟเวอร์จะประกอบชื่อจากคลังทับ
            // อะไหล่ที่ไม่ได้แก้ชื่อไม่ต้องส่ง ปล่อยให้เซิร์ฟเวอร์ประกอบเอง
            // (ชื่อบนการ์ดไม่มียี่ห้อกับขนาดยางนำหน้า ถ้าส่งไปจะกลายเป็นชื่อที่ขาดไป)
            ...(!item.name || (isPart && !item.hasCustomName)
              ? {}
              : { itemName: item.name }),
            // เก็บหน่วยลงบิลเฉพาะรายการเปล่าที่ช่างพิมพ์หน่วยเอง (อะไหล่อื่นๆ บริการอื่นๆ)
            // อะไหล่กับบริการปกติดึงหน่วยจากคลังตอนแสดงผล แก้หน่วยในคลังแล้วบิลทุกใบตามกัน
            ...(hasTypedUnit(item) && item.unit ? { itemUnit: item.unit } : {}),
            unitPrice: Number(item.sellingPrice),
            quantity: item.quantity,
            ...(item.side ? { side: item.side } : {}),
          };
        }),
      };

      if (editRepairId) {
        await withMinDuration(() => updateRepair(editRepairId, repair));
        // บิลถูกบันทึกแล้ว ร่างที่ค้างไว้หมดหน้าที่
        clearAllDrafts();
        toast.success("แก้ไขงานซ่อมเรียบร้อยแล้ว");
        // แก้ไขจากที่ไหนก็กลับมาที่บิลใบนั้น จะได้เห็นผลที่เพิ่งแก้ทันที
        // แล้วกดย้อนกลับต่อไปถึงหน้าที่มาตั้งแต่แรกตามลำดับเดิม
        // ต้องถอยประวัติ ไม่ใช่ซ้อนหน้าใหม่ ไม่งั้นหน้ากรอกงานกับหน้าสรุปจะค้างอยู่ในประวัติ
        // (หน้าบิลอยู่ถัดจาก backIdx หนึ่งขั้นเสมอ เพราะ backIdx คือหน้าก่อนเข้าบิล)
        const currentIdx = window.history.state?.idx;
        const targetIdx = backIdx + 1;
        if (
          typeof backIdx === "number" &&
          typeof currentIdx === "number" &&
          targetIdx >= 0 &&
          targetIdx < currentIdx
        ) {
          navigate(targetIdx - currentIdx);
        } else {
          // ไม่รู้ตำแหน่งหน้าบิลในประวัติ (เปิดลิงก์เข้ามาตรงๆ หรือข้อมูลหลุดระหว่างทาง)
          // เปิดหน้าบิลใหม่แทนการเดาว่าต้องถอยกี่หน้า เพราะถ้าย้อนไปแก้กลับไปกลับมา
          // จำนวนหน้าที่ซ้อนไว้จะไม่เท่าเดิม ถอยผิดจำนวนแล้วไปค้างที่หน้ากรอกบิล
          navigate(`/repairs/${editRepairId}`, {
            replace: true,
            state: { returnTo, currentDate },
          });
        }
      } else {
        await withMinDuration(() => createRepair(repair));
        clearAllDrafts();
        toast.success(
          isCreditChoice
            ? "ขายเรียบร้อยแล้ว ลงเครดิตไว้"
            : isSale
              ? "ขายเรียบร้อยแล้ว"
              : "สร้างงานซ่อมเรียบร้อยแล้ว",
        );
        const isDesktop = window.innerWidth >= 1280;
        if (isDesktop) {
          navigate("/");
        } else {
          navigate(
            isCreditChoice
              ? "/organizations?type=general"
              : isSale
                ? "/repairs?status=paid"
                : "/repairs?status=in-progress",
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
      stockNotDeducted: location.state?.stockNotDeducted,
      // ตำแหน่งของหน้าก่อนเข้าบิลในประวัติ ต้องติดไปด้วยทุกครั้งที่ย้อนไปแก้
      // ไม่งั้นกดบันทึกรอบถัดไปจะไม่รู้ว่าต้องถอยกลับไปที่ไหน แล้วไปค้างที่หน้ากรอกบิล
      backIdx,
      origin,
      statusSlug,
      vehicleId,
      returnTo,
      currentDate,
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
              {reviewTitle}
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
                      {repairData.phoneNumber
                        ? formatPhone(repairData.phoneNumber)
                        : "ไม่ระบุ"}
                    </p>
                  </div>
                  {/* ลูกค้าส่วนใหญ่ไม่มีเลขนี้ ขึ้นเฉพาะตอนกรอกมา ไม่ต้องมีแถว "ไม่ระบุ" เพิ่มทุกบิล */}
                  {repairData.taxId && (
                    // ป้ายยาวกับเลข 13 หลักรวมกันเกินความกว้างมือถือ จอแคบเลขจึงตกไปบรรทัดล่างชิดขวา
                    // จอกว้างพอก็ยังอยู่บรรทัดเดียวเหมือนแถวอื่น
                    <div className="flex flex-wrap justify-between gap-x-[12px]">
                      <p className="text-subtle-dark text-lg font-medium md:text-xl">
                        เลขประจำตัวผู้เสียภาษีอากร:
                      </p>
                      <p className="text-normal ml-auto text-lg font-semibold text-nowrap md:text-xl">
                        {repairData.taxId}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* บิลขายหน้าร้านจ่ายเงินทันที เลือกวิธีชำระเงินก่อนยืนยัน
                งานบริการไม่ต้องเลือกตรงนี้ เพราะเก็บเงินทีหลังเหมือนงานซ่อม */}
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
                      {getDisplayBrand({
                        brand: repairData.brand,
                        model: repairData.model,
                      })}
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
                        ? `${repairData.plateLetters}-${
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
                </div>
              </div>
            )}

            {/* เดิมอยู่ในกล่องข้อมูลรถ ซึ่งถูกซ่อนทั้งกล่องเมื่อบิลไม่ผูกกับรถ
                หมายเหตุที่พิมพ์ไว้จึงหายไปจากหน้าสรุปของบิลขายอะไหล่กับงานบริการ */}
            {repairData.description && (
              <div className="mb-[16px]">
                <p className="text-normal mb-[8px] text-[22px] font-semibold md:text-2xl">
                  {isSale ? "หมายเหตุ" : "รายละเอียดการซ่อม"}
                </p>
                <div className="rounded-[10px] bg-gray-50 p-[16px]">
                  <p className="text-normal text-lg leading-relaxed font-medium break-words md:text-xl">
                    {repairData.description}
                  </p>
                </div>
              </div>
            )}

            {/* วางท้ายสุดเพราะเป็นสิ่งเดียวในหน้านี้ที่ยังต้องเลือก
                ที่เหลือเป็นข้อมูลที่กรอกมาแล้วให้ตรวจทาน */}
            {isSale && (
              <div className="mb-[16px]">
                <ComboBox
                  label="วิธีชำระเงิน"
                  color="text-subtle-dark"
                  options={PAYMENT_OPTIONS_WITH_CREDIT}
                  value={paymentMethod}
                  onChange={setPaymentMethod}
                  placeholder="-- เลือกวิธีชำระเงิน --"
                  name="paymentMethod"
                />
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
                    รายการซ่อมข้างซ้าย-ขวา
                  </p>
                  <div className="space-y-[12px]">
                    {bothSides.map((item, index) => (
                      <RepairItemCard
                        key={`both-m-${index}`}
                        item={item}
                        variant="summary"
                        sideLabel="R-L"
                        onClick={() => setPreviewItem(item)}
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
                    รายการซ่อมข้างซ้าย
                  </p>
                  <div className="space-y-[12px]">
                    {leftOnly.map((item, index) => (
                      <RepairItemCard
                        key={`left-${index}`}
                        item={item}
                        variant="summary"
                        sideLabel="L"
                        onClick={() => setPreviewItem(item)}
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
                    รายการซ่อมข้างขวา
                  </p>
                  <div className="space-y-[12px]">
                    {rightOnly.map((item, index) => (
                      <RepairItemCard
                        key={`right-${index}`}
                        item={item}
                        variant="summary"
                        sideLabel="R"
                        onClick={() => setPreviewItem(item)}
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
                        onClick={() => setPreviewItem(item)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* รายการซ่อมเพิ่มเติม */}
              {generalRows.length > 0 && (
                <div className="mb-[16px] px-[20px]">
                  {location.state?.from === "suspension" && (
                    <p className="text-primary mb-[8px] flex items-center gap-[4px] text-xl font-semibold md:text-[22px]">
                      <Wrench className="mb-[2px] inline" />
                      รายการซ่อมเพิ่มเติม
                    </p>
                  )}
                  <div className="space-y-[12px]">
                    {generalRows.map(({ item, sideLabel }, index) => (
                      <RepairItemCard
                        key={`general-${index}`}
                        item={item}
                        variant="summary"
                        sideLabel={sideLabel}
                        onClick={() => setPreviewItem(item)}
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
                    รวม {displayedItemCount} รายการ
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
                      ? isCreditChoice
                        ? "ขายและลงเครดิต"
                        : "ขายและรับเงิน"
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
                  รายการซ่อมข้างซ้าย-ขวา
                </p>
                <div className="space-y-[12px]">
                  {bothSides.map((item, index) => (
                    <RepairItemCard
                      key={`both-d-${index}`}
                      item={item}
                      variant="summary"
                      sideLabel="R-L"
                      onClick={() => setPreviewItem(item)}
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
                  รายการซ่อมข้างซ้าย
                </p>
                <div className="space-y-[12px]">
                  {leftOnly.map((item, index) => (
                    <RepairItemCard
                      key={`left-${index}`}
                      item={item}
                      variant="summary"
                      sideLabel="L"
                      onClick={() => setPreviewItem(item)}
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
                  รายการซ่อมข้างขวา
                </p>
                <div className="space-y-[12px]">
                  {rightOnly.map((item, index) => (
                    <RepairItemCard
                      key={`right-${index}`}
                      item={item}
                      variant="summary"
                      sideLabel="R"
                      onClick={() => setPreviewItem(item)}
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
                      onClick={() => setPreviewItem(item)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* รายการซ่อมเพิ่มเติม */}
            {generalRows.length > 0 && (
              <div className="mb-[16px]">
                {location.state?.from === "suspension" && (
                  <p className="text-primary mb-[8px] flex items-center gap-[4px] text-xl font-semibold md:text-[22px]">
                    <Wrench className="mb-[2px] inline" />
                    รายการซ่อมเพิ่มเติม
                  </p>
                )}
                <div className="space-y-[12px]">
                  {generalRows.map(({ item, sideLabel }, index) => (
                    <RepairItemCard
                      key={`general-${index}`}
                      item={item}
                      variant="summary"
                      sideLabel={sideLabel}
                      onClick={() => setPreviewItem(item)}
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
                  รวม {displayedItemCount} รายการ
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
                    ? isCreditChoice
                      ? "ขายและลงเครดิต"
                      : "ขายและรับเงิน"
                    : "สร้างงานซ่อม"
              }
              isLoading={isSubmitting}
              onClick={handleConfirmRepair}
            />
          </div>
        </div>
      </div>
      {/* ราคาที่ส่งไปคือราคาที่จะใช้จริงในบิล ส่วนราคาปกติมาจาก basePrice
          หน้าต่างจะได้บอกได้ว่าลดไปเท่าไหร่ */}
      <PartPreviewDialog
        part={
          previewItem
            ? {
                ...previewItem,
                sellingPrice: previewItem.basePrice ?? previewItem.sellingPrice,
              }
            : null
        }
        price={previewItem?.sellingPrice}
        open={!!previewItem}
        onOpenChange={(open) => !open && setPreviewItem(null)}
      />
    </div>
  );
};

export default RepairReview;
