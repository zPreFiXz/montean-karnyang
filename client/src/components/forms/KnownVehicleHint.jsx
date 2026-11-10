import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { ChevronRight, History, Ticket, TriangleAlert } from "lucide-react";
import { lookupVehicleByPlate } from "@/api/vehicle";
import { formatDateShort } from "@/utils/formats";
import { DISCOUNT_SERVICE_NAME } from "@/constants/services";
import { getDisplayBrand } from "@/utils/repairDisplay";

// เท่ากับจังหวะยุบแถวของรายการซ่อน ทั้งระบบจะได้เคลื่อนไหวความเร็วเดียวกัน
const SLIDE_MS = 150;

// บอกว่ารถคันนี้เคยมาเมื่อไหร่ ไมล์เท่าไหร่ ทำอะไรไป
// รุ่นที่กรอกไม่ตรงกับประวัติก็บอกไว้ เผื่อพิมพ์ทะเบียนผิดคัน
const sameModel = (known, brand, model) =>
  !brand ||
  !model ||
  !known ||
  (known.brand === brand && known.model === model);

const KnownVehicleHint = ({
  plate,
  province,
  excludeRepairId,
  brand,
  model,
  // เปลี่ยนยี่ห้อกับรุ่นในฟอร์มเป็นรุ่นในประวัติ
  onUseKnownModel,
  // สิทธิ์ตั้งศูนย์ฟรีที่รถคันนี้ค้างไว้ กดแล้วใส่ตั้งศูนย์ราคา 0 ลงบิล redeemedIds = บิลต้นทางที่ใช้ในบิลนี้แล้ว
  onRedeemAlignment,
  redeemedIds,
  // แก้บิลเดิม: สิทธิ์ค้างของรถคันนี้ติดมากับบิล แถวสิทธิ์จะขึ้นตั้งแต่เปิดหน้า ฟอร์มไม่กระตุกตอนค้นเสร็จ
  initialPendingAlignments,
}) => {
  // ผลค้นของทะเบียนที่กรอกอยู่ เก็บคู่กับทะเบียน ผลของทะเบียนเก่าจะได้ไม่โผล่ค้าง
  const [lookup, setLookup] = useState(null);
  // ข้อมูลที่กำลังแสดง แยกจาก lookup เพราะตอนหาย ต้องคาเนื้อหาไว้จนกว่าจะยุบเสร็จ
  // แก้บิลเดิมที่ยังมีสิทธิ์ไม่ได้ใช้ ใช้ข้อมูลที่ติดมากับบิลไปก่อนจนกว่าจะค้นเสร็จ
  // เก็บครั้งเดียวตอนเปิดหน้า ค่าต้องคงที่ ไม่งั้นเอฟเฟกต์ข้างล่างวนตั้งค่าไม่หยุด
  const [presetVehicle] = useState(() =>
    excludeRepairId && initialPendingAlignments?.length
      ? {
          pendingAlignments: initialPendingAlignments,
          // ยังไม่รู้รุ่นในประวัติ เว้นไว้ แถวเตือนรุ่นไม่ตรงจะไม่โผล่ผิดๆ ก่อนค้นเสร็จ
          vehicleModel: null,
        }
      : null,
  );
  const [shown, setShown] = useState(presetVehicle);
  const [isOpen, setIsOpen] = useState(!!presetVehicle);
  // แก้บิลเดิม ทะเบียนถูกเติมมาตั้งแต่เปิดหน้า เป็นรถคันเดิมของบิลอยู่แล้ว ไม่ต้องบอกว่าเคยมา
  // ถ้าโหลดมาทีหลังกล่องจะดันฟอร์มทั้งหน้าให้กระตุก จึงขึ้นเฉพาะตอนแก้รุ่นไม่ตรงกับที่บันทึกไว้
  const originalPlateRef = useRef(null);

  const plateText = String(plate || "").trim();
  const provinceText = String(province || "").trim();
  const plateKey =
    plateText && provinceText ? `${plateText}|${provinceText}` : "";
  if (excludeRepairId && plateKey && originalPlateRef.current === null) {
    originalPlateRef.current = plateKey;
  }
  // ทะเบียนของบิลถูกเติมลงฟอร์มหลังเฟรมแรก ระหว่างนั้นถือว่าเป็นคันเดิม กล่องจะได้วาดแบบเดียวกันตั้งแต่ต้น
  const isOriginalPlate =
    !!excludeRepairId &&
    (plateKey ? plateKey === originalPlateRef.current : !!presetVehicle);

  useEffect(() => {
    if (!plateKey) return;

    let cancelled = false;
    const timer = setTimeout(() => {
      lookupVehicleByPlate(plateText, provinceText, excludeRepairId)
        .then((res) => {
          if (!cancelled) setLookup({ key: plateKey, vehicle: res.data });
        })
        .catch(() => {
          if (!cancelled) setLookup(null);
        });
    }, 400);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // plateText กับ provinceText รวมอยู่ใน plateKey แล้ว
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plateKey, excludeRepairId]);

  const found =
    lookup?.key === plateKey
      ? lookup.vehicle
      : isOriginalPlate
        ? presetVehicle
        : null;
  const isOtherModel = !!found && !sameModel(found.vehicleModel, brand, model);
  // แก้บิลเดิมที่ใช้สิทธิ์ไปแล้ว ไม่ต้องขึ้นแถวสิทธิ์ ไม่งั้นกล่องโผล่ทีหลังแล้วดันฟอร์มกระตุก
  // ขึ้นเฉพาะยังมีสิทธิ์ที่บิลนี้ยังไม่ได้ใช้ (เช่น ลืมกดใช้ตอนเปิดบิล)
  const hasUnusedAlignment = (found?.pendingAlignments || []).some(
    (source) => !redeemedIds?.has(source.id),
  );
  // กดใช้สิทธิ์ในหน้านี้แล้ว แถวยังอยู่ที่เดิมแค่เปลี่ยนเป็นใช้แล้ว ฟอร์มจะไม่ขยับระหว่างจอเลื่อนลงไปหาตั้งศูนย์
  const showedAlignmentRef = useRef(false);
  if (hasUnusedAlignment) showedAlignmentRef.current = true;
  const keepsAlignmentRow =
    showedAlignmentRef.current && (found?.pendingAlignments?.length || 0) > 0;
  const shouldShow =
    !!found &&
    (isOriginalPlate
      ? isOtherModel || keepsAlignmentRow
      : keepsAlignmentRow || found._count?.repairs > 0);

  useEffect(() => {
    if (!shouldShow) {
      setIsOpen(false);
      return;
    }
    setShown(found);
    // เปิดในเฟรมถัดไป ให้เบราว์เซอร์ทันวาดตอนยังยุบอยู่ แถบจะได้ไหลลงมาให้เห็น
    const frame = requestAnimationFrame(() => setIsOpen(true));
    return () => cancelAnimationFrame(frame);
  }, [shouldShow, found]);

  // ยุบเสร็จแล้วค่อยทิ้งข้อมูล ระหว่างยุบยังต้องมีเนื้อหาให้เห็น
  useEffect(() => {
    if (isOpen) return;
    const timer = setTimeout(() => setShown(null), SLIDE_MS);
    return () => clearTimeout(timer);
  }, [isOpen]);

  const vehicle = shown;
  if (!vehicle) return null;

  const lastVisit = vehicle.repairs?.[0] || null;
  const knownModel = vehicle.vehicleModel;
  const showsModelWarning = !sameModel(knownModel, brand, model);
  const pendingAlignments = vehicle.pendingAlignments || [];
  const unusedAlignments = pendingAlignments.filter(
    (source) => !redeemedIds?.has(source.id),
  );
  const nextAlignment = unusedAlignments[0];

  // ซ้าย-ขวาเป็นสองบรรทัดในบิล นับเป็นรายการเดียว ส่วนลดไม่ใช่งานที่ทำ
  const lastJobNames = [
    ...new Set(
      (lastVisit?.repairItems || [])
        .map((item) => item.itemName || item.part?.name || item.service?.name)
        .filter((name) => name && name !== DISCOUNT_SERVICE_NAME),
    ),
  ];

  // อยู่ในกล่องนี้รู้อยู่แล้วว่าเป็นครั้งล่าสุด จึงไม่มีคำนำหน้า "ล่าสุด"
  // วันที่ขึ้นก่อน ยาวเกินจะถูกตัดแค่ท้ายชื่อลูกค้า
  const visitLine = [
    lastVisit && formatDateShort(lastVisit.createdAt),
    lastVisit?.mileage != null &&
      `${Number(lastVisit.mileage).toLocaleString()} กม.`,
    lastVisit?.customer?.name,
  ].filter(Boolean);

  // ปุ่มรองขอบน้ำเงินแบบเดียวกับปุ่มรองอื่นในโปรเจกต์ ทรงเดียวกันทั้งดูประวัติและใช้รุ่นนี้
  const pillClass =
    "bg-surface text-primary border-primary flex h-8 shrink-0 cursor-pointer items-center justify-center gap-0.5 rounded-2xl border px-3 text-base font-semibold md:text-lg";

  return (
    <div
      className={`grid transition-all duration-150 ${
        isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
      }`}
    >
      <div className="overflow-hidden">
        {/* การ์ดขาวแบบกล่องข้อมูลลูกค้า จอใหญ่ฟอร์มอยู่บนพื้นขาวอยู่แล้ว จึงใช้พื้นจางกับเส้นขอบแทน */}
        {/* ระยะห่างและขอบในเท่ากล่องข้อมูลลูกค้ากับช่องกรอกอื่นในฟอร์ม (mt-4, px-4 py-3)
            แก้บิลเดิมมีแค่แถวเตือน การ์ดทั้งใบจึงเป็นแถวเตือนเอง ไม่มีกรอบขาวซ้อนอีกชั้น */}
        <div
          className={`bg-surface mt-4 rounded-lg ${
            isOriginalPlate
              ? "xl:border-status-progress/30 overflow-hidden xl:border"
              : "xl:bg-primary/5 xl:border-primary/20 px-4 py-3 xl:border"
          }`}
        >
          {/* แก้บิลเดิมด้วยทะเบียนเดิม เป็นรถคันนี้อยู่แล้ว เหลือแค่แถวเตือนรุ่น */}
          {!isOriginalPlate && (
            <div>
              {/* ปุ่มอยู่บรรทัดหัวข้อที่สั้น บรรทัดรายละเอียดจะได้ใช้ความกว้างเต็มกล่อง ไม่ถูกตัดบนมือถือ */}
              <div className="flex items-center justify-between gap-2">
                {/* ไอคอนขนาดเท่าไอคอนแถวเตือน สองส่วนจะดูเป็นชุดเดียวกัน */}
                <p className="text-primary flex min-w-0 items-center gap-1.5 text-lg leading-tight font-semibold md:text-xl">
                  <History className="text-primary h-5 w-5 shrink-0" />
                  <span className="truncate">
                    เคยมาซ่อม {vehicle._count?.repairs || 0} ครั้ง
                  </span>
                </p>
                {/* แก้บิลเดิมไม่มีร่าง ออกไปแล้วที่แก้ไว้จะหาย จึงไม่มีปุ่มนี้ */}
                {!excludeRepairId && (
                  <Link
                    to={`/vehicles/${vehicle.id}`}
                    className={`${pillClass} pr-2`}
                  >
                    ดูประวัติ
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                )}
              </div>
              {/* บรรทัดละเรื่อง ยาวเกินตัดท้าย กล่องจะสูงไม่เกินสามบรรทัด ดูละเอียดได้จากปุ่มดูประวัติ */}
              {visitLine.length > 0 && (
                <p className="text-subtle-dark mt-1 truncate text-base leading-tight font-medium md:text-lg">
                  {visitLine.join(" | ")}
                </p>
              )}
              {/* จำนวนรายการไม่ถูกตัด ตัดแค่ท้ายชื่อรายการแรก */}
              {lastJobNames.length > 0 && (
                <p className="text-subtle-dark flex min-w-0 gap-1 text-base leading-tight font-medium md:text-lg">
                  <span className="truncate">{lastJobNames[0]}</span>
                  {lastJobNames.length > 1 && (
                    <span className="shrink-0 whitespace-nowrap">
                      และอีก {lastJobNames.length - 1} รายการ
                    </span>
                  )}
                </p>
              )}
            </div>
          )}
          {/* ทะเบียนหนึ่งผูกกับรถคันเดียว บันทึกรุ่นอื่นไป รุ่นของคันนี้จะเปลี่ยนทุกบิล (ดู repairVehicle.js)
              จึงมีปุ่มให้กลับไปใช้รุ่นในประวัติได้ทันที ถ้ารุ่นในประวัติผิดเองก็บันทึกต่อได้เลย */}
          {showsModelWarning && (
            <div
              className={`bg-status-progress/10 flex items-center gap-2 ${
                isOriginalPlate
                  ? "px-4 py-3"
                  : "mt-3 rounded-md py-1.5 pr-1.5 pl-2"
              }`}
            >
              <TriangleAlert className="text-status-progress h-5 w-5 shrink-0" />
              <p className="text-status-progress min-w-0 flex-1 truncate text-base leading-tight font-semibold md:text-lg">
                เคยบันทึกเป็น {getDisplayBrand(knownModel)}
              </p>
              {onUseKnownModel && (
                <button
                  type="button"
                  onClick={() => onUseKnownModel(knownModel)}
                  className={pillClass}
                >
                  ใช้รุ่นนี้
                </button>
              )}
            </div>
          )}
          {/* อยู่ใต้แถวเตือนรุ่นรถ ต้องแน่ใจว่าเป็นรถคันเดียวกันก่อนใช้สิทธิ์
              ซื้อยางสี่เส้นแต่ช่วงล่างหลวม ตั้งศูนย์ฟรีค้างไว้ รถคันนี้กลับมาเมื่อไหร่ก็ใช้สิทธิ์ได้ */}
          {keepsAlignmentRow && (
            <div
              className={`bg-primary/10 flex items-center gap-2 ${
                isOriginalPlate
                  ? "px-4 py-3"
                  : "mt-3 rounded-md py-1.5 pr-1.5 pl-2"
              }`}
            >
              <Ticket className="text-primary h-5 w-5 shrink-0" />
              {/* บรรทัดเดียวแบบแถวเตือนรุ่นรถ หลายครั้งบอกจำนวน ครั้งเดียวบอกวันที่เปลี่ยนยาง */}
              <p className="text-primary min-w-0 flex-1 truncate text-base leading-tight font-semibold md:text-lg">
                {unusedAlignments.length > 1
                  ? `ค้างตั้งศูนย์ฟรี ${unusedAlignments.length} ครั้ง`
                  : `ค้างตั้งศูนย์ฟรี | ${formatDateShort(
                      (nextAlignment || pendingAlignments[0]).createdAt,
                    )}`}
              </p>
              {onRedeemAlignment &&
                (nextAlignment ? (
                  <button
                    type="button"
                    onClick={() => onRedeemAlignment(nextAlignment)}
                    className={pillClass}
                  >
                    ใช้สิทธิ์
                  </button>
                ) : (
                  <span className="text-primary shrink-0 pr-2 text-base font-semibold md:text-lg">
                    ✓ ใช้แล้ว
                  </span>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default KnownVehicleHint;
