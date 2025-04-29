import { db, auth } from "./firebaseConfig";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
  limit,
  orderBy,
  runTransaction,
  Timestamp,
  increment
} from "firebase/firestore";
import {
  updateProfile,
  updateEmail,
  updatePassword
} from 'firebase/auth';

// ----- User Profile Operations -----

/**
 * Get a user's profile from Firestore
 * @param {string} userId 
 * @returns {Promise<Object>} User data
 */
export const getUserProfile = async (userId) => {
  if (!userId) throw new Error("User ID is required");
  
  try {
    const userDoc = await getDoc(doc(db, "users", userId));
    if (userDoc.exists()) {
      return userDoc.data();
    } else {
      throw new Error("User not found");
    }
  } catch (error) {
    console.error("Error fetching user profile:", error);
    throw error;
  }
};

/**
 * Update a user's profile in Firestore
 * @param {string} userId 
 * @param {Object} profileData 
 * @returns {Promise<void>}
 */
export const updateUserProfile = async (userId, profileData) => {
  if (!userId) throw new Error("User ID is required");
  
  try {
    const userRef = doc(db, "users", userId);
    
    // Update Firestore document
    await updateDoc(userRef, {
      ...profileData,
      updatedAt: serverTimestamp()
    });
    
    // Update display name in Firebase Auth if provided
    if (profileData.displayName && auth.currentUser) {
      await updateProfile(auth.currentUser, {
        displayName: profileData.displayName
      });
    }
    
    return true;
  } catch (error) {
    console.error("Error updating user profile:", error);
    throw error;
  }
};

/**
 * Update user's email in Firebase Auth
 * @param {string} newEmail 
 * @returns {Promise<void>}
 */
export const updateUserEmail = async (newEmail) => {
  if (!auth.currentUser) throw new Error("User not authenticated");
  
  try {
    await updateEmail(auth.currentUser, newEmail);
    
    // Also update email in Firestore
    await updateDoc(doc(db, "users", auth.currentUser.uid), {
      email: newEmail,
      updatedAt: serverTimestamp()
    });
    
    return true;
  } catch (error) {
    console.error("Error updating email:", error);
    throw error;
  }
};

/**
 * Update user's password in Firebase Auth
 * @param {string} newPassword 
 * @returns {Promise<void>}
 */
export const updateUserPassword = async (newPassword) => {
  if (!auth.currentUser) throw new Error("User not authenticated");
  
  try {
    await updatePassword(auth.currentUser, newPassword);
    return true;
  } catch (error) {
    console.error("Error updating password:", error);
    throw error;
  }
};

// ----- Cart Operations -----

/**
 * Get user's cart items
 * @param {string} userId 
 * @returns {Promise<Array>} Array of cart items with product data
 */
export const getCartItems = async (userId) => {
  if (!userId) throw new Error("User ID is required");
  
  try {
    // Get cart document
    const cartDoc = await getDoc(doc(db, "carts", userId));
    
    if (!cartDoc.exists()) {
      return []; // Return empty array if cart doesn't exist
    }
    
    const cartData = cartDoc.data();
    const items = cartData.items || [];
    
    // Fetch product details for each cart item
    const cartItemsWithProducts = await Promise.all(
      items.map(async (item) => {
        const productDoc = await getDoc(doc(db, "products", item.productId));
        if (productDoc.exists()) {
          const productData = productDoc.data();
          return {
            ...item,
            product: {
              id: item.productId,
              ...productData
            }
          };
        }
        return item;
      })
    );
    
    return cartItemsWithProducts;
  } catch (error) {
    console.error("Error getting cart items:", error);
    throw error;
  }
};

/**
 * Add a product to user's cart
 * @param {string} userId 
 * @param {string} productId 
 * @param {number} quantity 
 * @returns {Promise<void>}
 */
export const addToCart = async (userId, productId, quantity = 1) => {
  if (!userId) throw new Error("User ID is required");
  if (!productId) throw new Error("Product ID is required");
  
  try {
    const cartRef = doc(db, "carts", userId);
    const cartDoc = await getDoc(cartRef);
    
    // Check product stock before adding
    const productDoc = await getDoc(doc(db, "products", productId));
    if (!productDoc.exists()) {
      throw new Error("Product not found");
    }
    
    const productData = productDoc.data();
    if (productData.stock <= 0) {
      throw new Error("Product is out of stock");
    }
    
    if (cartDoc.exists()) {
      // Cart exists, check if product is already in cart
      const cartData = cartDoc.data();
      const items = cartData.items || [];
      const existingItemIndex = items.findIndex(item => item.productId === productId);
      
      if (existingItemIndex >= 0) {
        // Product already in cart, update quantity
        const updatedItems = [...items];
        updatedItems[existingItemIndex].quantity += quantity;
        
        // Check against available stock
        if (updatedItems[existingItemIndex].quantity > productData.stock) {
          updatedItems[existingItemIndex].quantity = productData.stock;
        }
        
        await updateDoc(cartRef, {
          items: updatedItems,
          updatedAt: serverTimestamp()
        });
      } else {
        // Product not in cart, add new item
        await updateDoc(cartRef, {
          items: arrayUnion({
            productId,
            quantity: quantity,
            addedAt: Timestamp.now()
          }),
          updatedAt: serverTimestamp()
        });
      }
    } else {
      // Create new cart
      await setDoc(cartRef, {
        userId,
        items: [{
          productId,
          quantity: quantity,
          addedAt: Timestamp.now()
        }],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }
    
    return true;
  } catch (error) {
    console.error("Error adding to cart:", error);
    throw error;
  }
};

/**
 * Update quantity of a cart item
 * @param {string} userId 
 * @param {string} productId 
 * @param {number} quantity 
 * @returns {Promise<void>}
 */
export const updateCartItemQuantity = async (userId, productId, quantity) => {
  if (!userId) throw new Error("User ID is required");
  if (!productId) throw new Error("Product ID is required");
  if (quantity <= 0) throw new Error("Quantity must be greater than 0");
  
  try {
    const cartRef = doc(db, "carts", userId);
    const cartDoc = await getDoc(cartRef);
    
    if (!cartDoc.exists()) {
      throw new Error("Cart not found");
    }
    
    // Check product stock
    const productDoc = await getDoc(doc(db, "products", productId));
    if (!productDoc.exists()) {
      throw new Error("Product not found");
    }
    
    const productData = productDoc.data();
    if (quantity > productData.stock) {
      quantity = productData.stock;
    }
    
    // Update the cart item quantity
    const cartData = cartDoc.data();
    const items = cartData.items || [];
    const existingItemIndex = items.findIndex(item => item.productId === productId);
    
    if (existingItemIndex >= 0) {
      const updatedItems = [...items];
      updatedItems[existingItemIndex].quantity = quantity;
      
      await updateDoc(cartRef, {
        items: updatedItems,
        updatedAt: serverTimestamp()
      });
      
      return true;
    } else {
      throw new Error("Product not found in cart");
    }
  } catch (error) {
    console.error("Error updating cart item quantity:", error);
    throw error;
  }
};

/**
 * Remove an item from the cart
 * @param {string} userId 
 * @param {string} productId 
 * @returns {Promise<void>}
 */
export const removeFromCart = async (userId, productId) => {
  if (!userId) throw new Error("User ID is required");
  if (!productId) throw new Error("Product ID is required");
  
  try {
    const cartRef = doc(db, "carts", userId);
    const cartDoc = await getDoc(cartRef);
    
    if (!cartDoc.exists()) {
      throw new Error("Cart not found");
    }
    
    const cartData = cartDoc.data();
    const items = cartData.items || [];
    const updatedItems = items.filter(item => item.productId !== productId);
    
    await updateDoc(cartRef, {
      items: updatedItems,
      updatedAt: serverTimestamp()
    });
    
    return true;
  } catch (error) {
    console.error("Error removing item from cart:", error);
    throw error;
  }
};

/**
 * Clear all items from the cart
 * @param {string} userId 
 * @returns {Promise<void>}
 */
export const clearCart = async (userId) => {
  if (!userId) throw new Error("User ID is required");
  
  try {
    const cartRef = doc(db, "carts", userId);
    const cartDoc = await getDoc(cartRef);
    
    if (cartDoc.exists()) {
      await updateDoc(cartRef, {
        items: [],
        updatedAt: serverTimestamp()
      });
    }
    
    return true;
  } catch (error) {
    console.error("Error clearing cart:", error);
    throw error;
  }
};

// ----- Wishlist Operations -----

/**
 * Check if a product is in user's wishlist
 * @param {string} userId 
 * @param {string} productId 
 * @returns {Promise<boolean>}
 */
export const isInWishlist = async (userId, productId) => {
  if (!userId) throw new Error("User ID is required");
  if (!productId) throw new Error("Product ID is required");
  
  try {
    const wishlistRef = doc(db, "wishlists", userId);
    const wishlistDoc = await getDoc(wishlistRef);
    
    if (!wishlistDoc.exists()) {
      return false;
    }
    
    const wishlistData = wishlistDoc.data();
    const productIds = wishlistData.productIds || [];
    
    return productIds.includes(productId);
  } catch (error) {
    console.error("Error checking wishlist:", error);
    throw error;
  }
};

/**
 * Get user's wishlist with product details
 * @param {string} userId 
 * @returns {Promise<Array>} Array of wishlist items with product data
 */
export const getWishlistItems = async (userId) => {
  if (!userId) throw new Error("User ID is required");
  
  try {
    const wishlistRef = doc(db, "wishlists", userId);
    const wishlistDoc = await getDoc(wishlistRef);
    
    if (!wishlistDoc.exists()) {
      return [];
    }
    
    const wishlistData = wishlistDoc.data();
    const productIds = wishlistData.productIds || [];
    
    // Fetch product details for each item in wishlist
    const wishlistProducts = await Promise.all(
      productIds.map(async (productId) => {
        const productDoc = await getDoc(doc(db, "products", productId));
        if (productDoc.exists()) {
          return {
            id: productId,
            ...productDoc.data()
          };
        }
        return null;
      })
    );
    
    return wishlistProducts.filter(product => product !== null);
  } catch (error) {
    console.error("Error getting wishlist items:", error);
    throw error;
  }
};

/**
 * Add a product to user's wishlist
 * @param {string} userId 
 * @param {string} productId 
 * @returns {Promise<void>}
 */
export const addToWishlist = async (userId, productId) => {
  if (!userId) throw new Error("User ID is required");
  if (!productId) throw new Error("Product ID is required");
  
  try {
    const wishlistRef = doc(db, "wishlists", userId);
    const wishlistDoc = await getDoc(wishlistRef);
    
    if (wishlistDoc.exists()) {
      // Check if product is already in wishlist
      const wishlistData = wishlistDoc.data();
      const productIds = wishlistData.productIds || [];
      
      if (!productIds.includes(productId)) {
        // Add product to wishlist
        await updateDoc(wishlistRef, {
          productIds: arrayUnion(productId),
          updatedAt: serverTimestamp()
        });
      }
    } else {
      // Create new wishlist
      await setDoc(wishlistRef, {
        userId,
        productIds: [productId],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }
    
    return true;
  } catch (error) {
    console.error("Error adding to wishlist:", error);
    throw error;
  }
};

/**
 * Remove a product from user's wishlist
 * @param {string} userId 
 * @param {string} productId 
 * @returns {Promise<void>}
 */
export const removeFromWishlist = async (userId, productId) => {
  if (!userId) throw new Error("User ID is required");
  if (!productId) throw new Error("Product ID is required");
  
  try {
    const wishlistRef = doc(db, "wishlists", userId);
    const wishlistDoc = await getDoc(wishlistRef);
    
    if (wishlistDoc.exists()) {
      // Remove product from wishlist
      await updateDoc(wishlistRef, {
        productIds: arrayRemove(productId),
        updatedAt: serverTimestamp()
      });
    }
    
    return true;
  } catch (error) {
    console.error("Error removing from wishlist:", error);
    throw error;
  }
};

/**
 * Clear all items from the wishlist
 * @param {string} userId 
 * @returns {Promise<void>}
 */
export const clearWishlist = async (userId) => {
  if (!userId) throw new Error("User ID is required");
  
  try {
    const wishlistRef = doc(db, "wishlists", userId);
    const wishlistDoc = await getDoc(wishlistRef);
    
    if (wishlistDoc.exists()) {
      await updateDoc(wishlistRef, {
        productIds: [],
        updatedAt: serverTimestamp()
      });
    }
    
    return true;
  } catch (error) {
    console.error("Error clearing wishlist:", error);
    throw error;
  }
};

// ----- Order History Operations -----

/**
 * Get user's order history
 * @param {string} userId 
 * @returns {Promise<Array>} Array of orders
 */
export const getOrderHistory = async (userId) => {
  if (!userId) throw new Error("User ID is required");
  
  try {
    const ordersQuery = query(
      collection(db, "orders"),
      where("userId", "==", userId),
      orderBy("createdAt", "desc")
    );
    
    const ordersSnapshot = await getDocs(ordersQuery);
    const orders = [];
    
    ordersSnapshot.forEach((doc) => {
      orders.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return orders;
  } catch (error) {
    console.error("Error getting order history:", error);
    throw error;
  }
};

/**
 * Get details of a specific order
 * @param {string} orderId 
 * @returns {Promise<Object>} Order data
 */
export const getOrderDetails = async (orderId) => {
  if (!orderId) throw new Error("Order ID is required");
  
  try {
    const orderDoc = await getDoc(doc(db, "orders", orderId));
    
    if (!orderDoc.exists()) {
      throw new Error("Order not found");
    }
    
    const orderData = orderDoc.data();
    
    // Fetch current product details for each order item
    const itemsWithCurrentProductDetails = await Promise.all(
      orderData.items.map(async (item) => {
        const productDoc = await getDoc(doc(db, "products", item.productId));
        if (productDoc.exists()) {
          const currentProductData = productDoc.data();
          return {
            ...item,
            currentProduct: {
              id: item.productId,
              ...currentProductData
            }
          };
        }
        return item;
      })
    );
    
    return {
      id: orderId,
      ...orderData,
      itemsWithCurrentProductDetails
    };
  } catch (error) {
    console.error("Error getting order details:", error);
    throw error;
  }
}; 

// Search History Operations
export const getSearchHistory = async (userId) => {
  try {
    const searchHistoryRef = collection(db, 'userSearchHistory');
    const q = query(
      searchHistoryRef, 
      where('userId', '==', userId)
    );
    
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting search history:', error);
    throw error;
  }
};

export const saveSearchHistory = async (userId, searchTerm) => {
  try {
    const searchHistoryRef = collection(db, 'userSearchHistory');
    
    await addDoc(searchHistoryRef, {
      userId,
      searchTerm,
      timestamp: serverTimestamp()
    });
  } catch (error) {
    console.error('Error saving search history:', error);
    throw error;
  }
};

export const deleteSearchTerm = async (searchHistoryId) => {
  try {
    const searchHistoryRef = doc(db, 'userSearchHistory', searchHistoryId);
    await deleteDoc(searchHistoryRef);
  } catch (error) {
    console.error('Error deleting search term:', error);
    throw error;
  }
};

// Add these new methods to your userService.js file

/**
 * Get product details by ID
 * @param {string} productId 
 * @returns {Promise<Object>} Product data
 */
export const getProductById = async (productId) => {
  if (!productId) throw new Error("Product ID is required");
  
  try {
    const productDoc = await getDoc(doc(db, "products", productId));
    
    if (!productDoc.exists()) {
      throw new Error("Product not found");
    }
    
    return {
      id: productId,
      ...productDoc.data()
    };
  } catch (error) {
    console.error("Error getting product details:", error);
    throw error;
  }
};

/**
 * Check if a product is in user's cart
 * @param {string} userId 
 * @param {string} productId 
 * @returns {Promise<boolean>}
 */
export const isInCart = async (userId, productId) => {
  if (!userId) throw new Error("User ID is required");
  if (!productId) throw new Error("Product ID is required");
  
  try {
    const cartRef = doc(db, "carts", userId);
    const cartDoc = await getDoc(cartRef);
    
    if (!cartDoc.exists()) {
      return false;
    }
    
    const cartData = cartDoc.data();
    const items = cartData.items || [];
    
    return items.some(item => item.productId === productId);
  } catch (error) {
    console.error("Error checking cart:", error);
    throw error;
  }
};

/**
 * Get the quantity of a product in the user's cart
 * @param {string} userId 
 * @param {string} productId 
 * @returns {Promise<number>} Quantity
 */
export const getCartItemQuantity = async (userId, productId) => {
  if (!userId) throw new Error("User ID is required");
  if (!productId) throw new Error("Product ID is required");
  
  try {
    const cartRef = doc(db, "carts", userId);
    const cartDoc = await getDoc(cartRef);
    
    if (!cartDoc.exists()) {
      return 0;
    }
    
    const cartData = cartDoc.data();
    const items = cartData.items || [];
    const item = items.find(item => item.productId === productId);
    
    return item ? item.quantity : 0;
  } catch (error) {
    console.error("Error getting cart item quantity:", error);
    throw error;
  }
};
export const getHealthierAlternatives = async (productId, category = null, limitCount = 5) => {
  if (!productId) throw new Error("Product ID is required");
  
  try {
    // Get the current product's details
    const currentProduct = await getProductById(productId);
    if (!currentProduct) return [];
    
    // Extract product information
    const productName = (currentProduct.name || "").toLowerCase();
    const productCategory = category || currentProduct.category || "";
    const currentGrade = currentProduct.nutrition_grade_fr 
      ? currentProduct.nutrition_grade_fr.toUpperCase() 
      : "E";
    
    // Define better nutrition grades (only A, B, C)
    const betterGrades = ['A', 'B', 'C', 'a', 'b', 'c'].filter(grade => {
      const compareGrade = grade.toUpperCase();
      return compareGrade < currentGrade;
    });
    
    if (betterGrades.length === 0) return []; // Already best grade

    console.log(`Looking for alternatives to ${productName} (${currentGrade}) in category ${productCategory}`);
    console.log(`Better grades: ${betterGrades.join(', ')}`);
    
    // Collection reference
    const productsRef = collection(db, "products");
    let alternatives = [];
    
    // Strategy 1: First get ALL products with better nutrition
    try {
      // Use a simple query that doesn't require composite index
      // Just get all products with stock > 0
      const healthyQuery = query(
        productsRef,
        where("stock", ">", 0)
      );
      
      const snapshot = await getDocs(healthyQuery);
      console.log(`Found ${snapshot.size} products in stock`);
      
      // Filter and score products manually
      const matchedProducts = [];
      
      snapshot.forEach(doc => {
        if (doc.id === productId) return; // Skip current product
        
        const product = doc.data();
        const productGrade = product.nutrition_grade_fr 
          ? product.nutrition_grade_fr.toUpperCase() 
          : null;
          
        // Skip products with no grade or worse/equal grade
        if (!productGrade || productGrade >= currentGrade) return;
        
        // Product has better nutrition, calculate relevance score
        let score = 0;
        
        // Check category match (highest relevance)
        if (productCategory && product.category === productCategory) {
          score += 100;
        }
        
        // Check name similarity
        const productLowerName = (product.name || "").toLowerCase();
        const terms = productName.split(/\s+/)
          .map(term => term.replace(/[^a-z0-9]/g, ''))
          .filter(term => term.length >= 3);
          
        terms.forEach(term => {
          if (productLowerName.includes(term)) {
            score += 20;
          }
        });
        
        // Boost score for better grades
        if (productGrade === 'A') score += 30;
        else if (productGrade === 'B') score += 20;
        else if (productGrade === 'C') score += 10;
        
        // Add to matched products if relevant
        if (score > 0) {
          matchedProducts.push({
            id: doc.id,
            ...product,
            score
          });
        }
      });
      
      // Sort by relevance score
      matchedProducts.sort((a, b) => b.score - a.score);
      
      // Take top matches
      alternatives = matchedProducts
        .slice(0, limitCount)
        .map(product => {
          const { score, ...rest } = product;
          return rest;
        });
        
      console.log(`Found ${matchedProducts.length} relevant alternatives, returning top ${alternatives.length}`);
      
    } catch (error) {
      console.error("Error finding alternatives:", error);
    }
    
    return alternatives;
  } catch (error) {
    console.error("Error getting healthier alternatives:", error);
    return [];
  }
};