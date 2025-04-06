import React, { useState, useEffect, useRef } from "react";
import { FaHeart, FaShoppingCart, FaSearch, FaFilter, FaStar, FaTimes, FaLightbulb } from "react-icons/fa";
import { 
  addToCart, 
  addToWishlist, 
  removeFromWishlist, 
  isInWishlist,
  saveSearchHistory,
  getSearchHistory,
  deleteSearchTerm,
  getRecentCartItems,
  getWishlistItems,
  generateRecommendations
} from "../api/userService";
import { useAuth } from "../context/Authcontext";
import { toast } from "react-toastify";

const ViewProducts = ({ products = [], loading = false, error = "" }) => {
  const { currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [appliedSearchTerm, setAppliedSearchTerm] = useState(""); // Track the currently applied search
  const [categoryFilter, setCategoryFilter] = useState("");
  const [priceSort, setPriceSort] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [wishlistItems, setWishlistItems] = useState([]);
  const [checkingWishlist, setCheckingWishlist] = useState(true);
  const [searchHistory, setSearchHistory] = useState([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const searchInputRef = useRef(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [hasRecommendations, setHasRecommendations] = useState(false);

  // Get unique categories from products
  const categories = [...new Set(products.map((product) => product.category))];

  const handleClearSearch = () => {
    setAppliedSearchTerm("");
    setSearchTerm("");
  };
  
  // Check which products are in wishlist
  useEffect(() => {
    const checkWishlistItems = async () => {
      if (!currentUser) {
        setWishlistItems([]);
        setCheckingWishlist(false);
        return;
      }

      try {
        const promises = products.map(product => 
          isInWishlist(currentUser.uid, product.id)
        );
        
        const results = await Promise.all(promises);
        
        const wishlistProductIds = products
          .filter((_, index) => results[index])
          .map(product => product.id);
        
        setWishlistItems(wishlistProductIds);
      } catch (error) {
        console.error("Error checking wishlist:", error);
      } finally {
        setCheckingWishlist(false);
      }
    };

    checkWishlistItems();
  }, [currentUser, products]);

  // Load search history when component mounts
  useEffect(() => {
    const fetchSearchHistory = async () => {
      if (currentUser) {
        const history = await getSearchHistory(currentUser.uid);
        setSearchHistory(history);
      }
    };

    fetchSearchHistory();
  }, [currentUser]);

  // Get personalized recommendations
  useEffect(() => {
    const fetchRecommendations = async () => {
      if (!currentUser || !products.length) {
        setRecommendations([]);
        setHasRecommendations(false);
        return;
      }
      
      setLoadingRecommendations(true);
      try {
        const userRecommendations = await generateRecommendations(currentUser.uid, products);
        setRecommendations(userRecommendations);
        setHasRecommendations(userRecommendations.length > 0);
      } catch (error) {
        console.error("Error fetching recommendations:", error);
      } finally {
        setLoadingRecommendations(false);
      }
    };

    fetchRecommendations();
  }, [currentUser, products]);

  // Handle search input focus
  const handleSearchInputFocus = () => {
    if (currentUser && searchHistory.length > 0) {
      setShowSearchDropdown(true);
    }
  };

  const handleSearchInputChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    // If search input is cleared, also clear the applied search term
    if (!value.trim()) {
      setAppliedSearchTerm("");
    }
  };

  // Handle search input blur
  const handleSearchInputBlur = () => {
    // Delay hiding the dropdown to allow clicking on items
    setTimeout(() => {
      setShowSearchDropdown(false);
    }, 200);
  };

  // Handle search form submission
  const handleSearchSubmit = async (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      // Save search to history
      if (currentUser) {
        await saveSearchHistory(currentUser.uid, searchTerm);
        // Refresh search history
        const history = await getSearchHistory(currentUser.uid);
        setSearchHistory(history);
      }
      
      // Apply search term filter
      setAppliedSearchTerm(searchTerm);
      setShowSearchDropdown(false);
    }
  };

  // Handle clicking on a search history item
  const handleHistoryItemClick = async (term) => {
    setSearchTerm(term);
    setShowSearchDropdown(false);
    
    // Save to history and apply search
    if (currentUser) {
      await saveSearchHistory(currentUser.uid, term);
      const history = await getSearchHistory(currentUser.uid);
      setSearchHistory(history);
    }
    
    // Apply search term immediately
    setAppliedSearchTerm(term);
  };

  // Handle deleting a search term from history
  const handleDeleteSearchTerm = async (e, term) => {
    e.stopPropagation(); // Prevent triggering the parent click
    if (currentUser) {
      await deleteSearchTerm(currentUser.uid, term);
      // Refresh search history
      const history = await getSearchHistory(currentUser.uid);
      setSearchHistory(history);
    }
  };

  // Handle adding to cart
  const handleAddToCart = async (product) => {
    try {
      if (!currentUser) {
        toast.error("Please log in to add items to your cart");
        return;
      }
      
      await addToCart(currentUser.uid, product.id);
      toast.success(`${product.name} added to cart!`);
      
      // Refresh recommendations after adding to cart
      const userRecommendations = await generateRecommendations(currentUser.uid, products);
      setRecommendations(userRecommendations);
      setHasRecommendations(userRecommendations.length > 0);
    } catch (error) {
      toast.error("Failed to add to cart: " + error.message);
    }
  };

  // Handle toggling wishlist
  const handleToggleWishlist = async (product) => {
    try {
      if (!currentUser) {
        toast.error("Please log in to use the wishlist");
        return;
      }
      
      const isProductInWishlist = wishlistItems.includes(product.id);
      
      if (isProductInWishlist) {
        // Remove from wishlist
        await removeFromWishlist(currentUser.uid, product.id);
        setWishlistItems(wishlistItems.filter(id => id !== product.id));
        toast.success(`${product.name} removed from wishlist`);
      } else {
        // Add to wishlist
        await addToWishlist(currentUser.uid, product.id);
        setWishlistItems([...wishlistItems, product.id]);
        toast.success(`${product.name} added to wishlist!`);
      }
      
      // Refresh recommendations after updating wishlist
      const userRecommendations = await generateRecommendations(currentUser.uid, products);
      setRecommendations(userRecommendations);
      setHasRecommendations(userRecommendations.length > 0);
    } catch (error) {
      toast.error("Failed to update wishlist: " + error.message);
    }
  };

  // Filter and organize products
  const organizeProducts = () => {
    // First, filter all products based on current filters
    const filteredProducts = products.filter((product) => {
      // Apply search term filter
      if (
        appliedSearchTerm &&
        !product.name.toLowerCase().includes(appliedSearchTerm.toLowerCase()) &&
        !product.description.toLowerCase().includes(appliedSearchTerm.toLowerCase())
      ) {
        return false;
      }
      
      // Apply category filter
      if (categoryFilter && product.category !== categoryFilter) {
        return false;
      }
      
      return true;
    });

    // For non-authenticated users or when no recommendations exist, just return filtered products
    if (!currentUser || !hasRecommendations) {
      return {
        recommendedProducts: [],
        otherProducts: filteredProducts.sort((a, b) => {
          // Apply price sorting
          if (priceSort === "low-to-high") {
            return a.currentPrice - b.currentPrice;
          } else if (priceSort === "high-to-low") {
            return b.currentPrice - a.currentPrice;
          }
          
          // Default: sort by newest
          return new Date(b.createdAt) - new Date(a.createdAt);
        })
      };
    }

    // Get recommended products that pass the filter
    const recommendedProductIds = new Set(recommendations.map(rec => rec.id));
    const recommendedProducts = filteredProducts
      .filter(product => recommendedProductIds.has(product.id))
      .map(product => {
        // Find matching recommendation to get score and reason
        const recommendation = recommendations.find(rec => rec.id === product.id);
        return {
          ...product,
          recommendationScore: recommendation ? recommendation.recommendationScore : 0,
          recommendationReason: recommendation ? recommendation.recommendationReason : []
        };
      })
      .sort((a, b) => b.recommendationScore - a.recommendationScore);
    
    // Get other products (non-recommended)
    const otherProducts = filteredProducts
      .filter(product => !recommendedProductIds.has(product.id))
      .sort((a, b) => {
        // Apply price sorting
        if (priceSort === "low-to-high") {
          return a.currentPrice - b.currentPrice;
        } else if (priceSort === "high-to-low") {
          return b.currentPrice - a.currentPrice;
        }
        
        // Default: sort by newest
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
    
    return { recommendedProducts, otherProducts };
  };

  // Get the organized products
  const { recommendedProducts, otherProducts } = organizeProducts();

  // Format recommendation reason
  const formatRecommendationReason = (reasons) => {
    if (!reasons || reasons.length === 0) return "";

    const reasonsMap = {
      "search:": "Based on your searches for",
      "cart:": "Similar to items in your cart",
      "wishlist:": "Similar to items in your wishlist",
      "overlap:": "Matches multiple interests"
    };

    // Get the first reason for display
    const firstReason = reasons[0];
    
    for (const [prefix, text] of Object.entries(reasonsMap)) {
      if (firstReason.startsWith(prefix)) {
        const value = firstReason.substring(prefix.length);
        return value ? `${text} "${value}"` : text;
      }
    }
    
    return "Recommended for you";
  };

  // Format currency
  const formatCurrency = (price) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(price);
  };

  // Render product card
  const renderProductCard = (product) => {
    // Check if product has discount
    const hasDiscount = product.basePrice > product.currentPrice;
    const discountPercentage = hasDiscount 
      ? Math.round(((product.basePrice - product.currentPrice) / product.basePrice) * 100) 
      : 0;
    
    // Check if product is in wishlist
    const isInUserWishlist = wishlistItems.includes(product.id);
    
    // Format recommendation reason if available
    const recommendationReason = product.recommendationReason 
      ? formatRecommendationReason(product.recommendationReason)
      : "";
    
    // Check if this is a recommended product
    const isRecommended = product.recommendationScore > 0;
    
    return (
      <div key={product.id} className="col">
        <div className={`card h-100 shadow-sm border-0 rounded-3 overflow-hidden ${isRecommended ? 'border border-primary' : ''}`}>
          {/* Product badges */}
          <div className="position-absolute d-flex justify-content-between w-100 px-3 pt-3 z-1">
            <div>
              {product.isNewArrival && (
                <span className="badge bg-dark rounded-pill px-3 py-2 me-2">
                  NEW ARRIVAL
                </span>
              )}
              {isRecommended && (
                <span className="badge bg-primary rounded-pill px-3 py-2">
                  <FaLightbulb className="me-1" /> FOR YOU
                </span>
              )}
            </div>
            {hasDiscount && (
              <span className="badge bg-danger rounded-pill ms-auto px-3 py-2">
                −{discountPercentage}%
              </span>
            )}
          </div>
          
          {/* Product image */}
          <div style={{ height: "280px", backgroundColor: "#f8f9fa" }}>
            <img
              src={product.imageUrl || "https://placehold.co/400x400?text=No+Image"}
              className="w-100 h-100"
              alt={product.name}
              style={{ objectFit: "contain" }}
            />
          </div>
          
          {/* Product details */}
          <div className="card-body d-flex flex-column">
            <div className="mb-2">
              <span className="badge bg-secondary rounded-pill">{product.category}</span>
              {product.demandScore > 0 && (
                <span className="ms-2">
                  <FaStar className="text-warning me-1" />
                  <small>{product.demandScore}/10</small>
                </span>
              )}
            </div>
            
            <h5 className="card-title fw-bold mb-1">{product.name}</h5>
            
            {/* Recommendation reason if available */}
            {recommendationReason && (
              <div className="mb-2">
                <small className="text-primary d-flex align-items-center">
                  <FaLightbulb className="me-1" />
                  {recommendationReason}
                </small>
              </div>
            )}
            
            <p className="card-text small text-muted mb-3">
              {product.description.length > 60
                ? product.description.substring(0, 60) + "..."
                : product.description}
            </p>
            
            <div className="mt-auto">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <div>
                  <h4 className="fw-bold mb-0">{formatCurrency(product.currentPrice)}</h4>
                  {hasDiscount && (
                    <div>
                      <span className="text-decoration-line-through text-muted">
                        {formatCurrency(product.basePrice)}
                      </span>
                    </div>
                  )}
                </div>
                <div>
                  {product.stock > 0 ? (
                    <span className="badge bg-success px-3 py-2">IN STOCK</span>
                  ) : (
                    <span className="badge bg-danger px-3 py-2">OUT OF STOCK</span>
                  )}
                </div>
              </div>
              
              {/* Action buttons */}
              <div className="d-flex gap-2">
                <button
                  className="btn btn-dark flex-grow-1 d-flex align-items-center justify-content-center"
                  onClick={() => handleAddToCart(product)}
                  disabled={product.stock <= 0}
                >
                  <FaShoppingCart className="me-2" />
                  Add to Cart
                </button>
                <button
                  className={`btn ${isInUserWishlist ? 'btn-danger' : 'btn-outline-danger'}`}
                  onClick={() => handleToggleWishlist(product)}
                  title={isInUserWishlist ? "Remove from wishlist" : "Add to wishlist"}
                >
                  <FaHeart />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="product-catalog">
      {error && <div className="alert alert-danger">{error}</div>}
  
      {/* Search and filter bar */}
      <div className="mb-4">
        <div className="row g-3">
          <div className="col-md-6">
            <form onSubmit={handleSearchSubmit}>
              <div className="position-relative">
                <div className="input-group">
                  <span className="input-group-text bg-dark text-white">
                    <FaSearch />
                  </span>
                  <input
                    type="text"
                    className="form-control border-dark"
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => {
                      const value = e.target.value;
                      setSearchTerm(value);
                      // If search bar is cleared manually, reset the applied search filter
                      if (!value.trim()) {
                        setAppliedSearchTerm("");
                      }
                    }}
                    onFocus={handleSearchInputFocus}
                    onBlur={handleSearchInputBlur}
                    ref={searchInputRef}
                  />
                  <button 
                    type="submit" 
                    className="btn btn-dark" 
                  >
                    Search
                  </button>
                </div>
                
                {/* Search history dropdown - Amazon style */}
                {showSearchDropdown && searchHistory.length > 0 && (
                  <div 
                    style={{
                      position: 'absolute', 
                      width: '100%', 
                      marginTop: '2px', 
                      backgroundColor: 'white', 
                      border: '1px solid #dee2e6', 
                      borderRadius: '4px', 
                      boxShadow: '0 2px 5px rgba(0,0,0,0.15)', 
                      zIndex: 1000
                    }}
                  >
                    {searchHistory.map((item, index) => (
                      <div 
                        key={index}
                        style={{
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center', 
                          padding: '10px 15px', 
                          borderBottom: index < searchHistory.length - 1 ? '1px solid #dee2e6' : 'none', 
                          cursor: 'pointer'
                        }}
                        onClick={() => handleHistoryItemClick(item.term)}
                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', color: '#551A8B' }}>
                          <span>{item.term}</span>
                        </div>
                        <button 
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#6c757d',
                            padding: '0',
                            marginLeft: '15px',
                            cursor: 'pointer'
                          }}
                          onClick={(e) => handleDeleteSearchTerm(e, item.term)}
                          title="Remove from history"
                        >
                          <FaTimes />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </form>
            
            {/* Applied search term indicator */}
            {appliedSearchTerm && (
              <div className="mt-2">
                <span className="text-muted">
                  Search results for: <strong>"{appliedSearchTerm}"</strong>
                </span>
                <button 
                  className="btn btn-sm text-danger border-0 ms-2"
                  onClick={() => {
                    setAppliedSearchTerm("");
                    setSearchTerm("");
                  }}
                  style={{ padding: '0', background: 'none' }}
                >
                  <FaTimes /> Clear
                </button>
              </div>
            )}
          </div>
          <div className="col-md-6 d-flex justify-content-end">
            <button
              className="btn btn-outline-dark me-2"
              onClick={() => setShowFilters(!showFilters)}
            >
              <FaFilter className="me-2" />
              Filters
            </button>
            <select
              className="form-select w-auto border-dark"
              value={priceSort}
              onChange={(e) => setPriceSort(e.target.value)}
            >
              <option value="">Sort by</option>
              <option value="low-to-high">Price: Low to High</option>
              <option value="high-to-low">Price: High to Low</option>
            </select>
          </div>
        </div>
        {/* Expandable filters */}
        {showFilters && (
          <div className="row mt-3">
            <div className="col-md-6">
              <div className="card shadow-sm border-dark">
                <div className="card-body">
                  <h6 className="card-title">Filter by Category</h6>
                  <div className="d-flex flex-wrap gap-2">
                    <button
                      className={`btn btn-sm ${
                        categoryFilter === ""
                          ? "btn-dark"
                          : "btn-outline-dark"
                      }`}
                      onClick={() => setCategoryFilter("")}
                    >
                      All
                    </button>
                    {categories.map((category) => (
                      <button
                        key={category}
                        className={`btn btn-sm ${
                          categoryFilter === category
                            ? "btn-dark"
                            : "btn-outline-dark"
                        }`}
                        onClick={() => setCategoryFilter(category)}
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Loading indicator */}
      {(loading || checkingWishlist || loadingRecommendations) && (
        <div className="text-center py-5">
          <div className="spinner-border text-dark" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading products...</p>
        </div>
      )}

      {/* No products found */}
      {!loading && !checkingWishlist && !loadingRecommendations && 
       recommendedProducts.length === 0 && otherProducts.length === 0 && (
        <div className="text-center py-5">
          <div className="mb-3">
            <img
              src="https://cdn-icons-png.flaticon.com/512/7486/7486754.png"
              alt="No products"
              style={{ width: "120px", opacity: "0.5" }}
            />
          </div>
          <h5>No products found</h5>
          {appliedSearchTerm && (
            <p className="text-muted">
              No results for "{appliedSearchTerm}"
            </p>
          )}
          <p className="text-muted">
            Try adjusting your search or filter criteria
          </p>
        </div>
      )}

      {/* Products grid with recommendations at top */}
      {!loading && !checkingWishlist && !loadingRecommendations && (
        <>
          {/* Recommended products section (if any) */}
          {recommendedProducts.length > 0 && (
            <>
              <div className="mb-4 mt-4">
                <div className="d-flex align-items-center">
                  <FaLightbulb className="text-primary me-2" />
                  <h4 className="mb-0">Recommended For You</h4>
                </div>
                <p className="text-muted mt-2">
                  Products personalized to your interests
                </p>
              </div>
              <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4 mb-5">
                {recommendedProducts.map(product => renderProductCard(product))}
              </div>
            </>
          )}
          
          {/* All other products */}
          {otherProducts.length > 0 && (
            <>
              {recommendedProducts.length > 0 && (
                <div className="mb-4">
                  <h4 className="mb-0">All Products</h4>
                </div>
              )}
              <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
                {otherProducts.map(product => renderProductCard(product))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default ViewProducts;