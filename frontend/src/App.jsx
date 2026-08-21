import React, { useState, useEffect } from 'react';
import { StyleSheet, View, StatusBar, Platform, SafeAreaView } from 'react-native';
import MobileApp from './components/MobileApp';
import AuthModal from './components/AuthModal';
import Notification from './components/Notification';
import StoreDetail from './components/StoreDetail';
import { apiTracking, apiWithdrawals, apiProducts, apiUsers, apiStores, apiDeals, apiAffiliate, apiWallet } from './services/api';

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

const mapProductsToDeals = (productsList, dbDealsList, storesData) => {
  let combinedDeals = [];
  const storesLogoMap = storesData?.reduce((acc, store) => { acc[store.name] = store.logo; return acc; }, {}) || {};
  const fallbackLogo = 'https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg';

  // 1. Process custom / newly added products FIRST
  if (productsList && productsList.length > 0) {
    const activeProducts = productsList.filter(p => p && (p.status === 'active' || p.status === 'ACTIVE' || p.isActive === true || p.status === undefined || p.status === null));
    const productDeals = activeProducts.map(p => {
      const platform = p.platform || p.sourcePlatform || 'Amazon';
      const storeLogo = storesLogoMap[platform] || fallbackLogo;
      
      let category = (p.category || '').toLowerCase();
      const prodName = p.name || p.title || 'Product';
      const lowerName = prodName.toLowerCase();
      const lowerPlatform = platform.toLowerCase();
      
      if (!category) {
        if (lowerPlatform === 'myntra' || lowerPlatform === 'ajio' || lowerName.includes('shoes') || lowerName.includes('clothing') || lowerName.includes('boots') || lowerName.includes('wear')) {
          category = 'fashion';
        } else if (lowerPlatform === 'nykaa beauty' || lowerName.includes('cleanser') || lowerName.includes('cream') || lowerName.includes('facial') || lowerName.includes('beauty')) {
          category = 'health';
        } else if (lowerPlatform === 'makemytrip' || lowerName.includes('flight') || lowerName.includes('hotel') || lowerName.includes('trip')) {
          category = 'travel';
        } else if (lowerName.includes('headphones') || lowerName.includes('laptop') || lowerName.includes('phone') || lowerName.includes('tv') || lowerName.includes('speaker')) {
          category = 'electronics';
        } else {
          category = 'electronics';
        }
      }
      
      const dealPrice = typeof p.price === 'number' ? p.price : (parseFloat(p.price || p.dealPrice || '999') || 999);
      const retailPrice = parseFloat((dealPrice * 1.5).toFixed(2));
      const cashbackVal = p.cashbackValue || p.commissionPercentage || 10;
      const cashbackEarned = parseFloat(((dealPrice * cashbackVal) / 100).toFixed(2));
      
      return {
        id: p.id,
        title: prodName,
        name: prodName,
        platform: platform,
        retailPrice,
        dealPrice,
        cashbackEarned,
        cashbackValue: cashbackVal,
        category,
        storeLogo,
        image: p.image || (p.images && p.images[0]) || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300'
      };
    });
    combinedDeals = [...combinedDeals, ...productDeals];
  }

  // 2. Process explicit deals
  if (dbDealsList && dbDealsList.length > 0) {
    const explicitDeals = dbDealsList.filter(d => d.status === 'active' || d.status === 'ACTIVE' || d.isActive === true).map(d => {
      let lowestListedPrice = 0;
      let highestCashbackPercent = 0;
      if (d.comparisons && d.comparisons.length > 0) {
        lowestListedPrice = Math.min(...d.comparisons.map(c => c.listedPrice || 0));
        highestCashbackPercent = Math.max(...d.comparisons.map(c => c.cashbackPercent || 0));
      }
      const dealPrice = lowestListedPrice > 0 ? lowestListedPrice : 0;
      const retailPrice = dealPrice > 0 ? parseFloat((dealPrice * 1.5).toFixed(2)) : 0;
      const cashbackEarned = dealPrice > 0 ? parseFloat(((dealPrice * highestCashbackPercent) / 100).toFixed(2)) : 0;
      return {
        ...d,
        title: d.name || d.title,
        platform: d.platform || (d.comparisons && d.comparisons.length > 0 ? d.comparisons[0].platform : 'Amazon'),
        category: (d.category || 'electronics').toLowerCase(),
        storeLogo: storesLogoMap['Amazon'] || fallbackLogo,
        retailPrice,
        dealPrice,
        cashbackEarned,
      };
    });
    combinedDeals = [...combinedDeals, ...explicitDeals];
  }

  return combinedDeals;
};

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [trackedOrders, setTrackedOrders] = useState([]);
  const [withdrawRequests, setWithdrawRequests] = useState([]);
  const [products, setProducts] = useState([]);
  const [deals, setDeals] = useState([]);
  const [storesData, setStoresData] = useState([]);
  const [currentView, setCurrentView] = useState('home');
  const [selectedStoreId, setSelectedStoreId] = useState(null);
  const [theme, setTheme] = useState('light');

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  // 1. Fetch static catalog data once on mount
  useEffect(() => {
    const loadCatalogData = async () => {
      try {
        const [productsData, dbDeals, storesRes] = await Promise.all([
          apiProducts.getAll().catch(e => { console.warn('Products failed:', e); return []; }),
          apiDeals.getAll().catch(e => { console.warn('Deals failed:', e); return []; }),
          apiStores.getAll().catch(e => { console.warn('Stores failed:', e); return []; })
        ]);
        setProducts(productsData || []);
        setDeals(dbDeals || []);
        setStoresData((storesRes && storesRes.length > 0) ? storesRes : DEFAULT_STORES);
      } catch (err) {
        console.error('Failed to load catalog data:', err);
      }
    };
    loadCatalogData();
  }, []);

  // 2. Fetch user-specific transactional data on login/logout
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
    
    const fetchUserWallet = async () => {
      try {
        const walletData = await apiWallet.getBalance(currentUser.id);
        if (walletData) {
          setCurrentUser(prev => {
            if (!prev) return null;
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
            // Save updated session to localStorage so it stays fresh across reloads
            localStorage.setItem('user_session', JSON.stringify(updated));
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
    return () => clearInterval(interval);
  }, [currentUser?.id, currentView]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shareId = params.get('shareId');
    if (shareId) {
      localStorage.setItem('shareId', shareId);
    }
  }, []);

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
    } catch (err) {
      console.error('Failed to request app withdrawal:', err);
    }
  };

  const addNotification = (message, type = 'success') => {
    const id = Date.now();
    setNotifications((prev) => [...prev, { id, message, type }]);
  };

  const removeNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  useEffect(() => {
    window.handleShareDeal = async (productId) => {
      if (!currentUser) {
        addNotification('Please log in to share deals.', 'error');
        return;
      }
      try {
        const { apiAffiliate } = await import('./services/api');
        const res = await apiAffiliate.createShare(currentUser.id, productId);
        const link = `${window.location.origin}/?shareId=${res.shareId}`;
        navigator.clipboard.writeText(link);
        addNotification('Share link copied to clipboard!', 'success');
      } catch (err) {
        console.error(err);
        addNotification('Failed to generate share link.', 'error');
      }
    };
  }, [currentUser]);

  const handleLogin = async (userProfile) => {
    try {
      await apiUsers.login(userProfile);
      setCurrentUser(userProfile);
      addNotification(`Logged in successfully as ${userProfile.name}!`, 'success');
    } catch (e) {
      console.error(e);
      addNotification('Failed to login to server.', 'error');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    addNotification('Logged out successfully.', 'info');
  };

  const selectedStore = storesData.find((s) => s.id === selectedStoreId);

  // Map and cache dynamic product deals
  const dynamicDeals = React.useMemo(() => mapProductsToDeals(products, deals, storesData), [products, deals, storesData]);

  // Intercept Grab Deal
  const handleInterceptGrabDeal = async (deal) => {
    if (!currentUser) {
      addNotification('Please login or sign up first to grab deals!', 'info');
      setIsAuthModalOpen(true);
      return;
    }
    try {
      const shareId = localStorage.getItem('shareId');
      const buyerId = currentUser.id;
      await apiAffiliate.createClick(buyerId, shareId, deal.id);
      addNotification('Tracker activated! Redirecting...', 'info');
    } catch (e) {
      console.error('Tracking failed, proceeding anyway.', e);
    }
  };

  return (
    <SafeAreaView style={[styles.container, theme === 'dark' ? styles.containerDark : styles.containerLight]}>
      <StatusBar 
        barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} 
        backgroundColor={theme === 'dark' ? '#090d16' : '#ffffff'} 
      />
      <Notification 
        notifications={notifications} 
        removeNotification={removeNotification} 
        theme={theme}
      />
      
      {currentView === 'home' && (
        <MobileApp
          currentUser={currentUser}
          trackedOrders={trackedOrders}
          withdrawRequests={withdrawRequests}
          onAddWithdrawalRequest={handleAppWithdrawalRequest}
          onUpdateUser={setCurrentUser}
          storesData={storesData}
          dealsData={dynamicDeals}
          onAddNotification={addNotification}
          openAuthModal={() => setIsAuthModalOpen(true)}
          onLogout={handleLogout}
          theme={theme}
          toggleTheme={toggleTheme}
          onGrabDeal={handleInterceptGrabDeal}
          onStoreSelect={(id) => {
            setSelectedStoreId(id);
            setCurrentView('store');
          }}
        />
      )}

      {currentView === 'store' && selectedStore && (
        <StoreDetail
          store={selectedStore}
          onBack={() => setCurrentView('home')}
          onAddNotification={addNotification}
          deals={dynamicDeals.filter(d => {
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
            if (d.storeId && d.storeId === selectedStore.id) return true;

            // 3. Match from comparisons array
            if (d.comparisons && d.comparisons.length > 0) {
              const hasMatchingComp = d.comparisons.some(c => {
                if (!c.platform) return false;
                const compPlatform = c.platform.trim().toLowerCase();
                return compPlatform === storeName || compPlatform.includes(storeName) || storeName.includes(compPlatform);
              });
              if (hasMatchingComp) return true;
            }

            return false;
          })}
          onGrabDeal={handleInterceptGrabDeal}
          currentUser={currentUser}
          openAuthModal={() => setIsAuthModalOpen(true)}
          theme={theme}
        />
      )}

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLogin={handleLogin}
        theme={theme}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  containerLight: {
    backgroundColor: '#ffffff',
  },
  containerDark: {
    backgroundColor: '#090d16',
  },
});