import React, { useState, useEffect } from 'react';
import { FaSort, FaEye, FaFilter, FaDownload, FaSearch } from 'react-icons/fa';
import { getAllOrders, updateOrderStatus } from '../api/adminService';
import { formatCurrency, formatDate } from '../api/formatters';

const ViewOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState('createdAt');
  const [sortDirection, setSortDirection] = useState('desc');

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        setError('');
        const allOrders = await getAllOrders();
        setOrders(allOrders);
      } catch (err) {
        console.error('Error fetching orders:', err);
        
        if (err.message && err.message.includes('requires an index')) {
          setError('Database indexing in progress. Please follow the link in the console to create the required index, or try again in a few minutes.');
        } else {
          setError('Failed to load orders. Please try again later.');
        }
      } finally {
        setLoading(false);
      }
    };
  
    fetchOrders();
  }, []);

  // Filter orders based on status and search query
  const filteredOrders = orders.filter(order => {
    // Filter by status
    if (filterStatus !== 'all' && order.status !== filterStatus) {
      return false;
    }
    
    // Filter by search query (check order ID or customer name)
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        order.id.toLowerCase().includes(query) || 
        order.customerName?.toLowerCase().includes(query) ||
        order.customerEmail?.toLowerCase().includes(query)
      );
    }
    
    return true;
  });

  // Sort orders
  const sortedOrders = [...filteredOrders].sort((a, b) => {
    let comparison = 0;
    
    if (sortField === 'total') {
      comparison = a.total - b.total;
    } else if (sortField === 'createdAt') {
      comparison = new Date(a.createdAt) - new Date(b.createdAt);
    } else if (sortField === 'customerName') {
      comparison = (a.customerName || '').localeCompare(b.customerName || '');
    }
    
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const handleViewDetails = (order) => {
    setSelectedOrder(order);
    setShowOrderDetails(true);
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      
      // Update local state
      setOrders(orders.map(order => 
        order.id === orderId ? { ...order, status: newStatus } : order
      ));
      
      // If we're viewing this order's details, update the selected order too
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }
      
      // Success message could be shown here
    } catch (error) {
      console.error('Error updating order status:', error);
      // Error message could be shown here
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'bg-warning';
      case 'processing': return 'bg-info';
      case 'shipped': return 'bg-primary';
      case 'delivered': return 'bg-success';
      case 'completed': return 'bg-success';
      case 'cancelled': return 'bg-danger';
      default: return 'bg-secondary';
    }
  };

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Order Management</h2>
        <button className="btn btn-outline-dark">
          <FaDownload className="me-2" />
          Export Orders
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {/* Filters and search */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-6">
              <div className="input-group">
                <span className="input-group-text bg-light">
                  <FaSearch />
                </span>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="Search by order ID or customer name"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="col-md-4">
              <div className="input-group">
                <span className="input-group-text bg-light">
                  <FaFilter />
                </span>
                <select 
                  className="form-select"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
            <div className="col-md-2">
              <span className="badge bg-primary rounded-pill">
                {filteredOrders.length} Orders
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Orders table */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading orders...</p>
        </div>
      ) : sortedOrders.length === 0 ? (
        <div className="card">
          <div className="card-body text-center py-5">
            <h5>No orders found</h5>
            <p className="text-muted">Try adjusting your search or filter criteria</p>
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th 
                      style={{ cursor: 'pointer' }} 
                      onClick={() => handleSort('id')}
                    >
                      Order ID <FaSort className="ms-1" />
                    </th>
                    <th 
                      style={{ cursor: 'pointer' }} 
                      onClick={() => handleSort('customerName')}
                    >
                      Customer <FaSort className="ms-1" />
                    </th>
                    <th 
                      style={{ cursor: 'pointer' }} 
                      onClick={() => handleSort('createdAt')}
                    >
                      Date <FaSort className="ms-1" />
                    </th>
                    <th>Status</th>
                    <th 
                      style={{ cursor: 'pointer' }} 
                      onClick={() => handleSort('total')}
                    >
                      Total <FaSort className="ms-1" />
                    </th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedOrders.map((order) => (
                    <tr key={order.id}>
                      <td>#{order.id.substring(0, 8)}</td>
                      <td>
                        <div>
                          <div>{order.customerName || 'Unknown'}</div>
                          <small className="text-muted">{order.customerEmail}</small>
                        </div>
                      </td>
                      <td>{formatDate(order.createdAt)}</td>
                      <td>
                        <span className={`badge ${getStatusBadgeClass(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                      <td>{formatCurrency(order.total)}</td>
                      <td>
                        <div className="d-flex">
                          <button 
                            className="btn btn-sm btn-outline-primary me-2"
                            onClick={() => handleViewDetails(order)}
                          >
                            <FaEye /> Details
                          </button>
                          <select 
                            className="form-select form-select-sm w-auto"
                            value={order.status}
                            onChange={(e) => handleStatusChange(order.id, e.target.value)}
                          >
                            <option value="pending">Pending</option>
                            <option value="processing">Processing</option>
                            <option value="shipped">Shipped</option>
                            <option value="delivered">Delivered</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Order Details Modal */}
      {showOrderDetails && selectedOrder && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  Order Details <span className="badge bg-dark ms-2">#{selectedOrder.id.substring(0, 8)}</span>
                </h5>
                <button 
                  type="button" 
                  className="btn-close"
                  onClick={() => setShowOrderDetails(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="row mb-4">
                  <div className="col-md-6">
                    <h6 className="text-muted mb-2">Order Information</h6>
                    <p className="mb-1"><strong>Date:</strong> {formatDate(selectedOrder.createdAt)}</p>
                    <p className="mb-1">
                      <strong>Status:</strong> 
                      <span className={`badge ${getStatusBadgeClass(selectedOrder.status)} ms-2`}>
                        {selectedOrder.status}
                      </span>
                    </p>
                    <p className="mb-0"><strong>Payment Method:</strong> {selectedOrder.paymentMethod}</p>
                  </div>
                  <div className="col-md-6">
                    <h6 className="text-muted mb-2">Customer Details</h6>
                    <p className="mb-1"><strong>Name:</strong> {selectedOrder.customerName || 'Unknown'}</p>
                    <p className="mb-1"><strong>Email:</strong> {selectedOrder.customerEmail || 'Not provided'}</p>
                    <p className="mb-0"><strong>Address:</strong> {selectedOrder.shippingAddress || 'Not provided'}</p>
                  </div>
                </div>

                <h6 className="mb-3">Order Items</h6>
                <div className="table-responsive">
                  <table className="table">
                    <thead className="table-light">
                      <tr>
                        <th>Product</th>
                        <th>Price</th>
                        <th>Quantity</th>
                        <th className="text-end">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOrder.items.map((item, index) => (
                        <tr key={index}>
                          <td>
                            <div className="d-flex align-items-center">
                              <div 
                                style={{ width: '40px', height: '40px', backgroundColor: '#f8f9fa' }}
                                className="me-2"
                              >
                                <img 
                                  src={item.imageUrl || "https://placehold.co/40x40?text=No+Image"} 
                                  alt={item.productName} 
                                  className="img-fluid"
                                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                />
                              </div>
                              <div>
                                <div>{item.productName}</div>
                                <small className="text-muted">{item.category}</small>
                              </div>
                            </div>
                          </td>
                          <td>{formatCurrency(item.price)}</td>
                          <td>{item.quantity}</td>
                          <td className="text-end">{formatCurrency(item.price * item.quantity)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="row justify-content-end">
                  <div className="col-md-5">
                    <div className="card">
                      <div className="card-body">
                        <div className="d-flex justify-content-between mb-2">
                          <span>Subtotal</span>
                          <span>{formatCurrency(selectedOrder.subtotal)}</span>
                        </div>
                        <div className="d-flex justify-content-between mb-2">
                          <span>Tax</span>
                          <span>{formatCurrency(selectedOrder.tax)}</span>
                        </div>
                        <div className="d-flex justify-content-between mb-2">
                          <span>Shipping</span>
                          <span>
                            {selectedOrder.shipping === 0 
                              ? <span className="text-success">Free</span>
                              : formatCurrency(selectedOrder.shipping)
                            }
                          </span>
                        </div>
                        <hr />
                        <div className="d-flex justify-content-between fw-bold">
                          <span>Total</span>
                          <span>{formatCurrency(selectedOrder.total)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <select 
                  className="form-select w-auto me-auto"
                  value={selectedOrder.status}
                  onChange={(e) => handleStatusChange(selectedOrder.id, e.target.value)}
                >
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setShowOrderDetails(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewOrders;