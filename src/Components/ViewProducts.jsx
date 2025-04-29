import React, { useState, useEffect } from "react";
import ProductSearch from "./ProductSearch";
import ProductList from "./ProductList";
import { getAllProducts } from "../api/productService";

const ViewProducts = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Load all products on component mount
  useEffect(() => {
    loadProducts();
  }, []);

  // Filter products when search term changes
  useEffect(() => {
    if (!searchTerm) {
      setFilteredProducts(products);
      return;
    }

    const filtered = products.filter(product => {
      const searchLower = searchTerm.toLowerCase();

      // Search in name
      if (product.name && product.name.toLowerCase().includes(searchLower)) {
        return true;
      }

      // Search in description
      if (product.description && product.description.toLowerCase().includes(searchLower)) {
        return true;
      }

      // Search in category
      if (product.category && product.category.toLowerCase().includes(searchLower)) {
        return true;
      }

      // Search in tags
      if (Array.isArray(product.tags)) {
        for (const tag of product.tags) {
          if (tag.toLowerCase().includes(searchLower)) {
            return true;
          }
        }
      }

      return false;
    });

    setFilteredProducts(filtered);
  }, [searchTerm, products]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getAllProducts();

      // Map the response to ensure consistent product objects
      const productList = response.map(product => ({
        ...product,
        price: product.price || 0,
        stock: product.stock || 0,
        // Ensure other fields are present with defaults
        name: product.name || "Unnamed Product",
        description: product.description || "",
        category: product.category || "",
        tags: Array.isArray(product.tags) ? product.tags : [],
        nutrition_grade_fr: product.nutrition_grade_fr || ""
      }));

      setProducts(productList);
      setFilteredProducts(productList);
    } catch (err) {
      console.error("Error loading products:", err);
      setError("Failed to load products. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (term) => {
    setSearchTerm(term);
  };

  return (
    <div className="container py-4">
      <h2 className="mb-4">Shop Products</h2>

      {/* Search Component */}
   
      {/* Product List Component */}
      <ProductList
        products={filteredProducts}
        loading={loading}
        error={error}
      />

      {/* Active Filters Display */}
      {searchTerm && (
        <div className="mt-3 text-center">
          <p className="text-muted">
            Found {filteredProducts.length} products matching "{searchTerm}"
          </p>
        </div>
      )}
    </div>
  );
};

export default ViewProducts;