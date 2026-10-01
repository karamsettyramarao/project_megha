import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

function AdminDashboard() {
  const navigate = useNavigate();

  const [admin, setAdmin] = useState(null);

  const [exams, setExams] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);

  const [selectedExamId, setSelectedExamId] = useState("");

  const [loading, setLoading] = useState(true);
  const [leaderboardLoading, setLeaderboardLoading] =
    useState(false);
  const [scheduleLoading, setScheduleLoading] =
    useState(false);

  const [error, setError] = useState("");
  const [scheduleMessage, setScheduleMessage] =
    useState("");

  const [formData, setFormData] = useState({
    title: "",
    topic: "",
    start_time: "",
    end_time: "",
    duration_minutes: "20",
    rules:
      "No negative marking. Do not refresh the page. Read every question carefully.",
  });

  /* =====================================================
     AUTH
  ===================================================== */

  const getAdminToken = () => {
    return localStorage.getItem("adminToken");
  };

  const getAuthConfig = () => {
    const token = getAdminToken();

    return {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
  };

  /* =====================================================
     INITIAL LOAD
  ===================================================== */

  useEffect(() => {
    const token = getAdminToken();

    if (!token) {
      navigate("/admin", {
        replace: true,
      });

      return;
    }

    const storedAdmin =
      localStorage.getItem("admin");

    if (storedAdmin) {
      try {
        setAdmin(JSON.parse(storedAdmin));
      } catch {
        localStorage.removeItem("admin");
      }
    }

    fetchExams();
  }, [navigate]);

  /* =====================================================
     FETCH ALL EXAMS
  ===================================================== */

  const fetchExams = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get(
        "/admin/exams",
        getAuthConfig()
      );

      const examList =
        response.data.exams ||
        response.data.data ||
        [];

      setExams(examList);

      if (examList.length > 0) {
        setSelectedExamId(
          String(examList[0].id)
        );
      } else {
        setSelectedExamId("");
      }
    } catch (error) {
      console.error(error);

      if (
        error.response?.status === 401 ||
        error.response?.status === 403
      ) {
        logout();
        return;
      }

      setError(
        error.response?.data?.message ||
          "Unable to load examination details."
      );
    } finally {
      setLoading(false);
    }
  };

  /* =====================================================
     FETCH LEADERBOARD
  ===================================================== */

  useEffect(() => {
    if (!selectedExamId) {
      setLeaderboard([]);
      return;
    }

    fetchLeaderboard(selectedExamId);
  }, [selectedExamId]);

  const fetchLeaderboard = async (examId) => {
    setLeaderboardLoading(true);

    try {
      const response = await api.get(
        `/leaderboard/${examId}`,
        getAuthConfig()
      );

      setLeaderboard(
        response.data.leaderboard || []
      );
    } catch (error) {
      console.error(error);

      if (
        error.response?.status === 401 ||
        error.response?.status === 403
      ) {
        logout();
        return;
      }

      setLeaderboard([]);
    } finally {
      setLeaderboardLoading(false);
    }
  };

  /* =====================================================
     DATE HELPERS
  ===================================================== */

  const getDate = (value) => {
    if (!value) {
      return null;
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return null;
    }

    return date;
  };

  const getExamStatus = (exam) => {
    const now = new Date();

    const start = getDate(exam.start_time);
    const end = getDate(exam.end_time);

    if (!start || !end) {
      return "SCHEDULED";
    }

    if (now < start) {
      return "SCHEDULED";
    }

    if (now >= start && now <= end) {
      return "ACTIVE";
    }

    return "COMPLETED";
  };

  const formatDateTime = (value) => {
    const date = getDate(value);

    if (!date) {
      return "—";
    }

    return date.toLocaleString(
      "en-IN",
      {
        dateStyle: "medium",
        timeStyle: "short",
      }
    );
  };

  /* =====================================================
     EXAM CATEGORIES
  ===================================================== */

  const activeExams = useMemo(() => {
    return exams.filter(
      (exam) =>
        getExamStatus(exam) === "ACTIVE"
    );
  }, [exams]);

  const scheduledExams = useMemo(() => {
    return exams.filter(
      (exam) =>
        getExamStatus(exam) === "SCHEDULED"
    );
  }, [exams]);

  const completedExams = useMemo(() => {
    return exams.filter(
      (exam) =>
        getExamStatus(exam) === "COMPLETED"
    );
  }, [exams]);

  const selectedExam = useMemo(() => {
    return exams.find(
      (exam) =>
        String(exam.id) ===
        String(selectedExamId)
    );
  }, [exams, selectedExamId]);

  /* =====================================================
     FORM CHANGE
  ===================================================== */

  const handleChange = (event) => {
    setFormData({
      ...formData,
      [event.target.name]:
        event.target.value,
    });
  };

  /* =====================================================
     SCHEDULE EXAM
  ===================================================== */

  const handleScheduleExam = async (event) => {
    event.preventDefault();

    setScheduleMessage("");
    setError("");

    if (
      !formData.title ||
      !formData.topic ||
      !formData.start_time ||
      !formData.end_time ||
      !formData.duration_minutes
    ) {
      setError(
        "Please fill in all examination details."
      );

      return;
    }

    const start = new Date(
      formData.start_time
    );

    const end = new Date(
      formData.end_time
    );

    if (
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime())
    ) {
      setError(
        "Please enter valid start and end times."
      );

      return;
    }

    if (end <= start) {
      setError(
        "End time must be later than start time."
      );

      return;
    }

    if (
      Number(formData.duration_minutes) <= 0
    ) {
      setError(
        "Duration must be greater than zero."
      );

      return;
    }

    setScheduleLoading(true);

    try {
      await api.post(
        "/admin/exams",
        {
          title: formData.title,
          topic: formData.topic,
          start_time: formData.start_time,
          end_time: formData.end_time,
          duration_minutes:
            Number(formData.duration_minutes),
          rules: formData.rules,
        },
        getAuthConfig()
      );

      setScheduleMessage(
        "Examination scheduled successfully."
      );

      setFormData({
        title: "",
        topic: "",
        start_time: "",
        end_time: "",
        duration_minutes: "20",
        rules:
          "No negative marking. Do not refresh the page. Read every question carefully.",
      });

      await fetchExams();
    } catch (error) {
      console.error(error);

      if (
        error.response?.status === 401 ||
        error.response?.status === 403
      ) {
        logout();
        return;
      }

      setError(
        error.response?.data?.message ||
          "Unable to schedule the examination."
      );
    } finally {
      setScheduleLoading(false);
    }
  };

  /* =====================================================
     MANAGE QUESTIONS
  ===================================================== */

  const manageQuestions = (examId) => {
    navigate(
      `/admin/exams/${examId}/questions`
    );
  };

  /* =====================================================
     LOGOUT
  ===================================================== */

  const logout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("admin");

    navigate("/admin", {
      replace: true,
    });
  };

  /* =====================================================
     INITIALS
  ===================================================== */

  const getInitials = (name) => {
    if (!name) {
      return "A";
    }

    const parts = name
      .trim()
      .split(" ");

    if (parts.length === 1) {
      return parts[0]
        .charAt(0)
        .toUpperCase();
    }

    return (
      parts[0].charAt(0) +
      parts[parts.length - 1].charAt(0)
    ).toUpperCase();
  };

  /* =====================================================
     LOADING
  ===================================================== */

  if (loading) {
    return (
      <div className="admin-dashboard-loading">

        <div className="admin-loading-spinner"></div>

        <p>
          Loading administration dashboard...
        </p>

      </div>
    );
  }

  const adminName =
    admin?.name ||
    "Administrator";

  return (
    <div className="admin-dashboard-page">

      {/* =================================================
          HEADER
      ================================================= */}

      <header className="admin-dashboard-header">

        <div className="admin-dashboard-header-inner">

          <div className="admin-dashboard-brand">

            <div className="admin-dashboard-logo">
              Q
            </div>

            <div>
              <h1>
                Quiz Portal
              </h1>

              <span>
                Administration Console
              </span>
            </div>

          </div>

          <div className="admin-header-right">

            <div className="admin-header-role">

              <span>
                ADMIN
              </span>

              <strong>
                {adminName}
              </strong>

            </div>

            <div className="admin-header-avatar">
              {getInitials(adminName)}
            </div>

            <button
              type="button"
              className="admin-logout-button"
              onClick={logout}
            >
              Sign Out
            </button>

          </div>

        </div>

      </header>


      {/* =================================================
          MAIN
      ================================================= */}

      <main className="admin-dashboard-main">

        {/* PAGE TITLE */}

        <section className="admin-dashboard-intro">

          <div>

            <span className="admin-section-eyebrow">
              ADMINISTRATION DASHBOARD
            </span>

            <h2>
              Good day,{" "}
              <span>
                {adminName}
              </span>
            </h2>

            <p>
              Manage examinations, monitor active
              assessments, and review participant
              performance.
            </p>

          </div>

          <div className="admin-dashboard-date">

            <span>
              TODAY
            </span>

            <strong>
              {new Date().toLocaleDateString(
                "en-IN",
                {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                }
              )}
            </strong>

          </div>

        </section>


        {/* ERROR */}

        {error && (
          <div className="admin-dashboard-error">
            <span>!</span>
            {error}
          </div>
        )}


        {/* SUCCESS */}

        {scheduleMessage && (
          <div className="admin-dashboard-success">
            <span>✓</span>
            {scheduleMessage}
          </div>
        )}


        {/* =================================================
            STAT CARDS
        ================================================= */}

        <section className="admin-stat-grid">

          <div className="admin-stat-card">

            <div className="admin-stat-icon active">
              ●
            </div>

            <div>

              <span>
                ACTIVE TESTS
              </span>

              <strong>
                {activeExams.length}
              </strong>

              <p>
                Currently available
              </p>

            </div>

          </div>


          <div className="admin-stat-card">

            <div className="admin-stat-icon scheduled">
              ◷
            </div>

            <div>

              <span>
                SCHEDULED
              </span>

              <strong>
                {scheduledExams.length}
              </strong>

              <p>
                Upcoming examinations
              </p>

            </div>

          </div>


          <div className="admin-stat-card">

            <div className="admin-stat-icon completed">
              ✓
            </div>

            <div>

              <span>
                COMPLETED
              </span>

              <strong>
                {completedExams.length}
              </strong>

              <p>
                Previous examinations
              </p>

            </div>

          </div>


          <div className="admin-stat-card">

            <div className="admin-stat-icon participants">
              #
            </div>

            <div>

              <span>
                SUBMISSIONS
              </span>

              <strong>
                {leaderboard.length}
              </strong>

              <p>
                Selected examination
              </p>

            </div>

          </div>

        </section>


        {/* =================================================
            ACTIVE TEST
        ================================================= */}

        <section className="admin-section">

          <div className="admin-section-heading">

            <div>

              <span className="admin-section-eyebrow">
                LIVE MONITORING
              </span>

              <h3>
                Active Examination
              </h3>

            </div>

          </div>


          {activeExams.length > 0 ? (

            <div className="admin-active-grid">

              {activeExams.map((exam) => (

                <div
                  className="admin-active-card"
                  key={exam.id}
                >

                  <div className="admin-active-top">

                    <div>

                      <div className="admin-active-badge">
                        <span></span>
                        ACTIVE NOW
                      </div>

                      <h4>
                        {exam.title}
                      </h4>

                      <p>
                        {exam.topic ||
                          "General Assessment"}
                      </p>

                    </div>

                    <div className="admin-active-duration">

                      <span>
                        DURATION
                      </span>

                      <strong>
                        {exam.duration_minutes}
                        <small>
                          min
                        </small>
                      </strong>

                    </div>

                  </div>


                  <div className="admin-active-details">

                    <div>
                      <span>
                        START
                      </span>

                      <strong>
                        {formatDateTime(
                          exam.start_time
                        )}
                      </strong>
                    </div>

                    <div>
                      <span>
                        END
                      </span>

                      <strong>
                        {formatDateTime(
                          exam.end_time
                        )}
                      </strong>
                    </div>

                    <div>
                      <span>
                        EXAM ID
                      </span>

                      <strong>
                        #{exam.id}
                      </strong>
                    </div>

                  </div>


                  {/* MANAGE QUESTIONS */}

                  <button
                    type="button"
                    className="admin-manage-questions-button"
                    onClick={() =>
                      manageQuestions(exam.id)
                    }
                  >
                    Manage Questions
                    <span>→</span>
                  </button>

                </div>

              ))}

            </div>

          ) : (

            <div className="admin-empty-card">

              <div className="admin-empty-icon">
                —
              </div>

              <div>

                <h4>
                  No Active Examination
                </h4>

                <p>
                  There is currently no live
                  examination.
                </p>

              </div>

            </div>

          )}

        </section>


        {/* =================================================
            TWO COLUMN AREA
        ================================================= */}

        <section className="admin-management-grid">


          {/* =================================================
              SCHEDULE EXAM
          ================================================= */}

          <div className="admin-panel">

            <div className="admin-panel-header">

              <div>

                <span className="admin-section-eyebrow">
                  EXAMINATION MANAGEMENT
                </span>

                <h3>
                  Schedule New Test
                </h3>

              </div>

              <div className="admin-panel-number">
                01
              </div>

            </div>


            <form
              className="admin-schedule-form"
              onSubmit={handleScheduleExam}
            >

              <div className="admin-form-row">

                <div className="admin-dashboard-form-group">

                  <label>
                    Test Title
                  </label>

                  <input
                    type="text"
                    name="title"
                    placeholder="e.g. Sunday Aptitude Test"
                    value={formData.title}
                    onChange={handleChange}
                  />

                </div>


                <div className="admin-dashboard-form-group">

                  <label>
                    Topic
                  </label>

                  <input
                    type="text"
                    name="topic"
                    placeholder="e.g. Number System"
                    value={formData.topic}
                    onChange={handleChange}
                  />

                </div>

              </div>


              <div className="admin-form-row">

                <div className="admin-dashboard-form-group">

                  <label>
                    Start Time
                  </label>

                  <input
                    type="datetime-local"
                    name="start_time"
                    value={formData.start_time}
                    onChange={handleChange}
                  />

                </div>


                <div className="admin-dashboard-form-group">

                  <label>
                    End Time
                  </label>

                  <input
                    type="datetime-local"
                    name="end_time"
                    value={formData.end_time}
                    onChange={handleChange}
                  />

                </div>

              </div>


              <div className="admin-form-row single">

                <div className="admin-dashboard-form-group">

                  <label>
                    Test Duration
                  </label>

                  <div className="admin-input-with-unit">

                    <input
                      type="number"
                      name="duration_minutes"
                      min="1"
                      value={
                        formData.duration_minutes
                      }
                      onChange={handleChange}
                    />

                    <span>
                      minutes
                    </span>

                  </div>

                </div>

              </div>


              <div className="admin-dashboard-form-group">

                <label>
                  Examination Rules
                </label>

                <textarea
                  name="rules"
                  rows="4"
                  placeholder="Enter examination rules..."
                  value={formData.rules}
                  onChange={handleChange}
                />

              </div>


              <button
                type="submit"
                className="admin-schedule-button"
                disabled={scheduleLoading}
              >

                {scheduleLoading
                  ? "Scheduling..."
                  : "Schedule Examination"}

                {!scheduleLoading && (
                  <span>
                    →
                  </span>
                )}

              </button>

            </form>

          </div>


          {/* =================================================
              UPCOMING TESTS
          ================================================= */}

          <div className="admin-panel">

            <div className="admin-panel-header">

              <div>

                <span className="admin-section-eyebrow">
                  UPCOMING
                </span>

                <h3>
                  Scheduled Tests
                </h3>

              </div>

              <div className="admin-panel-number">
                02
              </div>

            </div>


            {scheduledExams.length > 0 ? (

              <div className="admin-upcoming-list">

                {scheduledExams.map((exam) => (

                  <div
                    className="admin-upcoming-item"
                    key={exam.id}
                  >

                    <div className="admin-upcoming-icon">
                      Q
                    </div>

                    <div className="admin-upcoming-content">

                      <strong>
                        {exam.title}
                      </strong>

                      <span>
                        {exam.topic ||
                          "General Assessment"}
                      </span>

                      <small>
                        {formatDateTime(
                          exam.start_time
                        )}
                      </small>

                    </div>

                    <div className="admin-upcoming-duration">

                      {exam.duration_minutes}

                      <small>
                        min
                      </small>

                    </div>


                    {/* MANAGE QUESTIONS */}

                    <button
                      type="button"
                      className="admin-upcoming-manage-button"
                      onClick={() =>
                        manageQuestions(exam.id)
                      }
                    >
                      Questions →
                    </button>

                  </div>

                ))}

              </div>

            ) : (

              <div className="admin-small-empty">

                <span>
                  —
                </span>

                <p>
                  No upcoming examinations scheduled.
                </p>

              </div>

            )}

          </div>

        </section>


        {/* =================================================
            COMPLETED TESTS
        ================================================= */}

        <section className="admin-section">

          <div className="admin-section-heading">

            <div>

              <span className="admin-section-eyebrow">
                EXAMINATION ARCHIVE
              </span>

              <h3>
                Completed Examinations
              </h3>

              <p>
                Manage questions for previously
                conducted examinations.
              </p>

            </div>

          </div>


          {completedExams.length > 0 ? (

            <div className="admin-completed-grid">

              {completedExams.map((exam) => (

                <div
                  className="admin-completed-card"
                  key={exam.id}
                >

                  <div className="admin-completed-icon">
                    Q
                  </div>

                  <div className="admin-completed-content">

                    <h4>
                      {exam.title}
                    </h4>

                    <p>
                      {exam.topic ||
                        "General Assessment"}
                    </p>

                    <span>
                      Completed:{" "}
                      {formatDateTime(
                        exam.end_time
                      )}
                    </span>

                  </div>

                  <button
                    type="button"
                    className="admin-completed-manage-button"
                    onClick={() =>
                      manageQuestions(exam.id)
                    }
                  >
                    Manage Questions →
                  </button>

                </div>

              ))}

            </div>

          ) : (

            <div className="admin-empty-card">

              <div className="admin-empty-icon">
                —
              </div>

              <div>

                <h4>
                  No Completed Examinations
                </h4>

                <p>
                  Completed examinations will
                  appear here.
                </p>

              </div>

            </div>

          )}

        </section>


        {/* =================================================
            LEADERBOARD
        ================================================= */}

        <section className="admin-section">

          <div className="admin-section-heading leaderboard-heading">

            <div>

              <span className="admin-section-eyebrow">
                PERFORMANCE
              </span>

              <h3>
                Examination Leaderboard
              </h3>

              <p>
                The same leaderboard data visible
                to examination participants.
              </p>

            </div>


            <div className="admin-leaderboard-selector">

              <label>
                SELECT TEST
              </label>

              <select
                value={selectedExamId}
                onChange={(event) =>
                  setSelectedExamId(
                    event.target.value
                  )
                }
              >

                <option value="">
                  Select examination
                </option>

                {exams.map((exam) => (

                  <option
                    value={exam.id}
                    key={exam.id}
                  >
                    {exam.title}
                  </option>

                ))}

              </select>

            </div>

          </div>


          <div className="admin-leaderboard-card">

            {selectedExam && (
              <div className="admin-leaderboard-exam">

                <div>

                  <strong>
                    {selectedExam.title}
                  </strong>

                  <span>
                    {selectedExam.topic ||
                      "General Assessment"}
                  </span>

                </div>

                <div
                  className={
                    `admin-status-pill ${
                      getExamStatus(
                        selectedExam
                      ).toLowerCase()
                    }`
                  }
                >
                  {getExamStatus(
                    selectedExam
                  )}
                </div>

              </div>
            )}


            {leaderboardLoading ? (

              <div className="admin-leaderboard-loading">
                Loading leaderboard...
              </div>

            ) : leaderboard.length === 0 ? (

              <div className="admin-leaderboard-empty">

                <div>
                  —
                </div>

                <h4>
                  No submissions yet
                </h4>

                <p>
                  Participant results will appear
                  here after examination submission.
                </p>

              </div>

            ) : (

              <div className="admin-table-wrapper">

                <table className="admin-leaderboard-table">

                  <thead>

                    <tr>

                      <th>
                        RANK
                      </th>

                      <th>
                        PARTICIPANT
                      </th>

                      <th>
                        SCORE
                      </th>

                      <th>
                        CORRECT
                      </th>

                      <th>
                        WRONG
                      </th>

                      <th>
                        SKIPPED
                      </th>

                      <th>
                        TIME
                      </th>

                    </tr>

                  </thead>


                  <tbody>

                    {leaderboard.map(
                      (entry) => (

                        <tr
                          key={entry.user_id}
                        >

                          <td>

                            <span
                              className={
                                `admin-rank ${
                                  entry.rank <= 3
                                    ? "top-rank"
                                    : ""
                                }`
                              }
                            >
                              {entry.rank}
                            </span>

                          </td>


                          <td>

                            <div className="admin-participant">

                              <div className="admin-participant-avatar">
                                {getInitials(
                                  entry.name
                                )}
                              </div>

                              <strong>
                                {entry.name}
                              </strong>

                            </div>

                          </td>


                          <td>

                            <strong className="admin-score">
                              {entry.score}%
                            </strong>

                          </td>


                          <td>
                            {entry.correct_answers}
                          </td>


                          <td>
                            {entry.wrong_answers}
                          </td>


                          <td>
                            {entry.skipped_answers}
                          </td>


                          <td>
                            {Math.floor(
                              entry.time_taken_seconds /
                                60
                            )}{" "}
                            min{" "}
                            {entry.time_taken_seconds %
                              60}{" "}
                            sec
                          </td>

                        </tr>

                      )
                    )}

                  </tbody>

                </table>

              </div>

            )}

          </div>

        </section>

      </main>


      {/* =================================================
          FOOTER
      ================================================= */}

      <footer className="admin-dashboard-footer">

        <span>
          Quiz Portal
        </span>

        <span>
          Administration Console
        </span>

        <span>
          by Meghanjani
        </span>

      </footer>

    </div>
  );
}

export default AdminDashboard;