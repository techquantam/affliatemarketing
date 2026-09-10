import React, { useState, useEffect } from 'react';
import { X, Check, Search, Layers, Tag, ShoppingBag, Shirt, Smartphone, Heart, ShoppingCart, Plane } from 'lucide-react';
import Header from './components/Header';
import Hero from './components/Hero';
import CategoryGrid from './components/CategoryGrid';
import StoreGrid from './components/StoreGrid';
import TopDeals from './components/TopDeals';
import HowItWorks from './components/HowItWorks';
import Testimonials from './components/Testimonials';
import StoreDetail from './components/StoreDetail';
import Dashboard from './components/Dashboard';
import AuthModal from './components/AuthModal';
import Notification from './components/Notification';
import Footer from './components/Footer';
import CheckoutModal from './components/CheckoutModal';
import AdminLogin from './components/AdminLogin';
import AdminPanel from './components/AdminPanel';
import MobileApp from './components/MobileApp';
import CompareModal from './components/CompareModal';
import CompareTray from './components/CompareTray';
import PriceComparisonModal from './components/PriceComparisonModal';
import ConvertLinkModal from './components/ConvertLinkModal';
import ErrorBoundary from './components/ErrorBoundary';
import PrivacyPolicy from './components/PrivacyPolicy';
import TermsAndConditions from './components/TermsAndConditions';
import Signup from './pages/Signup';
import SearchBar from './components/SearchBar';
import CategoryIcon from './components/CategoryIcon';
import { apiTracking, apiWithdrawals, apiProducts, apiDeals, apiSharedLinks, apiSharedCommissions, apiStores, apiBanners, apiAffiliate, apiCategories, apiWallet, apiNotifications, apiUsers } from './services/api';
import { isKycApproved, isKycRejected, getUnifiedKycStatus } from './components/KycPage';
import { openExternalUrl, getStoreUrl, getProductPlatformUrl } from './utils/openUrl';
import { getCleanedUrlIdentifier } from './utils/urlMatcher';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './index.css';
import './App.css';
import './Admin.css';

