import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Image,
  Trash,
  Plus,
  Minus,
  ChevronDown,
  User,
  ClipboardList,
} from "lucide-react";
import FormInput from "@/components/forms/FormInput";
import LicensePlateInput from "@/components/forms/LicensePlateInput";
import AddRepairItemDialog from "@/components/dialogs/AddRepairItemDialog";
import EditPriceDialog from "@/components/dialogs/EditNamePriceDialog";
import FormButton from "@/components/forms/FormButton";
import ComboBox from "@/components/ui/ComboBox";
import { getVehicleBrandModels } from "@/api/vehicleBrandModel";
import { repairSchema } from "@/utils/schemas";
import { PROVINCES } from "@/constants/provinces";
import { formatCurrency } from "@/utils/formats";

const CreateRepair = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { register, handleSubmit, formState, setValue, watch, setFocus } =
    useForm({
      resolver: zodResolver(repairSchema),
    });
  const [isCustomerInfoOpen, setIsCustomerInfoOpen] = useState(false);
  const [repairItems, setRepairItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [vehicleBrandModels, setVehicleBrandModels] = useState([]);
  const [brands, setBrands] = useState([]);
  const [restoredStockMap, setRestoredStockMap] = useState({});
  const [priceDialogOpen, setPriceDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const { errors } = formState;

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchVehicleBrandModels();
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
        setRepairItems(savedItems);

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
      }

      if (location.state.scrollToBottom) {
        setTimeout(() => {
          window.scrollTo({
            top: document.body.scrollHeight,
            behavior: "smooth",
          });
        }, 200);
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

  const getAvailableModelsForBrand = () => {
    const selectedBrand = watch("brand");
    const modelsForBrand = vehicleBrandModels
      .filter((item) => item.brand === selectedBrand)
      .map((item) => ({ id: item.model, name: item.model }));

    return modelsForBrand;
  };

  const renderProductInfo = (item) => {
    const isTire = item.category?.name === "ยาง";

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

  const onSubmit = async (data) => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));

    navigate("/repairs/summary", {
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

  const handleAddItemToRepair = (item) => {
    setRepairItems((prev) => {
      const index = prev.findIndex(
        (i) =>
          i.partNumber === item.partNumber &&
          i.brand === item.brand &&
          i.name === item.name,
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
            ...item,
            quantity: 1,
            sellingPrice: item.sellingPrice,
            stockQuantity: item.stockQuantity,
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
    <div className="shadow-primary flex min-h-[100svh] flex-col xl:min-h-[calc(100vh-73px)] xl:flex-row xl:items-start xl:gap-[16px] xl:bg-transparent xl:px-[16px] xl:pt-[24px] xl:pb-[24px] xl:shadow-none">
      <div className="xl:shadow-primary flex flex-1 flex-col xl:h-fit xl:w-1/2 xl:flex-initial xl:rounded-2xl xl:bg-white">
        <div className="flex items-center gap-[8px] px-[20px] pt-[16px]">
          <div className="bg-surface/20 xl:bg-primary/10 flex h-[40px] w-[40px] items-center justify-center rounded-full">
            <Plus color="#ffffff" className="xl:hidden" />
            <Plus className="text-primary hidden xl:block" />
          </div>
          <div>
            <p className="text-surface xl:text-primary text-[24px] font-semibold md:text-[26px]">
              รายการซ่อมใหม่
            </p>
          </div>
        </div>
        <form
          id="repair-form"
          className="xl:[&_label]:text-normal xl:[&_.text-surface]:text-normal flex flex-1 flex-col"
          onSubmit={handleSubmit(onSubmit, onInvalid)}
        >
          {/* ข้อมูลลูกค้า */}
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

            {/* ข้อมูลลูกค้า ที่ซ่อน/แสดง */}
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
                  inputMode="numeric"
                  onInput={(e) => {
                    e.target.value = e.target.value
                      .replace(/[^ก-ฮ0-9]/g, "")
                      .slice(0, 3);
                  }}
                />
              </div>
              <p className="text-surface pt-[8px] text-[18px] font-medium">-</p>
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

          {/* Mobile: รายการซ่อม */}
          <div className="bg-surface shadow-primary mt-[16px] flex w-full flex-1 flex-col rounded-tl-2xl rounded-tr-2xl xl:hidden">
            <div className="flex items-center justify-between px-[20px] pt-[16px]">
              <p className="text-[22px] font-semibold md:text-[24px]">
                รายการซ่อม
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
            {repairItems.length === 0 ? (
              <div>
                <div className="flex h-[228px] items-center justify-center xl:h-auto">
                  <p className="text-subtle-light text-[20px] md:text-[22px]">
                    กรุณาเพิ่มรายการซ่อม
                  </p>
                </div>
                <div className="pb-[92px]" />
              </div>
            ) : (
              <div className="pb-[20px]">
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
                              <Image className="h-8 w-8" />
                            </div>
                          )}
                        </div>
                        <div className="flex flex-1 flex-col">
                          {renderProductInfo(item)}
                          <div className="flex items-center gap-[4px]">
                            <p className="text-subtle-dark text-[16px] leading-tight font-medium md:text-[18px]">
                              ราคาต่อหน่วย:
                            </p>
                            <p className="text-primary text-[16px] font-medium md:text-[18px]">
                              {formatCurrency(Number(item.sellingPrice))}
                            </p>
                          </div>
                          <div className="flex w-full items-center justify-between">
                            <p className="text-primary line-clamp-1 text-[20px] leading-tight font-semibold md:text-[22px]">
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
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDecreaseQuantity(index);
                                }}
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
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleIncreaseQuantity(index);
                                }}
                                disabled={
                                  item.partNumber && item.brand
                                    ? item.quantity >= (item.stockQuantity || 0)
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
                <div className="border-primary/20 from-primary/10 to-primary/5 mx-[20px] my-[16px] rounded-[12px] border bg-gradient-to-r p-[16px]">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <p className="text-subtle-dark text-[20px] font-semibold md:text-[22px]">
                        รวม {repairItems.length} รายการ
                      </p>
                    </div>
                    <div className="flex flex-col items-end">
                      <p className="text-primary text-[24px] font-semibold md:text-[26px]">
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
          <div className="flex items-center justify-between px-[20px] pt-[16px]">
            <div className="flex items-center gap-[8px]">
              <div className="bg-primary/10 flex h-[40px] w-[40px] items-center justify-center rounded-full">
                <ClipboardList className="text-primary h-6 w-6" />
              </div>
              <p className="text-[22px] font-semibold md:text-[24px]">
                รายการซ่อม
              </p>
            </div>
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
          {repairItems.length === 0 ? (
            <div>
              <div className="flex h-[228px] items-center justify-center">
                <p className="text-subtle-light text-[20px] md:text-[22px]">
                  กรุณาเพิ่มรายการซ่อม
                </p>
              </div>
            </div>
          ) : (
            <div>
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
                            <Image className="h-8 w-8" />
                          </div>
                        )}
                      </div>
                      <div className="flex flex-1 flex-col">
                        {renderProductInfo(item)}
                        <div className="flex items-center gap-[4px]">
                          <p className="text-subtle-dark text-[16px] leading-tight font-medium md:text-[18px]">
                            ราคาต่อหน่วย:
                          </p>
                          <p className="text-primary text-[16px] font-medium md:text-[18px]">
                            {formatCurrency(Number(item.sellingPrice))}
                          </p>
                        </div>
                        <div className="flex w-full items-center justify-between">
                          <p className="text-primary line-clamp-1 text-[20px] leading-tight font-semibold md:text-[22px]">
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
                              className="flex h-[32px] w-[32px] cursor-pointer items-center justify-center rounded-[8px] border border-gray-200 bg-gray-100 disabled:bg-gray-50 disabled:text-gray-300"
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                            <p className="text-primary text-[18px] font-semibold md:text-[20px]">
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

              {/* Desktop: สรุปยอดรวม */}
              <div className="border-primary/20 from-primary/10 to-primary/5 mx-[20px] my-[16px] rounded-[12px] border bg-gradient-to-r p-[16px]">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <p className="text-subtle-dark text-[20px] font-semibold md:text-[22px]">
                      รวม {repairItems.length} รายการ
                    </p>
                  </div>
                  <div className="flex flex-col items-end">
                    <p className="text-primary text-[24px] font-semibold md:text-[26px]">
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
