import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { ChevronRight } from "lucide-react";
import DialogTitleBar from "@/components/dialogs/DialogTitleBar";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import PageSpinner from "@/components/ui/PageSpinner";
import ItemImage from "@/components/ui/ItemImage";
import { SparePart } from "@/components/icons/Icons";
import BrandIcons from "@/components/icons/BrandIcons";
import CarCard from "@/components/cards/CarCard";
import { getVehicleModelReport } from "@/api/report";
import useInventoryPreview, {
  inventoryRefOf,
} from "@/hooks/useInventoryPreview";
import RepairItemDetailDialog from "@/components/dialogs/RepairItemDetailDialog";
import { getDisplayBrand } from "@/utils/repairDisplay";
import { formatDate, formatPlate, formatQuantity } from "@/utils/formats";
import { stockStatusOf } from "@/utils/inventoryItem";
import { toastError } from "@/utils/handleError";

const STOCK_TEXT = {
  out: "text-destructive",
  low: "text-status-progress",
};

// หมดแล้วต้องเห็นเป็นสีแดงเสมอ แม้อะไหล่ตัวนั้นไม่ได้ตั้งขั้นต่ำไว้ เพราะหน้านี้ใช้ดูว่าต้องสั่งอะไร
const stockLabel = (item) => {
  const { stockQuantity, minStockLevel, isOilKit } = item.stock;
  if (stockQuantity <= 0) return { tone: "out", text: "สต็อกหมด" };
  const { tone } = stockStatusOf(
    { stockQuantity, minStockLevel, unit: item.unit },
    isOilKit,
  );
  return {
    tone,
    text: `เหลือ ${formatQuantity(stockQuantity)} ${item.unit || ""}`.trim(),
  };
};

const TABS = [
  { id: "parts", label: "อะไหล่" },
  { id: "vehicles", label: "รถ" },
];

// model = แถวที่กดในอันดับรุ่นรถ, range = ช่วงเวลาเดียวกับหน้ารายงาน
// restore = แท็บกับตำแหน่งเลื่อนตอนกดไปดูรถ ใช้เปิดกลับมาที่เดิมเมื่อกดย้อนกลับ
// onLeave = เรียกก่อนไปหน้าประวัติรถ ให้หน้ารายงานจำไว้ว่าต้องเปิดหน้าต่างนี้กลับ
const VehicleModelReportDialog = ({
  model,
  range,
  itemName,
  restore,
  onLeave,
  onClose,
}) => {
  const [report, setReport] = useState(null);
  const [tab, setTab] = useState("parts");
  const [reloadToken, setReloadToken] = useState(0);
  const listRef = useRef(null);
  const savedScrollRef = useRef(0);
  // เปิดรายละเอียดอะไหล่แทนที่หน้าต่างนี้ชั่วคราว ไม่ซ้อนกัน เพราะหน้าต่างอะไหล่หาพื้นที่เลื่อนจากไดอะล็อกแรกในหน้า
  const { previewItem, isPreviewOpen, setIsPreviewOpen, openPreview } =
    useInventoryPreview({
      onBeforeOpen: () => {
        savedScrollRef.current = listRef.current?.scrollTop || 0;
      },
    });

  // ตอนปิด model กลายเป็น null ก่อนแอนิเมชันปิดจะจบ ต้องวาดรุ่นเดิมต่อ ไม่งั้นอ่าน brand จาก null แล้วจอขาว
  const [lastModel, setLastModel] = useState(model);
  useEffect(() => {
    if (model) setLastModel(model);
  }, [model]);
  const shownModel = model || lastModel;

  const modelId = model?.id;
  const startTime = range.startDate.getTime();
  const endTime = range.endDate.getTime();

  useEffect(() => {
    if (!modelId) return;
    let isCurrent = true;
    getVehicleModelReport(modelId, new Date(startTime), new Date(endTime))
      .then((res) => isCurrent && setReport(res.data))
      .catch((error) => {
        if (!isCurrent) return;
        toastError(error);
        onClose();
      });
    return () => {
      isCurrent = false;
    };
    // onClose เป็นฟังก์ชันใหม่ทุกครั้งที่หน้ารายงานวาดใหม่ ใส่ไว้จะโหลดซ้ำไม่หยุด
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modelId, startTime, endTime, reloadToken]);

  // หน้าต่างนี้ถูกถอดออกตอนเปิดรายละเอียดอะไหล่ กลับมาแล้วเลื่อนไปที่การ์ดเดิม
  useEffect(() => {
    if (isPreviewOpen || !report || !savedScrollRef.current) return;
    const frame = requestAnimationFrame(() => {
      if (listRef.current) listRef.current.scrollTop = savedScrollRef.current;
      savedScrollRef.current = 0;
    });
    return () => cancelAnimationFrame(frame);
  }, [isPreviewOpen, report]);

  // เปิดรุ่นใหม่เริ่มที่แท็บอะไหล่และรอข้อมูลใหม่ ส่วนโหลดซ้ำหลังแก้สต็อกให้คงหน้าเดิมไว้
  useEffect(() => {
    setReport(null);
    setTab(restore?.tab || "parts");
    savedScrollRef.current = restore?.scroll || 0;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modelId]);

  const parts = [...(report?.parts || [])].sort(
    (a, b) => b.quantity - a.quantity || b.revenue - a.revenue,
  );
  const vehicles = [...(report?.vehicles || [])].sort(
    (a, b) =>
      b.visits - a.visits || new Date(b.lastPaidAt) - new Date(a.lastPaidAt),
  );

  return (
    <>
      <Dialog
        open={!!model && !isPreviewOpen}
        onOpenChange={(open) => !open && onClose()}
      >
        <DialogContent
          className="flex h-[90svh] max-h-162.5 w-full flex-col p-0"
          showCloseButton={false}
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <DialogTitleBar
            title={shownModel ? getDisplayBrand(shownModel) : ""}
            description="อะไหล่ที่ใช้และรถรุ่นนี้ที่เข้าร้าน"
            onClose={onClose}
            leftSlot={
              shownModel && (
                <div className="absolute top-1/2 left-5 -translate-y-1/2">
                  <BrandIcons brand={shownModel?.brand} />
                </div>
              )
            }
          />

          {/* แถบแท็บอยู่นอกส่วนที่เลื่อน เลื่อนรายการยาวๆ แล้วยังสลับแท็บได้ */}
          {report && (
            <div className="font-athiti shrink-0 px-5">
              {/* แถบเดียวกับแท็บอะไหล่/รุ่นรถในหน้ารายงาน */}
              <div
                role="tablist"
                className="relative flex w-full rounded-lg bg-gray-100 p-1"
              >
                <div
                  aria-hidden="true"
                  className="bg-gradient-primary absolute top-1 bottom-1 left-1 w-[calc((100%-8px)/2)] rounded-lg shadow-lg duration-300 ease-out"
                  style={{
                    transform: `translateX(${tab === "vehicles" ? 100 : 0}%)`,
                  }}
                />
                {TABS.map((item) => {
                  const count =
                    item.id === "parts" ? parts.length : vehicles.length;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      role="tab"
                      aria-selected={tab === item.id}
                      onClick={() => setTab(item.id)}
                      className={`relative z-10 flex h-10 flex-1 cursor-pointer items-center justify-center rounded-lg text-lg font-semibold duration-300 ease-out md:text-xl ${
                        tab === item.id ? "text-white" : "text-subtle-dark"
                      }`}
                    >
                      {count > 0 ? `${item.label} (${count})` : item.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div
            ref={listRef}
            className="font-athiti flex min-h-0 flex-1 flex-col overflow-y-auto px-5 pb-5"
          >
            {!report ? (
              <PageSpinner />
            ) : (
              <>
                {tab === "parts" &&
                  (parts.length === 0 ? (
                    <div className="flex flex-1 items-center justify-center">
                      <p className="text-subtle-light text-center text-xl text-balance md:text-[22px]">
                        ไม่มีการใช้อะไหล่
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3 pt-px">
                      {parts.map((item) => {
                        const stock = item.stock && stockLabel(item);
                        return (
                          <button
                            key={item.key}
                            type="button"
                            onClick={() => openPreview(item)}
                            disabled={!inventoryRefOf(item)}
                            className="bg-surface shadow-primary flex min-h-20 w-full cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-left disabled:cursor-default"
                          >
                            {/* การ์ดเดียวกับอันดับอะไหล่ในหน้ารายงาน */}
                            <div className="bg-surface flex h-15 w-15 shrink-0 items-center justify-center rounded-lg border border-gray-200">
                              <ItemImage
                                src={item.secureUrl}
                                alt={itemName(item)}
                                className="h-full w-full rounded-lg object-cover"
                                fallback={
                                  <SparePart className="text-subtle-light h-10 w-10" />
                                }
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-normal line-clamp-2 text-base font-semibold break-words md:text-lg">
                                {itemName(item)}
                              </p>
                              <p className="text-subtle-dark text-base font-semibold md:text-lg">
                                {`ใช้ไป ${formatQuantity(item.quantity)} ${item.unit || ""}`.trim()}
                                {stock && (
                                  <>
                                    <span className="text-subtle-light">
                                      {" "}
                                      |{" "}
                                    </span>
                                    <span
                                      className={
                                        STOCK_TEXT[stock.tone]
                                          ? `font-semibold ${STOCK_TEXT[stock.tone]}`
                                          : ""
                                      }
                                    >
                                      {stock.text}
                                    </span>
                                  </>
                                )}
                              </p>
                            </div>
                            {inventoryRefOf(item) && (
                              <div className="text-subtle-light flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100">
                                <ChevronRight />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  ))}

                {tab === "vehicles" && (
                  <div className="space-y-3 pt-px">
                    {vehicles.map((vehicle) => (
                      <Link
                        key={vehicle.id}
                        to={`/vehicles/${vehicle.id}`}
                        onClick={() =>
                          onLeave?.({
                            tab,
                            scroll: listRef.current?.scrollTop || 0,
                          })
                        }
                        className="block"
                      >
                        <CarCard
                          bg="primary"
                          icon={<BrandIcons brand={shownModel?.brand} />}
                          licensePlate={
                            vehicle.licensePlate
                              ? `${formatPlate(vehicle.licensePlate.plateNumber)} ${vehicle.licensePlate.province}`
                              : "ไม่ระบุทะเบียนรถ"
                          }
                          brand={`${vehicle.visits} ครั้ง | ล่าสุด ${formatDate(vehicle.lastPaidAt)}`}
                        />
                      </Link>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <RepairItemDetailDialog
        item={previewItem}
        open={isPreviewOpen}
        onOpenChange={setIsPreviewOpen}
        onStockUpdate={() => setReloadToken((n) => n + 1)}
      />
    </>
  );
};

export default VehicleModelReportDialog;
