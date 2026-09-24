// อะไหล่ตัวเดียวกันที่เปลี่ยนทั้งซ้ายและขวา ยุบเป็นบรรทัดเดียว "ซ้าย-ขวา × 2"
// เพราะร้านพูดกับลูกค้าแบบนั้น ไม่มีใครพูดว่าซ้ายหนึ่งขวาหนึ่ง
// ยุบเฉพาะตอนแสดงผล — ในฐานข้อมูลยังเป็นสองรายการแยกฝั่ง ประวัติจึงยังบอกได้ว่าเปลี่ยนข้างไหน
// บรรทัดจากบิลที่บันทึกแล้วมี partId/serviceId ส่วน id คือเลขบรรทัดในบิลซึ่งไม่ซ้ำกันเลย
// บริการ (ตั้งลูกปืนล้อ) partId เป็น null ถ้าไม่ดู serviceId ก่อน จะตกไปใช้เลขบรรทัด แล้วไม่มีวันจับคู่ได้
// รายการในหน้ากรอกบิลไม่มีสองช่องนั้น id ของมันคือรหัสอะไหล่หรือบริการในคลังอยู่แล้ว
const keyOf = (item) =>
  [
    item.partId ?? item.serviceId ?? item.id ?? "",
    item.partNumber ?? "",
    item.brand ?? "",
    item.itemName ?? item.name ?? "",
    item.unitPrice ?? item.sellingPrice ?? "",
  ].join("|");

const sumQuantity = (items) =>
  items.reduce((total, item) => total + (item.quantity || 0), 0);

// คืน { bothSides, leftOnly, rightOnly } โดยรับรายการที่แยกฝั่งมาแล้ว
export const groupBySidePairs = (leftItems = [], rightItems = []) => {
  const rightByKey = new Map();
  for (const item of rightItems) {
    const key = keyOf(item);
    if (!rightByKey.has(key)) rightByKey.set(key, []);
    rightByKey.get(key).push(item);
  }

  const bothSides = [];
  const leftOnly = [];

  for (const item of leftItems) {
    const key = keyOf(item);
    const matches = rightByKey.get(key);

    if (matches && matches.length > 0) {
      const pair = matches.shift();
      bothSides.push({
        ...item,
        quantity: (item.quantity || 0) + (pair.quantity || 0),
      });
    } else {
      leftOnly.push(item);
    }
  }

  const rightOnly = [...rightByKey.values()].flat();

  return { bothSides, leftOnly, rightOnly };
};

export const groupTotal = sumQuantity;
