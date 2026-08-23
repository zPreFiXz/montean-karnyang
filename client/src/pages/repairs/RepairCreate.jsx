import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Image,
  Wrench,
  Plus,
  Minus,
  ChevronDown,
  ContactRound,
  ClipboardList,
} from "lucide-react";
import FormInput from "@/components/forms/FormInput";
import LicensePlateInput from "@/components/forms/LicensePlateInput";
import AddRepairItemDialog from "@/components/dialogs/AddRepairItemDialog";
import EditPriceDialog from "@/components/dialogs/EditRepairItemDialog";
import ConfirmDialog from "@/components/dialogs/ConfirmDialog";
import CollapsibleRow from "@/components/ui/CollapsibleRow";
import { scrollToNewRow } from "@/utils/scrollToNewRow";
import FormButton from "@/components/forms/FormButton";
import ComboBox from "@/components/ui/ComboBox";
import { listVehicleModels } from "@/api/vehicleModel";
import { repairSchema } from "@/utils/schemas";
import { provinces } from "@/constants/provinces";
import { formatCurrency } from "@/utils/formats";
import { toastError } from "@/utils/handleError";
import { onKeyActivate } from "@/utils/a11y";
import { withOtherBrandLast } from "@/utils/vehicleBrand";

const CUSTOMER_FIELDS = ["name", "address", "phoneNumber"];
const SUBMIT_FEEDBACK_MS = 400;

