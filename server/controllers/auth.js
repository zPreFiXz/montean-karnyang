exports.register = (req, res, next) => {
  try {
    const { email, name, password } = req.body;
    console.log(email, name, password);
    res.json({ message: "User registered successfully" });
  } catch (error) {
    next(error);
  }
};

exports.login = (req, res, next) => {
  try {
    res.json({ message: "User logged in successfully" });
  } catch (error) {
    next(error);
  }
};
