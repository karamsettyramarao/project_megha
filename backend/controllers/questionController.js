const db = require("../config/database");

// ==========================================
// ADD QUESTION - ADMIN
// ==========================================

const addQuestion = (req, res) => {
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

  if (!validAnswers.includes(correct_answer.toUpperCase())) {
    return res.status(400).json({
      success: false,
      message: "Correct answer must be A, B, C or D"
    });
  }

  // Check exam exists
  const examSql = `
    SELECT id
    FROM exams
    WHERE id = ?
  `;

  db.get(
    examSql,
    [examId],
    (examError, exam) => {
      if (examError) {
        console.error(
          "Check exam error:",
          examError.message
        );

        return res.status(500).json({
          success: false,
          message: "Failed to check exam"
        });
      }

      if (!exam) {
        return res.status(404).json({
          success: false,
          message: "Exam not found"
        });
      }

      // Get next question order
      const orderSql = `
        SELECT MAX(question_order) AS max_order
        FROM questions
        WHERE exam_id = ?
      `;

      db.get(
        orderSql,
        [examId],
        (orderError, result) => {
          if (orderError) {
            console.error(
              "Question order error:",
              orderError.message
            );

            return res.status(500).json({
              success: false,
              message:
                "Failed to determine question order"
            });
          }

          const nextOrder =
            (result.max_order || 0) + 1;

          const insertSql = `
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
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `;

          db.run(
            insertSql,
            [
              examId,
              question_text.trim(),
              option_a.trim(),
              option_b.trim(),
              option_c.trim(),
              option_d.trim(),
              correct_answer.toUpperCase(),
              explanation
                ? explanation.trim()
                : null,
              nextOrder
            ],
            function (insertError) {
              if (insertError) {
                console.error(
                  "Add question error:",
                  insertError.message
                );

                return res.status(500).json({
                  success: false,
                  message:
                    "Failed to add question"
                });
              }

              return res.status(201).json({
                success: true,
                message:
                  "Question added successfully",
                questionId: this.lastID,
                examId: Number(examId),
                questionOrder: nextOrder
              });
            }
          );
        }
      );
    }
  );
};


// ==========================================
// GET QUESTIONS - USER
// ==========================================

const getExamQuestions = (req, res) => {
  const { examId } = req.params;

  const sql = `
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
    WHERE exam_id = ?
    ORDER BY question_order ASC, id ASC
  `;

  db.all(
    sql,
    [examId],
    (error, questions) => {
      if (error) {
        console.error(
          "Get questions error:",
          error.message
        );

        return res.status(500).json({
          success: false,
          message:
            "Failed to fetch questions"
        });
      }

      return res.status(200).json({
        success: true,
        examId: Number(examId),
        totalQuestions: questions.length,
        questions
      });
    }
  );
};


// ==========================================
// DELETE QUESTION - ADMIN
// ==========================================

const deleteQuestion = (req, res) => {
  const {
    examId,
    questionId
  } = req.params;

  // First check whether question belongs
  // to the requested exam
  const checkSql = `
    SELECT id
    FROM questions
    WHERE id = ?
      AND exam_id = ?
  `;

  db.get(
    checkSql,
    [questionId, examId],
    (checkError, question) => {
      if (checkError) {
        console.error(
          "Check question error:",
          checkError.message
        );

        return res.status(500).json({
          success: false,
          message:
            "Failed to check question"
        });
      }

      if (!question) {
        return res.status(404).json({
          success: false,
          message:
            "Question not found for this exam"
        });
      }

      // Delete question
      const deleteSql = `
        DELETE FROM questions
        WHERE id = ?
          AND exam_id = ?
      `;

      db.run(
        deleteSql,
        [questionId, examId],
        function (deleteError) {
          if (deleteError) {
            console.error(
              "Delete question error:",
              deleteError.message
            );

            return res.status(500).json({
              success: false,
              message:
                "Failed to delete question"
            });
          }

          // Get remaining questions
          // so question_order can be fixed
          const remainingSql = `
            SELECT id
            FROM questions
            WHERE exam_id = ?
            ORDER BY question_order ASC, id ASC
          `;

          db.all(
            remainingSql,
            [examId],
            (remainingError, remainingQuestions) => {
              if (remainingError) {
                console.error(
                  "Remaining questions error:",
                  remainingError.message
                );

                return res.status(500).json({
                  success: false,
                  message:
                    "Question deleted but order update failed"
                });
              }

              // No questions remaining
              if (remainingQuestions.length === 0) {
                return res.status(200).json({
                  success: true,
                  message:
                    "Question deleted successfully",
                  examId: Number(examId),
                  totalQuestions: 0
                });
              }

              let updatedCount = 0;
              let updateFailed = false;

              remainingQuestions.forEach(
                (item, index) => {
                  const updateSql = `
                    UPDATE questions
                    SET question_order = ?
                    WHERE id = ?
                  `;

                  db.run(
                    updateSql,
                    [index + 1, item.id],
                    (updateError) => {
                      if (updateFailed) {
                        return;
                      }

                      if (updateError) {
                        updateFailed = true;

                        console.error(
                          "Question order update error:",
                          updateError.message
                        );

                        return res.status(500).json({
                          success: false,
                          message:
                            "Question deleted but order update failed"
                        });
                      }

                      updatedCount++;

                      if (
                        updatedCount ===
                        remainingQuestions.length
                      ) {
                        return res.status(200).json({
                          success: true,
                          message:
                            "Question deleted successfully",
                          examId: Number(examId),
                          totalQuestions:
                            remainingQuestions.length
                        });
                      }
                    }
                  );
                }
              );
            }
          );
        }
      );
    }
  );
};


// ==========================================
// EXPORT
// ==========================================

module.exports = {
  addQuestion,
  getExamQuestions,
  deleteQuestion
};