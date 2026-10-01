import { useNavigate, useParams, useLocation } from "react-router-dom";

function Result() {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();

  const result = location.state;

  // ==========================================
  // NO RESULT DATA
  // ==========================================

  if (!result) {
    return (
      <div className="result-error">

        <h2>
          Result not available
        </h2>

        <p>
          Your result information could not be loaded.
        </p>

        <button
          type="button"
          onClick={() => navigate("/profile")}
        >
          Go to Profile
        </button>

      </div>
    );
  }


  // ==========================================
  // RESULT VALUES
  // ==========================================

  const totalQuestions =
    result.total_questions || 0;

  const correctAnswers =
    result.correct_answers || 0;

  const wrongAnswers =
    result.wrong_answers || 0;

  const skippedAnswers =
    result.skipped_answers || 0;

  const score =
    Number(result.score || 0);

  const timeTaken =
    result.time_taken_seconds || 0;


  // ==========================================
  // FORMAT TIME
  // ==========================================

  const minutes =
    Math.floor(timeTaken / 60);

  const seconds =
    timeTaken % 60;

  const formattedTime =
    `${String(minutes).padStart(2, "0")}:${String(
      seconds
    ).padStart(2, "0")}`;


  // ==========================================
  // RESULT UI
  // ==========================================

  return (
    <div className="result-page">

      <div className="result-container">


        {/* ====================================
            HEADER
        ==================================== */}

        <div className="result-header">

          <span className="result-label">
            TEST COMPLETED
          </span>

          <h1>
            Your Result
          </h1>

          <p>
            Here is your performance summary.
          </p>

        </div>



        {/* ====================================
            SCORE CARD
        ==================================== */}

        <div className="result-score-card">

          <span>
            Overall Score
          </span>

          <strong>
            {score.toFixed(2)}%
          </strong>

          <p>
            {correctAnswers} correct out of{" "}
            {totalQuestions}
          </p>

        </div>



        {/* ====================================
            STATISTICS
        ==================================== */}

        <div className="result-stats">


          {/* TOTAL QUESTIONS */}

          <div className="result-stat">

            <span>
              Total Questions
            </span>

            <strong>
              {totalQuestions}
            </strong>

          </div>



          {/* CORRECT */}

          <div className="result-stat">

            <span>
              Correct
            </span>

            <strong>
              {correctAnswers}
            </strong>

          </div>



          {/* WRONG */}

          <div className="result-stat">

            <span>
              Wrong
            </span>

            <strong>
              {wrongAnswers}
            </strong>

          </div>



          {/* SKIPPED */}

          <div className="result-stat">

            <span>
              Skipped
            </span>

            <strong>
              {skippedAnswers}
            </strong>

          </div>



          {/* TIME TAKEN */}

          <div className="result-stat">

            <span>
              Time Taken
            </span>

            <strong>
              {formattedTime}
            </strong>

          </div>

        </div>



        {/* ====================================
            ACTION BUTTONS
        ==================================== */}

        <div className="result-actions">


          {/* LEADERBOARD */}

          <button
            type="button"
            className="result-primary-button"
            onClick={() =>
              navigate(`/leaderboard/${id}`)
            }
          >
            View Leaderboard
          </button>



          {/* PROFILE */}

          <button
            type="button"
            className="result-secondary-button"
            onClick={() =>
              navigate("/profile")
            }
          >
            View Profile
          </button>



          {/* HOME */}

          <button
            type="button"
            className="result-secondary-button"
            onClick={() =>
              navigate("/")
            }
          >
            Back to Home
          </button>

        </div>


      </div>

    </div>
  );
}

export default Result;