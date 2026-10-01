const express = require("express");

const {
  getExamAnalytics
} = require("../controllers/adminAnalyticsController");

const {
  authMiddleware,
  adminOnly
} = require("../middleware/authMiddleware");

const router = express.Router();

// ==========================================
// GET EXAM ANALYTICS
// ==========================================

router.get(
  "/:examId/analytics",
  authMiddleware,
  adminOnly,
  getExamAnalytics
);

module.exports = router;