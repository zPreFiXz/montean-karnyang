const { Public } = require("@prisma/client/runtime/library");
const { z } = require("zod");

exports.registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  nickname: z.string().min(1),
  dateOfBirth: z.coerce.date(),
});

exports.loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

exports.createPartSchema = z.object({
  partNumber: z.string().min(1),
  brand: z.string().min(1),
  name: z.string().min(1),
  costPrice: z.coerce.number(),
  sellingPrice: z.coerce.number(),
  unit: z.string().min(1),
  stockQuantity: z.coerce.number(),
  minStockLevel: z.coerce.number(),
  typeSpecificData: z.any().optional(),
  compatibleVehicles: z.any().optional(),
  image: z.any().optional(),
  categoryId: z.any(),
});

exports.createServiceSchema = z.object({
  name: z.string().min(1),
  price: z.coerce.number().positive(),
  categoryId: z.number(),
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
