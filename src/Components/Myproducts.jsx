import React, { useState, useEffect } from "react";
import { useAuth } from "../context/Authcontext";
import { getProducts, deleteProduct } from "../api/productService";
import { FaPlus, FaTrash, FaEdit, FaEye, FaChartLine, FaTag, FaLeaf } from "react-icons/fa";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";

const Myproducts = () => {
  const { currentUser } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState(""); 

  // Get unique categories from products
  const categories = [...new Set(products.map((product) => product.category))];

  // Load products on component mount
  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const productData = await getProducts();
      setProducts(productData);
    } catch (err) {
      setError("Error loading products: " + err.message);
      toast.error("Error loading products");
    } finally {
      setLoading(false);
    }
  };  
       
  // Handle product deletion
  const handleDeleteClick = (product) => {
    setProductToDelete(product);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!productToDelete) return;
    
    try {
      setLoading(true);
      await deleteProduct(productToDelete.id);
      setProducts(products.filter((product) => product.id !== productToDelete.id));
      toast.success("Product deleted successfully!");
      setShowDeleteModal(false);
      setProductToDelete(null);
    } catch (err) {
      setError("Error deleting product: " + err.message);
      toast.error("Error deleting product");
    } finally {
      setLoading(false);
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
  
  // Filter products
  const filteredProducts = products.filter((product) => {
    const matchesCategory = categoryFilter ? product.category === categoryFilter : true;
    const matchesSearch = searchTerm 
      ? product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchTerm.toLowerCase())
      : true;
    
    return matchesCategory && matchesSearch;
  }); 

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Product Management</h2>
        <Link to="/admin/addproduct" className="btn btn-success">
          <FaPlus className="me-2" /> Add Product
        </Link>
      </div>

      {/* Search and Filter Section */}
      <div className="card shadow-sm mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-6">
              <div className="input-group">
                <span className="input-group-text bg-success text-white">
                  <FaEye />
                </span>
                <input
                  type="text"
                  className="form-control border-success"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="col-md-6">
              <select
                className="form-select border-success"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */} 
      {error && <div className="alert alert-danger">{error}</div>}

      {/* Products Grid */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-success" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading products...</p>
        </div>
      ) : (
        <div className="row">
          {filteredProducts.length === 0 ? (
            <div className="col-12 text-center py-5">
              <div className="mb-3">
                <img
                  src="https://cdn-icons-png.flaticon.com/512/7486/7486754.png"
                  alt="No products"
                  style={{ width: "120px", opacity: "0.5" }}
                />
              </div>
              <h5>No products found</h5>
              <p className="text-muted">
                {categoryFilter 
                  ? `No products found in category "${categoryFilter}"`
                  : searchTerm
                    ? `No results for "${searchTerm}"`
                    : "Add your first product to get started"
                }
              </p>
              <Link to="/admin/addproduct" className="btn btn-success mt-3">
                <FaPlus className="me-2" /> Add Product
              </Link>
            </div>
          ) : (
            filteredProducts.map((product) => (
              <div className="col-md-4 mb-4" key={product.id}>
                <div className="card shadow-sm h-100 border-0 rounded-3 overflow-hidden">
                  {/* Product badges */}
                  <div className="position-absolute d-flex justify-content-between w-100 px-3 pt-3 z-1">
                    <div>
                      {product.isNewArrival && (
                        <span className="badge bg-dark rounded-pill px-3 py-2 me-2">
                          NEW ARRIVAL
                        </span>
                      )}
                      {product.nutrition_grade_fr && (
                        <span className={`badge ${getNutriScoreColor(product.nutrition_grade_fr)} rounded-pill px-3 py-2`}>
                          Nutri-Score {product.nutrition_grade_fr}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Product image */}
                  <div style={{ height: "200px", backgroundColor: "#f8f9fa" }}>
                    <img
                      src={product.imageUrl || "https://placehold.co/400x400?text=No+Image"}
                      className="w-100 h-100"
                      alt={product.name}
                      style={{ objectFit: "contain" }}
                    />
                  </div>
                  
                  <div className="card-body d-flex flex-column">
                    <div className="mb-2">
                      <span className="badge bg-secondary rounded-pill">{product.category}</span>
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
                    
                    <h5 className="card-title fw-bold mb-1">{product.name}</h5>
                    
                    <p className="card-text small text-muted mb-2">
                      {product.description && product.description.length > 60
                        ? product.description.substring(0, 60) + "..."
                        : product.description}
                    </p>
                    
                    <div className="mt-auto">
                      <div className="d-flex align-items-center justify-content-between mb-3">
                        <div>
                          <h5 className="mb-0 fw-bold">
                            {formatCurrency(product.price)}
                          </h5>
                        </div>
                        <div>
                          <span className={`badge ${product.stock > 10 ? 'bg-success' : product.stock > 0 ? 'bg-warning' : 'bg-danger'} px-3 py-2`}>
                            {product.stock > 0 ? `${product.stock} in Stock` : 'Out of Stock'}
                          </span>
                        </div>
                      </div>
                      
                     

                      {/* Actions */}
                      <div className="d-flex gap-2">
                        <Link 
                          to={`/view-product/${product.id}`} 
                          className="btn btn-outline-success flex-grow-1"
                        >
                          <FaEye className="me-1" /> View
                        </Link>
                        <Link 
                          to={`/edit-product/${product.id}`} 
                          className="btn btn-outline-primary flex-grow-1"
                        >
                          <FaEdit className="me-1" /> Edit
                        </Link>
                        <button
                          onClick={() => handleDeleteClick(product)}
                          className="btn btn-outline-danger"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Confirm Delete</h5>
                <button type="button" className="btn-close" onClick={() => setShowDeleteModal(false)}></button>
              </div>
              <div className="modal-body">
                <p>Are you sure you want to delete <strong>{productToDelete?.name}</strong>?</p>
                <p className="text-danger mb-0">This action cannot be undone.</p>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowDeleteModal(false)}>
                  Cancel
                </button>
                <button type="button" className="btn btn-danger" onClick={confirmDelete}>
                  Delete Product
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Myproducts;