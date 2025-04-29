import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/Authcontext";
import { getProducts } from "../api/productService";
import { FaHome, FaShoppingCart, FaHeart, FaBox, FaUser, FaPlus, FaMinus } from "react-icons/fa";
import ViewProducts from "./ViewProducts";

const UserDashboard = () => {
  const { currentUser } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("products");
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(window.innerWidth < 768);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const productsData = await getProducts();
        setProducts(productsData);
      } catch (err) {
        setError("Error loading products: " + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();

    // Handle window resize
    const handleResize = () => {
      setSidebarCollapsed(window.innerWidth < 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // If not logged in, redirect to login
  useEffect(() => {
    if (!currentUser) {
      navigate("/login");
    }
  }, [currentUser, navigate]);

  const toggleSidebar = () => {
    setSidebarCollapsed(!isSidebarCollapsed);
  };

  return (
    <div className="container-fluid">
      <div className="row">
        {/* Sidebar */}
        <div
          className={`col-md-3 col-lg-2 d-md-block bg-dark sidebar collapse ${isSidebarCollapsed ? "collapsed" : "show"}`}
          style={{
            position: "sticky",
            top: "56px",
            height: "calc(100vh - 56px)",
            paddingTop: "1rem",
            transition: "all 0.3s",
            width: isSidebarCollapsed ? "60px" : "240px",
            zIndex: 100,
          }}
        >
          <div className="d-flex justify-content-between align-items-center px-3 mb-4">
            <h5 className={isSidebarCollapsed ? "d-none" : "mb-0 text-white"}>Menu</h5>
            <button
              className="btn btn-sm p-0 d-md-none d-block text-white"
              onClick={toggleSidebar}
            >
              {isSidebarCollapsed ? <FaPlus /> : <FaMinus />}
            </button>
          </div>
          <div className="position-sticky">
            <ul className="nav flex-column">
              <li className="nav-item">
                <button
                  className={`nav-link btn btn-link text-start w-100 ${activeTab === "products" ? "active bg-light text-dark" : "text-white"}`}
                  onClick={() => setActiveTab("products")}
                >
                  <FaHome className="me-2" />
                  <span className={isSidebarCollapsed ? "d-none" : ""}>Products</span>
                </button>
              </li>
              <li className="nav-item">
                <Link
                  to="/cart"
                  className={`nav-link btn btn-link text-start w-100 ${activeTab === "cart" ? "active bg-light text-dark" : "text-white"}`}
                >
                  <FaShoppingCart className="me-2" />
                  <span className={isSidebarCollapsed ? "d-none" : ""}>Cart</span>
                </Link>
              </li>
              <li className="nav-item">
                <Link
                  to="/wishlist"
                  className={`nav-link btn btn-link text-start w-100 ${activeTab === "wishlist" ? "active bg-light text-dark" : "text-white"}`}
                >
                  <FaHeart className="me-2" />
                  <span className={isSidebarCollapsed ? "d-none" : ""}>Wishlist</span>
                </Link>
              </li>
              <li className="nav-item">
                <Link
                  to="/my-orders"
                  className={`nav-link btn btn-link text-start w-100 ${activeTab === "orders" ? "active bg-light text-dark" : "text-white"}`}
                >
                  <FaBox className="me-2" />
                  <span className={isSidebarCollapsed ? "d-none" : ""}>My Orders</span>
                </Link>
              </li>
              <li className="nav-item">
                <Link
                  to="/user-profile"
                  className={`nav-link btn btn-link text-start w-100 ${activeTab === "profile" ? "active bg-light text-dark" : "text-white"}`}
                >
                  <FaUser className="me-2" />
                  <span className={isSidebarCollapsed ? "d-none" : ""}>Profile</span>
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Main content */}
        <div className={`col-md-9 col-lg-10 ms-sm-auto px-md-4 py-4 ${isSidebarCollapsed ? "expanded" : ""}`}>
          {/* Page title */}
          <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
            <h2>{activeTab === "products" ? "Products" : "Dashboard"}</h2>
            <div className="btn-toolbar mb-2 mb-md-0">
              <div className="btn-group me-2">
                <button
                  className="d-md-none btn btn-sm btn-outline-dark"
                  onClick={toggleSidebar}
                >
                  {isSidebarCollapsed ? "Show Menu" : "Hide Menu"}
                </button>
              </div>
            </div>
          </div>

          {/* Dynamic content based on active tab */}
          {activeTab === "products" && (
            <ViewProducts products={products} loading={loading} error={error} />
          )}
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
