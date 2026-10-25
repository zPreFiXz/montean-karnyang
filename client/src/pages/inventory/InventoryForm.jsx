import { isPartLikeItem, canHaveServiceImage } from "@/constants/services";
import FormInput from "@/components/forms/FormInput";
import OilKitFields from "@/components/forms/OilKitFields";
import ServiceFields from "@/components/forms/ServiceFields";
import StockFields from "@/components/forms/StockFields";
import TireSizeFields from "@/components/forms/TireSizeFields";
import { useForm } from "react-hook-form";
import FormButton from "@/components/forms/FormButton";
import { createPart, updatePart } from "@/api/part";
import { createService, updateService } from "@/api/service";
import { toast } from "sonner";
import { firstErrorMessage } from "@/utils/formErrors";
import { focusTopmostInvalid } from "@/utils/focusInvalidField";
import { useEffect, useState } from "react";
import { listCategories } from "@/api/category";
import ComboBox from "@/components/ui/ComboBox";
import FormUploadImage from "@/components/forms/FormUploadImage";
import { resizeImage } from "@/utils/resizeImage";
import { deleteImage, uploadImage } from "@/api/uploadImage";
import VehicleCompatibilityInput from "@/components/forms/VehicleCompatibilityInput";
import { useNavigate } from "react-router";

import { zodResolver } from "@hookform/resolvers/zod";
import { partServiceSchema } from "@/utils/schemas";
import {
  TIRE_UNIT,
  useUnitOptions,
  invalidateUnitOptions,
} from "@/constants/units";
import {
  VEHICLE_INPUT_CATEGORIES,
  isTireCategoryName,
  PER_SIDE_CATEGORIES,
  tracksTireLots,
  getCategoryKind,
  OIL_CATEGORY,
} from "@/constants/categories";
import { ChevronLeft, LoaderCircle } from "lucide-react";
import { getInventory } from "@/api/inventory";
import { useParams, useSearchParams } from "react-router";
import useAuthStore from "@/stores/useAuthStore";
import { toastError } from "@/utils/handleError";
import { withMinDuration } from "@/utils/withMinDuration";
import { SIDE_OPTIONS } from "@/utils/suspension";
import {
  itemToFormValues,
  toPartPayload,
  toServicePayload,
} from "@/utils/inventoryForm";

