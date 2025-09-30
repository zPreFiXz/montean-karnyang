import { useForm } from "react-hook-form";
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import FormInput from "@/components/forms/FormInput";
import LicensePlateInput from "@/components/forms/LicensePlateInput";
import AddRepairItemDialog from "@/components/dialogs/AddRepairItemDialog";
import EditPriceDialog from "@/components/dialogs/EditNamePriceDialog";
import FormButton from "@/components/forms/FormButton";
import ComboBox from "@/components/ui/ComboBox";
import { formatCurrency } from "@/lib/utils";
import { Image, Trash, Plus, Minus } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { repairSchema } from "@/utils/schemas";
import { provinces } from "@/utils/data";
import { getVehicleBrandModels } from "@/api/vehicleBrandModel";
import { scrollMainToBottom, scrollMainToTop } from "@/lib/utils";

const CreateRepair = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { register, handleSubmit, formState, setValue, watch, setFocus } =
    useForm({
      resolver: zodResolver(repairSchema),
    });
  const isFullNameFilled = Boolean(watch("fullName")?.trim());
  const [repairItems, setRepairItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [vehicleBrandModels, setVehicleBrandModels] = useState([]);
  const [brands, setBrands] = useState([]);
  const [restoredStockMap, setRestoredStockMap] = useState({});
  const [priceDialogOpen, setPriceDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const { errors } = formState;

  useEffect(() => {
    scrollMainToTop();
    fetchVehicleBrandModels();
  }, []);

  // กู้คืนข้อมูลเมื่อกลับมาจากหน้าสรุป
  useEffect(() => {
    if (location.state) {
      const {
        repairData,
        repairItems: savedItems,
        scrollToBottom,
      } = location.state;

      if (repairData) {
        Object.keys(repairData).forEach((key) => {
          setValue(key, repairData[key]);
        });
      }

      if (savedItems && savedItems.length > 0) {
        setRepairItems(savedItems);

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

        if (scrollToBottom) {
          setTimeout(() => {
            scrollMainToBottom();
          }, 200);
        }
      }

      // ลบ state ออกจาก history แต่คงข้อมูล edit และแหล่งที่มาไว้
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
        window.location.pathname
      );
    }
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

  // กู้คืนข้อมูลเมื่อกลับมาจากหน้าสรุป
  useEffect(() => {
    if (location.state) {
      const {
        repairData,
        repairItems: savedItems,
        scrollToBottom,
      } = location.state;

      if (repairData) {
        Object.keys(repairData).forEach((key) => {
          setValue(key, repairData[key]);
        });
      }

      if (savedItems && savedItems.length > 0) {
        setRepairItems(savedItems);

        if (scrollToBottom) {
          setTimeout(() => {
            scrollMainToBottom();
          }, 200);
        }
      }

      // ลบ state ออกจาก history แต่คงข้อมูล edit และแหล่งที่มาไว้
      const preserved2 = {
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
        preserved2,
        document.title,
        window.location.pathname
      );
    }
  }, [location.state, setValue]);

  const getAvailableModelsForBrand = () => {
    const selectedBrand = watch("brand");
    const modelsForBrand = vehicleBrandModels
      .filter((item) => item.brand === selectedBrand)
      .map((item) => ({ id: item.model, name: item.model }));

    return modelsForBrand;
  };

  const renderProductInfo = (item) => {
    const isTire = item.category?.name === "ยาง";

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

  // กู้คืนข้อมูลเมื่อกลับมาจากหน้าสรุป
  useEffect(() => {
    if (location.state) {
      const { repairData, repairItems: savedItems } = location.state;

      if (repairData) {
        Object.keys(repairData).forEach((key) => {
          setValue(key, repairData[key]);
        });
      }
      if (savedItems) {
        setRepairItems(savedItems);
      }
    } else {
      scrollMainToTop();
    }
  }, [location.state, setValue]);

  const onSubmit = async (data) => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));

    navigate("/repair/summary", {
      state: {
        repairData: { ...data, source: "GENERAL" },
        repairItems: repairItems,
        editRepairId: location.state?.editRepairId,
        origin: location.state?.origin || location.state?.from,
        statusSlug: location.state?.statusSlug,
        vehicleId: location.state?.vehicleId,
        from: "create",
      },
    });
    setIsLoading(false);
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
    }, 200);
  };

  const handleAddItemToRepair = (item) => {
    setRepairItems((prev) => {
      // หาตำแหน่งรายการที่ซ้ำกัน (เช็คจาก partNumber และ brand ถ้ามี)
      const index = prev.findIndex(
        (i) =>
          i.partNumber === item.partNumber &&
          i.brand === item.brand &&
          i.name === item.name
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
            ...item,
            quantity: 1,
            sellingPrice: item.sellingPrice,
            stockQuantity: item.stockQuantity,
          },
        ];
      }
    });

    setTimeout(() => {
      scrollMainToBottom();
    }, 200);
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
            : item
        )
      );
    }
  };

  const getProductName = (item) => {
    const isTire = item.category?.name === "ยาง";

    if (isTire && item.typeSpecificData && item.typeSpecificData.aspectRatio) {
      return `${item.brand} ${item.typeSpecificData.width}/${item.typeSpecificData.aspectRatio}R${item.typeSpecificData.rimDiameter} ${item.name}`;
    }

    if (isTire && item.typeSpecificData) {
      return `${item.brand} ${item.typeSpecificData.width}R${item.typeSpecificData.rimDiameter} ${item.name}`;
    }

    return `${item.brand} ${item.name}`;
  };

  return (
    <div className="w-full min-h-dvh flex flex-col bg-gradient-primary shadow-primary">
      <div className="flex items-center gap-[8px] pt-[16px] pl-[20px]">
        <div className="flex items-center justify-center w-[40px] h-[40px] rounded-full bg-surface/20">
          <Plus color="#ffffff" />
        </div>
        <div>
          <p className="font-semibold text-[24px] md:text-[26px] text-surface">
            รายการซ่อมใหม่
          </p>
        </div>
      </div>

      <form
        className="flex-1 flex flex-col"
        onSubmit={handleSubmit(onSubmit, onInvalid)}
      >
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
          disabled={!isFullNameFilled}
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
          disabled={!isFullNameFilled}
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
                inputMode="numeric"
                onInput={(e) => {
                  e.target.value = e.target.value
                    .replace(/[^ก-ฮ0-9]/g, "")
                    .slice(0, 3);
                }}
              />
            </div>
            <p className="pt-[8px] font-medium text-[18px] text-surface">-</p>
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

        <div className="flex-1 xl:flex-none w-full mt-[16px] rounded-tl-2xl rounded-tr-2xl bg-surface shadow-primary">
          <div className="flex justify-between items-center px-[20px] pt-[16px]">
            <p className="font-semibold text-[22px] md:text-[24px]">
              รายการซ่อม
            </p>
            <AddRepairItemDialog
              onAddItem={handleAddItemToRepair}
              selectedItems={repairItems}
              restoredStockMap={restoredStockMap}
            >
              <p className="font-semibold text-[20px] md:text-[22px] text-primary cursor-pointer">
                + เพิ่มรายการซ่อม
              </p>
            </AddRepairItemDialog>
          </div>

          {/* รายการซ่อม */}
          {repairItems.length === 0 ? (
            <div>
              <div className="flex justify-center items-center h-[228px]">
                <p className="text-[20px] md:text-[22px] text-subtle-light">
                  กรุณาเพิ่มรายการซ่อม
                </p>
              </div>
              <div className="h-[96px] lg:h-0"></div>
            </div>
          ) : (
            <div className="pb-[20px]">
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
                            <Image className="w-8 h-8" />
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col flex-1">
                        {renderProductInfo(item)}
                        <div className="flex items-center gap-[4px]">
                          <p className="font-medium text-[16px] md:text-[18px] text-subtle-dark leading-tight">
                            ราคาต่อหน่วย:
                          </p>
                          <p className="font-medium text-[16px] md:text-[18px] text-primary">
                            {formatCurrency(Number(item.sellingPrice))}
                          </p>
                        </div>
                        <div className="flex items-center justify-between w-full">
                          <p className="font-semibold text-[20px] md:text-[22px] text-primary leading-tight line-clamp-1">
                            {formatCurrency(item.quantity * item.sellingPrice)}
                          </p>
                          <div
                            className="flex items-center gap-[8px]"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDecreaseQuantity(index);
                              }}
                              disabled={item.quantity <= 1}
                              className="flex items-center justify-center w-[32px] h-[32px] rounded-[8px] border border-gray-200 bg-gray-100 disabled:bg-gray-50 disabled:text-gray-300 cursor-pointer"
                            >
                              <Minus className="w-[16px] h-[16px]" />
                            </button>
                            <p className="font-semibold text-[18px] md:text-[20px] text-primary">
                              {item.quantity}
                            </p>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleIncreaseQuantity(index);
                              }}
                              disabled={
                                item.partNumber && item.brand
                                  ? item.quantity >= (item.stockQuantity || 0)
                                  : false
                              }
                              className="flex items-center justify-center w-[32px] h-[32px] rounded-[8px] border border-primary/30 disabled:border-gray-200 text-primary disabled:text-gray-300 bg-primary/10 disabled:bg-gray-50 cursor-pointer"
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
                    className="text-surface cursor-pointer"
                  >
                    <div className="flex items-center justify-center w-[32px] h-[32px] rounded-full bg-delete">
                      <Trash className="w-[18px] h-[18px]" />
                    </div>
                  </button>
                </div>
              ))}

              {/* สรุปยอดรวม */}
              <div className="p-[16px] mx-[20px] my-[16px] rounded-[12px] border border-primary/20 bg-gradient-to-r from-primary/10 to-primary/5">
                <div className="flex justify-between items-center">
                  <div className="flex flex-col">
                    <p className="font-semibold text-[20px] md:text-[22px] text-subtle-dark">
                      รวม {repairItems.length} รายการ
                    </p>
                  </div>
                  <div className="flex flex-col items-end">
                    <p className="font-semibold text-[24px] md:text-[26px] text-primary">
                      {formatCurrency(
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
              <div className="flex justify-center pb-[92px] xl:pb-0">
                <FormButton label="ถัดไป" isLoading={isLoading} />
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

export default CreateRepair;
