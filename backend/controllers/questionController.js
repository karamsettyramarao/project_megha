const db = require("../config/database");

// ==========================================
// ADD QUESTION - ADMIN
// ==========================================

const addQuestion = async (req, res) => {
  try {
    const { examId } = req.params;

    const {
      question_text,
      option_a,
      option_b,
      option_c,
      option_d,
      correct_answer,
      explanation
    } = req.body;

    // Validate required fields
    if (
      !question_text ||
      !option_a ||
      !option_b ||
      !option_c ||
      !option_d ||
      !correct_answer
    ) {
      return res.status(400).json({
        success: false,
        message: "All question fields are required"
      });
    }

    // Validate correct answer
    const validAnswers = ["A", "B", "C", "D"];

    const normalizedCorrectAnswer =
      correct_answer.toUpperCase();

    if (!validAnswers.includes(normalizedCorrectAnswer)) {
      return res.status(400).json({
        success: false,
        message: "Correct answer must be A, B, C or D"
      });
    }

    // Check exam exists
    const examResult = await db.query(
      `
      SELECT id
      FROM exams
      WHERE id = $1
      `,
      [examId]
    );

    if (examResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Exam not found"
      });
    }

    // Get next question order
    const orderResult = await db.query(
      `
      SELECT MAX(question_order) AS max_order
      FROM questions
      WHERE exam_id = $1
      `,
      [examId]
    );

    const maxOrder =
      orderResult.rows[0].max_order;

    const nextOrder =
      maxOrder === null
        ? 1
        : Number(maxOrder) + 1;

    // Insert question
    const insertResult = await db.query(
      `
      INSERT INTO questions
      (
        exam_id,
        question_text,
        option_a,
        option_b,
        option_c,
        option_d,
        correct_answer,
        explanation,
        question_order
      )
      VALUES
      ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id
      `,
      [
        examId,
        question_text.trim(),
        option_a.trim(),
        option_b.trim(),
        option_c.trim(),
        option_d.trim(),
        normalizedCorrectAnswer,
        explanation
          ? explanation.trim()
          : null,
        nextOrder
      ]
    );

    return res.status(201).json({
      success: true,
      message: "Question added successfully",
      questionId: insertResult.rows[0].id,
      examId: Number(examId),
      questionOrder: nextOrder
    });

  } catch (error) {

    console.error(
      "Add question error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message: "Failed to add question",
      error: error.message
    });
  }
};


// ==========================================
// GET QUESTIONS - USER
// ==========================================

const getExamQuestions = async (req, res) => {
  try {
    const { id: examId } = req.params;

    const result = await db.query(
      `
      SELECT
        id,
        exam_id,
        question_text,
        option_a,
        option_b,
        option_c,
        option_d,
        question_order
      FROM questions
      WHERE exam_id = $1
      ORDER BY question_order ASC, id ASC
      `,
      [examId]
    );

    const questions = result.rows;

    return res.status(200).json({
      success: true,
      examId: Number(examId),
      totalQuestions: questions.length,
      questions
    });

  } catch (error) {

    console.error(
      "Get questions error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch questions",
      error: error.message
    });
  }
};


// ==========================================
// DELETE QUESTION - ADMIN
// ==========================================

const deleteQuestion = async (req, res) => {
  try {
    const {
      examId,
      questionId
    } = req.params;

    // ------------------------------------------
    // Check question belongs to exam
    // ------------------------------------------

    const checkResult = await db.query(
      `
      SELECT id
      FROM questions
      WHERE id = $1
        AND exam_id = $2
      `,
      [questionId, examId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message:
          "Question not found for this exam"
      });
    }

    // ------------------------------------------
    // Delete question
    // ------------------------------------------

    await db.query(
      `
      DELETE FROM questions
      WHERE id = $1
        AND exam_id = $2
      `,
      [questionId, examId]
    );

    // ------------------------------------------
    // Get remaining questions
    // ------------------------------------------

    const remainingResult = await db.query(
      `
      SELECT id
      FROM questions
      WHERE exam_id = $1
      ORDER BY question_order ASC, id ASC
      `,
      [examId]
    );

    const remainingQuestions =
      remainingResult.rows;

    // ------------------------------------------
    // No questions remaining
    // ------------------------------------------

    if (remainingQuestions.length === 0) {
      return res.status(200).json({
        success: true,
        message:
          "Question deleted successfully",
        examId: Number(examId),
        totalQuestions: 0
      });
    }

    // ------------------------------------------
    // Re-number questions
    // ------------------------------------------

    for (
      let index = 0;
      index < remainingQuestions.length;
      index++
    ) {
      await db.query(
        `
        UPDATE questions
        SET question_order = $1
        WHERE id = $2
        `,
        [
          index + 1,
          remainingQuestions[index].id
        ]
      );
    }

    return res.status(200).json({
      success: true,
      message:
        "Question deleted successfully",
      examId: Number(examId),
      totalQuestions:
        remainingQuestions.length
    });

  } catch (error) {

    console.error(
      "Delete question error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to delete question",
      error: error.message
    });
  }
};


// ==========================================
// EXPORT
// ==========================================

module.exports = {
  addQuestion,
  getExamQuestions,
  deleteQuestion
};