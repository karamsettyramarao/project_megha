import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";

function ManageQuestions() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    question_text: "",
    option_a: "",
    option_b: "",
    option_c: "",
    option_d: "",
    correct_answer: "",
    explanation: "",
  });

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

  useEffect(() => {
    const token = getAdminToken();

    if (!token) {
      navigate("/admin", { replace: true });
      return;
    }

    fetchExamAndQuestions();
  }, [id, navigate]);

  const fetchExamAndQuestions = async () => {
    setLoading(true);
    setError("");

    try {
      const examResponse = await api.get(
        `/admin/exams/${id}`,
        getAuthConfig()
      );

      setExam(examResponse.data.exam);

      const questionResponse = await api.get(
        `/admin/exams/${id}/questions`,
        getAuthConfig()
      );

      setQuestions(
        questionResponse.data.questions || []
      );
    } catch (error) {
      console.error(error);

      if (
        error.response?.status === 401 ||
        error.response?.status === 403
      ) {
        localStorage.removeItem("adminToken");
        localStorage.removeItem("admin");

        navigate("/admin", { replace: true });
        return;
      }

      setError(
        error.response?.data?.message ||
          "Unable to load examination questions."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (event) => {
    setFormData({
      ...formData,
      [event.target.name]: event.target.value,
    });
  };

  const handleAddQuestion = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (
      !formData.question_text.trim() ||
      !formData.option_a.trim() ||
      !formData.option_b.trim() ||
      !formData.option_c.trim() ||
      !formData.option_d.trim() ||
      !formData.correct_answer
    ) {
      setError(
        "Please fill in the question, all four options, and select the correct answer."
      );

      return;
    }

    setSaving(true);

    try {
      await api.post(
        `/admin/exams/${id}/questions`,
        {
          question_text:
            formData.question_text.trim(),

          option_a:
            formData.option_a.trim(),

          option_b:
            formData.option_b.trim(),

          option_c:
            formData.option_c.trim(),

          option_d:
            formData.option_d.trim(),

          correct_answer:
            formData.correct_answer,

          explanation:
            formData.explanation.trim(),
        },
        getAuthConfig()
      );

      setSuccess(
        "Question added successfully."
      );

      setFormData({
        question_text: "",
        option_a: "",
        option_b: "",
        option_c: "",
        option_d: "",
        correct_answer: "",
        explanation: "",
      });

      await fetchExamAndQuestions();
    } catch (error) {
      console.error(error);

      if (
        error.response?.status === 401 ||
        error.response?.status === 403
      ) {
        localStorage.removeItem("adminToken");
        localStorage.removeItem("admin");

        navigate("/admin", { replace: true });
        return;
      }

      setError(
        error.response?.data?.message ||
          "Unable to add question."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteQuestion = async (questionId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this question?"
    );

    if (!confirmed) {
      return;
    }

    setError("");
    setSuccess("");

    try {
      await api.delete(
        `/admin/exams/${id}/questions/${questionId}`,
        getAuthConfig()
      );

      setSuccess(
        "Question deleted successfully."
      );

      await fetchExamAndQuestions();
    } catch (error) {
      console.error(error);

      if (
        error.response?.status === 401 ||
        error.response?.status === 403
      ) {
        localStorage.removeItem("adminToken");
        localStorage.removeItem("admin");

        navigate("/admin", { replace: true });
        return;
      }

      setError(
        error.response?.data?.message ||
          "Unable to delete question."
      );
    }
  };

  const logout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("admin");

    navigate("/admin", { replace: true });
  };

  if (loading) {
    return (
      <div className="manage-questions-loading">
        <div className="manage-loading-spinner"></div>
        <p>Loading examination questions...</p>
      </div>
    );
  }

  return (
    <div className="manage-questions-page">

      {/* HEADER */}

      <header className="manage-questions-header">

        <div className="manage-questions-header-inner">

          <div className="manage-questions-brand">

            <div className="manage-questions-logo">
              Q
            </div>

            <div>
              <h1>Quiz Portal</h1>
              <span>Administration Console</span>
            </div>

          </div>

          <div className="manage-questions-header-actions">

            <button
              type="button"
              className="manage-back-button"
              onClick={() =>
                navigate("/admin/dashboard")
              }
            >
              ← Dashboard
            </button>

            <button
              type="button"
              className="manage-signout-button"
              onClick={logout}
            >
              Sign Out
            </button>

          </div>

        </div>

      </header>


      {/* MAIN */}

      <main className="manage-questions-main">

        {/* EXAM INFORMATION */}

        {exam && (
          <section className="manage-exam-info">

            <div>

              <span className="manage-eyebrow">
                QUESTION MANAGEMENT
              </span>

              <h2>
                {exam.title}
              </h2>

              <p>
                {exam.topic ||
                  "General Assessment"}
              </p>

            </div>

            <div className="manage-exam-meta">

              <div>
                <span>EXAM ID</span>
                <strong>#{exam.id}</strong>
              </div>

              <div>
                <span>DURATION</span>
                <strong>
                  {exam.duration_minutes} min
                </strong>
              </div>

              <div>
                <span>QUESTIONS</span>
                <strong>
                  {questions.length}
                </strong>
              </div>

            </div>

          </section>
        )}


        {/* ERROR */}

        {error && (
          <div className="manage-questions-error">
            <span>!</span>
            {error}
          </div>
        )}


        {/* SUCCESS */}

        {success && (
          <div className="manage-questions-success">
            <span>✓</span>
            {success}
          </div>
        )}


        {/* TWO COLUMN */}

        <section className="manage-questions-grid">

          {/* ADD QUESTION */}

          <div className="manage-question-panel">

            <div className="manage-panel-header">

              <div>

                <span className="manage-eyebrow">
                  NEW QUESTION
                </span>

                <h3>
                  Add Question
                </h3>

              </div>

              <span className="manage-panel-number">
                {String(
                  questions.length + 1
                ).padStart(2, "0")}
              </span>

            </div>


            <form
              className="manage-question-form"
              onSubmit={handleAddQuestion}
            >

              <div className="manage-form-group">

                <label>
                  Question
                </label>

                <textarea
                  name="question_text"
                  rows="4"
                  placeholder="Enter the actual examination question..."
                  value={
                    formData.question_text
                  }
                  onChange={handleChange}
                />

              </div>


              <div className="manage-options-grid">

                <div className="manage-form-group">

                  <label>
                    Option A
                  </label>

                  <input
                    type="text"
                    name="option_a"
                    placeholder="Enter option A"
                    value={
                      formData.option_a
                    }
                    onChange={handleChange}
                  />

                </div>


                <div className="manage-form-group">

                  <label>
                    Option B
                  </label>

                  <input
                    type="text"
                    name="option_b"
                    placeholder="Enter option B"
                    value={
                      formData.option_b
                    }
                    onChange={handleChange}
                  />

                </div>


                <div className="manage-form-group">

                  <label>
                    Option C
                  </label>

                  <input
                    type="text"
                    name="option_c"
                    placeholder="Enter option C"
                    value={
                      formData.option_c
                    }
                    onChange={handleChange}
                  />

                </div>


                <div className="manage-form-group">

                  <label>
                    Option D
                  </label>

                  <input
                    type="text"
                    name="option_d"
                    placeholder="Enter option D"
                    value={
                      formData.option_d
                    }
                    onChange={handleChange}
                  />

                </div>

              </div>


              <div className="manage-form-group">

                <label>
                  Correct Answer
                </label>

                <select
                  name="correct_answer"
                  value={
                    formData.correct_answer
                  }
                  onChange={handleChange}
                >

                  <option value="">
                    Select correct option
                  </option>

                  <option value="A">
                    Option A
                  </option>

                  <option value="B">
                    Option B
                  </option>

                  <option value="C">
                    Option C
                  </option>

                  <option value="D">
                    Option D
                  </option>

                </select>

              </div>


              <div className="manage-form-group">

                <label>
                  Explanation
                  <span>
                    Optional
                  </span>
                </label>

                <textarea
                  name="explanation"
                  rows="3"
                  placeholder="Optional explanation for this question..."
                  value={
                    formData.explanation
                  }
                  onChange={handleChange}
                />

              </div>


              <button
                type="submit"
                className="manage-add-button"
                disabled={saving}
              >

                {saving
                  ? "Adding Question..."
                  : "Add Question"}

                {!saving && (
                  <span>+</span>
                )}

              </button>

            </form>

          </div>


          {/* EXISTING QUESTIONS */}

          <div className="manage-question-panel">

            <div className="manage-panel-header">

              <div>

                <span className="manage-eyebrow">
                  EXAMINATION CONTENT
                </span>

                <h3>
                  Existing Questions
                </h3>

              </div>

              <span className="manage-question-count">
                {questions.length}
              </span>

            </div>


            {questions.length === 0 ? (

              <div className="manage-empty-questions">

                <div className="manage-empty-icon">
                  Q
                </div>

                <h4>
                  No questions added yet
                </h4>

                <p>
                  Add the actual examination
                  questions using the form.
                </p>

              </div>

            ) : (

              <div className="manage-existing-list">

                {questions.map(
                  (question, index) => (

                    <div
                      className="manage-existing-question"
                      key={question.id}
                    >

                      <div className="manage-question-top">

                        <div className="manage-question-number">
                          Q{index + 1}
                        </div>

                        <button
                          type="button"
                          className="manage-delete-button"
                          onClick={() =>
                            handleDeleteQuestion(
                              question.id
                            )
                          }
                        >
                          Delete
                        </button>

                      </div>


                      <h4>
                        {question.question_text}
                      </h4>


                      <div className="manage-option-list">

                        <div>
                          <strong>A</strong>
                          <span>
                            {question.option_a}
                          </span>
                        </div>

                        <div>
                          <strong>B</strong>
                          <span>
                            {question.option_b}
                          </span>
                        </div>

                        <div>
                          <strong>C</strong>
                          <span>
                            {question.option_c}
                          </span>
                        </div>

                        <div>
                          <strong>D</strong>
                          <span>
                            {question.option_d}
                          </span>
                        </div>

                      </div>

                    </div>

                  )
                )}

              </div>

            )}

          </div>

        </section>

      </main>

    </div>
  );
}

export default ManageQuestions;