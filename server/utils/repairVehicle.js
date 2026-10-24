const findOrCreateVehicleModel = async (tx, brand, model) => {
  const vehicleModel = await tx.vehicleModel.findUnique({
    where: { brand_model: { brand, model } },
  });

  if (vehicleModel) return vehicleModel;

  return tx.vehicleModel.create({ data: { brand, model } });
};

// รถของบิลใหม่: ทะเบียนเดิมใช้รถคันเดิม (แก้รุ่นตามที่กรอก) ทะเบียนใหม่สร้างคันใหม่
// ไม่มีทะเบียน = แถวรถร่วมของรุ่นนั้น แยกคันตามเบอร์รถ
const resolveVehicleForNewBill = async (
  tx,
  { brand, model, plate, province, fleet },
) => {
  let vehicle = null;
  let licensePlate;
  const vehicleModel = await findOrCreateVehicleModel(tx, brand, model);

  if (plate && province) {
    licensePlate = await tx.licensePlate.findUnique({
      where: { plateNumber_province: { plateNumber: plate, province } },
    });

    if (licensePlate) {
      // ทะเบียนผูกได้กับรถคันเดียว กรอกรุ่นต่างจากเดิมจึงแก้รุ่นของคันเดิมแทนสร้างคันใหม่
      vehicle = await tx.vehicle.findUnique({
        where: { licensePlateId: licensePlate.id },
      });

      if (!vehicle) {
        vehicle = await tx.vehicle.create({
          data: {
            vehicleModelId: vehicleModel.id,
            licensePlateId: licensePlate.id,
            fleetNo: fleet,
          },
        });
      } else if (
        vehicle.vehicleModelId !== vehicleModel.id ||
        (fleet && vehicle.fleetNo !== fleet)
      ) {
        // เปิดบิลใหม่แล้วเว้นช่องเบอร์ไว้ = ไม่ได้กรอก ไม่ใช่ตั้งใจลบ จึงเปลี่ยนเฉพาะตอนกรอกมา
        vehicle = await tx.vehicle.update({
          where: { id: vehicle.id },
          data: {
            vehicleModelId: vehicleModel.id,
            ...(fleet && { fleetNo: fleet }),
          },
        });
      }
    } else {
      licensePlate = await tx.licensePlate.create({
        data: { plateNumber: plate, province },
      });

      vehicle = await tx.vehicle.create({
        data: {
          vehicleModelId: vehicleModel.id,
          licensePlateId: licensePlate.id,
          fleetNo: fleet,
        },
      });
    }
  } else {
    // รถไม่มีทะเบียนรุ่นเดียวกันใช้แถวรถร่วมกัน รถที่มีเบอร์จึงแยกคันตามเบอร์
    // ไม่งั้นใส่เบอร์ให้คันหนึ่ง ทุกคันรุ่นเดียวกันที่ไม่มีทะเบียนจะได้เบอร์นั้นไปด้วย
    vehicle = await tx.vehicle.findFirst({
      where: {
        vehicleModelId: vehicleModel.id,
        licensePlateId: null,
        fleetNo: fleet,
      },
    });

    if (!vehicle) {
      vehicle = await tx.vehicle.create({
        data: {
          vehicleModelId: vehicleModel.id,
          licensePlateId: null,
          fleetNo: fleet,
        },
      });
    }
  }
  return vehicle;
};

const resolveVehicleForEdit = async (
  tx,
  { brand, model, plate, province, fleet },
  currentVehicleId,
) => {
  let vehicle = null;
  const vehicleModel = await findOrCreateVehicleModel(tx, brand, model);

  if (plate && province) {
    let licensePlate = await tx.licensePlate.findUnique({
      where: { plateNumber_province: { plateNumber: plate, province } },
      include: { vehicle: { select: { id: true } } },
    });
    if (!licensePlate) {
      licensePlate = await tx.licensePlate.create({
        data: { plateNumber: plate, province },
      });
    }

    const currentVehicle = currentVehicleId
      ? await tx.vehicle.findUnique({
          where: { id: currentVehicleId },
          select: { id: true, licensePlateId: true },
        })
      : null;

    // ทะเบียนผูกได้กับรถคันเดียว ถ้าทะเบียนนี้มีรถอยู่แล้วต้องย้ายบิลไปคันนั้น
    // รถเดิมที่ไม่มีทะเบียนเป็นแถวที่บิลรุ่นเดียวกันใช้ร่วมกัน ห้ามแก้ทับ ต้องสร้างคันใหม่
    // หน้าแก้ไขเติมเบอร์เดิมไว้ให้แล้ว ช่องว่างตอนแก้จึงแปลว่าลบเบอร์ออก
    const targetId =
      licensePlate.vehicle?.id ??
      (currentVehicle?.licensePlateId ? currentVehicle.id : null);
    const data = {
      vehicleModelId: vehicleModel.id,
      licensePlateId: licensePlate.id,
      fleetNo: fleet,
    };
    vehicle = targetId
      ? await tx.vehicle.update({ where: { id: targetId }, data })
      : await tx.vehicle.create({ data });
  } else {
    // ไม่มีทะเบียน = ใช้แถวรถร่วมของรุ่นนั้นแยกตามเบอร์รถ เหมือนบิลใหม่
    // ห้ามแก้รถคันเดิมของบิลตรงๆ: ถ้าเดิมมีทะเบียน บิลอื่นของรถคันนั้นจะหายทะเบียนไปด้วย
    // ถ้าเดิมเป็นแถวร่วม บิลอื่นที่ใช้แถวเดียวกันจะเปลี่ยนรุ่นตามไปหมด
    vehicle =
      (await tx.vehicle.findFirst({
        where: {
          vehicleModelId: vehicleModel.id,
          licensePlateId: null,
          fleetNo: fleet,
        },
      })) ||
      (await tx.vehicle.create({
        data: {
          vehicleModelId: vehicleModel.id,
          licensePlateId: null,
          fleetNo: fleet,
        },
      }));
  }
  return vehicle;
};

// บิลย้ายไปรถคันอื่นแล้ว รถคันเดิมที่ไม่มีทะเบียนและไม่เหลือบิลไหนใช้ ลบทิ้ง ไม่ให้ค้างในประวัติรถ
// รถที่มีทะเบียนเก็บไว้ ทะเบียนคือประวัติของรถคันนั้น
const removeOrphanVehicle = async (tx, vehicleId) => {
  if (!vehicleId) return;
  const old = await tx.vehicle.findUnique({
    where: { id: vehicleId },
    select: { licensePlateId: true, _count: { select: { repairs: true } } },
  });
  if (old && !old.licensePlateId && old._count.repairs === 0) {
    await tx.vehicle.delete({ where: { id: vehicleId } });
  }
};

module.exports = {
  resolveVehicleForNewBill,
  resolveVehicleForEdit,
  removeOrphanVehicle,
};
