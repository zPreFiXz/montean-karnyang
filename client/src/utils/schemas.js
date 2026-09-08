import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("กรุณากรอกอีเมลที่ถูกต้อง"),
  password: z.string().min(8, "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร"),
});

export const createEmployeeSchema = z.object({
  zkUserId: z.string().min(1, "กรุณากรอกรหัสพนักงาน (เครื่องสแกน)"),
  name: z.string().min(1, "กรุณากรอกชื่อ"),
});

export const editEmployeeSchema = z.object({
  zkUserId: z.string().min(1, "กรุณากรอกรหัสพนักงาน (เครื่องสแกน)"),
  name: z.string().min(1, "กรุณากรอกชื่อ"),
});

export const createUserAccountSchema = z
  .object({
    name: z.string().min(1, "กรุณากรอกชื่อ"),
    email: z.string().email("กรุณากรอกอีเมลที่ถูกต้อง"),
    password: z.string().min(8, "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร"),
    confirmPassword: z.string().min(8, "กรุณายืนยันรหัสผ่าน"),
    role: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "รหัสผ่านไม่ตรงกัน",
        path: ["confirmPassword"],
      });
    }

    if (!data.role || data.role.trim() === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "กรุณาเลือกบทบาท",
        path: ["role"],
      });
    }
  });

export const editUserAccountSchema = z
  .object({
    name: z.string().min(1, "กรุณากรอกชื่อ"),
    email: z.string().email("กรุณากรอกอีเมลที่ถูกต้อง"),
    password: z.string().optional(),
    confirmPassword: z.string().optional(),
    role: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.password && data.password.trim() !== "") {
      if (data.password.length < 8) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร",
          path: ["password"],
        });
      }

      if (data.password !== data.confirmPassword) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "รหัสผ่านไม่ตรงกัน",
          path: ["confirmPassword"],
        });
      }
    }

    if (!data.role || data.role.trim() === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "กรุณาเลือกบทบาท",
        path: ["role"],
      });
    }
  });

export const repairSchema = z
  .object({
    name: z.string().optional(),
    address: z.string().optional(),
    phoneNumber: z
      .string()
      .regex(/^[0-9]{10}$/, "กรุณากรอกเบอร์โทรศัพท์ 10 หลัก")
      .optional()
      .or(z.literal("")),
    brand: z.string().optional(),
    model: z.string().optional(),
    plateLetters: z.string().optional(),
    plateNumbers: z.string().optional(),
    province: z.string().optional(),
    description: z.string().optional(),
    mileage: z
      .string()
      .regex(/^[0-9]*$/, "เลขกิโลเมตรต้องเป็นตัวเลข")
      .optional()
      .or(z.literal("")),
    type: z.enum(["GENERAL", "SUSPENSION", "SALE"]).optional(),
    // งานบริการที่ไม่เก็บประวัติรถ — ไม่ต้องมียี่ห้อ/รุ่น เหมือนบิลขายหน้าร้าน
    noVehicle: z.boolean().optional(),
    // บิลขายหน้าร้านพกวิธีชำระเงินมาด้วยตอนแก้ไข ต้องประกาศไว้ที่นี่
    // ไม่งั้นตัวตรวจข้อมูลจะตัดช่องที่ไม่รู้จักทิ้ง แล้วหน้าสรุปจะไม่รู้ว่าเดิมรับเงินมาทางไหน
    paymentMethod: z.string().optional(),
  })
  // บิลขายอะไหล่หน้าร้าน (SALE) ไม่มีรถมาเกี่ยว จึงไม่บังคับยี่ห้อกับรุ่นรถ
  // ต้องตรงกับ repairSchema ฝั่งเซิร์ฟเวอร์ ไม่งั้นจะผ่านหน้าเว็บแต่ไปตกที่ toast
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

