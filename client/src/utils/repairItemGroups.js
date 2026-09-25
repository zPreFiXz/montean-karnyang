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

// บิลงานซ่อมทั่วไปไม่ได้แบ่งหัวข้อตามฝั่ง แสดงเรียงตามลำดับในบิล
// ของที่ใส่ทั้งซ้ายและขวายุบเป็นบรรทัดเดียวตรงตำแหน่งของบรรทัดแรก พร้อมป้ายว่าฝั่งไหน
// side ในบิลที่บันทึกแล้วเป็นตัวใหญ่ (LEFT) ส่วนในหน้ากรอกเป็นตัวเล็ก (left) จึงเทียบแบบไม่สนตัวพิมพ์
const SIDE_TEXT = { left: "L", right: "R" };

export const mergeSidesInOrder = (items = []) => {
  const sideOf = (item) => String(item.side || "").toLowerCase();
  const rows = [];
  const openLeft = new Map();
  const openRight = new Map();

  for (const item of items) {
    const side = sideOf(item);
    // หน้ากรอกบิลเก็บ "ทั้งสองข้าง" เป็นบรรทัดเดียวอยู่แล้ว
    if (side === "both") {
      rows.push({ item, sideLabel: "R-L" });
      continue;
    }
    if (side !== "left" && side !== "right") {
      rows.push({ item, sideLabel: "" });
      continue;
    }

    const key = keyOf(item);
    const waiting = side === "left" ? openRight : openLeft;
    const pair = waiting.get(key)?.shift();
    if (pair) {
      pair.item = {
        ...pair.item,
        quantity: Number(pair.item.quantity || 0) + Number(item.quantity || 0),
      };
      pair.sideLabel = "R-L";
      continue;
    }

    const row = { item, sideLabel: SIDE_TEXT[side] };
    rows.push(row);
    const own = side === "left" ? openLeft : openRight;
    if (!own.has(key)) own.set(key, []);
    own.get(key).push(row);
  }

  return rows;
};

// หน้ากรอกบิลถือ "ทั้งสองข้าง" เป็นบรรทัดเดียว (side = "both", จำนวนนับเป็นชิ้นรวมสองข้าง)
// แต่ฐานข้อมูล ใบเสร็จ และหน้าเช็กช่วงล่างรู้จักแค่ซ้ายกับขวา จึงแตกเป็นสองบรรทัดก่อนส่งออกจากหน้ากรอก
export const expandBothSides = (items = []) =>
  items.flatMap((item) =>
    item.side === "both"
      ? [
          { ...item, side: "left", quantity: item.quantity / 2 },
          { ...item, side: "right", quantity: item.quantity / 2 },
        ]
      : [item],
  );

// กลับกันตอนเปิดบิลมาแก้: ซ้ายกับขวาของชิ้นเดียวกัน จำนวนเท่ากัน รวมกลับเป็นบรรทัด "ทั้งสองข้าง"
// จำนวนไม่เท่ากัน (ซ้าย 2 ขวา 1) คงไว้เป็นสองบรรทัดตามเดิม เพราะรวมแล้วแบ่งกลับไม่ได้
export const collapseSidePairs = (items = []) => {
  const used = new Set();
  const rows = [];

  items.forEach((item, index) => {
    if (used.has(index)) return;
    const side = String(item.side || "").toLowerCase();
    if (side !== "left" && side !== "right") {
      rows.push(item);
      return;
    }

    const other = side === "left" ? "right" : "left";
    const partner = items.findIndex(
      (candidate, i) =>
        i !== index &&
        !used.has(i) &&
        String(candidate.side || "").toLowerCase() === other &&
        keyOf(candidate) === keyOf(item) &&
        Number(candidate.quantity) === Number(item.quantity),
    );

    if (partner === -1) {
      rows.push(item);
      return;
    }

    used.add(partner);
    rows.push({
      ...item,
      side: "both",
      quantity: Number(item.quantity) + Number(items[partner].quantity),
    });
  });

  return rows;
};

// จำนวนรายการที่บอกคน: ของชิ้นเดียวกันที่ใส่ทั้งซ้ายและขวานับเป็นรายการเดียว
// ตรงกับที่หน้าจอยุบเป็นการ์ดเดียว (R-L) และที่ใบเสร็จยุบเป็นแถวเดียว
export const countDisplayedItems = (items = []) =>
  mergeSidesInOrder(items).length;
