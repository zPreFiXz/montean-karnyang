import { useEffect, useState } from "react";
import { lookupVehicleByPlate } from "@/api/vehicle";

// เท่ากับจังหวะยุบแถวของรายการซ่อน ทั้งระบบจะได้เคลื่อนไหวความเร็วเดียวกัน
const SLIDE_MS = 150;

// กรอกทะเบียนครบแล้วบอกให้รู้ว่ารถคันนี้เคยมาแล้ว พร้อมปุ่มใช้ยี่ห้อและรุ่นรถเดิม
// ชื่อลูกค้าล่าสุดแสดงไว้ให้รู้ว่าเคยเป็นของใคร แต่ไม่เติมลงฟอร์ม เพราะรถเปลี่ยนมือได้
const KnownVehicleHint = ({ plate, province, excludeRepairId, onFill }) => {
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

  const customer = vehicle.repairs?.[0]?.customer || null;
  const model = vehicle.vehicleModel;
  const details = [
    [model?.brand, model?.model].filter(Boolean).join(" "),
    customer?.name,
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
              มาแล้ว {vehicle._count?.repairs || 0} ครั้ง
            </p>
            {details.length > 0 && (
              <p className="text-surface/80 xl:text-subtle-light truncate text-base leading-tight font-medium md:text-lg">
                {details.join(" · ")}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => onFill(vehicle)}
            // มือถืออยู่บนพื้นน้ำเงิน ปุ่มทึบขาวจึงอ่านชัดกว่าเส้นขอบบางๆ
            // จอใหญ่แถบอยู่บนพื้นขาว ปุ่มขาวจะกลืนหาย ตรงนั้นใช้เส้นขอบน้ำเงินแทน
            className="bg-surface text-primary xl:bg-surface xl:border-primary flex h-[32px] shrink-0 cursor-pointer items-center justify-center rounded-[16px] px-[12px] text-base font-semibold md:text-lg xl:border"
          >
            ใช้ข้อมูลรถนี้
          </button>
        </div>
      </div>
    </div>
  );
};

export default KnownVehicleHint;
