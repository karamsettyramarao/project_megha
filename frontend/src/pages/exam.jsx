import { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import api from "../services/api";

function Exam() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);

  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // ==========================================
  // LOAD EXAM DATA
  // ==========================================

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/");
      return;
    }

    const loadExam = async () => {
      try {
        setLoading(true);
        setError("");

        // ======================================
        // GET EXAM DETAILS
        // ======================================

        const examResponse = await api.get(
          `/exams/${id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const examData = examResponse.data.exam;

        setExam(examData);

        // ======================================
        // GET LATEST QUESTIONS
        // ======================================
        // Important:
        // Do NOT use location.state.questions
        // because it may contain old questions.
        //
        // This endpoint already exists in your
        // questionRoutes.js:
        //
        // GET /api/admin/exams/:examId/questions
        // ======================================

        const questionResponse = await api.get(
          `/admin/exams/${id}/questions`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const latestQuestions =
          questionResponse.data.questions || [];

        setQuestions(latestQuestions);

        // ======================================
        // TIMER
        // ======================================

        const durationSeconds =
          (examData?.duration_minutes || 20) * 60;

        setTimeLeft(durationSeconds);

        // ======================================
        // SAVE EXAM START INFORMATION
        // ======================================

        const startData = location.state;

        sessionStorage.setItem(
          `exam_${id}_started_at`,
          startData?.attempt?.started_at ||
            new Date().toISOString()
        );

        sessionStorage.setItem(
          `exam_${id}_duration`,
          durationSeconds.toString()
        );

      } catch (error) {
        console.error(
          "Failed to load examination:",
          error
        );

        setError(
          error.response?.data?.message ||
            "Failed to load examination."
        );
      } finally {
        setLoading(false);
      }
    };

    loadExam();
  }, [id, navigate, location.state]);


  // ==========================================
  // TIMER
  // ==========================================

  useEffect(() => {
    if (loading || timeLeft <= 0) {
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((previous) => {
        if (previous <= 1) {
          clearInterval(timer);

          handleSubmit(true);

          return 0;
        }

        return previous - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [loading]);


  // ==========================================
  // FORMAT TIMER
  // ==========================================

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);

    const remainingSeconds = seconds % 60;

    return `${String(minutes).padStart(2, "0")}:${String(
      remainingSeconds
    ).padStart(2, "0")}`;
  };


  // ==========================================
  // SELECT ANSWER
  // ==========================================

  const handleAnswer = (questionId, answer) => {
    setAnswers((previous) => ({
      ...previous,
      [questionId]: answer,
    }));
  };


  // ==========================================
  // NEXT
  // ==========================================

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(
        (previous) => previous + 1
      );
    }
  };


  // ==========================================
  // PREVIOUS
  // ==========================================

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(
        (previous) => previous - 1
      );
    }
  };


  // ==========================================
  // GO TO QUESTION
  // ==========================================

  const goToQuestion = (index) => {
    setCurrentIndex(index);
  };


  // ==========================================
  // SUBMIT EXAM
  // ==========================================

  async function handleSubmit(autoSubmit = false) {
    if (submitting) {
      return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/");
      return;
    }

    if (!autoSubmit) {
      const confirmed = window.confirm(
        "Are you sure you want to submit the test?"
      );

      if (!confirmed) {
        return;
      }
    }

    setSubmitting(true);
    setError("");

    try {
      const formattedAnswers = questions.map(
        (question) => ({
          question_id: question.id,
          selected_answer:
            answers[question.id] || null,
        })
      );

      const response = await api.post(
        `/exams/${id}/submit`,
        {
          answers: formattedAnswers,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      sessionStorage.removeItem(
        `exam_${id}_started_at`
      );

      sessionStorage.removeItem(
        `exam_${id}_duration`
      );

      navigate(`/result/${id}`, {
        state: response.data.result,
      });

    } catch (error) {
      console.error(
        "Submit exam error:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Failed to submit examination."
      );

      setSubmitting(false);
    }
  }


  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div className="exam-loading">
        Loading examination...
      </div>
    );
  }


  // ==========================================
  // ERROR
  // ==========================================

  if (error && questions.length === 0) {
    return (
      <div className="exam-error">
        {error}
      </div>
    );
  }


  // ==========================================
  // NO QUESTIONS
  // ==========================================

  if (questions.length === 0) {
    return (
      <div className="exam-error">
        No questions available for this examination.
      </div>
    );
  }


  // ==========================================
  // CURRENT QUESTION
  // ==========================================

  const currentQuestion =
    questions[currentIndex];

  const answeredCount =
    Object.keys(answers).length;


  // ==========================================
  // EXAM UI
  // ==========================================

  return (
    <div className="exam-page">

      {/* ======================================
          HEADER
      ====================================== */}

      <header className="exam-header">

        <div>
          <h1>
            {exam?.title ||
              "Online Examination"}
          </h1>

          <p>
            {exam?.topic ||
              "Examination"}
          </p>
        </div>

        <div className="timer-box">

          <span>
            Time Remaining
          </span>

          <strong
            className={
              timeLeft <= 60
                ? "timer-danger"
                : ""
            }
          >
            {formatTime(timeLeft)}
          </strong>

        </div>

      </header>


      {/* ======================================
          MAIN CONTENT
      ====================================== */}

      <div className="exam-layout">

        {/* ====================================
            QUESTION SECTION
        ==================================== */}

        <main className="question-section">

          <div className="question-header">

            <span>
              Question {currentIndex + 1} of{" "}
              {questions.length}
            </span>

            <span>
              {answeredCount} /{" "}
              {questions.length} Answered
            </span>

          </div>


          <div className="question-card">

            <h2>
              {currentQuestion.question_text}
            </h2>


            <div className="options">

              {[
                [
                  "A",
                  currentQuestion.option_a,
                ],
                [
                  "B",
                  currentQuestion.option_b,
                ],
                [
                  "C",
                  currentQuestion.option_c,
                ],
                [
                  "D",
                  currentQuestion.option_d,
                ],
              ].map(
                ([letter, text]) => {

                  const selected =
                    answers[
                      currentQuestion.id
                    ] === letter;

                  return (
                    <button
                      key={letter}
                      type="button"
                      className={`option ${
                        selected
                          ? "option-selected"
                          : ""
                      }`}
                      onClick={() =>
                        handleAnswer(
                          currentQuestion.id,
                          letter
                        )
                      }
                    >

                      <span className="option-letter">
                        {letter}
                      </span>

                      <span className="option-text">
                        {text}
                      </span>

                    </button>
                  );
                }
              )}

            </div>

          </div>


          {/* ==================================
              ERROR
          ================================== */}

          {error && (
            <div className="exam-submit-error">
              {error}
            </div>
          )}


          {/* ==================================
              NAVIGATION
          ================================== */}

          <div className="question-navigation">

            <button
              type="button"
              className="secondary-button"
              onClick={handlePrevious}
              disabled={
                currentIndex === 0
              }
            >
              ← Previous
            </button>


            {currentIndex <
            questions.length - 1 ? (

              <button
                type="button"
                className="primary-button"
                onClick={handleNext}
              >
                Next →
              </button>

            ) : (

              <button
                type="button"
                className="submit-button"
                onClick={() =>
                  handleSubmit(false)
                }
                disabled={submitting}
              >
                {submitting
                  ? "Submitting..."
                  : "Submit Test"}
              </button>

            )}

          </div>

        </main>


        {/* ====================================
            QUESTION SIDEBAR
        ==================================== */}

        <aside className="question-sidebar">

          <h3>
            Questions
          </h3>

          <p>
            Click a number to navigate
          </p>


          <div className="question-grid">

            {questions.map(
              (question, index) => {

                const answered =
                  answers[question.id];

                const current =
                  index === currentIndex;

                return (
                  <button
                    key={question.id}
                    type="button"
                    className={`
                      question-number
                      ${
                        current
                          ? "current"
                          : ""
                      }
                      ${
                        answered
                          ? "answered"
                          : ""
                      }
                    `}
                    onClick={() =>
                      goToQuestion(index)
                    }
                  >
                    {index + 1}
                  </button>
                );
              }
            )}

          </div>


          {/* ==================================
              LEGEND
          ================================== */}

          <div className="legend">

            <div>
              <span className="legend-box current-box"></span>
              Current
            </div>

            <div>
              <span className="legend-box answered-box"></span>
              Answered
            </div>

            <div>
              <span className="legend-box unanswered-box"></span>
              Not Answered
            </div>

          </div>

        </aside>

      </div>

    </div>
  );
}

export default Exam;