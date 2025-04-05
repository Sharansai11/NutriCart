// src/api/productService.js
import { db, storage } from "./firebaseConfig";
import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
} from "firebase/firestore";
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";

/**
 * Upload a product image to Firebase Storage
 * @param {File} file - The image file to upload
 * @returns {Promise<string>} - The download URL of the uploaded image
 */
export const uploadProductImage = async (file) => {
  if (!file) return null;
  
  const filename = `${Date.now()}-${file.name}`;
  const storageRef = ref(storage, `products/${filename}`);
  const uploadTask = uploadBytesResumable(storageRef, file);
  
  return new Promise((resolve, reject) => {
    uploadTask.on(
      "state_changed",
      (snapshot) => {
        // Progress monitoring if needed
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        console.log(`Upload is ${progress}% done`);
      },
      (error) => {
        // Error handling
        reject(error);
      },
      async () => {
        // Upload completed successfully
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadURL);
        } catch (error) {
          reject(error);
        }
      }
    );
  });
};

/**
 * Add a new product to Firestore
 * @param {Object} productData - The product data
 * @returns {Promise<string>} - The ID of the newly created product
 */
export const addProduct = async (productData) => {
  try {
    // Upload image if provided
    let imageUrl = null;
    if (productData.image) {
      imageUrl = await uploadProductImage(productData.image);
    }
    
    // Calculate current price based on base price and sale price
    let currentPrice = parseFloat(productData.basePrice);
    
    if (productData.salePrice && parseFloat(productData.salePrice) > 0) {
      currentPrice = parseFloat(productData.salePrice);
    }
    
    // Format product data for Firestore
    const product = {
      name: productData.name,
      description: productData.description,
      basePrice: parseFloat(productData.basePrice),
      salePrice: productData.salePrice ? parseFloat(productData.salePrice) : null,
      currentPrice: currentPrice,
      discount: productData.discount,
      category: productData.category,
      stock: parseInt(productData.stock),
      weight: productData.weight ? parseFloat(productData.weight) : null,
      imageUrl: imageUrl,
      tags: productData.tags || [],
      features: productData.features || [],
      isFeature: Boolean(productData.isFeature),
      isNewArrival: Boolean(productData.isNewArrival),
      // AI price optimization related fields
      priceHistory: [{
        price: currentPrice,
        date: new Date().toISOString(),
        reason: "Initial pricing"
      }],
      demandScore: 5, // Default medium demand (1-10 scale)
      popularityScore: 0,
      viewCount: 0,
      purchaseCount: 0,
      // Timestamps
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdBy: productData.createdBy || "unknown",
    };
    
    // Add to Firestore
    const docRef = await addDoc(collection(db, "products"), product);
    return docRef.id;
  } catch (error) {
    console.error("Error adding product:", error);
    throw error;
  }
};

/**
 * Get all products from Firestore
 * @param {number} limitCount - Optional limit of products to retrieve
 * @returns {Promise<Array>} - Array of products
 */
export const getProducts = async (limitCount = 100) => {
  try {
    const q = query(
      collection(db, "products"),
      orderBy("createdAt", "desc"),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    const products = [];
    
    querySnapshot.forEach((doc) => {
      products.push({
        id: doc.id,
        ...doc.data(),
        // Convert Firestore timestamps to dates for easier handling
        createdAt: doc.data().createdAt?.toDate() || null,
        updatedAt: doc.data().updatedAt?.toDate() || null,
      });
    });
    
    return products;
  } catch (error) {
    console.error("Error getting products:", error);
    throw error;
  }
};

/**
 * Get a single product by ID
 * @param {string} productId - The product ID
 * @returns {Promise<Object>} - The product data
 */
export const getProductById = async (productId) => {
  try {
    const docRef = doc(db, "products", productId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
        createdAt: docSnap.data().createdAt?.toDate() || null,
        updatedAt: docSnap.data().updatedAt?.toDate() || null,
      };
    } else {
      throw new Error("Product not found");
    }
  } catch (error) {
    console.error("Error getting product:", error);
    throw error;
  }
};

