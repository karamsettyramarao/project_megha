const express = require("express");

const {
  startExam,
  submitExam,
  getExamResult
} = require("../controllers/attemptController");

const {
  getActiveExam,
  getExamById
} = require("../controllers/examController");

const {
  authMiddleware,
  userOnly
} = require("../middleware/authMiddleware");

const router = express.Router();


// ==========================================
// GET ACTIVE EXAM
// ==========================================

router.get(
  "/active",
  authMiddleware,
  userOnly,
  getActiveExam
);


// ==========================================
// GET EXAM BY ID
// ==========================================

router.get(
  "/:id",
  authMiddleware,
  userOnly,
  getExamById
);


// ==========================================
// START EXAM
// ==========================================

router.post(
  "/:id/start",
  authMiddleware,
  userOnly,
  startExam
);


// ==========================================
// SUBMIT EXAM
// ==========================================

router.post(
  "/:id/submit",
  authMiddleware,
  userOnly,
  submitExam
);


// ==========================================
// GET EXAM RESULT
// ==========================================

router.get(
  "/:id/result",
  authMiddleware,
  userOnly,
  getExamResult
);


module.exports = router;