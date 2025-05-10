import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/Authcontext";
import { 
  getCartItems, 
  updateCartItemQuantity, 
  removeFromCart, 
  getHealthierAlternatives, 
  addToCart
} from "../api/userService";
import { 
  FaShoppingCart, 
  FaTrash, 
  FaExclamationTriangle, 
  FaPlus, 
  FaMinus, 
  FaExchangeAlt 
} from "react-icons/fa";
import { toast } from "react-toastify";

function Cart() {
  const { currentUser } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState({});
  const [alternatives, setAlternatives] = useState({});
  const [showHealthTips, setShowHealthTips] = useState(true);

  // Fetch cart and find alternatives
  useEffect(() => {
    if (!currentUser) {
      setCartItems([]);
      setLoading(false);
      return;
    }

    async function loadCart() {
      try {
        setLoading(true);
        // Get cart items
        const items = await getCartItems(currentUser.uid);
        setCartItems(items);
        
        // Find alternatives for poor nutrition items (D & E grades)
        items.forEach(async item => {
          if (item.product?.nutrition_grade_fr && 
              ["D", "E", "d", "e"].includes(item.product.nutrition_grade_fr)) {
            try {
              console.log(`Finding alternatives for ${item.product.name}`);
              const betterOptions = await getHealthierAlternatives(item.productId);
              if (betterOptions.length > 0) {
                setAlternatives(prev => ({...prev, [item.productId]: betterOptions}));
              }
            } catch (error) {
              console.error(`Error finding alternatives: ${error.message}`);
            }
          }
        });
      } catch (error) {
        toast.error("Failed to load cart");
      } finally {
        setLoading(false);
      }
    }

    loadCart();
  }, [currentUser]);

  // Update item quantity
  const handleUpdateQuantity = async (productId, newQuantity, productName) => {
    if (!currentUser) return;
    
    try {
      setUpdating(prev => ({ ...prev, [productId]: true }));
      
      if (newQuantity <= 0) {
        await removeFromCart(currentUser.uid, productId);
        setCartItems(prev => prev.filter(item => item.productId !== productId));
        toast.info(`${productName} removed from cart`);
      } else {
        await updateCartItemQuantity(currentUser.uid, productId, newQuantity);
        setCartItems(prev => prev.map(item => 
          item.productId === productId ? { ...item, quantity: newQuantity } : item
        ));
      }
    } catch (error) {
      toast.error("Failed to update cart");
    } finally {
      setUpdating(prev => ({ ...prev, [productId]: false }));
    }
  };

  // Replace unhealthy item with healthier alternative
  const handleReplaceItem = async (oldItemId, newItem) => {
    if (!currentUser) return;
    
    try {
      setUpdating(prev => ({ ...prev, [oldItemId]: true }));
      
      // Get quantity of item being replaced
      const oldItem = cartItems.find(item => item.productId === oldItemId);
      const quantity = oldItem ? oldItem.quantity : 1;
      
      // Remove unhealthy item
      await removeFromCart(currentUser.uid, oldItemId);
      
      // Add healthier alternative with same quantity
      await addToCart(currentUser.uid, newItem.id, quantity);
      
      // Update local state
      setCartItems(prev => [
        ...prev.filter(item => item.productId !== oldItemId),
        { productId: newItem.id, quantity, product: newItem }
      ]);
      
      // Remove from alternatives
      setAlternatives(prev => {
        const newAlts = {...prev};
        delete newAlts[oldItemId];
        return newAlts;
      });
      
      toast.success(`Replaced with healthier ${newItem.name}`);
    } catch (error) {
      toast.error("Failed to replace item");
    } finally {
      setUpdating(prev => ({ ...prev, [oldItemId]: false }));
    }
  };

  // Formatting and utility functions
  const formatCurrency = (price) => {
    if (price === undefined || price === null || isNaN(price)) return "₹0";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(price);
  };

  const getNutriScoreColor = (grade) => {
    if (!grade) return 'bg-secondary';
    
    const colors = {
      'A': 'bg-success',
      'B': 'bg-success bg-opacity-50', // Very light green using Bootstrap
      'C': 'bg-warning',
      'D': 'bg-warning bg-opacity-50', // Using orange-like effect
      'E': 'bg-danger'
    };
    
    return colors[grade.toUpperCase()] || 'bg-secondary';
  };
  
  // Calculate cart stats
  const cartTotal = cartItems.reduce((total, item) => 
    total + (item.product?.price * item.quantity || 0), 0);
  
  const poorNutritionItems = cartItems.filter(item => 
    item.product?.nutrition_grade_fr && 
    ["D", "E", "d", "e"].includes(item.product.nutrition_grade_fr)
  );

  const healthScore = cartItems.length > 0 
    ? Math.round(((cartItems.length - poorNutritionItems.length) / cartItems.length) * 100) 
    : 100;

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-primary" role="status" />
        <p className="mt-3">Loading your cart...</p>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="container py-5">
        <h1 className="mb-4">Your Cart</h1> 
        <div className="text-center py-5 bg-light rounded-4 shadow-sm">
          <FaShoppingCart className="display-1 text-muted mb-3" />
          <h3>Your cart is empty</h3>
          <p className="text-muted">Add some products to your cart.</p>
          <Link to="/user-dashboard" className="btn btn-primary mt-3">Start Shopping</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <h1 className="mb-3">Your Cart</h1>
      
      {/* Health Optimization Section */}
      {poorNutritionItems.length > 0 && showHealthTips && (
        <div className="card mb-4 border-0 shadow-sm rounded-4 overflow-hidden">
          <div className="card-header bg-warning text-dark py-3 d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center">
              <FaExclamationTriangle className="me-2" />
              <h5 className="mb-0">Health Optimization</h5>
            </div>
            <button className="btn btn-sm btn-outline-dark" onClick={() => setShowHealthTips(false)}>Hide</button>
          </div>
          
          <div className="card-body p-3">
            {/* Health Score */}
            <div className="mb-3">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <span>Cart Health Score</span>
                <span className="fw-bold">{healthScore}%</span>
              </div>
              <div className="progress" style={{height: "10px"}}>
                <div 
                  className={`progress-bar ${healthScore > 70 ? 'bg-success' : healthScore > 40 ? 'bg-warning' : 'bg-danger'}`} 
                  style={{ width: `${healthScore}%` }}
                ></div>
              </div>
            </div>
            
            {/* Alternatives for poor items */}
            {poorNutritionItems.map(item => (
              <div key={item.productId} className="card mb-3 border-0 shadow-sm">
                <div className="card-body">
                  {/* Product info */}
                  <div className="d-flex align-items-center mb-2">
                    <span className={`badge ${getNutriScoreColor(item.product.nutrition_grade_fr)} me-2`}>
                      {item.product.nutrition_grade_fr.toUpperCase()}
                    </span>
                    <h6 className="mb-0">{item.product.name}</h6>
                    <span className="ms-2 text-muted small">
                      ({item.product.category || ""})
                    </span>
                  </div>
                  
                  {/* Alternatives */}
                  {!alternatives[item.productId] ? (
                    <div className="text-center py-2">
                      <div className="spinner-border spinner-border-sm text-success" role="status" />
                      <span className="ms-2">Finding healthier options...</span>
                    </div>
                  ) : alternatives[item.productId].length > 0 ? (
                    <div className="row row-cols-1 row-cols-md-2 g-2 mt-1">
                      {alternatives[item.productId].slice(0, 2).map(alt => (
                        <div key={alt.id} className="col">
                          <div className="card h-100 bg-white border-0 shadow-sm">
                            <div className="row g-0">
                              <div className="col-4">
                                <img 
                                  src={alt.imageUrl || "https://placehold.co/200x200?text=No+Image"}
                                  className="img-fluid rounded-start"
                                  alt={alt.name}
                                  style={{ height: "80px", objectFit: "cover" }}
                                />
                              </div>
                              <div className="col-8">
                                <div className="card-body p-2">
                                  <div className="d-flex align-items-start justify-content-between mb-1">
                                    <span className={`badge ${getNutriScoreColor(alt.nutrition_grade_fr)}`}>
                                      {alt.nutrition_grade_fr.toUpperCase()}
                                    </span>
                                  </div>
                                  <h6 className="card-title small mb-1">
                                    {alt.name}
                                    <span className="ms-1 text-muted small">
                                      ({alt.category || ""})
                                    </span>
                                  </h6>
                                  <div className="d-flex justify-content-between align-items-center">
                                    <span className="small fw-bold">{formatCurrency(alt.price)}</span>
                                    <button 
                                      className="btn btn-sm btn-success d-flex align-items-center"
                                      onClick={() => handleReplaceItem(item.productId, alt)}
                                      disabled={updating[item.productId]}
                                    >
                                      {updating[item.productId] ? (
                                        <span className="spinner-border spinner-border-sm" />
                                      ) : (
                                        <>
                                          <FaExchangeAlt className="me-1" /> Replace
                                        </>
                                      )}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-2">
                      <span className="text-muted">No alternatives found</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Cart Items Table */}
      <div className="card border-0 shadow-sm rounded-4 overflow-hidden mb-4">
        <div className="table-responsive">
          <table className="table table-borderless align-middle mb-0">
            <thead className="bg-light">
              <tr>
                <th className="py-3 ps-4">Product</th>
                <th className="py-3 text-center">Price</th>
                <th className="py-3 text-center">Quantity</th>
                <th className="py-3 text-end pe-4">Total</th>
              </tr>
            </thead>
            <tbody>
              {cartItems.map(item => (
                <tr key={item.productId}>
                  <td className="ps-4">
                    <div className="d-flex align-items-center">
                      <img
                        src={item.product?.imageUrl || "https://placehold.co/200x200?text=No+Image"}
                        alt={item.product?.name}
                        className="me-3 rounded"
                        style={{ width: "60px", height: "60px", objectFit: "cover" }}
                      />
                      <div>
                        <h6 className="mb-1">{item.product?.name}</h6>
                        <div>
                          {item.product?.nutrition_grade_fr && (
                            <span className={`badge ${getNutriScoreColor(item.product.nutrition_grade_fr)} me-2`}>
                              {item.product.nutrition_grade_fr.toUpperCase()}
                            </span>
                          )}
                          {item.product?.category && (
                            <span className="badge bg-secondary">{item.product.category}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="text-center">{formatCurrency(item.product?.price)}</td>
                  <td className="text-center">
                    <div className="d-flex align-items-center justify-content-center">
                      <div className="d-flex border border-warning rounded-pill">
                        <button
                          className="btn btn-link text-dark p-0 d-flex align-items-center justify-content-center"
                          style={{ width: "32px", height: "32px" }}
                          onClick={() => handleUpdateQuantity(item.productId, item.quantity - 1, item.product?.name)}
                          disabled={updating[item.productId]}
                        >
                          <FaMinus size={10} />
                        </button>
                        <div className="px-3 text-center fw-bold d-flex align-items-center">
                          {updating[item.productId] ? (
                            <span className="spinner-border spinner-border-sm" />
                          ) : (
                            <span>{item.quantity}</span>
                          )}
                        </div>
                        <button
                          className="btn btn-link text-dark p-0 d-flex align-items-center justify-content-center"
                          style={{ width: "32px", height: "32px" }}
                          onClick={() => handleUpdateQuantity(item.productId, item.quantity + 1, item.product?.name)}
                          disabled={updating[item.productId]}
                        >
                          <FaPlus size={10} />
                        </button>
                      </div>
                      <button
                        className="btn btn-link text-danger ms-2"
                        onClick={() => handleUpdateQuantity(item.productId, 0, item.product?.name)}
                        disabled={updating[item.productId]}
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </td>
                  <td className="text-end pe-4 fw-bold">
                    {formatCurrency((item.product?.price || 0) * item.quantity)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Cart Summary */}
      <div className="row">
        <div className="col-md-6 mb-3">
          <Link to="/user-dashboard" className="btn btn-outline-dark">
            Continue Shopping
          </Link>
        </div>
        <div className="col-md-6">
          <div className="card border-0 shadow-sm rounded-4">
            <div className="card-body p-3">
              <h5 className="mb-3">Cart Summary</h5>
              <div className="d-flex justify-content-between mb-2">
                <span>Subtotal</span>
                <span className="fw-bold">{formatCurrency(cartTotal)}</span>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span>Shipping</span>
                <span>Free</span>
              </div>
              <hr />
              <div className="d-flex justify-content-between mb-3">
                <span className="fw-bold">Total</span>
                <span className="fw-bold fs-5">{formatCurrency(cartTotal)}</span>
              </div>
              
              <button className="btn btn-primary w-100">
                Proceed to Checkout
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Cart;