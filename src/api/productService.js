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
// Predict Nutri-Score using the pre-trained model
// src/api/productService.js - Replace the current predictNutriScore function
export const predictNutriScore = async (nutritionData) => {
  try {
    const response = await fetch('http://localhost:5000/api/predict-nutriscore', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(nutritionData),
    });
    
    if (!response.ok) {
      throw new Error('Failed to get prediction');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error predicting nutri-score:', error);
    throw error;
  }
};


// Add a new product to Firebase
export const addProduct = async (productData) => {
  try {
    // Upload image if provided
    let imageUrl = null;
    if (productData.image) {
      const storageRef = ref(storage, `products/${Date.now()}_${productData.image.name}`);
      const uploadTask = uploadBytesResumable(storageRef, productData.image);

      await new Promise((resolve, reject) => {
        uploadTask.on(
          "state_changed",
          null,
          (error) => reject(error),
          () => resolve()
        );
      });

      imageUrl = await getDownloadURL(storageRef);
    }

    // Prepare data
    const productToSave = {
      // Basic Product Info
      name: productData.name,
      description: productData.description,
      category: productData.category,
      tags: Array.isArray(productData.tags)
        ? productData.tags
        : (productData.tags ? productData.tags.split(',').map(tag => tag.trim()) : []),

      // Pricing and Inventory
      price: parseFloat(productData.price) || 0,
      stock: parseInt(productData.stock) || 0,
      weight: parseFloat(productData.weight) || 0,

      // Nutritional Information
      energy_100g: parseFloat(productData.energy_100g) || 0,
      fat_100g: parseFloat(productData.fat_100g) || 0,
      'saturated-fat_100g': parseFloat(productData['saturated-fat_100g']) || 0,
      carbohydrates_100g: parseFloat(productData.carbohydrates_100g) || 0,
      sugars_100g: parseFloat(productData.sugars_100g) || 0,
      fiber_100g: parseFloat(productData.fiber_100g) || 0,
      proteins_100g: parseFloat(productData.proteins_100g) || 0,
      salt_100g: parseFloat(productData.salt_100g) || 0,
      sodium_100g: parseFloat(productData.sodium_100g) || 0,
      iron_100g: parseFloat(productData.iron_100g) || 0,

      // Ingredients & Additives
      ingredients_text: productData.ingredients_text || "",
      additives_n: parseInt(productData.additives_n) || 0,
      additives: productData.additives || "",
      allergens: productData.allergens || "",

      // Nutrition Score
      nutrition_grade_fr: productData.nutrition_grade_fr || "",
      nutrition_score: parseFloat(productData.nutrition_score) || 0,

      // Special Labels
      isFeature: Boolean(productData.isFeature),
      isNewArrival: Boolean(productData.isNewArrival),
      organicCertified: Boolean(productData.organicCertified),
      veganFriendly: Boolean(productData.veganFriendly),
      glutenFree: Boolean(productData.glutenFree),

      // Media
      imageUrl: imageUrl,

      // Metadata
      createdBy: productData.createdBy || null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, "products"), productToSave);
    return { id: docRef.id, ...productToSave };
  } catch (error) {
    console.error("Error adding product:", error);
    throw error;
  }
};


// Get all products
export const getProducts = async () => {
  try {
    const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error getting products:", error);
    throw error;
  }
};


export const getAllProducts = async () => {
  try {
    const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error getting products:", error);
    throw error;
  }
};

// Get a single product by ID
export const getProductById = async (productId) => {
  try {
    const docRef = doc(db, "products", productId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    } else {
      throw new Error("Product not found");
    }
  } catch (error) {
    console.error("Error getting product:", error);
    throw error;
  }
};

// Update a product
export const updateProduct = async (productId, productData) => {
  try {
    const docRef = doc(db, "products", productId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      throw new Error("Product not found");
    }
    
    // Handle image update if provided
    let imageUrl = productData.imageUrl;
    if (productData.image && typeof productData.image !== 'string') {
      // Delete old image if exists
      if (docSnap.data().imageUrl) {
        try {
          const oldImageRef = ref(storage, docSnap.data().imageUrl);
          await deleteObject(oldImageRef);
        } catch (error) {
          console.warn("Error deleting old image:", error);
        }
      }
      
      // Upload new image
      const storageRef = ref(storage, `products/${Date.now()}_${productData.image.name}`);
      const uploadTask = uploadBytesResumable(storageRef, productData.image);
      
      await new Promise((resolve, reject) => {
        uploadTask.on(
          "state_changed",
          (snapshot) => {
            // Progress tracking if needed
          },
          (error) => {
            reject(error);
          },
          () => {
            resolve();
          }
        );
      });
      
      imageUrl = await getDownloadURL(storageRef);
    }
    
    // Prepare updated product data
    const productToUpdate = {
      // Same structure as addProduct but with imageUrl update
      ...productData,
      imageUrl: imageUrl,
      updatedAt: serverTimestamp(),
    };
    
    // Remove file object to avoid Firestore error
    if (productToUpdate.image) {
      delete productToUpdate.image;
    }
    
    // Update Firestore
    await updateDoc(docRef, productToUpdate);
    return { id: productId, ...productToUpdate };
  } catch (error) {
    console.error("Error updating product:", error);
    throw error;
  }
};

// Delete a product
export const deleteProduct = async (productId) => {
  try {
    const docRef = doc(db, "products", productId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      throw new Error("Product not found");
    }
    
    // Delete image from storage if exists
    if (docSnap.data().imageUrl) {
      try {
        const imageRef = ref(storage, docSnap.data().imageUrl);
        await deleteObject(imageRef);
      } catch (error) {
        console.warn("Error deleting image:", error);
      }
    }
    
    // Delete document
    await deleteDoc(docRef);
    return { id: productId };
  } catch (error) {
    console.error("Error deleting product:", error);
    throw error;
  }
};

// Get featured products
export const getFeaturedProducts = async (limit = 8) => {
  try {
    const q = query(
      collection(db, "products"),
      where("isFeature", "==", true),
      orderBy("createdAt", "desc"),
      limit(limit)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error getting featured products:", error);
    throw error;
  }
};

// Get new arrivals
export const getNewArrivals = async (limit = 8) => {
  try {
    const q = query(
      collection(db, "products"),
      where("isNewArrival", "==", true),
      orderBy("createdAt", "desc"),
      limit(limit)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error getting new arrivals:", error);
    throw error;
  }
};

// Get products by category
export const getProductsByCategory = async (category) => {
  try {
    const q = query(
      collection(db, "products"),
      where("category", "==", category),
      orderBy("createdAt", "desc")
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error getting products by category:", error);
    throw error;
  }
};