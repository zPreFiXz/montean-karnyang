import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router";
import {
  Printer,
  CheckCircle2,
  Trash2,
  RefreshCw,
  ChevronLeft,
} from "lucide-react";
import {
  getPendingPrintQueue,
  markAsPrinted,
  deleteFromPrintQueue,
} from "@/api/printQueue";
import { getRepairById } from "@/api/repair";
import { printReceipt } from "@/utils/printReceipt";
import { toast } from "sonner";

const PrintStation = () => {
  const [queue, setQueue] = useState([]);
  const [isPolling, setIsPolling] = useState(true);
  const [lastCheck, setLastCheck] = useState(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const pollingRef = useRef(null);
  const processedIdsRef = useRef(new Set());

  // ดึงรายการคิวที่รอพิมพ์
  const fetchQueue = useCallback(async () => {
    try {
      const res = await getPendingPrintQueue();
      setQueue(res.data || []);
      setLastCheck(new Date());

      // ถ้ามีงานใหม่ที่ยังไม่ได้ประมวลผล ให้พิมพ์อัตโนมัติ
      const newItems = (res.data || []).filter(
        (item) => !processedIdsRef.current.has(item.id),
      );

      if (newItems.length > 0 && !isPrinting) {
        for (const item of newItems) {
          processedIdsRef.current.add(item.id);
          await handleAutoPrint(item);
        }
      }
    } catch (error) {
      console.error("Error fetching print queue:", error);
    }
  }, [isPrinting]);

  // พิมพ์อัตโนมัติ
  const handleAutoPrint = async (queueItem) => {
    setIsPrinting(true);
    try {
      // ดึงข้อมูล repair เต็มๆ
      const res = await getRepairById(queueItem.repairId);
      const repair = res.data;

      if (repair) {
        // พิมพ์ใบเสร็จ
        printReceipt(repair);

        // อัปเดตสถานะเป็นพิมพ์แล้ว
        await markAsPrinted(queueItem.id);

        // ลบออกจาก queue ใน state
        setQueue((prev) => prev.filter((q) => q.id !== queueItem.id));

        toast.success(`พิมพ์ใบเสร็จ #${repair.id} เรียบร้อยแล้ว`);
      }
    } catch (error) {
      console.error("Error auto printing:", error);
      toast.error("เกิดข้อผิดพลาดในการพิมพ์");
    } finally {
      setIsPrinting(false);
    }
  };

  // พิมพ์ด้วยตนเอง
  const handleManualPrint = async (queueItem) => {
    setIsPrinting(true);
    try {
      const res = await getRepairById(queueItem.repairId);
      const repair = res.data;

      if (repair) {
        printReceipt(repair);
        await markAsPrinted(queueItem.id);
        setQueue((prev) => prev.filter((q) => q.id !== queueItem.id));
        processedIdsRef.current.add(queueItem.id);
        toast.success(`พิมพ์ใบเสร็จ #${repair.id} เรียบร้อยแล้ว`);
      }
    } catch (error) {
      console.error("Error printing:", error);
      toast.error("เกิดข้อผิดพลาดในการพิมพ์");
    } finally {
      setIsPrinting(false);
    }
  };

  // ลบออกจากคิว
  const handleDelete = async (queueItem) => {
    try {
      await deleteFromPrintQueue(queueItem.id);
      setQueue((prev) => prev.filter((q) => q.id !== queueItem.id));
      processedIdsRef.current.add(queueItem.id);
      toast.success("ลบรายการเรียบร้อยแล้ว");
    } catch (error) {
      console.error("Error deleting:", error);
      toast.error("เกิดข้อผิดพลาดในการลบ");
    }
  };

  // เริ่ม/หยุด polling
  const togglePolling = () => {
    setIsPolling((prev) => !prev);
  };

  // Polling ทุก 3 วินาที
  useEffect(() => {
    if (isPolling) {
      fetchQueue();
      pollingRef.current = setInterval(fetchQueue, 3000);
    } else {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    }

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [isPolling, fetchQueue]);

  // รีเซ็ต processed IDs เมื่อ component mount
  useEffect(() => {
    processedIdsRef.current = new Set();
  }, []);

  const formatTime = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleTimeString("th-TH", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-primary shadow-lg">
        <div className="mx-auto max-w-4xl px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link to="/dashboard" className="text-white">
                <ChevronLeft className="h-6 w-6" />
              </Link>
              <div className="flex items-center gap-2">
                <Printer className="h-8 w-8 text-white" />
                <h1 className="text-2xl font-bold text-white">Print Station</h1>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={togglePolling}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 font-medium transition-colors ${
                  isPolling
                    ? "bg-green-500 text-white hover:bg-green-600"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                <RefreshCw
                  className={`h-5 w-5 ${isPolling ? "animate-spin" : ""}`}
                />
                {isPolling ? "กำลังรอรับงาน" : "หยุดรับงาน"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div className="border-b bg-white">
        <div className="mx-auto max-w-4xl px-4 py-3">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <span className="text-gray-600">
                สถานะ:{" "}
                <span
                  className={
                    isPolling ? "font-semibold text-green-600" : "text-gray-500"
                  }
                >
                  {isPolling ? "● กำลังรอรับงานพิมพ์" : "○ หยุดทำงาน"}
                </span>
              </span>
              <span className="text-gray-600">
                งานในคิว:{" "}
                <span className="text-primary font-semibold">
                  {queue.length}
                </span>
              </span>
            </div>
            <div className="text-gray-500">
              ตรวจสอบล่าสุด: {lastCheck ? formatTime(lastCheck) : "-"}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-4xl px-4 py-6">
        {queue.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl bg-white p-16 shadow-sm">
            <CheckCircle2 className="mb-4 h-16 w-16 text-green-500" />
            <h2 className="mb-2 text-xl font-semibold text-gray-700">
              ไม่มีงานพิมพ์ในคิว
            </h2>
            <p className="text-gray-500">
              เมื่อมีคำสั่งพิมพ์จากมือถือ จะแสดงที่นี่
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-700">
              งานที่รอพิมพ์ ({queue.length} รายการ)
            </h2>
            {queue.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-xl bg-white p-4 shadow-sm"
              >
                <div className="flex items-center gap-4">
                  <div className="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-full">
                    <Printer className="text-primary h-6 w-6" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">
                      ใบเสร็จ #{item.repairId}
                    </p>
                    <p className="text-sm text-gray-500">
                      ส่งเมื่อ: {formatTime(item.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleManualPrint(item)}
                    disabled={isPrinting}
                    className="bg-primary hover:bg-primary/90 flex items-center gap-2 rounded-lg px-4 py-2 text-white transition-colors disabled:opacity-50"
                  >
                    <Printer className="h-4 w-4" />
                    พิมพ์
                  </button>
                  <button
                    onClick={() => handleDelete(item)}
                    className="flex items-center gap-2 rounded-lg bg-red-500 px-4 py-2 text-white transition-colors hover:bg-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Instructions */}
        <div className="mt-8 rounded-xl bg-blue-50 p-6">
          <h3 className="mb-3 font-semibold text-blue-800">วิธีใช้งาน</h3>
          <ul className="space-y-2 text-sm text-blue-700">
            <li>1. เปิดหน้านี้ค้างไว้บนคอมพิวเตอร์ที่เชื่อมต่อเครื่องพิมพ์</li>
            <li>2. เมื่อมีคนกด "พิมพ์ใบเสร็จ" จากมือถือ งานจะปรากฏที่นี่</li>
            <li>3. ระบบจะสั่งพิมพ์อัตโนมัติ หรือกดปุ่ม "พิมพ์" ด้วยตนเอง</li>
            <li>4. ตรวจสอบว่าสถานะ "กำลังรอรับงาน" เป็นสีเขียว</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default PrintStation;
