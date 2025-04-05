import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { getProductById } from "../api/productService";
import { FaArrowLeft, FaEdit, FaTrash, FaTag, FaStar, FaEye, FaShoppingCart } from "react-icons/fa";
import { toast } from "react-toastify";

const ViewProduct = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const productData = await getProductById(id);
        setProduct(productData);
      } catch (err) {
        setError("Error loading product: " + err.message);
        toast.error("Error loading product");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  // Format currency
  const formatCurrency = (price) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(price);
  };

  // Format date
  const formatDate = (timestamp) => {
    if (!timestamp) return "N/A";
    
    const date = new Date(timestamp);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-dark" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-2">Loading product details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-5">
        <div className="alert alert-danger">{error}</div>
        <Link to="/admin/my-products" className="btn btn-dark">
          <FaArrowLeft className="me-2" /> Back to Products
        </Link>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container py-5">
        <div className="alert alert-warning">Product not found</div>
        <Link to="/admin/my-products" className="btn btn-dark">
          <FaArrowLeft className="me-2" /> Back to Products
        </Link>
      </div>
    );
  }

  // Calculate discount
  const hasDiscount = product.basePrice > product.currentPrice;
  const discountPercentage = hasDiscount 
    ? Math.round(((product.basePrice - product.currentPrice) / product.basePrice) * 100) 
    : 0;

  return (
    <div className="container py-5">
      {/* Header with actions */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Product Details</h2>
        <div className="d-flex gap-2">
          <Link to="/admin/my-products" className="btn btn-outline-dark">
            <FaArrowLeft className="me-2" /> Back
          </Link>
          <Link to={`/edit-product/${id}`} className="btn btn-outline-dark">
            <FaEdit className="me-2" /> Edit
          </Link>
          <button 
            onClick={() => {
              if(window.confirm(`Are you sure you want to delete "${product.name}"?`)) {
                // Handle delete logic here
                navigate("/admin/my-products");
                toast.success("Product deleted successfully");
              }
            }}
            className="btn btn-outline-danger"
          >
            <FaTrash className="me-2" /> Delete
          </button>
        </div>
      </div>

      <div className="row">
        {/* Product image column */}
        <div className="col-md-5">
          <div className="card border-0 shadow-sm">
            <div className="position-relative">
              {product.isNewArrival && (
                <span className="position-absolute top-0 start-0 badge bg-dark m-3 px-3 py-2">
                  NEW ARRIVAL
                </span>
              )}
              {hasDiscount && (
                <span className="position-absolute top-0 end-0 badge bg-danger m-3 px-3 py-2">
                  −{discountPercentage}%
                </span>
              )}
              <img 
                src={product.imageUrl || "https://placehold.co/600x400?text=No+Image"} 
                alt={product.name}
                className="card-img-top" 
                style={{ height: "400px", objectFit: "contain", backgroundColor: "#f8f9fa" }}
              />
            </div>
            <div className="card-body">
              <div className="d-flex justify-content-around text-center">
                <div>
                  <div className="fw-bold text-dark">{product.viewCount || 0}</div>
                  <div className="small text-muted">Views</div>
                </div>
                <div className="border-start border-end px-4">
                  <div className="fw-bold text-dark">{product.purchaseCount || 0}</div>
                  <div className="small text-muted">Sales</div>
                </div>
                <div>
                  <div className="fw-bold text-dark">{product.stock}</div>
                  <div className="small text-muted">In Stock</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Product details column */}
        <div className="col-md-7">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="mb-3">
                <span className="badge bg-secondary rounded-pill px-3 py-2">{product.category}</span>
                {product.isFeature && (
                  <span className="badge bg-success ms-2 rounded-pill px-3 py-2">Featured</span>
                )}
              </div>
              
              <h1 className="display-6 fw-bold">{product.name}</h1>
              
              <div className="d-flex align-items-baseline mt-3 mb-4">
                <h2 className="text-dark me-3">{formatCurrency(product.currentPrice)}</h2>
                {hasDiscount && (
                  <h5 className="text-decoration-line-through text-muted">
                    {formatCurrency(product.basePrice)}
                  </h5>
                )}
                {product.stock > 0 ? (
                  <span className="badge bg-success ms-auto px-3 py-2">In Stock</span>
                ) : (
                  <span className="badge bg-danger ms-auto px-3 py-2">Out of Stock</span>
                )}
              </div>
              
              <div className="mb-4">
                <h5 className="border-bottom pb-2">Description</h5>
                <p className="mb-0">{product.description}</p>
              </div>
              
              {product.features && product.features.length > 0 && (
                <div className="mb-4">
                  <h5 className="border-bottom pb-2">Features</h5>
                  <ul className="mb-0">
                    {product.features.map((feature, index) => (
                      <li key={index}>{feature}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {product.tags && product.tags.length > 0 && (
                <div className="mb-4">
                  <h5 className="border-bottom pb-2">Tags</h5>
                  <div className="d-flex flex-wrap gap-2">
                    {product.tags.map((tag, index) => (
                      <span key={index} className="badge bg-light text-dark border py-2 px-3">
                        <FaTag className="me-1" /> {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Additional details table */}
              <div className="mb-4">
                <h5 className="border-bottom pb-2">Additional Information</h5>
                <table className="table table-striped">
                  <tbody>
                    <tr>
                      <th style={{ width: "40%" }}>Weight</th>
                      <td>{product.weight ? `${product.weight} kg` : "N/A"}</td>
                    </tr>
                    <tr>
                      <th>Created</th>
                      <td>{formatDate(product.createdAt)}</td>
                    </tr>
                    <tr>
                      <th>Last Updated</th>
                      <td>{formatDate(product.updatedAt)}</td>
                    </tr>
                    <tr>
                      <th>Demand Score</th>
                      <td>
                        {product.demandScore ? (
                          <div className="d-flex align-items-center">
                            <FaStar className="text-warning me-1" />
                            <span>{product.demandScore}/10</span>
                          </div>
                        ) : "N/A"}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              {/* Sales stats if available */}
              {product.priceHistory && product.priceHistory.length > 0 && (
                <div>
                  <h5 className="border-bottom pb-2">Price History</h5>
                  <div className="table-responsive">
                    <table className="table table-sm">
                      <thead className="table-light">
                        <tr>
                          <th>Date</th>
                          <th>Price</th>
                          <th>Reason</th>
                        </tr>
                      </thead>
                      <tbody>
                        {product.priceHistory.slice(0, 5).map((item, index) => (
                          <tr key={index}>
                            <td>{new Date(item.date).toLocaleDateString()}</td>
                            <td>{formatCurrency(item.price)}</td>
                            <td>{item.reason}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
            
            {/* Live product link */}
            <div className="card-footer bg-light p-3">
              <div className="d-flex align-items-center justify-content-between">
                
                <Link to="/admin/my-products" className="btn btn-dark">
                  <FaArrowLeft className="me-2" /> Back to Products
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewProduct;