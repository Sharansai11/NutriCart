// utils/formatters.js

/**
 * Format currency amount to INR format
 * @param {number} amount - Amount to format
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return '₹0';
    
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };
  
  /**
   * Format date to readable format
   * @param {Date|string|number} date - Date to format
   * @returns {string} Formatted date string
   */
  export const formatDate = (date) => {
    if (!date) return '';
    
    const dateObj = date instanceof Date ? date : new Date(date);
    
    return dateObj.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };
  
  /**
   * Format time to readable format
   * @param {Date|string|number} date - Date to extract time from
   * @returns {string} Formatted time string
   */
  export const formatTime = (date) => {
    if (!date) return '';
    
    const dateObj = date instanceof Date ? date : new Date(date);
    
    return dateObj.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };
  
  /**
   * Format date and time together
   * @param {Date|string|number} date - Date to format
   * @returns {string} Formatted date and time string
   */
  export const formatDateTime = (date) => {
    if (!date) return '';
    
    return `${formatDate(date)}, ${formatTime(date)}`;
  };