export const partServiceSchema = z
  .object({
    // อะไหล่
    partNumber: z.string().optional(),
    // ฐานข้อมูลเก็บ "ไม่มียี่ห้อ" เป็น null ไม่ใช่ข้อความว่าง แปลงให้เป็นข้อความว่างตั้งแต่ต้นทาง
    // ไม่งั้นข้อความ error ดิบของไลบรารีจะหลุดไปโผล่หน้าผู้ใช้
    brand: z.preprocess((v) => v ?? "", z.string().optional()),
    name: z.string().optional(),
    costPrice: z.preprocess(
      (v) => (v === "" || v == null ? undefined : v),
      z.coerce.number().optional(),
    ),
    sellingPrice: z.coerce.number().optional().default(0),
    unit: z.preprocess((v) => v ?? "", z.string().optional()),
    stockQuantity: z.coerce.number().optional().default(0),
    minStockLevel: z.coerce.number().optional().default(0),
    attributes: z.any().optional(),
    compatibleVehicles: z.any().optional(),
    description: z.preprocess((v) => v ?? "", z.string().optional()),
    image: z.any().optional(),
    categoryId: z.number().optional(),
    categoryKind: z.string().optional(),

    // ยาง
    width: z.string().optional(),
    aspectRatio: z.string().optional(),
    rimDiameter: z.string().optional(),
    // ตัวคั่นขนาดยาง R = เรเดียล ขีด = ผ้าใบ ไม่ได้เลือกถือว่าเรเดียล
    construction: z.enum(["R", "-"]).optional(),
    tireLots: z
      .array(
        z.object({
          dotCode: z.string().optional(),
          // อะไรก็ตามที่ไม่ใช่ตัวเลขจริง (รวม "null", NaN) → undefined กัน "Expected number, received NaN"
          // ช่องว่างต้องดักแยกก่อน เพราะ Number("") = 0 จะกลายเป็นยอด 0 ที่ผ่านการตรวจไปเฉยๆ
          quantity: z.preprocess((v) => {
            if (typeof v === "string" && v.trim() === "") return undefined;
            if (v === null) return undefined;
            const n = Number(v);
            return Number.isFinite(n) ? n : undefined;
          }, z.number().optional()),
        }),
      )
      .optional(),

    // ช่วงล่าง
    suspensionType: z.string().optional(),

    // บริการ
    price: z.coerce.number().optional().default(0),
  })
  .superRefine((data, ctx) => {
    if (!data.categoryId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "กรุณาเลือกหมวดหมู่",
        path: ["categoryId"],
      });
      return;
    }

    // ชนิดหมวดหมู่ส่งมาจากฟอร์ม (ดู getCategoryKind) เพราะรหัสหมวดของแต่ละเครื่องไม่ตรงกัน
    // และยางมีสองหมวดแล้ว (ยางใหม่กับยางเปอร์เซ็นต์) เทียบรหัสตัวเดียวจึงไม่พอ
    // เทียบรหัสไว้เป็นตาข่ายรองรับ เผื่อมีที่เรียกใช้เก่าที่ยังไม่ได้ส่ง categoryKind มา
    const kind = data.categoryKind;
    const isServiceCategory = kind ? kind === "service" : data.categoryId === 1;
    const isSuspensionCategory = kind
      ? kind === "suspension"
      : data.categoryId === 2;
    const isTireCategory = kind ? kind === "tire" : data.categoryId === 3;

    if (isServiceCategory) {
      if (!data.name || data.name.trim() === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "กรุณากรอกชื่อบริการ",
          path: ["name"],
        });
      }
    } else if (isTireCategory) {
      if (!data.partNumber || data.partNumber.trim() === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "กรุณากรอกรหัสอะไหล่",
          path: ["partNumber"],
        });
      }

      if (!data.name || data.name.trim() === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "กรุณากรอกรุ่น",
          path: ["name"],
        });
      }

      if (!data.width || data.width.trim() === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "กรุณากรอกหน้ายาง",
          path: ["width"],
        });
      }

      if (!data.rimDiameter || data.rimDiameter.trim() === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "กรุณากรอกขอบ",
          path: ["rimDiameter"],
        });
      }

      // ไม่ต้องเช็คว่ามีอย่างน้อย 1 แถว — TireLotInput เตรียมแถวแรกให้เสมอ
      // และปิดปุ่มลบเมื่อเหลือแถวเดียว จำนวนแถวจึงเป็น 0 ไม่ได้
      const lots = data.tireLots || [];
      lots.forEach((lot, index) => {
        const dot = String(lot.dotCode ?? "").trim();
        // "ไม่ระบุ" = ยางเก่าที่ backfill มา (ไม่รู้ DOT) — ยอมรับได้ ไม่ต้องบังคับ 4 หลัก
        if (dot === "") {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "กรุณากรอกสัปดาห์/ปีผลิต",
            path: ["tireLots", index, "dotCode"],
          });
        } else if (dot !== "ไม่ระบุ" && !/^\d{4}$/.test(dot)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "สัปดาห์/ปีผลิตต้องเป็นเลข 4 หลัก",
            path: ["tireLots", index, "dotCode"],
          });
        }
        // 0 ได้ แต่ต้องกรอก ห้ามเว้นว่าง — ล็อตที่จำนวนเป็น 0 จะถูกตัดทิ้งตอนบันทึก (normalizeLots)
        const quantity = Number(lot.quantity);
        if (lot.quantity === undefined || !Number.isFinite(quantity)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "กรุณากรอกจำนวน",
            path: ["tireLots", index, "quantity"],
          });
        } else if (quantity < 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "จำนวนต้องไม่ติดลบ",
            path: ["tireLots", index, "quantity"],
          });
        }
      });

      if (!data.unit || data.unit.trim() === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "กรุณาเลือกหน่วย",
          path: ["unit"],
        });
      }
    } else if (isSuspensionCategory) {
      if (!data.partNumber || data.partNumber.trim() === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "กรุณากรอกรหัสอะไหล่",
          path: ["partNumber"],
        });
      }

      if (!data.name || data.name.trim() === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "กรุณากรอกชื่ออะไหล่",
          path: ["name"],
        });
      }
      if (!data.suspensionType || data.suspensionType.trim() === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "กรุณาเลือกการติดตั้ง",
          path: ["suspensionType"],
        });
      }

      if (!data.unit || data.unit.trim() === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "กรุณาเลือกหน่วย",
          path: ["unit"],
        });
      }
    } else {
      if (!data.partNumber || data.partNumber.trim() === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "กรุณากรอกรหัสอะไหล่",
          path: ["partNumber"],
        });
      }

      if (!data.name || data.name.trim() === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "กรุณากรอกชื่ออะไหล่",
          path: ["name"],
        });
      }

      if (!data.unit || data.unit.trim() === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "กรุณาเลือกหน่วย",
          path: ["unit"],
        });
      }
    }
  });

