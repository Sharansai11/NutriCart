import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/Authcontext"; // Auth context to manage user state
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import AdminDashboard from "./pages/AdminDashboard";
import Navbar from "./Components/Navbar"; // Import Navbar component

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
            
            {/* Private routes */}
            {/* Admin route */}
            <Route path="/admin" element={<AdminDashboard />} />
          </Routes>
         
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
