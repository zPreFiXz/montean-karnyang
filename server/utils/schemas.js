const { z } = require("zod");

exports.loginSchema = z.object({
  email: z.string().min(1, "กรุณากรอกอีเมล").email("กรุณากรอกอีเมลที่ถูกต้อง"),
  password: z.string().min(1, "กรุณากรอกรหัสผ่าน"),
});

exports.employeeSchema = z.object({
  zkUserId: z.string().min(1, "กรุณากรอกรหัสพนักงาน (เครื่องสแกน)"),
  name: z.string().min(1, "กรุณากรอกชื่อ"),
});

exports.createUserAccountSchema = z.object({
  name: z.string().min(1, "กรุณากรอกชื่อ"),
  email: z.string().min(1, "กรุณากรอกอีเมล").email("กรุณากรอกอีเมลที่ถูกต้อง"),
  password: z
    .string()
    .min(1, "กรุณากรอกรหัสผ่าน")
    .min(8, "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร"),
  role: z.enum(["EMPLOYEE", "ADMIN"], { message: "กรุณาเลือกบทบาท" }),
});

exports.editUserAccountSchema = z.object({
  name: z.string().min(1, "กรุณากรอกชื่อ"),
  email: z.string().min(1, "กรุณากรอกอีเมล").email("กรุณากรอกอีเมลที่ถูกต้อง"),
  password: z.string().min(8, "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร").optional(),
  role: z.enum(["EMPLOYEE", "ADMIN"], { message: "กรุณาเลือกบทบาท" }),
});

