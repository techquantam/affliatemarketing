import React, { useState } from 'react';
import { Search, X, ShoppingBag, Layers, Tag } from 'lucide-react';

export default function SearchBar({ placeholder, onSearch, value, onChange }) {
  return (
    <div className="home-search-wrapper">
      <div className="home-search-container">
        <Search size={18} className="home-search-icon" />
        <input
          type="text"
          className="home-search-input"
          placeholder={placeholder || "Search products, brands, categories or stores..."}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            if (onSearch) onSearch(e.target.value);
          }}
        />
        {value && (
          <button 
            className="home-search-clear" 
            onClick={() => {
              onChange('');
              if (onSearch) onSearch('');
            }}
            aria-label="Clear search"
          >
            <X size={15} />
          </button>
        )}
      </div>
    </div>
  );
}
