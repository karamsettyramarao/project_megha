const express = require("express");

const {
  authMiddleware,
  adminOnly,
  userOnly
} = require("../middleware/authMiddleware");

const router = express.Router();


// ===============================
// PROTECTED ADMIN TEST
// ===============================

router.get(
  "/admin",
  authMiddleware,
  adminOnly,
  (req, res) => {
    res.json({
      success: true,
      message: "Admin authentication working",
      user: req.user
    });
  }
);


// ===============================
// PROTECTED USER TEST
// ===============================

router.get(
  "/user",
  authMiddleware,
  userOnly,
  (req, res) => {
    res.json({
      success: true,
      message: "User authentication working",
      user: req.user
    });
  }
);


module.exports = router;