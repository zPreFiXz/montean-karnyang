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

export const createPartSchema = z
  .object({
    // ฟิลด์ทั่วไป
    name: z.string().optional(),
    categoryId: z.number().optional(),

    // ฟิลด์สำหรับ service
    price: z.coerce.number().optional(),

    // ฟิลด์สำหรับ part (tire และ part อื่นๆ)
    partNumber: z.string().optional(),
    brand: z.string().optional(),
    costPrice: z.coerce.number().min(0).optional(),
    sellingPrice: z.coerce.number().min(0).optional(),
    unit: z.string().optional(),
    stockQuantity: z.coerce.number().min(0).optional(),
    minStockLevel: z.coerce.number().min(0).optional(),
    typeSpecificData: z.json().optional(),
    compatibleVehicles: z.json().optional(),
    image: z.any().optional(),

    // ฟิลด์สำหรับ tire เท่านั้น
    width: z.string().optional(),
    aspectRatio: z.any().optional(),
    rimDiameter: z.string().optional(),

    // ฟิลด์สำหรับ suspension เท่านั้น
    suspensionType: z.string().optional(),
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

      if (!data.price || data.price <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "กรุณากรอกราคา",
          path: ["price"],
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

      if (data.costPrice == null || data.costPrice < 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "กรุณากรอกราคาต้นทุน",
          path: ["costPrice"],
        });
      }

      if (data.sellingPrice == null || data.sellingPrice < 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "กรุณากรอกราคาขาย",
          path: ["sellingPrice"],
        });
      }

      if (!data.unit || data.unit.trim() === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "กรุณาเลือกหน่วย",
          path: ["unit"],
        });
      }

      if (data.stockQuantity == null || data.stockQuantity < 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "กรุณากรอกจำนวนสต็อก",
          path: ["stockQuantity"],
        });
      }

      if (data.minStockLevel == null || data.minStockLevel < 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "กรุณากรอกสต็อกขั้นต่ำ",
          path: ["minStockLevel"],
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

      if (data.costPrice == null || data.costPrice < 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "กรุณากรอกราคาต้นทุน",
          path: ["costPrice"],
        });
      }

      if (data.sellingPrice == null || data.sellingPrice < 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "กรุณากรอกราคาขาย",
          path: ["sellingPrice"],
        });
      }

      if (!data.unit || data.unit.trim() === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "กรุณาเลือกหน่วย",
          path: ["unit"],
        });
      }

      if (data.stockQuantity == null || data.stockQuantity < 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "กรุณากรอกจำนวนสต็อก",
          path: ["stockQuantity"],
        });
      }

      if (data.minStockLevel == null || data.minStockLevel < 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "กรุณากรอกสต็อกขั้นต่ำ",
          path: ["minStockLevel"],
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

      if (data.costPrice == null || data.costPrice < 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "กรุณากรอกต้นทุน",
          path: ["costPrice"],
        });
      }

      if (data.sellingPrice == null || data.sellingPrice < 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "กรุณากรอกราคาขาย",
          path: ["sellingPrice"],
        });
      }

      if (!data.unit || data.unit.trim() === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "กรุณาเลือกหน่วย",
          path: ["unit"],
        });
      }

      if (data.stockQuantity == null || data.stockQuantity < 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "กรุณากรอกจำนวนสต็อก",
          path: ["stockQuantity"],
        });
      }

      if (data.minStockLevel == null || data.minStockLevel < 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "กรุณากรอกสต็อกขั้นต่ำ",
          path: ["minStockLevel"],
        });
      }
    }
  });

export const addStockSchema = z.object({
  addQuantity: z.coerce.number().min(1, "กรุณากรอกจำนวน"),
});
