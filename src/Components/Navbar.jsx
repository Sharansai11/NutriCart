import React from "react";
import { Link, useNavigate } from "react-router-dom"; // useNavigate for redirection
import { useAuth } from "../context/Authcontext"; // Using the context API

const Navbar = () => {
  const { currentUser, logout, userRole } = useAuth(); // Using userRole to determine the role
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
    <nav
  className="navbar navbar-expand-lg navbar-dark"
  style={{ backgroundColor: "#1F2937", padding: "0.8rem 1rem" }} // charcoal background
>
      <div className="container-fluid">
        {/* Logo */}
        <Link className="navbar-brand text-uppercase fw-bold" to="/" style={{ fontSize: "1.8rem", color: "#fff" }}>
        NutriCart
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
              <Link className="nav-link text-uppercase fw-bold" to="/about" style={{ color: "#fff" }}>
                About Us
              </Link>
            </li>

            {currentUser && userRole === "user" && (
              <li className="nav-item">
                <Link
                  className="nav-link text-uppercase fw-bold"
                  to="/user-dashboard"
                  style={{ color: "#fff" }}
                >
                  User Dashboard
                </Link>
              </li>
            )}

            {currentUser && userRole === "admin" && (

              <ul className="navbar-nav">
              <li className="nav-item">
                <Link
                  className="nav-link text-uppercase fw-bold"
                  to="/admin"
                  style={{ color: "#fff" }}
                >
                  Admin Dashboard
                </Link>
              </li>
              <li className="nav-item">
                <Link
                  className="nav-link text-uppercase fw-bold"
                  to="/admin/my-products"
                  style={{ color: "#fff" }}
                >
                 Products
                </Link>
              </li>
              <li className="nav-item">
                <Link
                  className="nav-link text-uppercase fw-bold"
                  to="/admin/orders"
                  style={{ color: "#fff" }}
                >
                  Orders
                </Link>
              </li>
</ul>
              
              
            )}

            <li className="nav-item">
              {currentUser ? (
                <>
                 <button
  className="nav-link text-uppercase fw-bold btn btn-link text-white"
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
