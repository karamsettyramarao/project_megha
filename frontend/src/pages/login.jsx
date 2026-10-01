import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";

function Login() {

  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [error, setError] = useState("");

  const [loading, setLoading] = useState(false);


  const handleChange = (event) => {

    setFormData({
      ...formData,
      [event.target.name]: event.target.value,
    });

  };


  const handleSubmit = async (event) => {

    event.preventDefault();

    setError("");


    if (
      !formData.name ||
      !formData.email ||
      !formData.password
    ) {

      setError(
        "Please enter your name, email and password."
      );

      return;

    }


    setLoading(true);


    try {

      const response = await api.post(
        "/auth/user/login",
        {
          name: formData.name,
          email: formData.email,
          password: formData.password,
        }
      );


      localStorage.setItem(
        "token",
        response.data.token
      );


      if (response.data.user) {

        localStorage.setItem(
          "user",
          JSON.stringify(response.data.user)
        );

      }


      navigate("/profile");


    } catch (error) {

      console.error(error);

      setError(
        error.response?.data?.message ||
        "Login failed. Please check your details."
      );

    } finally {

      setLoading(false);

    }

  };


  return (

    <div className="corporate-auth-page">


      {/* ================= LEFT SIDE ================= */}

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


          {/* HERO */}

          <div className="hero-main">

            <span className="hero-eyebrow">
              BUILD KNOWLEDGE • MEASURE PROGRESS
            </span>


            <h2>

              Learn today.

              <br />

              <span>
                Improve tomorrow.
              </span>

            </h2>


            <p className="hero-description">

              A focused learning platform designed
              to help students practice consistently,
              strengthen their skills, and track their
              progress through meaningful assessments.

            </p>

          </div>


          {/* QUOTES */}

          <div className="hero-quotes">


            <div className="quote-item">

              <span className="quote-mark">
                “
              </span>


              <div>

                <strong>
                  Inspire your learning.
                </strong>


                <p>
                  Every question is a step towards
                  better understanding.
                </p>

              </div>

            </div>


            <div className="quote-item">

              <span className="quote-mark">
                “
              </span>


              <div>

                <strong>
                  Improve your knowledge.
                </strong>


                <p>
                  Practice skills, measure progress,
                  and keep moving forward.
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



      {/* ================= RIGHT SIDE ================= */}

      <section className="auth-login-section">


        <div className="login-card">


          {/* HEADER */}

          <div className="login-header">

            <span className="login-eyebrow">
              STUDENT ACCESS
            </span>


            <h2>
              Welcome back
            </h2>


            <p>
              Sign in to continue your learning journey.
            </p>

          </div>



          {/* FORM */}

          <form onSubmit={handleSubmit}>


            {/* NAME */}

            <div className="corporate-form-group">

              <label htmlFor="name">
                Full Name
              </label>


              <input
                id="name"
                type="text"
                name="name"
                placeholder="Enter your registered name"
                value={formData.name}
                onChange={handleChange}
                autoComplete="name"
              />

            </div>



            {/* EMAIL */}

            <div className="corporate-form-group">

              <label htmlFor="email">
                Email Address
              </label>


              <input
                id="email"
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

              <label htmlFor="password">
                Password
              </label>


              <input
                id="password"
                type="password"
                name="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                autoComplete="current-password"
              />

            </div>



            {/* ERROR */}

            {error && (

              <div className="corporate-auth-error">

                {error}

              </div>

            )}



            {/* LOGIN */}

            <button
              type="submit"
              className="corporate-login-button"
              disabled={loading}
            >

              {loading
                ? "Signing in..."
                : "Sign In"
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



          {/* REGISTER */}

          <div className="create-account-section">

            <p>
              New to Quiz Portal?
            </p>


            <Link to="/register">

              Create an Account

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

export default Login;