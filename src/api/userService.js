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


// Get all items in the user's cart with product details
export const getCartItems = async (userId) => {
  try {
    const cartRef = collection(db, 'users', userId, 'cart');
    const querySnapshot = await getDocs(cartRef);
    
    const cartItems = [];
    const productPromises = [];
    
    // Rename the parameter to avoid conflict with the Firestore 'doc' function
    querySnapshot.forEach((cartDoc) => {
      const item = {
        id: cartDoc.id,
        productId: cartDoc.data().productId,
        quantity: cartDoc.data().quantity,
        addedAt: cartDoc.data().addedAt
      };
      
      cartItems.push(item);
      
      // Use the Firestore 'doc' function correctly now
      const productPromise = getDoc(doc(db, 'products', item.productId))
        .then(productDoc => {
          if (productDoc.exists()) {
            return { id: productDoc.id, ...productDoc.data() };
          }
          return null;
        });
      
      productPromises.push(productPromise);
    });
    
    const products = await Promise.all(productPromises);
    
    return cartItems.map((item, index) => ({
      ...item,
      product: products[index] || { 
        id: item.productId, 
        name: 'Product not found', 
        currentPrice: 0,
        imageUrl: null
      }
    }));
  } catch (error) {
    console.error('Error getting cart items:', error);
    throw error;
  }
};

// Update quantity of an item in the cart
export const updateCartItemQuantity = async (userId, cartItemId, quantity) => {
  try {
    const cartItemRef = doc(db, 'users', userId, 'cart', cartItemId);
    await updateDoc(cartItemRef, {
      quantity: quantity
    });
  } catch (error) {
    console.error('Error updating cart item quantity:', error);
    throw error;
  }
};



// Clear the entire cart
export const clearCart = async (userId) => {
  try {
    const cartRef = collection(db, 'users', userId, 'cart');
    const querySnapshot = await getDocs(cartRef);
    
    const deletePromises = [];
    querySnapshot.forEach((doc) => {
      deletePromises.push(deleteDoc(doc.ref));
    });
    
    await Promise.all(deletePromises);
  } catch (error) {
    console.error('Error clearing cart:', error);
    throw error;
  }
};

// Create a new order
export const createOrder = async (userId, orderData) => {
  try {
    // Add order to user's orders collection
    const ordersRef = collection(db, 'users', userId, 'orders');
    const orderRef = await addDoc(ordersRef, {
      ...orderData,
      userId,
      createdAt: serverTimestamp()
    });
    
    // Also add to global orders collection for admin analytics
    await addDoc(collection(db, 'orders'), {
      ...orderData,
      userId,
      orderId: orderRef.id,
      createdAt: serverTimestamp()
    });
    
    // Update product statistics for analytics
    await updateProductStatistics(orderData.items);
    
    return { id: orderRef.id, ...orderData };
  } catch (error) {
    console.error('Error creating order:', error);
    throw error;
  }
};

// Update product statistics for analytics
const updateProductStatistics = async (orderItems) => {
  try {
    const batch = db.batch();
    
    // For each ordered product, update its statistics
    for (const item of orderItems) {
      const productRef = doc(db, 'products', item.productId);
      const productStatsRef = doc(db, 'productStats', item.productId);
      
      // Update product's sales count
      batch.update(productRef, {
        salesCount: increment(item.quantity),
        lastSold: serverTimestamp()
      });
      
      // Update or create product stats document
      const statsDoc = await getDoc(productStatsRef);
      if (statsDoc.exists()) {
        batch.update(productStatsRef, {
          totalSales: increment(item.quantity),
          totalRevenue: increment(item.price * item.quantity),
          lastSold: serverTimestamp()
        });
      } else {
        batch.set(productStatsRef, {
          productId: item.productId,
          productName: item.productName,
          category: item.category,
          totalSales: item.quantity,
          totalRevenue: item.price * item.quantity,
          firstSold: serverTimestamp(),
          lastSold: serverTimestamp()
        });
      }
      
      // Update category statistics
      const categoryRef = doc(db, 'categoryStats', item.category);
      const categoryDoc = await getDoc(categoryRef);
      
      if (categoryDoc.exists()) {
        batch.update(categoryRef, {
          totalSales: increment(item.quantity),
          totalRevenue: increment(item.price * item.quantity),
          lastSold: serverTimestamp()
        });
      } else {
        batch.set(categoryRef, {
          category: item.category,
          totalSales: item.quantity,
          totalRevenue: item.price * item.quantity,
          firstSold: serverTimestamp(),
          lastSold: serverTimestamp()
        });
      }
    }
    
    // Commit all the statistics updates
    await batch.commit();
  } catch (error) {
    console.error('Error updating product statistics:', error);
    // Don't throw here - we don't want order creation to fail if stats updates fail
    // In a production app, you might want to log this to a monitoring service
  }
};

