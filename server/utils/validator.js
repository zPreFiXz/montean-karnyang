const { z } = require("zod");

exports.registerSchema = z.object({
  email: z.string().email(),
  password_hash: z.string().min(8),
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  nickname: z.string().min(1),
  date_of_birth: z.coerce.date(),
});

exports.validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);

  if (!result.success) {
    const errors = result.error.issues.map(({ path, message }) => ({
      field: path[0] ?? "unknown",
      message,
    }));
    return res.status(400).json({ errors });
  }

  req.validated = result.data;
  next();
};
