import React from "react";
import { Link } from "react-router-dom"; // Import Link for routing

function AdminDashboard() {
  return (
    <div className="container mt-5">
      <h2 className="text-center mb-4">Admin Dashboard</h2>

      <div className="row">
        {/* Card 1 - View Products */}
        <div className="col-md-4 mb-4">
          <div className="card shadow-sm">
            <div className="card-body text-center">
              <h5 className="card-title">Products</h5>
              <p className="card-text">Manage all the products in the store</p>
              <Link to="my-products" className="btn btn-primary">
                View Products
              </Link>
            </div>
          </div>
        </div>

        {/* Card 2 - View Orders */}
        <div className="col-md-4 mb-4">
          <div className="card shadow-sm">
            <div className="card-body text-center">
              <h5 className="card-title">Orders</h5>
              <p className="card-text">View and manage customer orders</p>
              <Link to="orders" className="btn btn-primary">
                View Orders
              </Link>
            </div>
          </div>
        </div>

        {/* Card 3 - View Settings */}
        <div className="col-md-4 mb-4">
          <div className="card shadow-sm">
            <div className="card-body text-center">
              <h5 className="card-title">Settings</h5>
              <p className="card-text">Manage site settings and configurations</p>
              <Link to="settings" className="btn btn-primary">
                Go to Settings
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Section */}
      <footer className="mt-5 text-center">
        <p>Admin Dashboard</p>
      </footer>
    </div>
  );
}

export default AdminDashboard;
