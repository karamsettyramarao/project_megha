const express = require("express");

const {
  createExam,
  getActiveExam,
  getExamById,
  getAllExams,
  updateExam
} = require("../controllers/examController");

const {
  authMiddleware,
  adminOnly
} = require("../middleware/authMiddleware");

const router = express.Router();


// ==========================================
// ADMIN ROUTES
// ==========================================

router.get(
  "/",
  authMiddleware,
  adminOnly,
  getAllExams
);

router.post(
  "/",
  authMiddleware,
  adminOnly,
  createExam
);

router.put(
  "/:id",
  authMiddleware,
  adminOnly,
  updateExam
);


// ==========================================
// USER / COMMON ROUTES
// ==========================================

// IMPORTANT:
// These must NOT have adminOnly middleware.

router.get(
  "/active",
  authMiddleware,
  getActiveExam
);

router.get(
  "/:id",
  authMiddleware,
  getExamById
);


module.exports = router;