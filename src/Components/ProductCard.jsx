import React, { useState, useEffect } from "react";
import { FaHeart, FaShoppingCart, FaExclamationTriangle, FaLeaf, FaPlus, FaMinus, FaTimes, FaStar } from "react-icons/fa";
import { 
  addToCart, 
  updateCartItemQuantity,
  removeFromCart,
  addToWishlist, 
  removeFromWishlist, 
  isInWishlist
} from "../api/userService";
import { useAuth } from "../context/Authcontext";
import { toast } from "react-toastify";

const ProductCard = ({ product, inCart, cartQuantity = 0 }) => {
  const { currentUser } = useAuth();
  const [isInUserWishlist, setIsInUserWishlist] = useState(false);
  const [checkingWishlist, setCheckingWishlist] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [quantity, setQuantity] = useState(cartQuantity || 0);
  const [updating, setUpdating] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Check if product is in wishlist
  useEffect(() => {
    const checkWishlist = async () => {
      if (!currentUser || !product) {
        setIsInUserWishlist(false);
        setCheckingWishlist(false);
        return;
      }

      try {
        const inWishlist = await isInWishlist(currentUser.uid, product.id);
        setIsInUserWishlist(inWishlist);
      } catch (error) {
        console.error("Error checking wishlist:", error);
      } finally {
        setCheckingWishlist(false);
      }
    };

    checkWishlist();
  }, [currentUser, product]);

  // Update quantity when cartQuantity prop changes
  useEffect(() => {
    setQuantity(cartQuantity || 0);
  }, [cartQuantity]);

  // Format currency
  const formatCurrency = (price) => {
    if (price === undefined || price === null || isNaN(price)) return "₹0";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(price);
  };

  // Get Nutri-Score badge color
  const getNutriScoreColor = (grade) => {
    if (!grade) return 'bg-secondary text-white';
  
    switch (grade.toUpperCase()) {
      case 'A':
        return 'bg-success text-white'; // Solid green
      case 'B':
        return 'bg-success bg-opacity-25 text-success'; // Light green
      case 'C':
        return 'bg-warning text-dark';  // Yellow
      case 'D':
        return 'bg-warning bg-opacity-75 text-dark'; // Simulated orange
      case 'E':
        return 'bg-danger text-white'; // Red
      default:
        return 'bg-secondary text-white';
    }
  };
  
  // Check if a product has poor nutrition score
  const hasPoorNutritionScore = (product) => {
    if (!product) return false;
    return product.nutrition_grade_fr && ["D", "E", "d", "e"].includes(product.nutrition_grade_fr);
  };

  // Handle adding to cart or updating quantity
  const handleAddOrUpdateCart = async () => {
    try {
      if (!currentUser) {
        toast.error("Please log in to add items to your cart");
        return;
      }
      
      if (!product) {
        toast.error("Product information is missing");
        return;
      }
      
      // Show warning for poor nutrition score products
      if (hasPoorNutritionScore(product) && !inCart && quantity === 0) {
        if (!window.confirm(`Warning: This product has a Nutri-Score of ${product.nutrition_grade_fr.toUpperCase()}, indicating poor nutritional quality. Do you still want to add it to your cart?`)) {
          return;
        }
      }
      
      setUpdating(true);
      
      if (quantity === 0) {
        // First time adding to cart
        await addToCart(currentUser.uid, product.id);
        setQuantity(1);
        toast.success(`${product.name} added to cart!`);
      } else {
        // Already in cart, update quantity
        await updateCartItemQuantity(currentUser.uid, product.id, quantity + 1);
        setQuantity(quantity + 1);
        toast.success(`${product.name} quantity updated!`);
      }
    } catch (error) {
      toast.error("Failed to update cart: " + error.message);
    } finally {
      setUpdating(false);
    }
  };

  // Handle decreasing quantity
  const handleDecreaseQuantity = async () => {
    if (!currentUser || quantity <= 0 || !product) return;
    
    try {
      setUpdating(true);
      
      if (quantity === 1) {
        // Remove from cart if quantity is 1 and we're decreasing
        await removeFromCart(currentUser.uid, product.id);
        setQuantity(0);
        toast.info(`${product.name} removed from cart`);
      } else {
        // Update quantity
        await updateCartItemQuantity(currentUser.uid, product.id, quantity - 1);
        setQuantity(quantity - 1);
      }
    } catch (error) {
      toast.error("Failed to update cart: " + error.message);
    } finally {
      setUpdating(false);
    }
  };

  // Handle toggling wishlist
  const handleToggleWishlist = async () => {
    try {
      if (!currentUser) {
        toast.error("Please log in to use the wishlist");
        return;
      }
      
      if (!product) {
        toast.error("Product information is missing");
        return;
      }
      
      if (isInUserWishlist) {
        // Remove from wishlist
        await removeFromWishlist(currentUser.uid, product.id);
        setIsInUserWishlist(false);
        toast.success(`${product.name} removed from wishlist`);
      } else {
        // Add to wishlist
        await addToWishlist(currentUser.uid, product.id);
        setIsInUserWishlist(true);
        toast.success(`${product.name} added to wishlist!`);
      }
    } catch (error) {
      toast.error("Failed to update wishlist: " + error.message);
    }
  };

  // Close modal when clicking outside
  const handleCloseModal = (e) => {
    if (e.target.classList.contains('modal-backdrop')) {
      setShowModal(false);
    }
  };

  if (!product) {
    return <div className="col">Loading product...</div>;
  }

  const isPoorNutrition = hasPoorNutritionScore(product);

  return (
    <>
      <div 
        className="col" 
        onMouseEnter={() => setIsHovered(true)} 
        onMouseLeave={() => setIsHovered(false)}
      >
        <div 
          className={`card h-100 shadow-sm border-0 rounded-3 overflow-hidden ${isPoorNutrition && isHovered ? 'border border-danger' : ''}`}
          onClick={() => setShowModal(true)}
          style={{ cursor: 'pointer' }}
        >
          {/* Product badges */}
          <div className="position-absolute d-flex justify-content-between w-100 px-3 pt-3">
            <div>
              {product.isNewArrival && (
                <span className="badge bg-dark rounded-pill px-3 py-2 me-2">
                  NEW
                </span>
              )}
              {product.nutrition_grade_fr && (
                <span className={`badge ${getNutriScoreColor(product.nutrition_grade_fr)} rounded-pill px-3 py-2`}>
                  Nutri-Score {product.nutrition_grade_fr.toUpperCase()}
                </span>
              )}
            </div>
          </div>
          
          {/* Product image */}
          <div className="text-center bg-light p-3" style={{ height: "200px" }}>
            <img
              src={product.imageUrl || "https://placehold.co/400x400?text=No+Image"}
              className="h-100"
              alt={product.name}
              style={{ objectFit: "contain", maxWidth: "100%" }}
            />
          </div>
          
          {/* Nutrition warning overlay */}
          {isPoorNutrition && isHovered && (
            <div className="position-absolute start-0 end-0 bottom-0 p-2 bg-danger bg-opacity-75 text-white">
              <div className="d-flex align-items-center">
                <FaExclamationTriangle className="me-2" />
                <small>Low nutritional quality (Nutri-Score {product.nutrition_grade_fr.toUpperCase()})</small>
              </div>
            </div>
          )}
          
          {/* Product details */}
          <div className="card-body d-flex flex-column">
            <div className="mb-2">
              {product.category && (
                <span className="badge bg-secondary rounded-pill me-1">{product.category}</span>
              )}
              {product.organicCertified && (
                <span className="badge bg-success rounded-pill ms-1">
                  <FaLeaf className="me-1" /> Organic
                </span>
              )}
              {product.glutenFree && (
                <span className="badge bg-info rounded-pill ms-1">Gluten-Free</span>
              )}
              {product.veganFriendly && (
                <span className="badge bg-primary rounded-pill ms-1">Vegan</span>
              )}
            </div>
            
            <h5 className="card-title fw-bold mb-1">{product.name || "Unnamed Product"}</h5>
            
            <p className="card-text small text-muted mb-3">
              {product.description && (product.description.length > 60
                ? product.description.substring(0, 60) + "..."
                : product.description)}
            </p>
            
            <div className="mt-auto">
              <div className="d-flex align-items-center justify-content-between mb-3">
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
              <div className="d-flex gap-2" onClick={(e) => e.stopPropagation()}>
                {product.stock <= 0 ? (
                  // Out of stock button
                  <button
                    className="btn btn-secondary flex-grow-1 d-flex align-items-center justify-content-center"
                    disabled={true}
                  >
                    Out of Stock
                  </button>
                ) : (
                  // Two options: Add to Cart button or Quantity selector
                  <div className="flex-grow-1">
                    {quantity === 0 ? (
                      // Add to Cart button when not in cart
                      <button
                        className="btn btn-primary w-100 d-flex align-items-center justify-content-center"
                        onClick={handleAddOrUpdateCart}
                        disabled={updating}
                      >
                        {updating ? (
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        ) : (
                          <FaShoppingCart className="me-2" />
                        )}
                        Add to Cart
                      </button>
                    ) : (
                      // Quantity selector when in cart
                      <div className="d-flex align-items-center justify-content-center border border-warning rounded-pill overflow-hidden" style={{ height: "38px" }}>
                        <button
                          className="btn btn-link text-dark border-0 p-0 d-flex align-items-center justify-content-center"
                          style={{ width: "38px", height: "38px" }}
                          onClick={handleDecreaseQuantity}
                          disabled={updating}
                        >
                          <FaMinus size={12} />
                        </button>
                        <div className="px-3 text-center fw-bold" style={{ minWidth: "30px" }}>
                          {updating ? (
                            <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                          ) : (
                            <span>{quantity}</span>
                          )}
                        </div>
                        <button
                          className="btn btn-link text-dark border-0 p-0 d-flex align-items-center justify-content-center"
                          style={{ width: "38px", height: "38px" }}
                          onClick={handleAddOrUpdateCart}
                          disabled={updating || quantity >= product.stock}
                        >
                          <FaPlus size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Wishlist button */}
                <button
                  className={`btn ${isInUserWishlist ? 'btn-danger' : 'btn-outline-danger'}`}
                  onClick={handleToggleWishlist}
                  disabled={checkingWishlist}
                  title={isInUserWishlist ? "Remove from wishlist" : "Add to wishlist"}
                >
                  {checkingWishlist ? (
                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                  ) : (
                    <FaHeart />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Product Detail Modal */}
     {/* Product Detail Modal */}
     {showModal && (
        <div className="modal-backdrop" 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1050
          }}
          onClick={handleCloseModal}
        >
          <div 
            className="modal-content bg-white rounded-4 shadow"
            style={{
              width: '95%',
              maxWidth: '1000px',
              maxHeight: '90vh',
              overflow: 'auto',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="position-absolute top-0 end-0 p-3 z-3">
              <button 
                className="btn btn-sm btn-outline-secondary rounded-circle"
                onClick={() => setShowModal(false)}
              >
                <FaTimes />
              </button>
            </div>

            <div className="row g-0">
              {/* Product Image */}
              <div className="col-md-5 bg-light">
                <div className="p-4 h-100 d-flex flex-column">
                  <div className="d-flex align-items-center justify-content-center flex-grow-1">
                    <img
                      src={product.imageUrl || "https://placehold.co/600x600?text=No+Image"}
                      className="img-fluid"
                      alt={product.name}
                      style={{ maxHeight: "350px", objectFit: "contain" }}
                    />
                  </div>
                  
                  {/* Nutrition Score Badge */}
                  {product.nutrition_grade_fr && (
                    <div className="mt-3 text-center">
                      <div className={`d-inline-block p-3 rounded-circle ${getNutriScoreColor(product.nutrition_grade_fr)}`} style={{width: '70px', height: '70px'}}>
                        <div className="fw-bold text-white fs-2">{product.nutrition_grade_fr.toUpperCase()}</div>
                      </div>
                      <div className="mt-2">
                        <span className="fw-medium">Nutri-Score</span>
                        <div className="small text-muted">
                          {product.nutrition_score && `Score: ${product.nutrition_score.toFixed(1)}`}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Product Details */}
              <div className="col-md-7">
                <div className="p-4">
                  {/* Category & Badges */}
                  <div className="mb-3 d-flex flex-wrap gap-1">
                    {product.category && (
                      <span className="badge bg-secondary rounded-pill">{product.category}</span>
                    )}
                    {product.organicCertified && (
                      <span className="badge bg-success rounded-pill">
                        <FaLeaf className="me-1" /> Organic
                      </span>
                    )}
                    {product.glutenFree && (
                      <span className="badge bg-info rounded-pill">Gluten-Free</span>
                    )}
                    {product.veganFriendly && (
                      <span className="badge bg-primary rounded-pill">Vegan</span>
                    )}
                    {product.isNewArrival && (
                      <span className="badge bg-dark rounded-pill">NEW</span>
                    )}
                    {product.isFeatured && (
                      <span className="badge bg-warning text-dark rounded-pill">Featured</span>
                    )}
                  </div>

                  {/* Product Title */}
                  <h2 className="fw-bold mb-2">{product.name}</h2>

                  {/* Product weight/size if available */}
                  {product.weight && (
                    <div className="text-muted mb-2">
                      Weight: {product.weight}g
                    </div>
                  )}

                  {/* Price and Stock */}
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h3 className="fw-bold mb-0">{formatCurrency(product.price)}</h3>
                    <div>
                      {product.stock > 0 ? (
                        <span className="badge bg-success px-2 py-1">
                          In Stock ({product.stock} available)
                        </span>
                      ) : (
                        <span className="badge bg-danger px-2 py-1">Out of Stock</span>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  <div className="mb-4">
                    <h5 className="fw-bold">Description</h5>
                    <p>{product.description || "No description available"}</p>
                  </div>

                  {/* Tags */}
                  {product.tags && product.tags.length > 0 && (
                    <div className="mb-4">
                      <h5 className="fw-bold">Tags</h5>
                      <div className="d-flex flex-wrap gap-1">
                        {product.tags.map((tag, index) => (
                          <span key={index} className="badge bg-light text-dark border">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Action buttons */}
                  <div className="d-flex gap-2 mt-4 mb-4" onClick={(e) => e.stopPropagation()}>
                    {product.stock <= 0 ? (
                      // Out of stock button
                      <button
                        className="btn btn-secondary flex-grow-1 d-flex align-items-center justify-content-center"
                        disabled={true}
                      >
                        Out of Stock
                      </button>
                    ) : (
                      // Two options: Add to Cart button or Quantity selector
                      <div className="flex-grow-1">
                        {quantity === 0 ? (
                          // Add to Cart button when not in cart
                          <button
                            className="btn btn-primary w-100 d-flex align-items-center justify-content-center py-2"
                            onClick={handleAddOrUpdateCart}
                            disabled={updating}
                          >
                            {updating ? (
                              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            ) : (
                              <FaShoppingCart className="me-2" />
                            )}
                            Add to Cart
                          </button>
                        ) : (
                          // Quantity selector when in cart
                          <div className="d-flex align-items-center">
                            <div className="d-flex align-items-center justify-content-center border border-warning rounded-pill overflow-hidden" style={{ height: "42px" }}>
                              <button
                                className="btn btn-link text-dark border-0 p-0 d-flex align-items-center justify-content-center"
                                style={{ width: "42px", height: "42px" }}
                                onClick={handleDecreaseQuantity}
                                disabled={updating}
                              >
                                <FaMinus size={14} />
                              </button>
                              <div className="px-3 text-center fw-bold" style={{ minWidth: "40px" }}>
                                {updating ? (
                                  <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                ) : (
                                  <span>{quantity}</span>
                                )}
                              </div>
                              <button
                                className="btn btn-link text-dark border-0 p-0 d-flex align-items-center justify-content-center"
                                style={{ width: "42px", height: "42px" }}
                                onClick={handleAddOrUpdateCart}
                                disabled={updating || quantity >= product.stock}
                              >
                                <FaPlus size={14} />
                              </button>
                            </div>
                            <span className="ms-3">In Your Cart</span>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Wishlist button */}
                    <button
                      className={`btn ${isInUserWishlist ? 'btn-danger' : 'btn-outline-danger'} px-4`}
                      onClick={handleToggleWishlist}
                      disabled={checkingWishlist}
                    >
                      {checkingWishlist ? (
                        <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                      ) : (
                        <>
                          <FaHeart className="me-2" />
                          {isInUserWishlist ? 'Saved' : 'Save'}
                        </>
                      )}
                    </button>
                  </div>

                  {/* Tabs for detailed information */}
                  <ul className="nav nav-tabs" id="productTabs" role="tablist">
                    <li className="nav-item" role="presentation">
                      <button className="nav-link active" id="nutrition-tab" data-bs-toggle="tab" data-bs-target="#nutrition" type="button" role="tab">
                        Nutrition
                      </button>
                    </li>
                    <li className="nav-item" role="presentation">
                      <button className="nav-link" id="ingredients-tab" data-bs-toggle="tab" data-bs-target="#ingredients" type="button" role="tab">
                        Ingredients
                      </button>
                    </li>
                    <li className="nav-item" role="presentation">
                      <button className="nav-link" id="additionalInfo-tab" data-bs-toggle="tab" data-bs-target="#additionalInfo" type="button" role="tab">
                        Additional Info
                      </button>
                    </li>
                  </ul>
                  
                  <div className="tab-content p-3 border border-top-0 rounded-bottom mb-3">
                    {/* Nutrition Tab */}
                    <div className="tab-pane fade show active" id="nutrition" role="tabpanel" aria-labelledby="nutrition-tab">
                      {product.nutrition_grade_fr && (
                        <div className={`alert ${isPoorNutrition ? 'alert-danger' : 'alert-success'} mb-3`}>
                          {isPoorNutrition ? (
                            <div className="d-flex align-items-center">
                              <FaExclamationTriangle className="me-2" />
                              <span>This product has a low nutritional quality score.</span>
                            </div>
                          ) : (
                            <div className="d-flex align-items-center">
                              <FaLeaf className="me-2" />
                              <span>This product has a good nutritional quality score.</span>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* Nutrition Table */}
                      <div className="table-responsive">
                        <table className="table table-bordered">
                          <thead className="table-light">
                            <tr>
                              <th>Nutrient</th>
                              <th>Per 100g</th>
                            </tr>
                          </thead>
                          <tbody>
                            {product.energy_100g && (
                              <tr>
                                <td>Energy</td>
                                <td>{product.energy_100g} kcal</td>
                              </tr>
                            )}
                            {product.fat_100g !== undefined && (
                              <tr>
                                <td>Fat</td>
                                <td>{product.fat_100g}g</td>
                              </tr>
                            )}
                            {product['saturated-fat_100g'] !== undefined && (
                              <tr>
                                <td>Saturated Fat</td>
                                <td>{product['saturated-fat_100g']}g</td>
                              </tr>
                            )}
                            {product.carbohydrates_100g !== undefined && (
                              <tr>
                                <td>Carbohydrates</td>
                                <td>{product.carbohydrates_100g}g</td>
                              </tr>
                            )}
                            {product.sugars_100g !== undefined && (
                              <tr>
                                <td>Sugars</td>
                                <td>{product.sugars_100g}g</td>
                              </tr>
                            )}
                            {product.fiber_100g !== undefined && (
                              <tr>
                                <td>Fiber</td>
                                <td>{product.fiber_100g}g</td>
                              </tr>
                            )}
                            {product.proteins_100g !== undefined && (
                              <tr>
                                <td>Proteins</td>
                                <td>{product.proteins_100g}g</td>
                              </tr>
                            )}
                            {product.salt_100g !== undefined && (
                              <tr>
                                <td>Salt</td>
                                <td>{product.salt_100g}g</td>
                              </tr>
                            )}
                            {product.sodium_100g !== undefined && (
                              <tr>
                                <td>Sodium</td>
                                <td>{product.sodium_100g}g</td>
                              </tr>
                            )}
                            {product.iron_100g !== undefined && (
                              <tr>
                                <td>Iron</td>
                                <td>{product.iron_100g}g</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                    
                    {/* Ingredients Tab */}
                    <div className="tab-pane fade" id="ingredients" role="tabpanel" aria-labelledby="ingredients-tab">
                      {/* Ingredients text */}
                      {product.ingredients_text ? (
                        <div>
                          <h6 className="fw-bold">Ingredients:</h6>
                          <p style={{ whiteSpace: 'pre-line' }}>{product.ingredients_text}</p>
                        </div>
                      ) : (
                        <p className="text-muted">No ingredients information available</p>
                      )}
                      
                      {/* Additives */}
                      {product.additives && (
                        <div className="mt-3">
                          <h6 className="fw-bold">Additives:</h6>
                          <p>{product.additives}</p>
                          {product.additives_n && (
                            <div className="small text-muted">Number of additives: {product.additives_n}</div>
                          )}
                        </div>
                      )}
                      
                      {/* Allergens */}
                      {product.allergens && (
                        <div className="mt-3">
                          <h6 className="fw-bold">Allergens:</h6>
                          <div className="alert alert-warning">
                            {product.allergens.split(',').map((allergen, index) => (
                              <span key={index} className="badge bg-warning text-dark me-2 mb-1">
                                {allergen.trim()}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Additional Info Tab */}
                    <div className="tab-pane fade" id="additionalInfo" role="tabpanel" aria-labelledby="additionalInfo-tab">
                      <div className="row">
                        <div className="col-md-6">
                          <h6 className="fw-bold">Product Information</h6>
                          <ul className="list-group list-group-flush">
                            {product.category && (
                              <li className="list-group-item d-flex justify-content-between px-0">
                                <span>Category:</span>
                                <span className="fw-medium">{product.category}</span>
                              </li>
                            )}
                            {product.weight && (
                              <li className="list-group-item d-flex justify-content-between px-0">
                                <span>Weight:</span>
                                <span className="fw-medium">{product.weight}g</span>
                              </li>
                            )}
                            {product.viewCount !== undefined && (
                              <li className="list-group-item d-flex justify-content-between px-0">
                                <span>Views:</span>
                                <span className="fw-medium">{product.viewCount}</span>
                              </li>
                            )}
                            {product.stock !== undefined && (
                              <li className="list-group-item d-flex justify-content-between px-0">
                                <span>Stock:</span>
                                <span className="fw-medium">{product.stock} units</span>
                              </li>
                            )}
                          </ul>
                        </div>
                        <div className="col-md-6">
                          <h6 className="fw-bold">Features</h6>
                          <ul className="list-group list-group-flush">
                            <li className="list-group-item d-flex justify-content-between px-0">
                              <span>Organic:</span>
                              <span className="fw-medium">{product.organicCertified ? 'Yes' : 'No'}</span>
                            </li>
                            <li className="list-group-item d-flex justify-content-between px-0">
                              <span>Gluten Free:</span>
                              <span className="fw-medium">{product.glutenFree ? 'Yes' : 'No'}</span>
                            </li>
                            <li className="list-group-item d-flex justify-content-between px-0">
                              <span>Vegan Friendly:</span>
                              <span className="fw-medium">{product.veganFriendly ? 'Yes' : 'No'}</span>
                            </li>
                            <li className="list-group-item d-flex justify-content-between px-0">
                              <span>New Arrival:</span>
                              <span className="fw-medium">{product.isNewArrival ? 'Yes' : 'No'}</span>
                            </li>
                          </ul>
                        </div>
                      </div>
                      
                      {/* Timestamps */}
                      <div className="mt-3 small text-muted">
                        {product.createdAt && (
                          <div>Added: {product.createdAt.toDate ? product.createdAt.toDate().toLocaleString() : product.createdAt}</div>
                        )}
                        {product.updatedAt && (
                          <div>Last updated: {product.updatedAt.toDate ? product.updatedAt.toDate().toLocaleString() : product.updatedAt}</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProductCard;