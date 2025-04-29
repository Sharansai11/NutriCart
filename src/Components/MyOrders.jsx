// import React, { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { 
//   FaBox, 
//   FaShoppingBag, 
//   FaCalendarAlt, 
//   FaMoneyBillWave, 
//   FaArrowRight, 
//   FaTruck, 
//   FaCheckCircle, 
//   FaExclamationCircle, 
//   FaEye,
//   FaReceipt
// } from 'react-icons/fa';
// import { useAuth } from '../context/Authcontext';
// import { getUserOrders } from '../api/userService';

// const MyOrders = () => {
//   const { currentUser } = useAuth();
//   const navigate = useNavigate();
//   const [orders, setOrders] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState('');
//   const [selectedOrder, setSelectedOrder] = useState(null);
//   const [showOrderDetails, setShowOrderDetails] = useState(false);

//   useEffect(() => {
//     const fetchOrders = async () => {
//       if (!currentUser) {
//         setLoading(false);
//         return;
//       }

//       try {
//         setLoading(true);
//         const userOrders = await getUserOrders(currentUser.uid);
//         // Sort orders by date (newest first)
//         const sortedOrders = userOrders.sort((a, b) => {
//           return new Date(b.createdAt) - new Date(a.createdAt);
//         });
//         setOrders(sortedOrders);
//       } catch (err) {
//         console.error('Error fetching orders:', err);
//         setError('Failed to load your orders. Please try again later.');
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchOrders();
//   }, [currentUser]);

//   // Format currency
//   const formatCurrency = (amount) => {
//     return new Intl.NumberFormat('en-IN', {
//       style: 'currency',
//       currency: 'INR',
//       maximumFractionDigits: 0,
//     }).format(amount);
//   };

//   // Format date
//   const formatDate = (date) => {
//     return new Date(date).toLocaleDateString('en-IN', {
//       year: 'numeric',
//       month: 'short',
//       day: 'numeric',
//     });
//   };

//   // Get status badge
//   const getStatusBadge = (status) => {
//     switch (status.toLowerCase()) {
//       case 'pending':
//         return <span className="badge bg-warning">Pending</span>;
//       case 'processing':
//         return <span className="badge bg-info">Processing</span>;
//       case 'shipped':
//         return <span className="badge bg-primary">Shipped</span>;
//       case 'delivered':
//         return <span className="badge bg-success">Delivered</span>;
//       case 'completed':
//         return <span className="badge bg-success">Completed</span>;
//       case 'cancelled':
//         return <span className="badge bg-danger">Cancelled</span>;
//       default:
//         return <span className="badge bg-secondary">{status}</span>;
//     }
//   };

//   // Get status icon
//   const getStatusIcon = (status) => {
//     switch (status.toLowerCase()) {
//       case 'pending':
//         return <FaExclamationCircle className="text-warning" />;
//       case 'processing':
//         return <FaBox className="text-info" />;
//       case 'shipped':
//         return <FaTruck className="text-primary" />;
//       case 'delivered':
//       case 'completed':
//         return <FaCheckCircle className="text-success" />;
//       case 'cancelled':
//         return <FaExclamationCircle className="text-danger" />;
//       default:
//         return <FaBox className="text-secondary" />;
//     }
//   };

//   // View order details
//   const viewOrderDetails = (order) => {
//     setSelectedOrder(order);
//     setShowOrderDetails(true);
//   };

//   // Get order progress steps
//   const getOrderProgressSteps = (status) => {
//     const steps = [
//       { key: 'pending', label: 'Order Placed' },
//       { key: 'processing', label: 'Processing' },
//       { key: 'shipped', label: 'Shipped' },
//       { key: 'delivered', label: 'Delivered' }
//     ];
    
//     let activeIndex = 0;
    
//     switch (status.toLowerCase()) {
//       case 'pending':
//         activeIndex = 0;
//         break;
//       case 'processing':
//         activeIndex = 1;
//         break;
//       case 'shipped':
//         activeIndex = 2;
//         break;
//       case 'delivered':
//       case 'completed':
//         activeIndex = 3;
//         break;
//       default:
//         activeIndex = 0;
//     }
    
//     return (
//       <div className="order-progress mb-4">
//         <div className="d-flex justify-content-between position-relative">
//           {steps.map((step, index) => (
//             <div 
//               key={step.key} 
//               className={`step-item text-center ${index <= activeIndex ? 'active' : ''}`}
//               style={{ 
//                 zIndex: 1, 
//                 flex: '1',
//                 position: 'relative'
//               }}
//             >
//               <div 
//                 className={`step-circle mx-auto mb-2 d-flex align-items-center justify-content-center rounded-circle ${index <= activeIndex ? 'bg-success text-white' : 'bg-light text-muted'}`}
//                 style={{ 
//                   width: '40px', 
//                   height: '40px',
//                 }}
//               >
//                 {index < activeIndex ? (
//                   <FaCheckCircle />
//                 ) : index === activeIndex ? (
//                   index + 1
//                 ) : (
//                   index + 1
//                 )}
//               </div>
//               <div className="step-label small">{step.label}</div>
//             </div>
//           ))}
          
