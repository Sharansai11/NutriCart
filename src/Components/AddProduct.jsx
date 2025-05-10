import React, { useState } from "react";
import { useAuth } from "../context/Authcontext";
import { addProduct, predictNutriScore } from "../api/productService";

const AddProduct = ({ onProductAdded, onCancel }) => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [predicting, setPredicting] = useState(false);

  // Form state
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
    image: null
  });

  // Food categories
  const categories = [
    "biscuits", "choclates", "Snacks", "Beverages", "Dairy", "Fruits", "Vegetables", 
    "Grains", "Breakfast", "Canned Goods", "Frozen Foods", "sweets"
  ];

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
        ? parseFloat(value)
        : value,
    }));
  };

  // Calculate Nutri-Score
  const calculateNutriScore = async () => {
    setPredicting(true);
    setError("");
    
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
      
      setSuccessMessage(`Nutri-Score calculated: ${prediction.nutrition_grade} `);
    } catch (err) {
      setError("Error calculating Nutri-Score: " + err.message);
    } finally {
      setPredicting(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Process tags as arrays
      const processedData = {
        ...formData,
        tags: formData.tags.split(",").map((tag) => tag.trim()),
        createdBy: currentUser.uid,
      };

      await addProduct(processedData);
      setSuccessMessage("Product added successfully!");

      if (onProductAdded) {
        onProductAdded();
      }
    } catch (err) {
      setError("Error adding product: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card shadow-lg rounded-3 border-0" style={{ maxWidth: "1200px", margin: "0 auto" }}>
      <div className="card-header bg-gradient bg-success text-white p-3 rounded-top">
        <h3 className="mb-0 fw-bold">Add New Food Product</h3>
        <p className="mb-0 mt-1 opacity-75">Complete the information below to add a new product to the inventory</p>
      </div>
      <div className="card-body p-3">
        {error && 
          <div className="alert alert-danger d-flex align-items-center" role="alert">
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            <div>{error}</div>
          </div>
        }
        
        {successMessage && 
          <div className="alert alert-success d-flex align-items-center" role="alert">
            <i className="bi bi-check-circle-fill me-2"></i>
            <div>{successMessage}</div>
          </div>
        }

        <form onSubmit={handleSubmit}>
          <div className="row g-3">
            {/* Basic Information and Pricing & Inventory in one row */}
            <div className="col-md-7">
              <div className="card shadow-sm border-0 h-100">
                <div className="card-body p-3">
                  <h5 className="card-title border-bottom pb-2 mb-3 text-success">
                    <i className="bi bi-info-circle me-2"></i>Basic Information
                  </h5>
                  
                  <div className="row g-2">
                    <div className="col-md-6">
                      <label htmlFor="name" className="form-label fw-semibold">Product Name*</label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        className="form-control"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        placeholder="Enter product name"
                      />
                    </div>
                    
                    <div className="col-md-6">
                      <label htmlFor="category" className="form-label fw-semibold">Category*</label>
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
                    
                    <div className="col-md-12">
                      <label htmlFor="description" className="form-label fw-semibold">Description*</label>
                      <textarea
                        id="description"
                        name="description"
                        className="form-control"
                        rows="2"
                        value={formData.description}
                        onChange={handleChange}
                        required
                        placeholder="Describe your product"
                      />
                    </div>
                    
                    <div className="col-md-12">
                      <label htmlFor="tags" className="form-label fw-semibold">Tags (comma separated)</label>
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
              </div>
            </div>
            
            <div className="col-md-5">
              <div className="card shadow-sm border-0 h-100">
                <div className="card-body p-3">
                  <h5 className="card-title border-bottom pb-2 mb-3 text-success">
                    <i className="bi bi-currency-dollar me-2"></i>Pricing & Inventory
                  </h5>
                  
                  <div className="row g-2">
                    <div className="col-md-6">
                      <label htmlFor="price" className="form-label fw-semibold">Price*</label>
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
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                    
                    <div className="col-md-6">
                      <label htmlFor="weight" className="form-label fw-semibold">Weight (g)*</label>
                      <input
                        type="number"
                        step="0.01"
                        id="weight"
                        name="weight"
                        className="form-control"
                        value={formData.weight}
                        onChange={handleChange}
                        required
                        placeholder="0.00"
                      />
                    </div>
                    
                    <div className="col-md-6">
                      <label htmlFor="stock" className="form-label fw-semibold">Stock*</label>
                      <input
                        type="number"
                        id="stock"
                        name="stock"
                        className="form-control"
                        value={formData.stock}
                        onChange={handleChange}
                        required
                        placeholder="0"
                      />
                    </div>
                    
                    <div className="col-md-6">
                      <label htmlFor="image" className="form-label fw-semibold">Product Image*</label>
                      <input
                        type="file"
                        id="image"
                        name="image"
                        className="form-control"
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Ingredients & Nutritional Information */}
            <div className="col-md-7">
              <div className="card shadow-sm border-0">
                <div className="card-body p-3">
                  <h5 className="card-title border-bottom pb-2 mb-3 text-success">
                    <i className="bi bi-list-ul me-2"></i>Ingredients & Allergens
                  </h5>
                  
                  <div className="row g-2">
                    <div className="col-md-6">
                      <label htmlFor="ingredients_text" className="form-label fw-semibold">Ingredients Text*</label>
                      <textarea
                        id="ingredients_text"
                        name="ingredients_text"
                        className="form-control"
                        rows="3"
                        value={formData.ingredients_text}
                        onChange={handleChange}
                        placeholder="sugar, wheat, milk powder"
                        required
                      />
                    </div>
                    
                    <div className="col-md-6">
                      <label htmlFor="allergens" className="form-label fw-semibold">Allergens</label>
                      <textarea
                        id="allergens"
                        name="allergens"
                        className="form-control"
                        rows="3"
                        value={formData.allergens}
                        onChange={handleChange}
                        placeholder="milk, eggs, nuts, gluten, soy"
                      />
                    </div>
                    
                    <div className="col-md-6">
                      <label htmlFor="additives_n" className="form-label fw-semibold">Number of Additives</label>
                      <input
                        type="number"
                        id="additives_n"
                        name="additives_n"
                        className="form-control"
                        value={formData.additives_n}
                        onChange={handleChange}
                        placeholder="0"
                      />
                    </div>
                    
                    <div className="col-md-6">
                      <label htmlFor="additives" className="form-label fw-semibold">Additives List</label>
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
            
            {/* Nutrition Score and Special Labels */}
            <div className="col-md-5">
              <div className="card shadow-sm border-0">
                <div className="card-body p-3">
                  <div className="row">
                    <div className="col-md-7">
                      <h5 className="card-title border-bottom pb-2 mb-3 text-success">
                        <i className="bi bi-award me-2"></i>Nutrition Score
                      </h5>
                      <div className="row align-items-end g-2">
                        <div className="col-5">
                          <label htmlFor="nutrition_grade_fr" className="form-label fw-semibold">Grade</label>
                          <input
                            type="text"
                            id="nutrition_grade_fr"
                            name="nutrition_grade_fr"
                             className="form-control form-control-lg fw-bold text-center text-uppercase"
                            value={formData.nutrition_grade_fr}
                            onChange={handleChange}
                            readOnly
                            placeholder="--"
                          />
                        </div>
                        
                        <div className="col-7">
                          <button
                            type="button"
                            className="btn btn-primary w-100"
                            onClick={calculateNutriScore}
                            disabled={predicting}
                          >
                            {predicting ? (
                              <>
                                <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                                Calculate...
                              </>
                            ) : (
                              <>
                                <i className="bi bi-calculator me-1"></i>
                                Calculate
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="col-md-5">
                      <h5 className="card-title border-bottom pb-2 mb-3 text-success">
                        <i className="bi bi-tags me-2"></i>Labels
                      </h5>
                      <div className="row g-0">
                        <div className="col-12 mb-1">
                          <div className="form-check form-switch">
                            <input
                              type="checkbox"
                              id="isFeature"
                              name="isFeature"
                              className="form-check-input"
                              checked={formData.isFeature}
                              onChange={handleChange}
                            />
                            <label className="form-check-label" htmlFor="isFeature">Featured</label>
                          </div>
                        </div>
                        
                        <div className="col-12 mb-1">
                          <div className="form-check form-switch">
                            <input
                              type="checkbox"
                              id="isNewArrival"
                              name="isNewArrival"
                              className="form-check-input"
                              checked={formData.isNewArrival}
                              onChange={handleChange}
                            />
                            <label className="form-check-label" htmlFor="isNewArrival">New Arrival</label>
                          </div>
                        </div>
                        
                        <div className="col-12 mb-1">
                          <div className="form-check form-switch">
                            <input
                              type="checkbox"
                              id="organicCertified"
                              name="organicCertified"
                              className="form-check-input"
                              checked={formData.organicCertified}
                              onChange={handleChange}
                            />
                            <label className="form-check-label" htmlFor="organicCertified">Organic</label>
                          </div>
                        </div>
                        
                        <div className="col-12 mb-1">
                          <div className="form-check form-switch">
                            <input
                              type="checkbox"
                              id="veganFriendly"
                              name="veganFriendly"
                              className="form-check-input"
                              checked={formData.veganFriendly}
                              onChange={handleChange}
                            />
                            <label className="form-check-label" htmlFor="veganFriendly">Vegan</label>
                          </div>
                        </div>
                        
                        <div className="col-12">
                          <div className="form-check form-switch">
                            <input
                              type="checkbox"
                              id="glutenFree"
                              name="glutenFree"
                              className="form-check-input"
                              checked={formData.glutenFree}
                              onChange={handleChange}
                            />
                            <label className="form-check-label" htmlFor="glutenFree">Gluten-Free</label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Nutritional Information */}
            <div className="col-12">
              <div className="card shadow-sm border-0">
                <div className="card-body p-3">
                  <h5 className="card-title border-bottom pb-2 mb-3 text-success">
                    <i className="bi bi-heart-pulse me-2"></i>Nutritional Information (per 100g)
                  </h5>
                  
                  <div className="row g-2">
                    <div className="col-md-2 col-4">
                      <label htmlFor="energy_100g" className="form-label fw-semibold">Energy (kcal)*</label>
                      <input
                        type="number"
                        step="0.01"
                        id="energy_100g"
                        name="energy_100g"
                        className="form-control"
                        value={formData.energy_100g}
                        onChange={handleChange}
                        required
                        placeholder="0.00"
                      />
                    </div>
                    
                    <div className="col-md-2 col-4">
                      <label htmlFor="fat_100g" className="form-label fw-semibold">Fat (g)*</label>
                      <input
                        type="number"
                        step="0.01"
                        id="fat_100g"
                        name="fat_100g"
                        className="form-control"
                        value={formData.fat_100g}
                        onChange={handleChange}
                        required
                        placeholder="0.00"
                      />
                    </div>
                    
                    <div className="col-md-2 col-4">
                      <label htmlFor="saturated-fat_100g" className="form-label fw-semibold">Saturated Fat*</label>
                      <input
                        type="number"
                        step="0.01"
                        id="saturated-fat_100g"
                        name="saturated-fat_100g"
                        className="form-control"
                        value={formData["saturated-fat_100g"]}
                        onChange={handleChange}
                        required
                        placeholder="0.00"
                      />
                    </div>
                    
                    <div className="col-md-2 col-4">
                      <label htmlFor="carbohydrates_100g" className="form-label fw-semibold">Carbs (g)*</label>
                      <input
                        type="number"
                        step="0.01"
                        id="carbohydrates_100g"
                        name="carbohydrates_100g"
                        className="form-control"
                        value={formData.carbohydrates_100g}
                        onChange={handleChange}
                        required
                        placeholder="0.00"
                      />
                    </div>
                    
                    <div className="col-md-2 col-4">
                      <label htmlFor="sugars_100g" className="form-label fw-semibold">Sugars (g)*</label>
                      <input
                        type="number"
                        step="0.01"
                        id="sugars_100g"
                        name="sugars_100g"
                        className="form-control"
                        value={formData.sugars_100g}
                        onChange={handleChange}
                        required
                        placeholder="0.00"
                      />
                    </div>
                    
                    <div className="col-md-2 col-4">
                      <label htmlFor="fiber_100g" className="form-label fw-semibold">Fiber (g)*</label>
                      <input
                        type="number"
                        step="0.01"
                        id="fiber_100g"
                        name="fiber_100g"
                        className="form-control"
                        value={formData.fiber_100g}
                        onChange={handleChange}
                        required
                        placeholder="0.00"
                      />
                    </div>
                    
                    <div className="col-md-2 col-4">
                      <label htmlFor="proteins_100g" className="form-label fw-semibold">Proteins (g)*</label>
                      <input
                        type="number"
                        step="0.01"
                        id="proteins_100g"
                        name="proteins_100g"
                        className="form-control"
                        value={formData.proteins_100g}
                        onChange={handleChange}
                        required
                        placeholder="0.00"
                      />
                    </div>
                    
                    <div className="col-md-2 col-4">
                      <label htmlFor="salt_100g" className="form-label fw-semibold">Salt (g)*</label>
                      <input
                        type="number"
                        step="0.01"
                        id="salt_100g"
                        name="salt_100g"
                        className="form-control"
                        value={formData.salt_100g}
                        onChange={handleChange}
                        required
                        placeholder="0.00"
                      />
                    </div>
                    
                    <div className="col-md-2 col-4">
                      <label htmlFor="sodium_100g" className="form-label fw-semibold">Sodium (mg)*</label>
                      <input
                        type="number"
                        step="0.01"
                        id="sodium_100g"
                        name="sodium_100g"
                        className="form-control"
                        value={formData.sodium_100g}
                        onChange={handleChange}
                        required
                        placeholder="0.00"
                      />
                    </div>
                    
                    <div className="col-md-2 col-4">
                      <label htmlFor="iron_100g" className="form-label fw-semibold">Iron (mg)</label>
                      <input
                        type="number"
                        step="0.01"
                        id="iron_100g"
                        name="iron_100g"
                        className="form-control"
                        value={formData.iron_100g}
                        onChange={handleChange}
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="d-flex justify-content-end gap-3 mt-3">
            <button
              type="button"
              className="btn btn-outline-secondary px-4"
              onClick={onCancel}
              disabled={loading}
            >
              <i className="bi bi-x-circle me-2"></i>Cancel
            </button>
            <button
              type="submit"
              className="btn btn-success px-5"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Adding Product...
                </>
              ) : (
                <>
                  <i className="bi bi-plus-circle me-2"></i>
                  Add Product
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProduct;