import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";
import PageSpinner from "@/components/ui/PageSpinner";
import BrandIcons from "@/components/icons/BrandIcons";
import { listLateAlignments } from "@/api/repair";
import { formatCurrency, formatDateShort, formatPlate } from "@/utils/formats";
import { getDisplayBrand } from "@/utils/repairDisplay";
import { toastError } from "@/utils/handleError";
import {
  saveScrollPosition,
  useScrollRestoration,
} from "@/utils/scrollPosition";

const SCROLL_KEY = "late-alignments";

// รถที่เปลี่ยนยางสี่เส้นแล้วมาตั้งศูนย์ในบิลถัดไป ไว้ไล่เปิดสองบิลนั้นตั้งสิทธิ์ค้างย้อนหลัง
// บิลเปลี่ยนยาง: เปิดสวิตช์ค้างไว้ก่อน  บิลตั้งศูนย์: กดใช้สิทธิ์
const LateAlignments = () => {
  const navigate = useNavigate();
  const [pairs, setPairs] = useState(null);

  useEffect(() => {
    listLateAlignments()
      .then((res) => setPairs(res.data || []))
      .catch((error) => {
        toastError(error);
        setPairs([]);
      });
  }, []);

  useScrollRestoration(SCROLL_KEY, !!pairs);

  const billLink = (to, label, detail) => (
    <Link
      to={to}
      onClick={() => saveScrollPosition(SCROLL_KEY)}
      className="flex items-center justify-between gap-2 rounded-md bg-gray-50 px-3 py-2"
    >
      <div className="min-w-0">
        <p className="text-normal truncate text-lg leading-tight font-semibold md:text-xl">
          {label}
        </p>
        <p className="text-subtle-dark truncate text-base font-medium md:text-lg">
          {detail}
        </p>
      </div>
      <ChevronRight className="text-subtle-light h-5 w-5 shrink-0" />
    </Link>
  );

  const todo = (pairs || []).filter((pair) => !pair.done).length;

  return (
    <div className="bg-gradient-primary shadow-primary flex min-h-svh w-full flex-col">
      <div className="flex items-center gap-2 px-5 pt-4">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="ย้อนกลับ"
          className="bg-surface/20 flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full"
        >
          <ChevronLeft className="text-surface" />
        </button>
        <p className="text-surface min-w-0 flex-1 truncate text-2xl font-semibold md:text-[26px]">
          เปลี่ยนยางแล้วมาตั้งศูนย์ทีหลัง
        </p>
      </div>

      <div className="bg-surface shadow-primary mt-4 flex w-full flex-1 flex-col rounded-tl-2xl rounded-tr-2xl px-5 pb-28 xl:pb-4">
        {!pairs ? (
          <PageSpinner />
        ) : pairs.length === 0 ? (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-subtle-light text-center text-xl text-balance md:text-[22px]">
              ไม่มีรถที่เปลี่ยนยางแล้วมาตั้งศูนย์ทีหลัง
            </p>
          </div>
        ) : (
          <>
            <p className="text-subtle-dark pt-4 text-lg font-medium md:text-xl">
              {todo > 0
                ? `ยังไม่ได้ตั้งสิทธิ์ ${todo} คัน`
                : "ตั้งสิทธิ์ครบทุกคันแล้ว"}
            </p>
            {pairs.map(({ vehicle, tireBill, alignmentBill, done }) => {
              const plate = vehicle.licensePlate;
              return (
                <div
                  key={`${tireBill.id}-${alignmentBill.id}`}
                  className="bg-surface shadow-primary mt-4 rounded-lg p-3"
                >
                  <div className="mb-2 flex items-center gap-2">
                    <BrandIcons brand={vehicle.vehicleModel?.brand} />
                    <div className="min-w-0 flex-1">
                      <p className="text-primary truncate text-lg font-semibold md:text-xl">
                        {plate?.plateNumber
                          ? `${formatPlate(plate.plateNumber)} ${plate.province}`
                          : "ไม่ระบุทะเบียนรถ"}
                      </p>
                      <p className="text-subtle-dark truncate text-base font-medium md:text-lg">
                        {getDisplayBrand(vehicle.vehicleModel)}
                      </p>
                    </div>
                    {/* สีเดียวกับป้ายฟรีที่ค้างไว้บนการ์ดตั้งศูนย์ */}
                    {done && (
                      <span className="bg-status-paid/10 text-status-paid shrink-0 rounded-full px-2.5 py-px text-sm font-semibold md:text-base">
                        ตั้งสิทธิ์แล้ว
                      </span>
                    )}
                  </div>
                  <div className="space-y-2">
                    {billLink(
                      `/repairs/${tireBill.id}`,
                      `เปลี่ยนยาง ${tireBill.tires} เส้น`,
                      formatDateShort(tireBill.createdAt),
                    )}
                    {billLink(
                      `/repairs/${alignmentBill.id}`,
                      "ตั้งศูนย์",
                      `${formatDateShort(alignmentBill.createdAt)} | ${formatCurrency(alignmentBill.price)}`,
                    )}
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
};

export default LateAlignments;