//           {/* Progress line */}
//           <div 
//             className="progress-line position-absolute" 
//             style={{ 
//               top: '20px', 
//               height: '2px', 
//               width: '100%', 
//               backgroundColor: '#e9ecef',
//               zIndex: 0
//             }}
//           >
//             <div 
//               className="progress-line-active bg-success" 
//               style={{ 
//                 height: '100%', 
//                 width: `${(activeIndex / (steps.length - 1)) * 100}%`
//               }}
//             ></div>
//           </div>
//         </div>
//       </div>
//     );
//   };

//   // Download invoice (dummy function for now)
//   const downloadInvoice = (orderId) => {
//     // In a real implementation, this would generate and download a PDF invoice
//     alert(`Downloading invoice for order ${orderId}`);
//   };

//   // If not logged in
//   if (!currentUser) {
//     return (
//       <div className="container py-5">
//         <div className="text-center">
//           <img 
//             src="https://cdn-icons-png.flaticon.com/512/1077/1077114.png" 
//             alt="Login required" 
//             style={{ width: '120px', opacity: '0.6' }}
//           />
//           <h3 className="mt-4">Please log in to view your orders</h3>
//           <p className="text-muted">You need to be logged in to see your order history</p>
//           <button 
//             className="btn btn-dark mt-3"
//             onClick={() => navigate('/login')}
//           >
//             Log In / Register
//           </button>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="container py-4">
//       <h2 className="mb-4">My Orders</h2>
      
//       {error && <div className="alert alert-danger">{error}</div>}
      
//       {loading ? (
//         <div className="text-center py-5">
//           <div className="spinner-border text-dark" role="status">
//             <span className="visually-hidden">Loading...</span>
//           </div>
//           <p className="mt-2">Loading your orders...</p>
//         </div>
//       ) : orders.length === 0 ? (
//         <div className="text-center py-5">
//           <div className="mb-4">
//             <img 
//               src="https://cdn-icons-png.flaticon.com/512/3737/3737151.png" 
//               alt="No orders" 
//               style={{ width: '150px', opacity: '0.6' }}
//             />
//           </div>
//           <h3>No orders found</h3>
//           <p className="text-muted">You haven't placed any orders yet</p>
//           <button 
//             className="btn btn-dark mt-3"
//             onClick={() => navigate('/products')}
//           >
//             Start Shopping
//           </button>
//         </div>
//       ) : (
//         <div className="row">
//           <div className="col-12">
//             <div className="card shadow-sm border-0 mb-4">
//               <div className="card-body">
//                 <h5 className="card-title mb-4">Order History</h5>
                
//                 {orders.map((order) => (
//                   <div 
//                     key={order.id} 
//                     className="order-card mb-4 border rounded p-3"
//                   >
//                     <div className="row">
//                       <div className="col-md-8">
//                         <div className="d-flex align-items-center mb-2">
//                           <h5 className="mb-0 me-3">Order #{order.id.substring(0, 8)}</h5>
//                           {getStatusBadge(order.status)}
//                         </div>
                        
//                         <div className="d-flex mb-3">
//                           <div className="me-4 d-flex align-items-center">
//                             <FaCalendarAlt className="text-muted me-1" />
//                             <small className="text-muted">
//                               {formatDate(order.createdAt)}
//                             </small>
//                           </div>
//                           <div className="me-4 d-flex align-items-center">
//                             <FaShoppingBag className="text-muted me-1" />
//                             <small className="text-muted">
//                               {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
//                             </small>
//                           </div>
//                           <div className="me-4 d-flex align-items-center">
//                             <FaMoneyBillWave className="text-muted me-1" />
//                             <small className="text-muted">
//                               {order.paymentMethod === 'card' ? 'Paid with Card' : 'Cash on Delivery'}
//                             </small>
//                           </div>
//                         </div>
                        
//                         <div className="d-flex mb-3">
//                           {order.items.slice(0, 3).map((item, index) => (
//                             <div 
//                               key={index} 
//                               className="order-item-preview me-2"
//                               style={{ 
//                                 width: '60px', 
//                                 height: '60px', 
//                                 backgroundColor: '#f8f9fa',
//                                 borderRadius: '4px',
//                                 overflow: 'hidden'
//                               }}
//                             >
//                               <img 
//                                 src={item.imageUrl || "https://placehold.co/60x60?text=No+Image"} 
//                                 alt={item.productName} 
//                                 className="w-100 h-100"
//                                 style={{ objectFit: 'contain' }}
//                               />
//                             </div>
//                           ))}
                          
