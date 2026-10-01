const express = require("express");

const {
  getLeaderboard
} = require("../controllers/leaderboardController");

const {
  authMiddleware
} = require("../middleware/authMiddleware");

const router = express.Router();

// ==========================================
// GET LEADERBOARD
// ==========================================

router.get(
  "/:examId",
  authMiddleware,
  getLeaderboard
);

module.exports = router;