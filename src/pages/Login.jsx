import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/Authcontext";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState("user"); // Default role is "user"
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const { login, setError } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      setErrorMessage("Please fill in all fields");
      return;
    }

    try {
      setErrorMessage("");
      setLoading(true);
      await login(email, password, selectedRole);

      // Redirect based on the selected role
      if (selectedRole === "user") {
        navigate("/user-dashboard"); // Redirect to the user dashboard
      } else if (selectedRole === "admin") {
        navigate("/admin"); // Redirect to the admin dashboard
      }
    } catch (error) {
      console.error("Login error:", error);
      setErrorMessage(
        error.code === "auth/user-not-found"
          ? "No account found with this email"
          : error.code === "auth/wrong-password"
          ? "Incorrect password"
          : error.message || "Failed to log in. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-6 col-lg-5">
          <div className="card shadow-lg border-light rounded">
            <div className="card-body p-5">
              <div className="text-center mb-4">
                <h2 className="fw-bold mb-0" style={{ color: "#99BC85" }}>Welcome Back</h2>
                <p className="text-muted">Sign in to continue shopping</p>
              </div>

              {errorMessage && (
                <div className="alert alert-danger" role="alert">
                  {errorMessage}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="email" className="form-label">Email Address</label>
                  <input
                    type="email"
                    className="form-control form-control-lg"
                    id="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="mb-4">
                  <div className="d-flex justify-content-between align-items-center">
                    <label htmlFor="password" className="form-label">Password</label>
                    <Link to="/forgot-password" className="text-decoration-none small">Forgot password?</Link>
                  </div>
                  <input
                    type="password"
                    className="form-control form-control-lg"
                    id="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                {/* Radio Buttons for selecting role */}
                <div className="mb-4">
                  <label className="form-label">Login as:</label>
                  <div>
                    <div className="form-check form-check-inline">
                      <input
                        type="radio"
                        id="roleUser"
                        name="role"
                        className="form-check-input"
                        value="user"
                        checked={selectedRole === "user"}
                        onChange={(e) => setSelectedRole(e.target.value)}
                      />
                      <label className="form-check-label" htmlFor="roleUser">User</label>
                    </div>
                    <div className="form-check form-check-inline">
                      <input
                        type="radio"
                        id="roleAdmin"
                        name="role"
                        className="form-check-input"
                        value="admin"
                        checked={selectedRole === "admin"}
                        onChange={(e) => setSelectedRole(e.target.value)}
                      />
                      <label className="form-check-label" htmlFor="roleAdmin">Admin</label>
                    </div>
                  </div>
                </div>

                <div className="d-grid">
                  <button
                    type="submit"
                    className="btn btn-primary btn-lg"
                    disabled={loading}
                    style={{
                      background: "#99BC85", 
                      borderColor: "#6F9B61",
                      fontSize: "1.1rem",
                    }}
                  >
                    {loading ? (
                      <div className="spinner-border spinner-border-sm" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    ) : (
                      "Sign In"
                    )}
                  </button>
                </div>
              </form>

              <div className="text-center mt-4">
                <p className="mb-0">
                  Don't have an account?{" "}
                  <Link to="/register" className="text-decoration-none fw-semibold" style={{ color: "#99BC85" }}>
                    Create Account
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
