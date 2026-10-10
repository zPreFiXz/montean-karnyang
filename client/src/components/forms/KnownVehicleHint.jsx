import { useEffect, useState } from "react";
import { Link } from "react-router";
import { ChevronRight } from "lucide-react";
import { lookupVehicleByPlate } from "@/api/vehicle";
import { formatDateShort } from "@/utils/formats";

// เท่ากับจังหวะยุบแถวของรายการซ่อน ทั้งระบบจะได้เคลื่อนไหวความเร็วเดียวกัน
const SLIDE_MS = 150;

// กรอกทะเบียนครบแล้วบอกให้รู้ว่ารถคันนี้เคยมาแล้ว และครั้งล่าสุดมาเมื่อไหร่ ไมล์เท่าไหร่ ทำอะไรไป
// ช่างใช้ดูว่าถึงรอบเปลี่ยนน้ำมันหรือยัง และไม่เสนอของที่เพิ่งเปลี่ยนไปซ้ำ
// ไม่มีปุ่มเติมข้อมูลให้ เพราะร้านกรอกยี่ห้อ-รุ่นก่อนทะเบียนอยู่แล้ว
// แต่ถ้ารุ่นที่กรอกไม่ตรงกับในประวัติ บอกไว้ เผื่อพิมพ์ทะเบียนผิดคัน
const KnownVehicleHint = ({
  plate,
  province,
  excludeRepairId,
  brand,
  model,
}) => {
  const [vehicle, setVehicle] = useState(null);
  // แยกจาก vehicle เพราะตอนหาย ต้องคาเนื้อหาไว้จนกว่าจะยุบเสร็จ
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const plateText = String(plate || "").trim();
    const provinceText = String(province || "").trim();

    if (!plateText || !provinceText) {
      setIsOpen(false);
      return;
    }

    let cancelled = false;
    // หน่วงไว้ให้พิมพ์จบก่อน ไม่งั้นยิงถามทุกตัวอักษรที่เคาะ
    const timer = setTimeout(() => {
      lookupVehicleByPlate(plateText, provinceText, excludeRepairId)
        .then((res) => {
          if (cancelled) return;
          // ไม่นับบิลที่กำลังแก้แล้วเหลือ 0 = รถมาครั้งแรก ไม่ต้องบอกว่าเคยมา
          if (res.data?._count?.repairs > 0) {
            setVehicle(res.data);
            // เปิดในเฟรมถัดไป ให้เบราว์เซอร์ทันวาดตอนยังยุบอยู่ แถบจะได้ไหลลงมาให้เห็น
            requestAnimationFrame(() => setIsOpen(true));
          } else {
            setIsOpen(false);
          }
        })
        .catch(() => {
          // ถามไม่ได้ก็แค่ไม่ขึ้นแถบ ไม่ต้องรบกวนคนที่กำลังกรอกอยู่
          if (!cancelled) setIsOpen(false);
        });
    }, 400);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [plate, province, excludeRepairId]);

  // ยุบเสร็จแล้วค่อยทิ้งข้อมูล ระหว่างยุบยังต้องมีเนื้อหาให้เห็น
  useEffect(() => {
    if (isOpen) return;
    const timer = setTimeout(() => setVehicle(null), SLIDE_MS);
    return () => clearTimeout(timer);
  }, [isOpen]);

  if (!vehicle) return null;

  const lastVisit = vehicle.repairs?.[0] || null;
  const knownModel = vehicle.vehicleModel;
  const isOtherModel =
    !!brand &&
    !!model &&
    !!knownModel &&
    (knownModel.brand !== brand || knownModel.model !== model);

  // งานครั้งก่อนบอกแค่บรรทัดแรกของบิล แถบจะได้ไม่ยาวจนบังฟอร์ม
  const firstItem = lastVisit?.repairItems?.[0];
  const lastJobText =
    firstItem?.itemName || firstItem?.part?.name || firstItem?.service?.name;

  const visitLine = [
    lastVisit && `ล่าสุด ${formatDateShort(lastVisit.createdAt)}`,
    lastVisit?.mileage != null &&
      `${Number(lastVisit.mileage).toLocaleString()} กม.`,
    lastVisit?.customer?.name,
  ].filter(Boolean);

  return (
    // grid-rows 0fr→1fr ไหลไปหาความสูงจริงของเนื้อหา ไม่ต้องเดาเป็นตัวเลข
    <div
      className={`grid transition-all duration-150 ${
        isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
      }`}
    >
      <div className="overflow-hidden">
        <div className="bg-surface/15 xl:bg-primary/5 xl:border-primary/20 mt-[8px] flex items-center gap-[8px] rounded-[10px] px-[12px] py-[8px] xl:border">
          <div className="min-w-0 flex-1">
            <p className="text-surface xl:text-subtle-dark text-lg leading-tight font-semibold md:text-xl">
              เคยมาซ่อม {vehicle._count?.repairs || 0} ครั้ง
            </p>
            {visitLine.length > 0 && (
              <p className="text-surface/80 xl:text-subtle-light truncate text-base leading-tight font-medium md:text-lg">
                {visitLine.join(" · ")}
              </p>
            )}
            {lastJobText && (
              <p className="text-surface/80 xl:text-subtle-light truncate text-base leading-tight font-medium md:text-lg">
                ครั้งก่อน: {lastJobText}
              </p>
            )}
            {isOtherModel && (
              <p className="text-surface xl:text-status-progress truncate text-base leading-tight font-semibold md:text-lg">
                รุ่นในประวัติ: {knownModel.brand} {knownModel.model}
              </p>
            )}
          </div>
          {/* บิลใหม่มีร่างเก็บไว้ ออกไปดูแล้วกดย้อนกลับมากรอกต่อได้
              ตอนแก้บิลเดิม (excludeRepairId) ไม่มีร่าง ออกไปแล้วที่แก้ไว้จะหาย จึงไม่มีปุ่มนี้ */}
          {!excludeRepairId && (
            <Link
              to={`/vehicles/${vehicle.id}`}
              // มือถืออยู่บนพื้นน้ำเงิน ปุ่มทึบขาวจึงอ่านชัดกว่าเส้นขอบบางๆ
              // จอใหญ่แถบอยู่บนพื้นขาว ปุ่มขาวจะกลืนหาย ตรงนั้นใช้เส้นขอบน้ำเงินแทน
              className="bg-surface text-primary xl:border-primary flex h-[32px] shrink-0 items-center justify-center gap-[2px] rounded-[16px] pr-[8px] pl-[12px] text-base font-semibold md:text-lg xl:border"
            >
              ดูประวัติ
              <ChevronRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default KnownVehicleHint;
