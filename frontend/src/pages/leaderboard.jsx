import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";

function Leaderboard() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          navigate("/");
          return;
        }

        const response = await api.get(
          `/leaderboard/${id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setLeaderboard(
          response.data.leaderboard || []
        );

      } catch (error) {
        console.error(
          "Leaderboard error:",
          error
        );

        setError(
          error.response?.data?.message ||
          "Failed to load leaderboard."
        );

      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [id, navigate]);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    return `${String(minutes).padStart(2, "0")}:${String(
      remainingSeconds
    ).padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="leaderboard-page">
        <div className="leaderboard-message">
          Loading leaderboard...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="leaderboard-page">
        <div className="leaderboard-message">
          <h2>Leaderboard unavailable</h2>
          <p>{error}</p>

          <button
            type="button"
            onClick={() => navigate(`/result/${id}`)}
          >
            Back to Result
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="leaderboard-page">

      <div className="leaderboard-container">

        <div className="leaderboard-header">

          <span className="leaderboard-label">
            PERFORMANCE
          </span>

          <h1>
            Leaderboard
          </h1>

          <p>
            See how participants performed in this test.
          </p>

        </div>


        {leaderboard.length === 0 ? (

          <div className="leaderboard-empty">
            <h2>No results yet</h2>
            <p>
              The leaderboard will appear after students
              submit the test.
            </p>
          </div>

        ) : (

          <div className="leaderboard-card">

            <div className="leaderboard-table-header">
              <span>Rank</span>
              <span>Student</span>
              <span>Score</span>
              <span>Correct</span>
              <span>Wrong</span>
              <span>Time</span>
            </div>


            {leaderboard.map((student) => (

              <div
                className="leaderboard-row"
                key={student.user_id}
              >

                <div className="rank-cell">
                  #{student.rank}
                </div>


                <div className="student-cell">
                  {student.name}
                </div>


                <div className="score-cell">
                  {Number(student.score).toFixed(2)}%
                </div>


                <div className="correct-cell">
                  {student.correct_answers}
                </div>


                <div className="wrong-cell">
                  {student.wrong_answers}
                </div>


                <div className="time-cell">
                  {formatTime(
                    student.time_taken_seconds
                  )}
                </div>

              </div>

            ))}

          </div>

        )}


        <div className="leaderboard-actions">

          <button
            type="button"
            className="leaderboard-primary-button"
            onClick={() =>
              navigate(`/result/${id}`)
            }
          >
            Back to Result
          </button>


          <button
            type="button"
            className="leaderboard-secondary-button"
            onClick={() =>
              navigate("/profile")
            }
          >
            View Profile
          </button>

        </div>

      </div>

    </div>
  );
}

export default Leaderboard;