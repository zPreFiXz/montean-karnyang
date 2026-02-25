import api from "@/lib/api";

export const printReceipt = (id) => {
  return api.post(`/api/prints/${id}`);
};

export const getReceiptPreview = (id) => {
  return api.get(`/api/prints/${id}/preview`);
};
