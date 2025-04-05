import React, { useState, useEffect } from "react";
import { useAuth } from "../context/Authcontext";
import { getProducts, deleteProduct } from "../api/productService";
import { FaPlus, FaTrash, FaEdit, FaEye } from "react-icons/fa";
import AddProduct from "../Components/AddProduct";

const AdminDashboard = () => {
  const { currentUser } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  
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
    } finally {
      setLoading(false);
    }
  };

  // Handle product deletion
  const handleDelete = async (productId) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        setLoading(true);
        await deleteProduct(productId);
        
        // Update product list
        setProducts(products.filter(product => product.id !== productId));
        setSuccess("Product deleted successfully!");
      } catch (err) {
        setError("Error deleting product: " + err.message);
      } finally {
        setLoading(false);
      }
    }
  };

  // Handle after product is added
  const handleProductAdded = async () => {
    setSuccess("Product added successfully!");
    setShowAddForm(false);
    await loadProducts();
  };

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Product Management</h2>
        <button 
          className="btn btn-primary" 
          onClick={() => setShowAddForm(!showAddForm)}
        >
          {showAddForm ? "Cancel" : <><FaPlus className="me-2" /> Add Product</>}
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Add Product Form */}
      {showAddForm && (
        <AddProduct 
          onProductAdded={handleProductAdded} 
          onCancel={() => setShowAddForm(false)}
        />
      )}

      {/* Products Table */}
      <div className="card shadow-sm">
        <div className="card-header bg-white">
          <h4 className="mb-0">Products</h4>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>Image</th>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Base Price</th>
                  <th>Sale Price</th>
                  <th>Stock</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan="7" className="text-center py-4">
                      <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    </td>
                  </tr>
                )}
                
                {!loading && products.length === 0 && (
                  <tr>
                    <td colSpan="7" className="text-center py-4">
                      No products found.
                    </td>
                  </tr>
                )}
                
                {!loading &&
                  products.map((product) => (
                    <tr key={product.id}>
                      <td>
                        <img
                          src={product.imageUrl || "https://via.placeholder.com/50"}
                          alt={product.name}
                          className="img-thumbnail"
                          style={{ width: "50px", height: "50px", objectFit: "cover" }}
                        />
                      </td>
                      <td>{product.name}</td>
                      <td>{product.category}</td>
                      <td>${parseFloat(product.basePrice).toFixed(2)}</td>
                      <td>
                        {product.salePrice
                          ? `$${parseFloat(product.salePrice).toFixed(2)}`
                          : "-"}
                      </td>
                      <td>
                        <span className={`badge ${product.stock > 10 ? 'bg-success' : product.stock > 0 ? 'bg-warning' : 'bg-danger'}`}>
                          {product.stock}
                        </span>
                      </td>
                      <td>
                        <div className="btn-group">
                          <button
                            className="btn btn-sm btn-outline-primary"
                            title="View"
                          >
                            <FaEye />
                          </button>
                          <button
                            className="btn btn-sm btn-outline-secondary"
                            title="Edit"
                          >
                            <FaEdit />
                          </button>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            title="Delete"
                            onClick={() => handleDelete(product.id)}
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;