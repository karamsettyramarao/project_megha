const db = require("../config/database");

// ==========================================
// GET USER PROFILE + OVERALL ANALYTICS
// ==========================================

const getUserProfile = (req, res) => {
  const userId = req.user.id;

  // Get basic user details
  db.get(
    `SELECT
      id,
      name,
      email,
      created_at
     FROM users
     WHERE id = ?`,
    [userId],
    (error, user) => {
      if (error) {
        return res.status(500).json({
          success: false,
          message: "Failed to fetch user profile",
          error: error.message
        });
      }

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found"
        });
      }

      // Get overall analytics
      db.get(
        `SELECT
          COUNT(*) AS total_exams_attempted,
          COALESCE(AVG(score), 0) AS average_score,
          COALESCE(MAX(score), 0) AS best_score,
          COALESCE(SUM(correct_answers), 0) AS total_correct,
          COALESCE(SUM(wrong_answers), 0) AS total_wrong,
          COALESCE(SUM(skipped_answers), 0) AS total_skipped
         FROM attempts
         WHERE user_id = ?
           AND submitted_at IS NOT NULL`,
        [userId],
        (analyticsError, analytics) => {
          if (analyticsError) {
            return res.status(500).json({
              success: false,
              message: "Failed to fetch user analytics",
              error: analyticsError.message
            });
          }

          // Get recent exam results
          db.all(
            `SELECT
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
             JOIN exams e ON a.exam_id = e.id
             WHERE a.user_id = ?
               AND a.submitted_at IS NOT NULL
             ORDER BY a.submitted_at DESC
             LIMIT 10`,
            [userId],
            (recentError, recentExams) => {
              if (recentError) {
                return res.status(500).json({
                  success: false,
                  message: "Failed to fetch recent exam results",
                  error: recentError.message
                });
              }

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
                    analytics.total_exams_attempted,

                  average_score:
                    Number(Number(analytics.average_score).toFixed(2)),

                  best_score:
                    analytics.best_score,

                  total_correct:
                    analytics.total_correct,

                  total_wrong:
                    analytics.total_wrong,

                  total_skipped:
                    analytics.total_skipped
                },

                recent_exams: recentExams
              });
            }
          );
        }
      );
    }
  );
};

module.exports = {
  getUserProfile
};