import React from 'react';
import { ArrowRight } from 'lucide-react';

export default function StoreGrid({ stores, onStoreSelect }) {
  return (
    <div className="home-store-section">
      <div className="section-header">
        <div className="section-title-wrap">
          <h3 className="section-title">Popular Stores</h3>
        </div>
      </div>

      <div className="stores-grid">
        {stores.map((store) => (
          <div key={store.id || store._id} className="store-card animate-fade">
            {/* Top Right Popular Badge */}
            <span className="store-popular-tag">
              ★ Popular
            </span>

            {/* Store Logo centered inside a small rounded rectangle with light border */}
            <div className="store-logo-box">
              <img 
                src={store.logo} 
                alt={store.name || 'Store'} 
                className="store-logo-img"
                onError={(e) => {
                  e.currentTarget.src = `https://placehold.co/120x60/f8fafc/64748b?text=${encodeURIComponent(store.name || 'Store')}`;
                }}
              />
            </div>

            {/* Middle: Bold Green text "Up to X% Commission" */}
            <div className="store-meta">
              <span className="store-cashback-badge">
                Up to {store.cashbackRate || '10%'} Commission
              </span>
              {/* Below that: 2 lines gray small text */}
              <p className="store-description">
                {store.description || `Best offers and verified commission on ${store.name || 'top brands'}.`}
              </p>
            </div>

            {/* Bottom Left / Full: Orange button "Grab Deal ->" */}
            <div className="store-card-actions">
              <button
                className="btn-card-primary"
                onClick={() => onStoreSelect(store.id || store._id)}
              >
                Grab Deal <ArrowRight size={15} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
