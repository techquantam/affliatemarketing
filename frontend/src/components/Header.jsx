import React, { useState, useRef, useEffect } from 'react';
import { Search, Sun, Moon, ShoppingBag, User, Wallet, LogOut, ChevronDown, Folder, Tag, Bell, CheckSquare } from 'lucide-react';

const DEFAULT_CATEGORIES = [
  { id: 'fashion', name: 'Fashion' },
  { id: 'electronics', name: 'Electronics' },
  { id: 'health', name: 'Health & Beauty' },
  { id: 'grocery', name: 'Food & Grocery' },
  { id: 'travel', name: 'Travel & Flights' },
];

export default function Header({
  currentView,
  setView,
  theme,
  toggleTheme,
  currentUser,
  onLogout,
  openAuthModal,
  storesData,
  onStoreSelect,
  setHomeSearchQuery,
  dealsData = [],
  categoriesData = [],
  onCategorySelect,
  onDealSelect,
  dashboardTab,
  setDashboardTab,
  userNotifications = [],
  onMarkAllNotificationsRead,
  onMarkNotificationRead,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const searchRef = useRef(null);

  // Active categories list
  const activeCategories = (categoriesData && categoriesData.length > 0)
    ? categoriesData.filter(c => c && (c.status === 'active' || c.status === undefined))
    : DEFAULT_CATEGORIES;

  // Filter stores, categories, and deals based on search query
  const getSuggestions = () => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    
    const isBlacklisted = (str) => {
      if (!str || typeof str !== 'string') return false;
      const s = str.toLowerCase().replace(/[\s_\-]+/g, '');
      return s.includes('shopsy') || s.includes('shopysy') || s.includes('smartmart');
    };

    const matchedStores = (storesData || [])
      .filter(store => (store.status === 'active' || store.status === 'ACTIVE' || !store.status) && !isBlacklisted(store.name) && (store.name || '').toLowerCase().includes(query))
      .slice(0, 4)
      .map(store => ({
        type: 'store',
        id: store.id,
        name: store.name,
        logo: store.logo,
        badge: `Up to ${store.cashbackRate} Cashback`,
        original: store
      }));
      
    const matchedCategories = activeCategories
      .filter(cat => (cat.name || '').toLowerCase().includes(query) || (cat.slug || '').toLowerCase().includes(query))
      .slice(0, 3)
      .map(cat => ({
        type: 'category',
        id: cat.slug || cat.id,
        name: cat.name,
        badge: 'Category'
      }));
      
    const matchedDeals = (dealsData || [])
      .filter(deal => 
        !isBlacklisted(deal.title) &&
        !isBlacklisted(deal.name) &&
        !isBlacklisted(deal.platform) &&
        ((deal.title || '').toLowerCase().includes(query) ||
        (deal.name || '').toLowerCase().includes(query))
      )
      .slice(0, 4)
      .map(deal => {
        const dealPrice = typeof deal.dealPrice === 'number' && deal.dealPrice > 0 
          ? deal.dealPrice 
          : (typeof deal.price === 'number' && deal.price > 0 ? deal.price : (parseFloat(deal.dealPrice || deal.price || '0') || 0));
        const cbVal = typeof deal.cashbackEarned === 'number' && deal.cashbackEarned > 0 
          ? deal.cashbackEarned 
          : (parseFloat(deal.cashbackEarned || deal.cashbackAmount || '0') || 0);
        return {
          type: 'deal',
          id: deal.id,
          name: deal.title || deal.name,
          logo: deal.image,
          badge: `₹${dealPrice.toFixed(2)}${cbVal > 0 ? ` (+₹${cbVal.toFixed(2)} CB)` : ''}`,
          original: deal
        };
      });
      
    return [...matchedStores, ...matchedCategories, ...matchedDeals];
  };

  const suggestions = getSuggestions();

  useEffect(() => {
    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSuggestionClick = (item) => {
    if (item.type === 'store') {
      onStoreSelect(item.id);
    } else if (item.type === 'category') {
      if (onCategorySelect) {
        onCategorySelect(item.id);
      }
    } else if (item.type === 'deal') {
      if (onDealSelect) {
        onDealSelect(item.original);
      }
    }
    setSearchQuery('');
    setShowSuggestions(false);
  };

  return (
    <header className="header-wrapper">
      <div className="header-container">
        {/* Logo */}
        <div className="logo-section" onClick={() => setView('home')}>
          <img src="/logo.webp" alt="Lio Mart Logo" className="logo-img" style={{ width: '40px', height: '40px', objectFit: 'contain' }} />
          <h1 className="logo-text">
            LIO<span> MART</span>
          </h1>
        </div>

        {/* Search bar */}
        <div className="search-bar-container" ref={searchRef}>
          <div className="search-input-wrapper">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Search products, brands, categories or stores..."
              className="search-input"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  if (setHomeSearchQuery) {
                    setHomeSearchQuery(searchQuery);
                    setView('home');
                    setShowSuggestions(false);
                  }
                }
              }}
            />
          </div>

          {/* Autocomplete Suggestions */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="search-suggestions">
              {suggestions.map((item) => (
                <div
                  key={`${item.type}-${item.id}`}
                  className="suggestion-item animate-fade"
                  onClick={() => handleSuggestionClick(item)}
                >
                  {item.type === 'store' && (
                    <img src={item.logo} alt="" className="suggestion-img" />
                  )}
                  {item.type === 'deal' && (
                    item.logo ? (
                      <img src={item.logo} alt="" className="suggestion-img" />
                    ) : (
                      <div style={{
                        width: '28px',
                        height: '28px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '4px',
                        backgroundColor: 'var(--bg)',
                        border: '1px solid var(--border)',
                        color: 'var(--primary)',
                        flexShrink: 0
                      }}>
                        <Tag size={14} />
                      </div>
                    )
                  )}
                  {item.type === 'category' && (
                    <div style={{
                      width: '28px',
                      height: '28px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '4px',
                      backgroundColor: 'var(--bg)',
                      border: '1px solid var(--border)',
                      color: 'var(--primary)',
                      flexShrink: 0
                    }}>
                      <Folder size={14} />
                    </div>
                  )}
                  <span className="suggestion-text">{item.name}</span>
                  <span 
                    className="suggestion-tag"
                    style={{
                      color: item.type === 'category' ? '#3b82f6' : item.type === 'deal' ? '#f59e0b' : '#10b981'
                    }}
                  >
                    {item.badge}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Navigation links */}
        <nav className="nav-links">
          <button
            className={`nav-link ${currentView === 'home' ? 'active' : ''}`}
            onClick={() => setView('home')}
          >
            Home
          </button>
          <button
            className={`nav-link ${currentView === 'dashboard' && dashboardTab === 'url-converter' ? 'active' : ''}`}
            onClick={() => {
              if (currentUser) {
                if (setDashboardTab) setDashboardTab('url-converter');
                setView('dashboard');
              } else {
                openAuthModal();
              }
            }}
          >
            Convert Link
          </button>
          <button
            className={`nav-link ${currentView === 'dashboard' && dashboardTab !== 'url-converter' ? 'active' : ''}`}
            onClick={() => {
              if (currentUser) {
                if (setDashboardTab) setDashboardTab('overview');
                setView('dashboard');
              } else {
                openAuthModal();
              }
            }}
          >
            My Wallet
          </button>
          <a href="#how-it-works" className="nav-link" onClick={() => setView('home')}>
            How it Works
          </a>
          <button
            className={`nav-link ${currentView === 'admin-login' || currentView === 'admin-panel' ? 'active' : ''}`}
            onClick={() => setView('admin-login')}
            style={{ fontWeight: '700', color: 'var(--primary)' }}
          >
            Admin Panel
          </button>
        </nav>

        {/* Actions (theme toggle, login, user dashboard badge) */}
        <div className="header-actions">
          <button onClick={toggleTheme} className="theme-toggle-btn" aria-label="Toggle theme">
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>

          {currentUser && (
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                className="theme-toggle-btn"
                title="Notifications"
                style={{ border: 'none', position: 'relative', cursor: 'pointer' }}
              >
                <Bell size={18} />
                {userNotifications.filter(n => !n.read).length > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '-2px',
                    right: '-2px',
                    backgroundColor: '#ef4444',
                    color: '#fff',
                    borderRadius: '50%',
                    width: '14px',
                    height: '14px',
                    fontSize: '9px',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {userNotifications.filter(n => !n.read).length}
                  </span>
                )}
              </button>

              {showNotifDropdown && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: '10px',
                  width: '320px',
                  backgroundColor: 'var(--card-bg, #ffffff)',
                  border: '1px solid var(--border, #e2e8f0)',
                  borderRadius: '12px',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                  zIndex: 2000,
                  display: 'flex',
                  flexDirection: 'column',
                  maxHeight: '400px'
                }}>
                  {/* Header */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 16px',
                    borderBottom: '1px solid var(--border)',
                    boxSizing: 'border-box'
                  }}>
                    <span style={{ fontWeight: '700', fontSize: '13px', color: 'var(--text-bold)' }}>Notifications</span>
                    {userNotifications.filter(n => !n.read).length > 0 && (
                      <button
                        onClick={() => {
                          if (onMarkAllNotificationsRead) onMarkAllNotificationsRead();
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--secondary, #10b981)',
                          fontSize: '11px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <CheckSquare size={12} /> Mark all read
                      </button>
                    )}
                  </div>

                  {/* List */}
                  <div style={{ overflowY: 'auto', flex: 1, maxHeight: '320px' }}>
                    {userNotifications.length === 0 ? (
                      <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text)', opacity: 0.6, fontSize: '12px' }}>
                        No notifications yet.
                      </div>
                    ) : (
                      userNotifications.map(notif => (
                        <div
                          key={notif.id}
                          onClick={() => {
                            if (onMarkNotificationRead) onMarkNotificationRead(notif.id);
                          }}
                          style={{
                            padding: '12px 16px',
                            borderBottom: '1px solid var(--border)',
                            backgroundColor: notif.read ? 'transparent' : 'rgba(99, 102, 241, 0.05)',
                            cursor: 'pointer',
                            transition: 'background-color 0.2s',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '4px',
                            textAlign: 'left',
                            boxSizing: 'border-box'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                            <span style={{
                              fontWeight: notif.read ? '500' : '700',
                              fontSize: '12px',
                              color: 'var(--text-bold)'
                            }}>
                              {notif.title}
                            </span>
                            <span style={{ fontSize: '9px', opacity: 0.5, whiteSpace: 'nowrap' }}>
                              {notif.createdAt ? new Date(notif.createdAt).toLocaleDateString('en-IN') : ''}
                            </span>
                          </div>
                          <p style={{
                            margin: 0,
                            fontSize: '11px',
                            color: 'var(--text)',
                            lineHeight: '1.4',
                            opacity: notif.read ? 0.75 : 0.95
                          }}>
                            {notif.message}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {currentUser ? (
            <div className="user-profile-badge" onClick={() => setView('dashboard')}>
              <div className="user-avatar">{currentUser.name ? currentUser.name[0].toUpperCase() : 'U'}</div>
              <div className="user-info">
                <span className="user-name">Hey, {currentUser.name || 'User'}</span>
                <span className="user-wallet">
                  {currentUser.wallet && currentUser.wallet.confirmed != null 
                    ? `₹${currentUser.wallet.confirmed.toFixed(2)}` 
                    : (currentUser.role === 'ADMIN' || currentUser.isAdmin ? 'Admin' : '₹0.00')}
                </span>
              </div>
              <ChevronDown size={14} style={{ color: 'var(--text)', opacity: 0.5 }} />
            </div>
          ) : (
            <button className="btn-primary" onClick={openAuthModal}>
              Login / Sign Up
            </button>
          )}

          {currentUser && (
            <button
              onClick={onLogout}
              className="theme-toggle-btn"
              title="Logout"
              style={{ border: 'none', color: '#ef4444' }}
            >
              <LogOut size={18} />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
