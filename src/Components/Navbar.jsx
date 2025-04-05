import React from "react";
import { Link, useNavigate } from "react-router-dom"; // useNavigate for redirection
import { useAuth } from "../context/Authcontext"; // Using the context API

const Navbar = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate(); // Hook for redirection

  // Handle logout and redirect to home page
  const handleLogout = async () => {
    try {
      await logout(); // Call the logout function from the context
      navigate("/"); // Redirect to home page after successful logout
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-light"  style={{ background: "linear-gradient(90deg, #99BC85, #6F9B61)" }}>
      <div className="container-fluid">
        {/* Logo */}
        <Link className="navbar-brand text-uppercase fw-bold" to="/" style={{ fontSize: "1.8rem", color: "#fff" }}>
          Logo
        </Link>

        {/* Navbar toggler for smaller screens */}
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        {/* Navbar links */}
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav ms-auto d-flex justify-content-center align-items-center">
            <li className="nav-item">
              <Link className="nav-link text-uppercase fw-bold" to="/" style={{ color: "#fff" }}>
                Home
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link text-uppercase fw-bold" to="/products" style={{ color: "#fff" }}>
                Products
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link text-uppercase fw-bold" to="/about" style={{ color: "#fff" }}>
                About
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link text-uppercase fw-bold" to="/contact" style={{ color: "#fff" }}>
                Contact
              </Link>
            </li>
            <li className="nav-item">
              {currentUser ? (
                <>
                  <button
                    className="nav-link text-uppercase fw-bold btn btn-link text-dark"
                    onClick={handleLogout}
                    style={{ fontSize: "1.1rem" }}
                  >
                    <i className="bi bi-box-arrow-right"></i> Logout
                  </button>
                </>
              ) : (
                <>
                  <div className="d-flex">
                    <Link
                      className="nav-link text-uppercase fw-bold btn btn-outline-light me-3"
                      to="/login"
                      style={{ fontSize: "1.1rem" }}
                    >
                      <i className="bi bi-person-fill"></i> Login
                    </Link>
                    <Link
                      className="nav-link text-uppercase fw-bold btn btn-light"
                      to="/register"
                      style={{ fontSize: "1.1rem" }}
                    >
                      <i className="bi bi-person-plus-fill"></i> Sign Up
                    </Link>
                  </div>
                </>
              )}
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
