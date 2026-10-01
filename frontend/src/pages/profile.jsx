import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

function Profile() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [exam, setExam] = useState(null);

  const [loading, setLoading] = useState(true);
  const [examLoading, setExamLoading] = useState(true);

  const [error, setError] = useState("");

  const [profileMenuOpen, setProfileMenuOpen] =
    useState(false);


  useEffect(() => {
    const token = localStorage.getItem("token");

    const storedUser =
      localStorage.getItem("user");

    if (!token) {
      navigate("/");
      return;
    }


    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem("user");
      }
    }


    const fetchProfile = async () => {

      try {

        const response = await api.get(
          "/user/profile",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setProfile(
          response.data.profile
        );


        if (response.data.profile) {

          const updatedUser = {
            id: response.data.profile.id,
            name: response.data.profile.name,
            email: response.data.profile.email,
          };

          setUser(updatedUser);

          localStorage.setItem(
            "user",
            JSON.stringify(updatedUser)
          );
        }

      } catch (error) {

        console.error(error);

        if (
          error.response?.status === 401
        ) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");

          navigate("/");
        }

      } finally {

        setLoading(false);

      }
    };


    const fetchActiveExam = async () => {

      try {

        const response = await api.get(
          "/exams/active",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setExam(
          response.data.exam || null
        );

      } catch (error) {

        if (
          error.response?.status === 404
        ) {
          setExam(null);
        } else {
          console.error(error);
          setError(
            error.response?.data?.message ||
            "Unable to load examination details."
          );
        }

      } finally {

        setExamLoading(false);

      }
    };


    fetchProfile();
    fetchActiveExam();

  }, [navigate]);


  const handleLogout = () => {

    localStorage.removeItem("token");
    localStorage.removeItem("user");

    navigate("/");

  };


  const getInitials = (name) => {

    if (!name) {
      return "U";
    }

    const parts =
      name.trim().split(" ");

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


  const formatDateTime = (value) => {

    if (!value) {
      return "—";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleString(
      "en-IN",
      {
        dateStyle: "medium",
        timeStyle: "short",
      }
    );

  };


  if (loading) {

    return (
      <div className="dashboard-loading">

        <div className="loading-spinner"></div>

        <p>
          Loading your dashboard...
        </p>

      </div>
    );

  }


  const displayName =
    user?.name ||
    profile?.name ||
    "Student";


  return (
    <div className="dashboard-page">


      {/* =================================================
          HEADER
      ================================================= */}

      <header className="dashboard-header">

        <div className="dashboard-header-inner">


          {/* BRAND */}

          <div className="dashboard-brand">

            <div className="dashboard-logo">
              Q
            </div>

            <div>

              <h1>
                Quiz Portal
              </h1>

              <span>
                Learn • Practice • Improve
              </span>

            </div>

          </div>


          {/* RIGHT SIDE */}

          <div className="dashboard-header-right">


            <button
              type="button"
              className="profile-menu-button"
              onClick={() =>
                setProfileMenuOpen(
                  !profileMenuOpen
                )
              }
            >

              <span className="profile-avatar">
                {getInitials(displayName)}
              </span>


              <span className="profile-name">
                {displayName}
              </span>


              <span className="profile-arrow">
                {profileMenuOpen ? "▲" : "▼"}
              </span>

            </button>


            {profileMenuOpen && (

              <div className="profile-dropdown">

                <div className="dropdown-user">

                  <div className="dropdown-avatar">
                    {getInitials(displayName)}
                  </div>

                  <div>

                    <strong>
                      {displayName}
                    </strong>

                    <span>
                      {user?.email ||
                        profile?.email ||
                        ""}
                    </span>

                  </div>

                </div>


                <div className="dropdown-divider"></div>


                <button
                  type="button"
                  onClick={() =>
                    navigate("/profile")
                  }
                >
                  My Profile
                </button>


                <button
                  type="button"
                  className="logout-option"
                  onClick={handleLogout}
                >
                  Sign Out
                </button>

              </div>

            )}

          </div>

        </div>

      </header>



      {/* =================================================
          MAIN
      ================================================= */}

      <main className="dashboard-main">


        {/* WELCOME */}

        <section className="welcome-section">

          <div>

            <span className="section-eyebrow">
              STUDENT DASHBOARD
            </span>

            <h2>
              Welcome back,{" "}
              <span>
                {displayName}
              </span>
            </h2>

            <p>
              Check the current examination
              and continue your learning journey.
            </p>

          </div>


          <div className="welcome-date">

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

          <div className="dashboard-error">
            {error}
          </div>

        )}



        {/* =================================================
            CURRENT EXAM
        ================================================= */}

        <section className="current-exam-section">

          <div className="section-heading">

            <div>

              <span className="section-eyebrow">
                ASSESSMENT
              </span>

              <h3>
                Current Examination
              </h3>

            </div>

          </div>


          {examLoading ? (

            <div className="exam-loading-card">

              <div className="small-spinner"></div>

              <span>
                Checking for active examinations...
              </span>

            </div>

          ) : exam ? (

            <div className="exam-card">


              {/* EXAM CARD TOP */}

              <div className="exam-card-top">

                <div className="exam-card-title">

                  <div className="exam-icon">
                    Q
                  </div>

                  <div>

                    <div className="active-badge">

                      <span></span>

                      ACTIVE

                    </div>

                    <h4>
                      {exam.title}
                    </h4>

                    <p>
                      {exam.topic ||
                        "General Assessment"}
                    </p>

                  </div>

                </div>


                <div className="exam-duration">

                  <span>
                    TEST DURATION
                  </span>

                  <strong>
                    {exam.duration_minutes}
                    <small>
                      min
                    </small>
                  </strong>

                </div>

              </div>



              {/* EXAM DETAILS */}

              <div className="exam-details">

                <div className="exam-detail">

                  <span>
                    START TIME
                  </span>

                  <strong>
                    {formatDateTime(
                      exam.start_time
                    )}
                  </strong>

                </div>


                <div className="exam-detail">

                  <span>
                    END TIME
                  </span>

                  <strong>
                    {formatDateTime(
                      exam.end_time
                    )}
                  </strong>

                </div>


                <div className="exam-detail">

                  <span>
                    TOPIC
                  </span>

                  <strong>
                    {exam.topic ||
                      "General"}
                  </strong>

                </div>

              </div>



              {/* EXAM FOOTER */}

              <div className="exam-card-footer">

                <div className="exam-note">

                  <span>
                    ✓
                  </span>

                  <p>
                    Read the examination rules
                    carefully before starting.
                  </p>

                </div>


                <button
                  type="button"
                  className="view-rules-button"
                  onClick={() =>
                    navigate(
                      `/rules/${exam.id}`
                    )
                  }
                >
                  View Examination Rules
                  <span>
                    →
                  </span>
                </button>

              </div>

            </div>

          ) : (

            <div className="no-exam-card">

              <div className="no-exam-icon">
                —
              </div>

              <h4>
                No Active Examination
              </h4>

              <p>
                There is currently no active
                examination. Please check again later.
              </p>

            </div>

          )}

        </section>



        {/* =================================================
            QUICK INFORMATION
        ================================================= */}

        <section className="quick-info-section">

          <div className="info-card">

            <div className="info-icon">
              ✓
            </div>

            <div>

              <span>
                PREPARE
              </span>

              <strong>
                Read Before You Begin
              </strong>

              <p>
                Review the exam rules and instructions
                before starting your assessment.
              </p>

            </div>

          </div>


          <div className="info-card">

            <div className="info-icon blue">
              ◷
            </div>

            <div>

              <span>
                FOCUS
              </span>

              <strong>
                Manage Your Time
              </strong>

              <p>
                Use the available examination time
                carefully and answer every question.
              </p>

            </div>

          </div>


          <div className="info-card">

            <div className="info-icon purple">
              ↗
            </div>

            <div>

              <span>
                PROGRESS
              </span>

              <strong>
                Track Your Performance
              </strong>

              <p>
                Review your results and improve your
                knowledge through regular practice.
              </p>

            </div>

          </div>

        </section>


      </main>



      {/* FOOTER */}

      <footer className="dashboard-footer">

        <span>
          Quiz Portal
        </span>

        <span>
          Learn consistently. Perform confidently.
        </span>

        <span>
          by Meghanjani
        </span>

      </footer>


    </div>
  );
}

export default Profile;