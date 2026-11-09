import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import {
  ChevronLeft,
  ShoppingBag,
  Wrench as WrenchOutline,
} from "lucide-react";
import PageSpinner from "@/components/ui/PageSpinner";
import CarCard from "@/components/cards/CarCard";
import OutlineCardIcon from "@/components/icons/OutlineCardIcon";
import BrandIcons from "@/components/icons/BrandIcons";
import { listMissingUnitItems } from "@/api/inventory";
import { getStatusInfo } from "@/constants/repairStatus";
import {
  getRepairSubtitle,
  getRepairTitle,
  isNoVehicleRepair,
  isSaleRepair,
} from "@/utils/repairDisplay";
import { toastError } from "@/utils/handleError";

const CARD_BG = {
  ESTIMATE: "estimate",
  IN_PROGRESS: "progress",
  COMPLETED: "completed",
  PAID: "paid",
  CREDIT: "credit",
};

const MissingUnits = () => {
  const navigate = useNavigate();
  const [lines, setLines] = useState(null);

  useEffect(() => {
    listMissingUnitItems()
      .then((res) => setLines(res.data || []))
      .catch((error) => {
        toastError(error);
        setLines([]);
      });
  }, []);

  // บิลเดียวมีอะไหล่อื่นๆ ได้หลายบรรทัด รวมเป็นการ์ดเดียว เรียงตามบิลล่าสุดเหมือนที่เซิร์ฟเวอร์ส่งมา
  const billMap = new Map();
  for (const line of lines || []) {
    const bill = billMap.get(line.repair.id);
    if (bill) bill.lines.push(line);
    else billMap.set(line.repair.id, { repair: line.repair, lines: [line] });
  }
  const bills = [...billMap.values()];

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
          อะไหล่อื่นๆ ที่ไม่มีหน่วย
        </p>
        {bills.length > 0 && (
          <span className="text-surface/70 shrink-0 text-xl font-medium md:text-[22px]">
            ({bills.length})
          </span>
        )}
      </div>

      <div className="bg-surface shadow-primary mt-4 flex w-full flex-1 flex-col rounded-tl-2xl rounded-tr-2xl px-5 pb-28 xl:pb-4">
        {!lines ? (
          <PageSpinner />
        ) : bills.length === 0 ? (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-subtle-light text-center text-xl text-balance md:text-[22px]">
              ไม่มีอะไหล่อื่นๆ ที่ไม่มีหน่วย
            </p>
          </div>
        ) : (
          bills.map(({ repair, lines: billLines }) => {
            const status = getStatusInfo(repair.status, repair.type);
            return (
              // กดเข้าไปแก้หน่วยในบิลเอง ท้ายบรรทัดรองบอกชื่ออะไหล่ที่ยังไม่มีหน่วย
              <Link
                key={repair.id}
                to={`/repairs/${repair.id}`}
                className="mt-4 block w-full"
              >
                <CarCard
                  bg={CARD_BG[repair.status] || "primary"}
                  icon={
                    isSaleRepair(repair) ? (
                      <OutlineCardIcon
                        icon={ShoppingBag}
                        color={status.iconColor}
                      />
                    ) : isNoVehicleRepair(repair) ? (
                      <OutlineCardIcon
                        icon={WrenchOutline}
                        color={status.iconColor}
                      />
                    ) : (
                      <BrandIcons
                        brand={repair.vehicle?.vehicleModel?.brand}
                        color={status.iconColor}
                      />
                    )
                  }
                  licensePlate={getRepairTitle(repair)}
                  brand={getRepairSubtitle(repair)}
                  note={[
                    ...new Set(
                      billLines.map((line) => line.itemName || "อะไหล่อื่นๆ"),
                    ),
                  ].join(", ")}
                />
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
};

export default MissingUnits;
