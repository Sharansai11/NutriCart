import React, { useState, useEffect } from "react";
import { FaFilter, FaSort, FaChevronDown, FaChevronUp, FaLeaf, FaTimesCircle, FaSearch } from "react-icons/fa";
import ProductCard from "./ProductCard";
import { getCartItems } from "../api/userService";
import { useAuth } from "../context/Authcontext";

const ProductList = ({ products = [], loading = false, error = "" }) => {
  const { currentUser } = useAuth();
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [sortOption, setSortOption] = useState("newest");
  const [nutriScoreFilter, setNutriScoreFilter] = useState("");
  const [tagFilter, setTagFilter] = useState("");
  const [allergenExclusions, setAllergenExclusions] = useState([]);
  const [priceRange, setPriceRange] = useState([0, 10000]);
  const [organicOnly, setOrganicOnly] = useState(false);
  const [glutenFreeOnly, setGlutenFreeOnly] = useState(false);
  const [veganOnly, setVeganOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [cartItems, setCartItems] = useState({});
  const [loadingCart, setLoadingCart] = useState(false);
  
  // Filter UI state
  const [showFilters, setShowFilters] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    category: true,
    nutrition: true,
    allergens: true,
    price: false,
    tags: false,
    dietary: false
  });

  // Toggle section expansion
  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };
  
  // Extract metadata from products
  const categories = [...new Set(products.map(p => p.category).filter(Boolean))];
  
  const nutriScores = [...new Set(products
    .map(p => p.nutrition_grade_fr?.toUpperCase())
    .filter(Boolean))].sort();
  
  // Get all unique tags from products
  const allTags = [...new Set(
    products.flatMap(p => p.tags || [])
      .map(tag => typeof tag === 'string' ? tag.replace(/^#/, '') : '')
      .filter(Boolean)
  )].sort();
  
  // Get all unique allergens from products
  const allAllergens = [...new Set(
    products.flatMap(p => {
      if (!p.allergens) return [];
      return typeof p.allergens === 'string' 
        ? p.allergens.split(',').map(a => a.trim()) 
        : [];
    }).filter(Boolean)
  )].sort();
  
  // Price range calculation
  const validPrices = products.map(p => p.price || 0).filter(p => !isNaN(p) && p >= 0);
  const minPrice = validPrices.length > 0 ? Math.min(...validPrices) : 0;
  const maxPrice = validPrices.length > 0 ? Math.max(...validPrices) : 10000;
  
  // Initialize price range on component mount
  useEffect(() => {
    setPriceRange([minPrice, maxPrice]);
  }, [minPrice, maxPrice]);
  
  // Load cart items
  useEffect(() => {
    const fetchCartItems = async () => {
      if (!currentUser) {
        setCartItems({});
        return;
      }
      
      try {
        setLoadingCart(true);
        const items = await getCartItems(currentUser.uid);
        
        // Convert to mapping of productId -> quantity for easy lookup
        const cartMapping = {};
        if (items && Array.isArray(items)) {
          items.forEach(item => {
            if (item && item.productId) {
              cartMapping[item.productId] = item.quantity;
            }
          });
        }
        
        setCartItems(cartMapping);
      } catch (error) {
        console.error("Error fetching cart items:", error);
      } finally {
        setLoadingCart(false);
      }
    };
    
    fetchCartItems();
  }, [currentUser]);
  
  // Filter and sort products
  useEffect(() => {
    let result = [...products];
    
    // Text search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(p => {
        const searchIn = [
          p.name,
          p.description,
          p.category,
          p.ingredients_text,
          ...(p.tags || [])
        ].filter(Boolean).map(field => 
          typeof field === 'string' ? field.toLowerCase() : ''
        );
        
        return searchIn.some(text => text.includes(query));
      });
    }
    
    // Category filter
    if (categoryFilter) {
      result = result.filter(p => p.category === categoryFilter);
    }
    
    // Nutri-Score filter
    if (nutriScoreFilter) {
      result = result.filter(p => p.nutrition_grade_fr?.toUpperCase() === nutriScoreFilter);
    }
    
    // Tag filter
    if (tagFilter) {
      result = result.filter(p => {
        const tags = p.tags || [];
        if (!Array.isArray(tags)) return false;
        
        return tags.some(tag => {
          if (typeof tag !== 'string') return false;
          
          const normalizedTag = tag.toLowerCase().replace(/^#/, '');
          const normalizedFilter = tagFilter.toLowerCase();
          return normalizedTag.includes(normalizedFilter);
        });
      });
    }
    
    // Allergen exclusions
    if (allergenExclusions.length > 0) {
      result = result.filter(p => {
        if (!p.allergens) return true; // Keep products with no allergen info
        if (typeof p.allergens !== 'string') return true;
        
        const productAllergens = p.allergens.split(',').map(a => a.trim().toLowerCase());
        return !allergenExclusions.some(exclusion => 
          productAllergens.includes(exclusion.toLowerCase())
        );
      });
    }
    
    // Price range filter
    result = result.filter(p => {
      const price = p.price || 0;
      return price >= priceRange[0] && price <= priceRange[1];
    });
    
    // Dietary filters
    if (organicOnly) {
      result = result.filter(p => p.organicCertified === true);
    }
    
    if (glutenFreeOnly) {
      result = result.filter(p => p.glutenFree === true);
    }
    
    if (veganOnly) {
      result = result.filter(p => p.veganFriendly === true);
    }
    
    // Sorting
    switch (sortOption) {
      case "price-low-high":
        result.sort((a, b) => (a.price || 0) - (b.price || 0));
        break;
      case "price-high-low":
        result.sort((a, b) => (b.price || 0) - (a.price || 0));
        break;
      case "nutri-score-best":
        result.sort((a, b) => {
          const scoreMap = { 'A': 1, 'B': 2, 'C': 3, 'D': 4, 'E': 5 };
          const scoreA = scoreMap[a.nutrition_grade_fr?.toUpperCase()] || 999;
          const scoreB = scoreMap[b.nutrition_grade_fr?.toUpperCase()] || 999;
          return scoreA - scoreB;
        });
        break;
      case "name-a-z":
        result.sort((a, b) => {
          const nameA = typeof a.name === 'string' ? a.name : '';
          const nameB = typeof b.name === 'string' ? b.name : '';
          return nameA.localeCompare(nameB);
        });
        break;
      case "newest":
      default:
        result.sort((a, b) => {
          let dateA, dateB;
          
          try {
            dateA = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
          } catch (e) {
            dateA = new Date(0);
          }
          
          try {
            dateB = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
          } catch (e) {
            dateB = new Date(0);
          }
          
          return dateB - dateA;
        });
        break;
    }
    
    setFilteredProducts(result);
  }, [
    products, 
    searchQuery,
    categoryFilter, 
    nutriScoreFilter, 
    tagFilter, 
    allergenExclusions, 
    sortOption, 
    priceRange, 
    organicOnly, 
    glutenFreeOnly,
    veganOnly
  ]);

  // Reset all filters
  const resetFilters = () => {
    setSearchQuery("");
    setCategoryFilter("");
    setNutriScoreFilter("");
    setTagFilter("");
    setAllergenExclusions([]);
    setPriceRange([minPrice, maxPrice]);
    setOrganicOnly(false);
    setGlutenFreeOnly(false);
    setVeganOnly(false);
    setSortOption("newest");
  };
  
  // Handle allergen toggle
  const toggleAllergen = (allergen) => {
    setAllergenExclusions(prev => {
      if (prev.includes(allergen)) {
        return prev.filter(a => a !== allergen);
      } else {
        return [...prev, allergen];
      }
    });
  };

  // Handle search form submission
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    // The search is already applied via the useEffect when searchQuery changes
  };

  return (
    <div className="product-list">
      {error && <div className="alert alert-danger">{error}</div>}
      
      {/* Search Bar - Always visible */}
      <div className="card shadow-sm mb-4 border-0">
        <div className="card-body bg-light rounded">
          <form onSubmit={handleSearchSubmit}>
            <div className="input-group">
              <input
                type="text"
                className="form-control"
                placeholder="Search products by name, description, tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button className="btn btn-primary" type="submit">
                <FaSearch /> Search
              </button>
            </div>
          </form>
        </div>
      </div>
      
      <div className="row">
        {/* Filters Sidebar */}
        {showFilters && (
          <div className="col-lg-3 mb-4">
            <div className="card shadow-sm border-0">
              <div className="card-header bg-light d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Filters</h5>
                <button 
                  className="btn btn-sm btn-outline-secondary"
                  onClick={resetFilters}
                >
                  Reset All
                </button>
              </div>
              <div className="card-body">
                {/* Categories Section */}
                <div className="mb-3">
                  <div 
                    className="d-flex justify-content-between align-items-center mb-2"
                    onClick={() => toggleSection('category')}
                    style={{ cursor: 'pointer' }}
                  >
                    <h6 className="mb-0">Categories</h6>
                    {expandedSections.category ? <FaChevronUp /> : <FaChevronDown />}
                  </div>
                  
                  {expandedSections.category && (
                    <div className="ps-2 border-start">
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="radio"
                          id="category-all"
                          name="category"
                          checked={categoryFilter === ""}
                          onChange={() => setCategoryFilter("")}
                        />
                        <label className="form-check-label" htmlFor="category-all">
                          All Categories
                        </label>
                      </div>
                      
                      {categories.map((category) => (
                        <div className="form-check" key={category}>
                          <input
                            className="form-check-input"
                            type="radio"
                            id={`category-${category}`}
                            name="category"
                            checked={categoryFilter === category}
                            onChange={() => setCategoryFilter(category)}
                          />
                          <label className="form-check-label" htmlFor={`category-${category}`}>
                            {category}
                          </label>
                          <span className="badge bg-light text-dark ms-1">
                            {products.filter(p => p.category === category).length}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Nutrition Score Section */}
                <div className="mb-3">
                  <div 
                    className="d-flex justify-content-between align-items-center mb-2"
                    onClick={() => toggleSection('nutrition')}
                    style={{ cursor: 'pointer' }}
                  >
                    <h6 className="mb-0">Nutrition Score</h6>
                    {expandedSections.nutrition ? <FaChevronUp /> : <FaChevronDown />}
                  </div>
                  
                  {expandedSections.nutrition && (
                    <div className="ps-2 border-start">
                      <div className="d-flex flex-wrap gap-2">
                        <button
                          className={`btn btn-sm ${
                            nutriScoreFilter === "" ? "btn-dark" : "btn-outline-dark"
                          }`}
                          onClick={() => setNutriScoreFilter("")}
                        >
                          All
                        </button>
                        
                        {nutriScores.map((score) => {
                          let btnClass = "";
                          switch (score) {
                            case 'A': btnClass = nutriScoreFilter === score ? "btn-success" : "btn-outline-success"; break;
                            case 'B': btnClass = nutriScoreFilter === score ? "btn-info" : "btn-outline-info"; break;
                            case 'C': btnClass = nutriScoreFilter === score ? "btn-warning" : "btn-outline-warning"; break;
                            case 'D': btnClass = nutriScoreFilter === score ? "btn-orange" : "btn-outline-warning"; break;
                            case 'E': btnClass = nutriScoreFilter === score ? "btn-danger" : "btn-outline-danger"; break;
                            default: btnClass = "btn-outline-secondary";
                          }
                          
                          return (
                            <button
                              key={score}
                              className={`btn btn-sm ${btnClass}`}
                              onClick={() => setNutriScoreFilter(score)}
                            >
                              {score}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Allergens Section */}
                <div className="mb-3">
                  <div 
                    className="d-flex justify-content-between align-items-center mb-2"
                    onClick={() => toggleSection('allergens')}
                    style={{ cursor: 'pointer' }}
                  >
                    <h6 className="mb-0">Exclude Allergens</h6>
                    {expandedSections.allergens ? <FaChevronUp /> : <FaChevronDown />}
                  </div>
                  
                  {expandedSections.allergens && (
                    <div className="ps-2 border-start">
                      {allAllergens.length === 0 ? (
                        <p className="text-muted small">No allergen information available</p>
                      ) : (
                        allAllergens.map(allergen => (
                          <div className="form-check" key={allergen}>
                            <input
                              className="form-check-input"
                              type="checkbox"
                              id={`allergen-${allergen}`}
                              checked={allergenExclusions.includes(allergen)}
                              onChange={() => toggleAllergen(allergen)}
                            />
                            <label className="form-check-label d-flex align-items-center" htmlFor={`allergen-${allergen}`}>
                              {allergen}
                              {allergenExclusions.includes(allergen) && (
                                <FaTimesCircle className="text-danger ms-1" size={12} />
                              )}
                            </label>
                          </div>
                        ))
                      )}
                      
                      {allergenExclusions.length > 0 && (
                        <div className="mt-2">
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => setAllergenExclusions([])}
                          >
                            Clear Allergen Filters
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Price Range Section */}
                <div className="mb-3">
                  <div 
                    className="d-flex justify-content-between align-items-center mb-2"
                    onClick={() => toggleSection('price')}
                    style={{ cursor: 'pointer' }}
                  >
                    <h6 className="mb-0">Price Range</h6>
                    {expandedSections.price ? <FaChevronUp /> : <FaChevronDown />}
                  </div>
                  
                  {expandedSections.price && (
                    <div className="ps-2 border-start">
                      <div className="d-flex justify-content-between mb-2">
                        <span>₹{priceRange[0]}</span>
                        <span>₹{priceRange[1]}</span>
                      </div>
                      <input
                        type="range"
                        className="form-range"
                        min={minPrice}
                        max={maxPrice}
                        value={priceRange[0]}
                        onChange={(e) => setPriceRange([parseInt(e.target.value), priceRange[1]])}
                      />
                      <input
                        type="range"
                        className="form-range"
                        min={minPrice}
                        max={maxPrice}
                        value={priceRange[1]}
                        onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                      />
                    </div>
                  )}
                </div>
                
                {/* Tags Section */}
                <div className="mb-3">
                  <div 
                    className="d-flex justify-content-between align-items-center mb-2"
                    onClick={() => toggleSection('tags')}
                    style={{ cursor: 'pointer' }}
                  >
                    <h6 className="mb-0">Tags</h6>
                    {expandedSections.tags ? <FaChevronUp /> : <FaChevronDown />}
                  </div>
                  
                  {expandedSections.tags && (
                    <div className="ps-2 border-start">
                      <div className="mb-2">
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          placeholder="Search tags..."
                          value={tagFilter}
                          onChange={(e) => setTagFilter(e.target.value)}
                        />
                      </div>
                      
                      <div className="d-flex flex-wrap gap-1 mt-2">
                        {allTags.slice(0, 15).map(tag => (
                          <button
                            key={tag}
                            className={`btn btn-sm ${
                              tagFilter.toLowerCase() === tag.toLowerCase() ? "btn-primary" : "btn-outline-primary"
                            }`}
                            onClick={() => setTagFilter(tagFilter === tag ? "" : tag)}
                          >
                            #{tag}
                          </button>
                        ))}
                        
                        {allTags.length > 15 && (
                          <span className="small text-muted">+{allTags.length - 15} more</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Dietary Preferences */}
                <div className="mb-3">
                  <div 
                    className="d-flex justify-content-between align-items-center mb-2"
                    onClick={() => toggleSection('dietary')}
                    style={{ cursor: 'pointer' }}
                  >
                    <h6 className="mb-0">Dietary Preferences</h6>
                    {expandedSections.dietary ? <FaChevronUp /> : <FaChevronDown />}
                  </div>
                  
                  {expandedSections.dietary && (
                    <div className="ps-2 border-start">
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="organic-only"
                          checked={organicOnly}
                          onChange={() => setOrganicOnly(!organicOnly)}
                        />
                        <label className="form-check-label" htmlFor="organic-only">
                          <FaLeaf className="text-success me-1" /> Organic Only
                        </label>
                      </div>
                      
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="gluten-free"
                          checked={glutenFreeOnly}
                          onChange={() => setGlutenFreeOnly(!glutenFreeOnly)}
                        />
                        <label className="form-check-label" htmlFor="gluten-free">
                          Gluten-Free Only
                        </label>
                      </div>
                      
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="vegan-only"
                          checked={veganOnly}
                          onChange={() => setVeganOnly(!veganOnly)}
                        />
                        <label className="form-check-label" htmlFor="vegan-only">
                          Vegan Only
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Products Content */}
        <div className={showFilters ? "col-lg-9" : "col-12"}>
          {/* Sorting and filtering controls */}
          <div className="card shadow-sm mb-4 border-0">
            <div className="card-body bg-light rounded">
              <div className="d-flex flex-wrap justify-content-between align-items-center">
                <h5 className="mb-0">
                  Products <span className="text-muted fs-6">({filteredProducts.length})</span>
                </h5>
                
                <div className="d-flex gap-2 align-items-center">
                  <div className="d-flex align-items-center">
                    <FaSort className="me-2 text-muted" />
                    <select
                      className="form-select form-select-sm"
                      value={sortOption}
                      onChange={(e) => setSortOption(e.target.value)}
                    >
                      <option value="newest">Newest First</option>
                      <option value="price-low-high">Price: Low to High</option>
                      <option value="price-high-low">Price: High to Low</option>
                      <option value="nutri-score-best">Best Nutrition First</option>
                      <option value="name-a-z">Name: A to Z</option>
                    </select>
                  </div>
                  
                  <button
                    className={`btn ${showFilters ? 'btn-primary' : 'btn-outline-primary'} btn-sm`}
                    onClick={() => setShowFilters(!showFilters)}
                  >
                    <FaFilter className="me-1" /> 
                    {showFilters ? "Hide Filters" : "Filters"}
                  </button>
                </div>
              </div>
              
              {/* Active filters display */}
              {(searchQuery || categoryFilter || nutriScoreFilter || tagFilter || allergenExclusions.length > 0 || 
                organicOnly || glutenFreeOnly || veganOnly) && (
                <div className="mt-3 pt-2 border-top">
                  <div className="d-flex flex-wrap align-items-center gap-2">
                    <small className="text-muted">Active filters:</small>
                    
                    {searchQuery && (
                      <span className="badge bg-primary">
                        Search: "{searchQuery}"
                        <button className="btn-close btn-close-white ms-1 p-0" style={{fontSize: '0.5rem'}} onClick={() => setSearchQuery("")}></button>
                      </span>
                    )}
                    
                    {categoryFilter && (
                      <span className="badge bg-secondary">
                        Category: {categoryFilter}
                        <button className="btn-close btn-close-white ms-1 p-0" style={{fontSize: '0.5rem'}} onClick={() => setCategoryFilter("")}></button>
                      </span>
                    )}
                    
                    {nutriScoreFilter && (
                      <span className={`badge ${getNutriScoreColor(nutriScoreFilter)}`}>
                        Nutri-Score: {nutriScoreFilter}
                        <button className="btn-close btn-close-white ms-1 p-0" style={{fontSize: '0.5rem'}} onClick={() => setNutriScoreFilter("")}></button>
                      </span>
                    )}
                    
                    {tagFilter && (
                      <span className="badge bg-primary">
                        Tag: #{tagFilter}
                        <button className="btn-close btn-close-white ms-1 p-0" style={{fontSize: '0.5rem'}} onClick={() => setTagFilter("")}></button>
                      </span>
                    )}
                    
                    {allergenExclusions.map(allergen => (
                      <span key={allergen} className="badge bg-danger">
                        No {allergen}
                        <button className="btn-close btn-close-white ms-1 p-0" style={{fontSize: '0.5rem'}} onClick={() => toggleAllergen(allergen)}></button>
                      </span>
                    ))}
                    
                    {organicOnly && (
                      <span className="badge bg-success">
                        <FaLeaf className="me-1" /> Organic
                        <button className="btn-close btn-close-white ms-1 p-0" style={{fontSize: '0.5rem'}} onClick={() => setOrganicOnly(false)}></button>
                      </span>
                    )}
                    
                    {glutenFreeOnly && (
                      <span className="badge bg-info">
                        Gluten-Free
                        <button className="btn-close btn-close-white ms-1 p-0" style={{fontSize: '0.5rem'}} onClick={() => setGlutenFreeOnly(false)}></button>
                      </span>
                    )}
                    
                    {veganOnly && (
                      <span className="badge bg-primary">
                        Vegan
                        <button className="btn-close btn-close-white ms-1 p-0" style={{fontSize: '0.5rem'}} onClick={() => setVeganOnly(false)}></button>
                      </span>
                    )}
                    
                    <button
                      className="btn btn-sm btn-outline-secondary ms-2"
                      onClick={resetFilters}
                    >
                      Clear All
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Loading indicator */}
          {(loading || loadingCart) && (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-2">Loading products...</p>
            </div>
          )}

          {/* No products found */}
          {!loading && !loadingCart && filteredProducts.length === 0 && (
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
                Try adjusting your filters to see more products
              </p>
              <button
                className="btn btn-primary mt-2"
                onClick={resetFilters}
              >
                Clear Filters
              </button>
            </div>
          )}

          {/* Products grid */}
          {!loading && !loadingCart && filteredProducts.length > 0 && (
            <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
              {filteredProducts.map((product) => (
                <ProductCard 
                  key={product.id} 
                  product={product} 
                  inCart={!!cartItems[product.id]} 
                  cartQuantity={cartItems[product.id] || 0}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Helper function to get Nutri-Score badge color
const getNutriScoreColor = (grade) => {
  if (!grade) return 'bg-secondary';
  switch (grade.toUpperCase()) {
    case 'A': return 'bg-success';
    case 'B': return 'bg-info';
    case 'C': return 'bg-warning';
    case 'D': return 'bg-orange';
    case 'E': return 'bg-danger';
    default: return 'bg-secondary';
  }
};

export default ProductList;