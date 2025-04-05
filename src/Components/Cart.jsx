import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/Authcontext";
import { getCart, removeFromCart } from "../api/userService";
import { FaTrash, FaArrowLeft, FaShoppingBag, FaCreditCard } from "react-icons/fa";
import { toast } from "react-toastify";

const Cart = () => {
  const { currentUser } = useAuth();
  const [cart, setCart] = useState({ items: [], totalAmount: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!currentUser) {
      navigate("/login");
      return;
    }

    const fetchCart = async () => {
      try {
        setLoading(true);
        const cartData = await getCart(currentUser.uid);
        setCart(cartData);
      } catch (err) {
        setError("Error loading cart: " + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCart();
  }, [currentUser, navigate]);

  const handleRemoveItem = async (productId) => {
    try {
      await removeFromCart(currentUser.uid, productId);
      // Update cart state after removal
      setCart((prevCart) => ({
        ...prevCart,
        items: prevCart.items.filter((item) => item.productId !== productId),
        totalAmount: prevCart.totalAmount - prevCart.items.find((item) => item.productId === productId).totalPrice
      }));
      toast.success("Item removed from cart");
    } catch (error) {
      toast.error("Failed to remove item: " + error.message);
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

  // Handle checkout
  const handleCheckout = () => {
    // Add checkout logic here
    toast.info("Checkout functionality would be implemented here");
  };

  return (
    <div className="container py-5">
      <div className="row">
        <div className="col-lg-8 mx-auto">
          <div className="card border-0 shadow">
            <div className="card-header bg-dark text-white py-3">
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">
                  <FaShoppingBag className="me-2" />
                  Your Shopping Cart
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
                  <p className="mt-2">Loading your cart...</p>
                </div>
              ) : cart.items.length === 0 ? (
                <div className="text-center py-5">
                  <img
                    src="https://cdn-icons-png.flaticon.com/512/2038/2038854.png"
                    alt="Empty Cart"
                    style={{ width: "100px", opacity: "0.5" }}
                    className="mb-3"
                  />
                  <h5>Your cart is empty</h5>
                  <p className="text-muted">
                    Looks like you haven't added any products to your cart yet.
                  </p>
                  <Link to="/user-dashboard" className="btn btn-dark mt-3">
                    Start Shopping
                  </Link>
                </div>
              ) : (
                <>
                  {/* Cart items */}
                  <div className="table-responsive">
                    <table className="table align-middle">
                      <thead>
                        <tr>
                          <th scope="col">Product</th>
                          <th scope="col">Price</th>
                          <th scope="col">Quantity</th>
                          <th scope="col">Total</th>
                          <th scope="col"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {cart.items.map((item) => (
                          <tr key={item.productId}>
                            <td>
                              <div className="d-flex align-items-center">
                                <div
                                  style={{
                                    width: "60px",
                                    height: "60px",
                                    overflow: "hidden",
                                  }}
                                >
                                  <img
                                    src={item.imageUrl || "https://placehold.co/60x60?text=No+Image"}
                                    alt={item.name}
                                    className="img-fluid rounded"
                                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                  />
                                </div>
                                <div className="ms-3">
                                  <h6 className="mb-0">{item.name}</h6>
                                  <small className="text-muted">
                                    Added: {new Date(item.addedAt).toLocaleDateString()}
                                  </small>
                                </div>
                              </div>
                            </td>
                            <td>{formatCurrency(item.price)}</td>
                            <td>{item.quantity}</td>
                            <td className="fw-bold">{formatCurrency(item.totalPrice)}</td>
                            <td>
                              <button
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => handleRemoveItem(item.productId)}
                              >
                                <FaTrash />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Cart Summary */}
                  <div className="card mt-4 border-dark">
                    <div className="card-body">
                      <h5 className="card-title">Order Summary</h5>
                      <div className="d-flex justify-content-between mb-2">
                        <span>Subtotal</span>
                        <span>{formatCurrency(cart.totalAmount)}</span>
                      </div>
                      <div className="d-flex justify-content-between mb-2">
                        <span>Shipping</span>
                        <span>Free</span>
                      </div>
                      <hr />
                      <div className="d-flex justify-content-between mb-2 fw-bold">
                        <span>Total</span>
                        <span>{formatCurrency(cart.totalAmount)}</span>
                      </div>
                      <button
                        className="btn btn-dark w-100 mt-3"
                        onClick={handleCheckout}
                      >
                        <FaCreditCard className="me-2" />
                        Proceed to Checkout
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;