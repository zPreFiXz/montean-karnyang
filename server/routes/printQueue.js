const express = require("express");
const router = express.Router();

// Middlewares
const { authCheck } = require("../middlewares/auth");

// Controllers
const {
  addToPrintQueue,
  getPendingPrintQueue,
  markAsPrinted,
  deleteFromPrintQueue,
} = require("../controllers/printQueue");

// @ENDPOINTS http://localhost:3000/api/print-queue
router.post("/print-queue", authCheck, addToPrintQueue);

// @ENDPOINTS http://localhost:3000/api/print-queue/pending
router.get("/print-queue/pending", authCheck, getPendingPrintQueue);

// @ENDPOINTS http://localhost:3000/api/print-queue/1/printed
router.patch("/print-queue/:id/printed", authCheck, markAsPrinted);

// @ENDPOINTS http://localhost:3000/api/print-queue/1
router.delete("/print-queue/:id", authCheck, deleteFromPrintQueue);

module.exports = router;
