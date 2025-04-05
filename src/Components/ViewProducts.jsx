import React, { useState } from "react";
import { FaHeart, FaShoppingCart, FaSearch, FaFilter, FaStar } from "react-icons/fa";
import { addToCart, addToWishlist } from "../api/userService";
import { useAuth } from "../context/Authcontext";
import { toast } from "react-toastify";

const ViewProducts = ({ products = [], loading = false, error = "" }) => {
  const { currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [priceSort, setPriceSort] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Get unique categories from products
  const categories = [...new Set(products.map((product) => product.category))];

  // Handle adding to cart
  const handleAddToCart = async (product) => {
    try {
      if (!currentUser) {
        toast.error("Please log in to add items to your cart");
        return;
      }
      
      await addToCart(currentUser.uid, product.id);
      toast.success(`${product.name} added to cart!`);
    } catch (error) {
      toast.error("Failed to add to cart: " + error.message);
    }
  };

  // Handle adding to wishlist
  const handleAddToWishlist = async (product) => {
    try {
      if (!currentUser) {
        toast.error("Please log in to add items to your wishlist");
        return;
      }
      
      await addToWishlist(currentUser.uid, product.id);
      toast.success(`${product.name} added to wishlist!`);
    } catch (error) {
      toast.error("Failed to add to wishlist: " + error.message);
    }
  };

  // Filter and sort products
  const filteredProducts = products
    .filter((product) => {
      // Apply search term filter
      if (
        searchTerm &&
        !product.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !product.description.toLowerCase().includes(searchTerm.toLowerCase())
      ) {
        return false;
      }
      
      // Apply category filter
      if (categoryFilter && product.category !== categoryFilter) {
        return false;
      }
      
      return true;
    })
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

  // Format currency
  const formatCurrency = (price) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(price);
  };

  // Calculate discount percentage if applicable
  const calculateDiscount = (basePrice, currentPrice) => {
    if (basePrice > currentPrice) {
      const discount = ((basePrice - currentPrice) / basePrice) * 100;
      return Math.round(discount);
    }
    return 0;
  };

  return (
    <div className="product-catalog">
      {error && <div className="alert alert-danger">{error}</div>}

      {/* Search and filter bar */}
      <div className="mb-4">
        <div className="row g-3">
          <div className="col-md-6">
            <div className="input-group">
              <span className="input-group-text bg-dark text-white">
                <FaSearch />
              </span>
              <input
                type="text"
                className="form-control border-dark"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
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
      {loading && (
        <div className="text-center py-5">
          <div className="spinner-border text-dark" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading products...</p>
        </div>
      )}

      {/* No products found */}
      {!loading && filteredProducts.length === 0 && (
        <div className="text-center py-5">
          <div className="mb-3">
            <img
              src="https://cdn-icons-png.flaticon.com/512/7486/7486754.png"
              alt="No products"
              style={{ width: "120px", opacity: "0.5" }}
            />
          </div>
          <h5>No products found</h5>
          <p className="text-muted">
            Try adjusting your search or filter criteria
          </p>
        </div>
      )}

      {/* Products grid */}
      <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
        {filteredProducts.map((product) => (
          <div key={product.id} className="col">
            <div className="card h-100 shadow-sm border-0 rounded-3 overflow-hidden">
              {/* Product badges */}
              <div className="position-absolute d-flex justify-content-between w-100 px-3 pt-3 z-1">
                {product.isNewArrival && (
                  <span className="badge bg-dark rounded-pill px-3 py-2">
                    NEW ARRIVAL
                  </span>
                )}
                {calculateDiscount(product.basePrice, product.currentPrice) > 0 && (
                  <span className="badge bg-danger rounded-pill ms-auto px-3 py-2">
                    −{calculateDiscount(product.basePrice, product.currentPrice)}%
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
                
                <p className="card-text small text-muted mb-3">
                  {product.description.length > 60
                    ? product.description.substring(0, 60) + "..."
                    : product.description}
                </p>
                
                <div className="mt-auto">
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <div>
                      <h4 className="fw-bold mb-0">{formatCurrency(product.currentPrice)}</h4>
                      {product.basePrice !== product.currentPrice && (
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
                      className="btn btn-outline-danger"
                      onClick={() => handleAddToWishlist(product)}
                      title="Add to wishlist"
                    >
                      <FaHeart />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ViewProducts;