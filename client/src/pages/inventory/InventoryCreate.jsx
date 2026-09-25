import FormInput from "@/components/forms/FormInput";
import TireConstructionToggle from "@/components/forms/TireConstructionToggle";
import { useForm } from "react-hook-form";
import FormButton from "@/components/forms/FormButton";
import { createPart } from "@/api/part";
import { createService } from "@/api/service";
import { toast } from "sonner";
import { firstErrorMessage } from "@/utils/formErrors";
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
import {
  TIRE_UNIT,
  useUnitOptions,
  invalidateUnitOptions,
} from "@/constants/units";
import {
  VEHICLE_COMPATIBLE_CATEGORIES,
  isTireCategoryName,
  tracksTireLots,
  USED_TIRE_CATEGORY,
  getCategoryKind,
} from "@/constants/categories";
import { ChevronLeft } from "lucide-react";
import FieldErrorList from "@/components/forms/FieldErrorList";
import { toastError } from "@/utils/handleError";
import { DEFAULT_TIRE_CONSTRUCTION } from "@/utils/tireSize";
import { withMinDuration } from "@/utils/withMinDuration";
import { SIDE_OPTIONS, toPerSide } from "@/utils/suspension";

const InventoryCreate = () => {
  const { partUnitOptions, serviceUnitOptions } = useUnitOptions();
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

  // หมวดหมู่เป็น ComboBox ที่ไม่มี input ให้ onInvalid ค้นหาเจอ จึงพาขึ้นบนสุดแทน
  // (หมวดหมู่เป็นช่องแรกของฟอร์มอยู่แล้ว) — เลื่อนแบบนุ่มให้เหมือนช่องอื่น
  useEffect(() => {
    if (errors.categoryId) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [errors.categoryId]);

  const fetchCategory = async () => {
    try {
      const res = await listCategories();
      setCategory(res.data);

      // เปิดจากหน้ารายการโดยเลือกหมวดหมู่ไว้ -> เลือกให้เลย
      const preset = res.data?.find((cat) => cat.name === presetCategory);
      if (preset) {
        setValue("categoryId", preset.id);
        setValue("categoryKind", getCategoryKind(preset.name));
        if (isTireCategoryName(preset.name)) setValue("unit", TIRE_UNIT);
      }
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
    return isTireCategoryName(selectedCategory?.name);
  };

  // ยางเปอร์เซ็นต์ใช้ชื่อเดียวกันหมดตามด้วยเบอร์ ไม่ต้องกรอกยี่ห้อกับรุ่น
  const isUsedTire = () => isTireCategory() && !isLotTracked();

  // ยางใหม่กรอกสต็อกเป็นล็อตตามสัปดาห์/ปีผลิต ยางเปอร์เซ็นต์กรอกจำนวนตรงๆ
  const isLotTracked = () => {
    const selectedCategoryId = watch("categoryId");
    const selectedCategory = category.find(
      (cat) => cat.id === selectedCategoryId,
    );
    return tracksTireLots(selectedCategory?.name);
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
    const name = category.find((cat) => cat.id === value)?.name;
    setValue("categoryId", value);
    // ตัวตรวจข้อมูลดูจากชนิดหมวดหมู่ ไม่ใช่รหัส เพราะรหัสของแต่ละเครื่องไม่ตรงกัน
    setValue("categoryKind", getCategoryKind(name));

    // ยางนับเป็นเส้นเสมอ เลยซ่อนช่องหน่วยแล้วกรอกให้แทน
    // สลับออกจากยางต้องล้างค่าคืน ไม่งั้นอะไหล่จะติดหน่วย "เส้น" มาโดยไม่ได้เลือกเอง
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
    if (!errs) return;

    const fields = Object.keys(errs);

    const errorElements = fields
      .map((field) => document.querySelector(`[name="${field}"]`))
      .filter((el) => el && el.offsetParent !== null);

    if (errorElements.length === 0) {
      // ช่องที่ผิดอาจซ่อนอยู่ (คนละหมวดหมู่ หรืออยู่ในส่วนที่พับไว้) เลื่อนไปหาไม่ได้
      // ถ้าเงียบไปเฉยๆ จะเหมือนกดปุ่มแล้วไม่ทำงาน ต้องบอกว่าติดตรงไหน
      toast.error(
        firstErrorMessage(errs) ||
          "กรอกข้อมูลไม่ครบ ตรวจสอบช่องที่ยังไม่ถูกต้องอีกครั้ง",
      );
      return;
    }

    const firstErrorEl = errorElements.reduce((prev, curr) =>
      prev.getBoundingClientRect().top < curr.getBoundingClientRect().top
        ? prev
        : curr,
    );

    // preventScroll สำคัญ — โดยปริยาย focus() จะกระโดดไปหาช่องทันที
    // แล้ว scrollIntoView ที่ตามมาก็ไม่เหลืออะไรให้เลื่อน ภาพที่เห็นคือเด้งพรึบ
    firstErrorEl.focus?.({ preventScroll: true });
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
      }

      if (!isServiceCategory()) {
        partData = {
          partNumber: data.partNumber,
          brand: isUsedTire() ? "" : data.brand,
          name: isUsedTire() ? USED_TIRE_CATEGORY : data.name,
          costPrice: data.costPrice,
          sellingPrice: data.sellingPrice,
          unit: data.unit,
          // ยาง: สต็อกมาจากผลรวมล็อต (backend คำนวณ) ไม่ต้องส่ง stockQuantity
          stockQuantity: isLotTracked() ? undefined : data.stockQuantity,
          minStockLevel: data.minStockLevel,
          attributes: isTireCategory()
            ? {
                width: data.width,
                aspectRatio: data.aspectRatio,
                rimDiameter: data.rimDiameter,
                construction: data.construction || DEFAULT_TIRE_CONSTRUCTION,
              }
            : {
                perSide: toPerSide(data.suspensionType),
              },
          tireLots: isLotTracked()
            ? (data.tireLots || []).map((lot) => ({
                dotCode: lot.dotCode,
                quantity: Number(lot.quantity) || 0,
              }))
            : undefined,
          compatibleVehicles: hasVehicleCompatibility()
            ? watch("compatibleVehicles") || undefined
            : undefined,
          description: data.description || undefined,
          image,
          categoryId: data.categoryId,
        };
      } else {
        serviceData = {
          name: data.name,
          price: data.price,
          description: data.description || undefined,
          unit: data.unit?.trim() || undefined,
          perSide: toPerSide(data.suspensionType),
          categoryId: data.categoryId,
        };
      }

      if (isServiceCategory()) {
        await withMinDuration(() => createService(serviceData));
        invalidateUnitOptions();
        toast.success("เพิ่มบริการเรียบร้อยแล้ว");
      } else {
        await withMinDuration(() => createPart(partData));
        invalidateUnitOptions();
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
    <div className="bg-gradient-primary shadow-primary flex min-h-svh w-full flex-col">
      <div className="flex items-center gap-[8px] px-[20px] pt-[16px]">
        <button
          onClick={() => navigate(-1)}
          aria-label="ย้อนกลับ"
          className="bg-surface/20 flex h-[40px] w-[40px] shrink-0 cursor-pointer items-center justify-center rounded-full"
        >
          <ChevronLeft className="text-surface" />
        </button>
        <p className="text-surface text-2xl font-semibold md:text-[26px]">
          เพิ่มรายการ
        </p>
      </div>
      <div className="bg-surface shadow-primary mt-[16px] flex w-full flex-1 flex-col rounded-tl-2xl rounded-tr-2xl">
        <form onSubmit={handleSubmit(onSubmit, onInvalid)}>
          <div className="px-[20px] pt-[16px]">
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
                placeholder="เช่น ตั้งศูนย์"
                color="subtle-dark"
                errors={errors}
              />

              {/* ราคากับหน่วยอยู่แถวเดียวกัน อ่านต่อกันได้ว่า "100 บาท ต่อ ล้อ"
                  หน่วยเว้นว่างได้ บริการส่วนใหญ่คิดเป็นครั้ง ไม่ต้องบอกหน่วย */}
              <div className="mt-[16px] px-[20px]">
                <div className="grid grid-cols-2 gap-[8px]">
                  <FormInput
                    register={register}
                    name="price"
                    label="ราคา (บาท)"
                    type="number"
                    placeholder="เช่น 400"
                    color="subtle-dark"
                    customClass="w-full"
                    errors={errors}
                    hideErrorMessage
                    inputMode="numeric"
                  />
                  <div className="w-full">
                    <ComboBox
                      label="หน่วย"
                      color="text-subtle-dark"
                      labelClass="text-xl"
                      options={serviceUnitOptions}
                      value={watch("unit") || ""}
                      onChange={(value) =>
                        setValue("unit", value, { shouldValidate: true })
                      }
                      creatable
                      createLabel={(text) => `เพิ่มหน่วย "${text}"`}
                      customClass="text-lg md:text-xl"
                      errors={errors}
                      hideErrorMessage
                      name="unit"
                    />
                  </div>
                </div>
                <FieldErrorList
                  className="mt-[6px]"
                  messages={[errors.price?.message, errors.unit?.message]}
                />
              </div>
              {/* บริการที่ทำทีละข้าง (ตั้งลูกปืนล้อ) ตอนหยิบลงบิลจะถามว่าฝั่งไหน เหมือนอะไหล่ */}
              <div className="my-[16px] px-[20px]">
                <ComboBox
                  label="ข้าง"
                  color="text-subtle-dark"
                  labelClass="text-xl"
                  options={SIDE_OPTIONS}
                  value={watch("suspensionType") || "single"}
                  onChange={(value) => setValue("suspensionType", value)}
                  name="suspensionType"
                />
              </div>
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

              {/* ยาง */}
              {isTireCategory() && (
                <div className="mt-[16px] px-[20px]">
                  <div className="flex items-end gap-[8px]">
                    <FormInput
                      register={register}
                      name="width"
                      label="หน้ายาง"
                      type="text"
                      placeholder="มม."
                      color="subtle-dark"
                      customClass="w-full min-w-0 flex-1"
                      errors={errors}
                      hideErrorMessage
                      inputMode="decimal"
                      onWheel={(e) => e.target.blur()}
                      onInput={(e) => {
                        // ยางบรรทุกใช้หน่วยนิ้วและมีจุดทศนิยม (7.50R16)
                        // ต่างจากยางเก๋งที่เป็นมิลลิเมตรจำนวนเต็ม (195/55R15)
                        e.target.value = e.target.value
                          .replace(/[^0-9.]/g, "")
                          .replace(/(\..*)\./g, "$1")
                          .slice(0, 5);
                      }}
                    />

                    {/* ยางบรรทุกไม่มีแก้มยาง (7.50R16) ตัวคั่นจึงไม่ควรค้างอยู่เมื่อช่องกลางว่าง */}
                    <span
                      className={`text-subtle-dark flex h-[41px] shrink-0 items-center text-xl font-medium md:text-[22px] ${
                        watch("aspectRatio") ? "" : "opacity-0"
                      }`}
                    >
                      /
                    </span>

                    <FormInput
                      register={register}
                      name="aspectRatio"
                      label="แก้มยาง"
                      type="text"
                      placeholder="%"
                      color="subtle-dark"
                      customClass="w-full min-w-0 flex-1"
                      errors={errors}
                      hideErrorMessage
                      inputMode="numeric"
                      onWheel={(e) => e.target.blur()}
                      onInput={(e) => {
                        e.target.value = e.target.value
                          .replace(/[^0-9]/g, "")
                          .slice(0, 2);
                      }}
                    />

                    <TireConstructionToggle
                      value={watch("construction")}
                      onChange={(next) => setValue("construction", next)}
                    />

                    <FormInput
                      register={register}
                      name="rimDiameter"
                      label="ขอบ"
                      type="text"
                      placeholder="นิ้ว"
                      color="subtle-dark"
                      customClass="w-full min-w-0 flex-1"
                      errors={errors}
                      hideErrorMessage
                      inputMode="numeric"
                      onWheel={(e) => e.target.blur()}
                      onInput={(e) => {
                        e.target.value = e.target.value
                          .replace(/[^0-9]/g, "")
                          .slice(0, 2);
                      }}
                    />
                  </div>

                  <FieldErrorList
                    className="mt-[6px]"
                    messages={[
                      errors.width?.message,
                      errors.aspectRatio?.message,
                      errors.rimDiameter?.message,
                    ]}
                  />
                </div>
              )}

              {/* อะไหล่ทุกหมวด (ยกเว้นยาง) บอกได้ว่าติดตั้งแยกซ้าย-ขวาไหม เช่น โช้ค ไฟหน้า ใบปัดน้ำฝน
                  แยกซ้าย-ขวา = ตอนหยิบลงบิลจะถามว่าฝั่งไหน ใบเสร็จต่อท้าย (L) (R) (R-L) ให้เอง
                  ช่วงล่างบังคับเลือก เพราะหน้าเช็กช่วงล่างใช้แบ่งช่องซ้าย/ขวา หมวดอื่นถือว่าไม่แยกข้างถ้าไม่ได้เลือก */}
              {!isTireCategory() && (
                <div className="my-[16px] px-[20px]">
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

              <div className="mt-[16px] grid grid-cols-2 gap-[8px] px-[20px]">
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
                <div className="my-[16px] px-[20px]">
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
              {/* ยางไม่มีช่องจำนวนสต็อก (คิดจากผลรวมล็อต) สต็อกขั้นต่ำจึงอยู่เต็มแถวไปเลย */}
              {isLotTracked() ? (
                <>
                  <TireLotInput
                    control={control}
                    register={register}
                    watch={watch}
                    errors={errors}
                  />
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
                </>
              ) : (
                <div className="mt-[16px] px-[20px]">
                  <div className="grid grid-cols-2 gap-[8px]">
                    <FormInput
                      register={register}
                      name="stockQuantity"
                      label="จำนวนสต็อก"
                      type="number"
                      placeholder="เช่น 4"
                      color="subtle-dark"
                      customClass="w-full"
                      errors={errors}
                      hideErrorMessage
                      inputMode="numeric"
                      onWheel={(e) => e.target.blur()}
                      onInput={(e) => {
                        e.target.value = e.target.value.replace(/[^0-9]/g, "");
                      }}
                    />

                    <FormInput
                      register={register}
                      name="minStockLevel"
                      label="สต็อกขั้นต่ำ"
                      type="number"
                      placeholder="เช่น 2"
                      color="subtle-dark"
                      customClass="w-full"
                      errors={errors}
                      hideErrorMessage
                      inputMode="numeric"
                      onWheel={(e) => e.target.blur()}
                      onInput={(e) => {
                        e.target.value = e.target.value.replace(/[^0-9]/g, "");
                      }}
                    />
                  </div>

                  <FieldErrorList
                    className="mt-[6px]"
                    messages={[
                      errors.stockQuantity?.message,
                      errors.minStockLevel?.message,
                    ]}
                  />
                </div>
              )}

              {hasVehicleCompatibility() && (
                <VehicleCompatibilityInput
                  key={vehicleKey}
                  setValue={setValue}
                  watch={watch}
                />
              )}
            </div>
          )}

          {/* บันทึกภายในของร้าน ไม่ได้พิมพ์ลงบิล จึงไม่บังคับกรอก */}
          <FormInput
            register={register}
            name="description"
            label="รายละเอียด"
            type="text"
            placeholder="เช่น ของสั่งล่วงหน้า 3 วัน"
            color="subtle-dark"
            errors={errors}
          />
          <div className="mt-[16px] flex justify-center pb-[112px]">
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
