import React, { useState, useRef, useEffect } from "react";
import { FaSearch, FaTimes } from "react-icons/fa";
import { saveSearchHistory, getSearchHistory, deleteSearchTerm } from "../api/userService";
import { useAuth } from "../context/Authcontext";

const ProductSearch = ({ onSearch, initialSearchTerm = "" }) => {
  const { currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const [searchHistory, setSearchHistory] = useState([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const searchInputRef = useRef(null);

  // Load search history when component mounts
  useEffect(() => {
    fetchSearchHistory();
  }, [currentUser]);

  const fetchSearchHistory = async () => {
    if (!currentUser) {
      setSearchHistory([]);
      return;
    }

    try {
      setLoadingHistory(true);
      const history = await getSearchHistory(currentUser.uid);
      setSearchHistory(history);
    } catch (error) {
      console.error("Error fetching search history:", error);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Handle search input focus
  const handleSearchInputFocus = () => {
    if (currentUser && searchHistory.length > 0) {
      setShowSearchDropdown(true);
    }
  };

  // Handle search input change
  const handleSearchInputChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Handle search input blur
  const handleSearchInputBlur = () => {
    // Delay hiding the dropdown to allow clicking on items
    setTimeout(() => {
      setShowSearchDropdown(false);
    }, 200);
  };

  // Handle search form submission
  const handleSearchSubmit = async (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      // Save search to history
      if (currentUser) {
        await saveSearchHistory(currentUser.uid, searchTerm);
        fetchSearchHistory();
      }
      
      // Trigger search
      onSearch(searchTerm);
      setShowSearchDropdown(false);
    } else {
      // If search term is empty, clear search
      onSearch("");
    }
  };

  // Handle clicking on a search history item
  const handleHistoryItemClick = async (term) => {
    setSearchTerm(term);
    setShowSearchDropdown(false);
    
    // Save to history and apply search
    if (currentUser) {
      await saveSearchHistory(currentUser.uid, term);
      fetchSearchHistory();
    }
    
    // Trigger search
    onSearch(term);
  };

  // Handle deleting a search term from history
  const handleDeleteSearchTerm = async (e, term) => {
    e.stopPropagation(); // Prevent triggering the parent click
    if (currentUser) {
      await deleteSearchTerm(currentUser.uid, term);
      fetchSearchHistory();
    }
  };

  // Clear search
  const handleClearSearch = () => {
    setSearchTerm("");
    onSearch("");
  };

  return (
    <div className="product-search mb-4">
      <form onSubmit={handleSearchSubmit}>
        <div className="position-relative">
          <div className="input-group">
            <span className="input-group-text bg-primary text-white">
              <FaSearch />
            </span>
            <input
              type="text"
              className="form-control"
              placeholder="Search products by name, description, tags..."
              value={searchTerm}
              onChange={handleSearchInputChange}
              onFocus={handleSearchInputFocus}
              onBlur={handleSearchInputBlur}
              ref={searchInputRef}
            />
            {searchTerm && (
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={handleClearSearch}
              >
                <FaTimes />
              </button>
            )}
            <button type="submit" className="btn btn-primary">
              Search
            </button>
          </div>
          
          {/* Search history dropdown */}
          {showSearchDropdown && searchHistory.length > 0 && (
            <div className="position-absolute w-100 mt-1 bg-white border rounded shadow-sm z-3">
              <div className="p-2 border-bottom bg-light">
                <small className="text-muted">Recent Searches</small>
              </div>
              {searchHistory.map((item, index) => (
                <div 
                  key={index}
                  className="d-flex justify-content-between align-items-center p-2 border-bottom hover-bg-light cursor-pointer"
                  onClick={() => handleHistoryItemClick(item.term)}
                  style={{ cursor: 'pointer' }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <div className="text-primary">
                    <small><FaSearch className="me-2 opacity-50" />{item.term}</small>
                  </div>
                  <button 
                    className="btn btn-sm text-muted p-0 border-0"
                    onClick={(e) => handleDeleteSearchTerm(e, item.term)}
                    title="Remove from history"
                  >
                    <FaTimes />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </form>
      
      {/* Applied search term indicator */}
      {initialSearchTerm && (
        <div className="mt-2">
          <span className="text-muted">
            Results for: <strong>"{initialSearchTerm}"</strong>
          </span>
          <button 
            className="btn btn-sm text-danger border-0 ms-2 p-0"
            onClick={handleClearSearch}
          >
            <FaTimes /> Clear
          </button>
        </div>
      )}
    </div>
  );
};

export default ProductSearch;