exports.repairSchema = z
  .object({
    name: z.string().optional(),
    address: z.string().optional(),
    taxId: z.preprocess(
      (v) => (v === "" || v == null ? undefined : v),
      z
        .string()
        .regex(/^[0-9]{13}$/, "กรุณากรอกเลขประจำตัวผู้เสียภาษีอากร 13 หลัก")
        .optional(),
    ),
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
    fleetNo: z.string().trim().max(20, "เบอร์รถยาวเกิน 20 ตัวอักษร").optional(),
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
    noVehicle: z.boolean().optional(),
    // CREDIT กับ PAY_LATER ไม่ใช่วิธีจ่าย คอนโทรลเลอร์จะเปลี่ยนเป็นสถานะเครดิต/รอชำระแทน
    paymentMethod: z
      .enum(["CASH", "CREDIT_CARD", "CREDIT", "PAY_LATER"], {
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
            itemUnit: z.string().trim().max(20).optional(),
            // ตั้งศูนย์ฟรีที่ค้างไว้ / ใช้สิทธิ์ที่ค้างจากบิลไหน (ตรวจต่อใน repairAlignment.js)
            alignmentDeferred: z.boolean().optional(),
            alignmentFromRepairId: z.number().int().positive().optional(),
            // น้ำมันขายครึ่งลิตรได้ จึงเช็กแค่ว่ามากกว่า 0 ไม่ใช่ต้องถึง 1
            quantity: z.coerce.number().gt(0, "จำนวนต้องมากกว่า 0"),
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
    brand: z.string().optional(),
    name: z.string().min(1, "กรุณากรอกชื่ออะไหล่"),
    costPrice: z.coerce.number().optional(),
    sellingPrice: z.coerce.number(),
    unit: z.string().min(1, "กรุณาเลือกหน่วย"),
    // ยาง: ไม่ส่ง stockQuantity มา — คอนโทรลเลอร์คำนวณจากผลรวมล็อตแทน
    stockQuantity: z.coerce.number().optional(),
    minStockLevel: z.coerce.number().optional(),
    // ไม่จำกัดสต็อก ไม่ต้องส่งจำนวนกับจุดแจ้งเตือน (ต้องตรงกับ partSchema ฝั่งหน้าเว็บ)
    unlimitedStock: z.boolean().optional(),
    attributes: z.any().optional(),
    compatibleVehicles: z.any().optional(),
    description: z.string().optional(),
    image: z.any().optional(),
    categoryId: z.coerce.number(),
    oilSourceId: z.preprocess(
      (v) => (v === "" || v == null ? null : v),
      z.coerce.number().int().positive().nullable().optional(),
    ),
    oilLiters: z.preprocess(
      (v) => (v === "" || v == null ? null : v),
      z.coerce
        .number({ message: "ปริมาณน้ำมันต้องเป็นตัวเลข" })
        .gt(0, "ปริมาณน้ำมันต้องมากกว่า 0")
        .nullable()
        .optional(),
    ),
    // ล็อตยาง (DOT + จำนวน) — ต้องอยู่ในสคีมา ไม่งั้น validate() จะตัดทิ้งก่อนถึงคอนโทรลเลอร์
    tireLots: z
      .array(
        z.object({
          dotCode: z.string().min(1, "กรุณากรอกสัปดาห์/ปีผลิต"),
          quantity: z.coerce
            .number()
            .int("จำนวนต้องเป็นจำนวนเต็ม")
            .min(0, "จำนวนต้องไม่ติดลบ"),
        }),
      )
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (data.oilSourceId && !data.oilLiters) {
      ctx.addIssue({
        code: "custom",
        message: "กรุณากรอกปริมาณน้ำมันต่อชุด",
        path: ["oilLiters"],
      });
    }
    if (data.unlimitedStock) return;
    if (data.minStockLevel === undefined) {
      ctx.addIssue({
        code: "custom",
        message: "กรุณากรอกจำนวนแจ้งเตือน",
        path: ["minStockLevel"],
      });
    }
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
  unit: z.string().trim().max(20, "หน่วยยาวเกินไป").optional(),
  perSide: z.boolean().optional(),
  image: z.any().optional(),
  categoryId: z.coerce.number(),
});

exports.categorySchema = z.object({
  name: z.string().min(1, "กรุณากรอกชื่อหมวดหมู่"),
});

// จ่ายด้วยเช็คต้องมีธนาคารกับเลขที่ วันที่ไม่บังคับ (ต้องตรงกับ chequeErrorsOf ใน client/src/constants/paymentMethods.js)
exports.updateRepairStatusSchema = z
  .object({
    status: z.enum(["ESTIMATE", "IN_PROGRESS", "COMPLETED", "CREDIT", "PAID"], {
      message: "สถานะไม่ถูกต้อง",
    }),
    paymentMethod: z
      .enum(["CASH", "CREDIT_CARD", "CHEQUE"], {
        message: "วิธีชำระเงินไม่ถูกต้อง",
      })
      .optional(),
    chequeBank: z.string().trim().max(100, "ชื่อธนาคารยาวเกินไป").optional(),
    chequeNo: z.string().trim().max(50, "เลขที่เช็คยาวเกินไป").optional(),
    // วันที่บนเช็ค ไม่มีเวลา ส่งมาเป็น ปปปป-ดด-วว ไม่ได้เลือกส่งเป็นค่าว่าง
    chequeDate: z
      .string()
      .regex(/^(\d{4}-\d{2}-\d{2})?$/, "วันที่ไม่ถูกต้อง")
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (data.paymentMethod !== "CHEQUE") return;
    if (!data.chequeBank) {
      ctx.addIssue({
        code: "custom",
        path: ["chequeBank"],
        message: "กรุณาเลือกธนาคาร",
      });
    }
    if (!data.chequeNo) {
      ctx.addIssue({
        code: "custom",
        path: ["chequeNo"],
        message: "กรุณากรอกเลขที่เช็ค",
      });
    }
  });

// amount = 0 คือลบมัดจำที่บันทึกผิด เพดานเทียบยอดบิลที่ controller (ต้องตรงกับ DepositDialog ฝั่งหน้าเว็บ)
exports.repairDepositSchema = z
  .object({
    amount: z
      .number({ message: "กรุณากรอกจำนวนเงิน" })
      .int("จำนวนเงินต้องเป็นจำนวนเต็ม")
      .min(0, "จำนวนเงินไม่ถูกต้อง"),
    method: z
      .enum(["CASH", "CREDIT_CARD"], { message: "กรุณาเลือกวิธีชำระเงิน" })
      .optional(),
  })
  .refine((data) => data.amount === 0 || data.method, {
    path: ["method"],
    message: "กรุณาเลือกวิธีชำระเงิน",
  });

exports.serviceOrderSchema = z.object({
  ids: z.array(z.number().int().positive()).min(1).max(500),
});

// พิมพ์หรือบันทึกรูปใบเสร็จ ตรวจเฉพาะข้อความบนใบรับเงินมัดจำ ตัวเลือกอื่นผ่านไปตามเดิม
// (ต้องตรงกับ depositNoteSchema ฝั่งหน้าเว็บ)
exports.repairDocumentSchema = z
  .object({
    depositNote: z
      .string()
      .trim()
      .max(100, "รายการยาวเกิน 100 ตัวอักษร")
      .optional(),
  })
  .loose();

exports.repairDueDateSchema = z.object({
  dueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "วันที่ไม่ถูกต้อง")
    .nullable(),
});

// รับเข้าสต็อกตอนเพิ่ม ชนิดกับจำนวนแก้ทีหลังไม่ได้ (ลบแล้วเพิ่มใหม่) แก้ได้แค่วันที่กับราคา
// partId = เลือกจากสต็อก (บวกเข้าสต็อก) ไม่ส่ง = อะไหล่อื่นๆ พิมพ์ชื่อเอง ไม่แตะสต็อก
const purchaseNameField = z
  .string()
  .trim()
  .max(200, "ชื่ออะไหล่ยาวเกินไป")
  .optional();
const purchaseUnitField = z
  .string()
  .trim()
  .max(20, "หน่วยยาวเกินไป")
  .optional();

const shopPurchaseItemSchema = z
  .object({
    partId: z.coerce.number().int().positive().optional(),
    itemName: purchaseNameField,
    unit: purchaseUnitField,
    quantity: z.coerce
      .number({ message: "กรุณากรอกจำนวน" })
      .positive("จำนวนต้องมากกว่า 0"),
    unitPrice: z.coerce
      .number({ message: "กรุณากรอกราคาต่อหน่วย" })
      .int("ราคาต้องเป็นจำนวนเต็ม")
      .min(0, "ราคาต้องไม่ติดลบ"),
  })
  .refine((data) => data.partId || data.itemName, {
    path: ["itemName"],
    message: "กรุณากรอกชื่ออะไหล่",
  });

// รับของหลายรายการในคราวเดียวแบบเปิดบิล วันที่รับใช้ร่วมกันทั้งชุด
exports.shopPurchaseSchema = z.object({
  takenAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "กรุณาเลือกวันที่รับ"),
  items: z
    .array(shopPurchaseItemSchema)
    .min(1, "กรุณาเพิ่มอะไหล่")
    .max(100, "เพิ่มได้ครั้งละไม่เกิน 100 รายการ"),
});

