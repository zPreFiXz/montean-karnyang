// Validation with Yup
const { object, string } = require("yup");

exports.registerSchema = object({
  email: string().email().required(),
  name: string().required(),
  password: string().min(8).required(),
});

exports.validate = (schema) => async (req, res, next) => {
  try {
    await schema.validate(req.body, { abortEarly: false });
    next();
  } catch (error) {
    const errTxt = error.errors.join(", ");
    const err = new Error(errTxt);
    next(err);
  }
};
