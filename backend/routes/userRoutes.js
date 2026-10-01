const express = require("express");

const {
  getUserProfile
} = require("../controllers/userController");

const {
  authMiddleware,
  userOnly
} = require("../middleware/authMiddleware");

const router = express.Router();

// ==========================================
// GET USER PROFILE + ANALYTICS
// ==========================================

router.get(
  "/profile",
  authMiddleware,
  userOnly,
  getUserProfile
);

module.exports = router;