// แก้ได้แค่วันที่กับราคา อะไหล่อื่นๆ แก้ชื่อกับหน่วยได้ด้วยเพราะไม่ผูกกับสต็อก
exports.updateShopPurchaseSchema = z.object({
  takenAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "กรุณาเลือกวันที่รับ"),
  unitPrice: z.coerce
    .number({ message: "กรุณากรอกราคาต่อหน่วย" })
    .int("ราคาต้องเป็นจำนวนเต็ม")
    .min(0, "ราคาต้องไม่ติดลบ"),
  itemName: purchaseNameField,
  unit: purchaseUnitField,
});

exports.settleShopPurchasesSchema = z.object({
  ids: z.array(z.number().int().positive()).min(1).max(500),
});

exports.cancelRepairSchema = z.object({
  depositAction: z.enum(["REFUND", "KEEP"]).optional(),
});

// ต้องรับ lots ด้วย ไม่งั้นยางจะติดด่าน quantity แล้วกลายเป็น NaN
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
  brand: z.string().trim().min(1, "กรุณาเลือกยี่ห้อรถ"),
  model: z.string().trim().min(1, "กรุณากรอกรุ่นรถ"),
});

// ฉลากติดอะไหล่ (เครื่องพิมพ์สติกเกอร์) จำนวนแผ่นจำกัดไว้ กดเลขผิดจะได้ไม่พิมพ์ทั้งม้วน
exports.partLabelSchema = z.object({
  copies: z.coerce
    .number()
    .int("จำนวนแผ่นต้องเป็นจำนวนเต็ม")
    .min(1, "พิมพ์อย่างน้อย 1 แผ่น")
    .max(100, "พิมพ์ได้ครั้งละไม่เกิน 100 แผ่น")
    .default(1),
  // ต้องตรงกับ LABEL_SIZES ใน utils/printLabel.js
  size: z
    .enum(["60x40", "50x30", "40x30", "40x20"], {
      message: "ขนาดสติกเกอร์ไม่ถูกต้อง",
    })
    .default("60x40"),
  // ราคาทุนที่จะแปลงเป็นรหัสลับบนฉลาก ไม่ส่ง = ไม่พิมพ์รหัส (ต้องตรงกับช่องในหน้าต่างพิมพ์ฉลาก)
  costPrice: z
    .number({ message: "ราคาต้นทุนต้องเป็นตัวเลข" })
    .int("ราคาต้นทุนต้องเป็นจำนวนเต็ม")
    .min(0, "ราคาต้นทุนต้องไม่ติดลบ")
    .max(9999999, "ราคาต้นทุนมากเกินไป")
    .optional(),
  // รหัสร้านค้าที่สั่งอะไหล่ พิมพ์ก่อนรหัสทุน ไม่ส่ง = ไม่พิมพ์ (ต้องตรงกับ LABEL_SUPPLIERS ฝั่งหน้าเว็บ)
  supplierCode: z
    .enum(["PM", "BKP", "NC", "H2H", "RJR"], {
      message: "ร้านค้าไม่ถูกต้อง",
    })
    .optional(),
  // ติ๊กเองในหน้าต่าง (ไม่ติ๊กไว้ให้) ถึงจะบันทึกราคาต้นทุนนี้ลงอะไหล่ เฉพาะผู้ดูแลระบบ
  saveCostPrice: z.boolean().default(false),
});
