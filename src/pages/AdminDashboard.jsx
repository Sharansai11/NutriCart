import React, { useState } from "react";
import { db, storage } from "../api/firebaseConfig"; // Corrected import of db and storage
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";

const AdminDashboard = () => {
  const [productName, setProductName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [image, setImage] = useState(null);
  const [stock, setStock] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Handle product image upload to Firebase Storage
  const handleImageUpload = (file) => {
    return new Promise((resolve, reject) => {
      const storageRef = ref(storage, `productImages/${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          // Optionally track the progress of the upload here
        },
        (error) => {
          reject(error); // Reject the promise if an error occurs
        },
        () => {
          // On successful upload, get the image download URL
          getDownloadURL(uploadTask.snapshot.ref)
            .then((downloadURL) => {
              resolve(downloadURL); // Return the download URL
            })
            .catch((error) => reject(error)); // Catch any errors during download URL fetch
        }
      );
    });
  };

  // Handle form submission to add product
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      // Upload the product image and get the image URL
      const imageUrl = image ? await handleImageUpload(image) : "";

      // Add product details to Firestore (using db)
      await addDoc(collection(db, "products"), {
        name: productName,
        description: description,
        price: parseFloat(price),
        category: category,
        imageUrl: imageUrl, // Store image URL in Firestore
        stock: parseInt(stock),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        isActive: true,
        createdBy: "admin_id", // Replace with actual admin ID from Firebase Auth
      });

      // Set success message and reset form fields
      setSuccess("Product uploaded successfully!");
      setProductName("");
      setDescription("");
      setPrice("");
      setCategory("");
      setImage(null);
      setStock("");
    } catch (error) {
      setError("Error uploading product: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-5">
      <h2 className="mb-4">Admin Dashboard</h2>

      <div className="card p-4">
        <h4>Upload New Product</h4>
        {error && <div className="alert alert-danger">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group mb-3">
            <label htmlFor="productName">Product Name</label>
            <input
              type="text"
              id="productName"
              className="form-control"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              required
            />
          </div>

          <div className="form-group mb-3">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              className="form-control"
              rows="4"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          <div className="form-group mb-3">
            <label htmlFor="price">Price</label>
            <input
              type="number"
              id="price"
              className="form-control"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
            />
          </div>

          <div className="form-group mb-3">
            <label htmlFor="category">Category</label>
            <input
              type="text"
              id="category"
              className="form-control"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
            />
          </div>

          <div className="form-group mb-3">
            <label htmlFor="stock">Stock</label>
            <input
              type="number"
              id="stock"
              className="form-control"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              required
            />
          </div>

          <div className="form-group mb-3">
            <label htmlFor="image">Product Image</label>
            <input
              type="file"
              id="image"
              className="form-control"
              onChange={(e) => setImage(e.target.files[0])}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Uploading..." : "Upload Product"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminDashboard;
