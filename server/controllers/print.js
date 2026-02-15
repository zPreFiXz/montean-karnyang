const prisma = require("../config/prisma");
const puppeteer = require("puppeteer");
const { print } = require("pdf-to-printer");
const fs = require("fs");
const path = require("path");
const os = require("os");

const generateReceiptHTML = (repair) => {
  const shopInfo = {
    name: "มณเฑียรการยาง",
    address: "ที่อยู่ร้าน (กรุณาแก้ไขตามที่อยู่จริง)",
    phone: "โทร: XXX-XXX-XXXX",
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("th-TH", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleTimeString("th-TH", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return "0";
    return Number(amount).toLocaleString();
  };

  const getPaymentMethodText = (method) => {
    switch (method) {
      case "CASH":
        return "เงินสด";
      case "BANK_TRANSFER":
        return "โอนเงิน";
      case "CREDIT_CARD":
        return "บัตรเครดิต";
      default:
        return "-";
    }
  };

  const licensePlate =
    repair.vehicle?.licensePlate?.plateNumber &&
    repair.vehicle?.licensePlate?.province
      ? `${repair.vehicle.licensePlate.plateNumber} ${repair.vehicle.licensePlate.province}`
      : "ไม่ระบุทะเบียน";

  const vehicleBrand =
    `${repair.vehicle?.vehicleBrandModel?.brand || ""} ${repair.vehicle?.vehicleBrandModel?.model || ""}`.trim();

  const generateRepairItemsHTML = () => {
    if (!repair.repairItems || repair.repairItems.length === 0) {
      return '<tr><td colspan="5" style="text-align: center; padding: 10px;">ไม่มีรายการ</td></tr>';
    }

    return repair.repairItems
      .map((item, index) => {
        const name =
          item.customName || item.part?.name || item.service?.name || "-";
        const quantity = item.quantity || 1;
        const unitPrice = Number(item.unitPrice) || 0;
        const total = quantity * unitPrice;

        return `
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">${index + 1}</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">${name}</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${quantity}</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${formatCurrency(unitPrice)}</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${formatCurrency(total)}</td>
          </tr>
        `;
      })
      .join("");
  };

  return `
    <!DOCTYPE html>
    <html lang="th">
    <head>
      <meta charset="UTF-8">
      <title>ใบเสร็จรับเงิน - ${repair.id}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700&display=swap');
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Sarabun', sans-serif;
          font-size: 12px;
          line-height: 1.4;
          color: #333;
          background: #fff;
          padding: 10mm;
        }
        
        .receipt {
          max-width: 80mm;
          margin: 0 auto;
        }
        
        .header {
          text-align: center;
          margin-bottom: 10px;
          padding-bottom: 10px;
          border-bottom: 2px dashed #333;
        }
        
        .shop-name {
          font-size: 18px;
          font-weight: 700;
          margin-bottom: 3px;
        }
        
        .shop-info {
          font-size: 11px;
          color: #666;
        }
        
        .receipt-title {
          text-align: center;
          font-size: 14px;
          font-weight: 600;
          margin: 10px 0;
        }
        
        .info-section {
          margin-bottom: 10px;
        }
        
        .info-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 3px;
          font-size: 11px;
        }
        
        .info-label {
          color: #666;
        }
        
        .info-value {
          font-weight: 600;
          text-align: right;
        }
        
        .divider {
          border-top: 1px dashed #ccc;
          margin: 8px 0;
        }
        
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 10px;
          font-size: 10px;
        }
        
        .items-table th {
          background: #f5f5f5;
          padding: 6px 4px;
          text-align: left;
          font-weight: 600;
          border-bottom: 1px solid #333;
        }
        
        .items-table th:nth-child(3),
        .items-table th:nth-child(4),
        .items-table th:nth-child(5) {
          text-align: right;
        }
        
        .total-section {
          border-top: 2px solid #333;
          padding-top: 8px;
          margin-top: 8px;
        }
        
        .total-row {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          margin-bottom: 3px;
        }
        
        .grand-total {
          font-size: 16px;
          font-weight: 700;
        }
        
        .footer {
          text-align: center;
          margin-top: 15px;
          padding-top: 10px;
          border-top: 2px dashed #333;
          font-size: 11px;
          color: #666;
        }
        
        .thank-you {
          font-size: 12px;
          font-weight: 600;
          color: #333;
          margin-bottom: 3px;
        }

        @page {
          size: 80mm auto;
          margin: 0;
        }
      </style>
    </head>
    <body>
      <div class="receipt">
        <div class="header">
          <div class="shop-name">${shopInfo.name}</div>
          <div class="shop-info">${shopInfo.address}</div>
          <div class="shop-info">${shopInfo.phone}</div>
        </div>
        
        <div class="receipt-title">ใบเสร็จรับเงิน</div>
        
        <div class="info-section">
          <div class="info-row">
            <span class="info-label">เลขที่:</span>
            <span class="info-value">#${repair.id}</span>
          </div>
          <div class="info-row">
            <span class="info-label">วันที่:</span>
            <span class="info-value">${formatDate(repair.paidAt || repair.createdAt)}</span>
          </div>
          <div class="info-row">
            <span class="info-label">เวลา:</span>
            <span class="info-value">${formatTime(repair.paidAt || repair.createdAt)} น.</span>
          </div>
        </div>
        
        <div class="divider"></div>
        
        <div class="info-section">
          <div class="info-row">
            <span class="info-label">ทะเบียนรถ:</span>
            <span class="info-value">${licensePlate}</span>
          </div>
          <div class="info-row">
            <span class="info-label">ยี่ห้อ/รุ่น:</span>
            <span class="info-value">${vehicleBrand || "-"}</span>
          </div>
          ${
            repair.customer?.fullName
              ? `
          <div class="info-row">
            <span class="info-label">ลูกค้า:</span>
            <span class="info-value">${repair.customer.fullName}</span>
          </div>
          `
              : ""
          }
          ${
            repair.customer?.phoneNumber
              ? `
          <div class="info-row">
            <span class="info-label">โทร:</span>
            <span class="info-value">${repair.customer.phoneNumber}</span>
          </div>
          `
              : ""
          }
        </div>
        
        <div class="divider"></div>
        
        <table class="items-table">
          <thead>
            <tr>
              <th style="width: 20px;">#</th>
              <th>รายการ</th>
              <th style="width: 30px; text-align: center;">จำนวน</th>
              <th style="width: 50px; text-align: right;">ราคา</th>
              <th style="width: 55px; text-align: right;">รวม</th>
            </tr>
          </thead>
          <tbody>
            ${generateRepairItemsHTML()}
          </tbody>
        </table>
        
        <div class="total-section">
          <div class="total-row">
            <span>จำนวนรายการ:</span>
            <span>${repair.repairItems?.length || 0} รายการ</span>
          </div>
          <div class="total-row">
            <span>ชำระโดย:</span>
            <span>${getPaymentMethodText(repair.paymentMethod)}</span>
          </div>
          <div class="total-row grand-total">
            <span>รวมทั้งสิ้น:</span>
            <span>${formatCurrency(repair.totalPrice)} บาท</span>
          </div>
        </div>
        
        <div class="footer">
          <div class="thank-you">ขอบคุณที่ใช้บริการ</div>
          <div>พิมพ์เมื่อ: ${formatDate(new Date())} ${formatTime(new Date())} น.</div>
        </div>
      </div>
    </body>
    </html>
  `;
};

exports.printReceipt = async (req, res, next) => {
  try {
    const { repairId } = req.params;

    const repair = await prisma.repair.findUnique({
      where: { id: parseInt(repairId) },
      include: {
        vehicle: {
          include: {
            licensePlate: true,
            vehicleBrandModel: true,
          },
        },
        customer: true,
        repairItems: {
          include: {
            part: true,
            service: true,
          },
        },
        user: true,
      },
    });

    if (!repair) {
      return res.status(404).json({ message: "ไม่พบข้อมูลการซ่อม" });
    }

    const html = generateReceiptHTML(repair);

    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    const tempDir = os.tmpdir();
    const pdfPath = path.join(
      tempDir,
      `receipt-${repair.id}-${Date.now()}.pdf`,
    );

    await page.pdf({
      path: pdfPath,
      width: "80mm",
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    });

    await browser.close();

    try {
      if (os.platform() === "darwin") {
        const { exec } = require("child_process");
        exec(`lp "${pdfPath}"`, (error, stdout, stderr) => {
          if (error) {
            console.error("Print error:", error);
          }
          setTimeout(() => {
            fs.unlink(pdfPath, () => {});
          }, 5000);
        });
      } else {
        await print(pdfPath);
        setTimeout(() => {
          fs.unlink(pdfPath, () => {});
        }, 5000);
      }

      res.json({ success: true, message: "ส่งคำสั่งพิมพ์เรียบร้อยแล้ว" });
    } catch (printError) {
      console.error("Print error:", printError);
      fs.unlink(pdfPath, () => {});
      res.status(500).json({
        message: "เกิดข้อผิดพลาดในการพิมพ์",
        error: printError.message,
      });
    }
  } catch (error) {
    console.error("Error:", error);
    next(error);
  }
};
