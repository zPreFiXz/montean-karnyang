const { z } = require("zod");

exports.loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const optionalDateSchema = z.preprocess(
  (value) => (value === "" || value == null ? undefined : value),
  z.coerce.date().optional(),
);

const optionalPhoneSchema = z
  .string()
  .regex(/^[0-9]{10}$/)
  .optional()
  .or(z.literal(""));

exports.createEmployeeSchema = z.object({
  zkUserId: z.string().min(1),
  fullName: z.string().min(1),
  nickname: z.string().optional(),
  dateOfBirth: optionalDateSchema,
  phoneNumber: optionalPhoneSchema,
  isActive: z.boolean().optional(),
});

exports.editEmployeeSchema = z.object({
  zkUserId: z.string().min(1),
  fullName: z.string().min(1),
  nickname: z.string().optional(),
  dateOfBirth: optionalDateSchema,
  phoneNumber: optionalPhoneSchema,
  isActive: z.boolean().optional(),
});

exports.createUserAccountSchema = z.object({
  fullName: z.string().min(1),
  nickname: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  dateOfBirth: z.coerce.date(),
  phoneNumber: z.string().regex(/^[0-9]{10}$/),
  role: z.enum(["EMPLOYEE", "ADMIN"]),
});

exports.editUserAccountSchema = z.object({
  fullName: z.string().min(1),
  nickname: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8).optional(),
  dateOfBirth: z.coerce.date(),
  phoneNumber: z.string().regex(/^[0-9]{10}$/),
  role: z.enum(["EMPLOYEE", "ADMIN"]),
});

exports.repairSchema = z.object({
  fullName: z.string().optional(),
  address: z.string().optional(),
  phoneNumber: z.string().optional(),
  brand: z.string().min(1),
  model: z.string().min(1),
  plate: z.string().optional(),
  province: z.string().optional(),
  description: z.string().optional(),
  source: z.enum(["GENERAL", "SUSPENSION"]),
  totalPrice: z.coerce.number(),
  repairItems: z
    .array(
      z.object({
        partId: z.number().optional(),
        serviceId: z.number().optional(),
        unitPrice: z.coerce.number(),
        quantity: z.coerce.number().min(1),
        side: z.string().optional(),
        customName: z.string().optional(),
      }),
    )
    .optional(),
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
  typeSpecificData: z.any().optional(),
  compatibleVehicles: z.any().optional(),
  image: z.any().optional(),
  categoryId: z.coerce.number(),
});

exports.serviceSchema = z.object({
  name: z.string().min(1),
  price: z.coerce.number(),
  categoryId: z.coerce.number(),
});

exports.editNamePriceSchema = z.object({
  name: z.string().min(1),
  price: z.coerce.number().min(1),
});

exports.updatePartStockSchema = z.object({
  quantity: z.coerce.number().min(1),
});

exports.vehicleBrandSchema = z.object({
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
