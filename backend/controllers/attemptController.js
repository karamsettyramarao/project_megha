const db = require("../config/database");

// ==========================================
// START EXAM
// ==========================================

const startExam = (req, res) => {
  const userId = req.user.id;
  const examId = req.params.id;

  db.get(
    `SELECT * FROM exams WHERE id = ?`,
    [examId],
    (examError, exam) => {
      if (examError) {
        return res.status(500).json({
          success: false,
          message: "Failed to fetch exam",
          error: examError.message
        });
      }

      if (!exam) {
        return res.status(404).json({
          success: false,
          message: "Exam not found"
        });
      }

      const now = new Date();
      const startTime = new Date(exam.start_time);
      const endTime = new Date(exam.end_time);

      if (now < startTime) {
        return res.status(400).json({
          success: false,
          message: "Exam has not started yet"
        });
      }

      if (now > endTime) {
        return res.status(400).json({
          success: false,
          message: "Exam has already ended"
        });
      }

      db.get(
        `SELECT * FROM attempts WHERE user_id = ? AND exam_id = ?`,
        [userId, examId],
        (attemptError, existingAttempt) => {
          if (attemptError) {
            return res.status(500).json({
              success: false,
              message: "Failed to check existing attempt",
              error: attemptError.message
            });
          }

          if (existingAttempt) {
            return res.status(409).json({
              success: false,
              message: "You have already attempted this exam"
            });
          }

          db.all(
            `SELECT
              id,
              question_text,
              option_a,
              option_b,
              option_c,
              option_d,
              question_order
             FROM questions
             WHERE exam_id = ?
             ORDER BY question_order ASC`,
            [examId],
            (questionError, questions) => {
              if (questionError) {
                return res.status(500).json({
                  success: false,
                  message: "Failed to fetch questions",
                  error: questionError.message
                });
              }

              if (!questions || questions.length === 0) {
                return res.status(400).json({
                  success: false,
                  message: "No questions available for this exam"
                });
              }

              const startedAt = new Date().toISOString();

              db.run(
                `INSERT INTO attempts
                (
                  user_id,
                  exam_id,
                  started_at,
                  total_questions
                )
                VALUES (?, ?, ?, ?)`,
                [
                  userId,
                  examId,
                  startedAt,
                  questions.length
                ],
                function (insertError) {
                  if (insertError) {
                    return res.status(500).json({
                      success: false,
                      message: "Failed to start exam",
                      error: insertError.message
                    });
                  }

                  return res.status(200).json({
                    success: true,
                    message: "Exam started successfully",
                    attempt: {
                      id: this.lastID,
                      user_id: userId,
                      exam_id: Number(examId),
                      started_at: startedAt
                    },
                    exam: {
                      id: exam.id,
                      title: exam.title,
                      topic: exam.topic,
                      start_time: exam.start_time,
                      end_time: exam.end_time,
                      duration_minutes: exam.duration_minutes,
                      rules: exam.rules
                    },
                    totalQuestions: questions.length,
                    questions
                  });
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
// SUBMIT EXAM
// ==========================================

const submitExam = (req, res) => {
  const userId = req.user.id;
  const examId = req.params.id;
  const submittedAnswers = req.body.answers;

  if (!Array.isArray(submittedAnswers)) {
    return res.status(400).json({
      success: false,
      message: "answers must be an array"
    });
  }

  db.get(
    `SELECT * FROM attempts
     WHERE user_id = ? AND exam_id = ?`,
    [userId, examId],
    (attemptError, attempt) => {
      if (attemptError) {
        return res.status(500).json({
          success: false,
          message: "Failed to fetch attempt",
          error: attemptError.message
        });
      }

      if (!attempt) {
        return res.status(404).json({
          success: false,
          message: "You have not started this exam"
        });
      }

      if (attempt.submitted_at) {
        return res.status(409).json({
          success: false,
          message: "Exam has already been submitted"
        });
      }

      db.all(
        `SELECT
          id,
          correct_answer
         FROM questions
         WHERE exam_id = ?
         ORDER BY question_order ASC`,
        [examId],
        (questionError, questions) => {
          if (questionError) {
            return res.status(500).json({
              success: false,
              message: "Failed to fetch questions",
              error: questionError.message
            });
          }

          const answerMap = {};

          submittedAnswers.forEach((answer) => {
            answerMap[answer.question_id] = answer.selected_answer;
          });

          let correctAnswers = 0;
          let wrongAnswers = 0;
          let skippedAnswers = 0;

          questions.forEach((question) => {
            const selectedAnswer = answerMap[question.id];

            if (!selectedAnswer) {
              skippedAnswers++;
            } else if (
              selectedAnswer.toUpperCase() ===
              question.correct_answer.toUpperCase()
            ) {
              correctAnswers++;
            } else {
              wrongAnswers++;
            }
          });

          const totalQuestions = questions.length;

          const score =
            totalQuestions > 0
              ? Number(
                  ((correctAnswers / totalQuestions) * 100).toFixed(2)
                )
              : 0;

          const submittedAt = new Date();

          const startedAt = new Date(attempt.started_at);

          const timeTakenSeconds = Math.max(
            0,
            Math.floor(
              (submittedAt.getTime() - startedAt.getTime()) / 1000
            )
          );

          db.run(
            `UPDATE attempts
             SET
               submitted_at = ?,
               score = ?,
               total_questions = ?,
               correct_answers = ?,
               wrong_answers = ?,
               skipped_answers = ?,
               time_taken_seconds = ?
             WHERE id = ?`,
            [
              submittedAt.toISOString(),
              score,
              totalQuestions,
              correctAnswers,
              wrongAnswers,
              skippedAnswers,
              timeTakenSeconds,
              attempt.id
            ],
            function (updateError) {
              if (updateError) {
                return res.status(500).json({
                  success: false,
                  message: "Failed to submit exam",
                  error: updateError.message
                });
              }

              const insertAnswer = (index) => {
                if (index >= questions.length) {
                  return res.status(200).json({
                    success: true,
                    message: "Exam submitted successfully",
                    result: {
                      attempt_id: attempt.id,
                      exam_id: Number(examId),
                      total_questions: totalQuestions,
                      correct_answers: correctAnswers,
                      wrong_answers: wrongAnswers,
                      skipped_answers: skippedAnswers,
                      score,
                      time_taken_seconds: timeTakenSeconds
                    }
                  });
                }

                const question = questions[index];

                const selectedAnswer =
                  answerMap[question.id] || null;

                const isCorrect =
                  selectedAnswer &&
                  selectedAnswer.toUpperCase() ===
                    question.correct_answer.toUpperCase()
                    ? 1
                    : 0;

                db.run(
                  `INSERT INTO answers
                   (
                     attempt_id,
                     question_id,
                     selected_answer,
                     is_correct
                   )
                   VALUES (?, ?, ?, ?)`,
                  [
                    attempt.id,
                    question.id,
                    selectedAnswer,
                    isCorrect
                  ],
                  (answerError) => {
                    if (answerError) {
                      return res.status(500).json({
                        success: false,
                        message: "Failed to save answers",
                        error: answerError.message
                      });
                    }

                    insertAnswer(index + 1);
                  }
                );
              };

              insertAnswer(0);
            }
          );
        }
      );
    }
  );
};

// ==========================================
// GET EXAM RESULT
// ==========================================

const getExamResult = (req, res) => {
  const userId = req.user.id;
  const examId = req.params.id;

  db.get(
    `SELECT
      a.id AS attempt_id,
      a.user_id,
      a.exam_id,
      a.started_at,
      a.submitted_at,
      a.score,
      a.total_questions,
      a.correct_answers,
      a.wrong_answers,
      a.skipped_answers,
      a.time_taken_seconds,
      e.title,
      e.topic
     FROM attempts a
     JOIN exams e ON a.exam_id = e.id
     WHERE a.user_id = ?
       AND a.exam_id = ?`,
    [userId, examId],
    (error, result) => {
      if (error) {
        return res.status(500).json({
          success: false,
          message: "Failed to fetch exam result",
          error: error.message
        });
      }

      if (!result) {
        return res.status(404).json({
          success: false,
          message: "No result found for this exam"
        });
      }

      if (!result.submitted_at) {
        return res.status(400).json({
          success: false,
          message: "Exam has not been submitted yet"
        });
      }

      return res.status(200).json({
        success: true,
        result: {
          attempt_id: result.attempt_id,
          exam_id: result.exam_id,
          title: result.title,
          topic: result.topic,
          started_at: result.started_at,
          submitted_at: result.submitted_at,
          total_questions: result.total_questions,
          correct_answers: result.correct_answers,
          wrong_answers: result.wrong_answers,
          skipped_answers: result.skipped_answers,
          score: result.score,
          time_taken_seconds: result.time_taken_seconds
        }
      });
    }
  );
};

module.exports = {
  startExam,
  submitExam,
  getExamResult
};