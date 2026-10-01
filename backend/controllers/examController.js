const db = require("../config/database");

/*
=========================================================
INDIA TIMEZONE HELPERS
=========================================================
The frontend uses datetime-local, which does not include
timezone information.

Example:
2026-09-29T18:00

Our application treats these schedule values as IST
(Asia/Kolkata).

So we explicitly interpret schedule times as IST instead
of allowing Node/SQLite timezone differences to cause
incorrect ACTIVE / SCHEDULED status.
=========================================================
*/

const IST_OFFSET = "+05:30";


const parseISTDate = (value) => {
  if (!value) {
    return null;
  }

  let normalized = String(value).trim();

  /*
    If the value already contains a timezone,
    use it directly.
  */
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

  /*
    datetime-local value:
    2026-09-29T18:00

    Treat it explicitly as IST:
    2026-09-29T18:00+05:30
  */
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

  if (
    now >= startTime &&
    now < endTime
  ) {
    return "ACTIVE";
  }

  return "ENDED";
};


const formatDateForDatabase = (value) => {
  if (!value) {
    return value;
  }

  /*
    Keep the original datetime-local format.

    Example:
    2026-09-29T18:00
  */
  return String(value).trim();
};


// ===============================
// CREATE EXAM
// ===============================

const createExam = (req, res) => {
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

    const sql = `
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
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    db.run(
      sql,
      [
        title.trim(),
        topic
          ? topic.trim()
          : null,
        startValue,
        endValue,
        Number(duration_minutes),
        rules || null,
        "SCHEDULED"
      ],
      function (err) {

        if (err) {
          console.error(
            "Create exam error:",
            err.message
          );

          return res.status(500).json({
            success: false,
            message:
              "Failed to create exam"
          });
        }

        return res.status(201).json({
          success: true,
          message:
            "Exam created successfully",

          exam: {
            id: this.lastID,
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
      }
    );

  } catch (error) {

    console.error(
      "Create exam error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Server error"
    });
  }
};


// ===============================
// GET ACTIVE EXAM
// ===============================

const getActiveExam = (req, res) => {

  try {

    /*
      Instead of comparing SQLite TEXT dates with
      UTC ISO strings, fetch scheduled exams and
      determine ACTIVE status using the IST helper.
    */

    const sql = `
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
    `;

    db.all(
      sql,
      [],
      (err, exams) => {

        if (err) {

          console.error(
            "Get active exam error:",
            err.message
          );

          return res.status(500).json({
            success: false,
            message:
              "Failed to fetch active exam"
          });
        }

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
      }
    );

  } catch (error) {

    console.error(
      "Get active exam error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Server error"
    });
  }
};


// ===============================
// GET EXAM BY ID
// ===============================

const getExamById = (req, res) => {

  try {

    const { id } = req.params;

    const sql = `
      SELECT
        id,
        title,
        topic,
        start_time,
        end_time,
        duration_minutes,
        rules
      FROM exams
      WHERE id = ?
    `;

    db.get(
      sql,
      [id],
      (err, exam) => {

        if (err) {

          console.error(
            "Get exam error:",
            err.message
          );

          return res.status(500).json({
            success: false,
            message:
              "Failed to fetch exam"
          });
        }

        if (!exam) {

          return res.status(404).json({
            success: false,
            message:
              "Exam not found"
          });
        }

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
      }
    );

  } catch (error) {

    console.error(
      "Get exam error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Server error"
    });
  }
};


// ===============================
// GET ALL EXAMS - ADMIN
// ===============================

const getAllExams = (req, res) => {

  try {

    const sql = `
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
    `;

    db.all(
      sql,
      [],
      (err, exams) => {

        if (err) {

          console.error(
            "Get all exams error:",
            err.message
          );

          return res.status(500).json({
            success: false,
            message:
              "Failed to fetch exams"
          });
        }

        const formattedExams =
          exams.map((exam) => {

            return {
              ...exam,

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
      }
    );

  } catch (error) {

    console.error(
      "Get all exams error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Server error"
    });
  }
};


// ===============================
// UPDATE EXAM - ADMIN
// ===============================

const updateExam = (req, res) => {

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

    const checkSql = `
      SELECT id
      FROM exams
      WHERE id = ?
    `;

    db.get(
      checkSql,
      [id],
      (err, exam) => {

        if (err) {

          console.error(
            "Check exam error:",
            err.message
          );

          return res.status(500).json({
            success: false,
            message:
              "Database error"
          });
        }

        if (!exam) {

          return res.status(404).json({
            success: false,
            message:
              "Exam not found"
          });
        }

        const updateSql = `
          UPDATE exams

          SET
            title = ?,
            topic = ?,
            start_time = ?,
            end_time = ?,
            duration_minutes = ?,
            rules = ?

          WHERE id = ?
        `;

        const startValue =
          formatDateForDatabase(
            start_time
          );

        const endValue =
          formatDateForDatabase(
            end_time
          );

        db.run(
          updateSql,

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
          ],

          function (updateErr) {

            if (updateErr) {

              console.error(
                "Update exam error:",
                updateErr.message
              );

              return res.status(500).json({
                success: false,
                message:
                  "Failed to update exam"
              });
            }

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
          }
        );
      }
    );

  } catch (error) {

    console.error(
      "Update exam error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Server error"
    });
  }
};


// ===============================
// EXPORT
// ===============================

module.exports = {
  createExam,
  getActiveExam,
  getExamById,
  getAllExams,
  updateExam
};