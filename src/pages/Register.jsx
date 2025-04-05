import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/Authcontext";

const Register = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [selectedRole, setSelectedRole] = useState("user"); // Default role
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Form validation
    if (!formData.name || !formData.email || !formData.password) {
      setErrorMessage("Please fill in all required fields");
      return;
    }

    if (formData.password.length < 6) {
      setErrorMessage("Password must be at least 6 characters");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setErrorMessage("Passwords do not match");
      return;
    }

    try {
      setErrorMessage("");
      setLoading(true);
      // Pass selectedRole to register function
      await register(formData.email, formData.password, formData.name, selectedRole);
      navigate("/"); // Redirect to home page after successful registration
    } catch (error) {
      console.error("Registration error:", error);
      setErrorMessage(
        error.code === "auth/email-already-in-use"
          ? "An account with this email already exists"
          : "Failed to create an account. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-6 col-lg-5">
          <div className="card shadow">
            <div className="card-body p-5">
              <div className="text-center mb-4">
                <h2 className="fw-bold mb-0">Create Account</h2>
                <p className="text-muted">Join ShopSavvy to start shopping</p>
              </div>

              {errorMessage && (
                <div className="alert alert-danger" role="alert">
                  {errorMessage}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="name" className="form-label">
                    Full Name
                  </label>
                  <input
                    type="text"
                    className="form-control form-control-lg"
                    id="name"
                    name="name"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label htmlFor="email" className="form-label">
                    Email Address
                  </label>
                  <input
                    type="email"
                    className="form-control form-control-lg"
                    id="email"
                    name="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label htmlFor="password" className="form-label">
                    Password
                  </label>
                  <input
                    type="password"
                    className="form-control form-control-lg"
                    id="password"
                    name="password"
                    placeholder="Create a password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    minLength="6"
                  />
                  <small className="form-text text-muted">
                    Password must be at least 6 characters
                  </small>
                </div>

                <div className="mb-4">
                  <label htmlFor="confirmPassword" className="form-label">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    className="form-control form-control-lg"
                    id="confirmPassword"
                    name="confirmPassword"
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                  />
                </div>

                {/* Radio buttons for selecting role */}
                <div className="mb-4">
                  <label className="form-label">Register as:</label>
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
                      <label className="form-check-label" htmlFor="roleUser">
                        User
                      </label>
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
                      <label className="form-check-label" htmlFor="roleAdmin">
                        Admin
                      </label>
                    </div>
                  </div>
                </div>

                <div className="d-grid">
                  <button
                    type="submit"
                    className="btn btn-primary btn-lg"
                    disabled={loading}
                  >
                    {loading ? (
                      <div className="spinner-border spinner-border-sm" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    ) : (
                      "Create Account"
                    )}
                  </button>
                </div>
              </form>

              <div className="text-center mt-4">
                <p className="mb-0">
                  Already have an account?{" "}
                  <Link to="/login" className="text-decoration-none fw-semibold">
                    Sign In
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

export default Register;