//                           {order.items.length > 3 && (
//                             <div 
//                               className="order-item-preview d-flex align-items-center justify-content-center"
//                               style={{ 
//                                 width: '60px', 
//                                 height: '60px', 
//                                 backgroundColor: '#e9ecef',
//                                 borderRadius: '4px'
//                               }}
//                             >
//                               <small>+{order.items.length - 3}</small>
//                             </div>
//                           )}
//                         </div>
//                       </div>
                      
//                       <div className="col-md-4 d-flex flex-column justify-content-between">
//                         <div className="text-md-end mb-3 mb-md-0">
//                           <div className="mb-2">
//                             <strong className="fs-5">{formatCurrency(order.total)}</strong>
//                           </div>
//                         </div>
                        
//                         <div className="d-flex flex-column flex-md-row justify-content-md-end gap-2">
//                           <button 
//                             className="btn btn-sm btn-outline-secondary d-flex align-items-center justify-content-center"
//                             onClick={() => downloadInvoice(order.id)}
//                           >
//                             <FaReceipt className="me-1" />
//                             <span>Invoice</span>
//                           </button>
//                           <button 
//                             className="btn btn-sm btn-primary d-flex align-items-center justify-content-center"
//                             onClick={() => viewOrderDetails(order)}
//                           >
//                             <FaEye className="me-1" />
//                             <span>View Details</span>
//                           </button>
//                         </div>
//                       </div>
//                     </div>
//                     </div>
//                 ))}
                
//               </div>
//             </div>
//           </div>
//         </div>
//       )}
      
//       {/* Order Details Modal */}
//       {showOrderDetails && selectedOrder && (
//         <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
//           <div className="modal-dialog modal-dialog-centered modal-lg">
//             <div className="modal-content">
//               <div className="modal-header">
//                 <h5 className="modal-title d-flex align-items-center">
//                   Order Details <span className="ms-2 badge bg-dark">#{selectedOrder.id.substring(0, 8)}</span>
//                 </h5>
//                 <button 
//                   type="button" 
//                   className="btn-close"
//                   onClick={() => setShowOrderDetails(false)}
//                 ></button>
//               </div>
//               <div className="modal-body">
//                 {/* Order Progress */}
//                 {getOrderProgressSteps(selectedOrder.status)}
                
//                 {/* Order Summary */}
//                 <div className="card mb-4">
//                   <div className="card-body">
//                     <div className="row">
//                       <div className="col-md-6">
//                         <h6 className="text-muted mb-2">Order Information</h6>
//                         <p className="mb-1">
//                           <strong>Order Date:</strong> {formatDate(selectedOrder.createdAt)}
//                         </p>
//                         <p className="mb-1">
//                           <strong>Order Status:</strong> {getStatusBadge(selectedOrder.status)}
//                         </p>
//                         <p className="mb-0">
//                           <strong>Payment Method:</strong> {selectedOrder.paymentMethod === 'card' ? 'Credit/Debit Card' : 'Cash on Delivery'}
//                         </p>
//                       </div>
//                       <div className="col-md-6">
//                         <h6 className="text-muted mb-2">Shipping Information</h6>
//                         <p className="mb-0">
//                           {selectedOrder.shippingAddress || 'No shipping address provided'}
//                         </p>
//                       </div>
//                     </div>
//                   </div>
//                 </div>
                
//                 {/* Order Items */}
//                 <h6 className="mb-3">Order Items</h6>
//                 <div className="table-responsive">
//                   <table className="table">
//                     <thead className="table-light">
//                       <tr>
//                         <th scope="col">Product</th>
//                         <th scope="col">Price</th>
//                         <th scope="col">Quantity</th>
//                         <th scope="col" className="text-end">Total</th>
//                       </tr>
//                     </thead>
//                     <tbody>
//                       {selectedOrder.items.map((item, index) => (
//                         <tr key={index}>
//                           <td>
//                             <div className="d-flex align-items-center">
//                               <div 
//                                 className="flex-shrink-0 me-3" 
//                                 style={{ width: '50px', height: '50px', backgroundColor: '#f8f9fa' }}
//                               >
//                                 <img 
//                                   src={item.imageUrl || "https://placehold.co/50x50?text=No+Image"} 
//                                   alt={item.productName} 
//                                   className="w-100 h-100"
//                                   style={{ objectFit: 'contain' }}
//                                 />
//                               </div>
//                               <div>
//                                 <h6 className="mb-0">{item.productName}</h6>
//                                 <small className="text-muted">{item.category}</small>
//                               </div>
//                             </div>
//                           </td>
//                           <td>{formatCurrency(item.price)}</td>
//                           <td>{item.quantity}</td>
//                           <td className="text-end">{formatCurrency(item.price * item.quantity)}</td>
//                         </tr>
//                       ))}
//                     </tbody>
//                   </table>
//                 </div>
                
