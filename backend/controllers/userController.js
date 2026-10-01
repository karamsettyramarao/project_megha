const db = require("../config/database");

// ==========================================
// GET USER PROFILE + OVERALL ANALYTICS
// ==========================================

const getUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    // ------------------------------------------
    // Get basic user details
    // ------------------------------------------

    const userResult = await db.query(
      `
      SELECT
        id,
        name,
        email,
        created_at
      FROM users
      WHERE id = $1
      `,
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    const user = userResult.rows[0];

    // ------------------------------------------
    // Get overall analytics
    // ------------------------------------------

    const analyticsResult = await db.query(
      `
      SELECT
        COUNT(*) AS total_exams_attempted,
        COALESCE(AVG(score), 0) AS average_score,
        COALESCE(MAX(score), 0) AS best_score,
        COALESCE(SUM(correct_answers), 0) AS total_correct,
        COALESCE(SUM(wrong_answers), 0) AS total_wrong,
        COALESCE(SUM(skipped_answers), 0) AS total_skipped
      FROM attempts
      WHERE user_id = $1
        AND submitted_at IS NOT NULL
      `,
      [userId]
    );

    const analytics =
      analyticsResult.rows[0];

    // ------------------------------------------
    // Get recent exam results
    // ------------------------------------------

    const recentResult = await db.query(
      `
      SELECT
        a.exam_id,
        e.title,
        e.topic,
        a.score,
        a.correct_answers,
        a.wrong_answers,
        a.skipped_answers,
        a.time_taken_seconds,
        a.submitted_at
      FROM attempts a
      JOIN exams e
        ON a.exam_id = e.id
      WHERE a.user_id = $1
        AND a.submitted_at IS NOT NULL
      ORDER BY a.submitted_at DESC
      LIMIT 10
      `,
      [userId]
    );

    const recentExams =
      recentResult.rows;

    // ------------------------------------------
    // Response
    // ------------------------------------------

    return res.status(200).json({
      success: true,

      profile: {
        id: user.id,
        name: user.name,
        email: user.email,
        created_at: user.created_at
      },

      analytics: {
        total_exams_attempted:
          Number(
            analytics.total_exams_attempted
          ),

        average_score:
          Number(
            Number(
              analytics.average_score
            ).toFixed(2)
          ),

        best_score:
          Number(analytics.best_score),

        total_correct:
          Number(analytics.total_correct),

        total_wrong:
          Number(analytics.total_wrong),

        total_skipped:
          Number(analytics.total_skipped)
      },

      recent_exams: recentExams
    });

  } catch (error) {
    console.error(
      "Get user profile error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch user profile",
      error: error.message
    });
  }
};


// ==========================================
// EXPORT
// ==========================================

module.exports = {
  getUserProfile
};