const db = require("../config/database");

// ==========================================
// START EXAM
// ==========================================

const startExam = async (req, res) => {
  try {
    const userId = req.user.id;
    const examId = req.params.id;

    // ------------------------------------------
    // Get exam
    // ------------------------------------------

    const examResult = await db.query(
      `
      SELECT *
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
    // Check exam timing
    // ------------------------------------------

    const now = new Date();

    const startTime = new Date(
      `${exam.start_time}:00+05:30`
    );

    const endTime = new Date(
      `${exam.end_time}:00+05:30`
    );

    if (now < startTime) {
      return res.status(400).json({
      success: false,
      message: "Exam has not started yet"});
    }

    if (now > endTime) {
      return res.status(400).json({
      success: false,
      message: "Exam has already ended"});
    }

    // ------------------------------------------
    // Check existing attempt
    // ------------------------------------------

    const attemptResult = await db.query(
      `
      SELECT *
      FROM attempts
      WHERE user_id = $1
        AND exam_id = $2
      `,
      [userId, examId]
    );

    if (attemptResult.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: "You have already attempted this exam"
      });
    }

    // ------------------------------------------
    // Get questions
    // ------------------------------------------

    const questionResult = await db.query(
      `
      SELECT
        id,
        question_text,
        option_a,
        option_b,
        option_c,
        option_d,
        question_order
      FROM questions
      WHERE exam_id = $1
      ORDER BY question_order ASC
      `,
      [examId]
    );

    const questions = questionResult.rows;

    if (!questions || questions.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No questions available for this exam"
      });
    }

    // ------------------------------------------
    // Create attempt
    // ------------------------------------------

    const startedAt = new Date().toISOString();

    const insertResult = await db.query(
      `
      INSERT INTO attempts
      (
        user_id,
        exam_id,
        started_at,
        total_questions
      )
      VALUES
      ($1, $2, $3, $4)
      RETURNING id
      `,
      [
        userId,
        examId,
        startedAt,
        questions.length
      ]
    );

    const attemptId = insertResult.rows[0].id;

    // ------------------------------------------
    // Response
    // ------------------------------------------

    return res.status(200).json({
      success: true,
      message: "Exam started successfully",

      attempt: {
        id: attemptId,
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

  } catch (error) {
    console.error(
      "Start exam error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message: "Failed to start exam",
      error: error.message
    });
  }
};


// ==========================================
// SUBMIT EXAM
// ==========================================

const submitExam = async (req, res) => {
  try {
    const userId = req.user.id;
    const examId = req.params.id;
    const submittedAnswers = req.body.answers;

    // ------------------------------------------
    // Validate answers
    // ------------------------------------------

    if (!Array.isArray(submittedAnswers)) {
      return res.status(400).json({
        success: false,
        message: "answers must be an array"
      });
    }

    // ------------------------------------------
    // Get attempt
    // ------------------------------------------

    const attemptResult = await db.query(
      `
      SELECT *
      FROM attempts
      WHERE user_id = $1
        AND exam_id = $2
      `,
      [userId, examId]
    );

    if (attemptResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "You have not started this exam"
      });
    }

    const attempt = attemptResult.rows[0];

    // ------------------------------------------
    // Check already submitted
    // ------------------------------------------

    if (attempt.submitted_at) {
      return res.status(409).json({
        success: false,
        message: "Exam has already been submitted"
      });
    }

    // ------------------------------------------
    // Get questions with correct answers
    // ------------------------------------------

    const questionResult = await db.query(
      `
      SELECT
        id,
        correct_answer
      FROM questions
      WHERE exam_id = $1
      ORDER BY question_order ASC
      `,
      [examId]
    );

    const questions = questionResult.rows;

    // ------------------------------------------
    // Create answer map
    // ------------------------------------------

    const answerMap = {};

    submittedAnswers.forEach((answer) => {
      answerMap[answer.question_id] =
        answer.selected_answer;
    });

    // ------------------------------------------
    // Calculate result
    // ------------------------------------------

    let correctAnswers = 0;
    let wrongAnswers = 0;
    let skippedAnswers = 0;

    questions.forEach((question) => {
      const selectedAnswer =
        answerMap[question.id];

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
            (
              (correctAnswers / totalQuestions) *
              100
            ).toFixed(2)
          )
        : 0;

    // ------------------------------------------
    // Calculate time taken
    // ------------------------------------------

    const submittedAt = new Date();

    const startedAt =
      new Date(attempt.started_at);

    const timeTakenSeconds = Math.max(
      0,
      Math.floor(
        (
          submittedAt.getTime() -
          startedAt.getTime()
        ) / 1000
      )
    );

    // ------------------------------------------
    // Update attempt
    // ------------------------------------------

    await db.query(
      `
      UPDATE attempts
      SET
        submitted_at = $1,
        score = $2,
        total_questions = $3,
        correct_answers = $4,
        wrong_answers = $5,
        skipped_answers = $6,
        time_taken_seconds = $7
      WHERE id = $8
      `,
      [
        submittedAt.toISOString(),
        score,
        totalQuestions,
        correctAnswers,
        wrongAnswers,
        skippedAnswers,
        timeTakenSeconds,
        attempt.id
      ]
    );

    // ------------------------------------------
    // Save individual answers
    // ------------------------------------------

    for (const question of questions) {

      const selectedAnswer =
        answerMap[question.id] || null;

      const isCorrect =
        selectedAnswer &&
        selectedAnswer.toUpperCase() ===
          question.correct_answer.toUpperCase()
          ? 1
          : 0;

      await db.query(
        `
        INSERT INTO answers
        (
          attempt_id,
          question_id,
          selected_answer,
          is_correct
        )
        VALUES
        ($1, $2, $3, $4)
        `,
        [
          attempt.id,
          question.id,
          selectedAnswer,
          isCorrect
        ]
      );
    }

    // ------------------------------------------
    // Response
    // ------------------------------------------

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

  } catch (error) {
    console.error(
      "Submit exam error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message: "Failed to submit exam",
      error: error.message
    });
  }
};


// ==========================================
// GET EXAM RESULT
// ==========================================

const getExamResult = async (req, res) => {
  try {
    const userId = req.user.id;
    const examId = req.params.id;

    // ------------------------------------------
    // Get result
    // ------------------------------------------

    const resultQuery = await db.query(
      `
      SELECT
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
      JOIN exams e
        ON a.exam_id = e.id
      WHERE a.user_id = $1
        AND a.exam_id = $2
      `,
      [userId, examId]
    );

    if (resultQuery.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No result found for this exam"
      });
    }

    const result = resultQuery.rows[0];

    // ------------------------------------------
    // Check submitted
    // ------------------------------------------

    if (!result.submitted_at) {
      return res.status(400).json({
        success: false,
        message: "Exam has not been submitted yet"
      });
    }

    // ------------------------------------------
    // Response
    // ------------------------------------------

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
        time_taken_seconds:
          result.time_taken_seconds
      }
    });

  } catch (error) {
    console.error(
      "Get exam result error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch exam result",
      error: error.message
    });
  }
};


// ==========================================
// EXPORT
// ==========================================

module.exports = {
  startExam,
  submitExam,
  getExamResult
};