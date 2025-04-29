import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/Authcontext"; // Auth context to manage user state
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import AdminDashboard from "./pages/AdminDashboard";
import Navbar from "./Components/Navbar"; // Import Navbar component
import AddProduct from "./Components/AddProduct";
import Myproducts from "./Components/Myproducts";
import UserDashboard from "./Components/UserDashboard";
import About from "./pages/About";
import Cart from "./Components/Cart";
import Wishlisht from "./Components/Wishlisht";
import UserProfile from "./Components/UserProfile";
import MyOrders from "./Components/MyOrders";
import ViewProducts from "./Components/ViewProducts";
import ViewProduct from "./Components/ViewProduct"; // Import new component
import EditProduct from "./Components/EditProduct"; // Import new component
import ViewOrders from "./Components/ViewOrders";

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="App">
          {/* Navbar will be displayed on all pages */}
          <Navbar />
          
          {/* Routing */}
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/about" element={<About/>} />
            
            {/* Product management routes */}
            <Route path="admin/my-products" element={<Myproducts/>} />
            <Route path="/view-product/:id" element={<ViewProduct />} />
            <Route path="/edit-product/:id" element={<EditProduct />} />
            <Route path="/admin/addproduct" element={<AddProduct />} />
          
            {/* User account routes */}
            <Route path="/user-dashboard" element={<UserDashboard/>} />
            <Route path="/view-products" element={<ViewProducts/>} />
            <Route path="/cart" element={<Cart/>} />
            <Route path="/my-orders" element={<MyOrders/>} />
            <Route path="/wishlist" element={<Wishlisht/>} />
            <Route path="/user-profile" element={<UserProfile/>} />
            <Route path="/view-product/:id" element={<ViewProduct />} />
<Route path="/edit-product/:id" element={<EditProduct />} />
            {/* Admin route */}
            <Route path="/admin" element={<Myproducts/>} />

            <Route path="/admin/orders" element={<ViewOrders />} />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;