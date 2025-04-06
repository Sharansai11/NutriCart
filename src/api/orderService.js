  import { 
    collection, 
    addDoc, 
    query, 
    where, 
    getDocs, 
    doc,
    updateDoc,
    serverTimestamp
  } from "firebase/firestore";
  import { db } from "./firebaseConfig";
  
  /**
   * Create a new order and update user's purchased products
   * @param {Object} orderData - The order details
   * @param {string} userId - The user's ID
   * @returns {Promise<string>} - The ID of the created order
   */
  export const createOrderAndUpdateUserPurchases = async (userId, orderData) => {
    try {
      // Create order in orders collection
      const orderRef = await addDoc(collection(db, "orders"), {
        ...orderData,
        createdAt: serverTimestamp(),
        status: orderData.status || 'completed'
      });
  
      // Update user's purchased products
      const userRef = doc(db, "users", userId);
      
      // Fetch current user data
      const userDoc = await getDoc(userRef);
      const userData = userDoc.data();
  
      // Prepare purchased products array
      const purchasedProducts = userData.purchasedProducts || [];
      
      // Add new products to purchased list
      const newPurchasedProducts = [
        ...purchasedProducts,
        ...orderData.items.map(item => ({
          productId: item.productId,
          purchaseDate: new Date().toISOString(),
          quantity: item.quantity
        }))
      ];
  
      // Update user document with purchased products
      await updateDoc(userRef, {
        purchasedProducts: newPurchasedProducts
      });
  
      return orderRef.id;
    } catch (error) {
      console.error("Error creating order and updating purchases:", error);
      throw error;
    }
  };
  
  /**
   * Get a user's purchased products
   * @param {string} userId - The user's ID
   * @returns {Promise<Array>} - Array of purchased products
   */
  export const getUserPurchasedProducts = async (userId) => {
    try {
      const userRef = doc(db, "users", userId);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const purchasedProducts = userData.purchasedProducts || [];
  
        // Fetch full product details for purchased products
        const productDetails = await Promise.all(
          purchasedProducts.map(async (purchase) => {
            const productRef = doc(db, "products", purchase.productId);
            const productDoc = await getDoc(productRef);
            
            return {
              ...productDoc.data(),
              id: productDoc.id,
              purchaseDate: purchase.purchaseDate,
              purchaseQuantity: purchase.quantity
            };
          })
        );
  
        return productDetails;
      }
  
      return [];
    } catch (error) {
      console.error("Error fetching purchased products:", error);
      throw error;
    }
  };
  
  /**
   * Check if a user has purchased a specific product
   * @param {string} userId - The user's ID
   * @param {string} productId - The product ID
   * @returns {Promise<boolean>} - Whether the user has purchased the product
   */
  export const hasUserPurchasedProduct = async (userId, productId) => {
    try {
      const userRef = doc(db, "users", userId);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const purchasedProducts = userData.purchasedProducts || [];
  
        return purchasedProducts.some(
          purchase => purchase.productId === productId
        );
      }
  
      return false;
    } catch (error) {
      console.error("Error checking product purchase:", error);
      throw error;
    }
  };
  
  /**
   * Create a new order in Firestore
   * @param {Object} orderData - The order details
   * @returns {Promise<string>} - The ID of the created order
   */
  export const createOrder = async (orderData) => {
    try {
      const orderRef = await addDoc(collection(db, "orders"), {
        ...orderData,
        createdAt: serverTimestamp(),
        status: orderData.status || 'pending'
      });
      
      return orderRef.id;
    } catch (error) {
      console.error("Error creating order:", error);
      throw error;
    }
  };
  
  /**
   * Get orders for a specific user
   * @param {string} userId - The user's ID
   * @returns {Promise<Array>} - Array of user's orders
   */export const getUserOrders = async (userId) => {
  try {
    const ordersRef = collection(db, "orders");
    const q = query(
      ordersRef, 
      where("userId", "==", userId)
    );
    
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date()
    })).sort((a, b) => 
      (b.createdAt.getTime() || 0) - (a.createdAt.getTime() || 0)
    );
  } catch (error) {
    console.error("Error fetching user orders:", error);
    throw error;
  }
};
  /**
   * Get a specific order by ID
   * @param {string} orderId - The order ID
   * @returns {Promise<Object>} - The order details
   */
  export const getOrderById = async (orderId) => {
    try {
      const q = query(collection(db, "orders"), where("__name__", "==", orderId));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        return {
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date()
        };
      } else {
        throw new Error("Order not found");
      }
    } catch (error) {
      console.error("Error fetching order:", error);
      throw error;
    }
  };