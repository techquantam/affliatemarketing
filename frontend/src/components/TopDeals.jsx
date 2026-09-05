import React, { useState } from 'react';
import { Tag, Sparkles, Share2, ChevronDown, ChevronUp, ArrowLeftRight, Check } from 'lucide-react';

export default function TopDeals({ deals = [], onGrabDeal, onShareDeal, activeCategory = 'all', compareList = [], onToggleCompare }) {
  const [showAll, setShowAll] = useState(false);
  const displayLimit = 36;
  const hasMore = deals && deals.length > displayLimit;
  const visibleDeals = showAll ? (deals || []) : (deals || []).slice(0, displayLimit);

  return (
    <div style={{ width: '100%', marginBottom: '40px' }}>
      <div className="section-header">
        <div className="section-title-wrap">
          <Tag className="section-icon" size={24} />
          <h3 className="section-title">
            {activeCategory && activeCategory !== 'all'
              ? `Top Deals in ${activeCategory.charAt(0).toUpperCase() + activeCategory.slice(1)}`
              : 'Top Deals & Featured Products'}
          </h3>
        </div>
        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Sparkles size={14} /> {deals.length} Active {deals.length === 1 ? 'Product / Deal' : 'Products & Deals'}
        </span>
      </div>

      {!deals || deals.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '40px 20px',
          background: 'var(--card-bg, #ffffff)',
          borderRadius: '12px',
          border: '1px solid var(--border, #e2e8f0)',
          margin: '12px 0'
        }}>
          <p style={{ color: 'var(--text-muted, #64748b)', margin: 0, fontSize: '15px', fontWeight: 500 }}>
            No products or deals found in this category yet.
          </p>
        </div>
      ) : (
        <>
          <div className="deals-grid">
            {visibleDeals.map((deal) => {
              // Calculations
              const discountPercent = Math.round((((deal.retailPrice || 0) - (deal.dealPrice || 0)) / (deal.retailPrice || 1)) * 100);
              const isInCompare = compareList && compareList.some(item => item.id === deal.id);

              return (
                <div 
                  key={deal.id} 
                  className="deal-card animate-fade" 
                  style={{ position: 'relative', cursor: 'pointer' }}
                  onClick={() => onGrabDeal(deal)}
                >
                  <span className="deal-badge">{discountPercent > 0 ? `${discountPercent}% OFF` : 'SPECIAL'}</span>
                  {deal.comparisons && deal.comparisons.length > 1 && (
                    <span style={{
                      position: 'absolute',
                      top: '10px',
                      right: '10px',
                      backgroundColor: '#10b981',
                      color: '#ffffff',
                      fontSize: '10px',
                      fontWeight: '800',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      zIndex: 2,
                      boxShadow: '0 2px 6px rgba(16, 185, 129, 0.4)'
                    }}>
                      🏆 Best Price ({deal.comparisons.length} Shops)
                    </span>
                  )}

                  <div className="deal-image-box">
                    <img 
                      src={deal.image} 
                      alt={deal.title} 
                      className="deal-image" 
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300';
                      }}
                    />
                  </div>

                  <div className="deal-info">
                    <div className="deal-store-row">
                      <img 
                        src={deal.storeLogo || 'https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg'} 
                        alt="Store Logo" 
                        className="deal-store-logo" 
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg';
                        }}
                      />
                      <span className="deal-category">{deal.category}</span>
                    </div>

                    <h4 className="deal-title">{deal.title}</h4>

                    {deal.comparisons && deal.comparisons.length > 1 && (
                      <div style={{
                        fontSize: '11px',
                        color: '#10b981',
                        fontWeight: '700',
                        marginTop: '-2px',
                        marginBottom: '6px'
                      }}>
                        Lowest at {deal.platform}: ₹{(deal.dealPrice || 0).toFixed(2)}
                      </div>
                    )}

                    <div className="deal-price-section">
                      <div className="deal-retail-row">
                        <span>Retail Price:</span>
                        <span className="deal-retail-price">₹{(deal.retailPrice || 0).toFixed(2)}</span>
                      </div>

                      <div className="deal-discounted-row">
                        <span>Special Price:</span>
                        <span>₹{(deal.dealPrice || 0).toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="deal-actions-row">
                      <button
                        className="btn-card-primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          onGrabDeal(deal);
                        }}
                      >
                        Buy Now
                      </button>

                      <button
                        className={`btn-deal-compare ${isInCompare ? 'in-compare' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onToggleCompare) {
                            onToggleCompare(deal);
                          } else {
                            onGrabDeal(deal);
                          }
                        }}
                        title={isInCompare ? "Remove from comparison" : "Compare prices across all shops"}
                        aria-label="Compare prices"
                      >
                        {isInCompare ? <Check size={13} /> : <ArrowLeftRight size={13} />}
                        <span>Compare</span>
                      </button>

                      <button
                        className="btn-deal-share"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onShareDeal) {
                            onShareDeal(deal);
                          }
                        }}
                        title="Share Deal"
                        aria-label="Share Deal"
                      >
                        <Share2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {hasMore && (
            <div style={{ textAlign: 'center', marginTop: '24px' }}>
              <button
                className="btn-secondary"
                onClick={() => setShowAll(prev => !prev)}
                style={{
                  padding: '10px 24px',
                  fontWeight: 600,
                  fontSize: '14px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  borderRadius: '24px',
                  cursor: 'pointer'
                }}
              >
                {showAll ? (
                  <>Show Less <ChevronUp size={16} /></>
                ) : (
                  <>View All ({deals.length}) Products & Deals <ChevronDown size={16} /></>
                )}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
