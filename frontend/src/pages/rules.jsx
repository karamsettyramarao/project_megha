import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";

function Rules() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/");
      return;
    }

    const fetchExam = async () => {
      try {
        const response = await api.get(
          `/exams/${id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setExam(response.data.exam);
      } catch (error) {
        console.error(error);

        setError(
          error.response?.data?.message ||
            "Failed to load examination."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchExam();
  }, [id, navigate]);

  const handleStartExam = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/");
      return;
    }

    setStarting(true);
    setError("");

    try {
      const response = await api.post(
        `/exams/${id}/start`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      navigate(`/exam/${id}`, {
        state: response.data,
      });
    } catch (error) {
      console.error(error);

      setError(
        error.response?.data?.message ||
          "Failed to start examination."
      );

      setStarting(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) {
      return "-";
    }

    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) {
      return dateString;
    }

    return date.toLocaleString();
  };

  if (loading) {
    return (
      <div className="rules-loading-page">
        <div className="rules-spinner"></div>
        <p>Loading examination...</p>
      </div>
    );
  }

  if (error && !exam) {
    return (
      <div className="rules-error-page">
        <div className="rules-error-card">
          <div className="rules-error-icon">!</div>

          <h2>Unable to load examination</h2>

          <p>{error}</p>

          <button
            className="rules-back-button"
            onClick={() => navigate("/profile")}
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!exam) {
    return null;
  }

  const rules = exam.rules
    ? exam.rules
        .split(".")
        .map((rule) => rule.trim())
        .filter(Boolean)
    : [];

  return (
    <div className="rules-page">

      {/* HEADER */}

      <header className="rules-header">

        <div
          className="rules-brand"
          onClick={() => navigate("/profile")}
        >
          <div className="rules-brand-mark">
            Q
          </div>

          <div className="rules-brand-text">
            <strong>Quiz Portal</strong>
            <span>Learn. Practice. Improve.</span>
          </div>
        </div>

        <button
          className="rules-dashboard-button"
          onClick={() => navigate("/profile")}
        >
          Dashboard
        </button>

      </header>


      {/* MAIN */}

      <main className="rules-content">

        <div className="rules-breadcrumb">
          Dashboard
          <span>›</span>
          Examination
          <span>›</span>
          Rules
        </div>


        {/* EXAM CARD */}

        <section className="rules-exam-card">

          <div className="rules-exam-top">

            <div>

              <div className="rules-active-badge">
                <span></span>
                ACTIVE
              </div>

              <h1>
                {exam.title}
              </h1>

              <p className="rules-topic">
                {exam.topic || "General Examination"}
              </p>

            </div>

            <div className="rules-exam-icon">
              Q
            </div>

          </div>


          {/* INFO */}

          <div className="rules-info-grid">

            <div className="rules-info-item">

              <span>TEST DURATION</span>

              <strong>
                {exam.duration_minutes} Minutes
              </strong>

            </div>


            <div className="rules-info-item">

              <span>START TIME</span>

              <strong>
                {formatDate(exam.start_time)}
              </strong>

            </div>


            <div className="rules-info-item">

              <span>END TIME</span>

              <strong>
                {formatDate(exam.end_time)}
              </strong>

            </div>

          </div>

        </section>


        {/* RULES */}

        <section className="rules-instructions-card">

          <div className="rules-title-row">

            <div className="rules-title-icon">
              ✓
            </div>

            <div>
              <span className="rules-eyebrow">
                BEFORE YOU BEGIN
              </span>

              <h2>
                Examination Rules
              </h2>
            </div>

          </div>


          <p className="rules-description">
            Please read the following instructions
            carefully before starting your examination.
          </p>


          {rules.length > 0 ? (

            <div className="rules-list">

              {rules.map((rule, index) => (

                <div
                  className="rule-item"
                  key={index}
                >

                  <div className="rule-number">
                    {index + 1}
                  </div>

                  <p>
                    {rule}
                  </p>

                </div>

              ))}

            </div>

          ) : (

            <div className="no-rules">
              No additional instructions have been
              provided for this examination.
            </div>

          )}

        </section>


        {/* WARNING */}

        <div className="rules-notice">

          <span className="notice-icon">
            i
          </span>

          <p>
            Once you start the examination, your
            attempt will be recorded. Make sure you
            are ready before proceeding.
          </p>

        </div>


        {/* ERROR */}

        {error && (
          <div className="rules-submit-error">
            {error}
          </div>
        )}


        {/* ACTIONS */}

        <div className="rules-actions">

          <button
            className="rules-back-button"
            onClick={() => navigate("/profile")}
            disabled={starting}
          >
            ← Back
          </button>

          <button
            className="rules-start-button"
            onClick={handleStartExam}
            disabled={starting}
          >
            {starting
              ? "Starting..."
              : "Start Examination"}

            {!starting && (
              <span>→</span>
            )}
          </button>

        </div>

      </main>

    </div>
  );
}

export default Rules;