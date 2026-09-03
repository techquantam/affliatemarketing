import React, { useState, useMemo } from 'react';
import { ArrowLeft, Clock, Copy, Check, Info, ShieldAlert, Sparkles, ExternalLink, ShoppingBag, Search, X, MapPin, Phone } from 'lucide-react';
import TopDeals from './TopDeals';
import { openExternalUrl, getStoreUrl } from '../utils/openUrl';

export default function StoreDetail({ store, onBack, onAddNotification, deals, onGrabDeal, onShareDeal, currentUser, openAuthModal, compareList = [], onToggleCompare }) {
  const [copiedCouponId, setCopiedCouponId] = useState(null);
  const [activatingDealId, setActivatingDealId] = useState(null);
  const [storeProductSearch, setStoreProductSearch] = useState('');

  // Filter products for this specific store based on search input
  const filteredDeals = useMemo(() => {
    if (!deals) return [];
    if (!storeProductSearch.trim()) return deals;
    const query = storeProductSearch.toLowerCase().trim();
    return deals.filter(deal => {
      const title = (deal.title || deal.name || '').toLowerCase();
      const desc = (deal.description || '').toLowerCase();
      const cat = (deal.category || '').toLowerCase();
      const brand = (deal.brand || '').toLowerCase();
      const platform = (deal.platform || '').toLowerCase();
      return title.includes(query) || desc.includes(query) || cat.includes(query) || brand.includes(query) || platform.includes(query);
    });
  }, [deals, storeProductSearch]);

  const handleVisitStore = async () => {
    if (!currentUser) {
      onAddNotification('Please login or sign up first to earn cashback on your visit!', 'info');
      openAuthModal();
      return;
    }
    onAddNotification(`Opening ${store.name}... Cashback tracking activated!`, 'success');
    const targetUrl = store.affiliateUrl || store.link || getStoreUrl(store.name);
    await openExternalUrl(targetUrl);
  };

  const handleCopyCode = async (coupon) => {
    if (!currentUser) {
      onAddNotification('Please login or sign up first to use this coupon!', 'info');
      openAuthModal();
      return;
    }
    if (coupon.code) {
      try {
        await navigator.clipboard.writeText(coupon.code);
      } catch (e) {
        console.warn('Clipboard write failed', e);
      }
      setCopiedCouponId(coupon.id);
      onAddNotification(`Coupon "${coupon.code}" copied! Opening ${store.name}...`, 'success');
      
      const targetUrl = coupon.link || store.affiliateUrl || store.link || getStoreUrl(store.name);
      openExternalUrl(targetUrl);
      setTimeout(() => setCopiedCouponId(null), 1500);
    }
  };

  const handleActivateDeal = async (coupon) => {
    if (!currentUser) {
      onAddNotification('Please login or sign up first to activate this deal!', 'info');
      openAuthModal();
      return;
    }
    setActivatingDealId(coupon.id);
    onAddNotification(`Opening ${store.name}... Tracking active!`, 'success');
    
    const targetUrl = coupon.link || store.affiliateUrl || store.link || getStoreUrl(store.name);
    openExternalUrl(targetUrl);
    setTimeout(() => setActivatingDealId(null), 1500);
  };

  return (
    <div className="animate-fade" style={{ width: '100%' }}>
      {/* Sticky Back navigation header */}
      <div className="store-sticky-back-header">
        <button
          onClick={onBack}
          className="btn-secondary store-back-btn"
          aria-label="Back to All Stores"
        >
          <ArrowLeft size={16} /> Back to All Stores
        </button>
        {store && (
          <div className="store-sticky-back-info">
            {store.logo && (
              <img src={store.logo} alt={store.name} className="store-sticky-back-logo" />
            )}
            <span className="store-sticky-back-name">{store.name}</span>
          </div>
        )}
      </div>

      {/* Custom Shop Banner (if provided) */}
      {store.banner && (
        <div style={{
          width: '100%',
          height: '180px',
          borderRadius: '12px',
          overflow: 'hidden',
          marginBottom: '16px',
          border: '1px solid var(--border)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
        }}>
          <img src={store.banner} alt={`${store.name} Banner`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      )}

      {/* Store Detailed Banner */}
      <div className="store-detail-header" style={{ position: 'relative' }}>
        <div className="store-detail-logo-wrapper">
          <img src={store.logo} alt={store.name} className="store-detail-logo" />
        </div>
        <div className="store-detail-info" style={{ flex: 1 }}>
          <div className="store-detail-title-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h2 className="store-detail-name" style={{ margin: 0 }}>{store.name} Coupons & Deals</h2>
              <span className="store-detail-tag" style={{ display: 'inline-block', marginTop: '6px' }}>Up to {store.cashbackRate} Commission</span>
            </div>
            <button
              className="btn-primary"
              onClick={handleVisitStore}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                fontWeight: '700',
                fontSize: '14px',
                borderRadius: '8px'
              }}
            >
              <ShoppingBag size={16} /> Shop at {store.name} <ExternalLink size={14} />
            </button>
          </div>
          <p className="store-detail-desc" style={{ marginTop: '10px' }}>{store.description}</p>
          <div className="store-detail-meta-pills">
            {(store.address || store.location) && (
              <span className="store-detail-pill">
                <MapPin size={14} style={{ color: '#ef4444' }} /> {store.address || store.location}
              </span>
            )}
            {store.ownerPhone && (
              <span className="store-detail-pill">
                <Phone size={14} style={{ color: '#10b981' }} /> {store.ownerPhone}
              </span>
            )}
            <span className="store-detail-pill">
              <Clock size={14} /> Tracking: 24 - 48 Hours
            </span>
            <span className="store-detail-pill">
              <Sparkles size={14} style={{ color: 'var(--secondary)' }} /> Payout: Confirmed in 60 days
            </span>
          </div>
        </div>
      </div>

      {/* Store Level Products Search Bar */}
      <div className="store-products-search-container" style={{ margin: '18px 0 16px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          backgroundColor: 'var(--card-bg, #ffffff)',
          border: '1.5px solid var(--border)',
          borderRadius: '12px',
          padding: '10px 16px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          transition: 'all 0.2s ease'
        }}>
          <Search size={18} style={{ color: 'var(--primary, #ff4f2f)', flexShrink: 0 }} />
          <input
            type="text"
            value={storeProductSearch}
            onChange={(e) => setStoreProductSearch(e.target.value)}
            placeholder={`Search products in ${store.name} only...`}
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              backgroundColor: 'transparent',
              fontSize: '14px',
              color: 'var(--text-bold, #0f172a)'
            }}
          />
          {storeProductSearch && (
            <button
              type="button"
              onClick={() => setStoreProductSearch('')}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text, #64748b)',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                borderRadius: '50%'
              }}
              title="Clear search"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Grid: Coupons left, Sidebar right */}
      <div className="store-detail-grid">
        <div className="coupons-list">
          <h3
            className="section-title"
            style={{ fontSize: '20px', marginBottom: '8px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}
          >
            Active Coupons & Promotional Codes ({store.coupons ? store.coupons.length : 0})
          </h3>

          {store.coupons && store.coupons.map((coupon) => (
            <div key={coupon.id} className="coupon-card animate-fade">
              <div className="coupon-details">
                <span className={`coupon-type-badge ${coupon.code ? 'code' : 'deal'}`}>
                  {coupon.code ? 'Coupon Code' : 'Verified Deal'}
                </span>
                <h4 className="coupon-title">{coupon.title}</h4>
                <p className="coupon-desc">{coupon.description}</p>
                <div className="coupon-exp-row">
                  <span>Expires: {coupon.expiry}</span>
                  <span>•</span>
                  <span>Used 432 times today</span>
                </div>
              </div>

              <div className="coupon-action-box">
                {coupon.code ? (
                  <button
                    className={`coupon-code-button ${copiedCouponId === coupon.id ? 'copied' : ''}`}
                    onClick={() => handleCopyCode(coupon)}
                  >
                    {copiedCouponId === coupon.id ? (
                      <>
                        <Check size={16} /> Copied!
                      </>
                    ) : (
                      <>
                        <Copy size={16} /> {coupon.code}
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    className="btn-primary"
                    onClick={() => handleActivateDeal(coupon)}
                    style={{
                      padding: '8px 18px',
                      fontSize: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    {activatingDealId === coupon.id ? 'Opening Store...' : 'Activate Deal'}
                    <ExternalLink size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Sidebar Guidelines */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="store-sidebar-card">
            <h3>How tracking works?</h3>
            <ul className="sidebar-terms-list">
              <li>Always start your session by clicking out from LIO MART.</li>
              <li>Only add items to your cart <strong>after</strong> clicking out.</li>
              <li>Do not use external browser coupon plug-ins or extensions.</li>
              <li>Ensure your browser has cookies enabled and AdBlock turned off.</li>
              <li>Complete the transaction in a single session within 2 hours.</li>
            </ul>
          </div>

          <div
            className="store-sidebar-card"
            style={{
              background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.05) 0%, rgba(239, 68, 68, 0.02) 100%)',
              borderColor: 'rgba(239, 68, 68, 0.2)',
            }}
          >
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444' }}>
              <ShieldAlert size={20} /> Important Terms
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text)', lineHeight: 1.5 }}>
              Commissions are not paid on bulk purchases, wholesale transactions, or cancelled/returned orders.
              Tracking may take up to 48 hours to confirm with the merchant.
            </p>
          </div>
        </div>
      </div>
      
      {/* Related Products/Deals of this Store */}
      <div style={{ marginTop: '36px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', padding: '0 8px', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <h3 className="section-title" style={{ fontSize: '22px', margin: 0 }}>
              {storeProductSearch ? `Search Results in ${store.name}` : `Top Products on ${store.name}`}
            </h3>
            {storeProductSearch && (
              <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text)' }}>
                Showing products matching &ldquo;<strong>{storeProductSearch}</strong>&rdquo;
              </p>
            )}
          </div>
          <span style={{ fontSize: '12px', fontWeight: 600, padding: '4px 10px', borderRadius: '12px', backgroundColor: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-bold)' }}>
            {filteredDeals.length} {filteredDeals.length === 1 ? 'Product' : 'Products'}
          </span>
        </div>

        {filteredDeals.length > 0 ? (
          <TopDeals
            deals={filteredDeals}
            onGrabDeal={onGrabDeal}
            onShareDeal={onShareDeal}
            compareList={compareList}
            onToggleCompare={onToggleCompare}
          />
        ) : (
          <div style={{
            textAlign: 'center',
            padding: '36px 16px',
            backgroundColor: 'var(--card-bg, #ffffff)',
            borderRadius: '12px',
            border: '1px dashed var(--border)',
            margin: '0 8px'
          }}>
            <p style={{ margin: '0 0 10px', fontSize: '15px', fontWeight: 600, color: 'var(--text-bold)' }}>
              No products found {storeProductSearch ? `matching "${storeProductSearch}"` : `for ${store.name}`}.
            </p>
            {storeProductSearch && (
              <button
                className="btn-secondary"
                onClick={() => setStoreProductSearch('')}
                style={{ padding: '6px 16px', fontSize: '13px' }}
              >
                Clear Search
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