/**
 * Update an existing product
 * @param {string} productId - The product ID
 * @param {Object} productData - The updated product data
 * @returns {Promise<void>}
 */
export const updateProduct = async (productId, productData) => {
  try {
    const productRef = doc(db, "products", productId);
    
    // Upload new image if provided
    let imageUrl = productData.imageUrl;
    if (productData.image) {
      imageUrl = await uploadProductImage(productData.image);
    }
    
    // Calculate current price based on base price and sale price
    let currentPrice = parseFloat(productData.basePrice);
    
    if (productData.salePrice && parseFloat(productData.salePrice) > 0) {
      currentPrice = parseFloat(productData.salePrice);
    }
    
    // Check if price changed
    const existingProduct = await getProductById(productId);
    const priceChanged = existingProduct.currentPrice !== currentPrice;
    
    // Update price history if price changed
    let priceHistory = existingProduct.priceHistory || [];
    if (priceChanged) {
      priceHistory.push({
        price: currentPrice,
        date: new Date().toISOString(),
        reason: productData.priceChangeReason || "Manual update"
      });
    }
    
    // Format product data for update
    const updatedProduct = {
      name: productData.name,
      description: productData.description,
      basePrice: parseFloat(productData.basePrice),
      salePrice: productData.salePrice ? parseFloat(productData.salePrice) : null,
      currentPrice: currentPrice,
      category: productData.category,
      discount: productData.discount,
      stock: parseInt(productData.stock),
      weight: productData.weight ? parseFloat(productData.weight) : existingProduct.weight,
      imageUrl: imageUrl,
      tags: productData.tags || existingProduct.tags,
      features: productData.features || existingProduct.features,
      isFeature: Boolean(productData.isFeature),
      isNewArrival: Boolean(productData.isNewArrival),
      priceHistory: priceHistory,
      updatedAt: serverTimestamp(),
    };
    
    // Update in Firestore
    await updateDoc(productRef, updatedProduct);
  } catch (error) {
    console.error("Error updating product:", error);
    throw error;
  }
};

/**
 * Delete a product
 * @param {string} productId - The product ID
 * @returns {Promise<void>}
 */
export const deleteProduct = async (productId) => {
  try {
    // Get product data to delete image
    const product = await getProductById(productId);
    
    // Delete product document
    await deleteDoc(doc(db, "products", productId));
    
    // Delete product image if exists
    if (product.imageUrl) {
      const imageRef = ref(storage, product.imageUrl);
      try {
        await deleteObject(imageRef);
      } catch (imageError) {
        console.warn("Could not delete image:", imageError);
        // Continue even if image deletion fails
      }
    }
  } catch (error) {
    console.error("Error deleting product:", error);
    throw error;
  }
};

/**
 * Get products by category
 * @param {string} category - The category name
 * @param {number} limitCount - Optional limit of products to retrieve
 * @returns {Promise<Array>} - Array of products
 */
