const express = require("express");
const router = express.Router();
const {
  validate,
  createUserAccountSchema,
  editUserAccountSchema,
} = require("../utils/validator");

const { authCheck, adminCheck } = require("../middlewares/auth");

const {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
} = require("../controllers/user");

router.get("/users", authCheck, adminCheck, getUsers);

router.post(
  "/users",
  authCheck,
  adminCheck,
  validate(createUserAccountSchema),
  createUser,
);

router.put(
  "/users/:id",
  authCheck,
  adminCheck,
  validate(editUserAccountSchema),
  updateUser,
);

router.delete("/users/:id", authCheck, adminCheck, deleteUser);

module.exports = router;
