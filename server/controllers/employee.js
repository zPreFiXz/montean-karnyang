const bcrypt = require("bcryptjs");
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

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (user) {
      createError(400, "อีเมลนี้มีอยู่ในระบบแล้ว");
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

    res.json({ message: "เพิ่มพนักงานเรียบร้อยแล้ว" });
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
      where: { id: Number(id) },
    });

    if (!existingEmployee) {
      createError(404, "ไม่พบพนักงาน");
    }

    // ตรวจสอบความซ้ำซ้อนของอีเมลถ้ามีการเปลี่ยนแปลง
    if (email && email !== existingEmployee.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email },
      });

      // ถ้าอีเมลนี้มีอยู่ในระบบแล้ว
      if (emailExists) {
        createError(400, "อีเมลนี้มีอยู่ในระบบแล้ว");
      }
    }

    // ตรวจสอบความถูกต้องของบทบาท
    if (role) {
      const validRoles = ["EMPLOYEE", "ADMIN"];
      if (!validRoles.includes(role)) {
        createError(400, "บทบาทไม่ถูกต้อง");
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
      where: { id: Number(id) },
      data: updateData,
    });

    res.json({ message: "แก้ไขข้อมูลพนักงานเรียบร้อยแล้ว" });
  } catch (error) {
    next(error);
  }
};

exports.deleteEmployee = async (req, res, next) => {
  try {
    const { id } = req.params;

    await prisma.user.delete({
      where: { id: Number(id) },
    });

    res.json({ message: "ลบพนักงานเรียบร้อยแล้ว" });
  } catch (error) {
    next(error);
  }
};
