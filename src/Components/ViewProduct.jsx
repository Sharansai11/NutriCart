import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { getProductById, deleteProduct } from "../api/productService";
import { 
  FaArrowLeft, FaEdit, FaTrash, FaTag, 
  FaStar, FaLeaf, FaCarrot, FaBreadSlice,
  FaInfo, FaClipboardList, FaChartBar
} from "react-icons/fa";
import { toast } from "react-toastify";

const ViewProduct = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const productData = await getProductById(id);
        setProduct(productData);
      } catch (err) {
        toast.error("Error loading product");
        navigate("/admin/my-products");
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id, navigate]);

  const handleDelete = async () => {
    const confirmDelete = window.confirm(`Are you sure you want to delete "${product.name}"?\n\nThis action cannot be undone.`);
    
    if (confirmDelete) {
      try {
        await deleteProduct(id);
        navigate("/admin/my-products");
        toast.success("Product deleted successfully");
      } catch (err) {
        toast.error("Failed to delete product");
      }
    }
  };

  const getNutriScoreColor = (grade) => {
    const colors = {
      'a': 'bg-success text-white',
      'b': 'bg-success bg-opacity-25 text-success', // light green
      'c': 'bg-warning text-dark',
      'd': 'bg-warning bg-opacity-50 text-dark',    // mild orange
      'e': 'bg-danger text-white'
    };
    return colors[grade?.toLowerCase()] || 'bg-secondary text-white';
  };
  

  if (loading) return <div className="text-center py-5">Loading...</div>;
  if (!product) return <div className="text-center py-5">Product not found</div>;

  return (
    <div className="container-fluid py-4">
      <div className="row">
        {/* Left Column - Image and Basic Info */}
        <div className="col-md-4">
          {/* Product Image */}
          <div className="card mb-4 shadow-sm">
            <img 
              src={product.imageUrl || 'https://placehold.co/400x400?text=No+Image'} 
              alt={product.name} 
              className="card-img-top"
              style={{ height: '400px', objectFit: 'cover' }}
            />
            <div className="card-body text-center">
              <h3 className="card-title">{product.name}</h3>
              <p className="text-muted">{product.category}</p>
            </div>
          </div>

          {/* Nutri-Score and Special Labels */}
          <div className="card mb-4 shadow-sm">
            <div className="card-header d-flex align-items-center">
              <FaChartBar className="me-2" />
              <h5 className="mb-0">Nutrition & Labels</h5>
            </div>
            <div className="card-body">
              {/* Nutri-Score */}
              <div className="mb-3">
                <h6>Nutri-Score</h6>
                <span 
                  className={`badge bg-${getNutriScoreColor(product.nutrition_grade_fr)} fs-6`}
                >
                  Grade {product.nutrition_grade_fr?.toUpperCase()} 
                  
                </span>
              </div>

              {/* Special Labels */}
              <div>
                <h6>Product Labels</h6>
                <div className="d-flex flex-wrap gap-2">
                  {product.organicCertified && (
                    <span className="badge bg-success">
                      <FaLeaf className="me-1" /> Organic
                    </span>
                  )}
                  {product.veganFriendly && (
                    <span className="badge bg-primary">
                      <FaCarrot className="me-1" /> Vegan
                    </span>
                  )}
                  {product.glutenFree && (
                    <span className="badge bg-info">
                      <FaBreadSlice className="me-1" /> Gluten Free
                    </span>
                  )}
                  {product.isFeature && (
                    <span className="badge bg-warning">
                      <FaStar className="me-1" /> Featured
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Product Metadata */}
          <div className="card shadow-sm">
            <div className="card-header d-flex align-items-center">
              <FaInfo className="me-2" />
              <h5 className="mb-0">Product Details</h5>
            </div>
            <ul className="list-group list-group-flush">
              <li className="list-group-item d-flex justify-content-between">
                <span>Stock</span>
                <span className={`badge ${product.stock > 0 ? 'bg-success' : 'bg-danger'}`}>
                  {product.stock} Available
                </span>
              </li>
              <li className="list-group-item d-flex justify-content-between">
                <span>Price</span>
                <strong>₹{product.price}</strong>
              </li>
              <li className="list-group-item d-flex justify-content-between">
                <span>Views</span>
                <span>{product.viewCount || 0}</span>
              </li>
              <li className="list-group-item d-flex justify-content-between">
                <span>Weight</span>
                <span>{product.weight}g</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Right Column - Detailed Information */}
        <div className="col-md-8">
          {/* Description */}
          <div className="card mb-4 shadow-sm">
            <div className="card-header d-flex align-items-center">
              <FaClipboardList className="me-2" />
              <h5 className="mb-0">Product Description</h5>
            </div>
            <div className="card-body">
              <p>{product.description}</p>
            </div>
          </div>

          {/* Nutritional Information */}
          <div className="card mb-4 shadow-sm">
            <div className="card-header">
              <h5 className="mb-0">Nutritional Information (per 100g)</h5>
            </div>
            <div className="card-body">
              <div className="row g-3">
                {[
                  { label: 'Energy', value: product.energy_100g, unit: 'kcal' },
                  { label: 'Fat', value: product.fat_100g, unit: 'g', 
                    subLabel: `Sat. Fat: ${product['saturated-fat_100g']}g` },
                  { label: 'Carbohydrates', value: product.carbohydrates_100g, unit: 'g', 
                    subLabel: `Sugars: ${product.sugars_100g}g` },
                  { label: 'Proteins', value: product.proteins_100g, unit: 'g' },
                  { label: 'Fiber', value: product.fiber_100g, unit: 'g' },
                  { label: 'Salt', value: product.salt_100g, unit: 'g', 
                    subLabel: `Sodium: ${product.sodium_100g}mg` },
                  { label: 'Iron', value: product.iron_100g, unit: 'mg' }
                ].map(({ label, value, unit, subLabel }, index) => (
                  <div key={index} className="col-md-4 col-lg-3">
                    <div className="card h-100 border-0 shadow-sm">
                      <div className="card-body text-center">
                        <h6 className="text-muted">{label}</h6>
                        <div className="fs-5 fw-bold">
                          {value} {unit}
                        </div>
                        {subLabel && (
                          <small className="text-muted d-block">
                            {subLabel}
                          </small>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Ingredients and Additives */}
          <div className="card mb-4 shadow-sm">
            <div className="card-header">
              <h5 className="mb-0">Ingredients & Additives</h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-8">
                  <h6>Ingredients</h6>
                  <p>{product.ingredients_text}</p>
                </div>
                <div className="col-md-4">
                  <h6>Additives ({product.additives_n})</h6>
                  <p>{product.additives || 'None'}</p>
                  <h6>Allergens</h6>
                  <p>{product.allergens || 'None'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Tags */}
          {product.tags && product.tags.length > 0 && (
            <div className="card shadow-sm">
              <div className="card-header">
                <h5 className="mb-0">Tags</h5>
              </div>
              <div className="card-body">
                <div className="d-flex flex-wrap gap-2">
                  {product.tags.map((tag, index) => (
                    <span key={index} className="badge bg-light text-dark">
                      <FaTag className="me-1" /> {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-4 d-flex gap-3">
            <Link to={`/edit-product/${id}`} className="btn btn-primary">
              <FaEdit className="me-2" /> Edit Product
            </Link>
            <button onClick={handleDelete} className="btn btn-danger">
              <FaTrash className="me-2" /> Delete Product
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewProduct;