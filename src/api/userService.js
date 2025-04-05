// src/api/userService.js
import { db } from "./firebaseConfig";
import {
  collection,
  getDocs,
  getDoc,
  setDoc,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  increment
} from "firebase/firestore";

/**
 * Get all products
 * @param {number} limitCount - Optional limit of products to retrieve
 * @returns {Promise<Array>} - Array of products
 */
export const getProducts = async (limitCount = 50) => {
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
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
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
      // Increment view count
      await updateDoc(docRef, {
        viewCount: increment(1)
      });
      
      return {
        id: docSnap.id,
        ...docSnap.data(),
        createdAt: docSnap.data().createdAt?.toDate() || new Date(),
        updatedAt: docSnap.data().updatedAt?.toDate() || new Date(),
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
 * Add product to wishlist
 * @param {string} userId - The user ID
 * @param {string} productId - The product ID
 * @returns {Promise<void>}
 */
export const addToWishlist = async (userId, productId) => {
  try {
    // Get product details
    const product = await getProductById(productId);
    
    if (!product) {
      throw new Error("Product not found");
    }
    
    // Check if wishlist exists
    const wishlistRef = doc(db, "wishlists", userId);
    const wishlistSnap = await getDoc(wishlistRef);
    
    if (wishlistSnap.exists()) {
      // Wishlist exists, check if item is already in wishlist
      const wishlistData = wishlistSnap.data();
      const existingItem = wishlistData.items.find(item => item.productId === productId);
      
      if (existingItem) {
        // Item already in wishlist, no need to add again
        return;
      } else {
        // Add new item to wishlist
        const newItem = {
          productId: productId,
          name: product.name,
          imageUrl: product.imageUrl,
          price: product.currentPrice,
          addedAt: new Date().toISOString()
        };
        
        await updateDoc(wishlistRef, {
          items: arrayUnion(newItem),
          updatedAt: serverTimestamp()
        });
      }
    } else {
      // Create new wishlist
      const newItem = {
        productId: productId,
        name: product.name,
        imageUrl: product.imageUrl,
        price: product.currentPrice,
        addedAt: new Date().toISOString()
      };
      
      await setDoc(wishlistRef, {
        userId: userId,
        items: [newItem],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }
  } catch (error) {
    console.error("Error adding to wishlist:", error);
    throw error;
  }
};

/**
 * Get user's wishlist
 * @param {string} userId - The user ID
 * @returns {Promise<Object>} - The wishlist data
 */
export const getWishlist = async (userId) => {
  try {
    const wishlistRef = doc(db, "wishlists", userId);
    const wishlistSnap = await getDoc(wishlistRef);
    
    if (wishlistSnap.exists()) {
      return {
        id: wishlistSnap.id,
        ...wishlistSnap.data(),
        createdAt: wishlistSnap.data().createdAt?.toDate() || new Date(),
        updatedAt: wishlistSnap.data().updatedAt?.toDate() || new Date(),
      };
    } else {
      // Return empty wishlist if not exists
      return {
        userId: userId,
        items: []
      };
    }
  } catch (error) {
    console.error("Error getting wishlist:", error);
    throw error;
  }
};

/**
 * Remove item from wishlist
 * @param {string} userId - The user ID
 * @param {string} productId - The product ID to remove
 * @returns {Promise<void>}
 */
export const removeFromWishlist = async (userId, productId) => {
  try {
    const wishlistRef = doc(db, "wishlists", userId);
    const wishlistSnap = await getDoc(wishlistRef);
    
    if (wishlistSnap.exists()) {
      const wishlistData = wishlistSnap.data();
      const itemToRemove = wishlistData.items.find(item => item.productId === productId);
      
      if (!itemToRemove) {
        throw new Error("Item not found in wishlist");
      }
      
      const updatedItems = wishlistData.items.filter(item => item.productId !== productId);
      
      await updateDoc(wishlistRef, {
        items: updatedItems,
        updatedAt: serverTimestamp()
      });
    }
  } catch (error) {
    console.error("Error removing from wishlist:", error);
    throw error;
  }
};

/**
 * Check if a product is in user's wishlist
 * @param {string} userId - The user ID
 * @param {string} productId - The product ID
 * @returns {Promise<boolean>} - True if product is in wishlist
 */
export const isInWishlist = async (userId, productId) => {
  try {
    const wishlistRef = doc(db, "wishlists", userId);
    const wishlistSnap = await getDoc(wishlistRef);
    
    if (wishlistSnap.exists()) {
      const wishlistData = wishlistSnap.data();
      return wishlistData.items.some(item => item.productId === productId);
    }
    
    return false;
  } catch (error) {
    console.error("Error checking wishlist:", error);
    return false;
  }
};

/**
 * Add product to cart
 * @param {string} userId - The user ID
 * @param {string} productId - The product ID
 * @param {number} quantity - The quantity to add (default: 1)
 * @returns {Promise<void>}
 */
export const addToCart = async (userId, productId, quantity = 1) => {
  try {
    // Get product details
    const product = await getProductById(productId);
    
    if (!product) {
      throw new Error("Product not found");
    }
    
    if (product.stock < quantity) {
      throw new Error("Not enough stock available");
    }
    
    // Check if cart exists
    const cartRef = doc(db, "carts", userId);
    const cartSnap = await getDoc(cartRef);
    
    if (cartSnap.exists()) {
      // Cart exists, check if item is already in cart
      const cartData = cartSnap.data();
      const existingItem = cartData.items.find(item => item.productId === productId);
      
      if (existingItem) {
        // Update quantity of existing item
        const updatedItems = cartData.items.map(item => {
          if (item.productId === productId) {
            return {
              ...item,
              quantity: item.quantity + quantity,
              totalPrice: (item.quantity + quantity) * product.currentPrice
            };
          }
          return item;
        });
        
        await updateDoc(cartRef, {
          items: updatedItems,
          updatedAt: serverTimestamp(),
          totalAmount: updatedItems.reduce((sum, item) => sum + item.totalPrice, 0)
        });
      } else {
        // Add new item to cart
        const newItem = {
          productId: productId,
          name: product.name,
          imageUrl: product.imageUrl,
          price: product.currentPrice,
          quantity: quantity,
          totalPrice: product.currentPrice * quantity,
          addedAt: new Date().toISOString()
        };
        
        await updateDoc(cartRef, {
          items: arrayUnion(newItem),
          updatedAt: serverTimestamp(),
          totalAmount: cartData.totalAmount + newItem.totalPrice
        });
      }
    } else {
      // Create new cart
      const newItem = {
        productId: productId,
        name: product.name,
        imageUrl: product.imageUrl,
        price: product.currentPrice,
        quantity: quantity,
        totalPrice: product.currentPrice * quantity,
        addedAt: new Date().toISOString()
      };
      
      await setDoc(cartRef, {
        userId: userId,
        items: [newItem],
        totalAmount: newItem.totalPrice,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }
  } catch (error) {
    console.error("Error adding to cart:", error);
    throw error;
  }
};

/**
 * Get user's cart
 * @param {string} userId - The user ID
 * @returns {Promise<Object>} - The cart data
 */
export const getCart = async (userId) => {
  try {
    const cartRef = doc(db, "carts", userId);
    const cartSnap = await getDoc(cartRef);
    
    if (cartSnap.exists()) {
      return {
        id: cartSnap.id,
        ...cartSnap.data(),
        createdAt: cartSnap.data().createdAt?.toDate() || new Date(),
        updatedAt: cartSnap.data().updatedAt?.toDate() || new Date(),
      };
    } else {
      // Return empty cart if not exists
      return {
        userId: userId,
        items: [],
        totalAmount: 0
      };
    }
  } catch (error) {
    console.error("Error getting cart:", error);
    throw error;
  }
};

/**
 * Remove item from cart
 * @param {string} userId - The user ID
 * @param {string} productId - The product ID to remove
 * @returns {Promise<void>}
 */
export const removeFromCart = async (userId, productId) => {
  try {
    const cartRef = doc(db, "carts", userId);
    const cartSnap = await getDoc(cartRef);
    
    if (cartSnap.exists()) {
      const cartData = cartSnap.data();
      const itemToRemove = cartData.items.find(item => item.productId === productId);
      
      if (!itemToRemove) {
        throw new Error("Item not found in cart");
      }
      
      const updatedItems = cartData.items.filter(item => item.productId !== productId);
      const newTotalAmount = cartData.totalAmount - itemToRemove.totalPrice;
      
      await updateDoc(cartRef, {
        items: updatedItems,
        totalAmount: newTotalAmount,
        updatedAt: serverTimestamp()
      });
    }
  } catch (error) {
    console.error("Error removing from cart:", error);
    throw error;
  }
};

/**
 * Get featured products
 * @param {number} limitCount - Optional limit of products to retrieve
 * @returns {Promise<Array>} - Array of featured products
 */
export const getFeaturedProducts = async (limitCount = 8) => {
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
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      });
    });
    
    return products;
  } catch (error) {
    console.error("Error getting featured products:", error);
    throw error;
  }
};

/**
 * Get new arrival products
 * @param {number} limitCount - Optional limit of products to retrieve
 * @returns {Promise<Array>} - Array of new arrival products
 */
export const getNewArrivals = async (limitCount = 8) => {
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
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      });
    });
    
    return products;
  } catch (error) {
    console.error("Error getting new arrivals:", error);
    throw error;
  }
};