const AdBanners = ({ banners }) => {
  if (!banners || banners.length === 0) return null;
  return (
    <div className="promo-ad-banners-container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px', margin: '20px 0' }}>
      {banners.map(b => (
        <a 
          key={b.id} 
          href={b.targetUrl && b.targetUrl !== '#' ? b.targetUrl : 'javascript:void(0)'} 
          onClick={(e) => {
            if (!b.targetUrl || b.targetUrl === '#') {
              e.preventDefault();
            } else {
              e.preventDefault();
              openExternalUrl(b.targetUrl);
            }
          }}
          className="promo-ad-banner-link"
          style={{ 
            display: 'block', 
            borderRadius: '12px', 
            overflow: 'hidden', 
            border: '1px solid var(--border)', 
            boxShadow: 'var(--shadow-sm)',
            transition: 'transform 0.2s',
            cursor: 'pointer'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <img 
            src={b.logo} 
            alt={b.title || 'Advertisement'} 
            style={{ width: '100%', height: '140px', objectFit: 'cover', display: 'block' }} 
          />
        </a>
      ))}
    </div>
  );
};

export const isBlacklistedBrand = (str) => {
  if (!str || typeof str !== 'string') return false;
  const s = str.toLowerCase().replace(/[\s_\-]+/g, '');
  return s.includes('shopsy') || s.includes('shopysy') || s.includes('smartmart');
};

const DEFAULT_STORES = [
  {
    id: 'amazon',
    name: 'Amazon',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg',
    cashbackRate: '10%',
    category: 'all',
    description: 'Shop millions of products across every category.',
    isPopular: true,
    link: 'https://www.amazon.in',
  },
  {
    id: 'flipkart',
    name: 'Flipkart',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/7/7a/Flipkart_logo.svg',
    cashbackRate: '8%',
    category: 'all',
    description: 'Discover daily deals on electronics, fashion and more.',
    isPopular: true,
    link: 'https://www.flipkart.com',
  },
  {
    id: 'myntra',
    name: 'Myntra',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/b/bc/Myntra_Logo.png',
    cashbackRate: '12%',
    category: 'fashion',
    description: 'Fashion, footwear and lifestyle at great prices.',
    isPopular: false,
    link: 'https://www.myntra.com',
  },
  {
    id: 'ajio',
    name: 'Ajio',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/c/c9/Ajio_Logo.svg',
    cashbackRate: '15%',
    category: 'fashion',
    description: 'Trendy fashion brands with exclusive cashback offers.',
    isPopular: false,
    link: 'https://www.ajio.com',
  },
  {
    id: 'nykaa',
    name: 'Nykaa Beauty',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/5/5b/Nykaa_Logo.svg',
    cashbackRate: '7%',
    category: 'health',
    description: 'Beauty, wellness and personal care with cashback.',
    isPopular: false,
    link: 'https://www.nykaa.com',
  },
  {
    id: 'makemytrip',
    name: 'MakeMyTrip',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/f/fb/MakeMyTrip_Logo.svg',
    cashbackRate: '9%',
    category: 'travel',
    description: 'Book flights, hotels and holiday packages at the best price.',
    isPopular: false,
    link: 'https://www.makemytrip.com',
  },
];

const DEFAULT_PRODUCTS = [
  {
    id: 'default-p1',
    name: 'Apple iPhone 15 (128 GB)',
    price: 69999,
    cashbackValue: 10,
    category: 'electronics',
    platform: 'Amazon',
    status: 'active',
    image: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=400',
    affiliateUrl: 'https://www.amazon.in/s?k=Apple+iPhone+15'
  },
  {
    id: 'default-p2',
    name: 'Sony WH-1000XM5 Wireless Headphones',
    price: 26990,
    cashbackValue: 12,
    category: 'electronics',
    platform: 'Amazon',
    status: 'active',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400',
    affiliateUrl: 'https://www.amazon.in/s?k=Sony+WH-1000XM5'
  },
  {
    id: 'default-p3',
    name: 'Nike Air Max 270 Sneakers',
    price: 11495,
    cashbackValue: 15,
    category: 'fashion',
    platform: 'Myntra',
    status: 'active',
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400',
    affiliateUrl: 'https://www.myntra.com/nike-air-max-270'
  },
  {
    id: 'default-p4',
    name: 'Samsung Galaxy S24 Ultra 5G',
    price: 119999,
    cashbackValue: 8.5,
    category: 'electronics',
    platform: 'Flipkart',
    status: 'active',
    image: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=400',
    affiliateUrl: 'https://www.flipkart.com/search?q=Samsung+Galaxy+S24+Ultra'
  },
  {
    id: 'default-p5',
    name: 'Levi\'s Men\'s Slim Fit Jeans',
    price: 2499,
    cashbackValue: 15,
    category: 'fashion',
    platform: 'Ajio',
    status: 'active',
    image: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=400',
    affiliateUrl: 'https://www.ajio.com/search/?text=Levis+Slim+Fit+Jeans'
  },
  {
    id: 'default-p6',
    name: 'Maybelline New York Superstay Lipstick',
    price: 549,
    cashbackValue: 10,
    category: 'health',
    platform: 'Nykaa Beauty',
    status: 'active',
    image: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=400',
    affiliateUrl: 'https://www.nykaa.com/search/result/?q=Maybelline+Superstay'
  },
  {
    id: 'default-p7',
    name: 'Dell XPS 13 Core Ultra Laptop',
    price: 139990,
    cashbackValue: 8,
    category: 'electronics',
    platform: 'Amazon',
    status: 'active',
    image: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=400',
    affiliateUrl: 'https://www.amazon.in/s?k=Dell+XPS+13'
  },
  {
    id: 'default-p8',
    name: 'Puma Men Running Shoes',
    price: 3299,
    cashbackValue: 12,
    category: 'fashion',
    platform: 'Myntra',
    status: 'active',
    image: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=400',
    affiliateUrl: 'https://www.myntra.com/puma-running-shoes'
  }
];

const ShareLanding = ({ products = [], deals = [], storesData = [], currentUser, openAuthModal, onNotification, setView }) => {
  const getShareIdFromLocation = () => {
    const href = window.location.href || '';
    const match = href.match(/\/share\/([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      return match[1].split(/[?&#/]/)[0];
    }
    const hash = window.location.hash || '';
    if (hash.includes('/share/')) {
      const parts = hash.split('/share/')[1];
      return parts ? parts.split(/[?&#/]/)[0] : '';
    }
    const pathname = window.location.pathname || '';
    if (pathname.includes('/share/')) {
      const parts = pathname.split('/share/')[1];
      return parts ? parts.split(/[?&#/]/)[0] : '';
    }
    return '';
  };

  const [landingData, setLandingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    const shareId = getShareIdFromLocation();
    if (!shareId) {
      setLoading(false);
      setErrorMsg('Invalid referral link.');
      return;
    }

    const fetchShareData = async () => {
      try {
        setLoading(true);
        setErrorMsg(null);
        let link = null;

        // 1. Direct ID lookup
        try {
          link = await apiSharedLinks.getById(shareId);
        } catch (e) {
          // Fallback to getAll
        }

        // 2. Fallback to getAll() if direct lookup fails
        if (!link || !link.id) {
          const links = await apiSharedLinks.getAll().catch(() => []);
          link = (links || []).find(l => 
            l.id === shareId || 
            (l.shortUrl && (l.shortUrl.endsWith(shareId) || l.shortUrl.includes(`/share/${shareId}`)))
          );
        }

        if (link && link.id) {
          setLandingData(link);
          localStorage.setItem('shareId', link.id);
          // Increment click count silently
          apiSharedLinks.incrementClicks(link.id).catch(e => console.warn('Increment click failed', e));
        } else {
          setErrorMsg('Referral link expired or not found.');
        }
      } catch (err) {
        console.error('Error loading share details:', err);
        setErrorMsg('Failed to load referral details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchShareData();
  }, []);

  // Match corresponding deal or product from catalog for extra attributes
  const matchedDeal = React.useMemo(() => {
    if (!landingData?.productName) return null;
    const lName = landingData.productName.toLowerCase().trim();
    return (deals || []).find(d => {
      const dTitle = (d.title || '').toLowerCase().trim();
      const dName = (d.name || '').toLowerCase().trim();
      return dTitle === lName || dName === lName || (dTitle && (lName.includes(dTitle) || dTitle.includes(lName))) || (dName && (lName.includes(dName) || dName.includes(lName)));
    });
  }, [deals, landingData]);

  const matchedProduct = React.useMemo(() => {
    if (!landingData?.productName) return null;
    const lName = landingData.productName.toLowerCase().trim();
    return (products || []).find(p => {
      const pName = (p.name || '').toLowerCase().trim();
      const pTitle = (p.title || '').toLowerCase().trim();
      return pName === lName || pTitle === lName || (pName && (lName.includes(pName) || pName.includes(lName))) || (pTitle && (lName.includes(pTitle) || pTitle.includes(lName)));
    });
  }, [products, landingData]);

  const storeName = landingData?.store || matchedDeal?.platform || matchedProduct?.platform || 'Store';
  
  const matchedStore = React.useMemo(() => {
    return (storesData || []).find(s => 
      s.name && s.name.toLowerCase().trim() === storeName.toLowerCase().trim()
    );
  }, [storesData, storeName]);

  const storeLogo = matchedStore?.logo || matchedDeal?.logo;

  const productName = landingData?.productName || matchedDeal?.title || matchedDeal?.name || 'Special Cashback Deal';

  const productImage = landingData?.productImage || 
                       matchedDeal?.image || 
                       matchedProduct?.image || 
                       'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400';

  const dealPrice = typeof landingData?.dealPrice === 'number' && landingData.dealPrice > 0 
    ? landingData.dealPrice 
    : (typeof matchedDeal?.dealPrice === 'number' && matchedDeal.dealPrice > 0 
        ? matchedDeal.dealPrice 
        : (typeof matchedDeal?.price === 'number' ? matchedDeal.price : (matchedProduct?.price || 499)));

  const originalPrice = typeof landingData?.originalPrice === 'number' && landingData.originalPrice > 0
    ? landingData.originalPrice
    : (typeof matchedDeal?.retailPrice === 'number' && matchedDeal.retailPrice > 0
        ? matchedDeal.retailPrice
        : Math.round(dealPrice * 1.35));

  const cashbackPercent = typeof landingData?.cashbackPercent === 'number' && landingData.cashbackPercent > 0
    ? landingData.cashbackPercent
    : (matchedDeal?.cashbackValue || matchedDeal?.cashbackPercent || matchedProduct?.cashbackValue || 10);

  const cashbackAmount = parseFloat(((dealPrice * cashbackPercent) / 100).toFixed(2));
  const discountPercent = originalPrice > dealPrice ? Math.round(((originalPrice - dealPrice) / originalPrice) * 100) : 0;

  const handleGrabDeal = () => {
    const buyerId = currentUser?.id || 'guest';
    const shareId = landingData?.id;
    const productId = matchedDeal?.id || matchedProduct?.id || (landingData ? `prod-${landingData.id}` : 'prod');

    if (currentUser) {
      apiAffiliate.createClick(buyerId, shareId, productId).catch(e => console.error("Failed to log affiliate click", e));
    }

    const targetUrl = landingData?.productUrl || matchedDeal?.affiliateUrl || matchedDeal?.link || getStoreUrl(storeName);
    openExternalUrl(targetUrl);
  };

  if (loading) {
    return (
      <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', minHeight: '60vh' }}>
        <div style={{ maxWidth: '440px', width: '100%', backgroundColor: 'var(--card-bg, #ffffff)', borderRadius: '16px', padding: '40px 24px', textAlign: 'center', border: '1px solid var(--border, #e5e7eb)', boxShadow: '0 10px 25px rgba(0,0,0,0.06)' }}>
          <div style={{ width: '40px', height: '40px', border: '3px solid var(--border, #e5e7eb)', borderTopColor: 'var(--primary, #ff4d00)', borderRadius: '50%', margin: '0 auto 16px', animation: 'spin 1s linear infinite' }} />
          <h3 style={{ margin: '0 0 6px 0', fontSize: '18px', fontWeight: '700', color: 'var(--text-bold, #111827)' }}>Finding Your Deal...</h3>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted, #6b7280)' }}>Loading exclusive referral details and store cashback.</p>
        </div>
      </div>
    );
  }

  if (errorMsg || !landingData) {
    return (
      <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', minHeight: '60vh' }}>
        <div style={{ maxWidth: '440px', width: '100%', backgroundColor: 'var(--card-bg, #ffffff)', borderRadius: '16px', padding: '36px 24px', textAlign: 'center', border: '1px solid var(--border, #e5e7eb)', boxShadow: '0 10px 25px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: '44px', marginBottom: '14px' }}>🔍</div>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '19px', fontWeight: '700', color: 'var(--text-bold, #111827)' }}>Deal Not Available</h3>
          <p style={{ margin: '0 0 24px 0', fontSize: '14px', color: 'var(--text-muted, #6b7280)', lineHeight: '1.5' }}>
            {errorMsg || 'This referral link may have expired or is no longer active.'}
          </p>
          <button
            className="btn-primary"
            onClick={() => { if (setView) setView('home'); else window.location.hash = '#/'; }}
            style={{ width: '100%', padding: '13px', fontSize: '14px', fontWeight: '700', borderRadius: '10px' }}
          >
            Explore Top Deals on LIO MART
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 16px 60px', minHeight: '70vh', backgroundColor: 'var(--bg)' }}>
      <div
        style={{
          maxWidth: '460px',
          width: '100%',
          backgroundColor: 'var(--card-bg, #ffffff)',
          borderRadius: '18px',
          padding: '24px',
          textAlign: 'center',
          border: '1px solid var(--border, #e5e7eb)',
          boxShadow: '0 15px 35px rgba(0,0,0,0.07)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Referrer Header Badge */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: 'rgba(255, 77, 0, 0.08)',
            border: '1px solid rgba(255, 77, 0, 0.2)',
            borderRadius: '20px',
            padding: '5px 14px',
            marginBottom: '18px',
            fontSize: '12.5px',
            fontWeight: '600',
            color: 'var(--primary, #ff4d00)'
          }}
        >
          <span>🎁</span>
          <span>Shared by <strong>{landingData.userName || 'a friend'}</strong></span>
        </div>

        {/* Product Image Box */}
        <div
          style={{
            width: '100%',
            height: '220px',
            borderRadius: '12px',
            backgroundColor: '#f8fafc',
            border: '1px solid var(--border, #e5e7eb)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            marginBottom: '18px',
            position: 'relative'
          }}
        >
          <img
            src={productImage}
            alt={productName}
            style={{ maxWidth: '90%', maxHeight: '90%', objectFit: 'contain' }}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400';
            }}
          />

          {/* Store Badge Over Image */}
          <div
            style={{
              position: 'absolute',
              top: '10px',
              left: '10px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              border: '1px solid #e2e8f0',
              padding: '3px 8px',
              borderRadius: '6px',
              boxShadow: '0 2px 5px rgba(0,0,0,0.06)'
            }}
          >
            {storeLogo && (
              <img src={storeLogo} alt={storeName} style={{ height: '14px', maxWidth: '36px', objectFit: 'contain' }} />
            )}
            <span style={{ fontSize: '11px', fontWeight: '700', color: '#0f172a' }}>{storeName}</span>
          </div>

          {/* Cashback Badge */}
          <div
            style={{
              position: 'absolute',
              top: '10px',
              right: '10px',
              backgroundColor: '#10b981',
              color: '#ffffff',
              padding: '3px 8px',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: '800',
              letterSpacing: '0.4px',
              boxShadow: '0 2px 6px rgba(16, 185, 129, 0.35)'
            }}
          >
            {cashbackPercent}% CASHBACK
          </div>
        </div>

        {/* Product Title */}
        <h2
          style={{
            fontSize: '18px',
            fontWeight: '800',
            color: 'var(--text-bold, #111827)',
            margin: '0 0 12px 0',
            lineHeight: '1.4',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textAlign: 'left'
          }}
        >
          {productName}
        </h2>

        {/* Price & Savings Row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: '10px',
            marginBottom: '16px',
            textAlign: 'left'
          }}
        >
          <span style={{ fontSize: '26px', fontWeight: '800', color: '#10b981' }}>
            ₹{dealPrice}
          </span>
          {originalPrice > dealPrice && (
            <>
              <span style={{ fontSize: '15px', color: 'var(--text-muted, #94a3b8)', textDecoration: 'line-through' }}>
                ₹{originalPrice}
              </span>
              {discountPercent > 0 && (
                <span style={{ fontSize: '12px', fontWeight: '700', color: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                  {discountPercent}% OFF
                </span>
              )}
            </>
          )}
        </div>

        {/* Cashback Highlight Box */}
        <div
          style={{
            padding: '12px 14px',
            backgroundColor: 'rgba(16, 185, 129, 0.08)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            borderRadius: '10px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            textAlign: 'left'
          }}
        >
          <div style={{ fontSize: '20px' }}>💰</div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: '700', color: '#047857' }}>
              Earn ₹{cashbackAmount} Cashback!
            </div>
            <div style={{ fontSize: '11.5px', color: 'var(--text-muted, #4b5563)', marginTop: '2px' }}>
              Buy from {storeName} through this link and cashback will be added to your Liomart wallet.
            </div>
          </div>
        </div>

        {/* Action Button */}
        <button
          className="btn-primary"
          onClick={handleGrabDeal}
          style={{
            width: '100%',
            padding: '15px',
            fontSize: '16px',
            fontWeight: '800',
            borderRadius: '12px',
            marginBottom: '10px',
            boxShadow: '0 4px 14px rgba(255, 77, 0, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          <span>Shop on {storeName} & Earn Cashback</span>
          <span>→</span>
        </button>

        {/* Login Prompt if not logged in */}
        {!currentUser && (
          <p style={{ margin: '8px 0 16px', fontSize: '12px', color: 'var(--text-muted, #6b7280)' }}>
            Already have an account?{' '}
            <button
              type="button"
              onClick={() => openAuthModal && openAuthModal('login')}
              style={{ background: 'none', border: 'none', color: 'var(--primary, #ff4d00)', fontWeight: '700', cursor: 'pointer', padding: 0 }}
            >
              Log In
            </button>
            {' '}or{' '}
            <button
              type="button"
              onClick={() => openAuthModal && openAuthModal('signup')}
              style={{ background: 'none', border: 'none', color: 'var(--primary, #ff4d00)', fontWeight: '700', cursor: 'pointer', padding: 0 }}
            >
              Sign Up
            </button>
            {' '}to track wallet cashback.
          </p>
        )}

        {/* Back button */}
        <button
          onClick={() => { if (setView) setView('home'); else window.location.hash = '#/'; }}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-muted, #6b7280)',
            fontSize: '13px',
            fontWeight: '600',
            cursor: 'pointer',
            padding: '6px'
          }}
        >
          ← Browse More Deals on LIO MART
        </button>
      </div>
    </div>
  );
};
export default function App() {
  // Add Admitad ownership verification meta tag dynamically
  useEffect(() => {
    let meta = document.querySelector('meta[name="verify-admitad"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'verify-admitad';
      meta.content = 'fdcf363535';
      document.head.appendChild(meta);
    }
  }, []);

  const checkIsAdmin = () => {
    try {
      if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('admin_session') === 'active') return true;
      if (typeof localStorage !== 'undefined') {
        if (localStorage.getItem('admin_session')) return true;
        if (localStorage.getItem('is_admin') === 'true') return true;
        const user = localStorage.getItem('user_session');
        if (user) {
          const parsed = JSON.parse(user);
          if (parsed?.role === 'admin' || parsed?.role === 'super_admin' || parsed?.isAdmin) return true;
        }
      }
    } catch (e) {}
    return false;
  };

  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(checkIsAdmin);

  const [currentUser, setCurrentUser] = useState(() => {
    const storedUser = localStorage.getItem('user_session');
    try {
      return storedUser ? JSON.parse(storedUser) : null;
    } catch (e) {
      console.error('Failed to parse user session:', e);
      return null;
    }
  });

  const getInitialView = () => {
    const hash = window.location.hash || '';
    const path = window.location.pathname || '';
    const href = window.location.href || '';

    // Check share-landing in hash, path, or href (supports /#/share, /#/#/share, /share)
    if (hash.includes('/share/') || path.includes('/share/') || href.includes('/share/')) {
      return 'share-landing';
    }

    if (hash === '#/admin/login' || path === '/admin/login') {
      return checkIsAdmin() ? 'admin-panel' : 'admin-login';
    }
    if (hash.startsWith('#/admin') || path.startsWith('/admin')) {
      return checkIsAdmin() ? 'admin-panel' : 'admin-login';
    }
    if (hash === '#/dashboard' || path === '/dashboard') {
      const hasSession = typeof localStorage !== 'undefined' && Boolean(localStorage.getItem('user_session'));
      return hasSession ? 'dashboard' : 'home';
    }
    if (hash === '#/store' || path === '/store') {
      return 'store';
    }
    if (hash === '#/privacy-policy' || hash === '#/privacy' || hash === '#privacy-policy' || path === '/privacy-policy' || path === '/privacy') {
      return 'privacy-policy';
    }
    if (hash === '#/terms-and-conditions' || hash === '#/terms-conditions' || hash === '#terms-conditions' || hash === '#/terms' || hash === '#terms-and-conditions' || hash === '#/terms-of-service' || hash === '#terms' || path === '/terms-and-conditions' || path === '/terms-conditions' || path === '/terms' || path === '/terms-of-service') {
      return 'terms-and-conditions';
    }
    if (hash === '#/signup' || hash === '#/register' || hash === '#signup' || path === '/signup' || path === '/register') {
      return 'signup';
    }

    return 'home';
  };

  const [currentView, setViewRaw] = useState(getInitialView);
  const [dashboardTab, setDashboardTab] = useState('overview');
  const [selectedStoreId, setSelectedStoreId] = useState(null);
  const [activeCategory, setActiveCategory] = useState('all');
  const [homeSearchQuery, setHomeSearchQuery] = useState('');
  const [searchFilter, setSearchFilter] = useState('all');
  const [theme, setTheme] = useState('light');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authInitialTab, setAuthInitialTab] = useState('login');
  const [authErrorMessage, setAuthErrorMessage] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [userNotifications, setUserNotifications] = useState([]);

  const handleOpenAuthModal = (tab) => {
    const hasReferral = Boolean(localStorage.getItem('lio_referral_code'));
    const defaultTab = hasReferral ? 'signup' : 'login';
    const target = tab || defaultTab;
    setAuthInitialTab(target === 'register' || target === 'join' ? 'signup' : target);
    setAuthErrorMessage('');
    setIsAuthModalOpen(true);
  };

  useEffect(() => {
    try {
      // Check query params in both window.location.search and window.location.hash (SPA support)
      let searchStr = window.location.search;
      if (!searchStr && window.location.hash && window.location.hash.includes('?')) {
        searchStr = window.location.hash.substring(window.location.hash.indexOf('?'));
      }
      const params = new URLSearchParams(searchStr);
      const refParam = params.get('ref') || params.get('referral') || params.get('referralCode');
      if (refParam) {
        localStorage.setItem('lio_referral_code', refParam.trim().toUpperCase());
      }

      const pathClean = (window.location.pathname || '').toLowerCase();
      const hashClean = (window.location.hash || '').toLowerCase();
      const isSignupPath = pathClean === '/signup' || pathClean === '/join' || pathClean === '/register' ||
        pathClean.startsWith('/signup') || pathClean.startsWith('/join') || pathClean.startsWith('/register') ||
        hashClean.includes('/signup') || hashClean.includes('/join') || hashClean.includes('/register') ||
        params.get('signup') === 'true' || params.get('register') === 'true';

      if ((refParam || isSignupPath) && !localStorage.getItem('user_session')) {
        setAuthInitialTab('signup');
        setIsAuthModalOpen(true);
      }

      // Clean up any double-hash in URL like /#/#/share/ to canonical /#/share/
      if (window.location.hash && (window.location.hash.includes('/#/share/') || window.location.hash.startsWith('#/#'))) {
        const fixedHash = window.location.hash.replace(/#+\/?#*\/?share\//, '#/share/');
        try {
          window.history.replaceState(null, '', window.location.pathname + window.location.search + fixedHash);
        } catch (e) {}
      }
    } catch (e) {
      console.warn('Error processing referral URL:', e);
    }
  }, []);

  // Simulator and state sync variables
  const isCapacitorNative = typeof window !== 'undefined' && window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform();
  const [isMobileView, setIsMobileView] = useState(isCapacitorNative || window.innerWidth < 768);
  const [isSimulatorMode, setIsSimulatorMode] = useState(false); // Kept for dev but hidden
  const [trackedOrders, setTrackedOrders] = useState([]);
  const [withdrawRequests, setWithdrawRequests] = useState([]);
  const [products, setProducts] = useState(() => {
    try {
      const stored = localStorage.getItem('lio_custom_products');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const merged = [...parsed];
          DEFAULT_PRODUCTS.forEach(dp => {
            if (!merged.some(p => p.id === dp.id || (
              p.name && dp.name && 
              p.name.toLowerCase() === dp.name.toLowerCase() &&
              (p.platform || p.sourcePlatform || 'Amazon').trim().toLowerCase() === (dp.platform || dp.sourcePlatform || 'Amazon').trim().toLowerCase()
            ))) {
              merged.push(dp);
            }
          });
          return merged;
        }
      }
    } catch (e) {
      console.warn('Error reading lio_custom_products:', e);
    }
    return DEFAULT_PRODUCTS;
  });
  const [dealsData, setDealsData] = useState([]);
  const [storesData, setStoresData] = useState(DEFAULT_STORES);
  const [bannersData, setBannersData] = useState([]);
  const [categoriesData, setCategoriesData] = useState([]);
  const [activeComparisonDeal, setActiveComparisonDeal] = useState(null);
  const [sharingDealId, setSharingDealId] = useState(null);

  // Multi-Product Side-by-Side Comparison states
  const [compareList, setCompareList] = useState(() => {
    try {
      const stored = localStorage.getItem('lio_compare_list');
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  });
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [isHomeHeaderScrolled, setIsHomeHeaderScrolled] = useState(false);

  useEffect(() => {
    const handleWindowScroll = () => {
      const scrollY = window.scrollY || document.documentElement.scrollTop || 0;
      setIsHomeHeaderScrolled(scrollY > 50);
    };
    window.addEventListener('scroll', handleWindowScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleWindowScroll);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('lio_compare_list', JSON.stringify(compareList));
    } catch (e) {
      // ignore
    }
  }, [compareList]);

  const handleToggleCompare = (deal) => {
    if (!deal) return;
    const exists = compareList.some(item => item.id === deal.id);
    if (exists) {
      setCompareList(prev => prev.filter(item => item.id !== deal.id));
      addNotification(`Removed "${deal.title || deal.name}" from comparison.`, 'info');
    } else {
      if (compareList.length >= 4) {
        addNotification('You can compare up to 4 items at a time. Please remove an item first.', 'error');
        setIsCompareModalOpen(true);
        return;
      }
      setCompareList(prev => [...prev, deal]);
      addNotification(`Added "${deal.title || deal.name}" (${deal.platform || 'Shop'}) to comparison!`, 'success');
    }
  };

  const handleRemoveCompareItem = (id) => {
    setCompareList(prev => prev.filter(item => item.id !== id));
  };

  const handleClearCompare = () => {
    setCompareList([]);
    addNotification('Comparison list cleared.', 'info');
  };
  
  // Checkout states
  const [checkoutDeal, setCheckoutDeal] = useState(null);
  const [checkoutStore, setCheckoutStore] = useState(null);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [checkoutItem, setCheckoutItem] = useState(null);
  const [checkoutStep, setCheckoutStep] = useState(1); // 1: Details, 2: Success
  const [checkoutStoreMeta, setCheckoutStoreMeta] = useState(null);

  // Share Modal states
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [generatedShareData, setGeneratedShareData] = useState(null);
  const [shareModalUrl, setShareModalUrl] = useState(null);
  const [shareModalTitle, setShareModalTitle] = useState(null);

  // Convert Link Modal state
  const [isConvertLinkModalOpen, setIsConvertLinkModalOpen] = useState(false);

  // 1. Fetch static catalog data function
  const loadCatalogData = React.useCallback(async () => {
    try {
      let localCustomProducts = [];
      try {
        const stored = localStorage.getItem('lio_custom_products');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) localCustomProducts = parsed;
        }
      } catch (e) {}

      const [productsData, dbDeals, storesRes, activeBanners, categoriesRes] = await Promise.all([
        apiProducts.getAll().catch(e => { console.warn('Products failed:', e); return null; }),
        apiDeals.getAll().catch(e => { console.warn('Deals failed:', e); return null; }),
        apiStores.getAll().catch(e => { console.warn('Stores failed:', e); return null; }),
        apiBanners.getActive().catch(e => { console.warn('Banners failed:', e); return null; }),
        apiCategories.getAll().catch(e => { console.warn('Categories failed:', e); return null; })
      ]);

      const remoteProds = (productsData && Array.isArray(productsData)) ? [...productsData].reverse() : [];
      
      // Merge order: 1. Local Custom Products (Top priority) -> 2. Remote Backend Products -> 3. Default Products
      const allMerged = [...localCustomProducts];

      remoteProds.forEach(rp => {
        if (!allMerged.some(p => (p.id && p.id === rp.id) || (
          p.name && rp.name && 
          p.name.toLowerCase() === rp.name.toLowerCase() &&
          (p.platform || p.sourcePlatform || 'Amazon').trim().toLowerCase() === (rp.platform || rp.sourcePlatform || 'Amazon').trim().toLowerCase()
        ))) {
          allMerged.push(rp);
        }
      });

      DEFAULT_PRODUCTS.forEach(dp => {
        if (!allMerged.some(p => (p.id && p.id === dp.id) || (
          p.name && dp.name && 
          p.name.toLowerCase() === dp.name.toLowerCase() &&
          (p.platform || p.sourcePlatform || 'Amazon').trim().toLowerCase() === (dp.platform || dp.sourcePlatform || 'Amazon').trim().toLowerCase()
        ))) {
          allMerged.push(dp);
        }
      });

      // Filter out any blacklisted branding (Shopsy/Shopysy/Smart Mart)
      const cleanedProducts = allMerged.filter(p => 
        !isBlacklistedBrand(p.name) && 
        !isBlacklistedBrand(p.title) && 
        !isBlacklistedBrand(p.platform) && 
        !isBlacklistedBrand(p.sourcePlatform)
      );
      setProducts(cleanedProducts);

      if (dbDeals && Array.isArray(dbDeals) && dbDeals.length > 0) {
        const cleanedDeals = dbDeals.filter(d => !isBlacklistedBrand(d.name) && !isBlacklistedBrand(d.platform));
        setDealsData(cleanedDeals);
      }

      // Merge Stores: 1. Remote Backend Stores (DB truth, latest first) -> 2. Local Custom Stores -> 3. Default Stores
      let localCustomStores = [];
      try {
        const storedStores = localStorage.getItem('lio_custom_stores');
        if (storedStores) {
          const parsed = JSON.parse(storedStores);
          if (Array.isArray(parsed)) localCustomStores = parsed;
        }
      } catch (e) {}

      const remoteStores = (storesRes && Array.isArray(storesRes)) ? [...storesRes] : [];
      // Remote stores from DB come first (latest first)
      const allMergedStores = [...remoteStores];

      localCustomStores.forEach(ls => {
        const lsId = ls.id || ls._id;
        if (!allMergedStores.some(s => (s.id && s.id === lsId) || (s._id && s._id === lsId) || (
          s.name && ls.name && s.name.trim().toLowerCase() === ls.name.trim().toLowerCase()
        ))) {
          allMergedStores.push(ls);
        }
      });

      DEFAULT_STORES.forEach(ds => {
        const dsId = ds.id || ds._id;
        if (!allMergedStores.some(s => (s.id && s.id === dsId) || (
          s.name && ds.name && s.name.trim().toLowerCase() === ds.name.trim().toLowerCase()
        ))) {
          allMergedStores.push(ds);
        }
      });

      const cleanedStores = allMergedStores.filter(s => !isBlacklistedBrand(s.name) && !isBlacklistedBrand(s.description));
      setStoresData(cleanedStores);
      if (activeBanners && Array.isArray(activeBanners) && activeBanners.length > 0) {
        setBannersData(activeBanners);
      }
      if (categoriesRes && Array.isArray(categoriesRes) && categoriesRes.length > 0) {
        setCategoriesData(categoriesRes);
      }
    } catch (err) {
      console.error('Failed to load catalog data:', err);
    }
  }, []);

  // Fetch catalog on mount, view changes, and window focus
  useEffect(() => {
    loadCatalogData();
  }, [loadCatalogData, currentView, isSimulatorMode]);

  useEffect(() => {
    const handleFocus = () => loadCatalogData();
    const handleStoreCreated = (e) => {
      if (e?.detail) {
        const newStore = e.detail;
        const sid = newStore.id || newStore._id;
        setStoresData((prev) => {
          const arr = Array.isArray(prev) ? prev : [];
          const exists = arr.some((s) => (s.id && s.id === sid) || (s._id && s._id === sid));
          return exists ? arr.map((s) => ((s.id && s.id === sid) || (s._id && s._id === sid) ? newStore : s)) : [newStore, ...arr];
        });
      }
      loadCatalogData();
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('store:created', handleStoreCreated);
    window.addEventListener('store:updated', handleStoreCreated);
    window.addEventListener('store:deleted', handleFocus);
    window.addEventListener('stores:cache_cleared', handleFocus);

    let bc;
    if (typeof BroadcastChannel !== 'undefined') {
      bc = new BroadcastChannel('affiliate_admin_sync');
      bc.onmessage = (event) => {
        if (event.data?.type === 'STORE_CREATED' && event.data?.data) {
          handleStoreCreated({ detail: event.data.data });
        } else if (event.data?.type === 'STORE_UPDATED' || event.data?.type === 'STORE_DELETED') {
          loadCatalogData();
        }
      };
    }

    // Periodic refresh every 30 seconds for live admin update sync
    const pollInterval = setInterval(() => {
      loadCatalogData();
    }, 30000);

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('store:created', handleStoreCreated);
      window.removeEventListener('store:updated', handleStoreCreated);
      window.removeEventListener('store:deleted', handleFocus);
      window.removeEventListener('stores:cache_cleared', handleFocus);
      clearInterval(pollInterval);
      if (bc) bc.close();
    };
  }, [loadCatalogData]);

  // 2. Fetch user-specific transactional data when user logs in/out
  useEffect(() => {
    const loadUserData = async () => {
      if (!currentUser) {
        setTrackedOrders([]);
        setWithdrawRequests([]);
        return;
      }
      try {
        const [tracking, withdrawals] = await Promise.all([
          apiTracking.getAll().catch(e => { console.warn('Tracking failed:', e); return []; }),
          apiWithdrawals.getAll().catch(e => { console.warn('Withdrawals failed:', e); return []; })
        ]);
        setTrackedOrders(tracking || []);
        setWithdrawRequests(withdrawals || []);
      } catch (err) {
        console.error('Failed to load user transaction data:', err);
      }
    };
    loadUserData();
  }, [currentUser]);

  // Keep currentUser wallet updated
  useEffect(() => {
    if (!currentUser?.id) return;
    let isCancelled = false;
    
    const fetchUserWallet = async () => {
      if (isCancelled || !localStorage.getItem('user_session')) return;
      try {
        const walletData = await apiWallet.getBalance(currentUser.id);
        if (isCancelled || !localStorage.getItem('user_session')) return;
        if (walletData) {
          setCurrentUser(prev => {
            if (!prev || isCancelled || !localStorage.getItem('user_session')) return null;
            // Only update if changed to avoid infinite loops
            if (
              prev.wallet &&
              prev.wallet.confirmed === walletData.approvedBalance &&
              prev.wallet.pending === walletData.pendingBalance
            ) {
              return prev;
            }
            const updated = {
              ...prev,
              wallet: {
                ...prev.wallet,
                confirmed: walletData.approvedBalance || 0,
                pending: walletData.pendingBalance || 0,
                referral: prev.wallet?.referral || 0
              }
            };
            // Save updated session to localStorage only if user is still logged in
            if (localStorage.getItem('user_session')) {
              localStorage.setItem('user_session', JSON.stringify(updated));
            }
            return updated;
          });
        }
      } catch (err) {
        console.warn('Failed to sync wallet balance:', err);
      }
    };

    fetchUserWallet();
    
    // Refresh user wallet balance every 10 seconds when user is active
    const interval = setInterval(fetchUserWallet, 10000);
    return () => {
      isCancelled = true;
      clearInterval(interval);
    };
  }, [currentUser?.id, currentView]);

  // Listen for blocked user event from API client / middleware
  useEffect(() => {
    const handleBlocked = (e) => {
      const msg = e?.detail?.message || 'Your account has been blocked by Admin';
      handleLogout(true);
      setAuthInitialTab('login');
      setAuthErrorMessage(msg);
      setIsAuthModalOpen(true);
      addNotification(msg, 'error');
    };
    window.addEventListener('auth:blocked', handleBlocked);
    return () => window.removeEventListener('auth:blocked', handleBlocked);
  }, []);

  // Sync notifications for logged-in user
  const fetchUserNotifications = async () => {
    if (!currentUser?.id) return;
    try {
      const res = await apiNotifications.getByUser(currentUser.id);
      setUserNotifications(res || []);
    } catch (e) {
      console.warn('Failed to fetch user notifications:', e);
    }
  };

  useEffect(() => {
    if (!currentUser?.id) {
      setUserNotifications([]);
      return;
    }
    fetchUserNotifications();
    const interval = setInterval(fetchUserNotifications, 30000);
    return () => clearInterval(interval);
  }, [currentUser?.id]);

  const handleMarkAllNotificationsRead = async () => {
    if (!currentUser?.id) return;
    try {
      await apiNotifications.markAllAsRead(currentUser.id);
      fetchUserNotifications();
    } catch (e) {
      console.warn('Failed to mark all notifications read:', e);
    }
  };

  const handleMarkNotificationRead = async (id) => {
    try {
      await apiNotifications.markAsRead(id);
      fetchUserNotifications();
    } catch (e) {
      console.warn('Failed to mark notification read:', e);
    }
  };

  // 3. Handle window resizing & environment checks
  useEffect(() => {
    const handleResize = () => setIsMobileView(isCapacitorNative || window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    handleResize(); // Initial call
    return () => window.removeEventListener('resize', handleResize);
  }, [isCapacitorNative]);

  const handleAppWithdrawalRequest = async (newReq) => {
    try {
      const added = await apiWithdrawals.create(newReq);
      setWithdrawRequests(prev => [added, ...prev]);
      // Update local wallet view for user
      if (currentUser) {
        setCurrentUser(prev => ({
          ...prev,
          wallet: {
            ...prev.wallet,
            confirmed: Math.max(0, (prev.wallet?.confirmed || 0) - newReq.amount)
          }
        }));
      }
      return added;
    } catch (err) {
      console.error('Failed to request app withdrawal:', err);
      throw err;
    }
  };

  // Sync routes when logged in
  useEffect(() => {
    const path = window.location.pathname;
    const hash = window.location.hash;
    if (path.startsWith('/admin') || hash.startsWith('#/admin')) {
      const hasAdmin = isAdminLoggedIn || checkIsAdmin();
      if (hasAdmin) {
        setViewRaw('admin-panel');
        if (path === '/admin/login' || path === '/admin') {
          try {
            window.history.replaceState(null, '', '/admin/dashboard');
          } catch (e) {}
        }
      } else {
        setViewRaw('admin-login');
        if (path !== '/admin/login') {
          try {
            window.history.replaceState(null, '', '/admin/login');
          } catch (e) {}
        }
      }
    }
  }, [isAdminLoggedIn, currentView]);

  // Sync navigation popstate and hashchange
  useEffect(() => {
    const handlePopState = () => {
      setViewRaw(getInitialView());
    };
    window.addEventListener('popstate', handlePopState);
    window.addEventListener('hashchange', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', handlePopState);
    };
  }, [isAdminLoggedIn]);

  const setView = (viewName) => {
    if (viewName === 'admin-login') {
      const hasAdmin = isAdminLoggedIn || checkIsAdmin();
      if (hasAdmin) {
        viewName = 'admin-panel';
      }
    }
    setViewRaw(viewName);
    
    let newPath = '/';
    let newHash = '';
    if (viewName === 'admin-login') {
      newPath = '/admin/login';
      newHash = '#/admin/login';
    } else if (viewName === 'admin-panel') {
      newPath = '/admin/dashboard';
      newHash = '#/admin/dashboard';
    } else if (viewName === 'home') {
      newPath = '/';
      newHash = '';
    } else if (viewName === 'dashboard') {
      newPath = '/dashboard';
      newHash = '#/dashboard';
    } else if (viewName === 'store') {
      newPath = '/store';
      newHash = '#/store';
    } else if (viewName === 'privacy-policy') {
      newPath = '/privacy-policy';
      newHash = '#/privacy-policy';
    } else if (viewName === 'terms-and-conditions' || viewName === 'terms' || viewName === 'terms-conditions') {
      newPath = '/terms-conditions';
      newHash = '#/terms-conditions';
    } else if (viewName === 'signup' || viewName === 'register') {
      newPath = '/signup';
      newHash = '#/signup';
    }
    
    if (window.location.hash !== newHash) {
      window.location.hash = newHash;
    }
    if (window.location.pathname !== newPath) {
      window.history.pushState(null, '', newPath);
    }
  };

  // Apply theme class to document element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const addNotification = (message, type = 'success') => {
    const id = Date.now() + Math.random();
    setNotifications((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 5000);
  };

  const removeNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const handleStoreSelect = (id) => {
    setSelectedStoreId(id);
    setView('store');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCtaRedirect = () => {
    // Smooth scroll down to popular stores
    const target = document.querySelector('.stores-grid');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleGrabProductDeal = (deal) => {
    if (!currentUser) {
      addNotification('Please login or sign up first to grab deals!', 'info');
      setIsAuthModalOpen(true);
      return;
    }
    setActiveComparisonDeal(deal);
  };

  const handleShareDeal = async (deal) => {
    if (!currentUser) {
      addNotification('Please login to share deals.', 'error');
      setIsAuthModalOpen(true);
      return;
    }

    try {
      // Create a tracked share for attribution (doesn't have to be the shared URL)
      const res = await apiAffiliate.createShare(currentUser.id, deal.id).catch(e => { console.warn('createShare failed', e); return null; });

      // Prefer the merchant/affiliate URL if available; fallback to created share landing
      const affiliateUrl = deal.affiliateUrl || deal.link || (deal.comparisons && deal.comparisons[0] && (deal.comparisons[0].link || deal.comparisons[0].affiliateUrl)) || (res && res.shareId ? `${window.location.origin}/?shareId=${res.shareId}` : window.location.href);

      // Save share id locally for attribution on later clicks
      if (res && res.shareId) localStorage.setItem('shareId', res.shareId);

      const title = deal.title || deal.name || 'Check this deal';
      const text = `${title} — Grab this deal now!`;

      // Use native share where available (opens Instagram/Facebook on mobile)
      if (navigator.share) {
        try {
          await navigator.share({ title, text, url: affiliateUrl });
          addNotification('Shared via device share sheet.', 'success');
          return;
        } catch (e) {
          console.warn('navigator.share failed', e);
        }
      }

      // Open a small share modal with explicit options so user can pick network
      setShareModalUrl(affiliateUrl);
      setShareModalTitle(title);
      setIsShareModalOpen(true);
    } catch (err) {
      console.error('Failed to generate share link:', err);
      addNotification('Failed to generate share link.', 'error');
    }
  };

  const executeGrabDealTracked = (dealItem, storeItem) => {
    if (!currentUser) {
      setActiveComparisonDeal(null);
      addNotification('Please login or sign up first to grab deals!', 'info');
      setIsAuthModalOpen(true);
      return;
    }
    setActiveComparisonDeal(null);
    addNotification(`Opening ${storeItem?.platform || 'Store'}... Tracking active!`, 'success');
    
    // Background async click tracking (0ms UI latency)
    try {
      const shareId = localStorage.getItem('shareId');
      const buyerId = currentUser.id;
      apiAffiliate.createClick(buyerId, shareId, dealItem.id).catch(e => console.warn('Affiliate click log skipped', e));
    } catch (e) {
      console.warn('Tracking skipped', e);
    }
    
    const link = storeItem?.link || dealItem?.affiliateUrl || dealItem?.link || getProductPlatformUrl(dealItem, storeItem?.platform);
    openExternalUrl(link);
  };

  const finalizeCheckout = (deal, store) => {
    setCheckoutDeal(deal);
    setCheckoutStore(store);
    setIsCheckoutModalOpen(true);
    setCheckoutStep(1);
  };

  const handleReferLink = async (deal, item) => {
    if (!currentUser) {
      addNotification('Please login to generate a referral link', 'error');
      setIsAuthModalOpen(true);
      return;
    }
    
    try {
      const generated = await apiSharedLinks.create({
        userId: currentUser.id,
        userName: currentUser.name,
        productName: deal.title || deal.name,
        store: item.platform,
        productUrl: item.link || deal.affiliateUrl || deal.link || 'https://google.com',
        userSharePercent: 100,
        productImage: deal.image || deal.thumbnail,
        dealPrice: item.dealPrice || deal.dealPrice || deal.price,
        originalPrice: item.retailPrice || deal.retailPrice,
        cashbackPercent: item.cashbackPercent || deal.cashbackValue || 10
      });

      const cleanOrigin = window.location.origin.replace(/\/+$/, '');
      let cleanUrl = generated.shortUrl;
      if (cleanUrl) {
        cleanUrl = cleanUrl
          .replace(/^https?:\/\/[^/]+/, cleanOrigin)
          .replace(/\/#+\/share\//, '/#/share/');
        if (!cleanUrl.includes('/#/share/')) {
          cleanUrl = `${cleanOrigin}/#/share/${generated.id}`;
        }
      } else {
        cleanUrl = `${cleanOrigin}/#/share/${generated.id}`;
      }
      generated.shortUrl = cleanUrl;

      setGeneratedShareData(generated);
      setIsShareModalOpen(true);
    } catch (err) {
      console.error('Failed to generate referral link:', err);
      addNotification('Failed to generate referral link.', 'error');
    }
  };

  const handleLogin = (userProfile) => {
    setCurrentUser(userProfile);
    localStorage.setItem('user_session', JSON.stringify(userProfile));
    addNotification(`Logged in successfully as ${userProfile.name}! Welcome back.`, 'success');
  };

  const handleUpdateUser = (updatedUser) => {
    if (!updatedUser) return;
    // CRITICAL: If user is logged out, NEVER resurrect session or write to localStorage!
    const activeSession = typeof localStorage !== 'undefined' ? localStorage.getItem('user_session') : null;
    if (!activeSession) return;

    setCurrentUser(prev => {
      if (!prev || !localStorage.getItem('user_session')) return null;
      const merged = { ...prev, ...updatedUser };
      localStorage.setItem('user_session', JSON.stringify(merged));
      return merged;
    });
  };

  const handleLogout = (silent = false) => {
    try {
      localStorage.removeItem('user_session');
      localStorage.removeItem('admin_session');
      localStorage.removeItem('is_admin');
      sessionStorage.removeItem('admin_session');
      sessionStorage.clear();
    } catch (e) {}
    setCurrentUser(null);
    setIsAdminLoggedIn(false);
    setUserNotifications([]);
    setTrackedOrders([]);
    setWithdrawRequests([]);
    if (window.history && window.history.pushState) {
      window.history.pushState(null, '', '/');
    }
    setView('home');
    if (!silent) {
      addNotification('Logged out successfully. See you again!', 'info');
    }
  };

  // --- REAL-TIME LIVE USER PROFILE & KYC/PAYMENT STATUS SYNC ---
  const fetchFreshProfile = React.useCallback(async (silent = true) => {
    if (!currentUser?.id || !localStorage.getItem('user_session')) return;
    try {
      let fresh = await apiUsers.getById(currentUser.id);
      if (!localStorage.getItem('user_session')) return;
      try {
        const freshKyc = await apiUsers.getKycStatus(currentUser.id);
        if (!localStorage.getItem('user_session')) return;
        if (freshKyc) {
          fresh = {
            ...fresh,
            ...freshKyc,
            kycStatus: freshKyc.status || freshKyc.kycStatus || fresh?.kycStatus,
            kyc_status: freshKyc.status || freshKyc.kyc_status || fresh?.kyc_status,
            is_verified: freshKyc.is_verified ?? fresh?.is_verified,
            is_kyc_verified: freshKyc.is_kyc_verified ?? fresh?.is_kyc_verified
          };
        }
      } catch (e) {}

      if (fresh) {
        if (fresh.status === 'blocked' || fresh.isBlocked || fresh.is_blocked === 1) {
          handleLogout(true);
          setAuthInitialTab('login');
          setAuthErrorMessage('Your account is blocked by admin');
          setIsAuthModalOpen(true);
          addNotification('Your account is blocked by admin', 'error');
          return;
        }
        if (fresh.id) {
          // Detect KYC status transition in real-time
          const wasApproved = isKycApproved(currentUser);
          const nowApproved = isKycApproved(fresh);
          const wasRejected = isKycRejected(currentUser);
          const nowRejected = isKycRejected(fresh);

          if (!wasApproved && nowApproved) {
            addNotification('🎉 Great news! Your E-KYC verification has been APPROVED by Admin! Withdrawals are now active.', 'success');
            try {
              const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
              const osc = audioCtx.createOscillator();
              const gain = audioCtx.createGain();
              osc.connect(gain);
              gain.connect(audioCtx.destination);
              osc.type = 'sine';
              osc.frequency.setValueAtTime(523.25, audioCtx.currentTime);
              osc.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.1);
              osc.frequency.setValueAtTime(783.99, audioCtx.currentTime + 0.2);
              gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
              gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
              osc.start();
              osc.stop(audioCtx.currentTime + 0.4);
            } catch (e) {}
          } else if (!wasRejected && nowRejected) {
            addNotification(`⚠️ Your E-KYC was rejected: ${fresh.admin_remark || fresh.kycRemarks || 'Please check and re-upload.'}`, 'error');
          }

          // Detect Payment details status transition in real-time
          if (currentUser.paymentDetailsStatus && fresh.paymentDetailsStatus && currentUser.paymentDetailsStatus !== fresh.paymentDetailsStatus) {
            if (fresh.paymentDetailsStatus === 'approved') {
              addNotification('✅ Great news! Your Bank / UPI payout details have been APPROVED by Admin!', 'success');
              try {
                const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc.connect(gain);
                gain.connect(audioCtx.destination);
                osc.type = 'sine';
                osc.frequency.setValueAtTime(587.33, audioCtx.currentTime);
                osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.15);
                gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35);
                osc.start();
                osc.stop(audioCtx.currentTime + 0.35);
              } catch (e) {}
            } else if (fresh.paymentDetailsStatus === 'rejected') {
              addNotification(`⚠️ Your Bank/UPI details were rejected: ${fresh.paymentDetailsRemarks || 'Please edit and re-submit.'}`, 'error');
            }
          }

          if (!localStorage.getItem('user_session')) return;
          handleUpdateUser(fresh);
          if (!silent) {
            addNotification('Profile & verification status refreshed.', 'info');
          }
        }
      }
    } catch (err) {
      if (err.status === 403 || String(err.message).toLowerCase().includes('blocked')) {
        handleLogout();
        addNotification('Your account has been blocked by Admin', 'error');
      } else {
        console.warn('Failed to refresh user profile:', err);
      }
    }
  }, [currentUser, handleLogout, addNotification, handleUpdateUser]);

  useEffect(() => {
    if (!currentUser?.id) return;
    fetchFreshProfile(true);

    // 1. Live Poll every 5 seconds for rapid status updates
    const blockPoll = setInterval(() => fetchFreshProfile(true), 5000);

    // 2. Cross-tab & in-tab instant sync
    const handleKycEvent = () => fetchFreshProfile(true);
    const handlePayEvent = () => fetchFreshProfile(true);
    window.addEventListener('user:kyc_updated', handleKycEvent);
    window.addEventListener('user:payment_updated', handlePayEvent);

    let bc = null;
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        bc = new BroadcastChannel('affiliate_admin_sync');
        bc.onmessage = (event) => {
          if (
            event.data?.type === 'USER_KYC_UPDATED' ||
            event.data?.type === 'USER_PAYMENT_UPDATED' ||
            event.data?.type === 'USER_STATUS_UPDATED' ||
            event.data?.type === 'USER_BLOCKED'
          ) {
            if (!event.data.userId || event.data.userId === currentUser.id) {
              if (event.data.status === 'blocked' || event.data.is_blocked === 1 || event.data.type === 'USER_BLOCKED') {
                handleLogout(true);
                setAuthInitialTab('login');
                setAuthErrorMessage('Your account is blocked by admin');
                setIsAuthModalOpen(true);
                addNotification('Your account is blocked by admin', 'error');
              } else {
                fetchFreshProfile(true);
              }
            }
          }
        };
      }
    } catch (e) {}

    // 3. Tab visibility / window focus revalidation
    const handleFocus = () => fetchFreshProfile(true);
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchFreshProfile(true);
      }
    };
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(blockPoll);
      window.removeEventListener('user:kyc_updated', handleKycEvent);
      window.removeEventListener('user:payment_updated', handlePayEvent);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
      if (bc) bc.close();
    };
  }, [currentUser?.id, fetchFreshProfile]);

  // Filter stores by category & active status for public display
  const activeStores = React.useMemo(() => {
    return storesData.filter((s) => {
      if (!s) return false;
      if (s.isActive === false || s.is_active === false || s.isActive === 0 || s.is_active === 0) return false;
      const st = String(s.status || '').toLowerCase().trim();
      if (st === 'inactive' || st === 'disabled' || st === '0' || st === 'false' || st === 'blocked') return false;
      return true;
    });
  }, [storesData]);

  const filteredStores = React.useMemo(() => {
    if (!activeCategory || activeCategory === 'all' || activeCategory === '') return activeStores;
    const norm = (s) => (s || '').toLowerCase().replace(/[\s_\-]+/g, '');
    const activeNorm = norm(activeCategory);
    return activeStores.filter((s) => {
      if (!s.category || s.category === 'all') return true;
      const sNorm = norm(s.category);
      return sNorm === activeNorm || sNorm.includes(activeNorm) || activeNorm.includes(sNorm);
    });
  }, [activeCategory, activeStores]);

  const selectedStore = storesData.find((s) => (s.id && String(s.id) === String(selectedStoreId)) || (s._id && String(s._id) === String(selectedStoreId)));

  // Normalization helper for grouping products by name across shops
  const normalizeProdTitle = (str) => {
    if (!str || typeof str !== 'string') return '';
    return str.toLowerCase().replace(/[-_.,()/\\]+/g, ' ').replace(/\s+/g, ' ').trim();
  };

  // 1. Raw store-specific products for individual shop pages (strictly isolated per shop)
  const storeSpecificDeals = React.useMemo(() => {
    if (!products || products.length === 0) return [];

    const storesLogoMap = storesData.reduce((acc, store) => { 
      if (store && store.name) {
        acc[store.name.trim().toLowerCase()] = store.logo; 
      }
      return acc; 
    }, {});

    return products
      .filter(p => p && (
        p.status === 'active' || 
        p.status === 'ACTIVE' || 
        p.isActive === true || 
        p.status === undefined || 
        p.status === null
      ))
      .map(p => {
        const platform = p.platform || p.sourcePlatform || 'Amazon';
        const cleanPlatform = platform.trim().toLowerCase();
        const matchedStore = storesData.find(s => {
          const cleanName = (s.name || '').trim().toLowerCase();
          return cleanPlatform === cleanName || cleanPlatform.includes(cleanName) || cleanName.includes(cleanPlatform);
        });
        const storeLogo = matchedStore ? matchedStore.logo : (storesLogoMap[cleanPlatform] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300');
        const prodName = p.name || p.title || 'Product';
        const dealPrice = typeof p.price === 'number' && p.price > 0 
          ? (p.discountPrice && p.discountPrice < p.price ? p.discountPrice : p.price)
          : (parseFloat(p.discountPrice || p.dealPrice || p.price || '999') || 999);
        const retailPrice = typeof p.retailPrice === 'number' && p.retailPrice > 0 
          ? p.retailPrice 
          : (p.price && p.discountPrice && p.price > p.discountPrice ? p.price : parseFloat((dealPrice * 1.4).toFixed(2)));
        const cashbackVal = p.cashbackValue || p.commissionPercentage || 10;
        const cashbackEarned = parseFloat(((dealPrice * cashbackVal) / 100).toFixed(2));
        const productImage = p.image || (p.images && p.images[0]) || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300';

        return {
          id: p.id || `prod-${Date.now()}-${Math.random()}`,
          title: prodName,
          name: prodName,
          platform: platform,
          storeId: matchedStore ? (matchedStore.id || matchedStore._id) : (p.storeId || null),
          price: dealPrice,
          retailPrice,
          dealPrice,
          cashbackEarned,
          cashbackValue: cashbackVal,
          category: (p.category || 'retail').toLowerCase(),
          storeLogo,
          affiliateUrl: p.affiliateUrl || getProductPlatformUrl(p, platform),
          image: productImage,
          isProduct: true
        };
      });
  }, [products, storesData]);

  // 2. Format deals for comparison display (lowest price first, highlighted badge, ascending order)
  const dynamicDeals = React.useMemo(() => {
    let combinedDeals = [];
    
    const storesLogoMap = storesData.reduce((acc, store) => { 
      if (store && store.name) {
        acc[store.name.trim().toLowerCase()] = store.logo; 
      }
      return acc; 
    }, {});

    // Group active products by normalized title across all shops
    if (products && products.length > 0) {
      const activeProducts = products.filter(p => p && (
        p.status === 'active' || 
        p.status === 'ACTIVE' || 
        p.isActive === true || 
        p.status === undefined || 
        p.status === null
      ));

      const groupedByTitle = new Map();
      activeProducts.forEach(p => {
        const prodName = p.name || p.title || 'Product';
        const normKey = normalizeProdTitle(prodName);
        if (!groupedByTitle.has(normKey)) {
          groupedByTitle.set(normKey, []);
        }
        groupedByTitle.get(normKey).push(p);
      });

      const productDeals = [];
      groupedByTitle.forEach((items, normKey) => {
        // Collect shop entries selling this product
        const comparisons = items.map(p => {
          const platform = p.platform || p.sourcePlatform || 'Amazon';
          const cleanPlatform = platform.trim().toLowerCase();
          const matchedStore = storesData.find(s => {
            const cleanName = (s.name || '').trim().toLowerCase();
            return cleanPlatform === cleanName || cleanPlatform.includes(cleanName) || cleanName.includes(cleanPlatform);
          });
          const storeLogo = matchedStore ? matchedStore.logo : (storesLogoMap[cleanPlatform] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300');
          const dealPrice = typeof p.price === 'number' && p.price > 0 
            ? (p.discountPrice && p.discountPrice < p.price ? p.discountPrice : p.price)
            : (parseFloat(p.discountPrice || p.dealPrice || p.price || '999') || 999);
          const retailPrice = typeof p.retailPrice === 'number' && p.retailPrice > 0 
            ? p.retailPrice 
            : (p.price && p.discountPrice && p.price > p.discountPrice ? p.price : parseFloat((dealPrice * 1.4).toFixed(2)));
          const cashbackVal = p.cashbackValue || p.commissionPercentage || 10;
          const cashbackEarned = parseFloat(((dealPrice * cashbackVal) / 100).toFixed(2));
          const effectivePrice = parseFloat((dealPrice - cashbackEarned).toFixed(2));

          return {
            productId: p.id,
            platform,
            storeId: matchedStore ? (matchedStore.id || matchedStore._id) : (p.storeId || null),
            logo: storeLogo,
            dealPrice,
            price: dealPrice,
            listedPrice: dealPrice,
            retailPrice,
            cashbackPercent: cashbackVal,
            cashbackEarned,
            effectivePrice,
            link: p.affiliateUrl || getProductPlatformUrl(p, platform),
            isBestPrice: false
          };
        });

        // 1. Sort shops selling this product in strictly ascending order (lowest price first)
        comparisons.sort((a, b) => a.dealPrice - b.dealPrice);

        // 2. Mark the shop offering the lowest price as the Best Price
        if (comparisons.length > 0) {
          comparisons[0].isBestPrice = true;
        }

        const bestItem = comparisons[0];
        const primaryProduct = items[0];
        const prodName = primaryProduct.name || primaryProduct.title || 'Product';
        const productImage = primaryProduct.image || (primaryProduct.images && primaryProduct.images[0]) || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300';
        
        let category = (primaryProduct.category || '').toLowerCase();
        if (!category) {
          category = 'electronics';
        }

        productDeals.push({
          id: primaryProduct.id || `prod-${Date.now()}-${Math.random()}`,
          title: prodName,
          name: prodName,
          platform: bestItem.platform, // featured shop is the lowest price shop
          storeId: bestItem.storeId,
          price: bestItem.dealPrice,
          retailPrice: bestItem.retailPrice,
          dealPrice: bestItem.dealPrice,
          cashbackEarned: bestItem.cashbackEarned,
          cashbackValue: bestItem.cashbackPercent,
          category,
          storeLogo: bestItem.logo,
          affiliateUrl: bestItem.link,
          image: productImage,
          isProduct: true,
          bestPrice: bestItem.dealPrice,
          bestPriceShop: bestItem.platform,
          shopCount: comparisons.length,
          comparisons
        });
      });

      combinedDeals = [...combinedDeals, ...productDeals];
    }
    
    // 2. Process explicit deals from database
    if (dealsData && dealsData.length > 0) {
      const fallbackLogo = 'https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg';

      const explicitDeals = dealsData.filter(d => d.status === 'active' || d.status === 'ACTIVE' || d.isActive === true).map(d => {
        let lowestListedPrice = 0;
        let highestCashbackPercent = 0;
        
        let formattedComparisons = [];
        if (d.comparisons && d.comparisons.length > 0) {
          formattedComparisons = d.comparisons.map(c => {
            const cPrice = typeof c.listedPrice === 'number' && c.listedPrice > 0
              ? c.listedPrice
              : (typeof c.dealPrice === 'number' && c.dealPrice > 0 ? c.dealPrice : (parseFloat(c.listedPrice || c.dealPrice || c.price || '0') || 0));
            const cCb = c.cashbackPercent || c.cashbackValue || 10;
            const cEarned = parseFloat(((cPrice * cCb) / 100).toFixed(2));
            const cRetail = c.retailPrice || parseFloat((cPrice * 1.4).toFixed(2));
            return {
              platform: c.platform || 'Amazon',
              dealPrice: cPrice,
              price: cPrice,
              listedPrice: cPrice,
              retailPrice: cRetail,
              cashbackPercent: cCb,
              cashbackEarned: cEarned,
              effectivePrice: parseFloat((cPrice - cEarned).toFixed(2)),
              link: c.link || c.affiliateUrl || getProductPlatformUrl(d, c.platform || 'Amazon')
            };
          });
          
          const validPrices = formattedComparisons.map(c => c.dealPrice).filter(p => p > 0);
          lowestListedPrice = validPrices.length > 0 ? Math.min(...validPrices) : 0;
          highestCashbackPercent = Math.max(...formattedComparisons.map(c => c.cashbackPercent));
        }
        
        const dealPrice = lowestListedPrice > 0 ? lowestListedPrice : (parseFloat(d.price || d.dealPrice || '0') || 0);
        const retailPrice = d.retailPrice || (dealPrice > 0 ? parseFloat((dealPrice * 1.4).toFixed(2)) : 0);
        const cashbackVal = highestCashbackPercent > 0 ? highestCashbackPercent : (parseFloat(d.cashback || d.cashbackValue || '10') || 10);
        const cashbackEarned = dealPrice > 0 ? parseFloat(((dealPrice * cashbackVal) / 100).toFixed(2)) : 0;
        
        const platform = d.platform || (formattedComparisons.length > 0 ? formattedComparisons[0].platform : 'Amazon');
        const cleanPlatform = platform.trim().toLowerCase();
        const matchedStore = storesData.find(s => {
          const cleanName = (s.name || '').trim().toLowerCase();
          return cleanPlatform.includes(cleanName) || cleanName.includes(cleanPlatform);
        });
        const storeLogo = matchedStore ? matchedStore.logo : (storesLogoMap[cleanPlatform] || storesLogoMap['amazon'] || fallbackLogo);

        let finalComparisons = [...formattedComparisons];
        if (finalComparisons.length === 0) {
          finalComparisons.push({
            platform: platform,
            dealPrice: dealPrice,
            price: dealPrice,
            listedPrice: dealPrice,
            retailPrice: retailPrice,
            cashbackPercent: cashbackVal,
            cashbackEarned: cashbackEarned,
            effectivePrice: parseFloat((dealPrice - cashbackEarned).toFixed(2)),
            link: d.link || d.affiliateUrl || getProductPlatformUrl(d, platform)
          });
        }

        finalComparisons.sort((a, b) => a.dealPrice - b.dealPrice);
        if (finalComparisons.length > 0) {
          finalComparisons[0].isBestPrice = true;
        }

        const baseDeal = {
          ...d,
          title: d.name || d.title,
          platform: platform,
          category: (d.category || 'electronics').toLowerCase(),
          storeLogo: storeLogo,
          price: dealPrice,
          retailPrice,
          dealPrice,
          cashbackEarned,
          cashbackValue: cashbackVal,
          comparisons: finalComparisons
        };
        return baseDeal;
      });

      explicitDeals.forEach(ed => {
        const matchTitle = (ed.title || ed.name || '').trim().toLowerCase();
        if (!combinedDeals.some(cd => (cd.title || cd.name || '').trim().toLowerCase() === matchTitle)) {
          combinedDeals.push(ed);
        }
      });
    }

    return combinedDeals;
  }, [dealsData, products, storesData]);

  // Filter deals and products by active category
  const filteredDeals = React.useMemo(() => {
    if (!activeCategory || activeCategory === 'all') {
      return dynamicDeals;
    }
    const normActive = activeCategory.toLowerCase();
    return dynamicDeals.filter((deal) => {
      const normCat = (deal.category || '').toLowerCase();
      return normCat === normActive || 
             (normActive === 'fashion' && (normCat === 'clothing' || normCat === 'shoes' || normCat === 'fashion')) ||
             (normActive === 'health' && (normCat === 'beauty' || normCat === 'health')) ||
             normCat.includes(normActive) || 
             normActive.includes(normCat);
    });
  }, [dynamicDeals, activeCategory]);

  const CATEGORIES_LIST = React.useMemo(() => {
    if (categoriesData && Array.isArray(categoriesData) && categoriesData.length > 0) {
      return categoriesData.filter(c => c && (c.status === 'active' || c.status === undefined)).map(c => ({
        id: c.slug || c.id || c.name.toLowerCase().replace(/\s+/g, '-'),
        slug: c.slug || c.id || c.name,
        name: c.name,
        icon: c.icon,
        iconType: c.iconType,
        customIconUrl: c.customIconUrl,
        badgeColor: c.badgeColor || '#3b82f6'
      }));
    }
    return [
      { id: 'fashion', slug: 'fashion', name: 'Fashion', icon: 'Shirt', badgeColor: '#ec4899' },
      { id: 'electronics', slug: 'electronics', name: 'Electronics', icon: 'Smartphone', badgeColor: '#3b82f6' },
      { id: 'health', slug: 'health', name: 'Health & Beauty', icon: 'Heart', badgeColor: '#10b981' },
      { id: 'grocery', slug: 'grocery', name: 'Food & Grocery', icon: 'ShoppingCart', badgeColor: '#f59e0b' },
      { id: 'travel', slug: 'travel', name: 'Travel & Flights', icon: 'Plane', badgeColor: '#8b5cf6' },
    ];
  }, [categoriesData]);

  const searchedStores = React.useMemo(() => {
    if (!homeSearchQuery.trim()) return [];
    
    const query = homeSearchQuery.trim();
    const queryIdentifier = getCleanedUrlIdentifier(query);
    
    return activeStores.filter(store => {
      if (queryIdentifier) {
        try {
          let normalizedUrlStr = query;
          if (!/^https?:\/\//i.test(normalizedUrlStr)) {
            normalizedUrlStr = 'https://' + normalizedUrlStr;
          }
          const url = new URL(normalizedUrlStr);
          const host = url.hostname.toLowerCase();
          const cleanStoreName = (store.name || '').toLowerCase().replace(/\s+/g, '');
          if (host.includes(cleanStoreName) || cleanStoreName.includes(host.replace(/^www\./, '').split('.')[0])) {
            return true;
          }
        } catch (e) {
          // ignore
        }
      }
      return (
        (store.name || '').toLowerCase().includes(query.toLowerCase()) ||
        (store.category || '').toLowerCase().includes(query.toLowerCase())
      );
    });
  }, [homeSearchQuery, activeStores]);

  const searchedCategories = React.useMemo(() => {
    if (!homeSearchQuery.trim()) return [];
    return CATEGORIES_LIST.filter(cat => 
      (cat.name || '').toLowerCase().includes(homeSearchQuery.toLowerCase()) ||
      (cat.slug || '').toLowerCase().includes(homeSearchQuery.toLowerCase())
    );
  }, [homeSearchQuery, CATEGORIES_LIST]);

  const searchedDeals = React.useMemo(() => {
    if (!homeSearchQuery.trim()) return [];
    
    const query = homeSearchQuery.trim();
    const queryIdentifier = getCleanedUrlIdentifier(query);
    
    return dynamicDeals.filter(deal => {
      if (queryIdentifier) {
        const dealUrlIdentifier = getCleanedUrlIdentifier(deal.affiliateUrl);
        if (dealUrlIdentifier && dealUrlIdentifier === queryIdentifier) {
          return true;
        }
      }
      return (
        (deal.title || '').toLowerCase().includes(query.toLowerCase()) ||
        (deal.name || '').toLowerCase().includes(query.toLowerCase()) ||
        (deal.category || '').toLowerCase().includes(query.toLowerCase()) ||
        (deal.platform || '').toLowerCase().includes(query.toLowerCase()) ||
        (deal.affiliateUrl || '').toLowerCase().includes(query.toLowerCase())
      );
    });
  }, [homeSearchQuery, dynamicDeals]);

  if (currentView === 'admin-login') {
    return (
      <div className="admin-layout-wrapper" style={{ minHeight: '100vh', backgroundColor: 'var(--bg)' }}>
        <Header
          currentView={currentView}
          setView={setView}
          theme={theme}
          toggleTheme={toggleTheme}
          currentUser={currentUser}
          onLogout={handleLogout}
          openAuthModal={handleOpenAuthModal}
          storesData={storesData}
          onStoreSelect={handleStoreSelect}
          setHomeSearchQuery={setHomeSearchQuery}
          dealsData={dynamicDeals}
          categoriesData={categoriesData}
          userNotifications={userNotifications}
          onMarkAllNotificationsRead={handleMarkAllNotificationsRead}
          onMarkNotificationRead={handleMarkNotificationRead}
          dashboardTab={dashboardTab}
          setDashboardTab={setDashboardTab}
          onOpenConvertLinkModal={() => setIsConvertLinkModalOpen(true)}
          onAddNotification={addNotification}
          onCategorySelect={(categoryId) => {
            setActiveCategory(categoryId);
            setHomeSearchQuery('');
            setView('home');
          }}
          onDealSelect={(deal) => {
            handleGrabProductDeal(deal);
          }}
        />
        <ConvertLinkModal
          isOpen={isConvertLinkModalOpen}
          onClose={() => setIsConvertLinkModalOpen(false)}
          currentUser={currentUser}
          openAuthModal={handleOpenAuthModal}
          onAddNotification={addNotification}
          setView={setView}
          setDashboardTab={setDashboardTab}
        />
        <Notification notifications={notifications} removeNotification={removeNotification} />
        <AdminLogin
          onLoginSuccess={(adminUser) => {
            sessionStorage.setItem('admin_session', 'active');
            localStorage.setItem('admin_session', JSON.stringify(adminUser));
            localStorage.setItem('is_admin', 'true');
            localStorage.setItem('user_session', JSON.stringify(adminUser));
            setCurrentUser(adminUser);
            setIsAdminLoggedIn(true);
            setView('admin-panel');
          }}
          onAddNotification={addNotification}
          setView={setView}
        />
        <AuthModal
          isOpen={isAuthModalOpen}
          initialTab={authInitialTab}
          initialError={authErrorMessage}
          onClose={() => { setIsAuthModalOpen(false); setAuthErrorMessage(''); }}
          onLogin={handleLogin}
        />
      </div>
    );
  }

  if (currentView === 'admin-panel') {
    return (
      <div className="admin-layout-wrapper" style={{ minHeight: '100vh', backgroundColor: 'var(--bg)' }}>
        <Notification notifications={notifications} removeNotification={removeNotification} />
        <AdminPanel
          currentUser={currentUser}
          onLogout={handleLogout}
          theme={theme}
          toggleTheme={toggleTheme}
          onAddNotification={addNotification}
          onUpdateProducts={setProducts}
          onUpdateDeals={setDealsData}
          onUpdateStores={setStoresData}
          onUpdateBanners={setBannersData}
          onUpdateCategories={setCategoriesData}
          onRefreshCatalog={loadCatalogData}
          setView={setView}
        />
      </div>
    );
  }

  if (isMobileView && currentView !== 'admin-login' && currentView !== 'admin-panel') {
    if (currentView === 'privacy-policy') {
      return (
        <div className="mobile-app-layout-root" style={{ minHeight: '100vh', background: 'var(--bg)', overflowY: 'auto' }}>
          <Notification notifications={notifications} removeNotification={removeNotification} />
          <PrivacyPolicy onBack={() => setView('home')} setView={setView} />
        </div>
      );
    }
    if (currentView === 'terms-and-conditions' || currentView === 'terms' || currentView === 'terms-conditions') {
      return (
        <div className="mobile-app-layout-root" style={{ minHeight: '100vh', background: 'var(--bg)', overflowY: 'auto' }}>
          <Notification notifications={notifications} removeNotification={removeNotification} />
          <TermsAndConditions onBack={() => setView('home')} setView={setView} />
        </div>
      );
    }
    if (currentView === 'signup' || currentView === 'register') {
      return (
        <div className="mobile-app-layout-root" style={{ minHeight: '100vh', background: 'var(--bg)', overflowY: 'auto' }}>
          <Notification notifications={notifications} removeNotification={removeNotification} />
          <Signup onLogin={handleLogin} setView={setView} />
        </div>
      );
    }
    if (currentView === 'share-landing') {
      return (
        <div className="mobile-app-layout-root" style={{ minHeight: '100vh', background: 'var(--bg)', overflowY: 'auto' }}>
          <Notification notifications={notifications} removeNotification={removeNotification} />
          <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border, #e5e7eb)', background: 'var(--card-bg, #ffffff)', position: 'sticky', top: 0, zIndex: 50 }}>
            <button 
              onClick={() => setView('home')}
              style={{ background: 'none', border: 'none', fontSize: '14px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--primary, #ff4d00)' }}
            >
              ← Back to Home
            </button>
            <span style={{ fontWeight: '800', fontSize: '15px', color: 'var(--text-bold, #111827)' }}>Special Deal</span>
            <div style={{ width: '40px' }} />
          </div>
          <ShareLanding 
            products={products}
            deals={dynamicDeals}
            storesData={storesData}
            currentUser={currentUser}
            openAuthModal={handleOpenAuthModal}
            onNotification={addNotification}
            setView={setView}
          />
        </div>
      );
    }

    const selectedStore = storesData.find((s) => (s.id && String(s.id) === String(selectedStoreId)) || (s._id && String(s._id) === String(selectedStoreId)));

    return (
      <div className="mobile-app-layout-root">
        <Notification notifications={notifications} removeNotification={removeNotification} />
        
        {currentView === 'store' && selectedStore ? (
          <div style={{ padding: '12px 12px 40px 12px', overflowY: 'auto', flex: 1, height: '100%' }}>
            <StoreDetail
              store={selectedStore}
              onBack={() => setView('home')}
              onAddNotification={addNotification}
              deals={storeSpecificDeals.filter(d => {
                if (!selectedStore?.name) return false;
                const storeName = selectedStore.name.trim().toLowerCase();

                // 1. Match exact name, contains, or common aliases
                if (d.platform) {
                  const dealPlatform = d.platform.trim().toLowerCase();
                  if (dealPlatform === storeName || dealPlatform.includes(storeName) || storeName.includes(dealPlatform)) {
                    return true;
                  }
                }

                // 2. Fallback for storeId matching if available
                if (d.storeId && (d.storeId === selectedStore.id || d.storeId === selectedStore._id)) return true;

                return false;
              })}
              onGrabDeal={handleGrabProductDeal}
              onShareDeal={handleShareDeal}
              currentUser={currentUser}
              openAuthModal={handleOpenAuthModal}
              compareList={compareList}
              onToggleCompare={handleToggleCompare}
            />
          </div>
        ) : (
          <MobileApp
            currentUser={currentUser}
            trackedOrders={trackedOrders}
            withdrawRequests={withdrawRequests}
            onAddWithdrawalRequest={handleAppWithdrawalRequest}
            onUpdateUser={handleUpdateUser}
            storesData={storesData}
            dealsData={dynamicDeals}
            categoriesData={categoriesData}
            onAddNotification={addNotification}
            onRefreshProfile={() => fetchFreshProfile(false)}
            openAuthModal={handleOpenAuthModal}
            onLogout={handleLogout}
            onGrabDeal={handleGrabProductDeal}
            onShareDeal={handleShareDeal}
            setView={setView}
            onStoreSelect={(id) => {
              setSelectedStoreId(id);
              setView('store');
            }}
            compareList={compareList}
            onToggleCompare={handleToggleCompare}
            onOpenCompare={() => setIsCompareModalOpen(true)}
          />
        )}

        <AuthModal
          isOpen={isAuthModalOpen}
          initialTab={authInitialTab}
          initialError={authErrorMessage}
          onClose={() => { setIsAuthModalOpen(false); setAuthErrorMessage(''); }}
          onLogin={handleLogin}
        />

        <PriceComparisonModal
          isOpen={!!activeComparisonDeal}
          onClose={() => setActiveComparisonDeal(null)}
          deal={activeComparisonDeal}
          onBuyAndEarn={executeGrabDealTracked}
          onReferLink={handleReferLink}
          storesData={storesData}
        />
      </div>
    );
  }

  return (
    <div className="web-app-wrapper" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Toast Alert Manager */}
      <Notification notifications={notifications} removeNotification={removeNotification} />

      {/* Header Sticky Component */}
      <Header
        currentView={currentView}
        setView={setView}
        theme={theme}
        toggleTheme={toggleTheme}
        currentUser={currentUser}
        onLogout={handleLogout}
        openAuthModal={handleOpenAuthModal}
        storesData={storesData}
        onStoreSelect={handleStoreSelect}
        homeSearchQuery={homeSearchQuery}
        setHomeSearchQuery={setHomeSearchQuery}
        dealsData={dynamicDeals}
        categoriesData={categoriesData}
        dashboardTab={dashboardTab}
        setDashboardTab={setDashboardTab}
        userNotifications={userNotifications}
        onMarkAllNotificationsRead={handleMarkAllNotificationsRead}
        onMarkNotificationRead={handleMarkNotificationRead}
        onOpenConvertLinkModal={() => setIsConvertLinkModalOpen(true)}
        onAddNotification={addNotification}
        onCategorySelect={(categoryId) => {
          setActiveCategory(categoryId);
          setHomeSearchQuery('');
          setView('home');
        }}
        onDealSelect={(deal) => {
          handleGrabProductDeal(deal);
        }}
      />

      {/* Category Filter Bar (Directly below Header at top: 64px with 0 gap) */}
      {currentView === 'home' && (
        <div 
          className="home-category-bar-sticky"
          style={{
            position: 'sticky',
            top: '64px',
            zIndex: 998,
            backgroundColor: 'var(--card-bg, #ffffff)'
          }}
        >
          <CategoryGrid
            activeCategory={activeCategory}
            onCategoryChange={(catId) => {
              setActiveCategory(catId);
              setHomeSearchQuery('');
            }}
            categories={categoriesData}
          />
        </div>
      )}

      <main className="main-container">
        {(currentView === 'home' || !['store', 'dashboard', 'share-landing', 'privacy-policy', 'terms-and-conditions', 'signup', 'register', 'admin-login', 'admin-panel'].includes(currentView)) && (
          <>
            {/* Banner Slider */}
            <Hero
              banners={bannersData ? bannersData.filter(b => b.type !== 'AD' && b.isActive) : []}
              onCtaClick={handleCtaRedirect}
              setView={setView}
              currentUser={currentUser}
              openAuthModal={handleOpenAuthModal}
              onOpenConvertLinkModal={() => setIsConvertLinkModalOpen(true)}
            />

            {homeSearchQuery ? (
              <div className="search-results-section animate-fade">
                <div className="search-results-header">
                  <h2 className="search-results-title">
                    Search Results for <span>"{homeSearchQuery}"</span>
                  </h2>
                  <span className="search-results-count">
                    Found {searchedStores.length + searchedCategories.length + searchedDeals.length} matches
                  </span>
                </div>

                {/* Filter chips */}
                <div className="search-filter-chips">
                  <button 
                    className={`search-filter-chip ${searchFilter === 'all' ? 'active' : ''}`}
                    onClick={() => setSearchFilter('all')}
                  >
                    All ({searchedStores.length + searchedCategories.length + searchedDeals.length})
                  </button>
                  <button 
                    className={`search-filter-chip ${searchFilter === 'products' ? 'active' : ''}`}
                    onClick={() => setSearchFilter('products')}
                  >
                    Products & Deals ({searchedDeals.length})
                  </button>
                  <button 
                    className={`search-filter-chip ${searchFilter === 'stores' ? 'active' : ''}`}
                    onClick={() => setSearchFilter('stores')}
                  >
                    Stores ({searchedStores.length})
                  </button>
                  <button 
                    className={`search-filter-chip ${searchFilter === 'categories' ? 'active' : ''}`}
                    onClick={() => setSearchFilter('categories')}
                  >
                    Categories ({searchedCategories.length})
                  </button>
                </div>

                {/* No Results */}
                {searchedStores.length === 0 && searchedCategories.length === 0 && searchedDeals.length === 0 && (
                  <div className="no-results-card animate-scale">
                    <div className="no-results-icon">🔍</div>
                    <h3 style={{ color: 'var(--text-bold)', fontWeight: 800 }}>No results found</h3>
                    <p className="no-results-text">We couldn't find any stores, categories or products matching your search query. Try another keyword!</p>
                  </div>
                )}

                {/* Matching Categories */}
                {(searchFilter === 'all' || searchFilter === 'categories') && searchedCategories.length > 0 && (
                  <div className="search-results-group">
                    <h3 className="search-results-group-title">📂 Matching Categories</h3>
                    <div className="search-categories-grid">
                      {searchedCategories.map(cat => (
                        <div 
                          key={cat.id || cat.slug || cat.name} 
                          className="search-category-badge"
                          onClick={() => {
                            setActiveCategory(cat.slug || cat.id);
                            setHomeSearchQuery('');
                          }}
                        >
                          <CategoryIcon
                            icon={cat.icon}
                            iconType={cat.iconType}
                            customIconUrl={cat.customIconUrl}
                            color={cat.badgeColor || 'var(--primary)'}
                            size={16}
                          />
                          <span>{cat.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Matching Stores */}
                {(searchFilter === 'all' || searchFilter === 'stores') && searchedStores.length > 0 && (
                  <div className="search-results-group">
                    <h3 className="search-results-group-title">🏢 Matching Stores</h3>
                    <StoreGrid
                      stores={searchedStores}
                      onStoreSelect={handleStoreSelect}
                      onRefresh={loadCatalogData}
                    />
                  </div>
                )}

                {/* Matching Products & Deals */}
                {(searchFilter === 'all' || searchFilter === 'products') && searchedDeals.length > 0 && (
                  <div className="search-results-group">
                    <h3 className="search-results-group-title">🏷️ Matching Products & Deals</h3>
                    <TopDeals
                      deals={searchedDeals}
                      onGrabDeal={handleGrabProductDeal}
                      onShareDeal={handleShareDeal}
                      compareList={compareList}
                      onToggleCompare={handleToggleCompare}
                    />
                  </div>
                )}
              </div>
            ) : (
              <>
                {/* Promo Ad Banners Placement */}
                <AdBanners banners={bannersData ? bannersData.filter(b => b.type === 'AD' && b.isActive) : []} />

                {/* Main Retailers Card Grid */}
                <StoreGrid
                  stores={filteredStores}
                  onStoreSelect={handleStoreSelect}
                  onRefresh={loadCatalogData}
                />

                {/* Deals Grid */}
                <TopDeals
                  deals={filteredDeals}
                  onGrabDeal={handleGrabProductDeal}
                  onShareDeal={handleShareDeal}
                  activeCategory={activeCategory}
                  compareList={compareList}
                  onToggleCompare={handleToggleCompare}
                />

                {/* Business Model Explanation */}
                <HowItWorks />

                {/* Customer Review Sliders */}
                <Testimonials />
              </>
            )}
          </>
        )}

        {currentView === 'store' && (
          selectedStore ? (
            <StoreDetail
              store={selectedStore}
              onBack={() => setView('home')}
              onAddNotification={addNotification}
              deals={storeSpecificDeals.filter(d => {
                if (!selectedStore?.name) return false;
                const storeName = selectedStore.name.trim().toLowerCase();

                // 1. Match exact name, contains, or common aliases
                if (d.platform) {
                  const dealPlatform = d.platform.trim().toLowerCase();
                  if (dealPlatform === storeName || dealPlatform.includes(storeName) || storeName.includes(dealPlatform)) {
                    return true;
                  }
                }

                // 2. Fallback for storeId matching if available
                if (d.storeId && (String(d.storeId) === String(selectedStore.id) || String(d.storeId) === String(selectedStore._id))) return true;

                return false;
              })}
              onGrabDeal={handleGrabProductDeal}
              onShareDeal={handleShareDeal}
              currentUser={currentUser}
              openAuthModal={handleOpenAuthModal}
              compareList={compareList}
              onToggleCompare={handleToggleCompare}
            />
          ) : (
            <div style={{ padding: '60px 20px', textAlign: 'center', backgroundColor: 'var(--card-bg)', borderRadius: '16px', margin: '40px auto', maxWidth: '480px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '44px', marginBottom: '12px' }}>🏪</div>
              <h3 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-bold)', marginBottom: '8px' }}>Store Not Found</h3>
              <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>The requested store could not be found or is inactive.</p>
              <button className="btn-primary" onClick={() => setView('home')}>← Back to Stores</button>
            </div>
          )
        )}

        {currentView === 'dashboard' && (
          currentUser ? (
            <ErrorBoundary>
              <Dashboard
                currentUser={currentUser}
                onAddNotification={addNotification}
                setView={setView}
                onAddWithdrawalRequest={handleAppWithdrawalRequest}
                onUpdateUser={handleUpdateUser}
                initialTab={dashboardTab}
                setInitialTab={setDashboardTab}
                onRefreshProfile={() => fetchFreshProfile(false)}
              />
            </ErrorBoundary>
          ) : (
            <div style={{ padding: '60px 20px', textAlign: 'center', backgroundColor: 'var(--card-bg)', borderRadius: '16px', margin: '40px auto', maxWidth: '480px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '44px', marginBottom: '12px' }}>🔐</div>
              <h3 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-bold)', marginBottom: '8px' }}>Please Sign In</h3>
              <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>You need to be logged in to view your dashboard and cashback earnings.</p>
              <button className="btn-primary" onClick={() => handleOpenAuthModal('login')}>Log In / Sign Up</button>
            </div>
          )
        )}

        {currentView === 'share-landing' && (
          <ShareLanding 
            products={products}
            deals={dynamicDeals}
            storesData={storesData}
            currentUser={currentUser}
            openAuthModal={handleOpenAuthModal}
            onNotification={addNotification}
            setView={setView}
          />
        )}

        {currentView === 'privacy-policy' && (
          <PrivacyPolicy onBack={() => setView('home')} setView={setView} />
        )}

        {(currentView === 'terms-and-conditions' || currentView === 'terms' || currentView === 'terms-conditions') && (
          <TermsAndConditions onBack={() => setView('home')} setView={setView} />
        )}

        {(currentView === 'signup' || currentView === 'register') && (
          <Signup onLogin={handleLogin} setView={setView} />
        )}
      </main>

      {/* Structured Footer */}
      <Footer setView={setView} />

      {/* Login / Registration overlay sheet */}
      <AuthModal
        isOpen={isAuthModalOpen}
        initialTab={authInitialTab}
        initialError={authErrorMessage}
        onClose={() => { setIsAuthModalOpen(false); setAuthErrorMessage(''); }}
        onLogin={handleLogin}
      />

      {/* Checkout Modal (Meesho/Flipkart Style) */}
      {checkoutDeal && checkoutStore && (
        <CheckoutModal
          deal={checkoutDeal}
          store={checkoutStore}
          onClose={() => { setCheckoutDeal(null); setCheckoutStore(null); setCheckoutStoreMeta(null); }}
          onPlaceOrder={finalizeCheckout}
        />
      )}

      {/* Price Comparison Modal */}
      <PriceComparisonModal
        isOpen={!!activeComparisonDeal}
        onClose={() => setActiveComparisonDeal(null)}
        deal={activeComparisonDeal}
        onBuyAndEarn={executeGrabDealTracked}
        onReferLink={handleReferLink}
        storesData={storesData}
      />

      {/* Universal Instant Link Converter Modal */}
      <ConvertLinkModal
        isOpen={isConvertLinkModalOpen}
        onClose={() => setIsConvertLinkModalOpen(false)}
        currentUser={currentUser}
        openAuthModal={handleOpenAuthModal}
        onAddNotification={addNotification}
        setView={setView}
        setDashboardTab={setDashboardTab}
      />

      {/* Share Modal Fallback */}
      {isShareModalOpen && shareModalUrl && (
        <div className="modal-overlay animate-fade">
          <div className="modal-content" style={{ maxWidth: '520px', width: '92%' }}>
            <div className="modal-header">
              <h3>Share Deal</h3>
              <button className="modal-close" onClick={() => { setIsShareModalOpen(false); setShareModalUrl(null); setShareModalTitle(null); }}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body" style={{ padding: '20px' }}>
              <p style={{ marginTop: 0 }}>{shareModalTitle}</p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', marginBottom: '12px' }}>
                {/* WhatsApp */}
                <button onClick={() => openExternalUrl(`https://wa.me/?text=${encodeURIComponent(shareModalTitle + ' ' + shareModalUrl)}`)} style={{ width: '52px', height: '52px', borderRadius: '50%', backgroundColor: '#25D366', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', transition: 'transform 0.15s' }} onMouseOver={e => e.currentTarget.style.transform = 'scale(1.08)'} onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'} aria-label="Share on WhatsApp">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                </button>

                {/* Facebook */}
                <button onClick={() => openExternalUrl(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareModalUrl)}`)} style={{ width: '52px', height: '52px', borderRadius: '50%', backgroundColor: '#1877F2', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', transition: 'transform 0.15s' }} onMouseOver={e => e.currentTarget.style.transform = 'scale(1.08)'} onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'} aria-label="Share on Facebook">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
                </button>

                {/* Instagram (copy then open Instagram) */}
                <button onClick={() => { navigator.clipboard.writeText(shareModalUrl); openExternalUrl('https://instagram.com'); addNotification('Link copied! Paste it in your Instagram story.', 'info'); }} style={{ width: '52px', height: '52px', borderRadius: '50%', background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', transition: 'transform 0.15s' }} onMouseOver={e => e.currentTarget.style.transform = 'scale(1.08)'} onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'} aria-label="Share on Instagram">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
                </button>

                {/* Copy link */}
                <button onClick={async () => { try { await navigator.clipboard.writeText(shareModalUrl); addNotification('Link copied to clipboard!', 'success'); } catch (e) { addNotification('Unable to copy link.', 'error'); } }} style={{ width: '52px', height: '52px', borderRadius: '50%', backgroundColor: '#374151', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', transition: 'transform 0.15s' }} onMouseOver={e => e.currentTarget.style.transform = 'scale(1.08)'} onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'} aria-label="Copy link">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                </button>
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text)', wordBreak: 'break-all' }}>{shareModalUrl}</div>
            </div>
            <div className="modal-footer" style={{ paddingTop: '12px' }}>
              <button className="btn-secondary" onClick={() => { setIsShareModalOpen(false); setShareModalUrl(null); setShareModalTitle(null); }}>Close</button>
            </div>
          </div>
        </div>
      )}
      {/* Checkout Modal */}
      {isCheckoutModalOpen && checkoutDeal && checkoutItem && (
        <div className="modal-overlay animate-fade">
          <div className="modal-content checkout-modal" style={{ maxWidth: '600px', width: '90%', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <div className="modal-header">
              <h3>Secure Checkout</h3>
                <button className="modal-close" onClick={() => { setIsCheckoutModalOpen(false); setCheckoutStoreMeta(null); }}>
                <X size={20} />
              </button>
            </div>
            
            <div className="modal-body" style={{ overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {checkoutStep === 1 ? (
                <>
                  {/* Order Summary */}
                  <div className="checkout-summary-card" style={{ padding: '16px', backgroundColor: 'var(--bg)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                    <h4 style={{ margin: '0 0 12px 0', fontSize: '15px', color: 'var(--text-bold)' }}>Order Summary</h4>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                      <img src={checkoutDeal.image} alt="Product" style={{ width: '60px', height: '60px', objectFit: 'contain', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'white' }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-bold)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{checkoutDeal.title || checkoutDeal.name}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text)', marginTop: '4px' }}>Sold by: {checkoutItem.platform}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-bold)' }}>₹{checkoutItem.dealPrice.toFixed(2)}</div>
                        <div style={{ fontSize: '11px', color: 'var(--secondary)', fontWeight: '600' }}>Includes ₹{checkoutItem.cashbackEarned.toFixed(2)} Commission</div>
                      </div>
                    </div>
                  </div>

                  {/* Delivery Details */}
                  <div className="checkout-section">
                    <h4 style={{ margin: '0 0 12px 0', fontSize: '15px', color: 'var(--text-bold)' }}>Delivery Address</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <input type="text" placeholder="Full Name" className="admin-form-input" style={{ gridColumn: '1 / -1' }} />
                      <input type="text" placeholder="Street Address" className="admin-form-input" style={{ gridColumn: '1 / -1' }} />
                      <input type="text" placeholder="City" className="admin-form-input" />
                      <input type="text" placeholder="Postal Code" className="admin-form-input" />
                      <input type="tel" placeholder="Phone Number" className="admin-form-input" style={{ gridColumn: '1 / -1' }} />
                    </div>
                  </div>

                  {/* Payment Method */}
                  <div className="checkout-section">
                    <h4 style={{ margin: '0 0 12px 0', fontSize: '15px', color: 'var(--text-bold)' }}>Payment Method</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <label className="checkout-payment-option" style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '16px', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer', backgroundColor: 'var(--card-bg)' }}>
                        <input type="radio" name="paymentMethod" defaultChecked style={{ marginTop: '3px' }} />
                        <div className="payment-option-content" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span style={{ fontWeight: '600', fontSize: '14px', color: 'var(--text-bold)' }}>Credit/Debit Card</span>
                          <span style={{ fontSize: '12px', color: 'var(--text)' }}>Visa, MasterCard, RuPay</span>
                        </div>
                      </label>
                      <label className="checkout-payment-option" style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '16px', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer', backgroundColor: 'var(--card-bg)' }}>
                        <input type="radio" name="paymentMethod" style={{ marginTop: '3px' }} />
                        <div className="payment-option-content" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span style={{ fontWeight: '600', fontSize: '14px', color: 'var(--text-bold)' }}>UPI (GPay, PhonePe, Paytm)</span>
                          <span style={{ fontSize: '12px', color: 'var(--text)' }}>Instant secure payment</span>
                        </div>
                      </label>
                      <label className="checkout-payment-option" style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '16px', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer', backgroundColor: 'var(--card-bg)' }}>
                        <input type="radio" name="paymentMethod" style={{ marginTop: '3px' }} />
                        <div className="payment-option-content" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span style={{ fontWeight: '600', fontSize: '14px', color: 'var(--text-bold)' }}>Cash on Delivery</span>
                          <span style={{ fontSize: '12px', color: 'var(--text)' }}>Pay when you receive the product</span>
                        </div>
                      </label>
                    </div>
                  </div>
                </>
              ) : (
                <div style={{ padding: '40px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                  <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'var(--secondary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'scaleUp 0.5s ease-out' }}>
                    <Check size={32} />
                  </div>
                  <h3 style={{ fontSize: '24px', color: 'var(--text-bold)', margin: 0 }}>Order Confirmed!</h3>
                  <p style={{ color: 'var(--text)', fontSize: '14px', lineHeight: 1.5, margin: 0 }}>
                    Your order for <strong>{checkoutDeal.title || checkoutDeal.name}</strong> has been successfully placed with {checkoutItem.platform}.
                  </p>
                  <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: '12px 16px', borderRadius: '8px', color: 'var(--secondary)', fontSize: '14px', fontWeight: '600', marginTop: '8px' }}>
                    🎉 You will earn ₹{checkoutItem.cashbackEarned.toFixed(2)} cashback on this order!
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer" style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: '12px', backgroundColor: 'var(--card-bg)' }}>
              {checkoutStep === 1 ? (
                <>
                  <button className="btn-secondary" onClick={() => setIsCheckoutModalOpen(false)}>Cancel</button>
                  <button className="btn-primary" onClick={async () => {
                    setCheckoutStep(2);
                    
                    const orderDateStr = new Date().toISOString().split('T')[0];
                    const returnExpiryDate = new Date();
                    returnExpiryDate.setDate(returnExpiryDate.getDate() + 7);
                    const returnExpiryDateStr = returnExpiryDate.toISOString().split('T')[0];
                    
                    // Generate mock device and IP
                    const devices = [
                      'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
                      'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0)'
                    ];
                    const ips = ['192.168.1.1', '10.0.0.5', '172.16.0.4', '104.28.1.1'];
                    
                    // Parse selected payment method
                    const paymentRadios = document.getElementsByName('paymentMethod');
                    let selectedPayment = 'Credit/Debit Card';
                    for (const r of paymentRadios) {
                      if (r.checked) {
                        const labelText = r.nextElementSibling.querySelector('span').innerText;
                        selectedPayment = labelText.includes('UPI') ? 'UPI' : (labelText.includes('Cash') ? 'Cash on Delivery' : 'Credit/Debit Card');
                        break;
                      }
                    }

                    const newOrderPayload = {
                      userId: currentUser ? currentUser.id : 'u1',
                      userName: currentUser ? currentUser.name : 'Guest User',
                      productId: checkoutDeal.id || 'N/A',
                      productName: checkoutDeal.title || checkoutDeal.name,
                      platform: checkoutItem.platform,
                      price: checkoutItem.dealPrice,
                      cashbackAmount: checkoutItem.cashbackEarned,
                      status: 'pending',
                      orderDate: orderDateStr,
                      confirmedDate: orderDateStr,
                      returnExpiryDate: returnExpiryDateStr,
                      returnWindowDays: 7,
                      
                      // Detailed new tracking metrics
                      clickId: checkoutStoreMeta && checkoutStoreMeta.clickId ? checkoutStoreMeta.clickId : 'CLK-' + Math.floor(Math.random() * 100000000),
                      shareId: checkoutStoreMeta && checkoutStoreMeta.shareId ? checkoutStoreMeta.shareId : null,
                      productImage: checkoutDeal.image,
                      affiliateUrl: checkoutItem.link || 'N/A',
                      category: checkoutDeal.category || 'electronics',
                      cashbackPercent: checkoutItem.cashbackPercent,
                      paymentMethod: selectedPayment,
                      deviceName: devices[Math.floor(Math.random() * devices.length)],
                      ipAddress: ips[Math.floor(Math.random() * ips.length)]
                    };
                    
                    try {
                      const savedOrder = await apiTracking.create(newOrderPayload);
                      setTrackedOrders([savedOrder, ...trackedOrders]);
                      addNotification(`Order placed successfully! ₹${checkoutItem.cashbackEarned.toFixed(2)} cashback is pending.`, 'success');
                    } catch (err) {
                      addNotification('Failed to save order tracking metadata.', 'error');
                      console.error(err);
                    }
                  }}>
                    Confirm & Pay ₹{checkoutItem.dealPrice.toFixed(2)}
                  </button>
                </>
              ) : (
                <button className="btn-primary" onClick={() => setIsCheckoutModalOpen(false)}>Continue Shopping</button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {isShareModalOpen && generatedShareData && (
        <div className="modal-overlay animate-fade">
          <div className="modal-content share-modal" style={{ maxWidth: '500px', width: '90%', display: 'flex', flexDirection: 'column' }}>
            <div className="modal-header">
              <h3>Share Referral Link</h3>
              <button className="modal-close" onClick={() => setIsShareModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            
            <div className="modal-body" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ textAlign: 'center', marginBottom: '8px' }}>
                <p style={{ color: 'var(--text)', fontSize: '14px', margin: '0 0 16px 0' }}>
                  Share this link with your friends! When they purchase <strong>{generatedShareData.productName}</strong> via this link, both of you will earn cashback!
                </p>
                <div style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px', padding: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <input 
                    type="text" 
                    readOnly 
                    value={generatedShareData.shortUrl} 
                    style={{ flex: 1, backgroundColor: 'transparent', border: 'none', color: 'var(--text-bold)', fontSize: '14px', outline: 'none' }} 
                  />
                  <button 
                    className="btn-primary"
                    onClick={() => {
                      navigator.clipboard.writeText(generatedShareData.shortUrl);
                      addNotification('Link copied to clipboard!', 'success');
                    }}
                    style={{ padding: '8px 16px', borderRadius: '6px', fontSize: '13px' }}
                  >
                    Copy
                  </button>
                </div>
              </div>

              <div>
                <h4 style={{ margin: '0 0 16px 0', fontSize: '14px', color: 'var(--text-bold)', textAlign: 'center' }}>Share directly via</h4>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
                  {/* WhatsApp */}
                  <button onClick={() => openExternalUrl(`https://wa.me/?text=Check out this deal: ${generatedShareData.shortUrl}`)} style={{ width: '50px', height: '50px', borderRadius: '50%', backgroundColor: '#25D366', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', transition: 'transform 0.2s' }} onMouseOver={e => e.currentTarget.style.transform = 'scale(1.1)'} onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                  </button>
                  {/* Facebook */}
                  <button onClick={() => openExternalUrl(`https://www.facebook.com/sharer/sharer.php?u=${generatedShareData.shortUrl}`)} style={{ width: '50px', height: '50px', borderRadius: '50%', backgroundColor: '#1877F2', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', transition: 'transform 0.2s' }} onMouseOver={e => e.currentTarget.style.transform = 'scale(1.1)'} onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
                  </button>
                  {/* Instagram (Copies and opens insta.com since no direct share URL exists) */}
                  <button onClick={() => { navigator.clipboard.writeText(generatedShareData.shortUrl); openExternalUrl('https://instagram.com'); addNotification('Link copied! Paste it in your Instagram story.', 'info'); }} style={{ width: '50px', height: '50px', borderRadius: '50%', background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', transition: 'transform 0.2s' }} onMouseOver={e => e.currentTarget.style.transform = 'scale(1.1)'} onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
                  </button>
                  {/* Snapchat */}
                  <button onClick={() => openExternalUrl(`https://snapchat.com/scan?attachmentUrl=${generatedShareData.shortUrl}`)} style={{ width: '50px', height: '50px', borderRadius: '50%', backgroundColor: '#FFFC00', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', transition: 'transform 0.2s' }} onMouseOver={e => e.currentTarget.style.transform = 'scale(1.1)'} onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 16c-1.2 0-2-.8-2-2a2 2 0 0 1 2-2h.5A6 6 0 0 1 10 5.4a6 6 0 0 1 5.5 6.6H16a2 2 0 0 1 2 2c0 1.2-.8 2-2 2h-.5c-.8 1-2.2 1.6-3.5 1.6s-2.7-.6-3.5-1.6H4z"></path></svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Compare Tray */}
      <CompareTray
        compareList={compareList}
        onOpenCompare={() => setIsCompareModalOpen(true)}
        onRemoveItem={handleRemoveCompareItem}
        onClearAll={handleClearCompare}
      />

      {/* Side-by-Side Comparison Modal */}
      <CompareModal
        isOpen={isCompareModalOpen}
        onClose={() => setIsCompareModalOpen(false)}
        compareList={compareList}
        onRemoveItem={handleRemoveCompareItem}
        onClearAll={handleClearCompare}
        onGrabDeal={handleGrabProductDeal}
      />

      <ToastContainer
        position="top-right"
        autoClose={4000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
    </div>
  );
}
