import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/Authcontext";
import { getProductById, updateProduct } from "../api/productService";
import { FaArrowLeft, FaSave, FaTimes, FaEye, FaImage, FaTag } from "react-icons/fa";
import { toast } from "react-toastify";

const EditProduct = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  
  // Categories options
  const categories = [
    "Electronics", "Clothing", "Home & Kitchen", "Beauty", 
    "Sports", "Books", "Toys", "Grocery"
  ];
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    basePrice: "",
    salePrice: "",
    category: "",
    stock: "",
    weight: "",
    tags: "",
    features: "",
    image: null,
    isFeature: false,
    isNewArrival: false
  });

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const productData = await getProductById(id);
        
        // Initialize form with product data
        setFormData({
          name: productData.name || "",
          description: productData.description || "",
          basePrice: productData.basePrice || "",
          salePrice: productData.salePrice || "",
          category: productData.category || "",
          stock: productData.stock || "",
          weight: productData.weight || "",
          tags: productData.tags ? productData.tags.join(", ") : "",
          features: productData.features ? productData.features.join(", ") : "",
          image: null, // Cannot set File object from URL
          imageUrl: productData.imageUrl || "",
          isFeature: productData.isFeature || false,
          isNewArrival: productData.isNewArrival || false,
          priceChangeReason: "" // For price history tracking
        });
        
        setImagePreview(productData.imageUrl || "");
      } catch (err) {
        setError("Error loading product: " + err.message);
        toast.error("Error loading product");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    
    if (type === "file") {
      if (files[0]) {
        setFormData(prev => ({
          ...prev,
          image: files[0]
        }));
        
        // Show image preview
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreview(reader.result);
        };
        reader.readAsDataURL(files[0]);
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === "checkbox" ? checked : 
                type === "number" ? parseFloat(value) : value
      }));
    }
    
    // If price fields change, prompt for reason
    if (name === "basePrice" || name === "salePrice") {
      if (!formData.priceChangeReason) {
        setFormData(prev => ({
          ...prev,
          priceChangeReason: "Price update"
        }));
      }
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      // Process tags and features as arrays
      const processedData = {
        ...formData,
        tags: formData.tags.split(",").map(tag => tag.trim()).filter(Boolean),
        features: formData.features.split(",").map(feature => feature.trim()).filter(Boolean)
      };
      
      await updateProduct(id, processedData);
      toast.success("Product updated successfully!");
      navigate(`/view-product/${id}`);
    } catch (err) {
      setError("Error updating product: " + err.message);
      toast.error("Error updating product");
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-dark" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-2">Loading product data...</p>
      </div>
    );
  }

  return (
    <div className="container py-5">
      {/* Header with actions */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Edit Product</h2>
        <div className="d-flex gap-2">
          <Link to={`/view-product/${id}`} className="btn btn-outline-dark">
            <FaEye className="me-2" /> View
          </Link>
          <Link to="/admin/my-products" className="btn btn-outline-dark">
            <FaArrowLeft className="me-2" /> Back
          </Link>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="card border-0 shadow-sm">
        <div className="card-body p-4">
          <form onSubmit={handleSubmit}>
            <div className="row">
              {/* Left column */}
              <div className="col-md-8">
                <h5 className="border-bottom pb-2 mb-3">Product Information</h5>
                
                <div className="mb-3">
                  <label htmlFor="name" className="form-label">Product Name*</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    className="form-control"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>
                
                <div className="mb-3">
                <label htmlFor="description" className="form-label">Description*</label>
                  <textarea
                    id="description"
                    name="description"
                    className="form-control"
                    rows="4"
                    value={formData.description}
                    onChange={handleChange}
                    required
                  />
                </div>
                
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label htmlFor="category" className="form-label">Category*</label>
                    <select
                      id="category"
                      name="category"
                      className="form-select"
                      value={formData.category}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select Category</option>
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="col-md-6 mb-3">
                    <label htmlFor="weight" className="form-label">Weight (kg)</label>
                    <input
                      type="number"
                      step="0.01"
                      id="weight"
                      name="weight"
                      className="form-control"
                      value={formData.weight}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label htmlFor="basePrice" className="form-label">Base Price*</label>
                    <div className="input-group">
                      <span className="input-group-text">₹</span>
                      <input
                        type="number"
                        step="0.01"
                        id="basePrice"
                        name="basePrice"
                        className="form-control"
                        value={formData.basePrice}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="col-md-6 mb-3">
                    <label htmlFor="salePrice" className="form-label">Sale Price</label>
                    <div className="input-group">
                      <span className="input-group-text">₹</span>
                      <input
                        type="number"
                        step="0.01"
                        id="salePrice"
                        name="salePrice"
                        className="form-control"
                        value={formData.salePrice}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="form-text">
                      Leave empty if not on sale.
                    </div>
                  </div>
                </div>
                
                {(formData.basePrice !== formData.originalBasePrice || 
                 formData.salePrice !== formData.originalSalePrice) && (
                  <div className="mb-3">
                    <label htmlFor="priceChangeReason" className="form-label">Reason for Price Change</label>
                    <input
                      type="text"
                      id="priceChangeReason"
                      name="priceChangeReason"
                      className="form-control"
                      value={formData.priceChangeReason}
                      onChange={handleChange}
                      placeholder="e.g., Seasonal discount, Cost increase, etc."
                    />
                  </div>
                )}
                
                <div className="mb-3">
                  <label htmlFor="stock" className="form-label">Stock*</label>
                  <input
                    type="number"
                    id="stock"
                    name="stock"
                    className="form-control"
                    value={formData.stock}
                    onChange={handleChange}
                    required
                  />
                </div>
                
                <div className="mb-3">
                  <label htmlFor="tags" className="form-label">
                    <FaTag className="me-2" />
                    Tags (comma separated)
                  </label>
                  <input
                    type="text"
                    id="tags"
                    name="tags"
                    className="form-control"
                    value={formData.tags}
                    onChange={handleChange}
                    placeholder="premium, bestseller, limited"
                  />
                </div>
                
                <div className="mb-3">
                  <label htmlFor="features" className="form-label">Key Features (comma separated)</label>
                  <input
                    type="text"
                    id="features"
                    name="features"
                    className="form-control"
                    value={formData.features}
                    onChange={handleChange}
                    placeholder="waterproof, rechargeable, wireless"
                  />
                </div>
                
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <div className="form-check">
                      <input
                        type="checkbox"
                        id="isFeature"
                        name="isFeature"
                        className="form-check-input"
                        checked={formData.isFeature}
                        onChange={handleChange}
                      />
                      <label className="form-check-label" htmlFor="isFeature">
                        Featured Product
                      </label>
                    </div>
                  </div>
                  
                  <div className="col-md-6 mb-3">
                    <div className="form-check">
                      <input
                        type="checkbox"
                        id="isNewArrival"
                        name="isNewArrival"
                        className="form-check-input"
                        checked={formData.isNewArrival}
                        onChange={handleChange}
                      />
                      <label className="form-check-label" htmlFor="isNewArrival">
                        Mark as New Arrival
                      </label>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Right column - Image */}
              <div className="col-md-4">
                <h5 className="border-bottom pb-2 mb-3">Product Image</h5>
                
                <div className="card mb-3">
                  <div className="card-body text-center">
                    {imagePreview ? (
                      <div className="position-relative mb-3">
                        <img 
                          src={imagePreview} 
                          alt="Product preview" 
                          className="img-fluid rounded" 
                          style={{ maxHeight: "250px" }}
                        />
                        <button
                          type="button"
                          className="position-absolute top-0 end-0 btn btn-sm btn-danger rounded-circle"
                          onClick={() => {
                            setImagePreview("");
                            setFormData(prev => ({ ...prev, image: null, imageUrl: "" }));
                          }}
                          style={{ margin: "5px" }}
                        >
                          <FaTimes />
                        </button>
                      </div>
                    ) : (
                      <div className="border rounded p-5 mb-3 bg-light text-center">
                        <FaImage size={50} className="text-muted mb-2" />
                        <p className="text-muted mb-0">No image selected</p>
                      </div>
                    )}
                    
                    <div className="mb-3">
                      <label htmlFor="image" className="form-label">Upload New Image</label>
                      <input
                        type="file"
                        id="image"
                        name="image"
                        className="form-control"
                        onChange={handleChange}
                        accept="image/*"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="d-flex justify-content-between border-top pt-4 mt-4">
              <Link to="/admin/my-products" className="btn btn-outline-secondary">
                <FaTimes className="me-2" /> Cancel
              </Link>
              <button type="submit" className="btn btn-dark" disabled={saving}>
                {saving ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Saving...
                  </>
                ) : (
                  <>
                    <FaSave className="me-2" /> Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditProduct;