import React from 'react';
import { X } from 'lucide-react';

const FALLBACK_STORE_LOGOS = {
  amazon: 'https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg',
  flipkart: 'https://upload.wikimedia.org/wikipedia/commons/7/7a/Flipkart_logo.svg',
  myntra: 'https://upload.wikimedia.org/wikipedia/commons/b/bc/Myntra_Logo.png',
  nykaa: 'https://upload.wikimedia.org/wikipedia/commons/5/5b/Nykaa_Logo.svg',
  meesho: 'https://upload.wikimedia.org/wikipedia/commons/8/80/Meesho_Logo_Full.png',
  ajio: 'https://upload.wikimedia.org/wikipedia/commons/c/c9/Ajio_Logo.svg',
};

export default function PriceComparisonModal({
  isOpen,
  onClose,
  deal,
  onBuyAndEarn,
  onReferLink,
  storesData = []
}) {
  if (!isOpen || !deal) return null;

  const basePrice = typeof deal.dealPrice === 'number' && deal.dealPrice > 0 
    ? deal.dealPrice 
    : (typeof deal.price === 'number' && deal.price > 0 ? deal.price : (parseFloat(deal.dealPrice || deal.price || '0') || 0));

  const retailPrice = typeof deal.retailPrice === 'number' && deal.retailPrice > 0 
    ? deal.retailPrice 
    : (deal.price && deal.dealPrice && deal.price > deal.dealPrice ? deal.price : parseFloat((basePrice * 1.35).toFixed(2)));

  const getStoreLogo = (storeName) => {
    if (!storeName) return FALLBACK_STORE_LOGOS.amazon;
    const lower = storeName.toLowerCase().trim();
    const matched = storesData.find(s => s.name?.toLowerCase().trim() === lower || s.platform?.toLowerCase().trim() === lower);
    if (matched?.logo) return matched.logo;
    for (const [key, logoUrl] of Object.entries(FALLBACK_STORE_LOGOS)) {
      if (lower.includes(key)) return logoUrl;
    }
    return FALLBACK_STORE_LOGOS.amazon;
  };

  // Build comparisons list
  let comparisons = [];
  if (deal.comparisons && deal.comparisons.length > 0) {
    comparisons = deal.comparisons.map((comp, idx) => {
      const platformName = comp.platform || deal.platform || 'Amazon';
      const dPrice = typeof comp.dealPrice === 'number' && comp.dealPrice > 0 
        ? comp.dealPrice 
        : (typeof comp.listedPrice === 'number' && comp.listedPrice > 0 ? comp.listedPrice : (typeof comp.price === 'number' ? comp.price : basePrice));
      const rPrice = typeof comp.retailPrice === 'number' && comp.retailPrice > 0 
        ? comp.retailPrice 
        : (retailPrice > dPrice ? retailPrice : parseFloat((dPrice * 1.3).toFixed(2)));
      const cbPercent = comp.cashbackPercent || comp.cashbackValue || deal.cashbackValue || 20;
      const cbEarned = parseFloat(((dPrice * cbPercent) / 100).toFixed(2));
      return {
        platform: platformName,
        logo: comp.logo || getStoreLogo(platformName),
        dealPrice: dPrice,
        retailPrice: rPrice,
        cashbackPercent: cbPercent,
        cashbackEarned: cbEarned,
        link: comp.link || comp.affiliateUrl || deal.affiliateUrl || deal.link,
      };
    });
  } else {
    // Generate realistic cross-platform comparison as shown in user mock if only 1 exists
    const mainPlatform = deal.platform || 'Amazon';
    const storeList = [
      { name: mainPlatform, mult: 1.0, cb: deal.cashbackValue || 20 },
      { name: mainPlatform.toLowerCase() === 'nykaa' ? 'Flipkart' : 'Nykaa', mult: 1.25, cb: 20 },
      { name: mainPlatform.toLowerCase() === 'flipkart' ? 'Myntra' : 'Flipkart', mult: 1.35, cb: 20 },
      { name: 'Meesho', mult: 1.50, cb: 10 }
    ];

    comparisons = storeList.map(st => {
      const dPrice = parseFloat((basePrice * st.mult).toFixed(2));
      const rPrice = parseFloat((dPrice * 1.3).toFixed(2));
      const cbEarned = parseFloat(((dPrice * st.cb) / 100).toFixed(2));
      return {
        platform: st.name,
        logo: getStoreLogo(st.name),
        dealPrice: dPrice,
        retailPrice: rPrice,
        cashbackPercent: st.cb,
        cashbackEarned: cbEarned,
        link: deal.affiliateUrl || deal.link
      };
    });
  }

  // Sort strictly by dealPrice ascending so lowest price shop is first
  comparisons.sort((a, b) => a.dealPrice - b.dealPrice);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(4px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '12px',
        animation: 'fadeIn 0.2s ease-out'
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '430px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          overflow: 'hidden',
          fontFamily: 'inherit'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '14px 18px',
            borderBottom: '1px solid #f1f5f9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '18px', lineHeight: 1 }}>🔍</span>
            <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '800', color: '#0f172a' }}>
              Price Comparison
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#64748b',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Product Info Bar */}
        <div
          style={{
            padding: '12px 18px',
            borderBottom: '1px solid #f1f5f9',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            backgroundColor: '#fafafa'
          }}
        >
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '8px',
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '4px',
              flexShrink: 0
            }}
          >
            <img
              src={deal.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300'}
              alt={deal.title}
              style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300';
              }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', overflow: 'hidden' }}>
            <h4
              style={{
                margin: 0,
                fontSize: '14px',
                fontWeight: '800',
                color: '#0f172a',
                lineHeight: '1.3',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {deal.title || deal.name || 'Product'}
            </h4>
            <span style={{ fontSize: '11px', color: '#64748b' }}>
              Category: <strong style={{ color: '#0f172a', textTransform: 'capitalize' }}>{deal.category || 'Electronics'}</strong>
            </span>
          </div>
        </div>

        {/* Store Comparison Cards Scroll Container */}
        <div
          style={{
            padding: '16px 18px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            flex: 1
          }}
        >
          {comparisons.map((item, index) => {
            const isBestValue = index === 0;

            return (
              <div
                key={item.platform + index}
                style={{
                  position: 'relative',
                  border: isBestValue ? '2px solid #10b981' : '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '14px',
                  backgroundColor: '#ffffff',
                  marginTop: isBestValue ? '6px' : '0',
                  boxShadow: isBestValue ? '0 4px 14px rgba(16, 185, 129, 0.12)' : 'none'
                }}
              >
                {/* Best Value Badge sitting on border */}
                {isBestValue && (
                  <span
                    style={{
                      position: 'absolute',
                      top: '-11px',
                      left: '12px',
                      backgroundColor: '#10b981',
                      color: '#ffffff',
                      fontSize: '10px',
                      fontWeight: '800',
                      padding: '2px 10px',
                      borderRadius: '12px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      boxShadow: '0 2px 6px rgba(16, 185, 129, 0.3)'
                    }}
                  >
                    🏆 BEST VALUE
                  </span>
                )}

                {/* Top Section: Logo, MRP, Cashback, and Price */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '12px'
                  }}
                >
                  {/* Left: Logo & Pricing info */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div
                      style={{
                        width: '38px',
                        height: '28px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}
                    >
                      <img
                        src={item.logo}
                        alt={item.platform}
                        style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = FALLBACK_STORE_LOGOS.amazon;
                        }}
                      />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span
                        style={{
                          fontSize: '11px',
                          color: '#64748b',
                          textDecoration: 'line-through',
                          lineHeight: '1.2'
                        }}
                      >
                        ₹{item.retailPrice.toFixed(2)}
                      </span>
                      <span
                        style={{
                          fontSize: '12px',
                          color: isBestValue ? '#10b981' : '#0d9488',
                          fontWeight: '700',
                          lineHeight: '1.3'
                        }}
                      >
                        -{item.cashbackPercent}% (-₹{item.cashbackEarned.toFixed(2)})
                      </span>
                    </div>
                  </div>

                  {/* Right: Deal Price */}
                  <div>
                    <span
                      style={{
                        fontSize: '19px',
                        fontWeight: '800',
                        color: isBestValue ? '#10b981' : '#0f172a'
                      }}
                    >
                      ₹{item.dealPrice.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Action Buttons Row */}
                <div style={{ display: 'flex', gap: '10px' }}>
                  {/* Buy & Earn Button */}
                  <button
                    onClick={() => {
                      if (onBuyAndEarn) onBuyAndEarn(deal, item);
                    }}
                    style={{
                      flex: 1,
                      backgroundColor: isBestValue ? '#10b981' : '#ff4f2f',
                      color: '#ffffff',
                      border: 'none',
                      padding: '9px 0',
                      borderRadius: '8px',
                      fontWeight: '700',
                      fontSize: '13px',
                      cursor: 'pointer',
                      textAlign: 'center',
                      boxShadow: isBestValue ? '0 2px 8px rgba(16, 185, 129, 0.3)' : '0 2px 8px rgba(255, 79, 47, 0.25)',
                      transition: 'transform 0.1s'
                    }}
                  >
                    Buy & Earn
                  </button>

                  {/* Refer Link Button */}
                  <button
                    onClick={() => {
                      if (onReferLink) onReferLink(deal, item);
                    }}
                    style={{
                      flex: 1,
                      backgroundColor: '#ffffff',
                      color: '#0f172a',
                      border: '1px solid #cbd5e1',
                      padding: '9px 0',
                      borderRadius: '8px',
                      fontWeight: '700',
                      fontSize: '13px',
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'background 0.1s'
                    }}
                  >
                    Refer Link
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Close Button */}
        <div
          style={{
            padding: '12px 18px',
            borderTop: '1px solid #f1f5f9',
            backgroundColor: '#ffffff'
          }}
        >
          <button
            onClick={onClose}
            style={{
              width: '100%',
              padding: '11px 0',
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '10px',
              color: '#0f172a',
              fontWeight: '700',
              fontSize: '14px',
              cursor: 'pointer',
              textAlign: 'center'
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
