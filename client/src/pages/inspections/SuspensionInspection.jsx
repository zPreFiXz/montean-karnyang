import FormInput from "@/components/forms/FormInput";
import ComboBox from "@/components/ui/ComboBox";
import AddRepairItemDialog from "@/components/dialogs/AddRepairItemDialog";
import EditPriceDialog from "@/components/dialogs/EditNamePriceDialog";
import { useForm } from "react-hook-form";
import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router";
import { PROVINCES } from "@/constants/provinces";
import { getVehicleBrandModels } from "@/api/vehicleBrandModel";
import { getParts } from "@/api/part";
import LicensePlateInput from "@/components/forms/LicensePlateInput";
import { formatCurrency } from "@/utils/formats";
import {
  Image,
  Trash,
  Plus,
  Minus,
  Check,
  Wrench,
  SquarePen,
  ChevronDown,
  AlertTriangle,
  User,
  ClipboardList,
} from "lucide-react";
import FormButton from "@/components/forms/FormButton";
import { zodResolver } from "@hookform/resolvers/zod";
import { repairSchema } from "@/utils/schemas";
import { CarRepair } from "@/components/icons/Icons";

const SuspensionInspection = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    setFocus,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(repairSchema),
  });
  const [vehicleBrandModels, setVehicleBrandModels] = useState([]);
  const [brands, setBrands] = useState([]);
  const [repairItems, setRepairItems] = useState([]);
  const [compatibleParts, setCompatibleParts] = useState([]);
  const [isPartsLoaded, setIsPartsLoaded] = useState(false);
  const [selectedLeftParts, setSelectedLeftParts] = useState(new Set());
  const [selectedRightParts, setSelectedRightParts] = useState(new Set());
  const [selectedOtherParts, setSelectedOtherParts] = useState(new Set());
  const [activeTab, setActiveTab] = useState("left");
  const [isLoading, setIsLoading] = useState(false);
  const [restoredStockMap, setRestoredStockMap] = useState({});
  const [priceDialogOpen, setPriceDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [priceOverrides, setPriceOverrides] = useState({});
  const restoredRef = useRef(false);
  const [isMoreFieldsVisible, setIsMoreFieldsVisible] = useState(false);
  const [isCustomerInfoOpen, setIsCustomerInfoOpen] = useState(false);
  const initialSelectedRef = useRef({
    left: new Set(),
    right: new Set(),
    other: new Set(),
  });

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchVehicleBrandModels();
  }, []);

  useEffect(() => {
    if (!isPartsLoaded) return;
    if (compatibleParts.length === 0) return;

    setRepairItems((prev) => {
      if (restoredRef.current) {
        restoredRef.current = false;
        return prev;
      }

      const exists = prev.some(
        (i) => i?.category?.name === "บริการ" && i?.id === 1,
      );
      if (exists) return prev;
      return [
        ...prev,
        {
          id: 1,
          name: "ค่าแรง",
          quantity: 1,
          sellingPrice: 0,
          category: { name: "บริการ" },
          side: null,
        },
      ];
    });
  }, [compatibleParts, isPartsLoaded]);

  useEffect(() => {
    const brand = watch("brand");
    const model = watch("model");

    setIsPartsLoaded(false);

    if (brand && model) {
      fetchCompatibleParts(brand, model);
    } else {
      setCompatibleParts([]);
      setIsPartsLoaded(false);
    }
  }, [watch("brand"), watch("model")]);

  useEffect(() => {
    if (!isPartsLoaded) return;

    if (compatibleParts.length === 0) {
      setRepairItems((prev) =>
        prev.filter(
          (item) =>
            !(
              item?.category?.name === "บริการ" &&
              (item?.id === 1 || item?.name === "ค่าแรง")
            ),
        ),
      );
    }
  }, [compatibleParts, isPartsLoaded]);

  useEffect(() => {
    if (!location.state) return;

    const {
      repairData,
      repairItems: savedItems,
      editRepairId,
      hideMoreFields,
    } = location.state;

    if (repairData) {
      Object.keys(repairData).forEach((key) => {
        setValue(key, repairData[key]);
      });
    }

    if (savedItems && Array.isArray(savedItems)) {
      const manualItems = savedItems.filter((i) => !i.side);
      const leftIds = savedItems
        .filter((i) => i.side === "left")
        .map((i) => i.id);
      const rightIds = savedItems
        .filter((i) => i.side === "right")
        .map((i) => i.id);
      const otherIds = savedItems
        .filter((i) => i.side === "other")
        .map((i) => i.id);

      setRepairItems(manualItems);
      const leftSet = new Set(leftIds);
      const rightSet = new Set(rightIds);
      const otherSet = new Set(otherIds);
      setSelectedLeftParts(leftSet);
      setSelectedRightParts(rightSet);
      setSelectedOtherParts(otherSet);
      initialSelectedRef.current = {
        left: leftSet,
        right: rightSet,
        other: otherSet,
      };

      const map = {};
      for (const it of savedItems) {
        if (
          it?.partNumber &&
          it?.brand &&
          typeof it.stockQuantity === "number"
        ) {
          const key = `${it.partNumber}|${it.brand}|${it.name || ""}`;
          map[key] = Math.max(map[key] || 0, it.stockQuantity);
        }
      }
      setRestoredStockMap(map);
      restoredRef.current = true;
    }

    if (hideMoreFields) {
      setIsMoreFieldsVisible(false);
    } else {
      try {
        const hiddenInputs = Array.from(
          document.querySelectorAll('form input[type="hidden"]'),
        );
        const hasHiddenValue = hiddenInputs.some(
          (el) => el && el.value != null && String(el.value).trim() !== "",
        );
        if (hasHiddenValue) setIsMoreFieldsVisible(true);
      } catch {}
    }

    const preserved = {
      ...(editRepairId ? { editRepairId } : {}),
      ...(location.state?.from ? { from: location.state.from } : {}),
      ...(location.state?.origin ? { origin: location.state.origin } : {}),
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
  }, [location.state, setValue]);

  const fetchVehicleBrandModels = async () => {
    try {
      const res = await getVehicleBrandModels();
      setVehicleBrandModels(res.data);

      const uniqueBrands = [...new Set(res.data.map((item) => item.brand))];
      setBrands(uniqueBrands.map((brand) => ({ id: brand, name: brand })));
    } catch (error) {
      console.error(error);
    }
  };

  const fetchCompatibleParts = async (brand, model) => {
    try {
      const res = await getParts();
      const allParts = res.data;

      const compatible = allParts.filter((part) => {
        if (!part.compatibleVehicles) return false;

        return part.compatibleVehicles.some(
          (vehicle) => vehicle.brand === brand && vehicle.model === model,
        );
      });

      setCompatibleParts(compatible);
      setIsPartsLoaded(true);
    } catch (error) {
      console.error(error);
      setCompatibleParts([]);
      setIsPartsLoaded(true);
    }
  };

  const getPartsForSide = (side) => {
    return compatibleParts.filter((part) => {
      if (!part.typeSpecificData || !part.typeSpecificData.suspensionType) {
        return true;
      }

      const suspensionType = part.typeSpecificData.suspensionType;

      if (suspensionType === "left-right") {
        return side === "left" || side === "right";
      }

      if (suspensionType === "other") {
        return side === "other";
      }

      return true;
    });
  };

  const getAvailableModelsForBrand = () => {
    const selectedBrand = watch("brand");
    const modelsForBrand = vehicleBrandModels
      .filter((item) => item.brand === selectedBrand)
      .map((item) => ({ id: item.model, name: item.model }));

    return modelsForBrand;
  };

  const renderProductInfo = (item) => {
    const isTire = item.category?.name === "ยาง";
    const isService = item.category?.name === "บริการ";

    if (isService) {
      return (
        <p className="text-normal line-clamp-1 w-full text-[16px] leading-tight font-semibold md:text-[18px]">
          {item.name}
        </p>
      );
    }

    if (isTire && item.typeSpecificData && item.typeSpecificData.aspectRatio) {
      return (
        <p className="text-normal line-clamp-1 w-full text-[16px] leading-tight font-semibold md:text-[18px]">
          {item.brand} {item.typeSpecificData.width}/
          {item.typeSpecificData.aspectRatio}R
          {item.typeSpecificData.rimDiameter} {item.name}
        </p>
      );
    }

    if (isTire && item.typeSpecificData) {
      return (
        <p className="text-normal line-clamp-1 w-full text-[16px] leading-tight font-semibold md:text-[18px]">
          {item.brand} {item.typeSpecificData.width}R
          {item.typeSpecificData.rimDiameter} {item.name}
        </p>
      );
    }

    return (
      <p className="text-normal line-clamp-1 w-full text-[16px] leading-tight font-semibold md:text-[18px]">
        {item.brand} {item.name}
      </p>
    );
  };

  const handleAddItemToRepair = (item) => {
    setRepairItems((prev) => {
      const itemWithSide = {
        ...item,
        side: null,
      };

      const index = prev.findIndex(
        (i) =>
          i.partNumber === itemWithSide.partNumber &&
          i.brand === itemWithSide.brand &&
          i.name === itemWithSide.name,
      );
      if (index !== -1) {
        return prev.map((i, idx) =>
          idx === index
            ? {
                ...i,
                quantity: i.quantity + 1,
              }
            : i,
        );
      } else {
        return [
          ...prev,
          {
            ...itemWithSide,
            quantity: 1,
            sellingPrice: itemWithSide.sellingPrice,
            stockQuantity: itemWithSide.stockQuantity,
          },
        ];
      }
    });

    setTimeout(() => {
      window.scrollTo({
        top: document.body.scrollHeight,
        behavior: "smooth",
      });
    }, 200);
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

  const handlePriceClick = (index, item) => {
    try {
      const ae = document.activeElement;
      if (ae && ae instanceof HTMLElement) ae.blur();
    } catch {}

    setEditingItem({ source: "manual", index, ...item });
    setPriceDialogOpen(true);
  };

  const handlePriceConfirm = (payload) => {
    const newPrice = typeof payload === "number" ? payload : payload?.price;
    const newName = typeof payload === "object" ? payload?.name : undefined;

    if (!editingItem || newPrice == null) return;

    if (editingItem.source === "manual") {
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
    } else if (editingItem.source === "compatible" && editingItem.partId) {
      setPriceOverrides((prev) => ({
        ...prev,
        [editingItem.partId]: newPrice,
      }));
    }
  };

  const getProductName = (item) => {
    if (!item) return "";
    const isTire = item.category?.name === "ยาง";
    if (isTire && item.typeSpecificData && item.typeSpecificData.aspectRatio) {
      return `${item.brand} ${item.typeSpecificData.width}/${item.typeSpecificData.aspectRatio}R${item.typeSpecificData.rimDiameter} ${item.name}`;
    }
    if (isTire && item.typeSpecificData) {
      return `${item.brand} ${item.typeSpecificData.width}R${item.typeSpecificData.rimDiameter} ${item.name}`;
    }
    return `${item.brand} ${item.name}`;
  };

  const getPriceForPart = (part) => {
    if (!part) return 0;
    const override = priceOverrides?.[part.id];
    return Number(override != null ? override : part.sellingPrice) || 0;
  };

  const handleEditCompatiblePrice = (part) => {
    try {
      const ae = document.activeElement;
      if (ae && ae instanceof HTMLElement) ae.blur();
    } catch {}

    setEditingItem({
      source: "compatible",
      partId: part.id,
      sellingPrice: getPriceForPart(part),
      name: part.name,
      brand: part.brand,
      secureUrl: part.secureUrl,
      category: part.category,
      typeSpecificData: part.typeSpecificData,
    });
    setPriceDialogOpen(true);
  };

  const getRepairItemsCountExcludingLabor = () => {
    return repairItems.length;
  };

  const getAllowedUnitsForPart = (part) => {
    const stockQty =
      typeof part?.stockQuantity === "number"
        ? Math.max(part.stockQuantity, 0)
        : Infinity;
    const isSuspensionPart = Boolean(part?.typeSpecificData?.suspensionType);
    const initialCount = isSuspensionPart
      ? Number(initialSelectedRef.current.left.has(part.id)) +
        Number(initialSelectedRef.current.right.has(part.id)) +
        Number(initialSelectedRef.current.other.has(part.id))
      : 0;
    if (stockQty === Infinity) return Infinity;
    return Math.max(stockQty, initialCount);
  };

  const getCurrentSelectedCountForPart = (part) => {
    return (
      Number(selectedLeftParts.has(part.id)) +
      Number(selectedRightParts.has(part.id)) +
      Number(selectedOtherParts.has(part.id))
    );
  };

  const handlePartSelection = (part, isSelected, side) => {
    const suspensionType = part?.typeSpecificData?.suspensionType;
    const _stockQty =
      typeof part?.stockQuantity === "number" ? part.stockQuantity : Infinity;
    const isLeftRight = suspensionType === "left-right";
    const allowedUnits = getAllowedUnitsForPart(part);

    if (side === "left") {
      setSelectedLeftParts((prev) => {
        const next = new Set(prev);
        if (isSelected) next.add(part.id);
        else next.delete(part.id);
        return next;
      });
      if (isSelected && isLeftRight && allowedUnits === 1) {
        setSelectedRightParts((prev) => {
          const next = new Set(prev);
          next.delete(part.id);
          return next;
        });
      }
    } else if (side === "right") {
      setSelectedRightParts((prev) => {
        const next = new Set(prev);
        if (isSelected) next.add(part.id);
        else next.delete(part.id);
        return next;
      });
      if (isSelected && isLeftRight && allowedUnits === 1) {
        setSelectedLeftParts((prev) => {
          const next = new Set(prev);
          next.delete(part.id);
          return next;
        });
      }
    } else if (side === "other") {
      setSelectedOtherParts((prev) => {
        const next = new Set(prev);
        if (isSelected) next.add(part.id);
        else next.delete(part.id);
        return next;
      });
    }
  };

  const isPartSelected = (partId, side) => {
    if (side === "left") return selectedLeftParts.has(partId);
    else if (side === "right") return selectedRightParts.has(partId);
    else if (side === "other") return selectedOtherParts.has(partId);
    return false;
  };

  const onInvalid = (errs) => {
    const firstErrorField = Object.keys(errs || {})[0];
    if (!firstErrorField) return;

    try {
      setFocus(firstErrorField, { shouldSelect: true });
    } catch {}

    setTimeout(() => {
      let el = document.querySelector(`[name="${firstErrorField}"]`);
      let target = el;
      if (!el || el.type === "hidden" || el.offsetParent === null) {
        target = el?.parentElement || null;
      }
      if (target && typeof target.scrollIntoView === "function") {
        target.scrollIntoView({
          block: "nearest",
          inline: "nearest",
        });
      }
    }, 200);
  };

  const onSubmit = async (data) => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const allRepairItems = [
      ...Array.from(selectedLeftParts)
        .map((id) => getPartsForSide("left").find((p) => p.id === id))
        .filter(Boolean)
        .map((part) => ({
          ...part,
          sellingPrice: getPriceForPart(part),
          quantity: 1,
          side: "left",
        })),
      ...Array.from(selectedRightParts)
        .map((id) => getPartsForSide("right").find((p) => p.id === id))
        .filter(Boolean)
        .map((part) => ({
          ...part,
          sellingPrice: getPriceForPart(part),
          quantity: 1,
          side: "right",
        })),
      ...Array.from(selectedOtherParts)
        .map((id) => getPartsForSide("other").find((p) => p.id === id))
        .filter(Boolean)
        .map((part) => ({
          ...part,
          sellingPrice: getPriceForPart(part),
          quantity: 1,
          side: "other",
        })),
      ...repairItems,
    ];

    navigate("/repairs/summary", {
      state: {
        repairData: { ...data, source: "SUSPENSION" },
        repairItems: allRepairItems,
        from: "suspension",
        editRepairId: location.state?.editRepairId,
        origin: location.state?.from,
        statusSlug: location.state?.statusSlug,
        vehicleId: location.state?.vehicleId,
      },
    });

    setIsLoading(false);
  };

  return (
    <div>
      <div className="bg-gradient-primary shadow-primary flex min-h-[100svh] flex-col xl:min-h-[calc(100vh-73px)] xl:flex-row xl:items-start xl:gap-[16px] xl:bg-transparent xl:px-[16px] xl:pt-[24px] xl:pb-[24px] xl:shadow-none">
        <div className="xl:shadow-primary flex flex-1 flex-col xl:h-fit xl:w-1/2 xl:flex-initial xl:rounded-2xl xl:bg-white">
          <div className="flex items-center gap-[8px] px-[20px] pt-[16px]">
            <div className="bg-surface/20 xl:bg-primary/10 flex h-[40px] w-[40px] items-center justify-center rounded-full">
              <CarRepair color="#ffffff" className="h-6 w-6 xl:hidden" />
              <CarRepair color="#1976d2" className="hidden h-6 w-6 xl:block" />
            </div>
            <div>
              <p className="text-surface xl:text-primary text-[24px] font-semibold md:text-[26px]">
                เช็กช่วงล่าง
              </p>
            </div>
          </div>
          <form
            id="suspension-form"
            className="xl:[&_label]:text-normal xl:[&_.text-surface]:text-normal flex flex-1 flex-col"
            onSubmit={handleSubmit(onSubmit, onInvalid)}
          >
            <div className="mx-[20px] mt-[16px]">
              <button
                type="button"
                onClick={() => setIsCustomerInfoOpen(!isCustomerInfoOpen)}
                className="bg-surface/10 flex w-full cursor-pointer items-center justify-between rounded-[12px] px-[16px] py-[12px] transition-colors xl:bg-gray-50 xl:hover:bg-gray-100"
              >
                <div className="flex items-center gap-[12px]">
                  <div className="bg-surface/20 xl:bg-primary/10 flex h-[36px] w-[36px] items-center justify-center rounded-full">
                    <User className="text-surface xl:text-primary h-[18px] w-[18px]" />
                  </div>
                  <div className="text-left">
                    <p className="text-surface xl:text-normal text-[18px] font-medium md:text-[20px]">
                      ข้อมูลลูกค้า
                    </p>
                    {watch("fullName") && (
                      <p className="text-surface/80 xl:text-subtle-dark line-clamp-1 text-[14px] md:text-[16px]">
                        {watch("fullName")}
                        {watch("phoneNumber") && ` • ${watch("phoneNumber")}`}
                      </p>
                    )}
                  </div>
                </div>
                <ChevronDown
                  className={`text-surface xl:text-subtle-dark h-6 w-6 transition-transform duration-200 ${isCustomerInfoOpen ? "rotate-180" : ""}`}
                />
              </button>
              <div
                className={`overflow-hidden transition-all duration-200 ${isCustomerInfoOpen ? "mt-[12px] max-h-[500px] opacity-100" : "max-h-0 opacity-0"}`}
              >
                <div className="space-y-[4px]">
                  <FormInput
                    register={register}
                    name="fullName"
                    label="ชื่อลูกค้า"
                    type="text"
                    placeholder="เช่น สมชาย ใจดี"
                    color="surface"
                    errors={errors}
                    customClass="mt-[12px]"
                  />

                  <FormInput
                    register={register}
                    name="address"
                    label="ที่อยู่"
                    type="text"
                    placeholder="เช่น 543 หมู่ 5 ต.น้ำอ้อม อ.กันทรลักษ์ จ.ศรีสะเกษ 33110"
                    color="surface"
                    errors={errors}
                    customClass="mt-[12px]"
                  />

                  <FormInput
                    register={register}
                    name="phoneNumber"
                    label="หมายเลขโทรศัพท์"
                    type="text"
                    placeholder="เช่น 0812345678"
                    color="surface"
                    maxLength={10}
                    errors={errors}
                    inputMode="numeric"
                    onInput={(e) => {
                      e.target.value = e.target.value
                        .replace(/[^0-9]/g, "")
                        .slice(0, 10);
                    }}
                    customClass="mt-[12px]"
                  />
                </div>
              </div>
            </div>
            <div className="mt-[16px] px-[20px]">
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
            <div className="mt-[16px] px-[20px]">
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
            <div className="px-[20px] pt-[16px]">
              <p className="text-surface mb-[8px] text-[22px] font-medium md:text-[24px]">
                ทะเบียนรถ
              </p>
              <div className="flex items-start gap-[4px]">
                <div className="w-[70px]">
                  <LicensePlateInput
                    register={register}
                    name="plateLetters"
                    placeholder="กก"
                    maxLength={3}
                    error={errors.plateLetters}
                    onInput={(e) => {
                      e.target.value = e.target.value
                        .replace(/[^ก-ฮ0-9]/g, "")
                        .slice(0, 3);
                    }}
                  />
                </div>
                <p className="text-surface pt-[8px] text-[18px] font-medium">
                  -
                </p>
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
                    options={PROVINCES}
                    value={watch("province")}
                    onChange={(value) =>
                      setValue("province", value, {
                        shouldValidate: true,
                        shouldTouch: true,
                      })
                    }
                    placeholder="-- เลือกจังหวัด --"
                    errors={errors}
                    name="province"
                  />
                </div>
              </div>
            </div>

            <FormInput
              register={register}
              name="description"
              label="รายละเอียดการซ่อม"
              type="text"
              placeholder="เช่น เบรคติด, สตาร์ทไม่ติด, มีเสียงดังจากล้อหน้า"
              color="surface"
              errors={errors}
            />

            <div className="hidden pb-[24px] xl:block" />

            <div className="bg-surface shadow-primary mt-[16px] flex w-full flex-1 flex-col rounded-tl-2xl rounded-tr-2xl xl:hidden">
              <div className="flex items-center gap-[8px] px-[20px] pt-[16px]">
                <div className="bg-primary/10 flex h-[40px] w-[40px] items-center justify-center rounded-full">
                  <ClipboardList className="text-primary h-6 w-6" />
                </div>
                <p className="text-[22px] font-semibold md:text-[24px]">
                  รายการซ่อมช่วงล่าง
                </p>
              </div>
              <div className="mx-[20px] mt-[16px] flex justify-center">
                <div className="relative flex w-[308px] rounded-[10px] bg-gray-100 p-[4px]">
                  <button
                    type="button"
                    onClick={() => setActiveTab("left")}
                    className={`relative z-10 flex h-[40px] w-[100px] cursor-pointer items-center justify-center rounded-[10px] text-[18px] font-semibold duration-300 ease-out md:text-[20px] ${
                      activeTab === "left"
                        ? "scale-105 transform text-white"
                        : "text-subtle-dark"
                    }`}
                  >
                    <p className="relative z-10">ซ้าย</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("right")}
                    className={`relative z-10 flex h-[40px] w-[100px] cursor-pointer items-center justify-center rounded-[10px] text-[18px] font-semibold duration-300 ease-out md:text-[20px] ${
                      activeTab === "right"
                        ? "scale-105 transform text-white"
                        : "text-subtle-dark"
                    }`}
                  >
                    <p className="relative z-10">ขวา</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("other")}
                    className={`relative z-10 flex h-[40px] w-[100px] cursor-pointer items-center justify-center rounded-[10px] text-[18px] font-semibold duration-300 ease-out md:text-[20px] ${
                      activeTab === "other"
                        ? "scale-105 transform text-white"
                        : "text-subtle-dark"
                    }`}
                  >
                    <p className="relative z-10">อื่นๆ</p>
                  </button>
                  <div
                    className={`bg-gradient-primary absolute flex h-[40px] justify-center rounded-[10px] shadow-lg duration-300 ease-out ${
                      activeTab === "left"
                        ? "left-[4px] w-[100px]"
                        : activeTab === "right"
                          ? "left-[104px] w-[100px]"
                          : "left-[204px] w-[100px]"
                    }`}
                  />
                </div>
              </div>
              {compatibleParts.length > 0 && (
                <div>
                  {activeTab === "left" && (
                    <div
                      key="panel-left"
                      className="animate-in fade-in zoom-in-95 w-full duration-200"
                    >
                      {getPartsForSide("left").length === 0 ? (
                        <div className="flex h-[120px] items-center justify-center">
                          <p className="text-subtle-light text-[18px] md:text-[20px]">
                            ไม่มีอะไหล่ที่รองรับ
                          </p>
                        </div>
                      ) : (
                        getPartsForSide("left").map((part) => {
                          const selectedThis = isPartSelected(part.id, "left");
                          const allowedUnits = getAllowedUnitsForPart(part);
                          const currentSelectedAll =
                            getCurrentSelectedCountForPart(part);
                          const isDisabled =
                            !selectedThis && currentSelectedAll >= allowedUnits;
                          return (
                            <div
                              key={`left-${part.id}`}
                              className={`mt-[16px] flex items-center gap-[16px] px-[20px] ${
                                isDisabled
                                  ? "cursor-not-allowed opacity-50"
                                  : ""
                              }`}
                            >
                              <div
                                className={`shadow-primary flex h-[92px] w-full cursor-pointer items-center justify-between rounded-[10px] border-2 px-[8px] duration-300 ${
                                  isPartSelected(part.id, "left")
                                    ? "bg-primary/5 border-primary scale-[1.02]"
                                    : "bg-surface border-transparent"
                                }`}
                                onClick={() => {
                                  if (isDisabled) return;
                                  handlePartSelection(
                                    part,
                                    !isPartSelected(part.id, "left"),
                                    "left",
                                  );
                                }}
                              >
                                <div className="flex flex-1 items-center gap-[8px]">
                                  <div className="border-subtle-light shadow-primary bg-surface flex h-[70px] w-[70px] items-center justify-center rounded-[10px] border">
                                    {part.secureUrl ? (
                                      <img
                                        src={part.secureUrl}
                                        alt={part.name}
                                        className="h-full w-full rounded-[10px] object-cover"
                                      />
                                    ) : (
                                      <div className="text-subtle-light flex h-[70px] w-[70px] items-center justify-center">
                                        <Image className="h-8 w-8" />
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex flex-1 flex-col">
                                    {renderProductInfo(part)}
                                    <div className="flex items-center gap-2">
                                      <p
                                        className={`text-[20px] leading-tight font-semibold duration-300 md:text-[22px] ${
                                          isPartSelected(part.id, "left")
                                            ? "text-primary"
                                            : "text-subtle-dark"
                                        }`}
                                      >
                                        {formatCurrency(getPriceForPart(part))}
                                      </p>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleEditCompatiblePrice(part);
                                        }}
                                        className="text-primary mt-[2px] flex items-center justify-center"
                                      >
                                        <SquarePen className="h-5 w-5" />
                                      </button>
                                    </div>
                                    {isDisabled && (
                                      <p className="text-destructive flex items-center gap-[4px] text-[16px] leading-tight font-semibold md:text-[18px]">
                                        <AlertTriangle className="text-destructive h-5 w-5" />
                                        <p>สต็อกหมด</p>
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div
                                className={`flex h-[32px] w-[32px] min-w-[32px] cursor-pointer items-center justify-center rounded-full duration-300 ${
                                  isPartSelected(part.id, "left")
                                    ? "bg-gradient-primary text-surface scale-110 shadow-lg"
                                    : "bg-subtle-light text-surface"
                                }`}
                                onClick={() => {
                                  if (isDisabled) return;
                                  handlePartSelection(
                                    part,
                                    !isPartSelected(part.id, "left"),
                                    "left",
                                  );
                                }}
                              >
                                <Check className="h-[18px] w-[18px]" />
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                  {activeTab === "right" && (
                    <div
                      key="panel-right"
                      className="animate-in fade-in zoom-in-95 w-full duration-200"
                    >
                      {getPartsForSide("right").length === 0 ? (
                        <div className="flex h-[120px] items-center justify-center">
                          <p className="text-subtle-light text-[18px] md:text-[20px]">
                            ไม่มีอะไหล่ที่รองรับ
                          </p>
                        </div>
                      ) : (
                        getPartsForSide("right").map((part) => {
                          const selectedThis = isPartSelected(part.id, "right");
                          const allowedUnits = getAllowedUnitsForPart(part);
                          const currentSelectedAll =
                            getCurrentSelectedCountForPart(part);
                          const isDisabled =
                            !selectedThis && currentSelectedAll >= allowedUnits;
                          return (
                            <div
                              key={`right-${part.id}`}
                              className={`mt-[16px] flex items-center gap-[16px] px-[20px] ${
                                isDisabled
                                  ? "cursor-not-allowed opacity-50"
                                  : ""
                              }`}
                            >
                              <div
                                className={`shadow-primary flex h-[92px] w-full cursor-pointer items-center justify-between rounded-[10px] border-2 px-[8px] duration-300 ${
                                  isPartSelected(part.id, "right")
                                    ? "bg-primary/5 border-primary scale-[1.02]"
                                    : "bg-surface border-transparent"
                                }`}
                                onClick={() => {
                                  if (isDisabled) return;
                                  handlePartSelection(
                                    part,
                                    !isPartSelected(part.id, "right"),
                                    "right",
                                  );
                                }}
                              >
                                <div className="flex flex-1 items-center gap-[8px]">
                                  <div className="border-subtle-light shadow-primary bg-surface flex h-[70px] w-[70px] items-center justify-center rounded-[10px] border">
                                    {part.secureUrl ? (
                                      <img
                                        src={part.secureUrl}
                                        alt={part.name}
                                        className="h-full w-full rounded-[10px] object-cover"
                                      />
                                    ) : (
                                      <div className="text-subtle-light flex h-[70px] w-[70px] items-center justify-center">
                                        <Image className="h-8 w-8" />
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex flex-1 flex-col">
                                    {renderProductInfo(part)}
                                    <div className="flex items-center gap-2">
                                      <p
                                        className={`text-[20px] leading-tight font-semibold duration-300 md:text-[22px] ${
                                          isPartSelected(part.id, "right")
                                            ? "text-primary"
                                            : "text-subtle-dark"
                                        }`}
                                      >
                                        {formatCurrency(getPriceForPart(part))}
                                      </p>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleEditCompatiblePrice(part);
                                        }}
                                        className="text-primary flex items-center justify-center"
                                      >
                                        <SquarePen className="h-5 w-5" />
                                      </button>
                                    </div>
                                    {isDisabled && (
                                      <p className="text-destructive flex items-center gap-[4px] text-[16px] leading-tight font-semibold md:text-[18px]">
                                        <AlertTriangle className="text-destructive h-5 w-5" />
                                        <p>สต็อกหมด</p>
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div
                                className={`flex h-[32px] w-[32px] min-w-[32px] cursor-pointer items-center justify-center rounded-full duration-300 ${
                                  isPartSelected(part.id, "right")
                                    ? "bg-gradient-primary text-surface scale-110 shadow-lg"
                                    : "bg-subtle-light text-surface"
                                }`}
                                onClick={() => {
                                  if (isDisabled) return;
                                  handlePartSelection(
                                    part,
                                    !isPartSelected(part.id, "right"),
                                    "right",
                                  );
                                }}
                              >
                                <Check className="h-[18px] w-[18px]" />
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                  {activeTab === "other" && (
                    <div
                      key="panel-other"
                      className="animate-in fade-in zoom-in-95 w-full duration-200"
                    >
                      {getPartsForSide("other").length === 0 ? (
                        <div className="flex h-[120px] items-center justify-center">
                          <p className="text-subtle-light text-[20px] md:text-[22px]">
                            ไม่มีอะไหล่ที่รองรับ
                          </p>
                        </div>
                      ) : (
                        getPartsForSide("other").map((part) => {
                          const selectedThis = isPartSelected(part.id, "other");
                          const allowedUnits = getAllowedUnitsForPart(part);
                          const currentSelectedAll =
                            getCurrentSelectedCountForPart(part);
                          const isDisabled =
                            !selectedThis && currentSelectedAll >= allowedUnits;
                          return (
                            <div
                              key={`other-${part.id}`}
                              className={`mt-[16px] flex items-center gap-[16px] px-[20px] ${
                                isDisabled
                                  ? "cursor-not-allowed opacity-50"
                                  : ""
                              }`}
                            >
                              <div
                                className={`shadow-primary flex h-[92px] w-full cursor-pointer items-center justify-between rounded-[10px] border-2 px-[8px] duration-300 ${
                                  isPartSelected(part.id, "other")
                                    ? "bg-primary/5 border-primary scale-[1.02]"
                                    : "bg-surface border-transparent"
                                }`}
                                onClick={() => {
                                  if (isDisabled) return;
                                  handlePartSelection(
                                    part,
                                    !isPartSelected(part.id, "other"),
                                    "other",
                                  );
                                }}
                              >
                                <div className="flex flex-1 items-center gap-[8px]">
                                  <div className="border-subtle-light shadow-primary bg-surface flex h-[70px] w-[70px] items-center justify-center rounded-[10px] border">
                                    {part.secureUrl ? (
                                      <img
                                        src={part.secureUrl}
                                        alt={part.name}
                                        className="h-full w-full rounded-[10px] object-cover"
                                      />
                                    ) : (
                                      <div className="text-subtle-light flex h-[70px] w-[70px] items-center justify-center">
                                        <Image className="h-8 w-8" />
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex flex-1 flex-col">
                                    {renderProductInfo(part)}
                                    <div className="flex items-center gap-2">
                                      <p
                                        className={`text-[20px] leading-tight font-semibold duration-300 md:text-[22px] ${
                                          isPartSelected(part.id, "other")
                                            ? "text-primary"
                                            : "text-subtle-dark"
                                        }`}
                                      >
                                        {formatCurrency(getPriceForPart(part))}
                                      </p>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleEditCompatiblePrice(part);
                                        }}
                                        className="text-primary flex items-center justify-center"
                                      >
                                        <SquarePen className="h-5 w-5" />
                                      </button>
                                    </div>
                                    {isDisabled && (
                                      <p className="text-destructive flex items-center gap-[4px] text-[16px] leading-tight font-semibold md:text-[18px]">
                                        <AlertTriangle className="text-destructive h-5 w-5" />
                                        <p>สต็อกหมด</p>
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div
                                className={`flex h-[32px] w-[32px] min-w-[32px] cursor-pointer items-center justify-center rounded-full duration-300 ${
                                  isPartSelected(part.id, "other")
                                    ? "bg-gradient-primary text-surface scale-110 shadow-lg"
                                    : "bg-subtle-light text-surface"
                                }`}
                                onClick={() => {
                                  if (isDisabled) return;
                                  handlePartSelection(
                                    part,
                                    !isPartSelected(part.id, "other"),
                                    "other",
                                  );
                                }}
                              >
                                <Check className="h-[18px] w-[18px]" />
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              )}
              {watch("brand") &&
                watch("model") &&
                compatibleParts.length === 0 && (
                  <div className="flex h-[228px] items-center justify-center">
                    <p className="text-subtle-light text-[20px] md:text-[22px]">
                      ไม่พบอะไหล่ที่รองรับ
                    </p>
                  </div>
                )}
              {watch("brand") &&
                watch("model") &&
                compatibleParts.length > 0 && (
                  <div className="flex items-center justify-between px-[20px] pt-[16px]">
                    <p className="text-[22px] font-semibold md:text-[24px]">
                      รายการซ่อมเพิ่มเติม
                    </p>
                    <AddRepairItemDialog
                      onAddItem={handleAddItemToRepair}
                      selectedItems={repairItems}
                      restoredStockMap={restoredStockMap}
                    >
                      <p className="text-primary cursor-pointer text-[20px] font-semibold md:text-[22px]">
                        + เพิ่มรายการซ่อม
                      </p>
                    </AddRepairItemDialog>
                  </div>
                )}
              {repairItems.length === 0 && compatibleParts.length === 0 ? (
                <div>
                  {(!watch("brand") || !watch("model")) && (
                    <div className="flex h-[228px] items-center justify-center">
                      <p className="text-subtle-light text-[20px] md:text-[22px]">
                        กรุณาเลือกยี่ห้อและรุ่นรถ
                      </p>
                    </div>
                  )}
                  <div className="h-[96px] lg:h-0"></div>
                </div>
              ) : repairItems.length > 0 ? (
                <div className="pb-[96px] xl:pb-0">
                  {repairItems.map((item, index) => (
                    <div
                      key={index}
                      className="mt-[16px] flex items-center gap-[16px] px-[20px]"
                    >
                      <div
                        role="button"
                        onClick={() => handlePriceClick(index, item)}
                        className="shadow-primary bg-surface flex h-[92px] w-full cursor-pointer items-center justify-between rounded-[10px] px-[8px]"
                      >
                        <div className="flex flex-1 items-center gap-[8px]">
                          <div className="border-subtle-light shadow-primary bg-surface flex h-[70px] w-[70px] items-center justify-center rounded-[10px] border">
                            {item.secureUrl ? (
                              <img
                                src={item.secureUrl}
                                alt={item.name}
                                className="h-full w-full rounded-[10px] object-cover"
                              />
                            ) : (
                              <div className="text-subtle-light flex h-[70px] w-[70px] items-center justify-center">
                                {item.partNumber && item.brand ? (
                                  <Image className="h-8 w-8" />
                                ) : (
                                  <Wrench className="h-8 w-8" />
                                )}
                              </div>
                            )}
                          </div>
                          <div className="flex flex-1 flex-col">
                            {renderProductInfo(item)}
                            <p className="text-subtle-dark text-[16px] leading-tight font-medium md:text-[18px]">
                              ราคาต่อหน่วย:{" "}
                              {formatCurrency(Number(item.sellingPrice))}
                            </p>
                            <div className="flex w-full items-center justify-between">
                              <p className="text-primary text-[20px] leading-tight font-semibold md:text-[22px]">
                                {formatCurrency(
                                  item.quantity * item.sellingPrice,
                                )}
                              </p>
                              <div
                                className="flex items-center gap-[8px]"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <button
                                  type="button"
                                  onClick={() => handleDecreaseQuantity(index)}
                                  disabled={item.quantity <= 1}
                                  className="flex h-[32px] w-[32px] cursor-pointer items-center justify-center rounded-[8px] border border-gray-200 bg-gray-100 disabled:bg-gray-50 disabled:text-gray-300"
                                >
                                  <Minus className="h-4 w-4" />
                                </button>
                                <p className="text-primary text-[18px] font-semibold md:text-[20px]">
                                  {item.quantity}
                                </p>
                                <button
                                  type="button"
                                  onClick={() => handleIncreaseQuantity(index)}
                                  disabled={
                                    item.partNumber && item.brand
                                      ? item.quantity >=
                                        (item.stockQuantity || 0)
                                      : false
                                  }
                                  className="border-primary/30 text-primary bg-primary/10 flex h-[32px] w-[32px] cursor-pointer items-center justify-center rounded-[8px] border disabled:border-gray-200 disabled:bg-gray-50 disabled:text-gray-300"
                                >
                                  <Plus className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setRepairItems((prev) =>
                            prev.filter((_, i) => i !== index),
                          )
                        }
                        className="text-surface cursor-pointer"
                      >
                        <div className="bg-destructive flex h-[32px] w-[32px] items-center justify-center rounded-full">
                          <Trash className="h-[18px] w-[18px]" />
                        </div>
                      </button>
                    </div>
                  ))}
                  {compatibleParts.length > 0 && (
                    <div className="border-primary/20 from-primary/10 to-primary/5 mx-[20px] mt-[16px] mb-[16px] rounded-[12px] border bg-gradient-to-r p-[16px]">
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                          <p className="text-subtle-dark text-[20px] font-semibold md:text-[22px]">
                            รวม{" "}
                            {Array.from(selectedLeftParts).filter((id) =>
                              getPartsForSide("left").some(
                                (part) => part.id === id,
                              ),
                            ).length +
                              Array.from(selectedRightParts).filter((id) =>
                                getPartsForSide("right").some(
                                  (part) => part.id === id,
                                ),
                              ).length +
                              Array.from(selectedOtherParts).filter((id) =>
                                getPartsForSide("other").some(
                                  (part) => part.id === id,
                                ),
                              ).length +
                              getRepairItemsCountExcludingLabor()}{" "}
                            รายการ
                          </p>
                        </div>
                        <div className="flex flex-col items-end">
                          <p className="text-primary text-[24px] font-semibold md:text-[26px]">
                            {formatCurrency(
                              getPartsForSide("left").reduce((total, part) => {
                                return (
                                  total +
                                  (selectedLeftParts.has(part.id)
                                    ? getPriceForPart(part)
                                    : 0)
                                );
                              }, 0) +
                                getPartsForSide("right").reduce(
                                  (total, part) => {
                                    return (
                                      total +
                                      (selectedRightParts.has(part.id)
                                        ? getPriceForPart(part)
                                        : 0)
                                    );
                                  },
                                  0,
                                ) +
                                getPartsForSide("other").reduce(
                                  (total, part) => {
                                    return (
                                      total +
                                      (selectedOtherParts.has(part.id)
                                        ? getPriceForPart(part)
                                        : 0)
                                    );
                                  },
                                  0,
                                ) +
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
                  )}
                  {compatibleParts.length > 0 && (
                    <div className="flex justify-center pb-[16px]">
                      <FormButton
                        label="ถัดไป"
                        isLoading={isLoading}
                        disabled={
                          Array.from(selectedLeftParts).filter((id) =>
                            getPartsForSide("left").some(
                              (part) => part.id === id,
                            ),
                          ).length +
                            Array.from(selectedRightParts).filter((id) =>
                              getPartsForSide("right").some(
                                (part) => part.id === id,
                              ),
                            ).length +
                            Array.from(selectedOtherParts).filter((id) =>
                              getPartsForSide("other").some(
                                (part) => part.id === id,
                              ),
                            ).length ===
                          0
                        }
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <div className="border-primary/20 from-primary/10 to-primary/5 mx-[20px] mt-[16px] mb-[16px] rounded-[12px] border bg-gradient-to-r p-[16px]">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <p className="text-subtle-dark text-[20px] font-semibold md:text-[22px]">
                          รวม{" "}
                          {Array.from(selectedLeftParts).filter((id) =>
                            getPartsForSide("left").some(
                              (part) => part.id === id,
                            ),
                          ).length +
                            Array.from(selectedRightParts).filter((id) =>
                              getPartsForSide("right").some(
                                (part) => part.id === id,
                              ),
                            ).length +
                            Array.from(selectedOtherParts).filter((id) =>
                              getPartsForSide("other").some(
                                (part) => part.id === id,
                              ),
                            ).length}{" "}
                          รายการ
                        </p>
                      </div>
                      <div className="flex flex-col items-end">
                        <p className="text-primary text-[24px] font-semibold md:text-[26px]">
                          {formatCurrency(
                            getPartsForSide("left").reduce((total, part) => {
                              return (
                                total +
                                (selectedLeftParts.has(part.id)
                                  ? getPriceForPart(part)
                                  : 0)
                              );
                            }, 0) +
                              getPartsForSide("right").reduce((total, part) => {
                                return (
                                  total +
                                  (selectedRightParts.has(part.id)
                                    ? getPriceForPart(part)
                                    : 0)
                                );
                              }, 0) +
                              getPartsForSide("other").reduce((total, part) => {
                                return (
                                  total +
                                  (selectedOtherParts.has(part.id)
                                    ? getPriceForPart(part)
                                    : 0)
                                );
                              }, 0),
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-center pb-[112px]">
                    <FormButton
                      label="ถัดไป"
                      isLoading={isLoading}
                      disabled={
                        Array.from(selectedLeftParts).filter((id) =>
                          getPartsForSide("left").some(
                            (part) => part.id === id,
                          ),
                        ).length +
                          Array.from(selectedRightParts).filter((id) =>
                            getPartsForSide("right").some(
                              (part) => part.id === id,
                            ),
                          ).length +
                          Array.from(selectedOtherParts).filter((id) =>
                            getPartsForSide("other").some(
                              (part) => part.id === id,
                            ),
                          ).length +
                          getRepairItemsCountExcludingLabor() ===
                        0
                      }
                    />
                  </div>
                </div>
              )}
            </div>
          </form>
        </div>
        <div className="hidden w-1/2 xl:block">
          <div className="bg-surface shadow-primary h-fit rounded-2xl">
            <div className="flex items-center gap-[8px] px-[20px] pt-[16px]">
              <div className="bg-primary/10 flex h-[40px] w-[40px] items-center justify-center rounded-full">
                <ClipboardList className="text-primary h-6 w-6" />
              </div>
              <p className="text-[22px] font-semibold md:text-[24px]">
                รายการซ่อมช่วงล่าง
              </p>
            </div>
            <div>
              <div className="mx-[20px] mt-[16px] flex justify-center">
                <div className="relative flex w-[308px] rounded-[10px] bg-gray-100 p-[4px]">
                  <button
                    type="button"
                    onClick={() => setActiveTab("left")}
                    className={`relative z-10 flex h-[40px] w-[100px] cursor-pointer items-center justify-center rounded-[10px] text-[18px] font-semibold duration-300 ease-out md:text-[20px] ${
                      activeTab === "left"
                        ? "scale-105 transform text-white"
                        : "text-subtle-dark"
                    }`}
                  >
                    <p className="relative z-10">ซ้าย</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("right")}
                    className={`relative z-10 flex h-[40px] w-[100px] cursor-pointer items-center justify-center rounded-[10px] text-[18px] font-semibold duration-300 ease-out md:text-[20px] ${
                      activeTab === "right"
                        ? "scale-105 transform text-white"
                        : "text-subtle-dark"
                    }`}
                  >
                    <p className="relative z-10">ขวา</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("other")}
                    className={`relative z-10 flex h-[40px] w-[100px] cursor-pointer items-center justify-center rounded-[10px] text-[18px] font-semibold duration-300 ease-out md:text-[20px] ${
                      activeTab === "other"
                        ? "scale-105 transform text-white"
                        : "text-subtle-dark"
                    }`}
                  >
                    <p className="relative z-10">อื่นๆ</p>
                  </button>

                  <div
                    className={`bg-gradient-primary absolute flex h-[40px] justify-center rounded-[10px] shadow-lg duration-300 ease-out ${
                      activeTab === "left"
                        ? "left-[4px] w-[100px]"
                        : activeTab === "right"
                          ? "left-[104px] w-[100px]"
                          : "left-[204px] w-[100px]"
                    }`}
                  />
                </div>
              </div>
              {compatibleParts.length > 0 && (
                <div>
                  {activeTab === "left" && (
                    <div
                      key="desktop-panel-left"
                      className="animate-in fade-in zoom-in-95 w-full duration-200"
                    >
                      {getPartsForSide("left").length === 0 ? (
                        <div className="flex h-[120px] items-center justify-center">
                          <p className="text-subtle-light text-[18px] md:text-[20px]">
                            ไม่มีอะไหล่ที่รองรับ
                          </p>
                        </div>
                      ) : (
                        getPartsForSide("left").map((part) => {
                          const selectedThis = isPartSelected(part.id, "left");
                          const allowedUnits = getAllowedUnitsForPart(part);
                          const currentSelectedAll =
                            getCurrentSelectedCountForPart(part);
                          const isDisabled =
                            !selectedThis && currentSelectedAll >= allowedUnits;
                          return (
                            <div
                              key={`desktop-left-${part.id}`}
                              className={`mt-[16px] flex items-center gap-[16px] px-[20px] ${
                                isDisabled
                                  ? "cursor-not-allowed opacity-50"
                                  : ""
                              }`}
                            >
                              <div
                                className={`shadow-primary flex h-[92px] w-full cursor-pointer items-center justify-between rounded-[10px] border-2 px-[8px] duration-300 ${
                                  isPartSelected(part.id, "left")
                                    ? "bg-primary/5 border-primary scale-[1.02]"
                                    : "bg-surface border-transparent"
                                }`}
                                onClick={() => {
                                  if (isDisabled) return;
                                  handlePartSelection(
                                    part,
                                    !isPartSelected(part.id, "left"),
                                    "left",
                                  );
                                }}
                              >
                                <div className="flex flex-1 items-center gap-[8px]">
                                  <div className="border-subtle-light shadow-primary bg-surface flex h-[70px] w-[70px] items-center justify-center rounded-[10px] border">
                                    {part.secureUrl ? (
                                      <img
                                        src={part.secureUrl}
                                        alt={part.name}
                                        className="h-full w-full rounded-[10px] object-cover"
                                      />
                                    ) : (
                                      <div className="text-subtle-light flex h-[70px] w-[70px] items-center justify-center">
                                        <Image className="h-8 w-8" />
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex flex-1 flex-col">
                                    {renderProductInfo(part)}
                                    <div className="flex items-center gap-2">
                                      <p
                                        className={`text-[20px] leading-tight font-semibold duration-300 md:text-[22px] ${
                                          isPartSelected(part.id, "left")
                                            ? "text-primary"
                                            : "text-subtle-dark"
                                        }`}
                                      >
                                        {formatCurrency(getPriceForPart(part))}
                                      </p>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleEditCompatiblePrice(part);
                                        }}
                                        className="text-primary mt-[2px] flex items-center justify-center"
                                      >
                                        <SquarePen className="h-5 w-5" />
                                      </button>
                                    </div>
                                    {isDisabled && (
                                      <p className="text-destructive flex items-center gap-[4px] text-[16px] leading-tight font-semibold md:text-[18px]">
                                        <AlertTriangle className="text-destructive h-5 w-5" />
                                        <span>สต็อกหมด</span>
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div
                                className={`flex h-[32px] w-[32px] min-w-[32px] cursor-pointer items-center justify-center rounded-full duration-300 ${
                                  isPartSelected(part.id, "left")
                                    ? "bg-gradient-primary text-surface scale-110 shadow-lg"
                                    : "bg-subtle-light text-surface"
                                }`}
                                onClick={() => {
                                  if (isDisabled) return;
                                  handlePartSelection(
                                    part,
                                    !isPartSelected(part.id, "left"),
                                    "left",
                                  );
                                }}
                              >
                                <Check className="h-[18px] w-[18px]" />
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                  {activeTab === "right" && (
                    <div
                      key="desktop-panel-right"
                      className="animate-in fade-in zoom-in-95 w-full duration-200"
                    >
                      {getPartsForSide("right").length === 0 ? (
                        <div className="flex h-[120px] items-center justify-center">
                          <p className="text-subtle-light text-[18px] md:text-[20px]">
                            ไม่มีอะไหล่ที่รองรับ
                          </p>
                        </div>
                      ) : (
                        getPartsForSide("right").map((part) => {
                          const selectedThis = isPartSelected(part.id, "right");
                          const allowedUnits = getAllowedUnitsForPart(part);
                          const currentSelectedAll =
                            getCurrentSelectedCountForPart(part);
                          const isDisabled =
                            !selectedThis && currentSelectedAll >= allowedUnits;
                          return (
                            <div
                              key={`desktop-right-${part.id}`}
                              className={`mt-[16px] flex items-center gap-[16px] px-[20px] ${
                                isDisabled
                                  ? "cursor-not-allowed opacity-50"
                                  : ""
                              }`}
                            >
                              <div
                                className={`shadow-primary flex h-[92px] w-full cursor-pointer items-center justify-between rounded-[10px] border-2 px-[8px] duration-300 ${
                                  isPartSelected(part.id, "right")
                                    ? "bg-primary/5 border-primary scale-[1.02]"
                                    : "bg-surface border-transparent"
                                }`}
                                onClick={() => {
                                  if (isDisabled) return;
                                  handlePartSelection(
                                    part,
                                    !isPartSelected(part.id, "right"),
                                    "right",
                                  );
                                }}
                              >
                                <div className="flex flex-1 items-center gap-[8px]">
                                  <div className="border-subtle-light shadow-primary bg-surface flex h-[70px] w-[70px] items-center justify-center rounded-[10px] border">
                                    {part.secureUrl ? (
                                      <img
                                        src={part.secureUrl}
                                        alt={part.name}
                                        className="h-full w-full rounded-[10px] object-cover"
                                      />
                                    ) : (
                                      <div className="text-subtle-light flex h-[70px] w-[70px] items-center justify-center">
                                        <Image className="h-8 w-8" />
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex flex-1 flex-col">
                                    {renderProductInfo(part)}
                                    <div className="flex items-center gap-2">
                                      <p
                                        className={`text-[20px] leading-tight font-semibold duration-300 md:text-[22px] ${
                                          isPartSelected(part.id, "right")
                                            ? "text-primary"
                                            : "text-subtle-dark"
                                        }`}
                                      >
                                        {formatCurrency(getPriceForPart(part))}
                                      </p>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleEditCompatiblePrice(part);
                                        }}
                                        className="text-primary flex items-center justify-center"
                                      >
                                        <SquarePen className="h-5 w-5" />
                                      </button>
                                    </div>
                                    {isDisabled && (
                                      <p className="text-destructive flex items-center gap-[4px] text-[16px] leading-tight font-semibold md:text-[18px]">
                                        <AlertTriangle className="text-destructive h-5 w-5" />
                                        <span>สต็อกหมด</span>
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div
                                className={`flex h-[32px] w-[32px] min-w-[32px] cursor-pointer items-center justify-center rounded-full duration-300 ${
                                  isPartSelected(part.id, "right")
                                    ? "bg-gradient-primary text-surface scale-110 shadow-lg"
                                    : "bg-subtle-light text-surface"
                                }`}
                                onClick={() => {
                                  if (isDisabled) return;
                                  handlePartSelection(
                                    part,
                                    !isPartSelected(part.id, "right"),
                                    "right",
                                  );
                                }}
                              >
                                <Check className="h-[18px] w-[18px]" />
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                  {activeTab === "other" && (
                    <div
                      key="desktop-panel-other"
                      className="animate-in fade-in zoom-in-95 w-full duration-200"
                    >
                      {getPartsForSide("other").length === 0 ? (
                        <div className="flex h-[120px] items-center justify-center">
                          <p className="text-subtle-light text-[20px] md:text-[22px]">
                            ไม่มีอะไหล่ที่รองรับ
                          </p>
                        </div>
                      ) : (
                        getPartsForSide("other").map((part) => {
                          const selectedThis = isPartSelected(part.id, "other");
                          const allowedUnits = getAllowedUnitsForPart(part);
                          const currentSelectedAll =
                            getCurrentSelectedCountForPart(part);
                          const isDisabled =
                            !selectedThis && currentSelectedAll >= allowedUnits;
                          return (
                            <div
                              key={`desktop-other-${part.id}`}
                              className={`mt-[16px] flex items-center gap-[16px] px-[20px] ${
                                isDisabled
                                  ? "cursor-not-allowed opacity-50"
                                  : ""
                              }`}
                            >
                              <div
                                className={`shadow-primary flex h-[92px] w-full cursor-pointer items-center justify-between rounded-[10px] border-2 px-[8px] duration-300 ${
                                  isPartSelected(part.id, "other")
                                    ? "bg-primary/5 ห้ฟ-primary scale-[1.02]"
                                    : "bg-surface border-transparent"
                                }`}
                                onClick={() => {
                                  if (isDisabled) return;
                                  handlePartSelection(
                                    part,
                                    !isPartSelected(part.id, "other"),
                                    "other",
                                  );
                                }}
                              >
                                <div className="flex flex-1 items-center gap-[8px]">
                                  <div className="border-subtle-light shadow-primary bg-surface flex h-[70px] w-[70px] items-center justify-center rounded-[10px] border">
                                    {part.secureUrl ? (
                                      <img
                                        src={part.secureUrl}
                                        alt={part.name}
                                        className="h-full w-full rounded-[10px] object-cover"
                                      />
                                    ) : (
                                      <div className="text-subtle-light flex h-[70px] w-[70px] items-center justify-center">
                                        <Image className="h-8 w-8" />
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex flex-1 flex-col">
                                    {renderProductInfo(part)}
                                    <div className="flex items-center gap-2">
                                      <p
                                        className={`text-[20px] leading-tight font-semibold duration-300 md:text-[22px] ${
                                          isPartSelected(part.id, "other")
                                            ? "text-primary"
                                            : "text-subtle-dark"
                                        }`}
                                      >
                                        {formatCurrency(getPriceForPart(part))}
                                      </p>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleEditCompatiblePrice(part);
                                        }}
                                        className="text-primary flex items-center justify-center"
                                      >
                                        <SquarePen className="h-5 w-5" />
                                      </button>
                                    </div>
                                    {isDisabled && (
                                      <p className="text-destructive flex items-center gap-[4px] text-[16px] leading-tight font-semibold md:text-[18px]">
                                        <AlertTriangle className="text-destructive h-5 w-5" />
                                        <span>สต็อกหมด</span>
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div
                                className={`flex h-[32px] w-[32px] min-w-[32px] cursor-pointer items-center justify-center rounded-full duration-300 ${
                                  isPartSelected(part.id, "other")
                                    ? "bg-gradient-primary text-surface scale-110 shadow-lg"
                                    : "bg-subtle-light text-surface"
                                }`}
                                onClick={() => {
                                  if (isDisabled) return;
                                  handlePartSelection(
                                    part,
                                    !isPartSelected(part.id, "other"),
                                    "other",
                                  );
                                }}
                              >
                                <Check className="h-[18px] w-[18px]" />
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              )}
              {watch("brand") &&
                watch("model") &&
                compatibleParts.length === 0 && (
                  <div className="flex h-[228px] items-center justify-center">
                    <p className="text-subtle-light text-[20px] md:text-[22px]">
                      ไม่พบอะไหล่ที่รองรับ
                    </p>
                  </div>
                )}
              {watch("brand") &&
                watch("model") &&
                compatibleParts.length > 0 && (
                  <div className="flex items-center justify-between px-[20px] pt-[16px]">
                    <p className="text-[22px] font-semibold md:text-[24px]">
                      รายการซ่อมเพิ่มเติม
                    </p>
                    <AddRepairItemDialog
                      onAddItem={handleAddItemToRepair}
                      selectedItems={repairItems}
                      restoredStockMap={restoredStockMap}
                    >
                      <p className="text-primary cursor-pointer text-[20px] font-semibold md:text-[22px]">
                        + เพิ่มรายการซ่อม
                      </p>
                    </AddRepairItemDialog>
                  </div>
                )}
              {repairItems.length === 0 && compatibleParts.length === 0 ? (
                <div>
                  {(!watch("brand") || !watch("model")) && (
                    <div className="flex h-[228px] items-center justify-center">
                      <p className="text-subtle-light text-[20px] md:text-[22px]">
                        กรุณาเลือกยี่ห้อและรุ่นรถ
                      </p>
                    </div>
                  )}
                </div>
              ) : repairItems.length > 0 ? (
                <div className="pb-[16px]">
                  {repairItems.map((item, index) => (
                    <div
                      key={`desktop-item-${index}`}
                      className="mt-[16px] flex items-center gap-[16px] px-[20px]"
                    >
                      <div
                        role="button"
                        onClick={() => handlePriceClick(index, item)}
                        className="shadow-primary bg-surface flex h-[92px] w-full cursor-pointer items-center justify-between rounded-[10px] px-[8px]"
                      >
                        <div className="flex flex-1 items-center gap-[8px]">
                          <div className="border-subtle-light shadow-primary bg-surface flex h-[70px] w-[70px] items-center justify-center rounded-[10px] border">
                            {item.secureUrl ? (
                              <img
                                src={item.secureUrl}
                                alt={item.name}
                                className="h-full w-full rounded-[10px] object-cover"
                              />
                            ) : (
                              <div className="text-subtle-light flex h-[70px] w-[70px] items-center justify-center">
                                {item.partNumber && item.brand ? (
                                  <Image className="h-8 w-8" />
                                ) : (
                                  <Wrench className="h-8 w-8" />
                                )}
                              </div>
                            )}
                          </div>
                          <div className="flex flex-1 flex-col">
                            {renderProductInfo(item)}
                            <p className="text-subtle-dark text-[16px] leading-tight font-medium md:text-[18px]">
                              ราคาต่อหน่วย:{" "}
                              {formatCurrency(Number(item.sellingPrice))}
                            </p>
                            <div className="flex w-full items-center justify-between">
                              <p className="text-primary text-[20px] leading-tight font-semibold md:text-[22px]">
                                {formatCurrency(
                                  item.quantity * item.sellingPrice,
                                )}
                              </p>
                              <div
                                className="flex items-center gap-[8px]"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <button
                                  type="button"
                                  onClick={() => handleDecreaseQuantity(index)}
                                  disabled={item.quantity <= 1}
                                  className="flex h-[32px] w-[32px] cursor-pointer items-center justify-center rounded-[8px] border border-gray-200 bg-gray-100 disabled:bg-gray-50 disabled:text-gray-300"
                                >
                                  <Minus className="h-4 w-4" />
                                </button>
                                <p className="text-primary text-[18px] font-semibold md:text-[20px]">
                                  {item.quantity}
                                </p>
                                <button
                                  type="button"
                                  onClick={() => handleIncreaseQuantity(index)}
                                  disabled={
                                    item.partNumber && item.brand
                                      ? item.quantity >=
                                        (item.stockQuantity || 0)
                                      : false
                                  }
                                  className="border-primary/30 text-primary bg-primary/10 flex h-[32px] w-[32px] cursor-pointer items-center justify-center rounded-[8px] border disabled:border-gray-200 disabled:bg-gray-50 disabled:text-gray-300"
                                >
                                  <Plus className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setRepairItems((prev) =>
                            prev.filter((_, i) => i !== index),
                          )
                        }
                        className="text-surface cursor-pointer"
                      >
                        <div className="bg-destructive flex h-[32px] w-[32px] items-center justify-center rounded-full">
                          <Trash className="h-[18px] w-[18px]" />
                        </div>
                      </button>
                    </div>
                  ))}
                  {compatibleParts.length > 0 && (
                    <div className="border-primary/20 from-primary/10 to-primary/5 mx-[20px] mt-[16px] mb-[16px] rounded-[12px] border bg-gradient-to-r p-[16px]">
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                          <p className="text-subtle-dark text-[20px] font-semibold md:text-[22px]">
                            รวม{" "}
                            {Array.from(selectedLeftParts).filter((id) =>
                              getPartsForSide("left").some(
                                (part) => part.id === id,
                              ),
                            ).length +
                              Array.from(selectedRightParts).filter((id) =>
                                getPartsForSide("right").some(
                                  (part) => part.id === id,
                                ),
                              ).length +
                              Array.from(selectedOtherParts).filter((id) =>
                                getPartsForSide("other").some(
                                  (part) => part.id === id,
                                ),
                              ).length +
                              getRepairItemsCountExcludingLabor()}{" "}
                            รายการ
                          </p>
                        </div>
                        <div className="flex flex-col items-end">
                          <p className="text-primary text-[24px] font-semibold md:text-[26px]">
                            {formatCurrency(
                              getPartsForSide("left").reduce((total, part) => {
                                return (
                                  total +
                                  (selectedLeftParts.has(part.id)
                                    ? getPriceForPart(part)
                                    : 0)
                                );
                              }, 0) +
                                getPartsForSide("right").reduce(
                                  (total, part) => {
                                    return (
                                      total +
                                      (selectedRightParts.has(part.id)
                                        ? getPriceForPart(part)
                                        : 0)
                                    );
                                  },
                                  0,
                                ) +
                                getPartsForSide("other").reduce(
                                  (total, part) => {
                                    return (
                                      total +
                                      (selectedOtherParts.has(part.id)
                                        ? getPriceForPart(part)
                                        : 0)
                                    );
                                  },
                                  0,
                                ) +
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
                  )}
                  {compatibleParts.length > 0 && (
                    <div className="flex justify-center pb-[16px]">
                      <FormButton
                        label="ถัดไป"
                        isLoading={isLoading}
                        form="suspension-form"
                        disabled={
                          Array.from(selectedLeftParts).filter((id) =>
                            getPartsForSide("left").some(
                              (part) => part.id === id,
                            ),
                          ).length +
                            Array.from(selectedRightParts).filter((id) =>
                              getPartsForSide("right").some(
                                (part) => part.id === id,
                              ),
                            ).length +
                            Array.from(selectedOtherParts).filter((id) =>
                              getPartsForSide("other").some(
                                (part) => part.id === id,
                              ),
                            ).length ===
                          0
                        }
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <div className="border-primary/20 from-primary/10 to-primary/5 mx-[20px] mt-[16px] mb-[16px] rounded-[12px] border bg-gradient-to-r p-[16px]">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <p className="text-subtle-dark text-[20px] font-semibold md:text-[22px]">
                          รวม{" "}
                          {Array.from(selectedLeftParts).filter((id) =>
                            getPartsForSide("left").some(
                              (part) => part.id === id,
                            ),
                          ).length +
                            Array.from(selectedRightParts).filter((id) =>
                              getPartsForSide("right").some(
                                (part) => part.id === id,
                              ),
                            ).length +
                            Array.from(selectedOtherParts).filter((id) =>
                              getPartsForSide("other").some(
                                (part) => part.id === id,
                              ),
                            ).length}{" "}
                          รายการ
                        </p>
                      </div>
                      <div className="flex flex-col items-end">
                        <p className="text-primary text-[24px] font-semibold md:text-[26px]">
                          {formatCurrency(
                            getPartsForSide("left").reduce((total, part) => {
                              return (
                                total +
                                (selectedLeftParts.has(part.id)
                                  ? getPriceForPart(part)
                                  : 0)
                              );
                            }, 0) +
                              getPartsForSide("right").reduce((total, part) => {
                                return (
                                  total +
                                  (selectedRightParts.has(part.id)
                                    ? getPriceForPart(part)
                                    : 0)
                                );
                              }, 0) +
                              getPartsForSide("other").reduce((total, part) => {
                                return (
                                  total +
                                  (selectedOtherParts.has(part.id)
                                    ? getPriceForPart(part)
                                    : 0)
                                );
                              }, 0),
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-center pb-[16px]">
                    <FormButton
                      label="ถัดไป"
                      isLoading={isLoading}
                      form="suspension-form"
                      disabled={
                        Array.from(selectedLeftParts).filter((id) =>
                          getPartsForSide("left").some(
                            (part) => part.id === id,
                          ),
                        ).length +
                          Array.from(selectedRightParts).filter((id) =>
                            getPartsForSide("right").some(
                              (part) => part.id === id,
                            ),
                          ).length +
                          Array.from(selectedOtherParts).filter((id) =>
                            getPartsForSide("other").some(
                              (part) => part.id === id,
                            ),
                          ).length +
                          getRepairItemsCountExcludingLabor() ===
                        0
                      }
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <EditPriceDialog
        isOpen={priceDialogOpen}
        onClose={() => setPriceDialogOpen(false)}
        onConfirm={handlePriceConfirm}
        currentPrice={editingItem?.sellingPrice || 0}
        productName={editingItem ? getProductName(editingItem) : ""}
        productImage={editingItem?.secureUrl}
        isService={editingItem?.category?.name === "บริการ"}
        currentName={editingItem?.name || ""}
        canEditName={
          editingItem?.category?.name === "บริการ" &&
          (editingItem?.id === 1 || editingItem?.service?.id === 1)
        }
      />
    </div>
  );
};

export default SuspensionInspection;
