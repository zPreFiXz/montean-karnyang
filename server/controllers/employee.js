const prisma = require("../config/prisma");
const createError = require("../utils/createError");

exports.listEmployees = async (req, res, next) => {
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
    const { zkUserId, name } = req.body;

    const employee = await prisma.employee.findUnique({
      where: { zkUserId },
    });

    if (employee) {
      createError(400, "รหัสพนักงานนี้มีอยู่ในระบบแล้ว");
    }

    await prisma.employee.create({
      data: {
        zkUserId,
        name,
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
    const { zkUserId, name } = req.body;

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
    if (name) updateData.name = name;

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
