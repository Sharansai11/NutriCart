import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/Authcontext";
import { getProductById, updateProduct, predictNutriScore } from "../api/productService";
import { FaArrowLeft, FaSave, FaTimes, FaCalculator, FaLeaf, FaCarrot, FaBreadSlice } from "react-icons/fa";
import { toast } from "react-toastify";

const EditProduct = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [predicting, setPredicting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Form state with numeric defaults
  const [formData, setFormData] = useState({
    // Basic Product Details
    name: "",
    description: "",
    category: "",
    tags: "",
    
    // Pricing and Inventory
    price: 0,
    stock: 0,
    weight: 0,
    
    // Nutritional Information
    energy_100g: 0,
    fat_100g: 0,
    "saturated-fat_100g": 0,
    carbohydrates_100g: 0,
    sugars_100g: 0,
    fiber_100g: 0,
    proteins_100g: 0,
    salt_100g: 0,
    sodium_100g: 0,
    iron_100g: 0,
    
    // Ingredients & Additives
    ingredients_text: "",
    additives_n: 0,
    additives: "",
    allergens: "",
    
    // Nutrition Score
    nutrition_grade_fr: "",
    nutrition_score: 0,
    
    // Special Labels
    isFeature: false,
    isNewArrival: false,
    organicCertified: false,
    veganFriendly: false,
    glutenFree: false,
    
    // Media
    imageUrl: "",
    image: null
  });

  // Food categories
  const categories = [
   "biscuits","choclates", "Snacks", "Beverages", "Dairy", "Fruits", "Vegetables", 
    "Grains", "Breakfast", "Canned Goods", "Frozen Foods", "sweets"
  ];

  // Load product data on mount
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const productData = await getProductById(id);
        
        // Convert array of tags to comma-separated string
        const tagsString = Array.isArray(productData.tags) 
          ? productData.tags.join(", ") 
          : productData.tags || "";
        
        setFormData({
          ...productData,
          tags: tagsString
        });
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

    setFormData((prev) => ({
      ...prev,
      [name]: type === "file"
        ? files[0]
        : type === "checkbox"
        ? checked
        : type === "number"
        ? parseFloat(value) || 0 // Ensure numeric fields are 0 not NaN
        : value,
    }));
  };

  // Calculate Nutri-Score
  const calculateNutriScore = async () => {
    setPredicting(true);
    setError("");
    setSuccessMessage("");
    
    // Extract nutrition data
    const nutritionData = {
      energy_100g: formData.energy_100g,
      fat_100g: formData.fat_100g,
      "saturated-fat_100g": formData["saturated-fat_100g"],
      carbohydrates_100g: formData.carbohydrates_100g,
      sugars_100g: formData.sugars_100g,
      fiber_100g: formData.fiber_100g,
      proteins_100g: formData.proteins_100g,
      salt_100g: formData.salt_100g,
      sodium_100g: formData.sodium_100g,
      iron_100g: formData.iron_100g,
      additives_n: formData.additives_n,
      ingredients_text: formData.ingredients_text,
      additives: formData.additives
    };
    
    try {
      const prediction = await predictNutriScore(nutritionData);
      
      setFormData(prev => ({
        ...prev,
        nutrition_grade_fr: prediction.nutrition_grade,
        nutrition_score: prediction.confidence
      }));
      
      setSuccessMessage(`Nutri-Score calculated: ${prediction.nutrition_grade}`);
      toast.success(`Nutri-Score: ${prediction.nutrition_grade}`);
    } catch (err) {
      setError("Error calculating Nutri-Score: " + err.message);
      toast.error("Error calculating Nutri-Score");
    } finally {
      setPredicting(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccessMessage("");

    try {
      // Process tags as arrays
      const processedData = {
        ...formData,
        tags: formData.tags.split(",").map((tag) => tag.trim()),
      };

      await updateProduct(id, processedData);
      setSuccessMessage("Product updated successfully!");
      toast.success("Product updated successfully!");
      
      // Navigate back after a short delay
      setTimeout(() => {
        navigate(`/view-product/${id}`);
      }, 1500);
    } catch (err) {
      setError("Error updating product: " + err.message);
      toast.error("Error updating product");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-success" role="status"></div>
        <p className="mt-2">Loading product data...</p>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Edit Food Product</h2>
        <div className="d-flex gap-2">
          <Link to={`/view-product/${id}`} className="btn btn-outline-secondary">
            <FaArrowLeft className="me-2" /> Back to Product
          </Link>
        </div>
      </div>
      
      {error && <div className="alert alert-danger">{error}</div>}
      {successMessage && <div className="alert alert-success">{successMessage}</div>}

      <form onSubmit={handleSubmit}>
        <div className="row">
          {/* Basic Information */}
          <div className="col-md-6">
            <div className="card shadow-sm mb-4">
              <div className="card-header bg-light">
                <h5 className="mb-0">Basic Information</h5>
              </div>
              <div className="card-body">
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
                    rows="3"
                    value={formData.description}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="mb-3">
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

                <div className="mb-3">
                  <label htmlFor="tags" className="form-label">Tags (comma separated)</label>
                  <input
                    type="text"
                    id="tags"
                    name="tags"
                    className="form-control"
                    value={formData.tags}
                    onChange={handleChange}
                    placeholder="healthy, organic, gluten-free"
                  />
                </div>
              </div>
            </div>
            
            {/* Ingredients & Additives */}
            <div className="card shadow-sm mb-4">
              <div className="card-header bg-light">
                <h5 className="mb-0">Ingredients & Allergens</h5>
              </div>
              <div className="card-body">
                <div className="mb-3">
                  <label htmlFor="ingredients_text" className="form-label">Ingredients Text*</label>
                  <textarea
                    id="ingredients_text"
                    name="ingredients_text"
                    className="form-control"
                    rows="2"
                    value={formData.ingredients_text}
                    onChange={handleChange}
                    placeholder="sugar, wheat, milk powder"
                    required
                  />
                </div>

                <div className="mb-3">
                  <label htmlFor="allergens" className="form-label">Allergens</label>
                  <textarea
                    id="allergens"
                    name="allergens"
                    className="form-control"
                    rows="2"
                    value={formData.allergens}
                    onChange={handleChange}
                    placeholder="milk, eggs, nuts, gluten, soy"
                  />
                  <small className="text-muted">List all potential allergens in this product</small>
                </div>

                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label htmlFor="additives_n" className="form-label">Additives Number</label>
                    <input
                      type="number"
                      id="additives_n"
                      name="additives_n"
                      className="form-control"
                      value={formData.additives_n}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="col-md-6 mb-3">
                    <label htmlFor="additives" className="form-label">Additives List</label>
                    <input
                      type="text"
                      id="additives"
                      name="additives"
                      className="form-control"
                      value={formData.additives}
                      onChange={handleChange}
                      placeholder="E300, E471"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Pricing & Inventory */}
          <div className="col-md-6">
            <div className="card shadow-sm mb-4">
              <div className="card-header bg-light">
                <h5 className="mb-0">Pricing & Inventory</h5>
              </div>
              <div className="card-body">
                <div className="mb-3">
                  <label htmlFor="price" className="form-label">Price*</label>
                  <div className="input-group">
                    <span className="input-group-text">₹</span>
                    <input
                      type="number"
                      step="0.01"
                      id="price"
                      name="price"
                      className="form-control"
                      value={formData.price}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6 mb-3">
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

                  <div className="col-md-6 mb-3">
                    <label htmlFor="weight" className="form-label">Weight (g)*</label>
                    <input
                      type="number"
                      step="0.01"
                      id="weight"
                      name="weight"
                      className="form-control"
                      value={formData.weight}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <label htmlFor="image" className="form-label">Product Image</label>
                  <input
                    type="file"
                    id="image"
                    name="image"
                    className="form-control"
                    onChange={handleChange}
                  />
                  {formData.imageUrl && (
                    <div className="mt-2">
                      <img 
                        src={formData.imageUrl} 
                        alt="Current product" 
                        className="img-thumbnail" 
                        style={{ maxHeight: "100px" }} 
                      />
                      <small className="text-muted d-block">Current image (upload a new one to replace)</small>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Special Labels */}
            <div className="card shadow-sm mb-4">
              <div className="card-header bg-light">
                <h5 className="mb-0">Special Labels</h5>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <div className="form-check form-switch">
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
                    <div className="form-check form-switch">
                      <input
                        type="checkbox"
                        id="isNewArrival"
                        name="isNewArrival"
                        className="form-check-input"
                        checked={formData.isNewArrival}
                        onChange={handleChange}
                      />
                      <label className="form-check-label" htmlFor="isNewArrival">
                        New Arrival
                      </label>
                    </div>
                  </div>

                  <div className="col-md-6 mb-3">
                    <div className="form-check form-switch">
                      <input
                        type="checkbox"
                        id="organicCertified"
                        name="organicCertified"
                        className="form-check-input"
                        checked={formData.organicCertified}
                        onChange={handleChange}
                      />
                      <label className="form-check-label d-flex align-items-center" htmlFor="organicCertified">
                        <FaLeaf className="text-success me-1" /> Organic Certified
                      </label>
                    </div>
                  </div>

                  <div className="col-md-6 mb-3">
                    <div className="form-check form-switch">
                      <input
                        type="checkbox"
                        id="veganFriendly"
                        name="veganFriendly"
                        className="form-check-input"
                        checked={formData.veganFriendly}
                        onChange={handleChange}
                      />
                      <label className="form-check-label d-flex align-items-center" htmlFor="veganFriendly">
                        <FaCarrot className="text-primary me-1" /> Vegan Friendly
                      </label>
                    </div>
                  </div>

                  <div className="col-md-6 mb-3">
                    <div className="form-check form-switch">
                      <input
                        type="checkbox"
                        id="glutenFree"
                        name="glutenFree"
                        className="form-check-input"
                        checked={formData.glutenFree}
                        onChange={handleChange}
                      />
                      <label className="form-check-label d-flex align-items-center" htmlFor="glutenFree">
                        <FaBreadSlice className="text-info me-1" /> Gluten-Free
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Nutritional Information */}
        <div className="card shadow-sm mb-4">
          <div className="card-header bg-light">
            <h5 className="mb-0">Nutritional Information (per 100g)</h5>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-3 mb-3">
                <label htmlFor="energy_100g" className="form-label">Energy (kcal)*</label>
                <input
                  type="number"
                  step="0.01"
                  id="energy_100g"
                  name="energy_100g"
                  className="form-control"
                  value={formData.energy_100g}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="col-md-3 mb-3">
                <label htmlFor="fat_100g" className="form-label">Fat (g)*</label>
                <input
                  type="number"
                  step="0.01"
                  id="fat_100g"
                  name="fat_100g"
                  className="form-control"
                  value={formData.fat_100g}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="col-md-3 mb-3">
                <label htmlFor="saturated-fat_100g" className="form-label">Saturated Fat (g)*</label>
                <input
                  type="number"
                  step="0.01"
                  id="saturated-fat_100g"
                  name="saturated-fat_100g"
                  className="form-control"
                  value={formData["saturated-fat_100g"]}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="col-md-3 mb-3">
                <label htmlFor="carbohydrates_100g" className="form-label">Carbohydrates (g)*</label>
                <input
                  type="number"
                  step="0.01"
                  id="carbohydrates_100g"
                  name="carbohydrates_100g"
                  className="form-control"
                  value={formData.carbohydrates_100g}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="col-md-3 mb-3">
                <label htmlFor="sugars_100g" className="form-label">Sugars (g)*</label>
                <input
                  type="number"
                  step="0.01"
                  id="sugars_100g"
                  name="sugars_100g"
                  className="form-control"
                  value={formData.sugars_100g}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="col-md-3 mb-3">
                <label htmlFor="fiber_100g" className="form-label">Fiber (g)*</label>
                <input
                  type="number"
                  step="0.01"
                  id="fiber_100g"
                  name="fiber_100g"
                  className="form-control"
                  value={formData.fiber_100g}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="col-md-3 mb-3">
                <label htmlFor="proteins_100g" className="form-label">Proteins (g)*</label>
                <input
                  type="number"
                  step="0.01"
                  id="proteins_100g"
                  name="proteins_100g"
                  className="form-control"
                  value={formData.proteins_100g}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="col-md-3 mb-3">
                <label htmlFor="salt_100g" className="form-label">Salt (g)*</label>
                <input
                  type="number"
                  step="0.01"
                  id="salt_100g"
                  name="salt_100g"
                  className="form-control"
                  value={formData.salt_100g}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="col-md-3 mb-3">
                <label htmlFor="sodium_100g" className="form-label">Sodium (mg)*</label>
                <input
                  type="number"
                  step="0.01"
                  id="sodium_100g"
                  name="sodium_100g"
                  className="form-control"
                  value={formData.sodium_100g}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="col-md-3 mb-3">
                <label htmlFor="iron_100g" className="form-label">Iron (mg)</label>
                <input
                  type="number"
                  step="0.01"
                  id="iron_100g"
                  name="iron_100g"
                  className="form-control"
                  value={formData.iron_100g}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Nutrition Score */}
        <div className="card shadow-sm mb-4">
          <div className="card-header bg-light">
            <h5 className="mb-0">Nutrition Score</h5>
          </div>
          <div className="card-body">
            <div className="row align-items-end">
              <div className="col-md-4 mb-3">
                <label htmlFor="nutrition_grade_fr" className="form-label">Nutrition Grade (A-E)</label>
                <input
                  type="text"
                  id="nutrition_grade_fr"
                  name="nutrition_grade_fr"
                  className="form-control form-control-lg fw-bold text-center"
                  value={formData.nutrition_grade_fr}
                  onChange={handleChange}
                  readOnly
                />
              </div>


              <div className="col-md-4 mb-3">
                <button
                  type="button"
                  className="btn btn-primary w-100 btn-lg"
                  onClick={calculateNutriScore}
                  disabled={predicting}
                >
                  {predicting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Calculating...
                    </>
                  ) : (
                    <>
                      <FaCalculator className="me-2" />
                      Calculate Nutri-Score
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="d-flex justify-content-between mt-4">
          <Link to={`/view-product/${id}`} className="btn btn-outline-secondary btn-lg">
            <FaTimes className="me-2" /> Cancel
          </Link>
          <button
            type="submit"
            className="btn btn-success btn-lg"
            disabled={saving}
          >
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
  );
};

export default EditProduct;