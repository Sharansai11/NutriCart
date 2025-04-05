import React, { useState, useEffect } from "react";
import { useAuth } from "../context/Authcontext";
import { getProducts, deleteProduct } from "../api/productService";
import { FaPlus, FaTrash, FaEdit, FaEye } from "react-icons/fa";
import { Link } from "react-router-dom";

const Myproducts = () => {
  const { currentUser } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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
        setProducts(products.filter((product) => product.id !== productId));
        setSuccess("Product deleted successfully!");
      } catch (err) {
        setError("Error deleting product: " + err.message);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Product Management</h2>
        <Link to="/admin/addproduct" className="btn btn-primary">
          <FaPlus className="me-2" /> Add Product
        </Link>
      </div>

      {/* Success/Error Messages */}
      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="row">
        {loading ? (
          <div className="col-12 text-center">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : (
          <>
            {products.length === 0 ? (
              <div className="col-12 text-center py-4">
                No products found.
              </div>
            ) : (
              products.map((product) => (
                <div className="col-md-4 mb-4" key={product.id}>
                  <div className="card shadow-sm h-100">
                    <img
                      src={product.imageUrl || "https://via.placeholder.com/300"}
                      alt={product.name}
                      className="card-img-top"
                      style={{
                        height: "200px",
                        borderRadius: "8px",
                      }}
                    />
                    <div className="card-body d-flex flex-column">
                      <h5 className="card-title">{product.name}</h5>
                      <p className="card-text">{product.category}</p>
                      <p className="card-text">
                        <strong>Price:</strong> ${parseFloat(product.basePrice).toFixed(2)}
                      </p>
                      <p className="card-text">
                        <strong>Stock:</strong> <span className={`badge ${product.stock > 10 ? 'bg-success' : product.stock > 0 ? 'bg-warning' : 'bg-danger'}`}>
                          {product.stock}
                        </span>
                      </p>

                      {/* Actions for View, Edit, Delete */}
                      <div className="d-flex justify-content-between">
                        <Link to={`/view-product/${product.id}`} className="btn btn-outline-primary btn-sm">
                          <FaEye className="me-2" /> View
                        </Link>
                        <Link to={`/edit-product/${product.id}`} className="btn btn-outline-secondary btn-sm">
                          <FaEdit className="me-2" /> Edit
                        </Link>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="btn btn-outline-danger btn-sm"
                        >
                          <FaTrash className="me-2" /> Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Myproducts;
