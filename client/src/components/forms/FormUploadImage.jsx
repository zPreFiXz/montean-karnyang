import { Label } from "@radix-ui/react-label";
import { Input } from "../ui/input";
import { useEffect, useState } from "react";
import { ImageIcon, X } from "lucide-react";

const FormUploadImage = ({
  label,
  setSelectedImage,
  selectedImage,
  publicId,
  onMarkForDeletion,
}) => {
  const [previewImage, setPreviewImage] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isMarkedForDeletion, setIsMarkedForDeletion] = useState(false);

  useEffect(() => {
    if (selectedImage === null && previewImage) {
      URL.revokeObjectURL(previewImage);
      setPreviewImage(null);

      const input = document.getElementById("image-upload");
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
  }, [selectedImage, previewImage]);

  const handleOnChange = async (e) => {
    const file = e.target.files[0];

    if (file) {
      // ลบ blob URL เก่าก่อน (ถ้ามี) เพื่อป้องกัน memory leak
      if (previewImage && previewImage.startsWith("blob:")) {
        URL.revokeObjectURL(previewImage);
      }

      // สร้าง blob URL ใหม่สำหรับ preview
      const newBlobUrl = URL.createObjectURL(file);
      setPreviewImage(newBlobUrl);

      if (setSelectedImage) {
        setSelectedImage(file);
      }
    }
  };

  const handleDelete = async (e) => {
    e.preventDefault();

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

    const input = document.getElementById("image-upload");
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
        htmlFor="image-upload"
        className="font-medium text-[18px] text-subtle-dark"
      >
        {label}
      </Label>
      <div className="flex justify-center items-center mt-[8px]">
        <Input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={handleOnChange}
          className="hidden"
          id="image-upload"
          disabled={isDeleting}
        />
        <label
          htmlFor={isDeleting ? undefined : "image-upload"}
          className={`group relative flex flex-col justify-center items-center w-[280px] h-[280px] rounded-[20px] border-2 border-dashed border-gray-300 hover:border-primary bg-surface duration-300 ${
            isDeleting ? "cursor-not-allowed opacity-50" : "cursor-pointer"
          }`}
        >
          {previewImage ? (
            <div className="w-full h-full">
              <img
                src={previewImage}
                alt="Preview"
                className="object-contain  w-full h-full rounded-[20px]"
              />
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="absolute top-2 right-2 flex justify-center items-center w-8 h-8 rounded-full border border-black/5 hover:border-surface font-medium text-lg text-subtle-dark hover:text-surface bg-surface hover:bg-primary shadow-lg hover:shadow-xl backdrop-blur-sm duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <>
              <ImageIcon className="w-[48px] h-[48px] mb-[8px] text-subtle-light group-hover:text-primary group-hover:scale-110 duration-300" />
              <p className="mb-[4px] font-medium text-[16px] text-subtle-light group-hover:text-primary duration-300">
                เลือกรูปอะไหล่
              </p>
              <p className="text-[12px] text-subtle-light group-hover:text-subtle-dark duration-300">
                PNG, JPG, WEBP ขนาดไม่เกิน 5MB
              </p>
            </>
          )}
        </label>
      </div>
    </div>
  );
};
export default FormUploadImage;
