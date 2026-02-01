import { Label } from "@radix-ui/react-label";
import { Input } from "../ui/input";
import { useEffect, useState, useId, useCallback } from "react";
import { ImageIcon, X, Upload } from "lucide-react";
import { toast } from "sonner";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
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
      // ถ้า selectedImage เป็น URL string (รูปที่มีอยู่แล้ว)
      setPreviewImage(selectedImage);
    }
  }, [selectedImage, previewImage, inputId]);

  const validateFile = (file) => {
    if (!file) return false;

    // เช็คประเภทไฟล์
    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast.error("รองรับเฉพาะไฟล์ PNG, JPG, WEBP เท่านั้น");
      return false;
    }

    // เช็คขนาดไฟล์
    if (file.size > MAX_FILE_SIZE) {
      toast.error("ไฟล์ใหญ่เกิน 5MB กรุณาเลือกไฟล์ที่เล็กกว่า");
      return false;
    }

    return true;
  };

  // Process file (ใช้ร่วมกันทั้ง input และ drag & drop)
  const processFile = useCallback(
    (file) => {
      if (!validateFile(file)) return;

      // ลบ blob URL เก่าก่อน (ถ้ามี) เพื่อป้องกัน memory leak
      if (previewImage && previewImage.startsWith("blob:")) {
        URL.revokeObjectURL(previewImage);
      }

      // รีเซ็ต mark for deletion เมื่อมีการอัพโหลดรูปใหม่
      setIsMarkedForDeletion(false);
      if (onMarkForDeletion) {
        onMarkForDeletion(false);
      }

      // สร้าง blob URL ใหม่สำหรับ preview
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

  // Drag and Drop handlers
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

    // ถ้า previewImage เป็น blob URL ให้ revoke
    if (previewImage && previewImage.startsWith("blob:")) {
      URL.revokeObjectURL(previewImage);
    }

    // ถ้าเป็นรูปเดิมที่มี publicId ให้มาร์กว่าจะลบแต่ยังไม่ลบจริง
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

  useEffect(() => {
    return () => {
      // เฉพาะ blob URLs เท่านั้นที่ต้อง revoke
      if (previewImage && previewImage.startsWith("blob:")) {
        URL.revokeObjectURL(previewImage);
      }
    };
  }, [previewImage]);

  return (
    <div className="w-full justify-center px-[20px] pt-[16px]">
      <Label
        htmlFor={inputId}
        className="text-subtle-dark text-[22px] font-medium md:text-[24px]"
      >
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
          className={`group bg-surface relative flex h-[280px] w-[280px] flex-col items-center justify-center rounded-[20px] border-2 border-dashed transition-colors ${
            isDragging
              ? "border-primary bg-primary/5"
              : "border-gray-300 hover:border-gray-400"
          } ${isDeleting ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
        >
          {/* แสดง preview image หากมี */}
          {previewImage ? (
            <div className="h-full w-full">
              <img
                src={previewImage}
                alt="Preview"
                className="h-full w-full rounded-[20px] object-contain"
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
                  <p className="text-primary mb-[4px] text-[16px] font-medium md:text-[18px]">
                    วางรูปภาพที่นี่
                  </p>
                </>
              ) : (
                <>
                  <ImageIcon className="text-subtle-light mb-[8px] h-[48px] w-[48px]" />
                  <p className="text-subtle-light mb-[4px] text-[16px] font-medium md:text-[18px]">
                    {placeholder}
                  </p>
                  <p className="text-subtle-light text-[14px] md:text-[16px]">
                    PNG, JPG, WEBP ขนาดไม่เกิน 5MB
                  </p>
                  <p className="text-subtle-light mt-[4px] text-[14px] md:text-[16px]">
                    หรือลากวางไฟล์ที่นี่
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
