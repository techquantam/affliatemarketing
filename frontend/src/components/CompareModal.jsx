import React from 'react';
import { X, Check, ShoppingBag, ExternalLink, Trash2, ArrowLeftRight, Sparkles, Tag, ShieldCheck } from 'lucide-react';

export default function CompareModal({
  isOpen,
  onClose,
  compareList = [],
  onRemoveItem,
  onClearAll,
  onGrabDeal
}) {
  if (!isOpen) return null;

  // Find lowest price among currently compared items
  const validPrices = compareList
    .map(item => typeof item.dealPrice === 'number' && item.dealPrice > 0 ? item.dealPrice : (item.price || 0))
    .filter(p => p > 0);
  const lowestPrice = validPrices.length > 0 ? Math.min(...validPrices) : 0;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(6px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'var(--card-bg, #ffffff)',
          color: 'var(--text-bold, #1e293b)',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '1100px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          border: '1px solid var(--border, #e2e8f0)',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid var(--border, #e2e8f0)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'var(--bg, #f8fafc)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              backgroundColor: 'rgba(16, 185, 129, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#10b981'
            }}>
              <ArrowLeftRight size={20} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: 'var(--text-bold)' }}>
                Side-by-Side Product & Price Comparison
              </h2>
              <p style={{ margin: '2px 0 0', fontSize: '13px', color: 'var(--text, #64748b)' }}>
                Comparing <strong>{compareList.length}</strong> {compareList.length === 1 ? 'item' : 'items'} across shops • Lowest price is highlighted
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {compareList.length > 0 && (
              <button
                onClick={onClearAll}
                className="btn-secondary"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 12px',
                  fontSize: '12px',
                  color: '#ef4444',
                  borderColor: 'rgba(239, 68, 68, 0.3)'
                }}
              >
                <Trash2 size={14} /> Clear All
              </button>
            )}
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text, #64748b)',
                padding: '6px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              aria-label="Close modal"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div style={{ overflowX: 'auto', overflowY: 'auto', flex: 1, padding: '20px' }}>
          {compareList.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <ArrowLeftRight size={44} style={{ color: 'var(--text, #94a3b8)', marginBottom: '12px' }} />
              <h3 style={{ margin: '0 0 6px', fontSize: '17px', fontWeight: '700' }}>No Products in Comparison</h3>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--text)' }}>
                Click the &ldquo;Compare&rdquo; button on any product card to compare prices across different shops.
              </p>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${Math.max(compareList.length, 2)}, minmax(240px, 1fr))`,
              gap: '16px',
              minWidth: compareList.length > 2 ? `${compareList.length * 260}px` : 'auto'
            }}>
              {compareList.map((item, index) => {
                const itemPrice = typeof item.dealPrice === 'number' && item.dealPrice > 0 
                  ? item.dealPrice 
                  : (typeof item.price === 'number' ? item.price : 0);
                const isBestPrice = lowestPrice > 0 && Math.abs(itemPrice - lowestPrice) < 0.01;
                const priceDiff = itemPrice - lowestPrice;
                const retail = item.retailPrice || (itemPrice > 0 ? parseFloat((itemPrice * 1.4).toFixed(2)) : 0);
                const discount = retail > itemPrice ? Math.round(((retail - itemPrice) / retail) * 100) : 0;
                const cbPercent = item.cashbackValue || item.cashbackPercent || 10;
                const cbEarned = item.cashbackEarned || parseFloat(((itemPrice * cbPercent) / 100).toFixed(2));
                const netPrice = parseFloat((itemPrice - cbEarned).toFixed(2));

                return (
                  <div
                    key={item.id || index}
                    style={{
                      border: isBestPrice ? '2px solid #10b981' : '1px solid var(--border, #e2e8f0)',
                      borderRadius: '14px',
                      padding: '16px',
                      backgroundColor: isBestPrice ? 'rgba(16, 185, 129, 0.03)' : 'var(--card-bg, #ffffff)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '14px',
                      position: 'relative',
                      boxShadow: isBestPrice ? '0 8px 24px rgba(16, 185, 129, 0.15)' : '0 2px 8px rgba(0,0,0,0.04)'
                    }}
                  >
                    {/* Top Badges */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      {isBestPrice ? (
                        <span style={{
                          backgroundColor: '#10b981',
                          color: '#ffffff',
                          fontSize: '10px',
                          fontWeight: '800',
                          padding: '3px 10px',
                          borderRadius: '12px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          boxShadow: '0 2px 6px rgba(16, 185, 129, 0.4)'
                        }}>
                          🏆 Best Price
                        </span>
                      ) : (
                        <span style={{
                          backgroundColor: 'var(--bg, #f1f5f9)',
                          color: 'var(--text, #64748b)',
                          fontSize: '10px',
                          fontWeight: '700',
                          padding: '3px 8px',
                          borderRadius: '10px',
                          textTransform: 'uppercase'
                        }}>
                          Option #{index + 1}
                        </span>
                      )}

                      <button
                        onClick={() => onRemoveItem(item.id)}
                        title="Remove from comparison"
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: 'var(--text, #94a3b8)',
                          padding: '4px',
                          borderRadius: '6px'
                        }}
                      >
                        <X size={16} />
                      </button>
                    </div>

                    {/* Image Box */}
                    <div style={{
                      width: '100%',
                      height: '140px',
                      backgroundColor: '#ffffff',
                      borderRadius: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '10px',
                      border: '1px solid var(--border, #f1f5f9)'
                    }}>
                      <img
                        src={item.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300'}
                        alt={item.title || item.name}
                        style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                      />
                    </div>

                    {/* Shop Identity */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      backgroundColor: 'var(--bg, #f8fafc)',
                      border: '1px solid var(--border, #e2e8f0)'
                    }}>
                      <img
                        src={item.storeLogo || 'https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg'}
                        alt={item.platform || 'Shop'}
                        style={{ width: '22px', height: '22px', objectFit: 'contain', borderRadius: '4px' }}
                      />
                      <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-bold)' }}>
                        Sold by {item.platform || item.shopName || 'Partner Shop'}
                      </span>
                    </div>

                    {/* Product Name */}
                    <h3 style={{
                      margin: 0,
                      fontSize: '14px',
                      fontWeight: '700',
                      color: 'var(--text-bold)',
                      lineHeight: '1.4',
                      minHeight: '38px'
                    }}>
                      {item.title || item.name}
                    </h3>

                    {/* Price Comparison Card Row */}
                    <div style={{
                      padding: '12px',
                      borderRadius: '10px',
                      backgroundColor: isBestPrice ? 'rgba(16, 185, 129, 0.08)' : 'var(--bg, #f8fafc)',
                      border: isBestPrice ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid var(--border, #e2e8f0)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px'
                    }}>
                      <span style={{ fontSize: '11px', color: 'var(--text)', fontWeight: '600' }}>
                        Shop Price:
                      </span>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', flexWrap: 'wrap' }}>
                        <span style={{
                          fontSize: '22px',
                          fontWeight: '800',
                          color: isBestPrice ? '#10b981' : 'var(--text-bold)'
                        }}>
                          ₹{itemPrice.toFixed(2)}
                        </span>
                        {priceDiff > 0 && (
                          <span style={{ fontSize: '11px', color: '#ef4444', fontWeight: '700' }}>
                            (+₹{priceDiff.toFixed(2)} higher)
                          </span>
                        )}
                      </div>

                      {retail > itemPrice && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px' }}>
                          <span style={{ color: 'var(--text)', textDecoration: 'line-through' }}>
                            MRP: ₹{retail.toFixed(2)}
                          </span>
                          {discount > 0 && (
                            <span style={{ color: '#10b981', fontWeight: '700' }}>
                              ({discount}% OFF)
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Cashback Breakdown */}
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px',
                      fontSize: '12px',
                      borderTop: '1px dashed var(--border, #e2e8f0)',
                      borderBottom: '1px dashed var(--border, #e2e8f0)',
                      padding: '10px 0'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text)' }}>Cashback Rate:</span>
                        <span style={{ fontWeight: '700', color: '#10b981' }}>{cbPercent}%</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text)' }}>Cashback Earned:</span>
                        <span style={{ fontWeight: '700', color: '#10b981' }}>₹{cbEarned.toFixed(2)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2px' }}>
                        <span style={{ fontWeight: '700', color: 'var(--text-bold)' }}>Net Effective Cost:</span>
                        <span style={{ fontWeight: '800', color: isBestPrice ? '#10b981' : 'var(--text-bold)' }}>
                          ₹{netPrice.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Specifications & Variants */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text)' }}>Category:</span>
                        <span style={{ fontWeight: '600', textTransform: 'capitalize' }}>
                          {item.category || 'General'}
                        </span>
                      </div>
                      {item.brand && (
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--text)' }}>Brand:</span>
                          <span style={{ fontWeight: '600' }}>{item.brand}</span>
                        </div>
                      )}
                      {item.description && (
                        <div style={{ marginTop: '2px' }}>
                          <span style={{ color: 'var(--text)', display: 'block', marginBottom: '2px', fontSize: '11px' }}>
                            Variant / Details:
                          </span>
                          <p style={{
                            margin: 0,
                            fontSize: '11px',
                            color: 'var(--text-bold)',
                            lineHeight: '1.4',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                          }}>
                            {item.description}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Action Button */}
                    <div style={{ marginTop: 'auto', paddingTop: '10px' }}>
                      <button
                        onClick={() => {
                          onClose();
                          onGrabDeal(item);
                        }}
                        style={{
                          width: '100%',
                          padding: '11px 14px',
                          borderRadius: '8px',
                          fontWeight: '800',
                          fontSize: '13px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                          cursor: 'pointer',
                          border: 'none',
                          backgroundColor: isBestPrice ? '#10b981' : 'var(--primary, #ff4f2f)',
                          color: '#ffffff',
                          boxShadow: isBestPrice ? '0 4px 12px rgba(16, 185, 129, 0.3)' : '0 4px 12px rgba(255, 79, 47, 0.25)'
                        }}
                      >
                        <ShoppingBag size={15} />
                        {isBestPrice ? `Buy Best Deal (₹${itemPrice.toFixed(2)})` : `Shop at ${item.platform || 'Store'}`}
                        <ExternalLink size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer info note */}
        <div style={{
          padding: '12px 24px',
          borderTop: '1px solid var(--border, #e2e8f0)',
          backgroundColor: 'var(--bg, #f8fafc)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '12px',
          color: 'var(--text)'
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Sparkles size={14} style={{ color: '#10b981' }} />
            Prices and cashback are verified in real-time. Clicking Buy routes your visit through affiliate tracking.
          </span>
          <button
            onClick={onClose}
            className="btn-secondary"
            style={{ padding: '6px 14px', fontSize: '12px', fontWeight: '600' }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
