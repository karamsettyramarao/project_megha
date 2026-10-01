import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";

function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);


  // ==========================================
  // HANDLE INPUT
  // ==========================================

  const handleChange = (event) => {
    setFormData({
      ...formData,
      [event.target.name]: event.target.value,
    });
  };


  // ==========================================
  // HANDLE REGISTER
  // ==========================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");


    if (
      !formData.name ||
      !formData.email ||
      !formData.password ||
      !formData.confirmPassword
    ) {
      setError("Please fill in all fields.");
      return;
    }


    if (formData.password.length < 6) {
      setError(
        "Password must contain at least 6 characters."
      );
      return;
    }


    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }


    setLoading(true);


    try {
      await api.post(
        "/auth/user/register",
        {
          name: formData.name,
          email: formData.email,
          password: formData.password,
        }
      );


      alert(
        "Registration successful. Please login."
      );


      navigate("/");


    } catch (error) {

      console.error(error);

      setError(
        error.response?.data?.message ||
        "Registration failed. Please try again."
      );

    } finally {

      setLoading(false);

    }
  };


  // ==========================================
  // UI
  // ==========================================

  return (
    <div className="corporate-auth-page">


      {/* ======================================
          LEFT SIDE
      ====================================== */}

      <section className="auth-hero">

        <div className="hero-content">


          {/* BRAND */}

          <div className="hero-brand">

            <div className="hero-logo">
              Q
            </div>


            <div className="hero-brand-info">

              <h1>
                Quiz Portal
              </h1>


              <div className="hero-brand-subtitle">

                <span>
                  by Meghanjani
                </span>

                <i>
                  •
                </i>

                <span>
                  Learn • Practice • Improve
                </span>

              </div>

            </div>

          </div>



          {/* HERO CONTENT */}

          <div className="hero-main">

            <span className="hero-eyebrow">
              START YOUR LEARNING JOURNEY
            </span>


            <h2>

              Learn today.

              <br />

              <span>
                Improve tomorrow.
              </span>

            </h2>


            <p className="hero-description">

              Create your account and start practicing
              through focused assessments designed to
              strengthen your knowledge and track your
              progress.

            </p>

          </div>



          {/* BENEFITS */}

          <div className="hero-quotes">


            <div className="quote-item">

              <span className="quote-mark">
                “
              </span>


              <div>

                <strong>
                  Build your knowledge.
                </strong>


                <p>
                  Practice consistently and strengthen
                  your understanding step by step.
                </p>

              </div>

            </div>



            <div className="quote-item">

              <span className="quote-mark">
                “
              </span>


              <div>

                <strong>
                  Track your progress.
                </strong>


                <p>
                  Measure your performance and keep
                  improving with every assessment.
                </p>

              </div>

            </div>


          </div>



          {/* FOOTER */}

          <div className="hero-footer">

            <span>
              Learn consistently. Perform confidently.
            </span>

          </div>


        </div>

      </section>



      {/* ======================================
          RIGHT SIDE
      ====================================== */}

      <section className="auth-login-section">


        <div className="login-card">


          {/* HEADER */}

          <div className="login-header">

            <span className="login-eyebrow">
              STUDENT REGISTRATION
            </span>


            <h2>
              Create your account
            </h2>


            <p>
              Join Quiz Portal and start your learning journey.
            </p>

          </div>



          {/* FORM */}

          <form onSubmit={handleSubmit}>


            {/* FULL NAME */}

            <div className="corporate-form-group">

              <label htmlFor="register-name">
                Full Name
              </label>


              <input
                id="register-name"
                type="text"
                name="name"
                placeholder="Enter your full name"
                value={formData.name}
                onChange={handleChange}
                autoComplete="name"
              />

            </div>



            {/* EMAIL */}

            <div className="corporate-form-group">

              <label htmlFor="register-email">
                Email Address
              </label>


              <input
                id="register-email"
                type="email"
                name="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
                autoComplete="email"
              />

            </div>



            {/* PASSWORD */}

            <div className="corporate-form-group">

              <label htmlFor="register-password">
                Password
              </label>


              <input
                id="register-password"
                type="password"
                name="password"
                placeholder="Create a password"
                value={formData.password}
                onChange={handleChange}
                autoComplete="new-password"
              />

            </div>



            {/* CONFIRM PASSWORD */}

            <div className="corporate-form-group">

              <label htmlFor="register-confirm-password">
                Confirm Password
              </label>


              <input
                id="register-confirm-password"
                type="password"
                name="confirmPassword"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={handleChange}
                autoComplete="new-password"
              />

            </div>



            {/* ERROR */}

            {error && (

              <div className="corporate-auth-error">

                {error}

              </div>

            )}



            {/* REGISTER BUTTON */}

            <button
              type="submit"
              className="corporate-login-button"
              disabled={loading}
            >

              {loading
                ? "Creating Account..."
                : "Create Account"
              }


              {!loading && (

                <span>
                  →
                </span>

              )}

            </button>


          </form>



          {/* DIVIDER */}

          <div className="login-divider">

            <span></span>

            <small>
              OR
            </small>

            <span></span>

          </div>



          {/* LOGIN */}

          <div className="create-account-section">

            <p>
              Already have an account?
            </p>


            <Link to="/">

              Sign In

              <span>
                →
              </span>

            </Link>

          </div>



          {/* SECURITY */}

          <div className="login-security">

            <span>
              ✓
            </span>


            <p>
              Your account information is securely
              protected.
            </p>

          </div>


        </div>

      </section>


    </div>
  );
}

export default Register;