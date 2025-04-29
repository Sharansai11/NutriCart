import { db } from "./firebaseConfig";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
  limit,
  orderBy,
  runTransaction,
  Timestamp,
  increment
} from "firebase/firestore";

// Create a new order
export const createOrder = async (orderData) => {
  try {
    const ordersRef = collection(db, 'orders');
    
    const newOrder = {
      ...orderData,
      status: 'pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    const orderDoc = await addDoc(ordersRef, newOrder);
    
    return orderDoc.id;
  } catch (error) {
    console.error('Error creating order:', error);
    throw error;
  }
};

// Get user's orders
export const getUserOrders = async (userId) => {
  try {
    const ordersRef = collection(db, 'orders');
    const q = query(
      ordersRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching user orders:', error);
    throw error;
  }
};

// Get specific order by ID
export const getOrderById = async (orderId) => {
  try {
    const orderRef = doc(db, 'orders', orderId);
    const orderSnap = await getDoc(orderRef);
    
    if (!orderSnap.exists()) {
      throw new Error('Order not found');
    }
    
    return {
      id: orderSnap.id,
      ...orderSnap.data()
    };
  } catch (error) {
    console.error('Error fetching order:', error);
    throw error;
  }
};

// Update order status
export const updateOrderStatus = async (orderId, newStatus) => {
  try {
    const orderRef = doc(db, 'orders', orderId);
    
    await updateDoc(orderRef, {
      status: newStatus,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    throw error;
  }
};

// Cancel an order
export const cancelOrder = async (orderId) => {
  try {
    const orderRef = doc(db, 'orders', orderId);
    
    await updateDoc(orderRef, {
      status: 'cancelled',
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error cancelling order:', error);
    throw error;
  }
};

// Process order with inventory management
export const processOrder = async (orderId, orderItems) => {
  const orderRef = doc(db, 'orders', orderId);
  
  try {
    await runTransaction(db, async (transaction) => {
      // Update order status to processing
      transaction.update(orderRef, {
        status: 'processing',
        updatedAt: serverTimestamp()
      });
      
      // Reduce inventory for each product
      for (const item of orderItems) {
        const productRef = doc(db, 'products', item.productId);
        
        // Reduce product stock
        transaction.update(productRef, {
          stock: increment(-item.quantity)
        });
      }
    });
  } catch (error) {
    console.error('Error processing order:', error);
    throw error;
  }
};

// Get recent orders (for admin dashboard)
export const getRecentOrders = async (limit = 10) => {
  try {
    const ordersRef = collection(db, 'orders');
    const q = query(
      ordersRef,
      orderBy('createdAt', 'desc'),
      limit(limit)
    );
    
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching recent orders:', error);
    throw error;
  }
};