// เก็บร่างบิลที่ยังกรอกไม่เสร็จไว้ในเครื่อง เผื่อออกจากหน้ากลางคัน
// (นึกได้ว่าอะไหล่ไม่มีในสต็อกแล้วต้องไปเพิ่มก่อน, กดย้อนกลับพลาด, สลับแอปไปรับสาย, เครื่องรีเฟรชเอง)
//
// ใช้ localStorage ไม่ใช่ sessionStorage เพราะบนมือถือแท็บถูกปิดทิ้งเองได้เมื่อหน่วยความจำไม่พอ
//
// สองหน้าที่เปิดบิลได้เก็บร่างแยกกัน เพราะรูปร่างข้อมูลต่างกัน
// (หน้าเช็กช่วงล่างมีอะไหล่ที่ติ๊กตามตำแหน่งซ้าย/ขวา/อื่นๆ ด้วย)
export const DRAFT_REPAIR = "repair";
export const DRAFT_SUSPENSION = "suspension";

const STORAGE_KEYS = {
  [DRAFT_REPAIR]: "repair-draft",
  [DRAFT_SUSPENSION]: "suspension-draft",
};

// หมดอายุใน 12 ชั่วโมง — ร่างของเมื่อวานไม่ควรโผล่มาตอนเปิดบิลใหม่เช้านี้
const MAX_AGE_MS = 12 * 60 * 60 * 1000;

export const saveDraft = (kind, draft) => {
  try {
    localStorage.setItem(
      STORAGE_KEYS[kind],
      JSON.stringify({ savedAt: Date.now(), ...draft }),
    );
  } catch {
    // พื้นที่เต็มหรือโหมดส่วนตัว — ไม่เก็บร่างก็ยังกรอกบิลได้ตามปกติ
  }
};

export const loadDraft = (kind) => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS[kind]);
    if (!raw) return null;

    const draft = JSON.parse(raw);
    if (!draft?.savedAt || Date.now() - draft.savedAt > MAX_AGE_MS) {
      clearDraft(kind);
      return null;
    }

    return draft;
  } catch {
    return null;
  }
};

export const clearDraft = (kind) => {
  try {
    localStorage.removeItem(STORAGE_KEYS[kind]);
  } catch {
    // ลบไม่ได้ก็ปล่อยไว้ เดี๋ยวหมดอายุเอง
  }
};

// บิลถูกบันทึกแล้ว ร่างของทั้งสองหน้าหมดหน้าที่พร้อมกัน
// เพราะบิลใบเดียวเดินผ่านทั้งสองหน้าได้ (เปิดบิลเปลี่ยนยางแล้วกดเช็กช่วงล่างต่อ)
export const clearAllDrafts = () => {
  clearDraft(DRAFT_REPAIR);
  clearDraft(DRAFT_SUSPENSION);
};

// ร่างเปล่าไม่ต้องเก็บ ไม่งั้นแค่เปิดหน้าทิ้งไว้ก็ได้ร่างว่างค้างไว้
export const isDraftWorthSaving = (draft) => {
  if (draft?.repairItems?.length) return true;

  return Object.entries(draft?.repairData || {}).some(
    ([key, value]) =>
      key !== "type" &&
      key !== "noVehicle" &&
      String(value ?? "").trim() !== "",
  );
};
