const db = require("../config/database");

// ==========================================
// GET ADMIN EXAM ANALYTICS
// ==========================================

const getExamAnalytics = (req, res) => {
  const examId = req.params.examId;

  // ------------------------------------------
  // 1. Check whether exam exists
  // ------------------------------------------

  db.get(
    `SELECT
      id,
      title,
      topic,
      start_time,
      end_time,
      duration_minutes
     FROM exams
     WHERE id = ?`,
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

      // ------------------------------------------
      // 2. Overall participant analytics
      // ------------------------------------------

      db.get(
        `SELECT
          COUNT(*) AS total_participants,

          SUM(
            CASE
              WHEN submitted_at IS NOT NULL THEN 1
              ELSE 0
            END
          ) AS submitted_participants,

          COALESCE(
            AVG(
              CASE
                WHEN submitted_at IS NOT NULL
                THEN score
              END
            ),
            0
          ) AS average_score,

          COALESCE(
            MAX(
              CASE
                WHEN submitted_at IS NOT NULL
                THEN score
              END
            ),
            0
          ) AS highest_score,

          COALESCE(
            MIN(
              CASE
                WHEN submitted_at IS NOT NULL
                THEN score
              END
            ),
            0
          ) AS lowest_score,

          COALESCE(
            SUM(
              CASE
                WHEN submitted_at IS NOT NULL
                THEN correct_answers
                ELSE 0
              END
            ),
            0
          ) AS total_correct,

          COALESCE(
            SUM(
              CASE
                WHEN submitted_at IS NOT NULL
                THEN wrong_answers
                ELSE 0
              END
            ),
            0
          ) AS total_wrong,

          COALESCE(
            SUM(
              CASE
                WHEN submitted_at IS NOT NULL
                THEN skipped_answers
                ELSE 0
              END
            ),
            0
          ) AS total_skipped

         FROM attempts
         WHERE exam_id = ?`,
        [examId],
        (analyticsError, analytics) => {
          if (analyticsError) {
            return res.status(500).json({
              success: false,
              message: "Failed to fetch exam analytics",
              error: analyticsError.message
            });
          }

          // ------------------------------------------
          // 3. Question-wise performance
          // ------------------------------------------

          db.all(
            `SELECT
              q.id AS question_id,
              q.question_order,
              q.question_text,

              COUNT(
                CASE
                  WHEN a.id IS NOT NULL
                  THEN 1
                END
              ) AS attempted,

              SUM(
                CASE
                  WHEN a.is_correct = 1
                  THEN 1
                  ELSE 0
                END
              ) AS correct,

              SUM(
                CASE
                  WHEN a.is_correct = 0
                   AND a.selected_answer IS NOT NULL
                  THEN 1
                  ELSE 0
                END
              ) AS wrong

             FROM questions q

             LEFT JOIN answers a
               ON q.id = a.question_id

             LEFT JOIN attempts att
               ON a.attempt_id = att.id
              AND att.exam_id = ?

             WHERE q.exam_id = ?

             GROUP BY
               q.id,
               q.question_order,
               q.question_text

             ORDER BY q.question_order ASC`,
            [examId, examId],
            (questionError, questionPerformance) => {
              if (questionError) {
                return res.status(500).json({
                  success: false,
                  message: "Failed to fetch question analytics",
                  error: questionError.message
                });
              }

              // ------------------------------------------
              // 4. Format numbers
              // ------------------------------------------

              const formattedQuestionPerformance =
                questionPerformance.map((question) => ({
                  question_id: question.question_id,
                  question_order: question.question_order,
                  question_text: question.question_text,
                  attempted: question.attempted || 0,
                  correct: question.correct || 0,
                  wrong: question.wrong || 0
                }));

              // ------------------------------------------
              // 5. Final response
              // ------------------------------------------

              return res.status(200).json({
                success: true,

                exam: {
                  id: exam.id,
                  title: exam.title,
                  topic: exam.topic,
                  start_time: exam.start_time,
                  end_time: exam.end_time,
                  duration_minutes: exam.duration_minutes
                },

                analytics: {
                  total_participants:
                    analytics.total_participants || 0,

                  submitted_participants:
                    analytics.submitted_participants || 0,

                  average_score:
                    Number(
                      Number(analytics.average_score || 0)
                        .toFixed(2)
                    ),

                  highest_score:
                    Number(analytics.highest_score || 0),

                  lowest_score:
                    Number(analytics.lowest_score || 0),

                  total_correct:
                    analytics.total_correct || 0,

                  total_wrong:
                    analytics.total_wrong || 0,

                  total_skipped:
                    analytics.total_skipped || 0
                },

                question_performance:
                  formattedQuestionPerformance
              });
            }
          );
        }
      );
    }
  );
};

module.exports = {
  getExamAnalytics
};