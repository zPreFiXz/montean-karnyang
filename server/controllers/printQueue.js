const prisma = require("../config/prisma");

// เพิ่มงานพิมพ์เข้าคิว
exports.addToPrintQueue = async (req, res, next) => {
  try {
    const { repairId } = req.body;

    // ตรวจสอบว่ามีงานพิมพ์ที่รอพิมพ์อยู่แล้วหรือไม่
    const existingQueue = await prisma.printQueue.findFirst({
      where: {
        repairId: Number(repairId),
        status: "PENDING",
      },
    });

    if (existingQueue) {
      return res.json({
        message: "งานพิมพ์ถูกส่งไปยังคิวแล้ว",
        printQueue: existingQueue,
      });
    }

    const printQueue = await prisma.printQueue.create({
      data: {
        repairId: Number(repairId),
      },
    });

    res.json({
      message: "ส่งงานพิมพ์เรียบร้อยแล้ว",
      printQueue,
    });
  } catch (error) {
    next(error);
  }
};

// ดึงรายการที่รอพิมพ์
exports.getPendingPrintQueue = async (req, res, next) => {
  try {
    const pendingQueue = await prisma.printQueue.findMany({
      where: {
        status: "PENDING",
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    res.json(pendingQueue);
  } catch (error) {
    next(error);
  }
};

// อัปเดตสถานะเป็นพิมพ์แล้ว
exports.markAsPrinted = async (req, res, next) => {
  try {
    const { id } = req.params;

    await prisma.printQueue.update({
      where: { id: Number(id) },
      data: {
        status: "PRINTED",
        printedAt: new Date(),
      },
    });

    res.json({ message: "อัปเดตสถานะเรียบร้อยแล้ว" });
  } catch (error) {
    next(error);
  }
};

// ลบรายการจากคิว
exports.deleteFromPrintQueue = async (req, res, next) => {
  try {
    const { id } = req.params;

    await prisma.printQueue.delete({
      where: { id: Number(id) },
    });

    res.json({ message: "ลบรายการเรียบร้อยแล้ว" });
  } catch (error) {
    next(error);
  }
};