// Get user orders
export const getUserOrders = async (userId) => {
  try {
    const ordersRef = collection(db, 'users', userId, 'orders');
    const q = query(ordersRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    const orders = [];
    querySnapshot.forEach((doc) => {
      // Convert Firestore timestamp to JS Date
      const data = doc.data();
      const createdAt = data.createdAt?.toDate() || new Date();
      
      orders.push({
        id: doc.id,
        ...data,
        createdAt
      });
    });
    
    return orders;
  } catch (error) {
    console.error('Error getting user orders:', error);
    throw error;
  }
};

// Get order analytics for admin dashboard
export const getOrderAnalytics = async (timeFrame = 'month') => {
  try {
    // This would need to be implemented based on your specific analytics needs
    // Here's a placeholder for the expected structure
    return {
      totalOrders: 0,
      totalRevenue: 0,
      averageOrderValue: 0,
      productsSold: 0,
      categorySales: {},
      monthlySales: [],
      topProducts: [],
      recentOrders: []
    };
  } catch (error) {
    console.error('Error getting order analytics:', error);
    throw error;
  }
};
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

// Add these functions to your userService.js file

// Get user's recent cart items
export const getRecentCartItems = async (userId) => {
  try {
    const cartRef = collection(db, "users", userId, "cart");
    const querySnapshot = await getDocs(query(cartRef, orderBy("addedAt", "desc"), limit(10)));
    
    const cartItems = [];
    querySnapshot.forEach((doc) => {
      cartItems.push({
        id: doc.id,
        productId: doc.data().productId,
        addedAt: doc.data().addedAt,
      });
    });
    
    return cartItems;
  } catch (error) {
    console.error("Error getting cart items:", error);
    throw error;
  }
};

// Get user's wishlist items
export const getWishlistItems = async (userId) => {
  try {
    const wishlistRef = collection(db, "users", userId, "wishlist");
    const querySnapshot = await getDocs(query(wishlistRef, orderBy("addedAt", "desc")));
    
    const wishlistItems = [];
    querySnapshot.forEach((doc) => {
      wishlistItems.push({
        id: doc.id,
        productId: doc.data().productId,
        addedAt: doc.data().addedAt,
      });
    });
    
    return wishlistItems;
  } catch (error) {
    console.error("Error getting wishlist items:", error);
    throw error;
  }
};

// Generate personalized recommendations based on user data
export const generateRecommendations = async (userId, allProducts) => {
  try {
    // Skip if no user is logged in
    if (!userId) return [];
    
    // Get user data
    const searchHistory = await getSearchHistory(userId);
    const cartItems = await getRecentCartItems(userId);
    const wishlistItems = await getWishlistItems(userId);
    
    // Create a map to store product scores
    const productScores = new Map();
    
    // Initialize scores for all products
    allProducts.forEach(product => {
      productScores.set(product.id, {
        product,
        score: 0,
        matches: []
      });
    });
    
    // Extract keywords from search history
    const searchTerms = searchHistory.map(item => item.term.toLowerCase());
    
    // Score products based on search history (most recent searches have more weight)
    searchHistory.forEach((search, index) => {
      const term = search.term.toLowerCase();
      const recencyWeight = 1 - (index / (searchHistory.length || 1)) * 0.5; // 1.0 to 0.5 based on recency
      
      allProducts.forEach(product => {
        let matched = false;
        const productData = productScores.get(product.id);
        
        // Check if search term appears in product name or description
        if (product.name.toLowerCase().includes(term)) {
          productData.score += 3 * recencyWeight;
          matched = true;
        }
        
        if (product.description.toLowerCase().includes(term)) {
          productData.score += 2 * recencyWeight;
          matched = true;
        }
        
        if (product.category.toLowerCase().includes(term)) {
          productData.score += 3 * recencyWeight;
          matched = true;
        }
        
        if (matched) {
          productData.matches.push(`search:${term}`);
        }
      });
    });
    
    // Score products based on cart items
    const cartProductIds = cartItems.map(item => item.productId);
    cartProductIds.forEach(productId => {
      // Find matching products with the same category
      const cartProduct = allProducts.find(p => p.id === productId);
      if (cartProduct) {
        allProducts.forEach(product => {
          if (product.id !== productId && product.category === cartProduct.category) {
            const productData = productScores.get(product.id);
            productData.score += 5;
            productData.matches.push(`cart:${cartProduct.category}`);
          }
        });
      }
    });
    
    // Score products based on wishlist items
    const wishlistProductIds = wishlistItems.map(item => item.productId);
    wishlistProductIds.forEach(productId => {
      // Find matching products with the same category
      const wishlistProduct = allProducts.find(p => p.id === productId);
      if (wishlistProduct) {
        allProducts.forEach(product => {
          if (product.id !== productId && product.category === wishlistProduct.category) {
            const productData = productScores.get(product.id);
            productData.score += 4;
            productData.matches.push(`wishlist:${wishlistProduct.category}`);
          }
        });
      }
    });
    
    // Boost products that appear in both wishlist and search terms
    searchTerms.forEach(term => {
      wishlistProductIds.forEach(productId => {
        const wishlistProduct = allProducts.find(p => p.id === productId);
        if (wishlistProduct && 
            (wishlistProduct.name.toLowerCase().includes(term) || 
             wishlistProduct.description.toLowerCase().includes(term))) {
          // Find similar products
          allProducts.forEach(product => {
            if (product.id !== productId && 
                (product.name.toLowerCase().includes(term) || 
                 product.description.toLowerCase().includes(term))) {
              const productData = productScores.get(product.id);
              productData.score += 3; // Extra boost for this overlap
              productData.matches.push(`overlap:${term}`);
            }
          });
        }
      });
    });
    
    // Convert Map to array, sort by score, and return top recommendations
    const recommendations = Array.from(productScores.values())
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(item => ({
        ...item.product,
        recommendationScore: item.score,
        recommendationReason: item.matches
      }));
    
    return recommendations;
  } catch (error) {
    console.error("Error generating recommendations:", error);
    return [];
  }
};















  
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