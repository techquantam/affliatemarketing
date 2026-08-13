import React, { useState, useEffect } from 'react';
import SearchBar from './SearchBar';
import {
  Home,
  ShoppingBag,
  Clock,
  Wallet,
  Search,
  ArrowRight,
  TrendingUp,
  Gift,
  Copy,
  Check,
  CheckCircle,
  Truck,
  ShieldCheck,
  Shield,
  Play,
  User,
  LogOut,
  Send,
  AlertCircle,
  Layers,
  Shirt,
  Smartphone,
  Heart,
  ShoppingCart,
  Plane,
  Sparkles,
  BookOpen,
  HelpCircle
} from 'lucide-react';
import UserLedger from './UserLedger';
import UserSupport from './UserSupport';
import CategoryIcon from './CategoryIcon';
import { apiAffiliate } from '../services/api';
import { openExternalUrl, getStoreUrl, getProductPlatformUrl } from '../utils/openUrl';

const STORES_INFO = [
  { platform: 'Amazon', logo: 'https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg', cashbackPercent: 10.0 },
  { platform: 'Flipkart', logo: 'https://upload.wikimedia.org/wikipedia/commons/7/7a/Flipkart_logo.svg', cashbackPercent: 8.5 },
  { platform: 'Myntra', logo: 'https://upload.wikimedia.org/wikipedia/commons/b/bc/Myntra_Logo.png', cashbackPercent: 12.0 },
  { platform: 'Ajio', logo: 'https://upload.wikimedia.org/wikipedia/commons/c/c9/Ajio_Logo.svg', cashbackPercent: 15.0 },
  { platform: 'Nykaa Beauty', logo: 'https://upload.wikimedia.org/wikipedia/commons/5/5b/Nykaa_Logo.svg', cashbackPercent: 7.0 },
  { platform: 'MakeMyTrip', logo: 'https://upload.wikimedia.org/wikipedia/commons/f/fb/MakeMyTrip_Logo.svg', cashbackPercent: 9.0 }
];

const generatePriceComparisons = (deal) => {
  if (!deal) return [];
  
  const basePrice = typeof deal.dealPrice === 'number' && deal.dealPrice > 0 
    ? deal.dealPrice 
    : (typeof deal.price === 'number' && deal.price > 0 ? deal.price : (parseFloat(deal.dealPrice || deal.price || '0') || 0));
    
  const retailPrice = typeof deal.retailPrice === 'number' && deal.retailPrice > 0 
    ? deal.retailPrice 
    : (deal.price && deal.dealPrice && deal.price > deal.dealPrice ? deal.price : parseFloat((basePrice * 1.4).toFixed(2)));

  if (deal.comparisons && deal.comparisons.length > 0) {
    return deal.comparisons.map(comp => {
      const platformName = comp.platform || deal.platform || 'Amazon';
      const store = STORES_INFO.find(s => s.platform.toLowerCase() === platformName.toLowerCase()) || STORES_INFO[0];
      const dealPrice = typeof comp.listedPrice === 'number' && comp.listedPrice > 0 
        ? comp.listedPrice 
        : (typeof comp.dealPrice === 'number' && comp.dealPrice > 0 ? comp.dealPrice : basePrice);
      const cashbackPercent = comp.cashbackPercent || comp.cashbackValue || store.cashbackPercent || deal.cashbackValue || 10;
      const cashbackEarned = parseFloat(((dealPrice * cashbackPercent) / 100).toFixed(2));
      const effectivePrice = parseFloat((dealPrice - cashbackEarned).toFixed(2));
      const link = comp.link || comp.affiliateUrl || getProductPlatformUrl(deal, platformName);
      return {
        platform: platformName,
        logo: comp.logo || store.logo,
        dealPrice,
        price: dealPrice,
        retailPrice: comp.retailPrice || retailPrice,
        cashbackPercent,
        cashbackEarned,
        effectivePrice,
        link,
        isOriginal: platformName.toLowerCase() === (deal.platform || '').toLowerCase()
      };
    }).sort((a, b) => a.dealPrice - b.dealPrice);
  }

  const platformName = deal.platform || 'Amazon';
  const store = STORES_INFO.find(s => s.platform.toLowerCase() === platformName.toLowerCase()) || STORES_INFO[0];
  const dealPrice = basePrice;
  const cashbackPercent = deal.cashbackValue || store.cashbackPercent || 10;
  const cashbackEarned = deal.cashbackEarned || parseFloat(((dealPrice * cashbackPercent) / 100).toFixed(2));
  const effectivePrice = parseFloat((dealPrice - cashbackEarned).toFixed(2));
  const link = deal.affiliateUrl || deal.link || getProductPlatformUrl(deal, platformName);

  return [{
    platform: platformName,
    logo: store.logo,
    dealPrice,
    price: dealPrice,
    retailPrice,
    cashbackPercent,
    cashbackEarned,
    effectivePrice,
    link,
    isOriginal: true
  }];
};

