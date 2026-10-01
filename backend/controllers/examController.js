const db = require("../config/database");

/*
=========================================================
INDIA TIMEZONE HELPERS
=========================================================
Frontend uses datetime-local:

2026-09-29T18:00

Application treats these values as IST.
=========================================================
*/

const IST_OFFSET = "+05:30";

const parseISTDate = (value) => {
  if (!value) {
    return null;
  }

  let normalized = String(value).trim();

  if (
    normalized.endsWith("Z") ||
    /[+-]\d{2}:\d{2}$/.test(normalized)
  ) {
    const date = new Date(normalized);

    if (Number.isNaN(date.getTime())) {
      return null;
    }

    return date;
  }

  const date = new Date(
    `${normalized}${IST_OFFSET}`
  );

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
};

const getExamStatus = (startValue, endValue) => {
  const now = new Date();

  const startTime = parseISTDate(startValue);
  const endTime = parseISTDate(endValue);

  if (!startTime || !endTime) {
    return "SCHEDULED";
  }

  if (now < startTime) {
    return "NOT_STARTED";
  }

  if (now >= startTime && now < endTime) {
    return "ACTIVE";
  }

  return "ENDED";
};

const formatDateForDatabase = (value) => {
  if (!value) {
    return value;
  }

  return String(value).trim();
};


// ========================================================
// CREATE EXAM
// ========================================================

const createExam = async (req, res) => {
  try {
    const {
      title,
      topic,
      start_time,
      end_time,
      duration_minutes,
      rules
    } = req.body;

    if (
      !title ||
      !start_time ||
      !end_time ||
      !duration_minutes
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Title, start time, end time and duration are required"
      });
    }

    if (Number(duration_minutes) <= 0) {
      return res.status(400).json({
        success: false,
        message:
          "Duration must be greater than 0"
      });
    }

    const startTime = parseISTDate(start_time);
    const endTime = parseISTDate(end_time);

    if (!startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid start or end time"
      });
    }

    if (endTime <= startTime) {
      return res.status(400).json({
        success: false,
        message:
          "End time must be after start time"
      });
    }

    const startValue =
      formatDateForDatabase(start_time);

    const endValue =
      formatDateForDatabase(end_time);

    const result = await db.query(
      `
      INSERT INTO exams
      (
        title,
        topic,
        start_time,
        end_time,
        duration_minutes,
        rules,
        status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id
      `,
      [
        title.trim(),
        topic ? topic.trim() : null,
        startValue,
        endValue,
        Number(duration_minutes),
        rules || null,
        "SCHEDULED"
      ]
    );

    const examId = result.rows[0].id;

    return res.status(201).json({
      success: true,
      message: "Exam created successfully",

      exam: {
        id: examId,
        title: title.trim(),
        topic: topic
          ? topic.trim()
          : null,
        start_time: startValue,
        end_time: endValue,
        duration_minutes:
          Number(duration_minutes),
        rules: rules || null,
        status:
          getExamStatus(
            startValue,
            endValue
          )
      }
    });

  } catch (error) {

    console.error(
      "Create exam error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to create exam",
      error: error.message
    });
  }
};


// ========================================================
// GET ACTIVE EXAM
// ========================================================

const getActiveExam = async (req, res) => {
  try {

    const result = await db.query(
      `
      SELECT
        id,
        title,
        topic,
        start_time,
        end_time,
        duration_minutes,
        rules
      FROM exams
      ORDER BY start_time ASC
      `
    );

    const exams = result.rows;

    const activeExam =
      exams.find(
        (exam) =>
          getExamStatus(
            exam.start_time,
            exam.end_time
          ) === "ACTIVE"
      );

    if (!activeExam) {
      return res.json({
        success: true,
        active: false,
        message:
          "No active exam"
      });
    }

    return res.json({
      success: true,
      active: true,

      exam: {
        id: activeExam.id,
        title: activeExam.title,
        topic: activeExam.topic,
        start_time:
          activeExam.start_time,
        end_time:
          activeExam.end_time,
        duration_minutes:
          activeExam.duration_minutes,
        rules:
          activeExam.rules
      }
    });

  } catch (error) {

    console.error(
      "Get active exam error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch active exam",
      error: error.message
    });
  }
};


