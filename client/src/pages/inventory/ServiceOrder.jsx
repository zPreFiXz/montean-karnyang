import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { ChevronDown, ChevronLeft, ChevronUp } from "lucide-react";
import PageSpinner from "@/components/ui/PageSpinner";
import { listInventory } from "@/api/inventory";
import { updateServiceOrder } from "@/api/service";
import { isNoCategoryItem, sortServices } from "@/constants/services";
import { SERVICE_CATEGORY } from "@/constants/categories";
import { toastError } from "@/utils/handleError";
import { withViewTransition } from "@/utils/viewTransition";

const ServiceOrder = () => {
  const navigate = useNavigate();
  const [services, setServices] = useState(null);

  useEffect(() => {
    listInventory(SERVICE_CATEGORY, null)
      .then((res) =>
        // อะไหล่อื่นๆ ส่วนลด เทิร์นยางเก่า อยู่กลุ่มไม่มีหมวดหมู่ ไม่ได้อยู่ในรายการบริการ
        setServices(
          sortServices(
            (res.data || []).filter(
              (item) => item.type === "service" && !isNoCategoryItem(item),
            ),
          ),
        ),
      )
      .catch(toastError);
  }, []);

  const move = async (index, direction) => {
    const target = index + direction;
    if (target < 0 || target >= services.length) return;

    const reordered = [...services];
    [reordered[index], reordered[target]] = [
      reordered[target],
      reordered[index],
    ];
    // อัปเดตหน้าจอทันทีไม่ต้องรอเซิร์ฟเวอร์ ไม่งั้นกดเลื่อนรัวๆ จะกระตุก
    withViewTransition(() => setServices(reordered));
    try {
      await updateServiceOrder(reordered.map((service) => service.id));
    } catch (error) {
      toastError(error);
    }
  };

  const moveButtonClass =
    "text-subtle-dark bg-surface flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-gray-200 disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <div className="bg-gradient-primary shadow-primary desktop-column flex min-h-svh w-full flex-col">
      <div className="flex items-center gap-2 px-5 pt-4">
        <button
          type="button"
          onClick={() =>
            window.history.length > 1
              ? navigate(-1)
              : navigate(
                  `/inventory?category=${encodeURIComponent(SERVICE_CATEGORY)}`,
                )
          }
          aria-label="ย้อนกลับ"
          className="bg-surface/20 flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full"
        >
          <ChevronLeft className="text-surface" />
        </button>
        <p className="text-surface text-2xl font-semibold md:text-[26px]">
          เรียงลำดับบริการ
        </p>
      </div>
      <div className="bg-surface shadow-primary mt-4 flex w-full flex-1 flex-col rounded-tl-2xl rounded-tr-2xl pb-28 xl:pb-4">
        {!services ? (
          <PageSpinner />
        ) : (
          <div className="px-5 pt-4">
            <div className="bg-surface shadow-primary rounded-lg p-4">
              <div className="mb-4 flex items-center gap-1.5 border-b border-gray-100 pb-4">
                <p className="text-primary text-xl font-semibold md:text-[22px]">
                  บริการ
                </p>
                {services.length > 0 && (
                  <span className="text-subtle-light text-lg font-medium md:text-xl">
                    ({services.length})
                  </span>
                )}
              </div>
              {services.length === 0 ? (
                <p className="text-subtle-light py-4 text-center text-lg md:text-xl">
                  ไม่มีบริการ
                </p>
              ) : (
                <div className="space-y-2">
                  {services.map((service, index) => (
                    <div
                      key={service.id}
                      style={{ viewTransitionName: `service-${service.id}` }}
                      className="flex items-center justify-between gap-3 rounded-md bg-gray-50 p-2"
                    >
                      <p className="text-normal min-w-0 truncate pl-1 text-lg font-medium md:text-xl">
                        {service.name}
                      </p>
                      <div className="flex shrink-0 gap-1">
                        <button
                          type="button"
                          onClick={() => move(index, -1)}
                          disabled={index === 0}
                          aria-label={`เลื่อน ${service.name} ขึ้น`}
                          className={moveButtonClass}
                        >
                          <ChevronUp className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => move(index, 1)}
                          disabled={index === services.length - 1}
                          aria-label={`เลื่อน ${service.name} ลง`}
                          className={moveButtonClass}
                        >
                          <ChevronDown className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ServiceOrder;
