import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/Authcontext";
import { getWishlist, removeFromWishlist, addToCart } from "../api/userService";
import { FaTrash, FaArrowLeft, FaHeart, FaShoppingCart } from "react-icons/fa";
import { toast } from "react-toastify";

const Wishlisht = () => {
  const { currentUser } = useAuth();
  const [wishlist, setWishlist] = useState({ items: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!currentUser) {
      navigate("/login");
      return;
    }

    const fetchWishlist = async () => {
      try {
        setLoading(true);
        const wishlistData = await getWishlist(currentUser.uid);
        setWishlist(wishlistData);
      } catch (err) {
        setError("Error loading wishlist: " + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchWishlist();
  }, [currentUser, navigate]);

  // Remove item from wishlist
  const handleRemoveItem = async (productId) => {
    try {
      await removeFromWishlist(currentUser.uid, productId);
      // Update wishlist state after removal
      setWishlist((prevWishlist) => ({
        ...prevWishlist,
        items: prevWishlist.items.filter((item) => item.productId !== productId)
      }));
      toast.success("Item removed from wishlist");
    } catch (error) {
      toast.error("Failed to remove item: " + error.message);
    }
  };

  // Move item from wishlist to cart
  const handleMoveToCart = async (item) => {
    try {
      await addToCart(currentUser.uid, item.productId);
      await removeFromWishlist(currentUser.uid, item.productId);
      // Update wishlist state after moving to cart
      setWishlist((prevWishlist) => ({
        ...prevWishlist,
        items: prevWishlist.items.filter((i) => i.productId !== item.productId)
      }));
      toast.success(`${item.name} moved to cart`);
    } catch (error) {
      toast.error("Failed to move item to cart: " + error.message);
    }
  };

  // Format currency
  const formatCurrency = (price) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="container py-5">
      <div className="row">
        <div className="col-lg-8 mx-auto">
          <div className="card border-0 shadow">
            <div className="card-header bg-dark text-white py-3">
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">
                  <FaHeart className="me-2" />
                  Your Wishlist
                </h5>
                <Link to="/user-dashboard" className="btn btn-outline-light btn-sm">
                  <FaArrowLeft className="me-2" />
                  Continue Shopping
                </Link>
              </div>
            </div>

            <div className="card-body">
              {error && <div className="alert alert-danger">{error}</div>}

              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-dark" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="mt-2">Loading your wishlist...</p>
                </div>
              ) : wishlist.items.length === 0 ? (
                <div className="text-center py-5">
                  <img
                    src="https://cdn-icons-png.flaticon.com/512/3144/3144456.png"
                    alt="Empty Wishlist"
                    style={{ width: "100px", opacity: "0.5" }}
                    className="mb-3"
                  />
                  <h5>Your wishlist is empty</h5>
                  <p className="text-muted">
                    Save items you love for later by clicking the heart icon on any product.
                  </p>
                  <Link to="/user-dashboard" className="btn btn-dark mt-3">
                    Discover Products
                  </Link>
                </div>
              ) : (
                <div className="row row-cols-1 row-cols-md-2 g-4">
                  {wishlist.items.map((item) => (
                    <div key={item.productId} className="col">
                      <div className="card h-100 border-dark">
                        <div className="row g-0">
                          <div className="col-md-4">
                            <img
                              src={item.imageUrl || "https://placehold.co/200x200?text=No+Image"}
                              alt={item.name}
                              className="img-fluid rounded-start h-100"
                              style={{ objectFit: "cover" }}
                            />
                          </div>
                          <div className="col-md-8">
                            <div className="card-body">
                              <h5 className="card-title">{item.name}</h5>
                              <p className="card-text fw-bold">{formatCurrency(item.price)}</p>
                              <p className="card-text">
                                <small className="text-muted">
                                  Added: {new Date(item.addedAt).toLocaleDateString()}
                                </small>
                              </p>
                              <div className="d-flex gap-2 mt-auto">
                                <button
                                  className="btn btn-dark flex-grow-1"
                                  onClick={() => handleMoveToCart(item)}
                                >
                                  <FaShoppingCart className="me-2" />
                                  Add to Cart
                                </button>
                                <button
                                  className="btn btn-outline-danger"
                                  onClick={() => handleRemoveItem(item.productId)}
                                  title="Remove from wishlist"
                                >
                                  <FaTrash />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Wishlisht;