// ========================================================
// GET EXAM BY ID
// ========================================================

const getExamById = async (req, res) => {
  try {

    const { id } = req.params;

    const result = await db.query(
      `
      SELECT
        id,
        title,
        topic,
        start_time,
        end_time,
        duration_minutes,
        rules
      FROM exams
      WHERE id = $1
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message:
          "Exam not found"
      });
    }

    const exam = result.rows[0];

    const status =
      getExamStatus(
        exam.start_time,
        exam.end_time
      );

    return res.json({
      success: true,

      exam: {
        ...exam,
        status
      }
    });

  } catch (error) {

    console.error(
      "Get exam error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch exam",
      error: error.message
    });
  }
};


// ========================================================
// GET ALL EXAMS - ADMIN
// ========================================================

const getAllExams = async (req, res) => {
  try {

    const result = await db.query(
      `
      SELECT
        e.id,
        e.title,
        e.topic,
        e.start_time,
        e.end_time,
        e.duration_minutes,
        e.rules,

        (
          SELECT COUNT(*)
          FROM questions q
          WHERE q.exam_id = e.id
        ) AS total_questions

      FROM exams e

      ORDER BY e.start_time DESC
      `
    );

    const exams = result.rows;

    const formattedExams =
      exams.map((exam) => {

        return {
          ...exam,

          total_questions:
            Number(exam.total_questions),

          status:
            getExamStatus(
              exam.start_time,
              exam.end_time
            )
        };
      });

    return res.json({
      success: true,

      totalExams:
        formattedExams.length,

      exams:
        formattedExams
    });

  } catch (error) {

    console.error(
      "Get all exams error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch exams",
      error: error.message
    });
  }
};


// ========================================================
// UPDATE EXAM - ADMIN
// ========================================================

const updateExam = async (req, res) => {
  try {

    const { id } = req.params;

    const {
      title,
      topic,
      start_time,
      end_time,
      duration_minutes,
      rules
    } = req.body;

    if (
      !title ||
      !start_time ||
      !end_time ||
      !duration_minutes
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Title, start time, end time and duration are required"
      });
    }

    if (Number(duration_minutes) <= 0) {
      return res.status(400).json({
        success: false,
        message:
          "Duration must be greater than 0"
      });
    }

    const startTime =
      parseISTDate(start_time);

    const endTime =
      parseISTDate(end_time);

    if (!startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid start or end time"
      });
    }

    if (endTime <= startTime) {
      return res.status(400).json({
        success: false,
        message:
          "End time must be after start time"
      });
    }

    const checkResult = await db.query(
      `
      SELECT id
      FROM exams
      WHERE id = $1
      `,
      [id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message:
          "Exam not found"
      });
    }

    const startValue =
      formatDateForDatabase(start_time);

    const endValue =
      formatDateForDatabase(end_time);

    await db.query(
      `
      UPDATE exams
      SET
        title = $1,
        topic = $2,
        start_time = $3,
        end_time = $4,
        duration_minutes = $5,
        rules = $6
      WHERE id = $7
      `,
      [
        title.trim(),
        topic
          ? topic.trim()
          : null,
        startValue,
        endValue,
        Number(duration_minutes),
        rules || null,
        id
      ]
    );

    return res.json({
      success: true,

      message:
        "Exam updated successfully",

      exam: {
        id: Number(id),

        title:
          title.trim(),

        topic:
          topic
            ? topic.trim()
            : null,

        start_time:
          startValue,

        end_time:
          endValue,

        duration_minutes:
          Number(duration_minutes),

        rules:
          rules || null,

        status:
          getExamStatus(
            startValue,
            endValue
          )
      }
    });

  } catch (error) {

    console.error(
      "Update exam error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to update exam",
      error: error.message
    });
  }
};


// ========================================================
// EXPORT
// ========================================================

module.exports = {
  createExam,
  getActiveExam,
  getExamById,
  getAllExams,
  updateExam
};