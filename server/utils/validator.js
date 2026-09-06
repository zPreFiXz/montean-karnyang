const { z } = require("zod");

exports.loginSchema = z.object({
  email: z.string().email("กรุณากรอกอีเมลที่ถูกต้อง"),
  password: z.string().min(8, "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร"),
});

exports.employeeSchema = z.object({
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

exports.repairSchema = z
  .object({
    name: z.string().optional(),
    address: z.string().optional(),
    phoneNumber: z.preprocess(
      (v) => (v === "" || v == null ? undefined : v),
      z
        .string()
        .regex(/^[0-9]{10}$/, "กรุณากรอกเบอร์โทรศัพท์ 10 หลัก")
        .optional(),
    ),
    brand: z.string().optional(),
    model: z.string().optional(),
    plate: z.string().optional(),
    province: z.string().optional(),
    description: z.string().optional(),
    mileage: z.preprocess(
      (v) => (v === "" || v == null ? undefined : v),
      z.coerce
        .number({ message: "เลขกิโลเมตรต้องเป็นตัวเลข" })
        .int("เลขกิโลเมตรต้องเป็นจำนวนเต็ม")
        .min(0, "เลขกิโลเมตรต้องไม่ติดลบ")
        .optional(),
    ),
    type: z.enum(["GENERAL", "SUSPENSION", "SALE"], {
      message: "ประเภทงานซ่อมไม่ถูกต้อง",
    }),
    // งานบริการที่ไม่เก็บประวัติรถ (ปะยาง เติมลม) ไม่ได้ผูกกับรถคันไหน จึงไม่ต้องมียี่ห้อ/รุ่น
    noVehicle: z.boolean().optional(),
    // ใช้เฉพาะบิลขายหน้าร้าน ซึ่งเก็บเงินตอนสร้างบิลเลย
    paymentMethod: z
      .enum(["CASH", "CREDIT_CARD", "QR_CODE"], {
        message: "วิธีชำระเงินไม่ถูกต้อง",
      })
      .optional(),
    totalPrice: z.coerce.number(),
    repairItems: z
      .array(
        z
          .object({
            partId: z.number().optional(),
            serviceId: z.number().optional(),
            unitPrice: z.coerce.number(),
            itemName: z.string().max(191).optional(),
            quantity: z.coerce.number().min(1, "จำนวนอย่างน้อย 1"),
            // client ส่งตัวพิมพ์เล็ก (UI state) → แปลงเป็นตัวใหญ่ให้ตรง enum Side ใน DB
            side: z.preprocess(
              (v) => (typeof v === "string" ? v.toUpperCase() : v),
              z
                .enum(["LEFT", "RIGHT", "OTHER"], {
                  message: "ตำแหน่งข้างไม่ถูกต้อง",
                })
                .nullable()
                .optional(),
            ),
          })
          // ชื่ออะไหล่ไม่รับจาก client — เซิร์ฟเวอร์ประกอบเองจากของที่อ้างถึง
          // ยกเว้นบริการที่พิมพ์ชื่อเองได้ (เช่น "ค่าแรง" ที่ระบุงานลงไปด้วย) จึงรับมาแทนได้
          .refine((item) => item.partId || item.serviceId, {
            message: "แต่ละรายการต้องระบุอะไหล่หรือบริการ",
          }),
      )
      .optional(),
  })
  // งานซ่อมต้องผูกกับรถเสมอ ยกเว้นบิลขายอะไหล่หน้าร้าน (SALE) กับงานบริการที่ไม่เก็บประวัติรถ
  .superRefine((data, ctx) => {
    if (data.type === "SALE" || data.noVehicle) return;

    if (!data.brand) {
      ctx.addIssue({
        code: "custom",
        path: ["brand"],
        message: "กรุณาเลือกยี่ห้อรถ",
      });
    }
    if (!data.model) {
      ctx.addIssue({
        code: "custom",
        path: ["model"],
        message: "กรุณาเลือกรุ่นรถ",
      });
    }
  });

exports.partSchema = z
  .object({
    partNumber: z.string().min(1, "กรุณากรอกรหัสอะไหล่"),
    // อะไหล่บางอย่างไม่มียี่ห้อ (ของทำเอง ของโหล) ปล่อยว่างได้
    brand: z.string().optional(),
    name: z.string().min(1, "กรุณากรอกชื่ออะไหล่"),
    costPrice: z.coerce.number().optional(),
    sellingPrice: z.coerce.number(),
    unit: z.string().min(1, "กรุณาเลือกหน่วย"),
    // ยาง: ไม่ส่ง stockQuantity มา — คอนโทรลเลอร์คำนวณจากผลรวมล็อตแทน
    stockQuantity: z.coerce.number().optional(),
    minStockLevel: z.coerce.number(),
    attributes: z.any().optional(),
    compatibleVehicles: z.any().optional(),
    description: z.string().optional(),
    image: z.any().optional(),
    categoryId: z.coerce.number(),
    // ล็อตยาง (DOT + จำนวน) — ต้องอยู่ในสคีมา ไม่งั้น validate() จะตัดทิ้งก่อนถึงคอนโทรลเลอร์
    tireLots: z
      .array(
        z.object({
          dotCode: z.string().min(1, "กรุณากรอก DOT"),
          quantity: z.coerce
            .number()
            .int("จำนวนล็อตต้องเป็นจำนวนเต็ม")
            .min(0, "จำนวนล็อตต้องไม่ติดลบ"),
        }),
      )
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.tireLots && data.stockQuantity === undefined) {
      ctx.addIssue({
        code: "custom",
        message: "กรุณากรอกจำนวนสต็อก",
        path: ["stockQuantity"],
      });
    }
  });

exports.serviceSchema = z.object({
  name: z.string().min(1, "กรุณากรอกชื่อบริการ"),
  price: z.coerce.number(),
  description: z.string().optional(),
  categoryId: z.coerce.number(),
});

exports.categorySchema = z.object({
  name: z.string().min(1, "กรุณากรอกชื่อหมวดหมู่"),
});

exports.updateRepairStatusSchema = z.object({
  status: z.enum(["COMPLETED", "PAID"], { message: "สถานะไม่ถูกต้อง" }),
  paymentMethod: z
    .enum(["CASH", "CREDIT_CARD", "QR_CODE"], {
      message: "วิธีชำระเงินไม่ถูกต้อง",
    })
    .optional(),
});

// เพิ่มสต็อกได้สองรูปแบบ: อะไหล่ทั่วไปส่ง quantity เดี่ยว ส่วนยางส่ง lots ได้หลายล็อตในครั้งเดียว
// (ต้องรับ lots ที่นี่ด้วย ไม่งั้นยางจะติดด่าน quantity ที่ไม่มีค่า แล้วกลายเป็น NaN)
exports.updatePartStockSchema = z
  .object({
    quantity: z.coerce.number().optional(),
    // เฉพาะยาง: DOT ของล็อตที่เติมเข้ามา (ตรวจ 4 หลักที่ฟอร์ม) — ถ้าไม่รับตรงนี้จะถูกตัดทิ้ง ล็อตจะไม่ถูกบันทึก
    dotCode: z.string().optional(),
    lots: z
      .array(
        z.object({
          dotCode: z.string().min(1, "กรุณากรอกสัปดาห์/ปีผลิต"),
          quantity: z.coerce.number().min(1, "จำนวนต้องมากกว่า 0"),
        }),
      )
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (Array.isArray(data.lots)) {
      if (data.lots.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "กรุณาเพิ่มอย่างน้อย 1 รายการ",
          path: ["lots"],
        });
      }
      return;
    }

    if (!Number.isFinite(data.quantity) || data.quantity < 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "กรุณากรอกจำนวน",
        path: ["quantity"],
      });
    }
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
