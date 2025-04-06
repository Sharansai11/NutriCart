import React from 'react';
import { BarChart, LineChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Bell, ShoppingBag, Users, TrendingUp, CreditCard } from 'lucide-react';
import { Link } from 'react-router-dom';

const salesData = [
  { name: 'Jan', sales: 4000, profit: 2400 },
  { name: 'Feb', sales: 3000, profit: 1398 },
  { name: 'Mar', sales: 9800, profit: 2000 },
  { name: 'Apr', sales: 3908, profit: 2780 },
  { name: 'May', sales: 4800, profit: 1890 },
  { name: 'Jun', sales: 3800, profit: 2390 },
];

const AdminDashboard = () => {
  return (
    <div className="min-vh-100 bg-light">
      {/* Main Content */}
      <main className="container py-5">
        <div className="row mb-4">
          <div className="col-12">
            <h2 className="text-dark">Admin Dashboard</h2>
            <p className="text-muted">Manage your smart shop operations and analytics</p>
          </div>
        </div>
        <div className="d-flex justify-content-between mb-3 gap-3">
  <div className="col">
    <Link to="/admin/products" className="btn  btn-primary w-100 btn-sm">View Products</Link>
  </div>
  <div className="col">
    <Link to="/admin/orders" className="btn btn-warning w-100 btn-sm">View Orders</Link>
  </div>
</div>

        {/* Stats Overview */}
        <div className="row row-cols-1 row-cols-md-4 g-4 mb-4">
          <div className="col">
            <div className="card shadow border-0 rounded">
              <div className="card-body text-center">
                <h5 className="card-title text-primary">Products</h5>
                <p className="h4 text-dark">Manage your products</p>
                <div className="h-12 w-12 mx-auto mb-2  rounded-circle d-flex justify-content-center align-items-center">
                  <ShoppingBag size={24} />
                </div>
               
              </div>
            </div>
          </div>

          <div className="col">
            <div className="card shadow border-0 rounded">
              <div className="card-body text-center">
                <h5 className="card-title text-warning">Orders</h5>
                <p className="h4 text-dark">Manage customer orders</p>
                <div className="h-12 w-12 mx-auto mb-2   d-flex justify-content-center align-items-center">
                  <ShoppingBag size={24} />
                </div>
               
              </div>
            </div>
          </div>

          <div className="col">
            <div className="card shadow border-0 rounded">
              <div className="card-body text-center">
                <h5 className="card-title text-success">Avg. Price</h5>
                <p className="h4 text-dark">$86.42</p>
                <div className="h-12 w-12 mx-auto mb-2  rounded-circle d-flex justify-content-center align-items-center">
                  <CreditCard size={24} />
                </div>
                <span className="text-danger">-0.8% from last month</span>
              </div>
            </div>
          </div>

          <div className="col">
            <div className="card shadow border-0 rounded">
              <div className="card-body text-center">
                <h5 className="card-title text-danger">Customers</h5>
                <p className="h4 text-dark">892</p>
                <div className="h-12 w-12 mx-auto mb-2  rounded-circle d-flex justify-content-center align-items-center">
                  <Users size={24} />
                </div>
                <span className="text-success">+1.2% from last month</span>
              </div>
            </div>
          </div>
        </div>

        {/* Analytics Charts */}
        <div className="row g-4">
          <div className="col-md-6">
            <div className="card shadow border-0 rounded">
              <div className="card-header bg-light">
                <h5 className="mb-0">Sales & Profit Analytics</h5>
              </div>
              <div className="card-body">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={salesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="sales" fill="#4f46e5" />
                    <Bar dataKey="profit" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="col-md-6">
            <div className="card shadow border-0 rounded">
              <div className="card-header bg-light">
                <h5 className="mb-0">Price Trend & Forecast</h5>
              </div>
              <div className="card-body">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={salesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="sales" stroke="#4f46e5" />
                    <Line type="monotone" dataKey="profit" stroke="#10b981" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-light py-4 mt-5">
          <div className="container text-center text-muted">
            <p>© 2025 Smart Shop Command Center. All rights reserved.</p>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default AdminDashboard;
