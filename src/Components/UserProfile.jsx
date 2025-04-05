import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/Authcontext";
import { getUserProfile, updateUserProfile } from "../api/userService";
import { FaUser, FaEnvelope,FaArrowLeft, FaPhone, FaMapMarkerAlt, FaEdit, FaSave, FaTimes } from "react-icons/fa";
import { toast } from "react-toastify";
import { Link } from "react-router-dom";
const UserProfile = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    displayName: "",
    phoneNumber: "",
    address: {
      street: "",
      city: "",
      state: "",
      zipCode: "",
      country: ""
    }
  });

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!currentUser) {
      navigate("/login");
      return;
    }

    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        // Get user profile from Firestore
        const userProfile = await getUserProfile(currentUser.uid);
        setProfile(userProfile);
        
        // Initialize form data with current profile data
        setFormData({
          displayName: userProfile.displayName || currentUser.displayName || "",
          phoneNumber: userProfile.phoneNumber || "",
          address: userProfile.address || {
            street: "",
            city: "",
            state: "",
            zipCode: "",
            country: ""
          }
        });
      } catch (err) {
        setError("Error loading profile: " + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [currentUser, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.includes(".")) {
      // Handle nested fields (address)
      const [parent, child] = name.split(".");
      setFormData({
        ...formData,
        [parent]: {
          ...formData[parent],
          [child]: value
        }
      });
    } else {
      // Handle top-level fields
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      // Update user profile in Firestore
      await updateUserProfile(currentUser.uid, formData);
      setProfile({
        ...profile,
        ...formData
      });
      setEditing(false);
      toast.success("Profile updated successfully");
    } catch (err) {
      setError("Error updating profile: " + err.message);
      toast.error("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      toast.error("Failed to log out");
    }
  };

  if (loading && !profile) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-dark" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-2">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="container py-5">
      <div className="row">
        <div className="col-lg-8 mx-auto">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-dark d-flex justify-content-between  text-white py-3">
              <h5 className="mb-0">Your Profile</h5>
              <Link to="/user-dashboard" className="btn btn-outline-light btn-sm">
                                <FaArrowLeft className="me-2" />
                                Continue Shopping
                              </Link>
            </div>
            <div className="card-body">
              {error && <div className="alert alert-danger">{error}</div>}

              {editing ? (
                // Edit mode
                <form onSubmit={handleSubmit}>
                  <div className="mb-4">
                    <div className="text-center mb-4">
                      <div className="d-inline-flex justify-content-center align-items-center bg-dark text-white rounded-circle" style={{ width: "100px", height: "100px" }}>
                        <FaUser size={40} />
                      </div>
                      <h5 className="mt-3 mb-0">{currentUser.email}</h5>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label htmlFor="displayName" className="form-label">Full Name</label>
                    <input
                      type="text"
                      className="form-control"
                      id="displayName"
                      name="displayName"
                      value={formData.displayName}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="mb-3">
                    <label htmlFor="phoneNumber" className="form-label">Phone Number</label>
                    <input
                      type="tel"
                      className="form-control"
                      id="phoneNumber"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleInputChange}
                    />
                  </div>

                  <h6 className="mt-4 mb-3">Address Information</h6>

                  <div className="mb-3">
                    <label htmlFor="street" className="form-label">Street Address</label>
                    <input
                      type="text"
                      className="form-control"
                      id="street"
                      name="address.street"
                      value={formData.address.street}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label htmlFor="city" className="form-label">City</label>
                      <input
                        type="text"
                        className="form-control"
                        id="city"
                        name="address.city"
                        value={formData.address.city}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label htmlFor="state" className="form-label">State</label>
                      <input
                        type="text"
                        className="form-control"
                        id="state"
                        name="address.state"
                        value={formData.address.state}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label htmlFor="zipCode" className="form-label">ZIP Code</label>
                      <input
                        type="text"
                        className="form-control"
                        id="zipCode"
                        name="address.zipCode"
                        value={formData.address.zipCode}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label htmlFor="country" className="form-label">Country</label>
                      <input
                        type="text"
                        className="form-control"
                        id="country"
                        name="address.country"
                        value={formData.address.country}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>

                  <div className="d-flex gap-2 mt-4">
                    <button type="submit" className="btn btn-dark" disabled={loading}>
                      {loading ? "Saving..." : <><FaSave className="me-2" />Save Changes</>}
                    </button>
                    <button 
                      type="button" 
                      className="btn btn-outline-secondary"
                      onClick={() => setEditing(false)}
                    >
                      <FaTimes className="me-2" />Cancel
                    </button>
                  </div>
                </form>
              ) : (
                // View mode
                <div>
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <div className="d-flex align-items-center">
                      <div className="d-inline-flex justify-content-center align-items-center bg-dark text-white rounded-circle" style={{ width: "70px", height: "70px" }}>
                        <FaUser size={30} />
                      </div>
                      <div className="ms-3">
                        <h5 className="mb-0">{profile?.displayName || currentUser.displayName || "User"}</h5>
                        <p className="text-muted mb-0">
                          <FaEnvelope className="me-2" />{currentUser.email}
                        </p>
                      </div>
                    </div>
                    <button 
                      className="btn btn-outline-dark" 
                      onClick={() => setEditing(true)}
                    >
                      <FaEdit className="me-2" />Edit Profile
                    </button>
                  </div>

                  <div className="mt-4">
                    <h6 className="border-bottom pb-2">Contact Information</h6>
                    <div className="row mt-3">
                      <div className="col-md-6 mb-3">
                        <div className="d-flex align-items-center">
                          <FaPhone className="text-muted me-3" />
                          <div>
                            <p className="text-muted mb-0">Phone Number</p>
                            <p className="mb-0">{profile?.phoneNumber || "Not provided"}</p>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-6 mb-3">
                        <div className="d-flex align-items-center">
                          <FaEnvelope className="text-muted me-3" />
                          <div>
                            <p className="text-muted mb-0">Email</p>
                            <p className="mb-0">{currentUser.email}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4">
                    <h6 className="border-bottom pb-2">Address</h6>
                    {profile?.address && (
                      Object.values(profile.address).some(value => value) ? (
                        <div className="mt-3">
                          <div className="d-flex">
                            <FaMapMarkerAlt className="text-muted me-3 mt-1" />
                            <div>
                              <p className="mb-0">{profile.address.street}</p>
                              <p className="mb-0">
                                {[profile.address.city, profile.address.state, profile.address.zipCode]
                                  .filter(Boolean)
                                  .join(", ")}
                              </p>
                              <p className="mb-0">{profile.address.country}</p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <p className="text-muted mt-3">No address information provided</p>
                      )
                    )}
                  </div>

                  <div className="mt-5 pt-3 border-top">
                    <button 
                      className="btn btn-outline-danger" 
                      onClick={handleLogout}
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;