const express = require("express");
const router = express.Router();
const validate = require("../middlewares/validate");
const {
  createUserAccountSchema,
  editUserAccountSchema,
} = require("../utils/schemas");

const { authCheck, adminCheck } = require("../middlewares/auth");

const {
  listUsers,
  createUser,
  updateUser,
  deleteUser,
} = require("../controllers/user");

router.get("/users", authCheck, adminCheck, listUsers);
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
