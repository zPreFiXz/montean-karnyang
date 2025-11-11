const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const prisma = require("../config/prisma");
const createError = require("../utils/createError");

exports.getEmployees = async (req, res, next) => {
  try {
    const employees = await prisma.user.findMany({
      where: {
        role: {
          in: ["EMPLOYEE", "ADMIN"],
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json(employees);
  } catch (error) {
    next(error);
  }
};

exports.createEmployee = async (req, res, next) => {
  try {
    const {
      email,
      password,
      fullName,
      nickname,
      role,
      phoneNumber,
      dateOfBirth,
    } = req.body;
    console.log(req.body);

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (user) {
      createError(400, "อีเมลนี้ถูกใช้งานแล้ว");
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // สร้างพนักงานใหม่
    await prisma.user.create({
      data: {
        email,
        passwordHash: hashedPassword,
        fullName,
        nickname,
        role,
        phoneNumber,
        dateOfBirth: new Date(dateOfBirth),
      },
    });

    res.json({ message: "Employee created successfully" });
  } catch (error) {
    next(error);
  }
};

exports.updateEmployee = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      email,
      fullName,
      nickname,
      role,
      phoneNumber,
      dateOfBirth,
      password,
    } = req.body;

    // ตรวจสอบว่าพนักงานมีอยู่จริงหรือไม่
    const existingEmployee = await prisma.user.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existingEmployee) {
      return next(createError(404, "ไม่พบพนักงาน"));
    }

    // ตรวจสอบความซ้ำซ้อนของอีเมลถ้ามีการเปลี่ยนแปลง
    if (email && email !== existingEmployee.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email },
      });

      // ถ้าอีเมลนี้ถูกใช้แล้ว
      if (emailExists) {
        return next(createError(400, "อีเมลนี้ถูกใช้แล้ว"));
      }
    }

    // ตรวจสอบความถูกต้องของบทบาท
    if (role) {
      const validRoles = ["EMPLOYEE", "MANAGER", "ADMIN"];
      if (!validRoles.includes(role)) {
        return next(createError(400, "บทบาทไม่ถูกต้อง"));
      }
    }

    const updateData = {};
    if (email) updateData.email = email;
    if (fullName) updateData.fullName = fullName;
    if (nickname) updateData.nickname = nickname;
    if (role) updateData.role = role;
    if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber || null;
    if (dateOfBirth) updateData.dateOfBirth = new Date(dateOfBirth);

    if (password) {
      const saltRounds = 12;
      updateData.passwordHash = await bcrypt.hash(password, saltRounds);
    }

    await prisma.user.update({
      where: { id: parseInt(id) },
      data: updateData,
    });

    res.json({ message: "Employee updated successfully" });
  } catch (error) {
    next(error);
  }
};

exports.deleteEmployee = async (req, res, next) => {
  try {
    const { id } = req.params;

    await prisma.user.delete({
      where: { id: parseInt(id) },
    });

    res.json({ message: "Employee deleted successfully" });
  } catch (error) {
    next(error);
  }
};