// Add these functions to your userService.js file

/**
 * Get user profile data
 * @param {string} userId - The user ID
 * @returns {Promise<Object>} - The user profile data
 */
export const getUserProfile = async (userId) => {
    try {
      const userRef = doc(db, "users", userId);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        return {
          id: userSnap.id,
          ...userSnap.data(),
          createdAt: userSnap.data().createdAt?.toDate() || new Date(),
          updatedAt: userSnap.data().updatedAt?.toDate() || new Date(),
        };
      } else {
        // Create a new profile if it doesn't exist
        const newUserProfile = {
          userId: userId,
          displayName: "",
          phoneNumber: "",
          address: {
            street: "",
            city: "",
            state: "",
            zipCode: "",
            country: ""
          },
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        
        // Set the new profile in Firestore
        await setDoc(userRef, newUserProfile);
        
        return newUserProfile;
      }
    } catch (error) {
      console.error("Error getting user profile:", error);
      throw error;
    }
  };
  
  /**
   * Update user profile
   * @param {string} userId - The user ID
   * @param {Object} profileData - The profile data to update
   * @returns {Promise<void>}
   */
  export const updateUserProfile = async (userId, profileData) => {
    try {
      const userRef = doc(db, "users", userId);
      
      // Update profile data in Firestore
      await updateDoc(userRef, {
        ...profileData,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error updating user profile:", error);
      throw error;
    }
  };




  // amazon like features for recomendation 

  /**
 * Save search term to user's search history
 * @param {string} userId - The user ID
 * @param {string} searchTerm - The search term to save
 * @returns {Promise<void>}
 */
export const saveSearchHistory = async (userId, searchTerm) => {
    if (!userId || !searchTerm || searchTerm.trim() === "") return;
    
    try {
      const userHistoryRef = doc(db, "userSearchHistory", userId);
      const historySnap = await getDoc(userHistoryRef);
      
      const timestamp = new Date().toISOString();
      
      if (historySnap.exists()) {
        // Get existing history and add new search term
        const history = historySnap.data().searches || [];
        
        // Check if term already exists
        const existingIndex = history.findIndex(item => item.term.toLowerCase() === searchTerm.toLowerCase());
        
        if (existingIndex !== -1) {
          // Remove the existing entry to move it to the top
          history.splice(existingIndex, 1);
        }
        
        // Add to beginning of array (newest first)
        history.unshift({
          term: searchTerm,
          timestamp: timestamp
        });
        
        // Keep only the 10 most recent searches
        const updatedHistory = history.slice(0, 10);
        
        await updateDoc(userHistoryRef, {
          searches: updatedHistory,
          updatedAt: serverTimestamp()
        });
      } else {
        // Create new search history for user
        await setDoc(userHistoryRef, {
          userId: userId,
          searches: [{
            term: searchTerm,
            timestamp: timestamp
          }],
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
    } catch (error) {
      console.error("Error saving search history:", error);
    }
  };
  
  /**
   * Get user's search history
   * @param {string} userId - The user ID
   * @returns {Promise<Array>} - Array of search history items
   */
  export const getSearchHistory = async (userId) => {
    if (!userId) return [];
    
    try {
      const userHistoryRef = doc(db, "userSearchHistory", userId);
      const historySnap = await getDoc(userHistoryRef);
      
      if (historySnap.exists()) {
        return historySnap.data().searches || [];
      }
      
      return [];
    } catch (error) {
      console.error("Error getting search history:", error);
      return [];
    }
  };
  
  /**
   * Delete a search term from user's history
   * @param {string} userId - The user ID
   * @param {string} searchTerm - The search term to delete
   * @returns {Promise<void>}
   */
  export const deleteSearchTerm = async (userId, searchTerm) => {
    if (!userId || !searchTerm) return;
    
    try {
      const userHistoryRef = doc(db, "userSearchHistory", userId);
      const historySnap = await getDoc(userHistoryRef);
      
      if (historySnap.exists()) {
        const history = historySnap.data().searches || [];
        const updatedHistory = history.filter(item => item.term.toLowerCase() !== searchTerm.toLowerCase());
        
        await updateDoc(userHistoryRef, {
          searches: updatedHistory,
          updatedAt: serverTimestamp()
        });
      }
    } catch (error) {
      console.error("Error deleting search term:", error);
    }
  };