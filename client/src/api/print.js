import api from "@/lib/api";

/**
 * สั่งพิมพ์ใบเสร็จไปยังเครื่องพิมพ์
 * @param {number} repairId - ID ของการซ่อม
 */
export const printReceipt = (repairId) => {
  return api.post(`/api/prints/${repairId}`);
};
