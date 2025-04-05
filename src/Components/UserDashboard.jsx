import React from "react";
import { Link } from "react-router-dom";

const UserDashboard = () => {
  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-8 col-lg-6">
          <div className="card shadow-lg">
            <div className="card-header bg-success text-white">
              <h4 className="mb-0">Welcome, User</h4>
            </div>
            <div className="card-body">
              <h5>Your Account Overview</h5>
              <ul>
                <li>
                  <Link to="/user-profile">View Profile</Link>
                </li>
                <li>
                  <Link to="/my-orders">My Orders</Link>
                </li>
                <li>
                  <Link to="/wishlist">My Wishlist</Link>
                </li>
                <li>
                  <Link to="/cart">View Cart</Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
