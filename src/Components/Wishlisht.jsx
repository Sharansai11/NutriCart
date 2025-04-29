import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/Authcontext";
import { getWishlistItems, removeFromWishlist, addToCart } from "../api/userService";
import { FaTrash, FaArrowLeft, FaHeart, FaShoppingCart, FaStar, FaEye } from "react-icons/fa";
import { toast } from "react-toastify";

const Wishlist = () => {
  const { currentUser } = useAuth();
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [processingItems, setProcessingItems] = useState({}); // Track items being processed
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
        const items = await getWishlistItems(currentUser.uid);
        setWishlistItems(items);
      } catch (err) {
        setError("Error loading wishlist: " + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchWishlist();
  }, [currentUser, navigate]);

  // Remove item from wishlist
  const handleRemoveItem = async (productId, productName) => {
    try {
      setProcessingItems(prev => ({ ...prev, [productId]: "removing" }));
      await removeFromWishlist(currentUser.uid, productId);
      // Update wishlist state after removal
      setWishlistItems(prevItems => prevItems.filter(item => item.id !== productId));
      toast.success(`${productName} removed from wishlist`);
    } catch (error) {
      toast.error("Failed to remove item: " + error.message);
    } finally {
      setProcessingItems(prev => ({ ...prev, [productId]: null }));
    }
  };

  // Move item from wishlist to cart
  const handleMoveToCart = async (product) => {
    try {
      setProcessingItems(prev => ({ ...prev, [product.id]: "addingToCart" }));
      await addToCart(currentUser.uid, product.id);
      await removeFromWishlist(currentUser.uid, product.id);
      // Update wishlist state after moving to cart
      setWishlistItems(prevItems => prevItems.filter(item => item.id !== product.id));
      toast.success(`${product.name} moved to cart`);
    } catch (error) {
      toast.error("Failed to move item to cart: " + error.message);
    } finally {
      setProcessingItems(prev => ({ ...prev, [product.id]: null }));
    }
  };

  // Format currency
  const formatCurrency = (price) => {
    if (price === undefined || price === null || isNaN(price)) return "₹0";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="container py-5">
      <div className="mb-4">
        <h2 className="fs-1 fw-bold mb-0">My Wishlist</h2>
        <p className="text-muted">Items you've saved for later</p>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {loading ? (
        <div className="py-5 text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3">Loading your wishlist items...</p>
        </div>
      ) : wishlistItems.length === 0 ? (
        <div className="text-center py-5 bg-light rounded-4 shadow-sm">
          <div className="mb-4">
            <span className="display-1 text-danger">
              <FaHeart />
            </span>
          </div>
          <h3>Your wishlist is empty</h3>
          <p className="text-muted mx-auto" style={{ maxWidth: "500px" }}>
            Discover products you love and save them to your wishlist by clicking the heart icon on any product.
          </p>
          <Link to="/user-dashboard" className="btn btn-primary btn-lg mt-3">
            <FaShoppingCart className="me-2" />
            Explore Products
          </Link>
        </div>
      ) : (
        <>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <span className="fs-5">
              <FaHeart className="text-danger me-2" />
              {wishlistItems.length} {wishlistItems.length === 1 ? 'item' : 'items'} saved
            </span>
            <Link to="/user-dashboard" className="btn btn-outline-primary">
              <FaArrowLeft className="me-2" />
              Continue Shopping
            </Link>
          </div>

          <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
            {wishlistItems.map((product) => (
              <div key={product.id} className="col">
                <div className="card h-100 border-0 shadow-sm rounded-4 overflow-hidden position-relative">
                  {/* Quick view button that appears on hover */}
                  <div className="position-absolute top-0 end-0 p-3">
                    <Link 
                      to={`/product/${product.id}`} 
                      className="btn btn-sm btn-light rounded-circle shadow"
                      title="View details"
                    >
                      <FaEye />
                    </Link>
                  </div>
                  
                  {/* Product image */}
                  <div className="text-center bg-light p-4" style={{ height: "200px" }}>
                    <img
                      src={product.imageUrl || "https://placehold.co/400x400?text=No+Image"}
                      className="h-100"
                      alt={product.name}
                      style={{ objectFit: "contain", maxWidth: "100%" }}
                    />
                  </div>
                  
                  <div className="card-body">
                    {/* Product badges */}
                    <div className="mb-2">
                      {product.category && (
                        <span className="badge bg-secondary rounded-pill me-1">{product.category}</span>
                      )}
                      {product.rating && (
                        <span className="badge bg-warning text-dark rounded-pill ms-1">
                          <FaStar className="me-1" /> {product.rating}
                        </span>
                      )}
                    </div>
                    
                    <h5 className="card-title fw-bold">{product.name}</h5>
                    <p className="card-text small text-muted mb-3">
                      {product.description && product.description.length > 60
                        ? product.description.substring(0, 60) + "..."
                        : product.description}
                    </p>

                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h4 className="fw-bold mb-0">{formatCurrency(product.price)}</h4>
                      <div>
                        {product.stock > 0 ? (
                          <span className="badge bg-success px-2 py-1">In Stock</span>
                        ) : (
                          <span className="badge bg-danger px-2 py-1">Out of Stock</span>
                        )}
                      </div>
                    </div>
                    
                    {/* Action buttons */}
                    <div className="d-flex gap-2">
                      <button
                        className="btn btn-primary flex-grow-1 d-flex align-items-center justify-content-center"
                        onClick={() => handleMoveToCart(product)}
                        disabled={processingItems[product.id] || product.stock <= 0}
                      >
                        {processingItems[product.id] === "addingToCart" ? (
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        ) : (
                          <FaShoppingCart className="me-2" />
                        )}
                        Add to Cart
                      </button>
                      
                      <button
                        className="btn btn-outline-danger"
                        onClick={() => handleRemoveItem(product.id, product.name)}
                        disabled={processingItems[product.id]}
                        title="Remove from wishlist"
                      >
                        {processingItems[product.id] === "removing" ? (
                          <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                        ) : (
                          <FaTrash />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default Wishlist;