export default function MobileApp({
  currentUser,
  trackedOrders = [],
  withdrawRequests = [],
  onAddWithdrawalRequest,
  storesData = [],
  dealsData = [],
  categoriesData = [],
  onAddNotification,
  openAuthModal,
  onLogout,
  onGrabDeal,
  onShareDeal,
  onStoreSelect,
  setView
}) {
  const [activeTab, setActiveTab] = useState('home');
  const [copiedLink, setCopiedLink] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Withdrawal Form States
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [upiId, setUpiId] = useState('');
  const [withdrawLoading, setWithdrawLoading] = useState(false);

  // Selected Order for tracking modal
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [comparisonDeal, setComparisonDeal] = useState(null);

  // New States for Mobile UI
  const [activeSlide, setActiveSlide] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [homeSearchQuery, setHomeSearchQuery] = useState('');
  const [searchFilter, setSearchFilter] = useState('all');

  const HERO_SLIDES = [
    {
      id: 1,
      tag: 'Limited Time Bonanza',
      title: 'Discover Top Deals. <span style="color:var(--primary)">Shop Safely.</span>',
      desc: 'Shop at Amazon, Ajio, Flipkart & 500+ stores.',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/b/bc/Myntra_Logo.png',
    },
    {
      id: 2,
      tag: 'Electronics Mega Deal',
      title: 'Up to <span style="color:var(--primary)">80% OFF</span> on Gadgets',
      desc: 'Upgrade your phone or laptop with active coupons.',
      logo: 'https://www.google.com/s2/favicons?sz=256&domain=flipkart.com',
    },
    {
      id: 3,
      tag: 'Affiliate Program',
      title: 'Share Links. <span style="color:var(--primary)">Earn Cash!</span>',
      desc: 'Share unique links and earn commission for life.',
      logo: 'https://www.google.com/s2/favicons?sz=256&domain=ajio.com',
    }
  ];

  const CATEGORIES = React.useMemo(() => {
    if (categoriesData && Array.isArray(categoriesData) && categoriesData.length > 0) {
      const activeOnly = categoriesData.filter(c => c && (c.status === 'active' || c.status === undefined));
      const list = activeOnly.map(c => ({
        id: (c.slug || c.id || c.name).toLowerCase().replace(/\s+/g, '-'),
        slug: c.slug || c.id || c.name,
        name: c.name,
        icon: c.icon,
        iconType: c.iconType,
        customIconUrl: c.customIconUrl,
        badgeColor: c.badgeColor || '#3b82f6',
        displayOrder: c.displayOrder ?? 0
      })).sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));

      return [
        { id: 'all', slug: 'all', name: 'All Stores', icon: 'Layers', badgeColor: 'var(--primary)' },
        ...list
      ];
    }
    return [
      { id: 'all', slug: 'all', name: 'All Stores', icon: 'Layers', badgeColor: 'var(--primary)' },
      { id: 'fashion', slug: 'fashion', name: 'Fashion', icon: 'Shirt', badgeColor: '#ec4899' },
      { id: 'electronics', slug: 'electronics', name: 'Electronics', icon: 'Smartphone', badgeColor: '#3b82f6' },
      { id: 'health', slug: 'health', name: 'Health & Beauty', icon: 'Heart', badgeColor: '#10b981' },
      { id: 'grocery', slug: 'grocery', name: 'Food & Grocery', icon: 'ShoppingCart', badgeColor: '#f59e0b' },
      { id: 'travel', slug: 'travel', name: 'Travel & Flights', icon: 'Plane', badgeColor: '#8b5cf6' },
    ];
  }, [categoriesData]);

  const searchedStores = React.useMemo(() => {
    if (!homeSearchQuery.trim()) return [];
    return storesData.filter(store => 
      (store.name || '').toLowerCase().includes(homeSearchQuery.toLowerCase()) ||
      (store.category || '').toLowerCase().includes(homeSearchQuery.toLowerCase())
    );
  }, [homeSearchQuery, storesData]);

  const searchedCategories = React.useMemo(() => {
    if (!homeSearchQuery.trim()) return [];
    return CATEGORIES.filter(cat => 
      cat.id !== 'all' && 
      (cat.name || '').toLowerCase().includes(homeSearchQuery.toLowerCase())
    );
  }, [homeSearchQuery, CATEGORIES]);

  const searchedDeals = React.useMemo(() => {
    if (!homeSearchQuery.trim()) return [];
    return dealsData.filter(deal => 
      (deal.title || '').toLowerCase().includes(homeSearchQuery.toLowerCase()) ||
      (deal.name || '').toLowerCase().includes(homeSearchQuery.toLowerCase()) ||
      (deal.category || '').toLowerCase().includes(homeSearchQuery.toLowerCase()) ||
      (deal.platform || '').toLowerCase().includes(homeSearchQuery.toLowerCase())
    );
  }, [homeSearchQuery, dealsData]);

  useEffect(() => {
    if (activeTab === 'home') {
      const timer = setInterval(() => {
        setActiveSlide((prev) => (prev + 1) % HERO_SLIDES.length);
      }, 5000);
      return () => clearInterval(timer);
    }
  }, [activeTab]);

  // Get current user's wallet info (or fallback if guest/admin)
  const isGuest = !currentUser;
  const user = currentUser ? { ...currentUser, wallet: currentUser.wallet || { confirmed: 0.00, pending: 0.00, referral: 0.00 } } : {
    name: 'Guest User',
    wallet: { confirmed: 0.00, pending: 0.00, referral: 0.00 }
  };

  const refLink = `${window.location.origin}/join?ref=${user.name.toLowerCase().replace(' ', '')}`;

  // Filter tracked orders for the logged-in user
  const userTrackedOrders = trackedOrders.filter(o => o.userName === user.name);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(refLink);
    setCopiedLink(true);
    onAddNotification('Referral link copied!', 'success');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleGrabDeal = (deal) => {
    setComparisonDeal(deal);
  };

  const executeSimulatorGrabDeal = (dealItem, storeItem) => {
    if (isGuest) {
      setComparisonDeal(null);
      onAddNotification('Please Login / Sign Up first to grab deals & earn cashback!', 'info');
      openAuthModal();
      return;
    }

    setComparisonDeal(null);
    onAddNotification(`Opening ${storeItem?.platform || 'Store'}... Tracking active!`, 'success');
    
    // Background tracking without blocking UI
    if (currentUser) {
      const shareId = localStorage.getItem('shareId');
      const buyerId = currentUser.id;
      apiAffiliate.createClick(buyerId, shareId, dealItem.id).catch(e => console.warn('Affiliate click log failed', e));
    }
    
    const link = storeItem?.link || dealItem?.affiliateUrl || dealItem?.link || getProductPlatformUrl(dealItem, storeItem?.platform);
    openExternalUrl(link);
  };

  const handleStoreClick = (store) => {
    if (onStoreSelect) {
      onStoreSelect(store.id);
    } else {
      onAddNotification(`Opening ${store.name}... Tracking active!`, 'success');
      const storeUrl = store.affiliateUrl || store.link || getStoreUrl(store.name);
      openExternalUrl(storeUrl);
    }
  };

  const handleRequestWithdrawal = (e) => {
    e.preventDefault();
    if (isGuest) {
      onAddNotification('Please Login / Sign Up to request withdrawals.', 'error');
      openAuthModal();
      return;
    }
    
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      onAddNotification('Please enter a valid withdrawal amount.', 'error');
      return;
    }

    if (amount < 10) {
      onAddNotification('Minimum withdrawal amount is ₹10.00', 'error');
      return;
    }

    if (amount > user.wallet.confirmed) {
      onAddNotification('Insufficient confirmed cashback balance.', 'error');
      return;
    }

    if (!upiId.trim().includes('@')) {
      onAddNotification('Please enter a valid UPI ID (e.g. name@bank).', 'error');
      return;
    }

    setWithdrawLoading(true);

    const newRequest = {
      userName: user.name,
      coins: Math.round(amount * 100), // 100 coins = ₹1
      amount: amount,
      upiId: upiId,
      date: new Date().toISOString().split('T')[0],
    };

    onAddWithdrawalRequest(newRequest);

    // Update local wallet view
    user.wallet.confirmed = Math.max(0, user.wallet.confirmed - amount);
    user.wallet.pending += amount; // shift to pending processing

    setWithdrawAmount('');
    setUpiId('');
    setWithdrawLoading(false);
    onAddNotification('Withdrawal requested successfully!', 'success');
  };

  // Get return status description for user UI
  const getUserReturnInfo = (item) => {
    if (item.status === 'completed') return { text: 'Clearance Approved (Unlocked)', color: '#10b981' };
    if (item.status === 'returned') return { text: 'Refunded (Cashback Cancelled)', color: '#ef4444' };
    if (item.status === 'return_active') {
      const today = new Date();
      const expiry = new Date(item.returnExpiryDate);
      const diff = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
      return { 
        text: diff > 0 ? `${diff} Days until Cashback Unlocks` : 'Awaiting clearance review', 
        color: '#3b82f6' 
      };
    }
    return { text: 'In-Transit / Awaiting delivery confirmation', color: '#f59e0b' };
  };

  return (
    <div className="mobile-app-container">
      {/* Top Application Header */}
      <div className="mobile-app-header">
        <div className="app-branding">
          <img src="/logo.webp" alt="Lio Mart" style={{ width: '28px', height: '28px', objectFit: 'contain', marginRight: '8px' }} />
          <span>LIO MART</span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Admin Panel Button */}
          {setView && (
            <button
              onClick={() => setView('admin-login')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '5px 10px',
                borderRadius: '6px',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--card-bg)',
                color: 'var(--primary)',
                fontSize: '10px',
                fontWeight: '700',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s ease'
              }}
              title="Admin Panel"
            >
              <Shield size={12} />
              Admin
            </button>
          )}

          {isGuest ? (
            <button className="app-login-btn" onClick={openAuthModal}>Login</button>
          ) : (
            <div className="app-user-profile">
              <span className="app-user-initial">{user.name[0]}</span>
              <button className="app-logout-icon" onClick={onLogout} title="Logout App">
                <LogOut size={14} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Screen Content Frame */}
      <div className="mobile-app-screen-content">
        {comparisonDeal ? (
          <div className="mobile-screen-tab-panel animate-fade" style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '12px', height: '100%', overflowY: 'auto' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <button 
                onClick={() => setComparisonDeal(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '14px',
                  cursor: 'pointer',
                  color: 'var(--primary)',
                  fontWeight: '700',
                  padding: 0
                }}
              >
                &larr; Back
              </button>
              <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-bold)' }}>Price Comparison</span>
            </div>

            {/* Product card info */}
            <div style={{ display: 'flex', gap: '10px', backgroundColor: 'var(--bg)', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)' }}>
              <img 
                src={comparisonDeal.image} 
                alt="" 
                style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '4px' }}
              />
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <h4 style={{ margin: 0, fontSize: '11px', fontWeight: '700', color: 'var(--text-bold)', lineHeight: '1.3', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {comparisonDeal.title || comparisonDeal.name}
                </h4>
                <span style={{ fontSize: '9px', color: 'var(--text)', textTransform: 'capitalize', marginTop: '2px' }}>
                  Category: <strong>{comparisonDeal.category}</strong>
                </span>
              </div>
            </div>

            {/* Platform Comparison List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', paddingBottom: '20px' }}>
              {generatePriceComparisons(comparisonDeal).map((item, index) => {
                const isBestValue = index === 0;
                return (
                  <div
                    key={item.platform}
                    style={{
                      border: isBestValue ? '1.5px solid #10b981' : '1px solid var(--border)',
                      borderRadius: '6px',
                      padding: '8px 10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      position: 'relative',
                      backgroundColor: 'var(--card-bg)'
                    }}
                  >
                    {isBestValue && (
                      <span style={{
                        position: 'absolute',
                        top: '-7px',
                        left: '8px',
                        backgroundColor: '#10b981',
                        color: '#fff',
                        fontSize: '6px',
                        fontWeight: '800',
                        padding: '1px 5px',
                        borderRadius: '6px',
                        textTransform: 'uppercase'
                      }}>
                        🏆 Best Value
                      </span>
                    )}

                    {/* Left side info */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                      <span style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-bold)' }}>{item.platform}</span>
                      {item.retailPrice > item.dealPrice && (
                        <span style={{ fontSize: '8px', color: 'var(--text)', textDecoration: 'line-through' }}>
                          MRP: ₹{item.retailPrice.toFixed(2)}
                        </span>
                      )}
                      <span style={{ fontSize: '9px', color: '#10b981', fontWeight: '600' }}>
                        -{item.cashbackPercent}% CB (-₹{item.cashbackEarned.toFixed(2)})
                      </span>
                    </div>

                    {/* Right side Price & CTA */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                        <span style={{ fontSize: '8px', color: 'var(--text)' }}>Deal Price:</span>
                        <span style={{ fontSize: '12px', fontWeight: '800', color: isBestValue ? '#10b981' : 'var(--text-bold)' }}>
                          ₹{item.dealPrice.toFixed(2)}
                        </span>
                        <span style={{ fontSize: '8px', color: '#10b981', fontWeight: '600' }}>
                          Net: ₹{item.effectivePrice.toFixed(2)}
                        </span>
                      </div>
                      
                      <button
                        onClick={() => executeSimulatorGrabDeal(comparisonDeal, item)}
                        style={{
                          backgroundColor: '#ff4f2f',
                          color: '#fff',
                          border: 'none',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontWeight: '600',
                          fontSize: '9px',
                          cursor: 'pointer'
                        }}
                      >
                        Shop
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <>
            {/* TAB 1: HOME SCREEN */}
            {activeTab === 'home' && (
              <div className="mobile-screen-tab-panel animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                {/* Wallet Quick Summary */}
                <div className="app-quick-wallet">
                  <div className="quick-wallet-header">
                    <span>Total Cashback Balance</span>
                    <TrendingUp size={16} style={{ color: '#10b981' }} />
                  </div>
                  <div className="quick-wallet-balance">
                    ₹{(user.wallet.confirmed + user.wallet.pending).toFixed(2)}
                  </div>
                  <div className="quick-wallet-breakdown">
                    <span>Confirmed: <strong>₹{user.wallet.confirmed.toFixed(2)}</strong></span>
                    <span>Pending: <strong>₹{user.wallet.pending.toFixed(2)}</strong></span>
                  </div>
                </div>

                {/* Modern Hero Banner Carousel */}
                <div style={{
                  background: 'var(--gradient-card-glow)',
                  border: '1px solid var(--border)',
                  borderRadius: '16px',
                  padding: '16px',
                  position: 'relative',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  minHeight: '130px',
                  boxShadow: 'var(--shadow)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1, paddingRight: '8px' }}>
                      <span style={{
                        fontSize: '9px',
                        fontWeight: '800',
                        color: 'var(--primary)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        backgroundColor: 'rgba(255, 79, 47, 0.1)',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        marginBottom: '6px'
                      }}>
                        <Sparkles size={10} /> {HERO_SLIDES[activeSlide].tag}
                      </span>
                      <h4 
                        style={{ margin: 0, fontSize: '14px', fontWeight: '800', color: 'var(--text-bold)', lineHeight: '1.3' }}
                        dangerouslySetInnerHTML={{ __html: HERO_SLIDES[activeSlide].title }}
                      />
                      <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: 'var(--text)', opacity: 0.85 }}>
                        {HERO_SLIDES[activeSlide].desc}
                      </p>
                    </div>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '12px',
                      backgroundColor: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid var(--border)',
                      padding: '8px',
                      flexShrink: 0
                    }}>
                      <img src={HERO_SLIDES[activeSlide].logo} alt="" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                    </div>
                  </div>

                  {/* Indicator Dots */}
                  <div style={{ display: 'flex', gap: '4px', marginTop: '6px', justifyContent: 'flex-start' }}>
                    {HERO_SLIDES.map((_, idx) => (
                      <div 
                        key={idx} 
                        onClick={() => setActiveSlide(idx)}
                        style={{
                          width: idx === activeSlide ? '12px' : '6px',
                          height: '6px',
                          borderRadius: '99px',
                          backgroundColor: idx === activeSlide ? 'var(--primary)' : 'var(--border)',
                          transition: 'all 0.3s ease',
                          cursor: 'pointer'
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* Search Bar */}
                <SearchBar
                  placeholder="Search products, brands, categories or stores..."
                  value={homeSearchQuery}
                  onChange={setHomeSearchQuery}
                />

                {homeSearchQuery ? (
                  <div className="search-results-section animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div className="search-results-header" style={{ marginBottom: '12px', paddingBottom: '8px' }}>
                      <h4 className="search-results-title" style={{ fontSize: '15px' }}>
                        Results for <span style={{ color: 'var(--primary)' }}>"{homeSearchQuery}"</span>
                      </h4>
                      <span className="search-results-count" style={{ fontSize: '11px' }}>
                        Found {searchedStores.length + searchedCategories.length + searchedDeals.length} matches
                      </span>
                    </div>

                    {/* Filter chips */}
                    <div className="search-filter-chips" style={{ marginBottom: '8px' }}>
                      <button 
                        className={`search-filter-chip ${searchFilter === 'all' ? 'active' : ''}`}
                        onClick={() => setSearchFilter('all')}
                        style={{ padding: '6px 12px', fontSize: '11px' }}
                      >
                        All ({searchedStores.length + searchedCategories.length + searchedDeals.length})
                      </button>
                      <button 
                        className={`search-filter-chip ${searchFilter === 'products' ? 'active' : ''}`}
                        onClick={() => setSearchFilter('products')}
                        style={{ padding: '6px 12px', fontSize: '11px' }}
                      >
                        Deals ({searchedDeals.length})
                      </button>
                      <button 
                        className={`search-filter-chip ${searchFilter === 'stores' ? 'active' : ''}`}
                        onClick={() => setSearchFilter('stores')}
                        style={{ padding: '6px 12px', fontSize: '11px' }}
                      >
                        Stores ({searchedStores.length})
                      </button>
                      <button 
                        className={`search-filter-chip ${searchFilter === 'categories' ? 'active' : ''}`}
                        onClick={() => setSearchFilter('categories')}
                        style={{ padding: '6px 12px', fontSize: '11px' }}
                      >
                        Categories ({searchedCategories.length})
                      </button>
                    </div>

                    {/* No Results */}
                    {searchedStores.length === 0 && searchedCategories.length === 0 && searchedDeals.length === 0 && (
                      <div className="no-results-card animate-scale" style={{ padding: '30px 10px', margin: '20px auto' }}>
                        <div className="no-results-icon" style={{ fontSize: '36px' }}>🔍</div>
                        <h4 style={{ color: 'var(--text-bold)', fontWeight: 800 }}>No results found</h4>
                        <p className="no-results-text" style={{ fontSize: '12px' }}>Try another keyword!</p>
                      </div>
                    )}

                    {/* Matching Categories */}
                    {(searchFilter === 'all' || searchFilter === 'categories') && searchedCategories.length > 0 && (
                      <div className="search-results-group">
                        <h4 className="search-results-group-title" style={{ fontSize: '13px', marginBottom: '8px' }}>📂 Categories</h4>
                        <div className="search-categories-grid">
                          {searchedCategories.map(cat => {
                            const Icon = cat.icon || Layers;
                            return (
                              <div 
                                key={cat.id} 
                                className="search-category-badge"
                                onClick={() => {
                                  setSelectedCategory(cat.id);
                                  setHomeSearchQuery('');
                                }}
                                style={{ padding: '6px 12px', fontSize: '12px' }}
                              >
                                <Icon size={12} style={{ color: 'var(--primary)' }} />
                                <span>{cat.name}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Matching Stores */}
                    {(searchFilter === 'all' || searchFilter === 'stores') && searchedStores.length > 0 && (
                      <div className="search-results-group">
                        <h4 className="search-results-group-title" style={{ fontSize: '13px', marginBottom: '8px' }}>🏢 Stores</h4>
                        <div className="app-stores-list" style={{ gap: '8px' }}>
                          {searchedStores.map(store => (
                            <div key={store.id} className="app-store-row" onClick={() => handleStoreClick(store)} style={{ padding: '8px' }}>
                              <img src={store.logo} alt={store.name} style={{ width: '36px', height: '36px' }} />
                              <div className="app-store-row-info">
                                <h4 style={{ fontSize: '12px' }}>{store.name}</h4>
                                <p style={{ fontSize: '10px' }}>Up to {store.cashbackRate} Cashback</p>
                              </div>
                              <button className="app-store-go-btn" style={{ padding: '4px 8px', fontSize: '10px' }}>
                                Shop
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Matching Products & Deals */}
                    {(searchFilter === 'all' || searchFilter === 'products') && searchedDeals.length > 0 && (
                      <div className="search-results-group">
                        <h4 className="search-results-group-title" style={{ fontSize: '13px', marginBottom: '8px' }}>🏷️ Deals</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                          {searchedDeals.map(deal => (
                            <div 
                              key={deal.id} 
                              className="app-deal-item" 
                              onClick={() => handleGrabDeal(deal)}
                              style={{
                                width: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                boxShadow: 'var(--shadow)'
                              }}
                            >
                              <div style={{
                                width: '100%',
                                height: '90px',
                                backgroundColor: '#fff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '8px',
                                borderBottom: '1px solid var(--border)'
                              }}>
                                <img src={deal.image} alt={deal.title} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                              </div>
                              <div className="app-deal-info" style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                                <h4 style={{
                                  margin: 0,
                                  fontSize: '11px',
                                  fontWeight: '700',
                                  color: 'var(--text-bold)',
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical',
                                  overflow: 'hidden',
                                  height: '32px',
                                  lineHeight: '1.4'
                                }}>
                                  {deal.title}
                                </h4>
                                <div className="app-deal-prices" style={{ display: 'flex', flexDirection: 'column', marginTop: '2px', gap: '4px' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span className="deal-price-val" style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-bold)' }}>₹{deal.dealPrice.toFixed(2)}</span>
                                    <span className="deal-price-cb" style={{ fontSize: '9px', color: '#10b981', fontWeight: '700' }}>+₹{deal.cashbackEarned.toFixed(2)} CB</span>
                                  </div>
                                  <div style={{ display: 'flex', gap: '4px', marginTop: '2px' }}>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        const targetStore = { platform: deal.platform || 'Amazon', link: deal.affiliateUrl || deal.link };
                                        executeSimulatorGrabDeal(deal, targetStore);
                                      }}
                                      style={{
                                        flex: 1,
                                        backgroundColor: '#ff4f2f',
                                        color: '#fff',
                                        border: 'none',
                                        borderRadius: '4px',
                                        padding: '4px 0',
                                        fontSize: '9px',
                                        fontWeight: '700',
                                        cursor: 'pointer'
                                      }}
                                    >
                                      Shop
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    {/* Category horizontal scroll container */}
                    <div style={{ width: '100%', marginTop: '4px' }}>
                      <h3 style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-bold)', marginBottom: '10px' }}>
                        Shop by Category
                      </h3>
                      <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '4px', scrollbarWidth: 'none' }}>
                        {CATEGORIES.map((cat) => {
                          const isActive = selectedCategory === cat.id || 
                            (selectedCategory && cat.slug && selectedCategory.toLowerCase() === cat.slug.toLowerCase()) ||
                            (selectedCategory && selectedCategory.toLowerCase() === cat.name.toLowerCase());
                          return (
                            <div
                              key={cat.id || cat.slug || cat.name}
                              onClick={() => setSelectedCategory(cat.slug || cat.id)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '8px 12px',
                                borderRadius: '99px',
                                backgroundColor: isActive ? 'var(--primary)' : 'var(--card-bg)',
                                color: isActive ? '#fff' : 'var(--text)',
                                border: isActive ? '1px solid var(--primary)' : '1px solid var(--border)',
                                fontSize: '11px',
                                fontWeight: '700',
                                whiteSpace: 'nowrap',
                                cursor: 'pointer',
                                flexShrink: 0,
                                boxShadow: isActive ? '0 4px 10px rgba(255, 79, 47, 0.2)' : 'none'
                              }}
                            >
                              <CategoryIcon
                                icon={cat.icon}
                                iconType={cat.iconType}
                                customIconUrl={cat.customIconUrl}
                                color={isActive ? '#fff' : (cat.badgeColor || 'var(--primary)')}
                                size={13}
                              />
                              <span>{cat.name}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Popular Stores Grid (Filtered) */}
                    <div style={{ width: '100%' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <h3 style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-bold)' }}>
                          Popular Retailers
                        </h3>
                        <span 
                          onClick={() => setActiveTab('stores')}
                          style={{ fontSize: '11px', fontWeight: '700', color: 'var(--primary)', cursor: 'pointer' }}
                        >
                          See All
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '6px', scrollbarWidth: 'none' }}>
                        {storesData
                          .filter(s => selectedCategory === 'all' || s.category === selectedCategory)
                          .slice(0, 6)
                          .map((store) => (
                            <div 
                              key={store.id} 
                              onClick={() => handleStoreClick(store)}
                              style={{
                                flexShrink: 0,
                                width: '110px',
                                backgroundColor: 'var(--card-bg)',
                                border: '1px solid var(--border)',
                                borderRadius: '12px',
                                padding: '10px',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                textAlign: 'center',
                                gap: '8px',
                                cursor: 'pointer',
                                boxShadow: 'var(--shadow)'
                              }}
                            >
                              <div style={{
                                width: '44px',
                                height: '44px',
                                backgroundColor: '#fff',
                                border: '1px solid var(--border)',
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '6px'
                              }}>
                                <img src={store.logo} alt={store.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', width: '100%' }}>
                                <h4 style={{ margin: 0, fontSize: '11px', fontWeight: '800', color: 'var(--text-bold)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {store.name}
                                </h4>
                                <span style={{ fontSize: '9px', fontWeight: '700', color: '#10b981' }}>
                                  Up to {store.cashbackRate}
                                </span>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>

                    {/* Hot Deals Grid/Scroll */}
                    <div style={{ width: '100%' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <h3 style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-bold)' }}>
                          Top Cashback Deals
                        </h3>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                        {dealsData
                          .filter(d => {
                            if (!selectedCategory || selectedCategory === 'all') return true;
                            const normSelected = selectedCategory.toLowerCase();
                            const normCat = (d.category || '').toLowerCase();
                            return normCat === normSelected ||
                                   (normSelected === 'fashion' && (normCat === 'clothing' || normCat === 'shoes' || normCat === 'fashion')) ||
                                   (normSelected === 'health' && (normCat === 'beauty' || normCat === 'health')) ||
                                   normCat.includes(normSelected) ||
                                   normSelected.includes(normCat);
                          })
                          .slice(0, 60)
                          .map(deal => (
                            <div 
                              key={deal.id} 
                              className="app-deal-item" 
                              onClick={() => handleGrabDeal(deal)}
                              style={{
                                width: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                boxShadow: 'var(--shadow)'
                              }}
                            >
                              <div style={{
                                width: '100%',
                                height: '90px',
                                backgroundColor: '#fff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '8px',
                                borderBottom: '1px solid var(--border)'
                              }}>
                                <img src={deal.image} alt={deal.title} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                              </div>
                              <div className="app-deal-info" style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                                <h4 style={{
                                  margin: 0,
                                  fontSize: '11px',
                                  fontWeight: '700',
                                  color: 'var(--text-bold)',
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical',
                                  overflow: 'hidden',
                                  height: '32px',
                                  lineHeight: '1.4'
                                }}>
                                  {deal.title}
                                </h4>
                                <div className="app-deal-prices" style={{ display: 'flex', flexDirection: 'column', marginTop: '2px', gap: '4px' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span className="deal-price-val" style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-bold)' }}>₹{deal.dealPrice.toFixed(2)}</span>
                                    <span className="deal-price-cb" style={{ fontSize: '9px', color: '#10b981', fontWeight: '700' }}>+₹{deal.cashbackEarned.toFixed(2)} CB</span>
                                  </div>
                                  <div style={{ display: 'flex', gap: '4px', marginTop: '2px' }}>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        const targetStore = { platform: deal.platform || 'Amazon', link: deal.affiliateUrl || deal.link };
                                        executeSimulatorGrabDeal(deal, targetStore);
                                      }}
                                      style={{
                                        flex: 1,
                                        backgroundColor: '#ff4f2f',
                                        color: '#fff',
                                        border: 'none',
                                        borderRadius: '4px',
                                        padding: '4px 0',
                                        fontSize: '9px',
                                        fontWeight: '700',
                                        cursor: 'pointer'
                                      }}
                                    >
                                      ⚡ Buy
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleGrabDeal(deal);
                                      }}
                                      style={{
                                        backgroundColor: 'var(--bg)',
                                        color: 'var(--text)',
                                        border: '1px solid var(--border)',
                                        borderRadius: '4px',
                                        padding: '4px 6px',
                                        fontSize: '8px',
                                        fontWeight: '600',
                                        cursor: 'pointer'
                                      }}
                                    >
                                      Compare
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>

                    {/* How it works simple text */}
                    <div className="app-how-it-works-card">
                      <h3>How to Earn Cashback:</h3>
                      <ol>
                        <li>Click <strong>Shop & Earn</strong> inside any store.</li>
                        <li>Purchase product on the merchant site.</li>
                        <li>Your sale is tracked (viewable in the **Track** tab).</li>
                        <li>Once return policy expires, cashback is transferred to your wallet!</li>
                      </ol>
                    </div>
                  </>
                )}
              </div>
            )}

        {/* TAB 2: STORES GRID */}
        {activeTab === 'stores' && (
          <div className="mobile-screen-tab-panel animate-fade">
            <div className="app-search-box">
              <Search size={16} />
              <input 
                type="text" 
                placeholder="Search Myntra, Flipkart, Amazon..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>

            <h3 style={{ margin: '14px 0 8px', fontSize: '15px', color: 'var(--text-bold)', fontWeight: '700' }}>Cashback Partners</h3>
            <div className="app-stores-list">
              {storesData
                .filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()))
                .map(store => (
                  <div key={store.id} className="app-store-row" onClick={() => handleStoreClick(store)}>
                    <img src={store.logo} alt={store.name} />
                    <div className="app-store-row-info">
                      <h4>{store.name}</h4>
                      <p>Up to {store.cashbackRate} Cashback</p>
                    </div>
                    <button className="app-store-go-btn">
                      Shop <ArrowRight size={12} />
                    </button>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* TAB 3: PRODUCT TRACKING TIMELINE */}
        {activeTab === 'track' && (
          <div className="mobile-screen-tab-panel animate-fade">
            <div className="app-tab-title-header">
              <h3>Track My Cashback</h3>
              <p>Verify delivery progress and return policy cooldowns</p>
            </div>

            {isGuest ? (
              <div className="app-empty-state-card">
                <AlertCircle size={32} style={{ color: 'var(--primary)', marginBottom: '8px' }} />
                <h4>Login Required</h4>
                <p>Please login to view active product cashback tracking cycles.</p>
                <button className="app-login-btn" style={{ margin: '12px auto 0' }} onClick={openAuthModal}>Login / Sign Up</button>
              </div>
            ) : userTrackedOrders.length === 0 ? (
              <div className="app-empty-state-card">
                <Clock size={32} style={{ color: 'var(--text)', opacity: 0.5, marginBottom: '8px' }} />
                <h4>No Tracked Purchases Yet</h4>
                <p>Click on any deal or store to shop. When merchant registers your click-purchase, it will appear here instantly.</p>
                <button className="app-mini-btn" style={{ margin: '12px auto 0' }} onClick={() => setActiveTab('stores')}>Browse Stores</button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {userTrackedOrders.map(item => {
                  const statusInfo = getUserReturnInfo(item);
                  return (
                    <div 
                      key={item.id} 
                      className={`app-track-card ${item.status}`}
                      onClick={() => setSelectedOrder(item)}
                    >
                      <div className="app-track-card-header">
                        <span className="app-track-id">{item.id}</span>
                        <span className="app-track-platform">{item.platform}</span>
                      </div>
                      
                      <h4 className="app-track-product-name">{item.productName}</h4>
                      
                      <div className="app-track-values">
                        <span>Price: <strong>₹{item.price.toFixed(2)}</strong></span>
                        <span className="app-track-cb-val">+₹{item.cashbackAmount.toFixed(2)} CB</span>
                      </div>

                      <div className="app-track-status-progress">
                        <span className="app-status-text">
                          Status: <strong>{item.status.toUpperCase().replace('_', ' ')}</strong>
                        </span>
                        <span style={{ fontSize: '11px', color: statusInfo.color, fontWeight: '700' }}>
                          {statusInfo.text}
                        </span>
                      </div>
                      
                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px', fontSize: '11px', color: 'var(--primary)', fontWeight: '600' }}>
                        Click to view timeline stepper &rarr;
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: WALLET & CASHBACK WITHDRAWALS */}
        {activeTab === 'wallet' && (
          <div className="mobile-screen-tab-panel animate-fade">
            {/* Wallet balance display */}
            <div className="app-wallet-details-card">
              <h4>My Cashback Wallet</h4>
              
              <div className="app-wallet-balance-row">
                <div className="wallet-bal-box">
                  <span className="wallet-bal-lbl">CONFIRMED</span>
                  <span className="wallet-bal-num" style={{ color: '#10b981' }}>
                    ₹{user.wallet.confirmed.toFixed(2)}
                  </span>
                </div>
                <div className="wallet-bal-box">
                  <span className="wallet-bal-lbl">PENDING</span>
                  <span className="wallet-bal-num" style={{ color: '#f59e0b' }}>
                    ₹{user.wallet.pending.toFixed(2)}
                  </span>
                </div>
              </div>

              <p className="wallet-disclaimer">* Only confirmed cashback (after return policy window closure) is withdrawable. Minimum threshold is ₹10.00.</p>
            </div>

            {/* Request Withdrawal Form */}
            <div className="app-withdrawal-form-card">
              <h3>Request Bank Transfer</h3>
              <form onSubmit={handleRequestWithdrawal}>
                <div className="app-input-group">
                  <label>Amount (₹)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    placeholder="Enter amount (min ₹10)" 
                    value={withdrawAmount}
                    onChange={e => setWithdrawAmount(e.target.value)}
                  />
                </div>

                <div className="app-input-group">
                  <label>Linked UPI Address / Account</label>
                  <input 
                    type="text" 
                    placeholder="e.g. username@paytm" 
                    value={upiId}
                    onChange={e => setUpiId(e.target.value)}
                  />
                </div>

                <button 
                  type="submit" 
                  className="app-withdraw-submit-btn"
                  disabled={withdrawLoading || user.wallet.confirmed < 10}
                  style={{
                    opacity: (user.wallet.confirmed < 10) ? 0.6 : 1,
                    cursor: (user.wallet.confirmed < 10) ? 'not-allowed' : 'pointer'
                  }}
                >
                  {withdrawLoading ? 'Sending request to Admin...' : 'Request Instant Payout'}
                </button>
              </form>
            </div>

            {/* Invite link share */}
            <div className="app-invite-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Gift size={16} style={{ color: 'var(--primary)' }} />
                <h3>Your Referral Code</h3>
              </div>
              <p>Share this link to claim lifetime 10% commission on referrals.</p>
              <div className="app-referral-copy-box">
                <input type="text" readOnly value={refLink} />
                <button onClick={handleCopyLink}>
                  {copiedLink ? <Check size={14} /> : <Copy size={14} />}
                </button>
              </div>
            </div>
          </div>
        )}
        {activeTab === 'ledger' && (
          <div className="mobile-screen-tab-panel animate-fade">
            {isGuest ? (
              <div className="app-empty-state-card">
                <AlertCircle size={32} style={{ color: 'var(--primary)', marginBottom: '8px' }} />
                <h4>Login Required</h4>
                <p>Please login to view your financial ledger.</p>
                <button className="app-login-btn" style={{ margin: '12px auto 0' }} onClick={openAuthModal}>Login / Sign Up</button>
              </div>
            ) : (
              <UserLedger currentUser={currentUser} onAddNotification={onAddNotification} />
            )}
          </div>
        )}
        {activeTab === 'support' && (
          <div className="mobile-screen-tab-panel animate-fade">
            {isGuest ? (
              <div className="app-empty-state-card">
                <AlertCircle size={32} style={{ color: 'var(--primary)', marginBottom: '8px' }} />
                <h4>Login Required</h4>
                <p>Please login to access the support system.</p>
                <button className="app-login-btn" style={{ margin: '12px auto 0' }} onClick={openAuthModal}>Login / Sign Up</button>
              </div>
            ) : (
              <UserSupport currentUser={currentUser} onAddNotification={onAddNotification} />
            )}
          </div>
        )}
      </>
    )}
  </div>

      {/* App Mobile Stepper Details Modal */}
      {selectedOrder && (
        <div className="mobile-app-modal-backdrop" onClick={() => setSelectedOrder(null)}>
          <div className="mobile-app-modal-content animate-fade" onClick={e => e.stopPropagation()}>
            <div className="mobile-app-modal-header">
              <h4>Order Track Status</h4>
              <button className="app-modal-close" onClick={() => setSelectedOrder(null)}>x</button>
            </div>
            
            <div className="mobile-app-modal-body">
              <div className="app-modal-meta-box">
                <span className="meta-lbl">Product:</span>
                <strong className="meta-val">{selectedOrder.productName}</strong>
                
                <span className="meta-lbl">Retailer:</span>
                <strong className="meta-val" style={{ color: 'var(--primary)' }}>{selectedOrder.platform}</strong>

                <span className="meta-lbl">Cashback Earned:</span>
                <strong className="meta-val" style={{ color: '#10b981' }}>+₹{selectedOrder.cashbackAmount.toFixed(2)}</strong>
              </div>

              {/* Vertical Mobile Stepper */}
              <div className="mobile-app-stepper">
                
                {/* Step 1 */}
                <div className="mobile-app-step-item completed">
                  <div className="mobile-app-step-circle"><Check size={10} /></div>
                  <div className="mobile-app-step-details">
                    <h5>Order Placed</h5>
                    <p>Tracked ID linked on click-out.</p>
                    <span className="step-time">{selectedOrder.orderDate}</span>
                  </div>
                </div>

                {/* Step 2 */}
                <div className={`mobile-app-step-item ${['confirmed', 'shipped', 'delivered', 'return_active', 'completed'].includes(selectedOrder.status) ? 'completed' : selectedOrder.status === 'ordered' ? 'active' : ''}`}>
                  <div className="mobile-app-step-circle">
                    {['confirmed', 'shipped', 'delivered', 'return_active', 'completed'].includes(selectedOrder.status) ? <Check size={10} /> : ''}
                  </div>
                  <div className="mobile-app-step-details">
                    <h5>Merchant Confirmed</h5>
                    <p>Sale validated by partner store.</p>
                    {selectedOrder.confirmedDate && <span className="step-time">{selectedOrder.confirmedDate}</span>}
                  </div>
                </div>

                {/* Step 3 */}
                <div className={`mobile-app-step-item ${['shipped', 'delivered', 'return_active', 'completed'].includes(selectedOrder.status) ? 'completed' : selectedOrder.status === 'confirmed' ? 'active' : ''}`}>
                  <div className="mobile-app-step-circle">
                    {['shipped', 'delivered', 'return_active', 'completed'].includes(selectedOrder.status) ? <Check size={10} /> : ''}
                  </div>
                  <div className="mobile-app-step-details">
                    <h5>Package Dispatched</h5>
                    <p>Product shipped by merchant retailer.</p>
                    {selectedOrder.shippedDate && <span className="step-time">{selectedOrder.shippedDate}</span>}
                  </div>
                </div>

                {/* Step 4 */}
                <div className={`mobile-app-step-item ${['delivered', 'return_active', 'completed'].includes(selectedOrder.status) ? 'completed' : selectedOrder.status === 'shipped' ? 'active' : ''}`}>
                  <div className="mobile-app-step-circle">
                    {['delivered', 'return_active', 'completed'].includes(selectedOrder.status) ? <Check size={10} /> : ''}
                  </div>
                  <div className="mobile-app-step-details">
                    <h5>Order Delivered</h5>
                    <p>Return policy window started.</p>
                    {selectedOrder.deliveredDate && <span className="step-time">{selectedOrder.deliveredDate}</span>}
                  </div>
                </div>

                {/* Step 5 */}
                {selectedOrder.status === 'returned' ? (
                  <div className="mobile-app-step-item failed">
                    <div className="mobile-app-step-circle">x</div>
                    <div className="mobile-app-step-details">
                      <h5>Returned & Refunded</h5>
                      <p>Refund claimed. Cashback cancelled.</p>
                    </div>
                  </div>
                ) : (
                  <div className={`mobile-app-step-item ${selectedOrder.status === 'completed' ? 'completed' : selectedOrder.status === 'return_active' ? 'active' : ''}`}>
                    <div className="mobile-app-step-circle">
                      {selectedOrder.status === 'completed' ? <Check size={10} /> : ''}
                    </div>
                    <div className="mobile-app-step-details">
                      <h5>Return Cooldown Period</h5>
                      <p>{selectedOrder.returnWindowDays}-day return conditions active.</p>
                      {selectedOrder.status === 'return_active' && (
                        <span className="app-countdown-badge">
                          Under review until {selectedOrder.returnExpiryDate}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Step 6 */}
                {selectedOrder.status !== 'returned' && (
                  <div className={`mobile-app-step-item ${selectedOrder.status === 'completed' ? 'completed' : ''}`}>
                    <div className="mobile-app-step-circle">
                      {selectedOrder.status === 'completed' ? <Check size={10} /> : ''}
                    </div>
                    <div className="mobile-app-step-details">
                      <h5>Cashback Unlocked</h5>
                      <p>Clearance passed. Coins withdrawable.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <button className="app-modal-btn" onClick={() => setSelectedOrder(null)}>Close Timeline</button>
          </div>
        </div>
      )}

      {/* Bottom Tab Menu */}
      <nav className="mobile-app-nav">
        <div 
          className={`app-nav-item ${activeTab === 'home' ? 'active' : ''}`}
          onClick={() => setActiveTab('home')}
        >
          <Home size={18} />
          <span>Home</span>
        </div>

        <div 
          className={`app-nav-item ${activeTab === 'stores' ? 'active' : ''}`}
          onClick={() => setActiveTab('stores')}
        >
          <ShoppingBag size={18} />
          <span>Stores</span>
        </div>

        <div 
          className={`app-nav-item ${activeTab === 'track' ? 'active' : ''}`}
          onClick={() => setActiveTab('track')}
        >
          <Clock size={18} />
          <span>Track</span>
        </div>

        <div 
          className={`app-nav-item ${activeTab === 'ledger' ? 'active' : ''}`}
          onClick={() => setActiveTab('ledger')}
        >
          <BookOpen size={18} />
          <span>Ledger</span>
        </div>

        <div 
          className={`app-nav-item ${activeTab === 'support' ? 'active' : ''}`}
          onClick={() => setActiveTab('support')}
        >
          <HelpCircle size={18} />
          <span>Support</span>
        </div>

        <div 
          className={`app-nav-item ${activeTab === 'wallet' ? 'active' : ''}`}
          onClick={() => setActiveTab('wallet')}
        >
          <Wallet size={18} />
          <span>Wallet</span>
        </div>
      </nav>
    </div>
  );
}
