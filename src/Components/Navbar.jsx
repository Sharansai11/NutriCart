import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom"; // For navigation links

const Navbar = () => {
  const [user, setUser] = useState(null); // State to manage signed-in user

  useEffect(() => {
    // Check if a user is logged in by fetching from localStorage or a mock service
    const loggedInUser = localStorage.getItem("user"); // Example of mocked login
    if (loggedInUser) {
      setUser(JSON.parse(loggedInUser)); // Set user state if logged in
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user"); // Remove user from localStorage
    setUser(null); // Update user state to null
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-light">
      <div className="container-fluid">
        <Link className="navbar-brand" to="/">ShopWise</Link>
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
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav ms-auto">
            <li className="nav-item">
              <Link className="nav-link active" to="/">Home</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/products">Products</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/about">About</Link>
            </li>
        
            <li className="nav-item">
              {user ? (
                <button className="btn btn-link nav-link" onClick={handleLogout}>Logout</button>
              ) : (
                <>
                  <Link className="nav-link" to="/login">Login</Link>
                  <Link className="nav-link" to="/signup">Sign Up</Link>
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
