exports.authCheck = (req, res, next) => {
  try {
    console.log("Auth check middleware");
    next();
  } catch (error) {
    next(error);
  }
};
