// จับคู่ด้วยเบอร์ก่อน (unique) ไม่มีเบอร์ค่อยจับคู่ด้วยชื่อ
// แก้บิลเดิม: ฟอร์มคือข้อมูลล่าสุด ลบช่องได้ / บิลใหม่: ช่องว่างไม่ทับของเดิม
const resolveCustomer = async (
  tx,
  { name, address, taxId, phoneNumber },
  existingCustomer = null,
) => {
  const isEmpty = !name && !address && !taxId && !phoneNumber;

  // เขียนทับเฉพาะช่องที่กรอกมา — ใช้กับลูกค้ารายอื่นที่ไม่ได้เปิดแก้อยู่
  const mergeInto = (customer) => ({
    name: name || customer.name,
    address: address || customer.address,
    taxId: taxId || customer.taxId,
    phoneNumber: phoneNumber || customer.phoneNumber,
  });

  if (existingCustomer) {
    // ตรงกับลูกค้ารายอื่น = ย้ายบิลไปหาเขา ไม่แก้ชื่อรายเดิมทับ ไม่งั้นได้ลูกค้าซ้ำสองราย
    const claimedByOther = phoneNumber
      ? await tx.customer.findUnique({ where: { phoneNumber } })
      : name
        ? await tx.customer.findFirst({ where: { name } })
        : null;

    if (claimedByOther && claimedByOther.id !== existingCustomer.id) {
      return tx.customer.update({
        where: { id: claimedByOther.id },
        data: mergeInto(claimedByOther),
      });
    }

    if (isEmpty) {
      // ลบข้อมูลลูกค้าออกจนหมด = ตัดออกจากบิล
      // ถ้าไม่มีบิลใบอื่นใช้รายนี้แล้วก็เก็บกวาดทิ้ง ไม่ให้เหลือลูกค้าว่างเปล่าค้างในระบบ
      const usedBy = await tx.repair.count({
        where: { customerId: existingCustomer.id },
      });
      if (usedBy <= 1) {
        await tx.repair.updateMany({
          where: { customerId: existingCustomer.id },
          data: { customerId: null },
        });
        await tx.customer.delete({ where: { id: existingCustomer.id } });
      }
      return null;
    }

    // เปลี่ยนชื่อ = อาจเป็นคนละรายแล้ว ล้างประเภทหน่วยงาน/ร้านค้าทิ้ง
    const isRenamed = (name || null) !== (existingCustomer.name || null);

    return tx.customer.update({
      where: { id: existingCustomer.id },
      data: {
        name: name || null,
        address: address || null,
        taxId: taxId || null,
        phoneNumber: phoneNumber || null,
        ...(isRenamed ? { organizationType: null } : {}),
      },
    });
  }

  if (isEmpty) return null;

  if (phoneNumber) {
    const byPhone = await tx.customer.findUnique({ where: { phoneNumber } });

    if (byPhone) {
      return tx.customer.update({
        where: { id: byPhone.id },
        data: mergeInto(byPhone),
      });
    }

    return tx.customer.create({
      data: {
        name: name || null,
        address: address || null,
        taxId: taxId || null,
        phoneNumber,
      },
    });
  }

  if (name) {
    const byName = await tx.customer.findFirst({ where: { name } });

    if (byName) {
      if (
        (address && address !== byName.address) ||
        (taxId && taxId !== byName.taxId)
      ) {
        return tx.customer.update({
          where: { id: byName.id },
          data: mergeInto(byName),
        });
      }
      return byName;
    }

    return tx.customer.create({
      data: {
        name,
        address: address || null,
        taxId: taxId || null,
        phoneNumber: null,
      },
    });
  }

  // เหลือแต่ที่อยู่หรือเลขผู้เสียภาษี (เช่นงานบริการนอกสถานที่ที่รู้แต่จุดที่ไป) ไม่มีอะไรให้จับคู่กับรายเดิม
  // ยังต้องเก็บ ไม่งั้นที่พิมพ์ไว้หายไปเงียบๆ ตอนบันทึก
  return tx.customer.create({
    data: {
      name: null,
      address: address || null,
      taxId: taxId || null,
      phoneNumber: null,
    },
  });
};

module.exports = { resolveCustomer };
