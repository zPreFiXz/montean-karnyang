import { Label } from "@radix-ui/react-label";
import { Input } from "../ui/input";
import { useEffect, useState } from "react";
import { ImageIcon, X } from "lucide-react";

const FormUploadImage = ({ label, setSelectedImage, selectedImage }) => {
  const [previewImage, setPreviewImage] = useState(null);

  useEffect(() => {
    if (selectedImage === null && previewImage) {
      URL.revokeObjectURL(previewImage);
      setPreviewImage(null);

      const input = document.getElementById("image-upload");
      if (input) {
        input.value = "";
      }
    }
  }, [selectedImage, previewImage]);

  const handleOnChange = async (e) => {
    const file = e.target.files[0];

    if (file) {
      if (previewImage) {
        URL.revokeObjectURL(previewImage);
      }
      setPreviewImage(URL.createObjectURL(file));

      if (setSelectedImage) {
        setSelectedImage(file);
      }
    }
  };

  const handleDelete = (e) => {
    e.preventDefault();
    if (previewImage) {
      URL.revokeObjectURL(previewImage);
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
      if (previewImage) {
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
      <div className="flex items-center justify-center mt-[8px]">
        <Input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={handleOnChange}
          className="hidden"
          id="image-upload"
        />
        <label
          htmlFor="image-upload"
          className="group relative flex flex-col items-center justify-center w-[280px] h-[280px] border-2 border-dashed border-gray-300 rounded-[20px] bg-surface hover:border-primary duration-300 cursor-pointer"
        >
          {previewImage ? (
            <div className="w-full h-full">
              <img
                src={previewImage}
                alt="Preview"
                className="w-full h-full object-contain rounded-[20px]"
              />
              <button
                type="button"
                onClick={handleDelete}
                className="absolute top-2 right-2 flex items-center justify-center w-8 h-8 border border-black/5 hover:border-surface rounded-full font-medium text-lg text-subtle-dark bg-surface hover:bg-primary hover:text-surface shadow-lg hover:shadow-xl backdrop-blur-sm  duration-300 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <>
              <ImageIcon className="w-[48px] h-[48px] text-subtle-light mb-[8px] duration-300 group-hover:text-primary group-hover:scale-110" />
              <p className="font-medium text-[16px] text-subtle-light mb-[4px] transition-colors duration-300 group-hover:text-primary">
                เลือกรูปอะไหล่
              </p>
              <p className="text-[12px] text-subtle-light transition-colors duration-300 group-hover:text-subtle-dark">
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
