const { z } = require("zod");

exports.registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  nickname: z.string().min(1),
  date_of_birth: z.coerce.date(),
});

exports.loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
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
