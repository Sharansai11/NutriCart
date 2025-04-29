// adminService.js - Add these functions

import { 
    collection, 
    getDocs, 
    doc, 
    getDoc, 
    updateDoc, 
    query, 
    where, 
    orderBy, 
    Timestamp,
    collectionGroup
  } from 'firebase/firestore';
  import { db } from './firebaseConfig';
  
  /**
   * Get all orders from all users
   */
 /**
 * Get all orders from all users (without sorting that requires an index)
 */
 import axios from 'axios';

 export const getNutriScore = async (nutritionData) => {
   const response = await axios.post('http://localhost:5000/predict', nutritionData);
   return response.data.nutri_score;
 };
 
export const getAllOrders = async () => {
    try {
      // Use collectionGroup without orderBy to query all 'orders' subcollections 
      const ordersQuery = query(
        collectionGroup(db, 'orders')
      );
      
      const querySnapshot = await getDocs(ordersQuery);
      const orders = [];
      
      for (const docSnapshot of querySnapshot.docs) {
        // Get user info for each order
        const userId = docSnapshot.ref.path.split('/')[1]; // Extract user ID from path
        
        try {
          const userDoc = await getDoc(doc(db, 'users', userId));
          const userData = userDoc.exists() ? userDoc.data() : {};
          
          // Format order data
          const orderData = docSnapshot.data();
          const createdAt = orderData.createdAt instanceof Timestamp 
            ? orderData.createdAt.toDate() 
            : new Date(orderData.createdAt);
          
          orders.push({
            id: docSnapshot.id,
            ...orderData,
            createdAt,
            customerName: userData.displayName || userData.name,
            customerEmail: userData.email,
            userId
          });
        } catch (err) {
          console.error(`Error getting user data for order ${docSnapshot.id}:`, err);
          // Still add order even if user data can't be fetched
          const orderData = docSnapshot.data();
          orders.push({
            id: docSnapshot.id,
            ...orderData,
            createdAt: orderData.createdAt instanceof Timestamp 
              ? orderData.createdAt.toDate() 
              : new Date(orderData.createdAt),
            userId
          });
        }
      }
      
      // Sort in memory instead of in the query
      return orders.sort((a, b) => b.createdAt - a.createdAt);
    } catch (error) {
      console.error('Error getting all orders:', error);
      throw error;
    }
  };
  /**
   * Update order status
   */
  export const updateOrderStatus = async (orderId, newStatus) => {
    try {
      // First, find the order in the orders collection
      const orderQuery = query(
        collectionGroup(db, 'orders'),
        where('__name__', '==', orderId)
      );
      
      const querySnapshot = await getDocs(orderQuery);
      
      if (querySnapshot.empty) {
        throw new Error(`Order with ID ${orderId} not found`);
      }
      
      // Get the first (and should be only) matching document
      const orderDoc = querySnapshot.docs[0];
      
      // Update the order status
      await updateDoc(orderDoc.ref, {
        status: newStatus,
        lastUpdated: new Date()
      });
      
      // Also update the global orders collection for admin statistics
      // Try to find the corresponding entry in the global orders collection
      const globalOrderQuery = query(
        collection(db, 'orders'),
        where('orderId', '==', orderId)
      );
      
      const globalQuerySnapshot = await getDocs(globalOrderQuery);
      
      if (!globalQuerySnapshot.empty) {
        const globalOrderDoc = globalQuerySnapshot.docs[0];
        await updateDoc(globalOrderDoc.ref, {
          status: newStatus,
          lastUpdated: new Date()
        });
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error updating order status:', error);
      throw error;
    }
  };
  
  /**
   * Get order statistics
   */
  export const getOrderStatistics = async (timeRange = 30) => {
    try {
      // Get all orders within the time range
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - timeRange);
      
      const ordersQuery = query(
        collectionGroup(db, 'orders'),
        where('createdAt', '>=', startDate)
      );
      
      const querySnapshot = await getDocs(ordersQuery);
      const orders = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Calculate statistics
      const totalOrders = orders.length;
      const totalRevenue = orders.reduce((sum, order) => sum + (order.total || 0), 0);
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
      
      // Count orders by status
      const ordersByStatus = orders.reduce((acc, order) => {
        const status = order.status || 'unknown';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {});
      
      // Count sales by product category
      const salesByCategory = {};
      orders.forEach(order => {
        (order.items || []).forEach(item => {
          const category = item.category || 'unknown';
          if (!salesByCategory[category]) {
            salesByCategory[category] = {
              count: 0,
              revenue: 0
            };
          }
          salesByCategory[category].count += item.quantity || 1;
          salesByCategory[category].revenue += (item.price || 0) * (item.quantity || 1);
        });
      });
      
      return {
        totalOrders,
        totalRevenue,
        averageOrderValue,
        ordersByStatus,
        salesByCategory
      };
    } catch (error) {
      console.error('Error getting order statistics:', error);
      throw error;
    }
  };
  
  // Additional utils for the admin component
  export const formatters = {
    formatCurrency: (amount) => {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
      }).format(amount);
    },
    
    formatDate: (date) => {
      return new Date(date).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    }
  };

