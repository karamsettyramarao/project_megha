import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

function AdminLogin() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const adminToken = localStorage.getItem("adminToken");

    if (adminToken) {
      navigate("/admin/dashboard", {
        replace: true,
      });
    }
  }, [navigate]);

  const handleChange = (event) => {
    setFormData({
      ...formData,
      [event.target.name]: event.target.value,
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");

    if (!formData.email || !formData.password) {
      setError("Please enter your email and password.");
      return;
    }

    setLoading(true);

    try {
      const response = await api.post(
        "/auth/admin/login",
        {
          email: formData.email,
          password: formData.password,
        }
      );

      localStorage.setItem(
        "adminToken",
        response.data.token
      );

      if (response.data.admin) {
        localStorage.setItem(
          "admin",
          JSON.stringify(response.data.admin)
        );
      }

      navigate("/admin/dashboard", {
        replace: true,
      });

    } catch (error) {
      console.error(error);

      setError(
        error.response?.data?.message ||
          "Invalid administrator credentials."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-auth-page">

      <section className="admin-auth-hero">

        <div className="admin-auth-hero-content">

          <div className="admin-brand">
            <div className="admin-brand-logo">
              Q
            </div>

            <div>
              <h1>Quiz Portal</h1>
              <span>
                Administration Console
              </span>
            </div>
          </div>

          <div className="admin-hero-main">

            <span className="admin-eyebrow">
              SECURE ADMINISTRATION
            </span>

            <h2>
              Manage.
              <br />
              <span>Monitor. Improve.</span>
            </h2>

            <p>
              Manage examinations, schedule assessments,
              monitor participation, and review leaderboard
              performance from one secure administration portal.
            </p>

          </div>

          <div className="admin-security-note">

            <div className="admin-security-icon">
              ✓
            </div>

            <div>
              <strong>
                Restricted Access
              </strong>

              <p>
                This portal is available only to
                authorized administrators.
              </p>
            </div>

          </div>

          <div className="admin-auth-footer">
            <span>
              Quiz Portal
            </span>

            <span>
              by Meghanjani
            </span>
          </div>

        </div>

      </section>

      <section className="admin-login-section">

        <div className="admin-login-card">

          <div className="admin-login-header">

            <span className="admin-login-label">
              ADMINISTRATOR ACCESS
            </span>

            <h2>
              Welcome back
            </h2>

            <p>
              Sign in to access the administration dashboard.
            </p>

          </div>

          <form onSubmit={handleSubmit}>

            <div className="admin-form-group">

              <label htmlFor="admin-email">
                Email Address
              </label>

              <input
                id="admin-email"
                type="email"
                name="email"
                placeholder="Enter administrator email"
                value={formData.email}
                onChange={handleChange}
                autoComplete="email"
              />

            </div>

            <div className="admin-form-group">

              <label htmlFor="admin-password">
                Password
              </label>

              <input
                id="admin-password"
                type="password"
                name="password"
                placeholder="Enter administrator password"
                value={formData.password}
                onChange={handleChange}
                autoComplete="current-password"
              />

            </div>

            {error && (
              <div className="admin-login-error">
                <span>!</span>
                {error}
              </div>
            )}

            <button
              type="submit"
              className="admin-login-button"
              disabled={loading}
            >
              {loading
                ? "Signing in..."
                : "Sign In to Admin Portal"}

              {!loading && (
                <span>→</span>
              )}
            </button>

          </form>

          <div className="admin-login-divider">
            <span></span>
            <small>AUTHORIZED PERSONNEL ONLY</small>
            <span></span>
          </div>

          <div className="admin-login-info">

            <div className="admin-info-icon">
              🔒
            </div>

            <p>
              Your administrator credentials are
              securely verified before dashboard access
              is granted.
            </p>

          </div>

        </div>

      </section>

    </div>
  );
}

export default AdminLogin;