import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("กรุณากรอกอีเมลที่ถูกต้อง"),
  password: z.string().min(8, "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร"),
});

export const repairSchema = z.object({
  fullName: z.string().optional(),
  address: z.string().optional(),
  phoneNumber: z.string().optional(),
  brand: z.string().min(1, "กรุณาเลือกยี่ห้อรถ"),
  model: z.string().min(1, "กรุณาเลือกรุ่นรถ"),
  plateLetters: z.string().optional(),
  plateNumbers: z.string().optional(),
  province: z.any().optional(),
  description: z.string().optional(),
});

export const partServiceSchema = z
  .object({
    // อะไหล่
    partNumber: z.string().optional(),
    brand: z.string().optional(),
    name: z.string().optional(),
    costPrice: z.coerce.number().default(0),
    sellingPrice: z.coerce.number().default(0),
    unit: z.string().optional(),
    stockQuantity: z.coerce.number().default(0),
    minStockLevel: z.coerce.number().default(0),
    typeSpecificData: z.json().optional(),
    compatibleVehicles: z.json().optional(),
    image: z.any().optional(),
    categoryId: z.number().optional(),

    // ยาง
    width: z.string().optional(),
    aspectRatio: z.string().optional(),
    rimDiameter: z.string().optional(),

    // ช่วงล่าง
    suspensionType: z.string().optional(),

    // บริการ
    price: z.coerce.number().default(0),
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

    const isServiceCategory = data.categoryId === 1;
    const isSuspensionCategory = data.categoryId === 2;
    const isTireCategory = data.categoryId === 3;
    
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

      if (!data.brand || data.brand.trim() === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "กรุณากรอกยี่ห้อ",
          path: ["brand"],
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

      if (!data.brand || data.brand.trim() === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "กรุณากรอกยี่ห้อ",
          path: ["brand"],
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
          message: "กรุณาเลือกประเภทช่วงล่าง",
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

      if (!data.brand || data.brand.trim() === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "กรุณากรอกยี่ห้อ",
          path: ["brand"],
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

export const addStockSchema = z.object({
  quantity: z.coerce.number().min(1, "กรุณากรอกจำนวน"),
});

export const editNamePriceSchema = z.object({
  name: z.string().min(1, "กรุณากรอกชื่อบริการ"),
  price: z.coerce.number().min(1, "กรุณากรอกราคาต่อหน่วย"),
});

export const vehicleBrandModelSchema = z.object({
  brand: z.string().min(1, "กรุณากรอกยี่ห้อรถ"),
  model: z.string().min(1, "กรุณากรอกรุ่นรถ"),
});
