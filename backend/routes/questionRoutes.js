const express = require("express");

const {
  addQuestion,
  getExamQuestions,
  deleteQuestion
} = require("../controllers/questionController");

const {
  authMiddleware,
  adminOnly
} = require("../middleware/authMiddleware");

const router = express.Router();


// ===============================
// ADD QUESTION - ADMIN ONLY
// ===============================

router.post(
  "/:examId/questions",
  authMiddleware,
  adminOnly,
  addQuestion
);


// ===============================
// GET QUESTIONS
// ===============================

router.get(
  "/:examId/questions",
  authMiddleware,
  getExamQuestions
);


// ===============================
// DELETE QUESTION - ADMIN ONLY
// ===============================

router.delete(
  "/:examId/questions/:questionId",
  authMiddleware,
  adminOnly,
  deleteQuestion
);


module.exports = router;