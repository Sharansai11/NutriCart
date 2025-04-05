
// src/App.js
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/Authcontext";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import AdminDashboard from "./pages/AdminDashboard"
import Navbar from "./Components/Navbar";

 
function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="App">
          {/* <Navbar /> */}
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Add more routes as you create components */}
            {<Route path="/" element={<Home />} /> }
           
         
           
            {<Route path="/admin" element={<AdminDashboard />} /> }
            
           
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;

