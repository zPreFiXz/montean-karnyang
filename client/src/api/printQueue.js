import api from "@/lib/api";

export const addToPrintQueue = async (repairId) => {
  return await api.post("/api/print-queue", { repairId });
};

export const getPendingPrintQueue = async () => {
  return await api.get("/api/print-queue/pending");
};

export const markAsPrinted = async (id) => {
  return await api.patch(`/api/print-queue/${id}/printed`);
};

export const deleteFromPrintQueue = async (id) => {
  return await api.delete(`/api/print-queue/${id}`);
};
