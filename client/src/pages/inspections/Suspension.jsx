import FormInput from "@/components/forms/FormInput";
import ComboBox from "@/components/ui/ComboBox";
import AddRepairItemDialog from "@/components/dialogs/AddRepairItemDialog";
import EditPriceDialog from "@/components/dialogs/EditPriceDialog";
import { useForm } from "react-hook-form";
import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router";
import { provinces } from "@/utils/data";
import { getVehicleBrandModels } from "@/api/vehicleBrandModel";
import { getParts } from "@/api/part";
import LicensePlateInput from "@/components/forms/LicensePlateInput";
import { formatCurrency } from "@/lib/utils";
import {
  Image,
  Trash,
  Plus,
  Minus,
  Check,
  Wrench,
  SquarePen,
} from "lucide-react";
import FormButton from "@/components/forms/FormButton";
import { zodResolver } from "@hookform/resolvers/zod";
import { repairSchema } from "@/utils/schemas";
import { CarRepair } from "@/components/icons/Icon";

const Suspension = () => {
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
  const isEditing = Boolean(location.state?.editRepairId);
  const initialSelectedRef = useRef({
    left: new Set(),
    right: new Set(),
    other: new Set(),
  });

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchVehicleBrandModels();
  }, []);

  // เพิ่มบริการ "ค่าแรง" อัตโนมัติ เมื่อผู้ใช้เลือกยี่ห้อและรุ่นแล้ว
  useEffect(() => {
    const brand = watch("brand");
    const model = watch("model");
    if (!brand || !model) return;

    setRepairItems((prev) => {
      if (restoredRef.current) {
        // ข้ามการเพิ่มค่าแรงครั้งแรกหลังการกู้คืน แล้วรีเซ็ต
        restoredRef.current = false;
        return prev;
      }

      // ตรวจสอบโดยใช้ id=1 แทนการเช็คชื่อ เพื่อป้องกันการเพิ่มซ้ำเมื่อผู้ใช้แก้ชื่อค่าแรง
      const exists = prev.some(
        (i) => i?.category?.name === "บริการ" && i?.id === 1
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
  }, [watch("brand"), watch("model")]);

  // ดึงข้อมูลอะไหล่ที่เข้ากันได้เมื่อเลือกรุ่นรถ
  useEffect(() => {
    const brand = watch("brand");
    const model = watch("model");

    if (brand && model) {
      fetchCompatibleParts(brand, model);
    } else {
      setCompatibleParts([]);
    }
  }, [watch("brand"), watch("model")]);

  // กู้คืนข้อมูลเมื่อกลับมาจากหน้าสรุป
  useEffect(() => {
    if (!location.state) return;

    const {
      repairData,
      repairItems: savedItems,
      scrollToBottom,
      editRepairId,
    } = location.state;

    if (repairData) {
      Object.keys(repairData).forEach((key) => {
        setValue(key, repairData[key]);
      });
    }

    if (savedItems && Array.isArray(savedItems)) {
      // แยกอะไหล่ที่เลือกซ้าย/ขวาออกจากรายการซ่อมที่ผู้ใช้เพิ่มเอง
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
      // เก็บรายการที่ถูกเลือกมาตั้งแต่แรก เพื่ออนุญาตติ๊กกลับได้แม้สต็อกไม่พอ
      initialSelectedRef.current = {
        left: leftSet,
        right: rightSet,
        other: otherSet,
      };

      // สร้าง baseline stock ที่คืนมาในโหมดแก้ไข เพื่อนำไปใช้ใน dialog
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
      // ตั้งค่าว่าเพิ่งกู้คืนข้อมูล เพื่อกันการเพิ่มค่าแรงซ้ำอัตโนมัติในรอบถัดไป
      restoredRef.current = true;
    }

    if (scrollToBottom) {
      setTimeout(() => {
        window.scrollTo({
          top: document.body.scrollHeight,
          behavior: "smooth",
        });
      }, 500);
    }

    // ลบ state ออกจาก history แต่คงค่า editRepairId และแหล่งที่มาไว้
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
      window.location.pathname
    );
  }, [location.state, setValue]);

  const fetchVehicleBrandModels = async () => {
    try {
      const res = await getVehicleBrandModels();
      setVehicleBrandModels(res.data);

      // สร้างรายการ brands ที่ไม่ซ้ำกัน
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

      // กรองอะไหล่ที่เข้ากันได้กับรถรุ่นนี้
      const compatible = allParts.filter((part) => {
        if (!part.compatibleVehicles) return false;

        // ตรวจสอบว่า compatibleVehicles มี brand และ model ที่ตรงกัน
        return part.compatibleVehicles.some(
          (vehicle) => vehicle.brand === brand && vehicle.model === model
        );
      });

      setCompatibleParts(compatible);
    } catch (error) {
      console.error(error);
      setCompatibleParts([]);
    }
  };

  // ฟังก์ชันสำหรับกรองอะไหล่ตาม suspensionType
  const getPartsForSide = (side) => {
    return compatibleParts.filter((part) => {
      // ถ้าไม่มี typeSpecificData หรือไม่มี suspensionType แสดงในทุกแท็บ
      if (!part.typeSpecificData || !part.typeSpecificData.suspensionType) {
        return true;
      }

      const suspensionType = part.typeSpecificData.suspensionType;

      // ถ้าเป็น left-right ให้แสดงในแท็บซ้ายและขวา
      if (suspensionType === "left-right") {
        return side === "left" || side === "right";
      }

      // ถ้าเป็น other ให้แสดงเฉพาะในแท็บอื่นๆ
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
        <p className="w-full font-semibold text-[16px] md:text-[18px] text-normal line-clamp-1 leading-tight">
          {item.name}
        </p>
      );
    }

    // แสดงข้อมูลยางที่มีขนาดแก้มยาง
    if (isTire && item.typeSpecificData && item.typeSpecificData.aspectRatio) {
      return (
        <p className="w-full font-semibold text-[16px] md:text-[18px] text-normal line-clamp-1 leading-tight">
          {item.brand} {item.typeSpecificData.width}/
          {item.typeSpecificData.aspectRatio}R
          {item.typeSpecificData.rimDiameter} {item.name}
        </p>
      );
    }

    // แสดงข้อมูลยางที่ไม่มีขนาดแก้มยาง
    if (isTire && item.typeSpecificData) {
      return (
        <p className="w-full font-semibold text-[16px] md:text-[18px] text-normal line-clamp-1 leading-tight">
          {item.brand} {item.typeSpecificData.width}R
          {item.typeSpecificData.rimDiameter} {item.name}
        </p>
      );
    }

    // แสดงข้อมูลอะไหล่หรือบริการ
    return (
      <p className="w-full font-semibold text-[16px] md:text-[18px] text-normal line-clamp-1 leading-tight">
        {item.brand} {item.name}
      </p>
    );
  };

  const handleAddItemToRepair = (item) => {
    setRepairItems((prev) => {
      // รายการซ่อมเพิ่มเติมไม่ต้องมี side (เป็น null)
      const itemWithSide = {
        ...item,
        side: null, // รายการซ่อมเพิ่มเติมไม่มี side
      };

      // หาตำแหน่งรายการที่ซ้ำกัน (เช็คจาก partNumber, brand โดยไม่สนใจ side)
      const index = prev.findIndex(
        (i) =>
          i.partNumber === itemWithSide.partNumber &&
          i.brand === itemWithSide.brand &&
          i.name === itemWithSide.name
      );
      if (index !== -1) {
        // ถ้าซ้ำ ให้เพิ่ม quantity
        return prev.map((i, idx) =>
          idx === index
            ? {
                ...i,
                quantity: i.quantity + 1,
              }
            : i
        );
      } else {
        // ถ้าไม่ซ้ำ เพิ่มรายการใหม่
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
        top: document.documentElement.scrollHeight,
        behavior: "smooth",
      });
    }, 100);
  };

  const handleIncreaseQuantity = (index) => {
    setRepairItems((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, quantity: item.quantity + 1 } : item
      )
    );
  };

  const handleDecreaseQuantity = (index) => {
    setRepairItems((prev) =>
      prev.map((item, i) =>
        i === index && item.quantity > 1
          ? { ...item, quantity: item.quantity - 1 }
          : item
      )
    );
  };

  const handlePriceClick = (index, item) => {
    // ป้องกันโฟกัสค้างอยู่บน element ที่จะถูกซ่อนไว้ด้วย aria-hidden โดย dialog
    try {
      const ae = document.activeElement;
      if (ae && ae instanceof HTMLElement) ae.blur();
    } catch (_) {}
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
            : item
        )
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
    // ป้องกันโฟกัสค้างอยู่บน element ที่จะถูกซ่อนไว้ด้วย aria-hidden โดย dialog
    try {
      const ae = document.activeElement;
      if (ae && ae instanceof HTMLElement) ae.blur();
    } catch (_) {}
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

  const isLaborItem = (item) => {
    // มองว่าเป็นค่าแรงถ้าเป็นบริการและ id=1
    return item?.category?.name === "บริการ" && item?.id === 1;
  };

  const getRepairItemsCountExcludingLabor = () => {
    return repairItems.length;
  };

  // คำนวณจำนวนชิ้นที่เลือกได้จริง (สต็อกปัจจุบัน + จำนวนที่ถูกเลือกไว้ตั้งแต่แรก)
  const getAllowedUnitsForPart = (part) => {
    const stockQty =
      typeof part?.stockQuantity === "number"
        ? Math.max(part.stockQuantity, 0)
        : Infinity;
    // นับ initial selections เฉพาะถ้าเป็นอะไหล่ช่วงล่าง (มี suspensionType)
    const isSuspensionPart = Boolean(part?.typeSpecificData?.suspensionType);
    const initialCount = isSuspensionPart
      ? Number(initialSelectedRef.current.left.has(part.id)) +
        Number(initialSelectedRef.current.right.has(part.id)) +
        Number(initialSelectedRef.current.other.has(part.id))
      : 0;
    if (stockQty === Infinity) return Infinity;
    return Math.max(stockQty, initialCount);
  };

  // จำนวนที่เลือกอยู่ตอนนี้ (รวมทุกฝั่งของอะไหล่ชิ้นเดียวกัน)
  const getCurrentSelectedCountForPart = (part) => {
    return (
      Number(selectedLeftParts.has(part.id)) +
      Number(selectedRightParts.has(part.id)) +
      Number(selectedOtherParts.has(part.id))
    );
  };

  const handlePartSelection = (part, isSelected, side) => {
    const suspensionType = part?.typeSpecificData?.suspensionType;
    const stockQty =
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
      // ถ้าอะไหล่แบบซ้าย-ขวา และอนุญาตเลือกได้เพียง 1 ชิ้นรวม ให้เลือกได้เพียง 1 ฝั่ง: ตัดฝั่งขวาออก
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
      // ถ้าอะไหล่แบบซ้าย-ขวา และอนุญาตเลือกได้เพียง 1 ชิ้นรวม ให้เลือกได้เพียง 1 ฝั่ง: ตัดฝั่งซ้ายออก
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
    } catch (_) {}

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
    }, 50);
  };

  const onSubmit = async (data) => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 250));

    // รวมรายการอะไหล่ที่เลือกจาก compatibleParts กับ repairItems
    const allRepairItems = [
      // อะไหล่ฝั่งซ้ายที่เลือก (กรองตาม suspensionType)
      ...Array.from(selectedLeftParts)
        .map((id) => getPartsForSide("left").find((p) => p.id === id))
        .filter(Boolean)
        .map((part) => ({
          ...part,
          sellingPrice: getPriceForPart(part),
          quantity: 1,
          side: "left",
        })),
      // อะไหล่ฝั่งขวาที่เลือก (กรองตาม suspensionType)
      ...Array.from(selectedRightParts)
        .map((id) => getPartsForSide("right").find((p) => p.id === id))
        .filter(Boolean)
        .map((part) => ({
          ...part,
          sellingPrice: getPriceForPart(part),
          quantity: 1,
          side: "right",
        })),
      // อะไหล่ช่วงล่างอื่นๆ ที่เลือก (กรองตาม suspensionType)
      ...Array.from(selectedOtherParts)
        .map((id) => getPartsForSide("other").find((p) => p.id === id))
        .filter(Boolean)
        .map((part) => ({
          ...part,
          sellingPrice: getPriceForPart(part),
          quantity: 1,
          side: "other",
        })),
      // รายการซ่อมที่เพิ่มเข้ามา
      ...repairItems,
    ];

    navigate("/repair/summary", {
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
    <div className="w-full h-full bg-gradient-primary shadow-primary">
      <div className="flex items-center gap-[8px] pt-[16px] pl-[20px]">
        <div className="flex items-center justify-center w-[40px] h-[40px] rounded-full bg-surface/20">
          <CarRepair color="#ffffff" />
        </div>
        <div>
          <p className="font-semibold text-[24px] md:text-[26px] text-surface">
            เช็กช่วงล่าง
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit, onInvalid)}>
        <FormInput
          register={register}
          name="fullName"
          label="ชื่อลูกค้า"
          type="text"
          placeholder="เช่น สมชาย ใจดี"
          color="surface"
          errors={errors}
        />
        <FormInput
          register={register}
          name="address"
          label="ที่อยู่"
          type="text"
          placeholder="เช่น 543 หมู่ 5 ต.น้ำอ้อม อ.กันทรลักษ์ จ.ศรีสะเกษ 33110"
          color="surface"
          errors={errors}
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
            e.target.value = e.target.value.replace(/[^0-9]/g, "").slice(0, 10);
          }}
        />
        <div className="px-[20px] mt-[16px]">
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
              }); // รีเซ็ตรุ่นรถเมื่อเปลี่ยนยี่ห้อ
            }}
            placeholder="-- เลือกยี่ห้อรถ --"
            errors={errors}
            name="brand"
          />
          {/* Hidden input สำหรับ register */}
          <input
            {...register("brand")}
            type="hidden"
            value={watch("brand") || ""}
          />
        </div>
        <div className="px-[20px] mt-[16px]">
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
          {/* Hidden input สำหรับ register */}
          <input
            {...register("model")}
            type="hidden"
            value={watch("model") || ""}
          />
        </div>

        {/* ป้ายทะเบียนรถ */}
        <div className="px-[20px] pt-[16px]">
          <p className="mb-[8px] font-medium text-[22px] md:text-[24px] text-surface">
            ทะเบียนรถ
          </p>
          <div className="flex gap-[4px] items-start">
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
            <span className="pt-[8px] font-medium text-[18px] text-surface">
              -
            </span>
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

        <div className="overflow-hidden w-full h-full mt-[30px] rounded-tl-2xl rounded-tr-2xl bg-surface shadow-primary">
          <div className="flex justify-between items-center px-[20px] pt-[16px]">
            <p className="font-semibold text-[22px] md:text-[24px]">
              รายการซ่อมช่วงล่าง
            </p>
          </div>

          <div className="flex justify-center mx-[20px] mt-[16px]">
            <div className="relative flex w-[308px] bg-gray-100 p-[4px] rounded-[10px]">
              <button
                type="button"
                onClick={() => setActiveTab("left")}
                className={`relative z-10 flex items-center justify-center w-[100px] h-[40px] rounded-[10px] font-semibold text-[18px] md:text-[20px] duration-300 ease-out ${
                  activeTab === "left"
                    ? "text-white transform scale-105"
                    : "text-subtle-dark"
                }`}
              >
                <span className="relative z-10">ซ้าย</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("right")}
                className={`relative z-10 flex items-center justify-center w-[100px] h-[40px] rounded-[10px] font-semibold text-[18px] md:text-[20px] duration-300 ease-out ${
                  activeTab === "right"
                    ? "text-white transform scale-105"
                    : "text-subtle-dark"
                }`}
              >
                <span className="relative z-10">ขวา</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("other")}
                className={`relative z-10 flex items-center justify-center w-[100px] h-[40px] rounded-[10px] font-semibold text-[18px] md:text-[20px] duration-300 ease-out ${
                  activeTab === "other"
                    ? "text-white transform scale-105"
                    : "text-subtle-dark"
                }`}
              >
                <span className="relative z-10">อื่นๆ</span>
              </button>

              {/* Sliding background */}
              <div
                className={`absolute flex justify-center h-[40px] rounded-[10px] bg-gradient-primary shadow-lg duration-300 ease-out ${
                  activeTab === "left"
                    ? "left-[4px] w-[100px]"
                    : activeTab === "right"
                    ? "left-[104px] w-[100px]"
                    : "left-[204px] w-[100px]"
                }`}
              />
            </div>
          </div>

          {/* รายการอะไหล่ที่เข้ากันได้ */}
          {compatibleParts.length > 0 && (
            <div>
              <div
                className={`flex w-[300%] transition-transform duration-300 ease-in-out will-change-transform ${
                  activeTab === "left"
                    ? "translate-x-0"
                    : activeTab === "right"
                    ? "-translate-x-1/3"
                    : "-translate-x-2/3"
                }`}
              >
                {/* Panel ซ้าย */}
                <div className="shrink-0 w-1/3">
                  {getPartsForSide("left").length === 0 ? (
                    <div className="flex justify-center items-center h-full">
                      <p className="text-[18px] md:text-[20px] text-subtle-light">
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
                          className={`flex items-center gap-[16px] px-[20px] mt-[16px] ${
                            isDisabled ? "opacity-50 cursor-not-allowed" : ""
                          }`}
                        >
                          <div
                            className={`flex justify-between items-center w-full h-[92px] px-[8px] rounded-[10px] border-2 shadow-primary cursor-pointer duration-300 ${
                              isPartSelected(part.id, "left")
                                ? "bg-primary/5 border-primary scale-[1.02]"
                                : "bg-white border-transparent hover:shadow-lg hover:scale-[1.01]"
                            }`}
                            onClick={() => {
                              if (isDisabled) return;
                              handlePartSelection(
                                part,
                                !isPartSelected(part.id, "left"),
                                "left"
                              );
                            }}
                          >
                            <div className="flex-1 flex items-center gap-[8px]">
                              <div className="flex justify-center items-center w-[70px] h-[70px] rounded-[10px] border border-subtle-light bg-white shadow-primary">
                                {part.secureUrl ? (
                                  <img
                                    src={part.secureUrl}
                                    alt={part.name}
                                    className="object-cover w-full h-full rounded-[10px]"
                                  />
                                ) : (
                                  <div className="flex justify-center items-center w-[70px] h-[70px] text-subtle-light">
                                    <Image className="w-8 h-8" />
                                  </div>
                                )}
                              </div>
                              <div className="flex flex-col flex-1">
                                {renderProductInfo(part)}
                                <div className="flex items-center gap-2">
                                  <p
                                    className={`font-semibold text-[20px] md:text-[22px] leading-tight duration-300 ${
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
                                    className="flex items-center justify-center mt-[2px] text-primary"
                                  >
                                    <SquarePen className="w-5 h-5" />
                                  </button>
                                </div>
                                {isDisabled && (
                                  <p className="font-medium text-[14px] md:text-[16px] text-red-500 leading-tight">
                                    สต็อกหมด
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                          <div
                            className={`flex items-center justify-center min-w-[32px] w-[32px] h-[32px] rounded-full cursor-pointer duration-300 ${
                              isPartSelected(part.id, "left")
                                ? "bg-gradient-primary text-surface shadow-lg scale-110"
                                : "bg-subtle-light text-surface hover:bg-gray-300 hover:scale-105"
                            }`}
                            onClick={() => {
                              if (isDisabled) return;
                              handlePartSelection(
                                part,
                                !isPartSelected(part.id, "left"),
                                "left"
                              );
                            }}
                          >
                            <Check className="w-[18px] h-[18px]" />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Panel ขวา */}
                <div className="shrink-0 w-1/3">
                  {getPartsForSide("right").length === 0 ? (
                    <div className="flex justify-center items-center h-full">
                      <p className="text-[18px] md:text-[20px] text-subtle-light">
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
                          className={`flex items-center gap-[16px] px-[20px] mt-[16px] ${
                            isDisabled ? "opacity-50 cursor-not-allowed" : ""
                          }`}
                        >
                          <div
                            className={`flex justify-between items-center w-full h-[92px] px-[8px] rounded-[10px] border-2 shadow-primary cursor-pointer duration-300 ${
                              isPartSelected(part.id, "right")
                                ? "bg-primary/5 border-primary scale-[1.02]"
                                : "bg-white border-transparent hover:shadow-lg hover:scale-[1.01]"
                            }`}
                            onClick={() => {
                              if (isDisabled) return;
                              handlePartSelection(
                                part,
                                !isPartSelected(part.id, "right"),
                                "right"
                              );
                            }}
                          >
                            <div className="flex-1 flex items-center gap-[8px]">
                              <div className="flex justify-center items-center w-[70px] h-[70px] rounded-[10px] border border-subtle-light bg-white shadow-primary">
                                {part.secureUrl ? (
                                  <img
                                    src={part.secureUrl}
                                    alt={part.name}
                                    className="object-cover w-full h-full rounded-[10px]"
                                  />
                                ) : (
                                  <div className="flex justify-center items-center w-[70px] h-[70px] text-subtle-light">
                                    <Image className="w-8 h-8" />
                                  </div>
                                )}
                              </div>
                              <div className="flex flex-col flex-1">
                                {renderProductInfo(part)}
                                <div className="flex items-center gap-2">
                                  <p
                                    className={`font-semibold text-[20px] md:text-[22px] leading-tight duration-300 ${
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
                                    className="flex items-center justify-center text-primary"
                                  >
                                    <SquarePen className="w-5 h-5" />
                                  </button>
                                </div>
                                {isDisabled && (
                                  <p className="font-medium text-[14px] md:text-[16px] text-red-500 leading-tight">
                                    สต็อกหมด
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                          <div
                            className={`flex items-center justify-center min-w-[32px] w-[32px] h-[32px] rounded-full cursor-pointer duration-300 ${
                              isPartSelected(part.id, "right")
                                ? "bg-gradient-primary text-surface shadow-lg scale-110"
                                : "bg-subtle-light text-surface hover:bg-gray-300 hover:scale-105"
                            }`}
                            onClick={() => {
                              if (isDisabled) return;
                              handlePartSelection(
                                part,
                                !isPartSelected(part.id, "right"),
                                "right"
                              );
                            }}
                          >
                            <Check className="w-[18px] h-[18px]" />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Panel อื่นๆ */}
                <div className="shrink-0 w-1/3">
                  {getPartsForSide("other").length === 0 ? (
                    <div className="flex justify-center items-center h-full">
                      <p className="text-[20px] md:text-[22px] text-subtle-light">
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
                          className={`flex items-center gap-[16px] px-[20px] mt-[16px] ${
                            isDisabled ? "opacity-50 cursor-not-allowed" : ""
                          }`}
                        >
                          <div
                            className={`flex justify-between items-center w-full h-[92px] px-[8px] rounded-[10px] border-2 shadow-primary cursor-pointer duration-300 ${
                              isPartSelected(part.id, "other")
                                ? "bg-primary/5 border-primary scale-[1.02]"
                                : "bg-white border-transparent hover:shadow-lg hover:scale-[1.01]"
                            }`}
                            onClick={() => {
                              if (isDisabled) return;
                              handlePartSelection(
                                part,
                                !isPartSelected(part.id, "other"),
                                "other"
                              );
                            }}
                          >
                            <div className="flex-1 flex items-center gap-[8px]">
                              <div className="flex justify-center items-center w-[70px] h-[70px] rounded-[10px] border border-subtle-light bg-white shadow-primary">
                                {part.secureUrl ? (
                                  <img
                                    src={part.secureUrl}
                                    alt={part.name}
                                    className="object-cover w-full h-full rounded-[10px]"
                                  />
                                ) : (
                                  <div className="flex justify-center items-center w-[70px] h-[70px] text-subtle-light">
                                    <Image className="w-8 h-8" />
                                  </div>
                                )}
                              </div>
                              <div className="flex flex-col flex-1">
                                {renderProductInfo(part)}
                                <div className="flex items-center gap-2">
                                  <p
                                    className={`font-semibold text-[20px] md:text-[22px] leading-tight duration-300 ${
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
                                    className="flex items-center justify-center text-primary"
                                  >
                                    <SquarePen className="w-5 h-5" />
                                  </button>
                                </div>
                                {isDisabled && (
                                  <p className="font-medium text-[14px] md:text-[16px] text-red-500 leading-tight">
                                    สต็อกหมด
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                          <div
                            className={`flex items-center justify-center min-w-[32px] w-[32px] h-[32px] rounded-full cursor-pointer duration-300 ${
                              isPartSelected(part.id, "other")
                                ? "bg-gradient-primary text-surface shadow-lg scale-110"
                                : "bg-subtle-light text-surface hover:bg-gray-300 hover:scale-105"
                            }`}
                            onClick={() => {
                              if (isDisabled) return;
                              handlePartSelection(
                                part,
                                !isPartSelected(part.id, "other"),
                                "other"
                              );
                            }}
                          >
                            <Check className="w-[18px] h-[18px]" />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ถ้าเลือกยี่ห้อและรุ่นแล้วแต่ไม่มีอะไหล่รองรับ ให้แสดงข้อความ */}
          {watch("brand") && watch("model") && compatibleParts.length === 0 && (
            <div className="flex justify-center items-center h-[228px]">
              <p className="text-[20px] md:text-[22px] text-subtle-light">
                ไม่มีอะไหล่รองรับ
              </p>
            </div>
          )}

          {/* รายการซ่อมเพิ่มเติม */}
          {watch("brand") && watch("model") && (
            <div className="flex justify-between items-center px-[20px] pt-[16px]">
              <p className="font-semibold text-[22px] md:text-[24px]">
                รายการซ่อมเพิ่มเติม
              </p>
              <AddRepairItemDialog
                onAddItem={handleAddItemToRepair}
                selectedItems={repairItems}
                restoredStockMap={restoredStockMap}
              >
                <p className="font-semibold text-[20px] md:text-[22px] text-primary hover:text-primary/80 cursor-pointer">
                  + เพิ่มรายการซ่อม
                </p>
              </AddRepairItemDialog>
            </div>
          )}

          {/* รายการซ่อมที่เลือก */}
          {repairItems.length === 0 && compatibleParts.length === 0 ? (
            <div>
              {/* แสดงเมื่อเลือกยี่ห้อและรุ่นแล้วแต่ไม่มีอะไหล่รองรับ */}
              {watch("brand") &&
                watch("model") &&
                compatibleParts.length === 0 && (
                  <div className="flex justify-center items-center h-[228px]">
                    <p className="text-[20px] md:text-[22px] text-subtle-light">
                      ไม่มีอะไหล่รองรับ
                    </p>
                  </div>
                )}

              {/* แสดงเมื่อยังไม่เลือกยี่ห้อหรือรุ่น */}
              {(!watch("brand") || !watch("model")) && (
                <div className="flex justify-center items-center h-[228px]">
                  <p className="text-[20px] md:text-[22px] text-subtle-light">
                    กรุณาเลือกยี่ห้อและรุ่นรถ
                  </p>
                </div>
              )}
              <div className="h-[96px]"></div>
            </div>
          ) : repairItems.length > 0 ? (
            <div className="pb-[96px]">
              {repairItems.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center gap-[16px] px-[20px] mt-[16px]"
                >
                  <div
                    role="button"
                    onClick={() => handlePriceClick(index, item)}
                    className="flex justify-between items-center w-full h-[92px] px-[8px] rounded-[10px] bg-white shadow-primary cursor-pointer"
                  >
                    <div className="flex-1 flex items-center gap-[8px]">
                      <div className="flex justify-center items-center w-[70px] h-[70px] rounded-[10px] border border-subtle-light bg-white shadow-primary">
                        {item.secureUrl ? (
                          <img
                            src={item.secureUrl}
                            alt={item.name}
                            className="object-cover w-full h-full rounded-[10px]"
                          />
                        ) : (
                          <div className="flex justify-center items-center w-[70px] h-[70px] text-subtle-light">
                            {item.partNumber && item.brand ? (
                              <Image className="w-8 h-8" />
                            ) : (
                              <Wrench className="w-8 h-8" />
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col flex-1">
                        {renderProductInfo(item)}
                        <p className="font-medium text-[16px] md:text-[18px] text-subtle-dark leading-tight">
                          ราคาต่อหน่วย:{" "}
                          {formatCurrency(Number(item.sellingPrice))}
                        </p>
                        <div className="flex items-center justify-between w-full">
                          <p className="font-semibold text-[20px] md:text-[22px] text-primary leading-tight">
                            {formatCurrency(item.quantity * item.sellingPrice)}
                          </p>
                          <div
                            className="flex items-center gap-[8px]"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              onClick={() => handleDecreaseQuantity(index)}
                              disabled={item.quantity <= 1}
                              className="flex items-center justify-center w-[32px] h-[32px] rounded-[8px] border border-gray-200 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-300"
                            >
                              <Minus className="w-[16px] h-[16px]" />
                            </button>
                            <span className="font-semibold text-[18px] md:text-[20px] text-primary">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleIncreaseQuantity(index)}
                              disabled={
                                item.partNumber && item.brand
                                  ? item.quantity >= (item.stockQuantity || 0)
                                  : false
                              }
                              className="flex items-center justify-center w-[32px] h-[32px] rounded-[8px] border border-primary/30 disabled:border-gray-200 text-primary disabled:text-gray-300 bg-primary/10 hover:bg-primary/20 disabled:bg-gray-50 disabled:hover:bg-gray-50"
                            >
                              <Plus className="w-[16px] h-[16px]" />
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
                        prev.filter((_, i) => i !== index)
                      )
                    }
                    className="text-surface"
                  >
                    <div className="flex items-center justify-center w-[32px] h-[32px] rounded-full bg-delete">
                      <Trash className="w-[18px] h-[18px]" />
                    </div>
                  </button>
                </div>
              ))}

              {/* สรุปยอดรวมทั้งหมด */}
              <div className="p-[16px] mx-[20px] mt-[16px] mb-[16px] rounded-[12px] border border-primary/20 bg-gradient-to-r from-primary/10 to-primary/5">
                <div className="flex justify-between items-center">
                  <div className="flex flex-col">
                    <p className="font-semibold text-[20px] md:text-[22px] text-subtle-dark">
                      รวม{" "}
                      {Array.from(selectedLeftParts).filter((id) =>
                        getPartsForSide("left").some((part) => part.id === id)
                      ).length +
                        Array.from(selectedRightParts).filter((id) =>
                          getPartsForSide("right").some(
                            (part) => part.id === id
                          )
                        ).length +
                        Array.from(selectedOtherParts).filter((id) =>
                          getPartsForSide("other").some(
                            (part) => part.id === id
                          )
                        ).length +
                        getRepairItemsCountExcludingLabor()}{" "}
                      รายการ
                    </p>
                  </div>
                  <div className="flex flex-col items-end">
                    <p className="font-semibold text-[24px] md:text-[26px] text-primary">
                      {formatCurrency(
                        // รวมราคาจากอะไหล่ที่เลือกจาก compatibleParts (กรองตาม suspensionType)
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
                          }, 0) +
                          // บวกกับรายการซ่อมที่เพิ่มเอง
                          repairItems.reduce(
                            (total, item) =>
                              total + item.sellingPrice * item.quantity,
                            0
                          )
                      )}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-center pb-[16px]">
                <FormButton
                  label="ถัดไป"
                  isLoading={isLoading}
                  disabled={
                    Array.from(selectedLeftParts).filter((id) =>
                      getPartsForSide("left").some((part) => part.id === id)
                    ).length +
                      Array.from(selectedRightParts).filter((id) =>
                        getPartsForSide("right").some((part) => part.id === id)
                      ).length +
                      Array.from(selectedOtherParts).filter((id) =>
                        getPartsForSide("other").some((part) => part.id === id)
                      ).length ===
                    0
                  }
                />
              </div>
            </div>
          ) : (
            <div>
              {/* สรุปยอดรวมทั้งหมด - แสดงเสมอแม้ไม่มีการเลือก */}
              <div className="p-[16px] mx-[20px] mt-[16px] mb-[16px] rounded-[12px] border border-primary/20 bg-gradient-to-r from-primary/10 to-primary/5">
                <div className="flex justify-between items-center">
                  <div className="flex flex-col">
                    <p className="font-semibold text-[20px] md:text-[22px] text-subtle-dark">
                      รวม{" "}
                      {Array.from(selectedLeftParts).filter((id) =>
                        getPartsForSide("left").some((part) => part.id === id)
                      ).length +
                        Array.from(selectedRightParts).filter((id) =>
                          getPartsForSide("right").some(
                            (part) => part.id === id
                          )
                        ).length +
                        Array.from(selectedOtherParts).filter((id) =>
                          getPartsForSide("other").some(
                            (part) => part.id === id
                          )
                        ).length}{" "}
                      รายการ
                    </p>
                  </div>
                  <div className="flex flex-col items-end">
                    <p className="font-semibold text-[24px] md:text-[26px] text-primary">
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
                          }, 0)
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
                      getPartsForSide("left").some((part) => part.id === id)
                    ).length +
                      Array.from(selectedRightParts).filter((id) =>
                        getPartsForSide("right").some((part) => part.id === id)
                      ).length +
                      Array.from(selectedOtherParts).filter((id) =>
                        getPartsForSide("other").some((part) => part.id === id)
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

export default Suspension;
