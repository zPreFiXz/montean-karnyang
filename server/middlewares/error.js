const handleError = (err, req, res, next) => {
  res
    .status(err.code || 500)
    .json({ message: err.message || "Something Wrong!!!" });
};

module.exports = handleError;
