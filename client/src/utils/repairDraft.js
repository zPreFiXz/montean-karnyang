// ใช้ localStorage ไม่ใช่ sessionStorage เพราะบนมือถือแท็บถูกปิดทิ้งเองได้
// สองหน้าเก็บร่างแยกกัน เพราะรูปร่างข้อมูลต่างกัน
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

// บิลใบเดียวเดินผ่านทั้งสองหน้าได้ จึงล้างร่างทั้งสองพร้อมกัน
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