const RepairCreate = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { register, handleSubmit, formState, setValue, watch } = useForm({
    resolver: zodResolver(repairSchema),
  });
  const [isCustomerInfoOpen, setIsCustomerInfoOpen] = useState(false);
  const [repairItems, setRepairItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [vehicleModels, setVehicleModels] = useState([]);
  const [brands, setBrands] = useState([]);
  const [restoredStockMap, setRestoredStockMap] = useState({});
  const [priceDialogOpen, setPriceDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [removingIndex, setRemovingIndex] = useState(null);
  // แถวที่กำลังยุบตัวก่อนหายจริง (ดู CollapsibleRow)
  const [leavingIndex, setLeavingIndex] = useState(null);
  const leaveHandledRef = useRef(false);
  const { errors } = formState;

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchVehicleModels();
  }, []);

  useEffect(() => {
    if (location.state) {
      const { repairData, repairItems: savedItems } = location.state;

      if (repairData) {
        Object.keys(repairData).forEach((key) => {
          setValue(key, repairData[key]);
        });
      }

      if (savedItems && savedItems.length > 0) {
        // เฉพาะบิลที่บันทึกแล้ว (แก้ไขบิลเดิม) — ของถูกหักจากคลังไปแล้ว ต้องบวกคืนตอนคำนวณว่าเบิกได้เท่าไหร่
        // ถ้าแค่ย้อนกลับมาจากหน้ายืนยัน คลังยังไม่ถูกหัก ถ้าบวกคืนจะกลายเป็นมีของมากกว่าความจริง
        const map = {};
        if (location.state?.editRepairId) {
          for (const it of savedItems) {
            if (
              it?.partNumber &&
              it?.brand &&
              typeof it.quantity === "number"
            ) {
              const key = `${it.partNumber}|${it.brand}|${it.name || ""}`;
              map[key] = (map[key] || 0) + it.quantity;
            }
          }
        }
        setRestoredStockMap(map);

        // รายการที่กู้คืนมาไม่ได้ผ่านไดอะล็อก จึงยังไม่มีเพดานของปุ่มบวกติดมาด้วย
        setRepairItems(
          savedItems.map((it) => {
            if (it.availableStock !== undefined) return it;
            const key = `${it.partNumber}|${it.brand}|${it.name || ""}`;
            return {
              ...it,
              availableStock: (it.stockQuantity || 0) + (map[key] || 0),
              basePrice: it.basePrice ?? it.sellingPrice,
            };
          }),
        );
      }

      // มาจากปุ่มแก้ไขรายการซ่อม -> พาไปที่หัวข้อของส่วนนั้น ไม่ใช่ล่างสุดของหน้า
      // เพราะปุ่ม "+ เพิ่มรายการซ่อม" อยู่ที่หัวข้อ ถ้ามีหลายรายการจะต้องเลื่อนกลับขึ้นมาเอง
      if (location.state.scrollToItems) {
        scrollToNewRow(() => {
          const headers = document.querySelectorAll("[data-repair-items-top]");
          return [...headers].find((el) => el.offsetParent !== null);
        }, "start");
      }

      const preserved = {
        ...(location.state?.editRepairId
          ? { editRepairId: location.state.editRepairId }
          : {}),
        ...(location.state?.origin ? { origin: location.state.origin } : {}),
        ...(location.state?.from ? { from: location.state.from } : {}),
        ...(location.state?.statusSlug
          ? { statusSlug: location.state.statusSlug }
          : {}),
        ...(location.state?.vehicleId
          ? { vehicleId: location.state.vehicleId }
          : {}),
      };
      window.history.replaceState(
        preserved,
        document.title,
        window.location.pathname,
      );
    }
  }, [location.state, setValue]);

  const fetchVehicleModels = async () => {
    try {
      const res = await listVehicleModels();
      setVehicleModels(res.data);

      const uniqueBrands = withOtherBrandLast([
        ...new Set(res.data.map((item) => item.brand)),
      ]);
      setBrands(uniqueBrands.map((brand) => ({ id: brand, name: brand })));
    } catch (error) {
      toastError(error);
    }
  };

  const getAvailableModelsForBrand = () => {
    const selectedBrand = watch("brand");
    const modelsForBrand = vehicleModels
      .filter((item) => item.brand === selectedBrand)
      .map((item) => ({ id: item.model, name: item.model }));

    return modelsForBrand;
  };

  const renderProductInfo = (item) => {
    const isTire = item.category?.name === "ยาง";

    if (isTire && item.attributes && item.attributes.aspectRatio) {
      return (
        <p className="text-normal line-clamp-1 w-full text-base leading-tight font-semibold md:text-lg">
          {item.brand} {item.attributes.width}/{item.attributes.aspectRatio}R
          {item.attributes.rimDiameter} {item.name}
        </p>
      );
    }

    if (isTire && item.attributes) {
      return (
        <p className="text-normal line-clamp-1 w-full text-base leading-tight font-semibold md:text-lg">
          {item.brand} {item.attributes.width}R{item.attributes.rimDiameter}{" "}
          {item.name}
        </p>
      );
    }

    return (
      <p className="text-normal line-clamp-1 w-full text-base leading-tight font-semibold md:text-lg">
        {item.brand} {item.name}
      </p>
    );
  };

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      // หน่วงสั้นๆ ให้เห็นตัวหมุนก่อนหน้าจอเปลี่ยน ไม่งั้นกดแล้วหน้าเปลี่ยนทันที
      // จนไม่มีอะไรยืนยันว่ากดติด (ไม่ได้รอเซิร์ฟเวอร์ ข้อมูลส่งต่อผ่าน state ล้วน)
      await new Promise((resolve) => setTimeout(resolve, SUBMIT_FEEDBACK_MS));

      navigate("/repairs/review", {
        state: {
          repairData: { ...data, type: "GENERAL" },
          repairItems: repairItems,
          editRepairId: location.state?.editRepairId,
          origin: location.state?.origin || location.state?.from,
          statusSlug: location.state?.statusSlug,
          vehicleId: location.state?.vehicleId,
          from: "create",
        },
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onInvalid = (errs) => {
    const firstErrorField = Object.keys(errs || {})[0];
    if (!firstErrorField) return;

    // ช่องที่ผิดอาจอยู่ในกล่องข้อมูลลูกค้าที่พับไว้ ถ้าไม่กางออกก่อน
    // การโฟกัสจะไม่เห็นอะไรเลย คนใช้จะงงว่ากดปุ่มแล้วไม่มีอะไรเกิดขึ้น
    if (CUSTOMER_FIELDS.includes(firstErrorField)) {
      setIsCustomerInfoOpen(true);
    }

    setTimeout(() => {
      const el = document.querySelector(`[name="${firstErrorField}"]`);
      const isVisible = el && el.type !== "hidden" && el.offsetParent !== null;
      const target = isVisible ? el : el?.parentElement || null;
      if (!target) return;

      // preventScroll สำคัญ — โดยปริยาย focus() จะกระโดดไปหาช่องทันที
      // แล้วการเลื่อนแบบนุ่มที่ตามมาก็ไม่เหลืออะไรให้เลื่อน ภาพที่เห็นคือเด้งพรึบ
      if (isVisible) el.focus?.({ preventScroll: true });
      target.scrollIntoView({
        block: "center",
        inline: "nearest",
        behavior: "smooth",
      });
    }, 200);
  };

  const handleAddItemToRepair = (item) => {
    setRepairItems((prev) => {
      const index = prev.findIndex(
        (i) =>
          i.partNumber === item.partNumber &&
          i.brand === item.brand &&
          i.name === item.name,
      );
      if (index !== -1) {
        return prev.map((i, idx) => {
          if (idx !== index) return i;

          // เลือกซ้ำจากไดอะล็อกไม่ได้ผ่านปุ่มบวก จึงต้องกันเพดานตรงนี้ด้วย
          const limit = i.availableStock ?? i.stockQuantity ?? 0;
          const capped =
            i.partNumber && i.brand
              ? Math.min(i.quantity + 1, limit)
              : i.quantity + 1;

          return { ...i, quantity: capped };
        });
      } else {
        return [
          ...prev,
          {
            ...item,
            // ไดอะล็อกส่งสต็อกที่เบิกได้จริงมาทาง quantity (คิดสต็อกที่คืนจากบิลเดิมแล้ว)
            // เก็บไว้ก่อนถูกทับเป็น 1 เพื่อใช้เป็นเพดานของปุ่มบวก
            availableStock: item.quantity,
            quantity: 1,
            sellingPrice: item.sellingPrice,
            // ราคาตั้งต้นจากคลัง ไว้เทียบตอนแก้ราคา — sellingPrice จะถูกทับเมื่อปรับราคาให้ลูกค้า
            basePrice: item.sellingPrice,
          },
        ];
      }
    });

    // เลื่อนไปหารายการที่เพิ่งเพิ่ม/เพิ่งเพิ่มจำนวน แทนการกระโดดลงล่างสุดของหน้า
    // (รายการถูกวาดสองชุดสำหรับมือถือ/เดสก์ท็อป จึงต้องหยิบชุดที่แสดงอยู่จริง)
    scrollToNewRow(() => {
      const rows = document.querySelectorAll("[data-repair-row]");
      const visible = [...rows].filter((el) => el.offsetParent !== null);
      return visible[visible.length - 1];
    });
  };

  // เบิกได้ไม่เกินสต็อกที่มีอยู่จริง ไม่เกี่ยวกับสต็อกขั้นต่ำ
  // availableStock มาจากไดอะล็อกเลือกอะไหล่ (คิดของที่คืนจากบิลเดิมแล้ว) ส่วนรายการที่กู้คืน
  // กลับมาจากหน้าอื่นไม่ได้ผ่านไดอะล็อก จึงถอยไปใช้สต็อกที่ติดมากับตัวอะไหล่
  // บริการและรายการที่พิมพ์ชื่อเองไม่มีสต็อก จึงไม่จำกัด
  const isAtStockLimit = (item) => {
    if (!item.partNumber || !item.brand) return false;
    const limit = item.availableStock ?? item.stockQuantity ?? 0;
    return item.quantity >= limit;
  };

  const handleIncreaseQuantity = (index) => {
    setRepairItems((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, quantity: item.quantity + 1 } : item,
      ),
    );
  };

  const handleDecreaseQuantity = (index) => {
    setRepairItems((prev) =>
      prev.map((item, i) =>
        i === index && item.quantity > 1
          ? { ...item, quantity: item.quantity - 1 }
          : item,
      ),
    );
  };

  // จำนวนเหลือ 1 แล้วกด − = เอารายการออก จึงถามยืนยันก่อน เพราะกดพลาดแล้วหายทั้งรายการ
  const handleRemoveItem = () => {
    leaveHandledRef.current = false;
    setLeavingIndex(removingIndex);
    setRemovingIndex(null);
  };

  // รายการถูกวาดสองชุด (มือถือ/เดสก์ท็อป) ทั้งคู่จึงเรียกตัวนี้เมื่อยุบเสร็จ
  // ถ้าไม่กันไว้ ครั้งที่สองจะไปลบรายการถัดไปที่เลื่อนขึ้นมาแทนที่
  const handleLeaveEnd = () => {
    if (leaveHandledRef.current) return;
    leaveHandledRef.current = true;

    setRepairItems((prev) => prev.filter((_, i) => i !== leavingIndex));
    setLeavingIndex(null);
  };

  const handlePriceClick = (index, item) => {
    setEditingItem({ index, ...item });
    setPriceDialogOpen(true);
  };

  const handlePriceConfirm = (payload) => {
    const newPrice = typeof payload === "number" ? payload : payload?.price;
    const newName = typeof payload === "object" ? payload?.name : undefined;

    if (editingItem && newPrice != null) {
      setRepairItems((prev) =>
        prev.map((item, i) =>
          i === editingItem.index
            ? {
                ...item,
                sellingPrice: newPrice,
                ...(newName ? { name: newName } : {}),
              }
            : item,
        ),
      );
    }
  };

  // บริการไม่มียี่ห้อ (null) — ต่อสตริงตรงๆ จะได้คำว่า "null" ติดมาหน้าชื่อ
  // ต่างจากการ์ดบนหน้าจอที่เขียนเป็น JSX ซึ่ง React ข้าม null ให้เอง
  const getProductName = (item) => {
    const isTire = item.category?.name === "ยาง";

    if (isTire && item.attributes && item.attributes.aspectRatio) {
      return `${item.brand} ${item.attributes.width}/${item.attributes.aspectRatio}R${item.attributes.rimDiameter} ${item.name}`;
    }

    if (isTire && item.attributes) {
      return `${item.brand} ${item.attributes.width}R${item.attributes.rimDiameter} ${item.name}`;
    }

    return [item.brand, item.name].filter(Boolean).join(" ");
  };

  return (
    <div className="bg-gradient-primary shadow-primary flex min-h-[100svh] flex-col xl:min-h-[calc(100vh-73px)] xl:flex-row xl:items-start xl:gap-[16px] xl:bg-transparent xl:px-[16px] xl:pt-[24px] xl:pb-[24px] xl:shadow-none">
      <div className="xl:shadow-primary flex flex-1 flex-col xl:h-fit xl:w-1/2 xl:flex-initial xl:rounded-2xl xl:bg-white">
        <div className="flex items-center gap-[8px] px-[20px] pt-[16px]">
          <div className="bg-surface/20 xl:bg-primary/10 flex h-[40px] w-[40px] items-center justify-center rounded-full">
            <Plus color="#ffffff" className="xl:hidden" />
            <Plus className="text-primary hidden xl:block" />
          </div>
          <div>
            <p className="text-surface xl:text-primary text-2xl font-semibold md:text-[26px]">
              งานซ่อมใหม่
            </p>
          </div>
        </div>
        <form
          id="repair-form"
          className="xl:[&_label]:text-normal xl:[&_.text-surface]:text-normal flex flex-1 flex-col"
          onSubmit={handleSubmit(onSubmit, onInvalid)}
        >
          {/* ข้อมูลลูกค้า */}
          <div className="bg-surface mx-[20px] mt-[16px] overflow-hidden rounded-[10px]">
            <button
              type="button"
              onClick={() => setIsCustomerInfoOpen(!isCustomerInfoOpen)}
              aria-expanded={isCustomerInfoOpen}
              aria-controls="customer-info-panel"
              className="focus-visible:ring-primary/50 flex w-full cursor-pointer items-center justify-between px-[16px] py-[12px] outline-none focus-visible:ring-2 focus-visible:ring-inset"
            >
              <div className="flex items-center gap-[12px]">
                <div className="bg-primary/10 flex h-[40px] w-[40px] items-center justify-center rounded-full">
                  <ContactRound className="text-primary h-6 w-6" />
                </div>
                {/* ความสูงคงที่ ไม่งั้นหัวข้อจะขยับตอนพิมพ์ชื่อ — ไม่มีชื่อก็ให้หัวข้ออยู่กลางแทน */}
                <div className="flex min-h-[56px] flex-col justify-center text-left">
                  <p className="text-normal text-xl font-medium">
                    ข้อมูลลูกค้า
                  </p>
                  {watch("name") && (
                    <p className="text-subtle-dark line-clamp-1 text-lg md:text-xl">
                      {watch("name")}
                      {watch("phoneNumber") && ` • ${watch("phoneNumber")}`}
                    </p>
                  )}
                </div>
              </div>
              <ChevronDown
                className={`text-subtle-dark h-6 w-6 transition-transform duration-200 motion-reduce:transition-none ${isCustomerInfoOpen ? "rotate-180" : ""}`}
              />
            </button>

            {/* ข้อมูลลูกค้า ที่ซ่อน/แสดง */}
            <div
              inert={!isCustomerInfoOpen}
              // grid-rows 0fr→1fr ขยายไปหาความสูงจริง ไม่ต้องเดาเป็นตัวเลข
              // (max-h ตายตัวจะตัดเนื้อหาทิ้งเมื่อทุกช่องขึ้นข้อความ error พร้อมกัน)
              id="customer-info-panel"
              className={`grid transition-all duration-200 motion-reduce:transition-none ${
                isCustomerInfoOpen
                  ? "grid-rows-[1fr] opacity-100"
                  : "grid-rows-[0fr] opacity-0"
              }`}
            >
              <div className="overflow-hidden">
                <div className="space-y-[12px] px-[16px] pb-[16px]">
                  <FormInput
                    register={register}
                    name="name"
                    label="ชื่อลูกค้า"
                    type="text"
                    placeholder="เช่น สมชาย ใจดี"
                    color="subtle-dark"
                    errors={errors}
                    customClass="w-full"
                  />

                  <FormInput
                    register={register}
                    name="address"
                    label="ที่อยู่"
                    type="text"
                    placeholder="เช่น 543 หมู่ 5 ต.น้ำอ้อม อ.กันทรลักษ์ จ.ศรีสะเกษ 33110"
                    color="subtle-dark"
                    errors={errors}
                    customClass="w-full"
                  />

                  <FormInput
                    register={register}
                    name="phoneNumber"
                    label="เบอร์โทรศัพท์"
                    type="text"
                    placeholder="เช่น 0812345678"
                    color="subtle-dark"
                    maxLength={10}
                    errors={errors}
                    inputMode="numeric"
                    onInput={(e) => {
                      e.target.value = e.target.value
                        .replace(/[^0-9]/g, "")
                        .slice(0, 10);
                    }}
                    customClass="w-full"
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="xl:[&_label]:text-normal mt-[16px] px-[20px]">
            <ComboBox
              label="ยี่ห้อรถ"
              color="text-surface"
              options={brands}
              value={watch("brand")}
              onChange={(value) => {
                setValue("brand", value, {
                  shouldValidate: true,
                  shouldTouch: true,
                });
                setValue("model", "", {
                  shouldValidate: true,
                  shouldTouch: true,
                });
              }}
              placeholder="-- เลือกยี่ห้อรถ --"
              errors={errors}
              name="brand"
            />
            <input
              {...register("brand")}
              type="hidden"
              value={watch("brand") || ""}
            />
          </div>

          <div className="xl:[&_label]:text-normal mt-[16px] px-[20px]">
            <ComboBox
              label="รุ่นรถ"
              color="text-surface"
              options={getAvailableModelsForBrand()}
              value={watch("model")}
              onChange={(value) =>
                setValue("model", value, {
                  shouldValidate: true,
                  shouldTouch: true,
                })
              }
              placeholder="-- เลือกรุ่นรถ --"
              errors={errors}
              name="model"
              disabled={!watch("brand")}
            />
            <input
              {...register("model")}
              type="hidden"
              value={watch("model") || ""}
            />
          </div>

          {/* ป้ายทะเบียนรถ */}
          <div className="xl:[&_.text-surface]:text-normal px-[20px] pt-[16px]">
            <p className="text-surface mb-[8px] text-xl font-medium">
              ทะเบียนรถ
            </p>
            <div className="flex items-start gap-[8px]">
              <div className="w-[70px]">
                <LicensePlateInput
                  register={register}
                  name="plateLetters"
                  placeholder="กก"
                  maxLength={3}
                  error={errors.plateLetters}
                  inputMode="numeric"
                  onInput={(e) => {
                    e.target.value = e.target.value
                      .replace(/[^ก-ฮ0-9]/g, "")
                      .slice(0, 3);
                  }}
                />
              </div>
              <div className="w-[80px]">
                <LicensePlateInput
                  register={register}
                  name="plateNumbers"
                  placeholder="1234"
                  maxLength={4}
                  error={errors.plateNumbers}
                  onInput={(e) => {
                    e.target.value = e.target.value
                      .replace(/[^0-9]/g, "")
                      .slice(0, 4);
                  }}
                />
              </div>
              <div className="flex-1">
                <ComboBox
                  label=""
                  color="text-surface"
                  options={provinces}
                  value={
                    provinces.find((p) => p.name === watch("province"))?.id
                  }
                  onChange={(value) => {
                    const provinceName =
                      provinces.find((p) => p.id === value)?.name || value;
                    setValue("province", provinceName, {
                      shouldValidate: true,
                      shouldTouch: true,
                    });
                  }}
                  placeholder="-- เลือกจังหวัด --"
                  errors={errors}
                  name="province"
                />
              </div>
            </div>
          </div>
          <FormInput
            register={register}
            name="mileage"
            label="เลขกิโลเมตร"
            type="number"
            placeholder="เช่น 120000"
            color="surface"
            errors={errors}
          />
          <FormInput
            register={register}
            name="description"
            label="รายละเอียดการซ่อม"
            type="text"
            placeholder="เช่น ค้างตั้งศูนย์, รอสั่งอะไหล่"
            color="surface"
            errors={errors}
          />

          <div className="hidden pb-[24px] xl:block" />

          {/* Mobile: รายการซ่อม */}
          <div className="bg-surface shadow-primary mt-[16px] flex w-full flex-1 flex-col rounded-tl-2xl rounded-tr-2xl xl:hidden">
            <div
              data-repair-items-top
              className="flex items-center justify-between px-[20px] pt-[16px]"
            >
              <div className="flex items-center gap-[8px]">
                <div className="bg-primary/10 flex h-[40px] w-[40px] items-center justify-center rounded-full">
                  <ClipboardList className="text-primary h-6 w-6" />
                </div>
                <p className="text-[22px] font-semibold md:text-2xl">
                  รายการซ่อม
                </p>
              </div>
              <AddRepairItemDialog
                onAddItem={handleAddItemToRepair}
                selectedItems={repairItems}
                restoredStockMap={restoredStockMap}
              >
                <p className="text-primary cursor-pointer text-xl font-semibold md:text-[22px]">
                  + เพิ่มรายการซ่อม
                </p>
              </AddRepairItemDialog>
            </div>
            {repairItems.length === 0 ? (
              <div>
                <div className="flex h-[228px] items-center justify-center xl:h-auto">
                  <p className="text-subtle-light text-xl md:text-[22px]">
                    กรุณาเพิ่มรายการซ่อม
                  </p>
                </div>
                <div className="pb-[92px]" />
              </div>
            ) : (
              <div className="pb-[20px]">
                {repairItems.map((item, index) => (
                  <CollapsibleRow
                    key={index}
                    leaving={leavingIndex === index}
                    onLeaveEnd={handleLeaveEnd}
                  >
                    <div
                      data-repair-row={index}
                      className="mt-[16px] flex items-center gap-[16px] px-[20px]"
                    >
                      <div
                        role="button"
                        tabIndex={0}
                        onKeyDown={onKeyActivate(() =>
                          handlePriceClick(index, item),
                        )}
                        onClick={() => handlePriceClick(index, item)}
                        className="shadow-primary bg-surface flex h-[92px] min-w-0 flex-1 cursor-pointer items-center justify-between gap-[8px] rounded-[10px] px-[8px]"
                      >
                        <div className="flex min-w-0 flex-1 items-center gap-[8px]">
                          <div className="shadow-primary bg-surface flex h-[60px] w-[60px] items-center justify-center rounded-[10px] border border-gray-200">
                            {item.secureUrl ? (
                              <img
                                src={item.secureUrl}
                                alt={item.name}
                                className="h-full w-full rounded-[10px] object-cover"
                              />
                            ) : (
                              <div className="text-subtle-light flex h-[60px] w-[60px] items-center justify-center">
                                {item.category?.name === "บริการ" ? (
                                  <Wrench className="h-8 w-8" />
                                ) : (
                                  <Image className="h-8 w-8" />
                                )}
                              </div>
                            )}
                          </div>
                          <div className="flex min-w-0 flex-1 flex-col">
                            {renderProductInfo(item)}
                            <p className="text-subtle-light truncate text-base leading-tight font-medium md:text-lg">
                              {/* บริการไม่มีหน่วย จึงเหลือแค่ราคา */}
                              {formatCurrency(Number(item.sellingPrice))}
                              {item.unit ? `/${item.unit}` : ""}
                            </p>
                            <div className="flex w-full items-center justify-between">
                              <p className="text-primary text-xl leading-tight font-semibold text-nowrap md:text-[22px]">
                                {formatCurrency(
                                  item.quantity * item.sellingPrice,
                                )}
                              </p>
                              <div
                                className="flex shrink-0 items-center gap-[8px]"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (item.quantity <= 1) {
                                      setRemovingIndex(index);
                                      return;
                                    }
                                    handleDecreaseQuantity(index);
                                  }}
                                  aria-label={
                                    item.quantity <= 1
                                      ? "เอารายการออก"
                                      : "ลดจำนวน"
                                  }
                                  className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-[8px] border border-gray-200 bg-gray-100"
                                >
                                  <Minus className="h-4 w-4" />
                                </button>
                                <p className="text-primary text-lg font-semibold md:text-xl">
                                  {item.quantity}
                                </p>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleIncreaseQuantity(index);
                                  }}
                                  disabled={isAtStockLimit(item)}
                                  className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-[8px] border border-gray-200 bg-gray-100 disabled:bg-gray-50 disabled:text-gray-300"
                                >
                                  <Plus className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CollapsibleRow>
                ))}
                <div className="border-primary/20 from-primary/10 to-primary/5 mx-[20px] my-[16px] rounded-[10px] border bg-gradient-to-r p-[16px]">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <p className="text-subtle-dark text-xl font-semibold md:text-[22px]">
                        รวม {repairItems.length} รายการ
                      </p>
                    </div>
                    <div className="flex flex-col items-end">
                      <p className="text-primary text-2xl font-semibold md:text-[26px]">
                        {formatCurrency(
                          repairItems.reduce(
                            (total, item) =>
                              total + item.sellingPrice * item.quantity,
                            0,
                          ),
                        )}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex justify-center pb-[92px]">
                  <FormButton label="ถัดไป" isLoading={isLoading} />
                </div>
              </div>
            )}
          </div>
        </form>
      </div>

      {/* Desktop: รายการซ่อม */}
      <div className="hidden w-1/2 xl:block">
        <div className="bg-surface shadow-primary h-fit rounded-2xl">
          <div
            data-repair-items-top
            className="flex items-center justify-between px-[20px] pt-[16px]"
          >
            <div className="flex items-center gap-[8px]">
              <div className="bg-primary/10 flex h-[40px] w-[40px] items-center justify-center rounded-full">
                <ClipboardList className="text-primary h-6 w-6" />
              </div>
              <p className="text-[22px] font-semibold md:text-2xl">
                รายการซ่อม
              </p>
            </div>
            <AddRepairItemDialog
              onAddItem={handleAddItemToRepair}
              selectedItems={repairItems}
              restoredStockMap={restoredStockMap}
            >
              <p className="text-primary cursor-pointer text-xl font-semibold md:text-[22px]">
                + เพิ่มรายการซ่อม
              </p>
            </AddRepairItemDialog>
          </div>
          {repairItems.length === 0 ? (
            <div>
              <div className="flex h-[228px] items-center justify-center">
                <p className="text-subtle-light text-xl md:text-[22px]">
                  กรุณาเพิ่มรายการซ่อม
                </p>
              </div>
            </div>
          ) : (
            <div>
              {repairItems.map((item, index) => (
                <CollapsibleRow
                  key={index}
                  leaving={leavingIndex === index}
                  onLeaveEnd={handleLeaveEnd}
                >
                  <div
                    data-repair-row={index}
                    className="mt-[16px] flex items-center gap-[16px] px-[20px]"
                  >
                    <div
                      role="button"
                      tabIndex={0}
                      onKeyDown={onKeyActivate(() =>
                        handlePriceClick(index, item),
                      )}
                      onClick={() => handlePriceClick(index, item)}
                      className="shadow-primary bg-surface flex h-[92px] min-w-0 flex-1 cursor-pointer items-center justify-between gap-[8px] rounded-[10px] px-[8px]"
                    >
                      <div className="flex min-w-0 flex-1 items-center gap-[8px]">
                        <div className="shadow-primary bg-surface flex h-[60px] w-[60px] items-center justify-center rounded-[10px] border border-gray-200">
                          {item.secureUrl ? (
                            <img
                              src={item.secureUrl}
                              alt={item.name}
                              className="h-full w-full rounded-[10px] object-cover"
                            />
                          ) : (
                            <div className="text-subtle-light flex h-[60px] w-[60px] items-center justify-center">
                              {item.category?.name === "บริการ" ? (
                                <Wrench className="h-8 w-8" />
                              ) : (
                                <Image className="h-8 w-8" />
                              )}
                            </div>
                          )}
                        </div>
                        <div className="flex min-w-0 flex-1 flex-col">
                          {renderProductInfo(item)}
                          <p className="text-subtle-light truncate text-base leading-tight font-medium md:text-lg">
                            {/* บริการไม่มีหน่วย จึงเหลือแค่ราคา */}
                            {formatCurrency(Number(item.sellingPrice))}
                            {item.unit ? `/${item.unit}` : ""}
                          </p>
                          <div className="flex w-full items-center justify-between">
                            <p className="text-primary text-xl leading-tight font-semibold text-nowrap md:text-[22px]">
                              {formatCurrency(
                                item.quantity * item.sellingPrice,
                              )}
                            </p>
                            <div
                              className="flex shrink-0 items-center gap-[8px]"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (item.quantity <= 1) {
                                    setRemovingIndex(index);
                                    return;
                                  }
                                  handleDecreaseQuantity(index);
                                }}
                                aria-label={
                                  item.quantity <= 1
                                    ? "เอารายการออก"
                                    : "ลดจำนวน"
                                }
                                className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-[8px] border border-gray-200 bg-gray-100"
                              >
                                <Minus className="h-4 w-4" />
                              </button>
                              <p className="text-primary text-lg font-semibold md:text-xl">
                                {item.quantity}
                              </p>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleIncreaseQuantity(index);
                                }}
                                disabled={isAtStockLimit(item)}
                                className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-[8px] border border-gray-200 bg-gray-100 disabled:bg-gray-50 disabled:text-gray-300"
                              >
                                <Plus className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CollapsibleRow>
              ))}

              {/* Desktop: สรุปยอดรวม */}
              <div className="border-primary/20 from-primary/10 to-primary/5 mx-[20px] my-[16px] rounded-[10px] border bg-gradient-to-r p-[16px]">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <p className="text-subtle-dark text-xl font-semibold md:text-[22px]">
                      รวม {repairItems.length} รายการ
                    </p>
                  </div>
                  <div className="flex flex-col items-end">
                    <p className="text-primary text-2xl font-semibold md:text-[26px]">
                      {formatCurrency(
                        repairItems.reduce(
                          (total, item) =>
                            total + item.sellingPrice * item.quantity,
                          0,
                        ),
                      )}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex justify-center pb-[16px]">
                <FormButton
                  label="ถัดไป"
                  isLoading={isLoading}
                  form="repair-form"
                />
              </div>
            </div>
          )}
        </div>
      </div>
      <EditPriceDialog
        isOpen={priceDialogOpen}
        onClose={() => setPriceDialogOpen(false)}
        onConfirm={handlePriceConfirm}
        currentPrice={editingItem?.sellingPrice || 0}
        originalPrice={editingItem?.basePrice}
        productName={editingItem ? getProductName(editingItem) : ""}
        partNumber={editingItem?.partNumber}
        productImage={editingItem?.secureUrl}
        isService={editingItem?.category?.name === "บริการ"}
        currentName={editingItem?.name || ""}
        canEditName={
          editingItem?.category?.name === "บริการ" &&
          (editingItem?.id === 1 || editingItem?.service?.id === 1)
        }
      />

      <ConfirmDialog
        isOpen={removingIndex !== null}
        onClose={() => setRemovingIndex(null)}
        onConfirm={handleRemoveItem}
        title="ยืนยันการเอารายการออก"
        itemName={
          removingIndex !== null && repairItems[removingIndex]
            ? getProductName(repairItems[removingIndex])
            : ""
        }
      />
    </div>
  );
};

export default RepairCreate;
