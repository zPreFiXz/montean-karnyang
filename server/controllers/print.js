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
    taxId: "เลขประจำตัวผู้เสียภาษี: XXXXXXXXXXXXX",
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    const d = date.toLocaleDateString("th-TH", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    const t = date.toLocaleTimeString("th-TH", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    return `${d} ${t}`;
  };

  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return "0.00";
    return Number(amount).toLocaleString("th-TH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
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
    repair.vehicle?.licensePlate?.plate &&
    repair.vehicle?.licensePlate?.province
      ? `${repair.vehicle.licensePlate.plate} ${repair.vehicle.licensePlate.province}`
      : "ไม่ระบุ";

  const vehicleBrand =
    `${repair.vehicle?.vehicleBrand?.brand || ""} ${repair.vehicle?.vehicleBrand?.model || ""}`.trim() ||
    "-";

  const receiptDate = repair.paidAt || repair.createdAt;
  const receiptNo = `REC-${String(repair.id).padStart(6, "0")}`;

  const VAT_RATE = 0.07;
  const totalPrice = Number(repair.totalPrice) || 0;
  const basePrice = totalPrice / (1 + VAT_RATE);
  const vatAmount = totalPrice - basePrice;

  const generateRepairItemsHTML = () => {
    if (!repair.repairItems || repair.repairItems.length === 0) {
      return `<tr><td colspan="6" style="text-align:center;padding:16px;color:#999;">ไม่มีรายการ</td></tr>`;
    }

    return repair.repairItems
      .map((item, index) => {
        const partNumber = item.part?.partNumber || "-";
        const name =
          item.customName || item.part?.name || item.service?.name || "-";
        const brand = item.part?.brand || "";
        const displayName = brand ? `${brand} ${name}` : name;
        const quantity = item.quantity || 1;
        const unitPrice = Number(item.unitPrice) || 0;
        const total = quantity * unitPrice;

        return `
        <tr style="border-bottom:1px solid #e5e7eb;">
          <td style="padding:7px 8px;text-align:center;white-space:nowrap;">${index + 1}</td>
          <td style="padding:7px 8px;white-space:nowrap;font-size:11px;">${partNumber}</td>
          <td style="padding:7px 8px;">${displayName}</td>
          <td style="padding:7px 8px;text-align:center;">${quantity}</td>
          <td style="padding:7px 8px;text-align:right;">${formatCurrency(unitPrice)}</td>
          <td style="padding:7px 8px;text-align:right;">${formatCurrency(total)}</td>
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
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
      <title>ใบเสร็จรับเงิน #${receiptNo}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700&display=swap');
        * { margin:0; padding:0; box-sizing:border-box; }
        body {
          font-family: 'Sarabun', sans-serif;
          font-size: 13px;
          color: #111;
          background: #fff;
        }
        .page {
          width: 148mm;
          min-height: 210mm;
          margin: 0 auto;
          padding: 10mm 12mm;
          position: relative;
        }
        /* Header */
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 2px solid #111;
          padding-bottom: 10px;
          margin-bottom: 10px;
        }
        .shop-left { flex: 1; }
        .shop-name {
          font-size: 22px;
          font-weight: 700;
          margin-bottom: 3px;
        }
        .shop-sub { font-size: 11.5px; color: #444; line-height: 1.6; }
        .shop-right { text-align: right; font-size: 11.5px; color: #444; line-height:1.7; min-width: 200px; }
        /* Title bar */
        .title-bar {
          background: #111;
          color: #fff;
          text-align: center;
          padding: 6px 0;
          font-size: 15px;
          font-weight: 700;
          letter-spacing: 0.5px;
          margin-bottom: 10px;
        }
        /* Meta info */
        .meta-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 4px 20px;
          margin-bottom: 10px;
          font-size: 12px;
        }
        .meta-row { display: flex; gap: 6px; }
        .meta-label { color: #555; white-space: nowrap; }
        .meta-value { font-weight: 600; }
        /* Customer box */
        .customer-box {
          border: 1px solid #d1d5db;
          border-radius: 6px;
          padding: 8px 12px;
          margin-bottom: 12px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 4px 20px;
          font-size: 12px;
        }
        .customer-box .row { display: flex; gap: 6px; }
        .customer-box .lbl { color: #555; white-space: nowrap; }
        .customer-box .val { font-weight: 600; }
        /* Table */
        table.items {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 10px;
          font-size: 12.5px;
        }
        table.items thead tr {
          background: #111;
          color: #fff;
        }
        table.items thead th {
          padding: 7px 8px;
          font-weight: 600;
          white-space: nowrap;
        }
        table.items tbody tr:nth-child(even) { background: #f9fafb; }
        table.items tbody td { vertical-align: top; }
        /* Summary */
        .summary-wrap {
          display: flex;
          justify-content: flex-end;
          margin-top: 4px;
        }
        .summary-table {
          width: 260px;
          font-size: 12.5px;
        }
        .summary-table td { padding: 4px 8px; }
        .summary-table .lbl { color: #555; }
        .summary-table .val { text-align: right; font-weight: 600; }
        .summary-table tr.vat-row td { border-top: 1px solid #d1d5db; }
        .summary-table tr.total-row td {
          border-top: 2px solid #111;
          font-size: 15px;
          font-weight: 700;
          padding-top: 6px;
        }
        /* VAT breakdown */
        .vat-box {
          border: 1px solid #d1d5db;
          border-radius: 6px;
          margin-top: 10px;
          font-size: 11.5px;
          overflow: hidden;
        }
        .vat-box table { width: 100%; border-collapse: collapse; }
        .vat-box thead tr { background: #f3f4f6; }
        .vat-box thead th { padding: 5px 10px; font-weight: 600; text-align: right; border-bottom: 1px solid #d1d5db; }
        .vat-box thead th:first-child { text-align: left; }
        .vat-box tbody td { padding: 5px 10px; text-align: right; }
        .vat-box tbody td:first-child { text-align: left; }
        .vat-box tfoot td { padding: 5px 10px; text-align: right; font-weight: 700; border-top: 1px solid #d1d5db; }
        .vat-box tfoot td:first-child { text-align: left; }
        /* Signatures */
        .sig-section {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 20px;
          margin-top: 24px;
          font-size: 12px;
        }
        .sig-box { text-align: center; }
        .sig-line { border-bottom: 1px dotted #999; margin: 28px 10px 6px; }
        .sig-label { color: #555; }
        /* Footer note */
        .footer-note {
          margin-top: 16px;
          font-size: 11px;
          color: #777;
          border-top: 1px dashed #ccc;
          padding-top: 8px;
          line-height: 1.7;
        }
        .print-info {
          margin-top: 8px;
          font-size: 10.5px;
          color: #aaa;
          text-align: right;
        }
        @page { size: A5; margin: 0; }
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      </style>
    </head>
    <body>
      <div class="page">

        <!-- Header -->
        <div class="header">
          <div class="shop-left">
            <div class="shop-name">${shopInfo.name}</div>
            <div class="shop-sub">${shopInfo.address}</div>
            <div class="shop-sub">${shopInfo.phone}</div>
            <div class="shop-sub">${shopInfo.taxId}</div>
          </div>
          <div class="shop-right">
            <div style="font-weight:600;">เลขที่: ${receiptNo}</div>
            <div>วันที่: ${formatDateTime(receiptDate)}</div>
            <div>ช่างผู้รับผิดชอบ: ${repair.user?.nickname || repair.user?.fullName || "-"}</div>
          </div>
        </div>

        <!-- Title -->
        <div class="title-bar">ใบเสร็จรับเงิน / ใบกำกับภาษี</div>

        <!-- Customer / Vehicle info -->
        <div class="customer-box">
          <div class="row"><span class="lbl">ชื่อลูกค้า:</span><span class="val">${repair.customer?.fullName || "ไม่ระบุ"}</span></div>
          <div class="row"><span class="lbl">ทะเบียนรถ:</span><span class="val">${licensePlate}</span></div>
          <div class="row"><span class="lbl">ที่อยู่:</span><span class="val">${repair.customer?.address || "ไม่ระบุ"}</span></div>
          <div class="row"><span class="lbl">ยี่ห้อ/รุ่น:</span><span class="val">${vehicleBrand}</span></div>
          <div class="row"><span class="lbl">โทรศัพท์:</span><span class="val">${repair.customer?.phoneNumber || "ไม่ระบุ"}</span></div>
          <div class="row"><span class="lbl">ชำระโดย:</span><span class="val">${getPaymentMethodText(repair.paymentMethod)}</span></div>
          ${repair.description ? `<div class="row" style="grid-column:1/-1;"><span class="lbl">รายละเอียด:</span><span class="val">${repair.description}</span></div>` : ""}
        </div>

        <!-- Items Table -->
        <table class="items">
          <thead>
            <tr>
              <th style="width:32px;text-align:center;">No.</th>
              <th style="width:110px;">รหัสอะไหล่</th>
              <th>รายการ</th>
              <th style="width:55px;text-align:center;">จำนวน</th>
              <th style="width:80px;text-align:right;">ราคา/หน่วย</th>
              <th style="width:90px;text-align:right;">จำนวนเงิน</th>
            </tr>
          </thead>
          <tbody>
            ${generateRepairItemsHTML()}
            ${Array.from({
              length: Math.max(0, 8 - (repair.repairItems?.length || 0)),
            })
              .map(
                () =>
                  `<tr style="border-bottom:1px solid #e5e7eb;"><td colspan="6" style="padding:7px 8px;">&nbsp;</td></tr>`,
              )
              .join("")}
          </tbody>
        </table>

        <!-- Summary -->
        <div class="summary-wrap">
          <table class="summary-table">
            <tr>
              <td class="lbl">จำนวนรายการ</td>
              <td class="val">${repair.repairItems?.length || 0} รายการ</td>
            </tr>
            <tr class="vat-row">
              <td class="lbl">มูลค่าก่อนภาษี</td>
              <td class="val">${formatCurrency(basePrice)} บาท</td>
            </tr>
            <tr>
              <td class="lbl">ภาษีมูลค่าเพิ่ม (7%)</td>
              <td class="val">${formatCurrency(vatAmount)} บาท</td>
            </tr>
            <tr class="total-row">
              <td>รวมทั้งสิ้น</td>
              <td class="val">${formatCurrency(totalPrice)} บาท</td>
            </tr>
          </table>
        </div>

        <!-- VAT Breakdown -->
        <div class="vat-box">
          <table>
            <thead>
              <tr>
                <th>ประเภท</th>
                <th>มูลค่าสินค้า</th>
                <th>ภาษีมูลค่าเพิ่ม</th>
                <th>ราคารวม VAT</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>V สินค้า/บริการที่มีภาษี 7%</td>
                <td>${formatCurrency(basePrice)}</td>
                <td>${formatCurrency(vatAmount)}</td>
                <td>${formatCurrency(totalPrice)}</td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <td>มูลค่าสินค้ารวม</td>
                <td>${formatCurrency(basePrice)}</td>
                <td>${formatCurrency(vatAmount)}</td>
                <td>${formatCurrency(totalPrice)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <!-- Signatures -->
        <div class="sig-section">
          <div class="sig-box">
            <div class="sig-line"></div>
            <div>ผู้รับเงิน</div>
            <div class="sig-label">(${repair.user?.fullName || "............................................"})</div>
          </div>
          <div class="sig-box">
            <div class="sig-line"></div>
            <div>ผู้รับสินค้า</div>
            <div class="sig-label">(............................................)</div>
          </div>
          <div class="sig-box">
            <div class="sig-line"></div>
            <div>ผู้จ่ายเงิน</div>
            <div class="sig-label">(............................................)</div>
          </div>
        </div>

        <!-- Footer note -->
        <div class="footer-note">
          หมายเหตุ: กรุณาตรวจสอบสินค้าก่อนรับ หากมีข้อผิดพลาดกรุณาแจ้งภายใน 7 วัน
        </div>
        <div class="print-info">พิมพ์เมื่อ: ${formatDateTime(new Date())} &nbsp;|&nbsp; หน้า 1/1</div>

      </div>
    </body>
    </html>
  `;
};

exports.printReceipt = async (req, res, next) => {
  try {
    const { id } = req.params;

    const repair = await prisma.repair.findUnique({
      where: { id: parseInt(id) },
      include: {
        vehicle: {
          include: {
            licensePlate: true,
            vehicleBrand: true,
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
      format: "A5",
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    });

    await browser.close();

    try {
      if (os.platform() === "darwin") {
        const { exec } = require("child_process");
        exec(`lp "${pdfPath}"`, (error, stdout, stderr) => {
          if (error) {
            console.log("Print error:", error);
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
      console.log("Print error:", printError);
      fs.unlink(pdfPath, () => {});
      res.status(500).json({
        message: "เกิดข้อผิดพลาดในการพิมพ์",
        error: printError.message,
      });
    }
  } catch (error) {
    console.log("Error:", error);
    next(error);
  }
};

exports.getReceiptPreview = async (req, res, next) => {
  try {
    const { id } = req.params;

    const repair = await prisma.repair.findUnique({
      where: { id: parseInt(id) },
      include: {
        vehicle: {
          include: {
            licensePlate: true,
            vehicleBrand: true,
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
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(html);
  } catch (error) {
    next(error);
  }
};
