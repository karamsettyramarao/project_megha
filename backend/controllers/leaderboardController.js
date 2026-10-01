const db = require("../config/database");

// ==========================================
// GET LEADERBOARD
// ==========================================

const getLeaderboard = (req, res) => {
  const examId = req.params.examId;

  db.all(
    `SELECT
      u.id AS user_id,
      u.name,
      a.score,
      a.correct_answers,
      a.wrong_answers,
      a.skipped_answers,
      a.time_taken_seconds
     FROM attempts a
     JOIN users u ON a.user_id = u.id
     WHERE a.exam_id = ?
       AND a.submitted_at IS NOT NULL
     ORDER BY
       a.score DESC,
       a.time_taken_seconds ASC`,
    [examId],
    (error, rows) => {
      if (error) {
        return res.status(500).json({
          success: false,
          message: "Failed to fetch leaderboard",
          error: error.message
        });
      }

      const leaderboard = rows.map((row, index) => ({
        rank: index + 1,
        user_id: row.user_id,
        name: row.name,
        score: row.score,
        correct_answers: row.correct_answers,
        wrong_answers: row.wrong_answers,
        skipped_answers: row.skipped_answers,
        time_taken_seconds: row.time_taken_seconds
      }));

      return res.status(200).json({
        success: true,
        exam_id: Number(examId),
        leaderboard
      });
    }
  );
};

module.exports = {
  getLeaderboard
};