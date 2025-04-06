import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/Authcontext";
import { getCart, removeFromCart, clearCart, createOrder } from "../api/userService";
import { FaTrash, FaArrowLeft, FaShoppingBag, FaCreditCard, FaMoneyBillWave } from "react-icons/fa";
import { toast } from "react-toastify";

const Cart = () => {
  const { currentUser } = useAuth();
  const [cart, setCart] = useState({ items: [], totalAmount: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const [showPaymentGateway, setShowPaymentGateway] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [cardDetails, setCardDetails] = useState({
    cardNumber: '',
    cardHolder: '',
    expiryDate: '',
    cvv: ''
  });

  // Calculate tax and shipping
  const subtotal = cart.totalAmount || 0;
  const tax = subtotal * 0.18; // 18% tax
  const shipping = subtotal > 1000 ? 0 : 100; // Free shipping over ₹1000
  const total = subtotal + tax + shipping;

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

  // Handle card input changes
  const handleCardDetailChange = (e) => {
    const { name, value } = e.target;
    setCardDetails(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Process payment and create order
  const handlePayment = async () => {
    // Simple validation for card payment
    if (paymentMethod === 'card') {
      if (!cardDetails.cardNumber || !cardDetails.cardHolder || !cardDetails.expiryDate || !cardDetails.cvv) {
        toast.error('Please fill in all card details');
        return;
      }
    }
    
    try {
      setIsProcessingPayment(true);
      
      // Create order object from cart items
      const orderItems = cart.items.map(item => ({
        productId: item.productId,
        productName: item.name,
        quantity: item.quantity,
        price: item.price,
        category: item.category || "Unknown",
        imageUrl: item.imageUrl
      }));
      
      const order = {
        items: orderItems,
        subtotal,
        tax,
        shipping,
        total,
        paymentMethod,
        status: 'pending',
        createdAt: new Date()
      };
      
      // Create order in database
      await createOrder(currentUser.uid, order);
      
      // Clear the cart
      await clearCart(currentUser.uid);
      
      // Simulate payment processing
      setTimeout(() => {
        setIsProcessingPayment(false);
        setShowPaymentGateway(false);
        
        // Show success message
        toast.success('Payment successful! Your order has been placed.');
        
        // Clear local cart state
        setCart({ items: [], totalAmount: 0 });
        
        // Navigate to orders page
        navigate('/my-orders');
      }, 1500);
    } catch (error) {
      console.error('Error processing payment:', error);
      setIsProcessingPayment(false);
      toast.error('Payment failed. Please try again.');
    }
  };

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
    // Check if cart is empty
    if (cart.items.length === 0) {
      toast.error("Your cart is empty");
      return;
    }
    
    // Open payment gateway modal
    setShowPaymentGateway(true);
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
                        <span>{formatCurrency(subtotal)}</span>
                      </div>
                      <div className="d-flex justify-content-between mb-2">
                        <span>Tax (18%)</span>
                        <span>{formatCurrency(tax)}</span>
                      </div>
                      <div className="d-flex justify-content-between mb-2">
                        <span>Shipping</span>
                        <span>{shipping === 0 ? 'Free' : formatCurrency(shipping)}</span>
                      </div>
                      <hr />
                      <div className="d-flex justify-content-between mb-2 fw-bold">
                        <span>Total</span>
                        <span>{formatCurrency(total)}</span>
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
      
      {/* Payment Gateway Modal */}
      {showPaymentGateway && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Payment Gateway</h5>
                <button 
                  type="button" 
                  className="btn-close"
                  onClick={() => !isProcessingPayment && setShowPaymentGateway(false)}
                  disabled={isProcessingPayment}
                ></button>
              </div>
              <div className="modal-body">
                {/* Payment Method Selection */}
                <div className="payment-methods mb-4">
                  <h6 className="mb-3">Select Payment Method</h6>
                  <div className="row g-3">
                    <div className="col-6">
                      <div 
                        className={`payment-option card h-100 ${paymentMethod === 'card' ? 'border-primary' : ''}`} 
                        onClick={() => setPaymentMethod('card')}
                        style={{ cursor: 'pointer' }}
                      >
                        <div className="card-body d-flex align-items-center">
                          <FaCreditCard className={`me-3 fs-4 ${paymentMethod === 'card' ? 'text-primary' : 'text-muted'}`} />
                          <span>Credit/Debit Card</span>
                        </div>
                      </div>
                    </div>
                    <div className="col-6">
                      <div 
                        className={`payment-option card h-100 ${paymentMethod === 'cod' ? 'border-primary' : ''}`} 
                        onClick={() => setPaymentMethod('cod')}
                        style={{ cursor: 'pointer' }}
                      >
                        <div className="card-body d-flex align-items-center">
                          <FaMoneyBillWave className={`me-3 fs-4 ${paymentMethod === 'cod' ? 'text-primary' : 'text-muted'}`} />
                          <span>Cash on Delivery</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Card Payment Form */}
                {paymentMethod === 'card' && (
                  <div className="card-payment-form">
                    <div className="mb-3">
                      <label htmlFor="cardNumber" className="form-label">Card Number</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        id="cardNumber"
                        name="cardNumber"
                        placeholder="1234 5678 9012 3456"
                        value={cardDetails.cardNumber}
                        onChange={handleCardDetailChange}
                      />
                    </div>
                    <div className="mb-3">
                      <label htmlFor="cardHolder" className="form-label">Card Holder</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        id="cardHolder"
                        name="cardHolder"
                        placeholder="John Doe"
                        value={cardDetails.cardHolder}
                        onChange={handleCardDetailChange}
                      />
                    </div>
                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label htmlFor="expiryDate" className="form-label">Expiry Date</label>
                        <input 
                          type="text" 
                          className="form-control" 
                          id="expiryDate"
                          name="expiryDate"
                          placeholder="MM/YY"
                          value={cardDetails.expiryDate}
                          onChange={handleCardDetailChange}
                        />
                      </div>
                      <div className="col-md-6 mb-3">
                        <label htmlFor="cvv" className="form-label">CVV</label>
                        <input 
                          type="text" 
                          className="form-control" 
                          id="cvv"
                          name="cvv"
                          placeholder="123"
                          value={cardDetails.cvv}
                          onChange={handleCardDetailChange}
                        />
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Cash on Delivery Info */}
                {paymentMethod === 'cod' && (
                  <div className="alert alert-info">
                    <p className="mb-0">You will pay {formatCurrency(total)} at the time of delivery.</p>
                  </div>
                )}
                
                {/* Order Summary */}
                <div className="order-summary mt-4">
                  <h6 className="mb-3">Order Summary</h6>
                  <div className="d-flex justify-content-between mb-2">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span>Tax (18%):</span>
                    <span>{formatCurrency(tax)}</span>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span>Shipping:</span>
                    <span>{shipping === 0 ? 'Free' : formatCurrency(shipping)}</span>
                  </div>
                  <hr />
                  <div className="d-flex justify-content-between">
                    <strong>Total:</strong>
                    <strong>{formatCurrency(total)}</strong>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => !isProcessingPayment && setShowPaymentGateway(false)}
                  disabled={isProcessingPayment}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary d-flex align-items-center"
                  onClick={handlePayment}
                  disabled={isProcessingPayment}
                >
                  {isProcessingPayment ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Processing...
                    </>
                  ) : (
                    <>Pay Now</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;