export const editNamePriceSchema = z.object({
  name: z.string().min(1, "กรุณากรอกชื่อบริการ"),
  // ราคา 0 ใช้ได้จริง (ของแถม, บริการที่ไม่คิดเงิน) แต่เว้นว่างไม่ได้
  // ต้องดักช่องว่างก่อน เพราะ coerce.number แปลง "" เป็น 0 ซึ่งจะผ่านไปเงียบๆ
  price: z.preprocess(
    (value) =>
      typeof value === "string" && value.trim() === "" ? undefined : value,
    z.coerce
      .number({ error: "กรุณากรอกราคาต่อหน่วย" })
      .min(0, "ราคาต้องไม่ติดลบ"),
  ),
});

// ฟอร์มเพิ่มสต็อกใช้ schema เดียวสำหรับทั้งอะไหล่และยาง แล้วดูจากรูปร่างข้อมูลว่าเป็นแบบไหน
// (เคยแยกสอง schema แล้วเลือกด้วย isTire ตอนสร้างฟอร์ม แต่ตอนเรนเดอร์แรกยังไม่มีข้อมูลสินค้า
//  resolver เลยถูกผูกกับ schema ผิดตัวค้างไว้ ยางจึงโดนบังคับกรอก quantity ที่ไม่มีในฟอร์ม)
const toOptionalNumber = (v) => {
  if (typeof v === "string" && v.trim() === "") return undefined;
  if (v === null) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
};

export const updateStockSchema = z
  .object({
    quantity: z.preprocess(toOptionalNumber, z.number().optional()),
    tireLots: z
      .array(
        z.object({
          dotCode: z.string().optional(),
          quantity: z.preprocess(toOptionalNumber, z.number().optional()),
        }),
      )
      .optional(),
  })
  .superRefine((data, ctx) => {
    // ยาง: กรอกเป็นแถว ล็อตละ DOT + จำนวน
    if (Array.isArray(data.tireLots)) {
      if (data.tireLots.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "กรุณาเพิ่มอย่างน้อย 1 รายการ",
          path: ["tireLots"],
        });
      }

      data.tireLots.forEach((lot, index) => {
        const dot = String(lot.dotCode ?? "").trim();
        if (dot === "") {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "กรุณากรอกสัปดาห์/ปีผลิต",
            path: ["tireLots", index, "dotCode"],
          });
        } else if (!/^\d{4}$/.test(dot)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "สัปดาห์/ปีผลิตต้องเป็นเลข 4 หลัก",
            path: ["tireLots", index, "dotCode"],
          });
        }

        // ต่างจากฟอร์มแก้ไขรายการตรงที่นี่คือ "จำนวนที่รับเข้า" กรอก 0 ไม่มีความหมาย
        if (lot.quantity === undefined) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "กรุณากรอกจำนวน",
            path: ["tireLots", index, "quantity"],
          });
        } else if (lot.quantity < 1) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "จำนวนต้องมากกว่า 0",
            path: ["tireLots", index, "quantity"],
          });
        }
      });
      return;
    }

    // อะไหล่ทั่วไป: ช่องจำนวนเดี่ยว
    if (data.quantity === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "กรุณากรอกจำนวน",
        path: ["quantity"],
      });
    } else if (data.quantity < 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "จำนวนต้องมากกว่า 0",
        path: ["quantity"],
      });
    }
  });

export const vehicleModelSchema = z.object({
  brand: z.string().min(1, "กรุณากรอกยี่ห้อรถ"),
  model: z.string().min(1, "กรุณากรอกรุ่นรถ"),
});
