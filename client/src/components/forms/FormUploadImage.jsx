import { Label } from "@radix-ui/react-label";
import { Input } from "../ui/input";
import { useEffect, useState, useId, useCallback } from "react";
import { ImageIcon, X, Upload } from "lucide-react";
import { toast } from "sonner";

// เพดานของ "ไฟล์ต้นฉบับที่ผู้ใช้เลือก" — กันแค่ไฟล์ใหญ่ผิดปกติ
// รูปถูกย่อเหลือ 720x720 ก่อนส่ง (resizeImage) เหลือราว 100-250KB
// ถ้าตั้งไว้ที่ 1MB รูปจากกล้องมือถือ (2-5MB) จะถูกปฏิเสธตั้งแต่ยังไม่ทันได้ย่อ
// หมายเหตุ: server มีเพดานของตัวเองที่ ~5MB แต่วัด "หลังย่อ" จึงเป็นคนละค่ากันโดยตั้งใจ
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp"];

const FormUploadImage = ({
  label,
  setSelectedImage,
  selectedImage,
  publicId,
  onMarkForDeletion,
  placeholder = "เลือกรูปภาพ",
}) => {
  const [previewImage, setPreviewImage] = useState(null);
  const [isDeleting] = useState(false);
  const [, setIsMarkedForDeletion] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const inputId = useId();

  useEffect(() => {
    if (selectedImage === null && previewImage) {
      URL.revokeObjectURL(previewImage);
      setPreviewImage(null);

      const input = document.getElementById(inputId);
      if (input) {
        input.value = "";
      }
    } else if (
      typeof selectedImage === "string" &&
      selectedImage !== previewImage
    ) {
      setPreviewImage(selectedImage);
    }
  }, [selectedImage, previewImage, inputId]);

  useEffect(() => {
    return () => {
      if (previewImage && previewImage.startsWith("blob:")) {
        URL.revokeObjectURL(previewImage);
      }
    };
  }, [previewImage]);

  const validateFile = (file) => {
    if (!file) return false;

    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast.error("รองรับเฉพาะไฟล์ PNG, JPG, WEBP เท่านั้น");
      return false;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast.error("ไฟล์ใหญ่เกิน 10MB กรุณาเลือกไฟล์ที่เล็กกว่า");
      return false;
    }

    return true;
  };

  const processFile = useCallback(
    (file) => {
      if (!validateFile(file)) return;

      if (previewImage && previewImage.startsWith("blob:")) {
        URL.revokeObjectURL(previewImage);
      }

      setIsMarkedForDeletion(false);
      if (onMarkForDeletion) {
        onMarkForDeletion(false);
      }

      const newBlobUrl = URL.createObjectURL(file);
      setPreviewImage(newBlobUrl);

      if (setSelectedImage) {
        setSelectedImage(file);
      }
    },
    [previewImage, onMarkForDeletion, setSelectedImage],
  );

  const handleOnChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDeleting) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (isDeleting) return;

    const file = e.dataTransfer.files[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDelete = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (previewImage && previewImage.startsWith("blob:")) {
      URL.revokeObjectURL(previewImage);
    }

    if (publicId && typeof selectedImage === "string") {
      setIsMarkedForDeletion(true);
      if (onMarkForDeletion) {
        onMarkForDeletion(true);
      }
    }

    setPreviewImage(null);

    if (setSelectedImage) {
      setSelectedImage(null);
    }

    const input = document.getElementById(inputId);
    if (input) {
      input.value = "";
    }
  };

  return (
    <div className="w-full px-[20px] pt-[16px]">
      <Label htmlFor={inputId} className="text-subtle-dark text-xl font-medium">
        {label}
      </Label>

      <div className="mt-[8px] flex items-center justify-center">
        <Input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={handleOnChange}
          className="hidden"
          id={inputId}
          disabled={isDeleting}
        />

        <label
          htmlFor={isDeleting ? undefined : inputId}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          // เส้นประ = ที่ว่างรอไฟล์ พอมีรูปแล้วเปลี่ยนเป็นเส้นทึบเพราะไม่ใช่ที่ว่างอีก
          className={`group bg-surface relative flex aspect-square w-full max-w-[280px] flex-col items-center justify-center overflow-hidden rounded-[20px] border-2 transition-colors ${
            isDragging
              ? "border-primary bg-primary/5 border-dashed"
              : previewImage
                ? "border-input border-solid"
                : "border-dashed border-gray-300 hover:border-gray-400"
          } ${isDeleting ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
        >
          {previewImage ? (
            <div className="h-full w-full">
              <img
                src={previewImage}
                alt="Preview"
                className="h-full w-full object-contain"
              />
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="text-subtle-dark bg-surface absolute top-2 right-2 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-black/5 text-lg font-medium shadow-lg backdrop-blur-sm disabled:cursor-not-allowed disabled:opacity-50"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center">
              {isDragging ? (
                <>
                  <Upload className="text-primary mb-[8px] h-[48px] w-[48px]" />
                  <p className="text-primary mb-[4px] text-base font-medium md:text-lg">
                    วางรูปภาพที่นี่
                  </p>
                </>
              ) : (
                <>
                  {/* ไอคอนกับข้อความใช้สีหลักคู่กันเป็นก้อนเดียว = "ตรงนี้กดได้"
                      ส่วนข้อจำกัดคงสีจางไว้ ได้ลำดับชั้น 3 ระดับในกรอบเดียว */}
                  <ImageIcon className="text-primary mb-[8px] h-[48px] w-[48px]" />
                  <p className="text-primary mb-[4px] text-lg font-semibold md:text-xl">
                    {placeholder}
                  </p>
                  <p className="text-subtle-light text-sm md:text-base">
                    รองรับ PNG, JPG, WEBP
                  </p>
                </>
              )}
            </div>
          )}
        </label>
      </div>
    </div>
  );
};
export default FormUploadImage;
