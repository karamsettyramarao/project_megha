const db = require("../config/database");

// ==========================================
// GET LEADERBOARD
// ==========================================

const getLeaderboard = async (req, res) => {
  try {
    const examId = req.params.examId;

    const result = await db.query(
      `
      SELECT
        u.id AS user_id,
        u.name,
        a.score,
        a.correct_answers,
        a.wrong_answers,
        a.skipped_answers,
        a.time_taken_seconds
      FROM attempts a
      JOIN users u
        ON a.user_id = u.id
      WHERE a.exam_id = $1
        AND a.submitted_at IS NOT NULL
      ORDER BY
        a.score DESC,
        a.time_taken_seconds ASC
      `,
      [examId]
    );

    const rows = result.rows;

    let currentRank = 1;

    const leaderboard = rows.map((row, index) => {
      if (index > 0) {
        const previousRow = rows[index - 1];

        const sameScore =
          Number(row.score) === Number(previousRow.score);

        const sameTime =
          Number(row.time_taken_seconds) ===
          Number(previousRow.time_taken_seconds);

        if (!sameScore || !sameTime) {
          currentRank++;
        }
      }

      return {
        rank: currentRank,
        user_id: row.user_id,
        name: row.name,
        score: row.score,
        correct_answers: row.correct_answers,
        wrong_answers: row.wrong_answers,
        skipped_answers: row.skipped_answers,
        time_taken_seconds: row.time_taken_seconds
      };
    });

    return res.status(200).json({
      success: true,
      exam_id: Number(examId),
      leaderboard
    });

  } catch (error) {
    console.error(
      "Get leaderboard error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch leaderboard",
      error: error.message
    });
  }
};

module.exports = {
  getLeaderboard
};