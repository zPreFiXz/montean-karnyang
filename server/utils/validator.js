const { z } = require("zod");

exports.loginSchema = z.object({
  email: z.string().email("กรุณากรอกอีเมลที่ถูกต้อง"),
  password: z.string().min(8, "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร"),
});

exports.createEmployeeSchema = z.object({
  zkUserId: z.string().min(1, "กรุณากรอกรหัสพนักงาน (เครื่องสแกน)"),
  name: z.string().min(1, "กรุณากรอกชื่อ"),
});

exports.editEmployeeSchema = z.object({
  zkUserId: z.string().min(1, "กรุณากรอกรหัสพนักงาน (เครื่องสแกน)"),
  name: z.string().min(1, "กรุณากรอกชื่อ"),
});

exports.createUserAccountSchema = z.object({
  name: z.string().min(1, "กรุณากรอกชื่อ"),
  email: z.string().email("กรุณากรอกอีเมลที่ถูกต้อง"),
  password: z.string().min(8, "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร"),
  role: z.enum(["EMPLOYEE", "ADMIN"], { message: "กรุณาเลือกบทบาท" }),
});

exports.editUserAccountSchema = z.object({
  name: z.string().min(1, "กรุณากรอกชื่อ"),
  email: z.string().email("กรุณากรอกอีเมลที่ถูกต้อง"),
  password: z.string().min(8, "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร").optional(),
  role: z.enum(["EMPLOYEE", "ADMIN"], { message: "กรุณาเลือกบทบาท" }),
});

exports.repairSchema = z.object({
  name: z.string().optional(),
  address: z.string().optional(),
  phoneNumber: z.preprocess(
    (v) => (v === "" || v == null ? undefined : v),
    z
      .string()
      .regex(/^[0-9]{10}$/, "กรุณากรอกเบอร์โทรศัพท์ 10 หลัก")
      .optional(),
  ),
  brand: z.string().min(1, "กรุณาเลือกยี่ห้อรถ"),
  model: z.string().min(1, "กรุณาเลือกรุ่นรถ"),
  plate: z.string().optional(),
  province: z.string().optional(),
  description: z.string().optional(),
  type: z.enum(["GENERAL", "SUSPENSION"], { message: "ประเภทงานซ่อมไม่ถูกต้อง" }),
  totalPrice: z.coerce.number(),
  repairItems: z
    .array(
      z
        .object({
          partId: z.number().optional(),
          serviceId: z.number().optional(),
          unitPrice: z.coerce.number(),
          quantity: z.coerce.number().min(1, "จำนวนอย่างน้อย 1"),
          side: z.string().optional(),
          customName: z.string().optional(),
        })
        .refine((item) => item.partId || item.serviceId || item.customName, {
          message: "แต่ละรายการต้องมีอะไหล่ บริการ หรือชื่อรายการอย่างน้อย 1",
        }),
    )
    .optional(),
});

exports.partSchema = z.object({
  partNumber: z.string().min(1, "กรุณากรอกรหัสอะไหล่"),
  brand: z.string().min(1, "กรุณากรอกยี่ห้อ"),
  name: z.string().min(1, "กรุณากรอกชื่ออะไหล่"),
  costPrice: z.coerce.number().optional(),
  sellingPrice: z.coerce.number(),
  unit: z.string().min(1, "กรุณาเลือกหน่วย"),
  quantity: z.coerce.number(),
  minStockLevel: z.coerce.number(),
  typeSpecificData: z.any().optional(),
  compatibleVehicles: z.any().optional(),
  image: z.any().optional(),
  categoryId: z.coerce.number(),
});

exports.serviceSchema = z.object({
  name: z.string().min(1, "กรุณากรอกชื่อบริการ"),
  price: z.coerce.number(),
  categoryId: z.coerce.number(),
});

exports.editNamePriceSchema = z.object({
  name: z.string().min(1, "กรุณากรอกชื่อ"),
  price: z.coerce.number().min(1, "กรุณากรอกราคาต่อหน่วย"),
});

exports.updatePartStockSchema = z.object({
  quantity: z.coerce.number().min(1, "กรุณากรอกจำนวน"),
});

exports.vehicleModelSchema = z.object({
  brand: z.string().min(1, "กรุณากรอกยี่ห้อรถ"),
  model: z.string().min(1, "กรุณากรอกรุ่นรถ"),
});

exports.validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);

  if (!result.success) {
    const errors = result.error.issues.map((error) => ({
      field: error.path.join("."),
      message: error.message,
    }));
    return res.status(400).json({ errors });
  }

  req.body = result.data;
  next();
};
