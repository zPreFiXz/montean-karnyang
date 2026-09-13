// อ่านจำนวนเงินเป็นตัวหนังสือไทยสำหรับช่อง "จำนวนเงินรวมทั้งสิ้น" ในใบเสร็จ
const THAI_DIGITS = [
  "",
  "หนึ่ง",
  "สอง",
  "สาม",
  "สี่",
  "ห้า",
  "หก",
  "เจ็ด",
  "แปด",
  "เก้า",
];
const THAI_PLACES = ["", "สิบ", "ร้อย", "พัน", "หมื่น", "แสน"];

// อ่านเลขไม่เกินหลักแสน (ล้านขึ้นไปตัดเป็นก้อนแล้วเรียก "ล้าน" ต่อท้าย)
const readBelowMillion = (value) => {
  const digits = String(value).split("").map(Number);
  let text = "";

  digits.forEach((digit, index) => {
    if (digit === 0) return;
    const place = digits.length - index - 1;

    // ยี่สิบ ไม่ใช่ สองสิบ / สิบ ไม่ใช่ หนึ่งสิบ / เอ็ด ไม่ใช่ หนึ่ง เมื่ออยู่หลักหน่วยของเลขสองหลักขึ้นไป
    if (place === 1 && digit === 2) text += "ยี่";
    else if (place === 1 && digit === 1) text += "";
    else if (place === 0 && digit === 1 && digits.length > 1) text += "เอ็ด";
    else text += THAI_DIGITS[digit];

    if (!(place === 0 && digit === 1 && digits.length > 1)) {
      text += THAI_PLACES[place];
    }
  });

  return text;
};

const readInteger = (value) => {
  if (value === 0) return "ศูนย์";
  if (value >= 1000000) {
    const millions = Math.floor(value / 1000000);
    const rest = value % 1000000;
    return `${readInteger(millions)}ล้าน${rest ? readBelowMillion(rest) : ""}`;
  }
  return readBelowMillion(value);
};

export const bahtText = (amount) => {
  const number = Number(amount) || 0;
  const isNegative = number < 0;
  const absolute = Math.abs(number);
  const baht = Math.floor(absolute);
  // ปัดเศษสตางค์ก่อน ไม่งั้น 0.145 จะกลายเป็นสิบสี่สตางค์ทั้งที่ควรเป็นสิบห้า
  const satang = Math.round((absolute - baht) * 100);

  const text = satang
    ? `${readInteger(baht)}บาท${readBelowMillion(satang)}สตางค์`
    : `${readInteger(baht)}บาทถ้วน`;

  return isNegative ? `ลบ${text}` : text;
};
