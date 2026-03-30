const prisma = require("../config/prisma");
const createError = require("../utils/createError");

exports.getEmployees = async (req, res, next) => {
  try {
    const employees = await prisma.employee.findMany({
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
    const { zkUserId, fullName, nickname, phoneNumber, dateOfBirth, isActive } =
      req.body;

    const employee = await prisma.employee.findUnique({
      where: { zkUserId },
    });

    if (employee) {
      createError(400, "รหัสพนักงานนี้มีอยู่ในระบบแล้ว");
    }

    await prisma.employee.create({
      data: {
        zkUserId,
        fullName,
        nickname: nickname || null,
        phoneNumber: phoneNumber || null,
        dateOfBirth: dateOfBirth || null,
        isActive: isActive ?? true,
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
    const { zkUserId, fullName, nickname, phoneNumber, dateOfBirth, isActive } =
      req.body;

    const existingEmployee = await prisma.employee.findUnique({
      where: { id: Number(id) },
    });

    if (!existingEmployee) {
      createError(404, "ไม่พบพนักงาน");
    }

    if (zkUserId !== existingEmployee.zkUserId) {
      const codeExists = await prisma.employee.findUnique({
        where: { zkUserId },
      });

      if (codeExists) {
        createError(400, "รหัสพนักงานนี้มีอยู่ในระบบแล้ว");
      }
    }

    const updateData = {};
    if (zkUserId) updateData.zkUserId = zkUserId;
    if (fullName) updateData.fullName = fullName;
    if (nickname !== undefined) updateData.nickname = nickname || null;
    if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber || null;
    if (dateOfBirth !== undefined) updateData.dateOfBirth = dateOfBirth || null;
    if (isActive !== undefined) updateData.isActive = isActive;

    await prisma.employee.update({
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

    await prisma.employee.delete({
      where: { id: Number(id) },
    });

    res.json({ message: "ลบพนักงานเรียบร้อยแล้ว" });
  } catch (error) {
    next(error);
  }
};