// /inventory/new = เพิ่ม (?category= เลือกหมวดให้ก่อน), /inventory/:id?type= = แก้ไข
const InventoryForm = () => {
  const { partUnitOptions } = useUnitOptions();
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
  const { id } = useParams();
  const isEdit = !!id;
  const [searchParams] = useSearchParams();
  const type = searchParams.get("type");
  const presetCategory = searchParams.get("category");
  const [category, setCategory] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(isEdit);
  const [selectedImage, setSelectedImage] = useState(null);
  const [inventory, setInventory] = useState(null);
  const [vehicleKey, setVehicleKey] = useState(0);
  const [isImageMarkedForDeletion, setIsImageMarkedForDeletion] =
    useState(false);
  const navigate = useNavigate();
  const { errors } = formState;
  const { user } = useAuthStore();
  // ช่องราคาทุนตอนแก้ไขเห็นเฉพาะแอดมิน ตอนเพิ่มใหม่ขึ้นทุกคนเหมือนเดิม
  const showCostPrice = !isEdit || user?.role === "ADMIN";

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchCategory();
  }, []);

  useEffect(() => {
    if (category.length > 0 && id && type) {
      fetchInventory(id, type);
    }
  }, [category, id, type]);

  // หมวดหมู่เป็น ComboBox ที่ไม่มี input ให้ onInvalid หาเจอ จึงพาขึ้นบนสุดแทน
  useEffect(() => {
    if (errors.categoryId) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [errors.categoryId]);

  const fetchCategory = async () => {
    try {
      const res = await listCategories();
      setCategory(res.data);

      const preset =
        !isEdit && res.data?.find((cat) => cat.name === presetCategory);
      if (preset) {
        setValue("categoryId", preset.id);
        setValue("categoryKind", getCategoryKind(preset.name));
        if (isTireCategoryName(preset.name)) setValue("unit", TIRE_UNIT);
      }
    } catch (error) {
      toastError(error);
    }
  };

  const fetchInventory = async (id, type) => {
    try {
      setIsLoading(true);
      const res = await getInventory(id, type);
      setInventory(res.data);

      if (res.data) {
        const item = res.data;

        const selectedCategory = category.find(
          (cat) => cat.name === item.category.name,
        );
        if (selectedCategory) {
          setValue("categoryId", selectedCategory.id);
        }

        const values = itemToFormValues(item);
        Object.entries(values).forEach(([field, value]) =>
          setValue(field, value),
        );
        if (item.type !== "service" && item.attributes) {
          setValue("suspensionType", values.suspensionType, {
            shouldValidate: true,
            shouldTouch: true,
          });
        }
        if (item.type !== "service" && item.secureUrl) {
          setSelectedImage(item.secureUrl);
        }
      }
    } catch (error) {
      toastError(error);
    } finally {
      setIsLoading(false);
    }
  };

  // รับเฉพาะเส้นทางภายใน กัน //ภายนอก ที่เบราว์เซอร์ตีความเป็นเว็บอื่น
  const inventoryPathFor = (categoryId) => {
    const from = searchParams.get("from");
    if (from && from.startsWith("/") && !from.startsWith("//")) {
      return from;
    }

    const name = category.find((cat) => cat.id === categoryId)?.name;
    return name
      ? `/inventory?category=${encodeURIComponent(name)}`
      : "/inventory";
  };

  const isServiceCategory = () => {
    if (inventory) {
      return inventory.type === "service";
    }

    const selectedCategoryId = watch("categoryId");
    const selectedCategory = category.find(
      (cat) => cat.id === selectedCategoryId,
    );
    return selectedCategory?.name === "บริการ";
  };

  const isTireCategory = () => {
    if (inventory && inventory.category) {
      return isTireCategoryName(inventory.category.name);
    }

    const selectedCategoryId = watch("categoryId");
    const selectedCategory = category.find(
      (cat) => cat.id === selectedCategoryId,
    );
    return isTireCategoryName(selectedCategory?.name);
  };

  const isUsedTire = () => isTireCategory() && !isLotTracked();

  const isOilCategory = () =>
    category.find((item) => item.id === watch("categoryId"))?.name ===
    OIL_CATEGORY;
  const isOilKit = isOilCategory() && !!watch("oilSourceId");

  const isLotTracked = () => {
    if (inventory && inventory.category) {
      return tracksTireLots(inventory.category.name);
    }

    const selectedCategoryId = watch("categoryId");
    const selectedCategory = category.find(
      (cat) => cat.id === selectedCategoryId,
    );
    return tracksTireLots(selectedCategory?.name);
  };

  const isSuspensionCategory = () => {
    if (inventory && inventory.category) {
      return inventory.category.name === "ช่วงล่าง";
    }

    const selectedCategoryId = watch("categoryId");
    const selectedCategory = category.find(
      (cat) => cat.id === selectedCategoryId,
    );
    return selectedCategory?.name === "ช่วงล่าง";
  };

  const allowsSideChoice = () => {
    const selectedCategory = category.find(
      (cat) => cat.id === watch("categoryId"),
    );
    const name = selectedCategory?.name ?? inventory?.category?.name;
    return PER_SIDE_CATEGORIES.includes(name);
  };

  const hasVehicleCompatibility = () => {
    const selectedCategoryId = watch("categoryId");
    const selectedCategory = category.find(
      (cat) => cat.id === selectedCategoryId,
    );
    const name = selectedCategory?.name ?? inventory?.category?.name;
    return VEHICLE_INPUT_CATEGORIES.includes(name);
  };

  const handleCategoryChange = (value) => {
    const name = category.find((cat) => cat.id === value)?.name;
    setValue("categoryId", value);
    // ตัวตรวจข้อมูลดูจากชนิดหมวดหมู่ เพราะรหัสหมวดของแต่ละเครื่องไม่ตรงกัน
    setValue("categoryKind", getCategoryKind(name));

    // สลับออกจากยางต้องล้างหน่วยคืน ไม่งั้นอะไหล่จะติดหน่วย "เส้น" มา
    const isTire = isTireCategoryName(
      category.find((cat) => cat.id === value)?.name,
    );
    setValue("unit", isTire ? TIRE_UNIT : "");

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
      "construction",
      "tireLots",
      "suspensionType",
    ]);
    trigger("categoryId");
  };

  const onInvalid = (errs) => {
    if (focusTopmostInvalid(errs)) return;
    toast.error(
      firstErrorMessage(errs) ||
        "กรอกข้อมูลไม่ครบ ตรวจสอบช่องที่ยังไม่ถูกต้องอีกครั้ง",
    );
  };

  // ดูจากชื่อที่บันทึกไว้ ไม่ใช่ที่กำลังพิมพ์ หัวข้อจะได้ไม่เปลี่ยนไปมา
  const readsAsPart = isServiceCategory() && isPartLikeItem(inventory);
  const itemWord = !isServiceCategory() || readsAsPart ? "อะไหล่" : "บริการ";

  const canHaveImage =
    !isServiceCategory() || canHaveServiceImage(watch("name"));

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      let image = null;

      if (!canHaveImage) {
        // ไม่ส่ง image = ไม่เปลี่ยนรูป
      } else if (selectedImage && typeof selectedImage !== "string") {
        const resizedImage = await resizeImage(selectedImage);
        const res = await uploadImage(resizedImage);

        image = {
          publicId: res.data?.publicId,
          secureUrl: res.data?.secureUrl,
        };

        if (inventory?.publicId) {
          try {
            await deleteImage(inventory.publicId);
          } catch (error) {
            toastError(error);
          }
        }
      } else if (selectedImage && typeof selectedImage === "string") {
        image = {
          publicId: inventory?.publicId,
          secureUrl: inventory?.secureUrl,
        };
      } else if (selectedImage === null && isEdit) {
        if (inventory?.publicId && isImageMarkedForDeletion) {
          try {
            await deleteImage(inventory.publicId);
          } catch (error) {
            toastError(error);
          }
        }

        image = {
          publicId: null,
          secureUrl: null,
        };
      }

      const payload = isServiceCategory()
        ? toServicePayload(data, canHaveImage ? image : undefined)
        : toPartPayload(data, image, {
            isUsedTire: isUsedTire(),
            isTire: isTireCategory(),
            lotTracked: isLotTracked(),
            isOilKit,
            hasSideChoice: isSuspensionCategory() || allowsSideChoice(),
            compatibleVehicles: hasVehicleCompatibility()
              ? watch("compatibleVehicles")
              : undefined,
          });

      const itemType = isServiceCategory() ? "service" : "part";

      if (!isEdit) {
        await withMinDuration(() =>
          itemType === "service" ? createService(payload) : createPart(payload),
        );
        invalidateUnitOptions();
        toast.success(`เพิ่ม${itemWord}เรียบร้อยแล้ว`);
        navigate(inventoryPathFor(data.categoryId));
        reset();
        setSelectedImage(null);
        setVehicleKey((prev) => prev + 1);
        return;
      }

      await withMinDuration(() =>
        itemType === "service"
          ? updateService(id, payload)
          : updatePart(id, payload),
      );
      invalidateUnitOptions();

      // เปิดมาจากนอกหน้าคลัง ถอยกลับไปรายการเดิม หน้านั้นเปิดไดอะล็อกต่อเอง (ดู useReopenStockItem)
      const from = searchParams.get("from");
      if (
        from &&
        !from.startsWith("/inventory") &&
        window.history.state?.idx > 0
      ) {
        navigate(-1);
        toast.success(`แก้ไข${itemWord}เรียบร้อยแล้ว`);
        reset();
        setSelectedImage(null);
        setIsImageMarkedForDeletion(false);
        return;
      }

      // ดึงข้อมูลหลังแก้ไว้ส่งไปกับหน้าถัดไป ไดอะล็อกจะเปิดได้ตั้งแต่เฟรมแรก
      let openItem = null;
      try {
        const res = await getInventory(Number(id), itemType);
        openItem = res.data || null;
      } catch {
        // ดึงไม่ได้ก็แค่ไม่เปิดไดอะล็อกต่อ การบันทึกสำเร็จไปแล้ว ไม่ต้องแจ้งซ้ำ
      }

      navigate(inventoryPathFor(data.categoryId), {
        state: { restoreScroll: true, ...(openItem ? { openItem } : {}) },
      });
      // แจ้งหลังเปลี่ยนหน้า ไม่งั้นจะขึ้นก่อนไดอะล็อกเกือบครึ่งวินาที
      toast.success(`แก้ไข${itemWord}เรียบร้อยแล้ว`);

      reset();
      setSelectedImage(null);
      setIsImageMarkedForDeletion(false);
    } catch (error) {
      toastError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-gradient-primary shadow-primary flex min-h-svh w-full flex-col">
      <div className="flex items-center gap-2 px-5 pt-4">
        <button
          onClick={() => navigate(-1)}
          aria-label="ย้อนกลับ"
          className="bg-surface/20 flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full"
        >
          <ChevronLeft className="text-surface" />
        </button>
        <p className="text-surface text-2xl font-semibold md:text-[26px]">
          {isEdit ? `แก้ไข${itemWord}` : "เพิ่มรายการ"}
        </p>
      </div>
      <div className="bg-surface shadow-primary mt-4 flex w-full flex-1 flex-col rounded-tl-2xl rounded-tr-2xl">
        {isLoading ? (
          <div className="flex flex-1 items-center justify-center">
            <LoaderCircle className="text-primary h-8 w-8 animate-spin" />
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit, onInvalid)}>
            <div className="px-5 pt-4">
              <ComboBox
                label="หมวดหมู่"
                color="text-subtle-dark"
                labelClass="text-xl"
                options={category}
                value={watch("categoryId")}
                onChange={handleCategoryChange}
                placeholder="-- เลือกหมวดหมู่ --"
                errors={errors}
                name="categoryId"
                disabled={isEdit}
              />
            </div>

            {isServiceCategory() && (
              <ServiceFields
                register={register}
                watch={watch}
                setValue={setValue}
                errors={errors}
                itemWord={itemWord}
                readsAsPart={readsAsPart}
                selectedImage={selectedImage}
                setSelectedImage={setSelectedImage}
                publicId={inventory?.publicId}
                onMarkImageForDeletion={setIsImageMarkedForDeletion}
              />
            )}

            {!isServiceCategory() && (
              <div>
                <FormUploadImage
                  label="รูปภาพอะไหล่"
                  setSelectedImage={setSelectedImage}
                  selectedImage={selectedImage}
                  publicId={inventory?.publicId}
                  onMarkForDeletion={setIsImageMarkedForDeletion}
                />

                <FormInput
                  register={register}
                  name="partNumber"
                  label="รหัสอะไหล่"
                  type="text"
                  placeholder={
                    isTireCategory()
                      ? "เช่น LL-1855515GMHP010"
                      : "เช่น VVL-STTCMR5W30"
                  }
                  color="subtle-dark"
                  errors={errors}
                />

                {!isUsedTire() && (
                  <>
                    <FormInput
                      register={register}
                      name="brand"
                      label="ยี่ห้อ"
                      type="text"
                      placeholder={
                        isTireCategory() ? "เช่น LINGLONG" : "เช่น VALVOLINE"
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
                          ? "เช่น GREEN-Max HP010"
                          : "เช่น SYNTHETIC COMMONRAIL 5W-30"
                      }
                      color="subtle-dark"
                      errors={errors}
                    />
                  </>
                )}

                {isTireCategory() && (
                  <TireSizeFields
                    register={register}
                    watch={watch}
                    setValue={setValue}
                    errors={errors}
                  />
                )}

                {(isSuspensionCategory() || allowsSideChoice()) && (
                  <div className="my-4 px-5">
                    <ComboBox
                      label="ข้าง"
                      color="text-subtle-dark"
                      labelClass="text-xl"
                      options={SIDE_OPTIONS}
                      value={
                        watch("suspensionType") ||
                        (isSuspensionCategory() ? undefined : "single")
                      }
                      onChange={(value) =>
                        setValue("suspensionType", value, {
                          shouldValidate: true,
                          shouldTouch: true,
                        })
                      }
                      placeholder="-- เลือกข้าง --"
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

                <div
                  className={`mt-4 grid gap-2 px-5 ${
                    showCostPrice ? "grid-cols-2" : "grid-cols-1"
                  }`}
                >
                  {showCostPrice && (
                    <FormInput
                      register={register}
                      name="costPrice"
                      label="ราคาต้นทุน (บาท)"
                      type="number"
                      placeholder="เช่น 2500"
                      color="subtle-dark"
                      customClass="w-full"
                      errors={errors}
                      inputMode="numeric"
                      onWheel={(e) => e.target.blur()}
                      onInput={(e) => {
                        e.target.value = e.target.value.replace(/[^0-9.]/g, "");
                      }}
                    />
                  )}

                  <FormInput
                    register={register}
                    name="sellingPrice"
                    label="ราคาขาย (บาท)"
                    type="number"
                    placeholder="เช่น 2850"
                    color="subtle-dark"
                    customClass="w-full"
                    errors={errors}
                    inputMode="numeric"
                    onWheel={(e) => e.target.blur()}
                    onInput={(e) => {
                      e.target.value = e.target.value.replace(/[^0-9.]/g, "");
                    }}
                  />
                </div>

                {!isTireCategory() && (
                  <div className="my-4 px-5">
                    <ComboBox
                      label="หน่วย"
                      color="text-subtle-dark"
                      labelClass="text-xl"
                      options={partUnitOptions}
                      creatable
                      createLabel={(text) => `เพิ่มหน่วย "${text}"`}
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
                  </div>
                )}
                <input
                  {...register("unit")}
                  type="hidden"
                  value={watch("unit") || ""}
                />
                {isOilCategory() && (
                  <OilKitFields
                    register={register}
                    setValue={setValue}
                    watch={watch}
                    errors={errors}
                    selfId={inventory?.id}
                  />
                )}
                {!isOilKit && (
                  <StockFields
                    lotTracked={isLotTracked()}
                    // หน้าแก้ไขยอมให้ไม่มีล็อต (ยางที่ขายหมดแล้ว backend ลบล็อตทิ้ง)
                    allowEmptyLots={isEdit}
                    control={control}
                    register={register}
                    watch={watch}
                    errors={errors}
                  />
                )}
                {hasVehicleCompatibility() && (
                  <VehicleCompatibilityInput
                    setValue={setValue}
                    watch={watch}
                    key={vehicleKey}
                    initialData={inventory?.compatibleVehicles}
                  />
                )}
              </div>
            )}

            <FormInput
              register={register}
              name="description"
              label="รายละเอียด"
              type="text"
              placeholder="เช่น ของสั่งล่วงหน้า 3 วัน"
              color="subtle-dark"
              errors={errors}
            />

            <div className="mt-4 flex justify-center pb-28 xl:pb-4">
              <FormButton
                label={isEdit ? "บันทึก" : `เพิ่ม${itemWord}`}
                isLoading={isSubmitting}
              />
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default InventoryForm;
