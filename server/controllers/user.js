const prisma = require("../config/prisma");
const createError = require("../utils/createError");
const bcrypt = require("bcryptjs");

exports.listUsers = async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      where: {
        role: {
          in: ["EMPLOYEE", "ADMIN"],
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      // ห้ามส่ง password hash ออกไปหา client
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json(users);
  } catch (error) {
    next(error);
  }
};

exports.createUser = async (req, res, next) => {
  try {
    const { email, password, name, role } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (user) {
      createError(400, "อีเมลนี้มีอยู่ในระบบแล้ว");
    }

    const hashPassword = bcrypt.hashSync(password, 10);

    await prisma.user.create({
      data: {
        email,
        password: hashPassword,
        name,
        role,
      },
    });

    res.json({ message: "เพิ่มบัญชีผู้ใช้งานเรียบร้อยแล้ว" });
  } catch (error) {
    next(error);
  }
};

exports.updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { email, name, role, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: Number(id) },
    });

    if (!user) {
      createError(404, "ไม่พบบัญชีผู้ใช้งาน");
    }

    if (email && email !== user.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email },
      });

      if (emailExists) {
        createError(400, "อีเมลนี้มีอยู่ในระบบแล้ว");
      }
    }

    if (role) {
      const validRoles = ["EMPLOYEE", "ADMIN"];
      if (!validRoles.includes(role)) {
        createError(400, "บทบาทไม่ถูกต้อง");
      }
    }

    const updateData = {};
    if (email) updateData.email = email;
    if (name) updateData.name = name;
    if (role) updateData.role = role;

    if (password) {
      updateData.password = bcrypt.hashSync(password, 10);
    }

    await prisma.user.update({
      where: { id: Number(id) },
      data: updateData,
    });

    res.json({ message: "แก้ไขบัญชีผู้ใช้งานเรียบร้อยแล้ว" });
  } catch (error) {
    next(error);
  }
};

exports.deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    // งานซ่อมต้องรู้ว่าใครเป็นคนสร้าง ถ้าลบบัญชีทิ้งงานเก่าจะไม่มีเจ้าของ
    // (ฐานข้อมูลปฏิเสธให้อยู่แล้ว แต่ข้อความที่ได้กลางเกินไป จึงเช็กเองเพื่อบอกเหตุผลจริง)
    const openedRepair = await prisma.repair.findFirst({
      where: { userId: Number(id) },
    });

    if (openedRepair) {
      createError(400, "ลบไม่ได้ เพราะบัญชีนี้เคยสร้างงานซ่อมไว้");
    }

    await prisma.user.delete({
      where: { id: Number(id) },
    });

    res.json({ message: "ลบบัญชีผู้ใช้งานเรียบร้อยแล้ว" });
  } catch (error) {
    next(error);
  }
};
