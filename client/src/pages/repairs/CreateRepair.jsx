import { useForm } from "react-hook-form";
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import FormInput from "@/components/forms/FormInput";
import LicensePlateInput from "@/components/forms/LicensePlateInput";
import AddRepairItemDialog from "@/components/dialogs/AddRepairItemDialog";
import FormButton from "@/components/forms/FormButton";
import ComboBox from "@/components/ui/ComboBox";
import { formatCurrency } from "@/lib/utils";
import { Image, Trash, Plus, Minus, AlertCircle } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { repairSchema } from "@/utils/schemas";
import { provinces } from "@/utils/data";
import { getVehicleBrandModels } from "@/api/vehicleBrandModel";

const CreateRepair = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { register, handleSubmit, formState, setValue, watch, setFocus } =
    useForm({
      resolver: zodResolver(repairSchema),
    });
  const [repairItems, setRepairItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [vehicleBrandModels, setVehicleBrandModels] = useState([]);
  const [brands, setBrands] = useState([]);
  const { errors } = formState;

  useEffect(() => {
    window.scrollTo(0, 0);
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

        if (scrollToBottom) {
          setTimeout(() => {
            window.scrollTo({
              top: document.body.scrollHeight,
              behavior: "smooth",
            });
          }, 100);
        }
      }

      // ลบ state ออกจาก history
      window.history.replaceState({}, document.title, window.location.pathname);
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
            window.scrollTo({
              top: document.body.scrollHeight,
              behavior: "smooth",
            });
          }, 100);
        }
      }

      // ลบ state ออกจาก history
      window.history.replaceState({}, document.title, window.location.pathname);
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
      if (savedItems) {
        setRepairItems(savedItems);
      }
    } else {
      window.scrollTo(0, 0);
    }
  }, [location.state, setValue]);

  const onSubmit = async (data) => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 250));

    navigate("/repair/summary", {
      state: {
        repairData: data,
        repairItems: repairItems,
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
          behavior: "auto",
          block: "nearest",
          inline: "nearest",
        });
      }
    }, 50);
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

  return (
    <div className="w-full h-full bg-gradient-primary shadow-primary">
      <p className="pt-[16px] pl-[20px] font-semibold text-[24px] md:text-[26px] text-surface">
        รายการซ่อมใหม่
      </p>
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
                inputMode="numeric"
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
              {/* Hidden input สำหรับ register */}
              <input
                {...register("province")}
                type="hidden"
                value={watch("province") || ""}
              />
            </div>
          </div>

          {/* ข้อความ error ของป้ายทะเบียนรถ */}
          {(errors.plateLetters || errors.plateNumbers || errors.province) && (
            <div className="space-y-[4px] mt-[6px]">
              {errors.plateLetters && (
                <div className="flex items-center gap-[4px] px-[4px]">
                  <AlertCircle className="flex-shrink-0 w-4 h-4 text-delete" />
                  <p className="font-medium text-[18px] md:text-[20px] text-delete">
                    {errors.plateLetters.message}
                  </p>
                </div>
              )}
              {errors.plateNumbers && (
                <div className="flex items-center gap-[4px] px-[4px]">
                  <AlertCircle className="flex-shrink-0 w-4 h-4 text-delete" />
                  <p className="font-medium text-[18px] md:text-[20px] text-delete">
                    {errors.plateNumbers.message}
                  </p>
                </div>
              )}
              {errors.province && (
                <div className="flex items-center gap-[4px] px-[4px]">
                  <AlertCircle className="flex-shrink-0 w-4 h-4 text-delete" />
                  <p className="font-medium text-[18px] md:text-[20px] text-delete">
                    {errors.province.message}
                  </p>
                </div>
              )}
            </div>
          )}
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

        <div className="w-full h-full mt-[30px] rounded-tl-2xl rounded-tr-2xl bg-surface shadow-primary">
          <div className="flex justify-between items-center px-[20px] pt-[20px]">
            <p className="font-semibold text-[22px] md:text-[24px]">
              รายการซ่อม
            </p>
            <AddRepairItemDialog
              onAddItem={handleAddItemToRepair}
              selectedItems={repairItems}
            >
              <p className="font-semibold text-[20px] md:text-[22px] text-primary hover:text-primary/80 cursor-pointer">
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
              <div className="h-[96px]"></div>
            </div>
          ) : (
            <div className="pb-[20px]">
              {repairItems.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center gap-[16px] px-[20px] mt-[16px]"
                >
                  <div className="flex justify-between items-center w-full h-[92px] px-[8px] rounded-[10px] bg-white shadow-primary">
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
                        <p className="font-medium text-[16px] md:text-[18px] text-subtle-dark leading-tight">
                          ราคาต่อหน่วย:{" "}
                          {formatCurrency(Number(item.sellingPrice))}
                        </p>
                        <div className="flex items-center justify-between w-full">
                          <p className="font-semibold text-[20px] md:text-[22px] text-primary leading-tight">
                            {formatCurrency(item.quantity * item.sellingPrice)}
                          </p>
                          <div className="flex items-center gap-[8px]">
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

              {/* สรุปยอดรวม */}
              <div className="p-[16px] mx-[20px] mt-[20px] mb-[16px] rounded-[12px] border border-primary/20 bg-gradient-to-r from-primary/10 to-primary/5">
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
              <div className="flex justify-center pb-[92px]">
                <FormButton label="ถัดไป" isLoading={isLoading} />
              </div>
            </div>
          )}
        </div>
      </form>
    </div>
  );
};

export default CreateRepair;