export const getProductsByCategory = async (category, limitCount = 50) => {
  try {
    const q = query(
      collection(db, "products"),
      where("category", "==", category),
      orderBy("createdAt", "desc"),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    const products = [];
    
    querySnapshot.forEach((doc) => {
      products.push({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || null,
        updatedAt: doc.data().updatedAt?.toDate() || null,
      });
    });
    
    return products;
  } catch (error) {
    console.error("Error getting products by category:", error);
    throw error;
  }
};

/**
 * Get featured products
 * @param {number} limitCount - Optional limit of products to retrieve
 * @returns {Promise<Array>} - Array of featured products
 */
export const getFeaturedProducts = async (limitCount = 10) => {
  try {
    const q = query(
      collection(db, "products"),
      where("isFeature", "==", true),
      where("stock", ">", 0),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    const products = [];
    
    querySnapshot.forEach((doc) => {
      products.push({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || null,
        updatedAt: doc.data().updatedAt?.toDate() || null,
      });
    });
    
    return products;
  } catch (error) {
    console.error("Error getting featured products:", error);
    throw error;
  }
};

/**
 * Get new arrivals
 * @param {number} limitCount - Optional limit of products to retrieve
 * @returns {Promise<Array>} - Array of new arrival products
 */
export const getNewArrivals = async (limitCount = 10) => {
  try {
    const q = query(
      collection(db, "products"),
      where("isNewArrival", "==", true),
      where("stock", ">", 0),
      orderBy("createdAt", "desc"),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    const products = [];
    
    querySnapshot.forEach((doc) => {
      products.push({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || null,
        updatedAt: doc.data().updatedAt?.toDate() || null,
      });
    });
    
    return products;
  } catch (error) {
    console.error("Error getting new arrivals:", error);
    throw error;
  }
};

/**
 * Update product stock
 * @param {string} productId - The product ID
 * @param {number} newStock - The new stock quantity
 * @returns {Promise<void>}
 */
export const updateProductStock = async (productId, newStock) => {
  try {
    const productRef = doc(db, "products", productId);
    
    await updateDoc(productRef, {
      stock: parseInt(newStock),
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error("Error updating product stock:", error);
    throw error;
  }
};

/**
 * Search products by name, description, or tags
 * @param {string} searchTerm - The search term
 * @param {number} limitCount - Optional limit of products to retrieve
 * @returns {Promise<Array>} - Array of matching products
 */
export const searchProducts = async (searchTerm, limitCount = 50) => {
  try {
    // This is a simple implementation for hackathon purposes
    // For production, consider using Firebase Extensions like Algolia or a dedicated search service
    
    const searchTermLower = searchTerm.toLowerCase();
    
    // Get all products and filter client-side (not efficient for large datasets)
    const productsSnapshot = await getDocs(collection(db, "products"));
    const products = [];
    
    productsSnapshot.forEach((doc) => {
      const product = {
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || null,
        updatedAt: doc.data().updatedAt?.toDate() || null,
      };
      
      // Check if product matches search term
      const nameMatch = product.name?.toLowerCase().includes(searchTermLower);
      const descMatch = product.description?.toLowerCase().includes(searchTermLower);
      const categoryMatch = product.category?.toLowerCase().includes(searchTermLower);
      const tagMatch = product.tags?.some(tag => tag.toLowerCase().includes(searchTermLower));
      
      if (nameMatch || descMatch || categoryMatch || tagMatch) {
        products.push(product);
      }
    });
    
    return products.slice(0, limitCount);
  } catch (error) {
    console.error("Error searching products:", error);
    throw error;
  }
};

/**
 * Update product view count
 * @param {string} productId - The product ID
 * @returns {Promise<void>}
 */
export const incrementProductView = async (productId) => {
  try {
    const productRef = doc(db, "products", productId);
    const productSnap = await getDoc(productRef);
    
    if (productSnap.exists()) {
      const currentViews = productSnap.data().viewCount || 0;
      
      await updateDoc(productRef, {
        viewCount: currentViews + 1,
        // Optionally update popularityScore based on views
        popularityScore: calculatePopularityScore(
          currentViews + 1,
          productSnap.data().purchaseCount || 0
        )
      });
    }
  } catch (error) {
    console.error("Error updating product view count:", error);
    // Don't throw error to prevent disrupting the user experience
  }
};

/**
 * Calculate popularity score based on views and purchases
 * @param {number} views - Number of views
 * @param {number} purchases - Number of purchases
 * @returns {number} - Popularity score (0-10)
 */
const calculatePopularityScore = (views, purchases) => {
  // Simple formula for popularity score
  // Customize this based on your business logic
  const viewFactor = Math.min(views / 100, 5); // Max 5 points from views
  const purchaseFactor = Math.min(purchases * 0.5, 5); // Max 5 points from purchases
  
  return Math.min(viewFactor + purchaseFactor, 10);
};