//                 {/* Order Totals */}
//                 <div className="row justify-content-end">
//                   <div className="col-md-5">
//                     <div className="card">
//                       <div className="card-body">
//                         <div className="d-flex justify-content-between mb-2">
//                           <span>Subtotal</span>
//                           <span>{formatCurrency(selectedOrder.subtotal)}</span>
//                         </div>
//                         <div className="d-flex justify-content-between mb-2">
//                           <span>Tax</span>
//                           <span>{formatCurrency(selectedOrder.tax)}</span>
//                         </div>
//                         <div className="d-flex justify-content-between mb-3">
//                           <span>Shipping</span>
//                           <span>
//                             {selectedOrder.shipping === 0 
//                               ? <span className="text-success">Free</span>
//                               : formatCurrency(selectedOrder.shipping)
//                             }
//                           </span>
//                         </div>
//                         <hr />
//                         <div className="d-flex justify-content-between">
//                           <span className="fw-bold">Total</span>
//                           <span className="fw-bold">{formatCurrency(selectedOrder.total)}</span>
//                         </div>
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//               <div className="modal-footer">
//                 <button 
//                   type="button" 
//                   className="btn btn-outline-secondary me-auto"
//                   onClick={() => downloadInvoice(selectedOrder.id)}
//                 >
//                   <FaReceipt className="me-1" />
//                   Download Invoice
//                 </button>
//                 <button 
//                   type="button" 
//                   className="btn btn-secondary"
//                   onClick={() => setShowOrderDetails(false)}
//                 >
//                   Close
//                 </button>
//                 {selectedOrder.status === 'shipped' && (
//                   <button 
//                     type="button" 
//                     className="btn btn-success"
//                     onClick={() => alert('Order marked as delivered')}
//                   >
//                     <FaCheckCircle className="me-1" />
//                     Mark as Delivered
//                   </button>
//                 )}
//                 {(selectedOrder.status === 'pending' || selectedOrder.status === 'processing') && (
//                   <button 
//                     type="button" 
//                     className="btn btn-danger"
//                     onClick={() => alert('Order cancellation requested')}
//                   >
//                     <FaTimes className="me-1" />
//                     Cancel Order
//                   </button>
//                 )}
//               </div>
//             </div>
//           </div>
//         </div>
//       )}
      
//       {/* Tracking Info Modal - Could be implemented for more detailed order tracking */}
      
//       {/* Customer Support Section */}
//       <div className="mt-5">
//         <div className="card shadow-sm border-0">
//           <div className="card-body">
//             <div className="row align-items-center">
//               <div className="col-md-8">
//                 <h5>Need help with an order?</h5>
//                 <p className="mb-md-0">
//                   Our customer support team is available to assist you with any questions or issues.
//                 </p>
//               </div>
//               <div className="col-md-4 text-md-end">
//                 <button className="btn btn-dark">
//                   Contact Support
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
      
//       {/* Order FAQs - Could be expanded for better customer service */}
//       <div className="mt-4">
//         <h5 className="mb-3">Frequently Asked Questions</h5>
//         <div className="accordion" id="orderFaqAccordion">
//           <div className="accordion-item">
//             <h2 className="accordion-header">
//               <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#faqOne">
//                 How can I track my order?
//               </button>
//             </h2>
//             <div id="faqOne" className="accordion-collapse collapse" data-bs-parent="#orderFaqAccordion">
//               <div className="accordion-body">
//                 Once your order is shipped, you'll receive a tracking number via email. You can also find this information in the order details page by clicking "View Details" on any order.
//               </div>
//             </div>
//           </div>
//           <div className="accordion-item">
//             <h2 className="accordion-header">
//               <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#faqTwo">
//                 Can I cancel my order?
//               </button>
//             </h2>
//             <div id="faqTwo" className="accordion-collapse collapse" data-bs-parent="#orderFaqAccordion">
//               <div className="accordion-body">
//                 You can cancel orders that are in "Pending" or "Processing" status. Once an order has been shipped, it cannot be canceled. To cancel an eligible order, click "View Details" and then "Cancel Order".
//               </div>
//             </div>
//           </div>
//           <div className="accordion-item">
//             <h2 className="accordion-header">
//               <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#faqThree">
//                 What is your return policy?
//               </button>
//             </h2>
//             <div id="faqThree" className="accordion-collapse collapse" data-bs-parent="#orderFaqAccordion">
//               <div className="accordion-body">
//                 We accept returns within 30 days of delivery for most items. Please ensure products are in original condition with packaging. To initiate a return, please contact our customer support team.
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default MyOrders;

import React from 'react'

function MyOrders() {
  return (
    <div>MyOrders</div>
  )
}

export default MyOrders