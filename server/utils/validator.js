const { z } = require("zod");

exports.registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
  nickname: z.string().min(1),
  dateOfBirth: z.coerce.date(),
});

exports.loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

exports.repairSchema = z.object({
  fullName: z.string().optional(),
  address: z.string().optional(),
  phoneNumber: z.string().optional(),
  brand: z.string().min(1),
  model: z.string().min(1),
  plateNumber: z.string().nullable().optional(),
  province: z.string().nullable().optional(),
  description: z.string().optional(),
  source: z.enum(["GENERAL", "SUSPENSION"]),
  totalPrice: z.coerce.number(),
  repairItems: z.any(),
});

exports.partSchema = z.object({
  partNumber: z.string().min(1),
  brand: z.string().min(1),
  name: z.string().min(1),
  costPrice: z.coerce.number(),
  sellingPrice: z.coerce.number(),
  unit: z.string().min(1),
  stockQuantity: z.coerce.number(),
  minStockLevel: z.coerce.number(),
  typeSpecificData: z.json().optional(),
  compatibleVehicles: z.json().optional(),
  image: z.any().optional(),
  categoryId: z.coerce.number(),
});

exports.serviceSchema = z.object({
  name: z.string().min(1),
  price: z.coerce.number(),
  categoryId: z.coerce.number(),
});

exports.addStockSchema = z.object({
  quantity: z.coerce.number().min(1),
});

exports.vehicleBrandModelSchema = z.object({
  brand: z.string().min(1),
  model: z.string().min(1),
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
