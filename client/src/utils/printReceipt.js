/**
 * สร้างและพิมพ์ใบเสร็จสำหรับการซ่อม
 * @param {Object} repair - ข้อมูลการซ่อมจาก API
 */
export const printReceipt = (repair) => {
  if (!repair) return;

  // ข้อมูลร้าน
  const shopInfo = {
    name: "มณเฑียรการยาง",
    address: "ที่อยู่ร้าน (กรุณาแก้ไขตามที่อยู่จริง)",
    phone: "โทร: XXX-XXX-XXXX",
  };

  // ฟอร์แมตวันที่
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("th-TH", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // ฟอร์แมตเวลา
  const formatTime = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleTimeString("th-TH", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // ฟอร์แมตจำนวนเงิน
  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return "0";
    return Number(amount).toLocaleString();
  };

  // แปลงวิธีชำระเงิน
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

  // ข้อมูลรถ
  const licensePlate =
    repair.vehicle?.licensePlate?.plateNumber &&
    repair.vehicle?.licensePlate?.province
      ? `${repair.vehicle.licensePlate.plateNumber} ${repair.vehicle.licensePlate.province}`
      : "ไม่ระบุทะเบียน";

  const vehicleBrand =
    `${repair.vehicle?.vehicleBrandModel?.brand || ""} ${repair.vehicle?.vehicleBrandModel?.model || ""}`.trim();

  // สร้างรายการซ่อม HTML
  const generateRepairItemsHTML = () => {
    if (!repair.repairItems || repair.repairItems.length === 0) {
      return '<tr><td colspan="4" style="text-align: center; padding: 10px;">ไม่มีรายการ</td></tr>';
    }

    return repair.repairItems
      .map((item, index) => {
        const name =
          item.customName || item.part?.name || item.service?.name || "-";
        const quantity = item.quantity || 1;
        const unitPrice = item.unitPrice || 0;
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

  // สร้าง HTML สำหรับใบเสร็จ
  const receiptHTML = `
    <!DOCTYPE html>
    <html lang="th">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
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
          font-size: 14px;
          line-height: 1.5;
          color: #333;
          background: #fff;
        }
        
        .receipt {
          max-width: 80mm;
          margin: 0 auto;
          padding: 10mm;
        }
        
        .header {
          text-align: center;
          margin-bottom: 15px;
          padding-bottom: 15px;
          border-bottom: 2px dashed #333;
        }
        
        .shop-name {
          font-size: 20px;
          font-weight: 700;
          margin-bottom: 5px;
        }
        
        .shop-info {
          font-size: 12px;
          color: #666;
        }
        
        .receipt-title {
          text-align: center;
          font-size: 16px;
          font-weight: 600;
          margin: 15px 0;
        }
        
        .info-section {
          margin-bottom: 15px;
        }
        
        .info-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 5px;
          font-size: 13px;
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
          margin: 10px 0;
        }
        
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 15px;
          font-size: 12px;
        }
        
        .items-table th {
          background: #f5f5f5;
          padding: 8px;
          text-align: left;
          font-weight: 600;
          border-bottom: 2px solid #333;
        }
        
        .items-table th:nth-child(3),
        .items-table th:nth-child(4),
        .items-table th:nth-child(5) {
          text-align: right;
        }
        
        .total-section {
          border-top: 2px solid #333;
          padding-top: 10px;
          margin-top: 10px;
        }
        
        .total-row {
          display: flex;
          justify-content: space-between;
          font-size: 14px;
          margin-bottom: 5px;
        }
        
        .grand-total {
          font-size: 18px;
          font-weight: 700;
          color: #1976d2;
        }
        
        .footer {
          text-align: center;
          margin-top: 20px;
          padding-top: 15px;
          border-top: 2px dashed #333;
          font-size: 12px;
          color: #666;
        }
        
        .thank-you {
          font-size: 14px;
          font-weight: 600;
          color: #333;
          margin-bottom: 5px;
        }
        
        @media print {
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          
          .receipt {
            max-width: 100%;
            padding: 5mm;
          }
          
          @page {
            size: 80mm auto;
            margin: 0;
          }
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
              <th style="width: 30px;">#</th>
              <th>รายการ</th>
              <th style="width: 40px; text-align: center;">จำนวน</th>
              <th style="width: 60px; text-align: right;">ราคา</th>
              <th style="width: 70px; text-align: right;">รวม</th>
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
      
      <script>
        window.onload = function() {
          window.print();
          window.onafterprint = function() {
            window.close();
          };
        };
      </script>
    </body>
    </html>
  `;

  // เปิดหน้าต่างใหม่และพิมพ์
  const printWindow = window.open("", "_blank", "width=400,height=600");
  if (printWindow) {
    printWindow.document.write(receiptHTML);
    printWindow.document.close();
  }
};
