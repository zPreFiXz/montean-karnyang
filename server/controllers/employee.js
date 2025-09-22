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
      select: {
        id: true,
        email: true,
        fullName: true,
        nickname: true,
        role: true,
        // phoneNumber: true,
        dateOfBirth: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.status(200).json({
      success: true,
      data: employees,
    });
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

    // Validate required fields
    if (
      !email ||
      !password ||
      !fullName ||
      !nickname ||
      !role ||
      !dateOfBirth
    ) {
      return next(createError(400, "กรุณากรอกข้อมูลให้ครบถ้วน"));
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return next(createError(400, "อีเมลนี้ถูกใช้แล้ว"));
    }

    // Validate role
    const validRoles = ["EMPLOYEE", "MANAGER", "ADMIN"];
    if (!validRoles.includes(role)) {
      return next(createError(400, "บทบาทไม่ถูกต้อง"));
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new employee
    const newEmployee = await prisma.user.create({
      data: {
        email,
        passwordHash: hashedPassword,
        fullName,
        nickname,
        role,
        phoneNumber: phoneNumber || null,
        dateOfBirth: new Date(dateOfBirth),
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        nickname: true,
        role: true,
        phoneNumber: true,
        dateOfBirth: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.status(201).json({
      success: true,
      message: "เพิ่มพนักงานสำเร็จ",
      data: newEmployee,
    });
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

    // Check if employee exists
    const existingEmployee = await prisma.user.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existingEmployee) {
      return next(createError(404, "ไม่พบพนักงาน"));
    }

    // Check if email is being changed and if new email already exists
    if (email && email !== existingEmployee.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email },
      });

      if (emailExists) {
        return next(createError(400, "อีเมลนี้ถูกใช้แล้ว"));
      }
    }

    // Validate role if provided
    if (role) {
      const validRoles = ["EMPLOYEE", "MANAGER", "ADMIN"];
      if (!validRoles.includes(role)) {
        return next(createError(400, "บทบาทไม่ถูกต้อง"));
      }
    }

    // Prepare update data
    const updateData = {};
    if (email) updateData.email = email;
    if (fullName) updateData.fullName = fullName;
    if (nickname) updateData.nickname = nickname;
    if (role) updateData.role = role;
    if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber || null;
    if (dateOfBirth) updateData.dateOfBirth = new Date(dateOfBirth);

    // Hash new password if provided
    if (password) {
      const saltRounds = 12;
      updateData.passwordHash = await bcrypt.hash(password, saltRounds);
    }

    // Update employee
    const updatedEmployee = await prisma.user.update({
      where: { id: parseInt(id) },
      data: updateData,
      select: {
        id: true,
        email: true,
        fullName: true,
        nickname: true,
        role: true,
        phoneNumber: true,
        dateOfBirth: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.status(200).json({
      success: true,
      message: "แก้ไขข้อมูลพนักงานสำเร็จ",
      data: updatedEmployee,
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteEmployee = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if employee exists
    const existingEmployee = await prisma.user.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existingEmployee) {
      return next(createError(404, "ไม่พบพนักงาน"));
    }

    // Prevent deleting yourself (optional - you might want to add this check)
    // if (req.user && req.user.id === parseInt(id)) {
    //   return next(createError(400, "ไม่สามารถลบบัญชีของตนเองได้"));
    // }

    // Delete employee
    await prisma.user.delete({
      where: { id: parseInt(id) },
    });

    res.status(200).json({
      success: true,
      message: "ลบพนักงานสำเร็จ",
    });
  } catch (error) {
    next(error);
  }
};
