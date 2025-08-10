import { useForm } from "react-hook-form";
import { useState } from "react";
import FormInput from "@/components/forms/FormInput";
import LicensePlateInput from "@/components/forms/LicensePlateInput";
import AddRepairItemDialog from "@/components/dialogs/AddRepairItemDialog";
import api from "@/lib/api";
import { toast } from "sonner";
import FormButton from "@/components/forms/FormButton";
import { Image, Trash, Plus, Minus } from "lucide-react";

const CreateRepair = () => {
  const { register, handleSubmit, reset } = useForm();
  const [repairItems, setRepairItems] = useState([]);

  const onSubmit = async (data) => {
    try {
      const totalPrice = repairItems.reduce(
        (total, item) => total + item.sellingPrice * item.quantity,
        0
      );

      await api.post("/api/repair", {
        firstName: data.firstName,
        lastName: data.lastName,
        address: data.address,
        phoneNumber: data.phoneNumber,
        brand: data.brand,
        model: data.model,
        plateNumber: `${data.plate_letters}-${data.plate_numbers}`,
        province: data.province,
        description: data.description,
        totalPrice: totalPrice,
        repairItems: repairItems.map((item) => ({
          ...(item.partNumber && item.brand
            ? { partId: item.id }
            : { serviceId: item.id }),
          unitPrice: item.sellingPrice,
          quantity: item.quantity,
        })),
      });

      toast.success("บันทึกข้อมูลเรียบร้อยแล้ว!");
    } catch (error) {
      console.error(error);
    }
  };

  const handleAddItemToRepair = (item) => {
    setRepairItems((prev) => [
      ...prev,
      { ...item, quantity: 1, sellingPrice: item.sellingPrice },
    ]);
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
          name="firstName"
          label="ชื่อลูกค้า"
          placeholder="เช่น สมชาย"
          color="surface"
        />
        <FormInput
          register={register}
          name="lastName"
          label="นามสกุล"
          placeholder="เช่น ใจดี"
          color="surface"
        />
        <FormInput
          register={register}
          name="address"
          label="ที่อยู่"
          placeholder="เช่น 123/45 หมู่ 2 ต.บางพลี อ.บางพลี จ.สมุทรปราการ"
          color="surface"
        />
        <FormInput
          register={register}
          name="phoneNumber"
          label="หมายเลขโทรศัพท์"
          placeholder="เช่น 0812345678"
          color="surface"
        />
        <FormInput
          register={register}
          name="brand"
          label="ยี่ห้อรถ"
          placeholder="เช่น Toyota, Isuzu, Honda"
          color="surface"
        />
        <FormInput
          register={register}
          name="model"
          label="รุ่นรถ"
          placeholder="เช่น Hilux Revo, D-Max, City"
          color="surface"
        />

        {/* License Plate */}
        <div className="px-[20px] pt-[16px]">
          <p className="font-medium text-[18px] text-surface mb-[8px]">
            ทะเบียนรถ
          </p>
          <div className="flex gap-[12px] items-center">
            <div className="w-[80px]">
              <LicensePlateInput
                register={register}
                name="plate_letters"
                placeholder="กค"
                maxLength={3}
                onInput={(e) => {
                  e.target.value = e.target.value
                    .replace(/[^ก-ฮ0-9]/g, "")
                    .slice(0, 3);
                }}
              />
            </div>
            <span className="text-surface font-medium text-[18px]">-</span>
            <div className="w-[80px]">
              <LicensePlateInput
                register={register}
                name="plate_numbers"
                placeholder="9876"
                pattern="[0-9]*"
                maxLength={4}
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
              />
            </div>
          </div>
        </div>

        <FormInput
          register={register}
          name="description"
          label="รายละเอียดการซ่อม"
          placeholder="เช่น เบรคติด, สตาร์ทไม่ติด, มีเสียงดังจากล้อหน้า"
          color="surface"
        />

        <div className="w-full h-full mt-[30px] rounded-tl-2xl rounded-tr-2xl bg-surface shadow-primary">
          <div className="flex justify-between items-center px-[20px] pt-[20px]">
            <p className="font-semibold text-[22px]">รายการซ่อม</p>
            <AddRepairItemDialog onAddItem={handleAddItemToRepair}>
              <p className="font-semibold text-[18px] text-primary  hover:text-primary/80 cursor-pointer">
                + เพิ่มรายการซ่อม
              </p>
            </AddRepairItemDialog>
          </div>

          {/* Repair Items List */}
          {repairItems.length === 0 ? (
            <div>
              <div className="flex justify-center items-center h-[162px]">
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
                    <div className="flex items-center gap-[8px] flex-1">
                      <div className="flex items-center justify-center w-[60px] h-[60px] rounded-[10px] border border-subtle-light bg-white shadow-primary">
                        {item.secureUrl ? (
                          <img
                            src={item.secureUrl}
                            alt={item.name}
                            className="object-cover w-full h-full rounded-[10px]"
                          />
                        ) : (
                          <div className="flex items-center justify-center w-[60px] h-[60px] text-subtle-light">
                            <Image className="w-8 h-8" />
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col flex-1">
                        <p className="font-semibold text-[14px] text-normal truncate max-w-[180px]">
                          {item.brand
                            ? `${item.brand} ${item.name}`
                            : item.name}
                        </p>
                        <p className="font-medium text-[12px] text-subtle-dark">
                          ราคาต่อหน่วย: {item.sellingPrice.toLocaleString()} บาท
                        </p>
                        <div className="flex items-center justify-between w-full">
                          <p className="font-semibold text-[16px] text-primary">
                            {(
                              item.quantity * item.sellingPrice
                            ).toLocaleString()}
                            &nbsp;บาท
                          </p>
                          <div className="flex items-center gap-[8px]">
                            <button
                              type="button"
                              onClick={() => handleDecreaseQuantity(index)}
                              disabled={item.quantity <= 1}
                              className="w-[28px] h-[28px] flex items-center justify-center rounded-[8px] border border-gray-200 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-300"
                            >
                              <Minus className="w-[14px] h-[14px]" />
                            </button>
                            <span className="font-semibold text-[14px] text-primary">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleIncreaseQuantity(index)}
                              className="w-[28px] h-[28px] flex items-center justify-center rounded-[8px] border border-primary/30 bg-primary/10 hover:bg-primary/20 text-primary"
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
                    <div className="w-[32px] h-[32px] flex items-center justify-center rounded-full bg-delete">
                      <Trash className="w-[18px] h-[18px]" />
                    </div>
                  </button>
                </div>
              ))}
              <div className="flex justify-between items-center px-[20px] mt-[16px]">
                <p className="font-semibold text-[18px] text-subtle-dark">
                  รวม {repairItems.length} รายการ
                </p>
                <p className="font-semibold text-[18px] text-primary">
                  {repairItems
                    .reduce(
                      (total, item) =>
                        total + item.sellingPrice * item.quantity,
                      0
                    )
                    .toLocaleString()}
                  &nbsp;บาท
                </p>
              </div>
              <div className="flex justify-center pb-[72px]">
                <FormButton label="ถัดไป" />
              </div>
            </div>
          )}
        </div>
      </form>
    </div>
  );
};

export default CreateRepair;
