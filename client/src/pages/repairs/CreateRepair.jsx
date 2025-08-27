import { useForm } from "react-hook-form";
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import FormInput from "@/components/forms/FormInput";
import LicensePlateInput from "@/components/forms/LicensePlateInput";
import AddRepairItemDialog from "@/components/dialogs/AddRepairItemDialog";
import FormButton from "@/components/forms/FormButton";
import { formatCurrency } from "@/lib/utils";
import { Image, Trash, Plus, Minus, AlertCircle } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { repairSchema } from "@/utils/schemas";

const CreateRepair = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { register, handleSubmit, reset, formState, setValue } = useForm({
    resolver: zodResolver(repairSchema),
  });
  const [repairItems, setRepairItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const { errors } = formState;

  const renderProductInfo = (item) => {
    const isTire = item.category?.name === "ยาง";

    // แสดงข้อมูลยางที่มีขนาดแก้มยาง
    if (isTire && item.typeSpecificData && item.typeSpecificData.aspectRatio) {
      return (
        <p className="max-w-[180px] font-semibold text-[14px] text-normal truncate">
          {item.brand} {item.typeSpecificData.width}/
          {item.typeSpecificData.aspectRatio}R
          {item.typeSpecificData.rimDiameter} {item.name}
        </p>
      );
    }

    // แสดงข้อมูลยางที่ไม่มีขนาดแก้มยาง
    if (isTire && item.typeSpecificData) {
      return (
        <p className="max-w-[180px] font-semibold text-[14px] text-normal truncate">
          {item.brand} {item.typeSpecificData.width}R
          {item.typeSpecificData.rimDiameter} {item.name}
        </p>
      );
    }

    // แสดงข้อมูลอะไหล่หรือบริการ
    return (
      <p className="max-w-[180px] font-semibold text-[14px] text-normal truncate">
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

      // ตรวจสอบว่าต้อง scroll ไปล่างหรือไม่
      if (scrollToBottom) {
        setTimeout(() => {
          window.scrollTo({
            top: document.documentElement.scrollHeight,
            behavior: "smooth",
          });
        }, 100);
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
      <p className="pt-[16px] pl-[20px] font-semibold text-[22px] text-surface">
        รายการซ่อมใหม่
      </p>
      <form onSubmit={handleSubmit(onSubmit)}>
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
          placeholder="เช่น 123/45 หมู่ 2 ต.บางพลี อ.บางพลี จ.สมุทรปราการ"
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
        <FormInput
          register={register}
          name="brand"
          label="ยี่ห้อรถ"
          type="text"
          placeholder="เช่น Toyota, Isuzu, Honda"
          color="surface"
          errors={errors}
        />
        <FormInput
          register={register}
          name="model"
          label="รุ่นรถ"
          type="text"
          placeholder="เช่น Hilux Revo, D-Max, City"
          color="surface"
          errors={errors}
        />

        {/* ป้ายทะเบียนรถ */}
        <div className="px-[20px] pt-[16px]">
          <p className="mb-[8px] font-medium text-[18px] text-surface">
            ทะเบียนรถ
          </p>
          <div className="flex gap-[12px] items-start">
            <div className="w-[80px]">
              <LicensePlateInput
                register={register}
                name="plateLetters"
                placeholder="กค"
                maxLength={3}
                errosr={errors}
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
                placeholder="9876"
                maxLength={4}
                errors={errors}
                onInput={(e) => {
                  e.target.value = e.target.value
                    .replace(/[^0-9]/g, "")
                    .slice(0, 4);
                }}
              />
            </div>
            <div className="flex-1">
              <LicensePlateInput
                register={register}
                name="province"
                placeholder="สมุทรปราการ"
                errors={errors}
              />
            </div>
          </div>

          {/* ข้อความ error ของป้ายทะเบียนรถ */}
          {(errors.plateLetters || errors.plateNumbers || errors.province) && (
            <div className="space-y-[4px] mt-[6px]">
              {errors.plateLetters && (
                <div className="flex items-center gap-[4px] px-[4px]">
                  <AlertCircle className="flex-shrink-0 w-4 h-4 text-delete" />
                  <p className="font-medium text-[14px] text-delete">
                    {errors.plateLetters.message}
                  </p>
                </div>
              )}
              {errors.plateNumbers && (
                <div className="flex items-center gap-[4px] px-[4px]">
                  <AlertCircle className="flex-shrink-0 w-4 h-4 text-delete" />
                  <p className="font-medium text-[14px] text-delete">
                    {errors.plateNumbers.message}
                  </p>
                </div>
              )}
              {errors.province && (
                <div className="flex items-center gap-[4px] px-[4px]">
                  <AlertCircle className="flex-shrink-0 w-4 h-4 text-delete" />
                  <p className="font-medium text-[14px] text-delete">
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
            <p className="font-semibold text-[22px]">รายการซ่อม</p>
            <AddRepairItemDialog
              onAddItem={handleAddItemToRepair}
              selectedItems={repairItems}
            >
              <p className="font-semibold text-[18px] text-primary hover:text-primary/80 cursor-pointer">
                + เพิ่มรายการซ่อม
              </p>
            </AddRepairItemDialog>
          </div>

          {/* รายการซ่อม */}
          {repairItems.length === 0 ? (
            <div>
              <div className="flex justify-center items-center h-[228px]">
                <p className="text-[18px] text-subtle-light">ไม่มีรายการซ่อม</p>
              </div>
              <div className="h-[88px]"></div>
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
                      <div className="flex justify-center items-center w-[60px] h-[60px] rounded-[10px] border border-subtle-light bg-white shadow-primary">
                        {item.secureUrl ? (
                          <img
                            src={item.secureUrl}
                            alt={item.name}
                            className="object-cover w-full h-full rounded-[10px]"
                          />
                        ) : (
                          <div className="flex justify-center items-center w-[60px] h-[60px] text-subtle-light">
                            <Image className="w-8 h-8" />
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col flex-1">
                        {renderProductInfo(item)}
                        <p className="font-medium text-[12px] text-subtle-dark">
                          ราคาต่อหน่วย:{" "}
                          {formatCurrency(Number(item.sellingPrice))}
                        </p>
                        <div className="flex items-center justify-between w-full">
                          <p className="font-semibold text-[16px] text-primary">
                            {formatCurrency(item.quantity * item.sellingPrice)}
                          </p>
                          <div className="flex items-center gap-[8px]">
                            <button
                              type="button"
                              onClick={() => handleDecreaseQuantity(index)}
                              disabled={item.quantity <= 1}
                              className="flex items-center justify-center w-[28px] h-[28px] rounded-[8px] border border-gray-200 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-300"
                            >
                              <Minus className="w-[14px] h-[14px]" />
                            </button>
                            <span className="font-semibold text-[14px] text-primary">
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
                              className="flex items-center justify-center w-[28px] h-[28px] rounded-[8px] border border-primary/30 disabled:border-gray-200 text-primary disabled:text-gray-300 bg-primary/10 hover:bg-primary/20 disabled:bg-gray-50 disabled:hover:bg-gray-50"
                            >
                              <Plus className="w-[14px] h-[14px]" />
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
                    <p className="font-semibold text-[18px] text-subtle-dark">
                      รวม {repairItems.length} รายการ
                    </p>
                  </div>
                  <div className="flex flex-col items-end">
                    <p className="font-semibold text-[22px] text-primary">
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
              <div className="flex justify-center pb-[72px]">
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
