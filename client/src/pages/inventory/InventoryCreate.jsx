import FormInput from "@/components/forms/FormInput";
import { useForm } from "react-hook-form";
import FormButton from "@/components/forms/FormButton";
import { createPart } from "@/api/part";
import { createService } from "@/api/service";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { listCategories } from "@/api/category";
import ComboBox from "@/components/ui/ComboBox";
import FormUploadImage from "@/components/forms/FormUploadImage";
import { resizeImage } from "@/utils/resizeImage";
import { uploadImage } from "@/api/uploadImage";
import VehicleCompatibilityInput from "@/components/forms/VehicleCompatibilityInput";
import TireLotInput from "@/components/forms/TireLotInput";
import { useNavigate, useSearchParams } from "react-router";
import { zodResolver } from "@hookform/resolvers/zod";
import { partServiceSchema } from "@/utils/schemas";
import { units } from "@/constants/units";
import { VEHICLE_COMPATIBLE_CATEGORIES } from "@/constants/categories";
import { ChevronLeft } from "lucide-react";
import { toastError } from "@/utils/handleError";

const SUSPENSION_TYPES = [
  { id: "left-right", name: "ซ้าย-ขวา" },
  { id: "other", name: "อื่นๆ" },
];

const InventoryCreate = () => {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    control,
    formState,
    trigger,
    clearErrors,
  } = useForm({
    resolver: zodResolver(partServiceSchema),
    mode: "onChange",
    defaultValues: {
      categoryId: undefined,
    },
  });
  const [category, setCategory] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [vehicleKey, setVehicleKey] = useState(0);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { errors } = formState;
  const presetCategory = searchParams.get("category");

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchCategory();
  }, []);

  useEffect(() => {
    if (errors.categoryId) {
      window.scrollTo(0, 0);
    }
  }, [errors.categoryId]);

  const fetchCategory = async () => {
    try {
      const res = await listCategories();
      setCategory(res.data);

      // เปิดจากหน้ารายการโดยเลือกหมวดหมู่ไว้ -> เลือกให้เลย
      const preset = res.data?.find((cat) => cat.name === presetCategory);
      if (preset) setValue("categoryId", preset.id);
    } catch (error) {
      toastError(error);
    }
  };

  const inventoryPathFor = (categoryId) => {
    const name = category.find((cat) => cat.id === categoryId)?.name;
    return name
      ? `/inventory?category=${encodeURIComponent(name)}`
      : "/inventory";
  };

  const isServiceCategory = () => {
    const selectedCategoryId = watch("categoryId");
    const selectedCategory = category.find(
      (cat) => cat.id === selectedCategoryId,
    );
    return selectedCategory?.name === "บริการ";
  };

  const isTireCategory = () => {
    const selectedCategoryId = watch("categoryId");
    const selectedCategory = category.find(
      (cat) => cat.id === selectedCategoryId,
    );
    return selectedCategory?.name === "ยาง";
  };

  const isSuspensionCategory = () => {
    const selectedCategoryId = watch("categoryId");
    const selectedCategory = category.find(
      (cat) => cat.id === selectedCategoryId,
    );
    return selectedCategory?.name === "ช่วงล่าง";
  };

  const hasVehicleCompatibility = () => {
    const selectedCategoryId = watch("categoryId");
    const selectedCategory = category.find(
      (cat) => cat.id === selectedCategoryId,
    );
    return VEHICLE_COMPATIBLE_CATEGORIES.includes(selectedCategory?.name);
  };

  const handleCategoryChange = (value) => {
    setValue("categoryId", value);
    clearErrors([
      "name",
      "price",
      "partNumber",
      "brand",
      "costPrice",
      "sellingPrice",
      "unit",
      "stockQuantity",
      "minStockLevel",
      "width",
      "aspectRatio",
      "rimDiameter",
      "tireLots",
      "suspensionType",
    ]);
    trigger("categoryId");
  };

  const onInvalid = (errs) => {
    if (!errs) return;

    const fields = Object.keys(errs);

    const errorElements = fields
      .map((field) => document.querySelector(`[name="${field}"]`))
      .filter((el) => el && el.offsetParent !== null);

    if (errorElements.length === 0) return;

    const firstErrorEl = errorElements.reduce((prev, curr) =>
      prev.getBoundingClientRect().top < curr.getBoundingClientRect().top
        ? prev
        : curr,
    );

    firstErrorEl.focus?.();
    firstErrorEl.scrollIntoView({
      block: "center",
      inline: "nearest",
      behavior: "smooth",
    });
  };

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      let partData = {};
      let serviceData = {};
      let image = null;

      if (selectedImage) {
        const resizedImage = await resizeImage(selectedImage);
        const res = await uploadImage(resizedImage);

        image = {
          publicId: res.data?.publicId,
          secureUrl: res.data?.secureUrl,
        };
      } else if (!isServiceCategory()) {
      }

      if (!isServiceCategory()) {
        partData = {
          partNumber: data.partNumber,
          brand: data.brand,
          name: data.name,
          costPrice: data.costPrice,
          sellingPrice: data.sellingPrice,
          unit: data.unit,
          // ยาง: สต็อกมาจากผลรวมล็อต (backend คำนวณ) ไม่ต้องส่ง stockQuantity
          stockQuantity: isTireCategory() ? undefined : data.stockQuantity,
          minStockLevel: data.minStockLevel,
          attributes: isTireCategory()
            ? {
                width: data.width,
                aspectRatio: data.aspectRatio,
                rimDiameter: data.rimDiameter,
              }
            : isSuspensionCategory()
              ? {
                  suspensionType: data.suspensionType,
                }
              : undefined,
          tireLots: isTireCategory()
            ? (data.tireLots || []).map((lot) => ({
                dotCode: lot.dotCode,
                quantity: Number(lot.quantity) || 0,
              }))
            : undefined,
          compatibleVehicles: hasVehicleCompatibility()
            ? watch("compatibleVehicles") || undefined
            : undefined,
          image,
          categoryId: data.categoryId,
        };
      } else {
        serviceData = {
          name: data.name,
          price: data.price,
          categoryId: data.categoryId,
        };
      }

      if (isServiceCategory()) {
        await createService(serviceData);
        toast.success("เพิ่มบริการเรียบร้อยแล้ว");
      } else {
        await createPart(partData);
        toast.success("เพิ่มอะไหล่เรียบร้อยแล้ว");
      }
      navigate(inventoryPathFor(data.categoryId));

      reset();
      setSelectedImage(null);
      setVehicleKey((prev) => prev + 1);
    } catch (error) {
      toastError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-gradient-primary shadow-primary h-[87px] w-full">
      <div className="flex items-center gap-[8px] px-[20px] pt-[16px]">
        <button onClick={() => navigate(-1)} className="text-surface mt-[2px]">
          <ChevronLeft />
        </button>
        <p className="text-surface text-2xl font-semibold md:text-[26px]">
          เพิ่มรายการ
        </p>
      </div>
      <div className="bg-surface shadow-primary mt-[16px] min-h-[calc(100svh-65px)] w-full rounded-tl-2xl rounded-tr-2xl sm:min-h-[calc(100vh-65px)]">
        <form onSubmit={handleSubmit(onSubmit, onInvalid)}>
          <div className="px-[20px] pt-[16px]">
            <ComboBox
              label="หมวดหมู่"
              color="text-subtle-dark"
              labelClass="text-lg md:text-xl"
              options={category}
              value={watch("categoryId")}
              onChange={handleCategoryChange}
              placeholder="-- เลือกหมวดหมู่ --"
              errors={errors}
              name="categoryId"
            />
          </div>

          {/* บริการ */}
          {isServiceCategory() && (
            <div className="mb-[16px]">
              <FormInput
                register={register}
                name="name"
                label="ชื่อบริการ"
                type="text"
                placeholder="เช่น ตั้งศูนย์, ถ่วงล้อ, เปลี่ยนน้ำมันเครื่อง"
                color="subtle-dark"
                errors={errors}
              />

              <FormInput
                register={register}
                name="price"
                label="ราคา (บาท)"
                type="number"
                placeholder="เช่น 400"
                color="subtle-dark"
                errors={errors}
                inputMode="numeric"
              />
            </div>
          )}

          {/* อะไหล่ */}
          {!isServiceCategory() && (
            <div>
              <FormUploadImage
                label="รูปภาพอะไหล่"
                setSelectedImage={setSelectedImage}
                selectedImage={selectedImage}
              />

              <FormInput
                register={register}
                name="partNumber"
                label="รหัสอะไหล่"
                type="text"
                placeholder="เช่น BS19514LEO677"
                color="subtle-dark"
                errors={errors}
              />

              <FormInput
                register={register}
                name="brand"
                label="ยี่ห้อ"
                type="text"
                placeholder={
                  isTireCategory()
                    ? "เช่น LINGLONG, MAXXIS, BRIDGESTONE"
                    : "เช่น 333, 555, VALVOLINE"
                }
                color="subtle-dark"
                errors={errors}
              />

              <FormInput
                register={register}
                name="name"
                label={isTireCategory() ? "รุ่น" : "ชื่ออะไหล่"}
                type="text"
                placeholder={
                  isTireCategory()
                    ? "เช่น CROSSWIND HP010, DURAVIS R624"
                    : "เช่น ลูกหมากปีกนกบน Revo"
                }
                color="subtle-dark"
                errors={errors}
              />

              {/* ยาง */}
              {isTireCategory() && (
                <div className="space-y-4">
                  <FormInput
                    register={register}
                    name="width"
                    label="หน้ายาง (มม.)"
                    type="text"
                    placeholder="เช่น 195, 205, 215"
                    color="subtle-dark"
                    errors={errors}
                    inputMode="numeric"
                    onWheel={(e) => e.target.blur()}
                    onInput={(e) => {
                      e.target.value = e.target.value
                        .replace(/[^0-9]/g, "")
                        .slice(0, 3);
                    }}
                  />

                  <FormInput
                    register={register}
                    name="aspectRatio"
                    label="แก้มยาง (%)"
                    type="text"
                    placeholder="เช่น 55, 60, 65"
                    color="subtle-dark"
                    errors={errors}
                    inputMode="numeric"
                    onWheel={(e) => e.target.blur()}
                    onInput={(e) => {
                      e.target.value = e.target.value
                        .replace(/[^0-9]/g, "")
                        .slice(0, 2);
                    }}
                  />

                  <FormInput
                    register={register}
                    name="rimDiameter"
                    label="ขอบ (นิ้ว)"
                    type="text"
                    placeholder="เช่น 15, 16, 17"
                    color="subtle-dark"
                    errors={errors}
                    inputMode="numeric"
                    onWheel={(e) => e.target.blur()}
                    onInput={(e) => {
                      e.target.value = e.target.value
                        .replace(/[^0-9]/g, "")
                        .slice(0, 2);
                    }}
                  />
                </div>
              )}

              {/* ช่วงล่าง */}
              {isSuspensionCategory() && (
                <div className="my-[16px] px-[20px]">
                  <ComboBox
                    label="ประเภทช่วงล่าง"
                    color="text-subtle-dark"
                    labelClass="text-lg md:text-xl"
                    options={SUSPENSION_TYPES}
                    value={watch("suspensionType")}
                    onChange={(value) =>
                      setValue("suspensionType", value, {
                        shouldValidate: true,
                        shouldTouch: true,
                      })
                    }
                    placeholder="-- เลือกประเภท --"
                    errors={errors}
                    name="suspensionType"
                  />
                  <input
                    {...register("suspensionType")}
                    type="hidden"
                    value={watch("suspensionType") || ""}
                  />
                </div>
              )}

              <FormInput
                register={register}
                name="costPrice"
                label="ราคาต้นทุน (บาท)"
                type="number"
                placeholder="เช่น 2500"
                color="subtle-dark"
                errors={errors}
                inputMode="numeric"
                onWheel={(e) => e.target.blur()}
                onInput={(e) => {
                  e.target.value = e.target.value.replace(/[^0-9.]/g, "");
                }}
              />

              <FormInput
                register={register}
                name="sellingPrice"
                label="ราคาขาย (บาท)"
                type="number"
                placeholder="เช่น 2850"
                color="subtle-dark"
                errors={errors}
                inputMode="numeric"
                onWheel={(e) => e.target.blur()}
                onInput={(e) => {
                  e.target.value = e.target.value.replace(/[^0-9.]/g, "");
                }}
              />

              <div className="my-[16px] px-[20px]">
                <ComboBox
                  label="หน่วย"
                  color="text-subtle-dark"
                  labelClass="text-lg md:text-xl"
                  options={units}
                  value={watch("unit")}
                  onChange={(value) =>
                    setValue("unit", value, {
                      shouldValidate: true,
                      shouldTouch: true,
                    })
                  }
                  placeholder="-- เลือกหน่วย --"
                  errors={errors}
                  name="unit"
                />
                <input
                  {...register("unit")}
                  type="hidden"
                  value={watch("unit") || ""}
                />
              </div>
              {isTireCategory() ? (
                <TireLotInput
                  control={control}
                  register={register}
                  watch={watch}
                  errors={errors}
                />
              ) : (
                <FormInput
                  register={register}
                  name="stockQuantity"
                  label="จำนวนสต็อก"
                  type="number"
                  placeholder="เช่น 4"
                  color="subtle-dark"
                  errors={errors}
                  inputMode="numeric"
                  onWheel={(e) => e.target.blur()}
                  onInput={(e) => {
                    e.target.value = e.target.value.replace(/[^0-9]/g, "");
                  }}
                />
              )}

              <FormInput
                register={register}
                name="minStockLevel"
                label="สต็อกขั้นต่ำ"
                type="number"
                placeholder="เช่น 2"
                color="subtle-dark"
                errors={errors}
                inputMode="numeric"
                onWheel={(e) => e.target.blur()}
                onInput={(e) => {
                  e.target.value = e.target.value.replace(/[^0-9]/g, "");
                }}
              />

              {hasVehicleCompatibility() && (
                <VehicleCompatibilityInput
                  key={vehicleKey}
                  setValue={setValue}
                  watch={watch}
                />
              )}
            </div>
          )}
          <div className="mt-[24px] flex justify-center pb-[112px]">
            <FormButton
              label={isServiceCategory() ? "เพิ่มบริการ" : "เพิ่มอะไหล่"}
              isLoading={isSubmitting}
            />
          </div>
        </form>
      </div>
    </div>
  );
};

export default InventoryCreate;
