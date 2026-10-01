const db = require("../config/database");

// ==========================================
// GET ADMIN EXAM ANALYTICS
// ==========================================

const getExamAnalytics = async (req, res) => {
  try {
    const examId = req.params.examId;

    // ------------------------------------------
    // 1. Check whether exam exists
    // ------------------------------------------

    const examResult = await db.query(
      `
      SELECT
        id,
        title,
        topic,
        start_time,
        end_time,
        duration_minutes
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

    const exam = examResult.rows[0];

    // ------------------------------------------
    // 2. Overall participant analytics
    // ------------------------------------------

    const analyticsResult = await db.query(
      `
      SELECT
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
      WHERE exam_id = $1
      `,
      [examId]
    );

    const analytics =
      analyticsResult.rows[0];

    // ------------------------------------------
    // 3. Question-wise performance
    // ------------------------------------------

    const questionResult = await db.query(
      `
      SELECT
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
       AND att.exam_id = $1

      WHERE q.exam_id = $2

      GROUP BY
        q.id,
        q.question_order,
        q.question_text

      ORDER BY q.question_order ASC
      `,
      [examId, examId]
    );

    const questionPerformance =
      questionResult.rows;

    // ------------------------------------------
    // 4. Format numbers
    // ------------------------------------------

    const formattedQuestionPerformance =
      questionPerformance.map((question) => ({
        question_id: question.question_id,

        question_order:
          question.question_order,

        question_text:
          question.question_text,

        attempted:
          Number(question.attempted || 0),

        correct:
          Number(question.correct || 0),

        wrong:
          Number(question.wrong || 0)
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
        duration_minutes:
          exam.duration_minutes
      },

      analytics: {
        total_participants:
          Number(
            analytics.total_participants || 0
          ),

        submitted_participants:
          Number(
            analytics.submitted_participants || 0
          ),

        average_score:
          Number(
            Number(
              analytics.average_score || 0
            ).toFixed(2)
          ),

        highest_score:
          Number(
            analytics.highest_score || 0
          ),

        lowest_score:
          Number(
            analytics.lowest_score || 0
          ),

        total_correct:
          Number(
            analytics.total_correct || 0
          ),

        total_wrong:
          Number(
            analytics.total_wrong || 0
          ),

        total_skipped:
          Number(
            analytics.total_skipped || 0
          )
      },

      question_performance:
        formattedQuestionPerformance
    });

  } catch (error) {
    console.error(
      "Get exam analytics error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch exam analytics",
      error: error.message
    });
  }
};


// ==========================================
// EXPORT
// ==========================================

module.exports = {
  getExamAnalytics
};