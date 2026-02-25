import { useEffect, useState } from "react";
import { X, Printer, LoaderCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { getReceiptPreview, printReceipt } from "@/api/print";
import { toast } from "sonner";

const PrintPreviewDialog = ({ isOpen, onClose, repairId }) => {
  const [previewHtml, setPreviewHtml] = useState("");
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  useEffect(() => {
    if (isOpen && repairId) {
      fetchPreview();
    } else {
      setPreviewHtml("");
    }
  }, [isOpen, repairId]);

  const fetchPreview = async () => {
    setIsLoadingPreview(true);
    try {
      const res = await getReceiptPreview(repairId);
      setPreviewHtml(res.data);
    } catch (error) {
      console.log(error);
      toast.error("ไม่สามารถโหลดพรีวิวใบเสร็จได้");
      onClose();
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const handlePrint = async () => {
    setIsPrinting(true);
    try {
      await printReceipt(repairId);
      toast.success("กำลังพิมพ์ใบเสร็จ...");
      onClose();
    } catch (error) {
      console.log(error);
      toast.error("เกิดข้อผิดพลาดในการพิมพ์");
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="flex max-h-[90svh] w-full max-w-[640px] flex-col gap-0 p-0"
        showCloseButton={false}
      >
        <DialogTitle className="sr-only">พรีวิวใบเสร็จ</DialogTitle>
        <DialogDescription className="sr-only">
          พรีวิวใบเสร็จรับเงินก่อนพิมพ์
        </DialogDescription>

        {/* Header */}
        <div className="flex flex-shrink-0 items-center justify-between border-b px-[20px] py-[14px]">
          <div className="flex items-center gap-[8px]">
            <Printer className="text-primary h-5 w-5" />
            <p className="text-subtle-dark text-[20px] font-semibold md:text-[22px]">
              พรีวิวใบเสร็จ
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-[32px] w-[32px] cursor-pointer items-center justify-center rounded-full bg-black/5 hover:bg-black/10"
          >
            <X size={18} className="text-subtle-dark" />
          </button>
        </div>

        {/* Preview Area */}
        <div className="min-h-0 flex-1 overflow-y-auto bg-gray-100 p-[12px]">
          {isLoadingPreview ? (
            <div className="flex h-[400px] items-center justify-center">
              <LoaderCircle className="text-primary h-8 w-8 animate-spin" />
            </div>
          ) : previewHtml ? (
            <iframe
              srcDoc={previewHtml}
              title="Receipt Preview"
              className="h-[830px] w-full rounded-[8px] bg-white shadow-md"
              sandbox="allow-same-origin"
            />
          ) : null}
        </div>

        {/* Footer Buttons */}
        <div className="flex flex-shrink-0 gap-[12px] border-t px-[20px] py-[14px]">
          <button
            type="button"
            onClick={onClose}
            disabled={isPrinting}
            className="text-subtle-dark flex h-[41px] flex-1 cursor-pointer items-center justify-center rounded-[20px] bg-gray-100 text-[18px] font-semibold disabled:opacity-50 md:text-[20px]"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={handlePrint}
            disabled={isPrinting || isLoadingPreview}
            className="bg-primary flex h-[41px] flex-1 cursor-pointer items-center justify-center gap-[6px] rounded-[20px] text-[18px] font-semibold text-white disabled:opacity-50 md:text-[20px]"
          >
            {isPrinting ? (
              <>
                <LoaderCircle className="h-4 w-4 animate-spin" />
                กำลังพิมพ์...
              </>
            ) : (
              <>
                <Printer className="h-4 w-4" />
                พิมพ์
              </>
            )}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PrintPreviewDialog;
