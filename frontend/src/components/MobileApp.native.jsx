import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  Share,
  Modal,
  SafeAreaView,
  Dimensions,
  Linking
} from 'react-native';
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
  Play,
  User,
  LogOut,
  Send,
  AlertCircle,
  Sun,
  Moon,
  Layers,
  Shirt,
  Smartphone,
  Heart,
  ShoppingCart,
  Plane,
  Calculator,
  Sparkles,
  Star,
  ChevronDown,
  ArrowLeft,
  ExternalLink,
  ShieldAlert
} from 'lucide-react-native';

const { width } = Dimensions.get('window');
const cardWidth = (width - 44) / 2;

// --- HERO SLIDES DATA ---
const HERO_SLIDES = [
  {
    id: 1,
    tag: 'Limited Time Bonanza',
    title: 'Earn Real Cashback.\nWithdraw to Bank.',
    desc: 'Shop at Amazon, Ajio, Flipkart & 500+ stores via LIO MART and get paid real cash on top of store discounts!',
    cta: 'Browse Top Offers',
    storeName: 'Myntra Fashion',
    cashbackRate: '12%',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/b/bc/Myntra_Logo.png',
  },
  {
    id: 2,
    tag: 'Electronics Mega Deal',
    title: 'Up to 8% Cashback\non Gadgets & Tech',
    desc: 'Upgrade your phone, laptop, or home devices. Get guaranteed cashback rates and active merchant coupons.',
    cta: 'Shop Electronics Now',
    storeName: 'Flipkart Electronics',
    cashbackRate: '8.5%',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/7/7a/Flipkart_logo.svg',
  },
  {
    id: 3,
    tag: 'Referral Bonanza',
    title: 'Refer Friends.\nGet 10% Forever!',
    desc: 'Share your personal referral link with friends. Earn a flat 10% of the cashback they earn, for life!',
    cta: 'Invite Friends Now',
    storeName: 'Ajio Deals',
    cashbackRate: '15%',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/c/c9/Ajio_Logo.svg',
  },
];

// --- CATEGORIES DATA ---
const CATEGORIES = [
  { id: 'all', name: 'All Stores', icon: Layers },
  { id: 'fashion', name: 'Fashion', icon: Shirt },
  { id: 'electronics', name: 'Electronics', icon: Smartphone },
  { id: 'health', name: 'Health & Beauty', icon: Heart },
  { id: 'grocery', name: 'Food & Grocery', icon: ShoppingCart },
  { id: 'travel', name: 'Travel & Flights', icon: Plane },
];

// --- TESTIMONIALS DATA ---
const TESTIMONIALS = [
  { id: 1, name: 'Aarav S.', rating: '⭐⭐⭐⭐微', text: 'Earned over ₹320 cashback in just 3 months. The bank transfer was instant. Highly recommended!' },
  { id: 2, name: 'Riya M.', rating: '⭐⭐⭐⭐⭐', text: 'Love the secure tracking timeline. I can see exactly when my cashback will unlock.' },
  { id: 3, name: 'Vikram K.', rating: '⭐⭐⭐⭐⭐', text: 'Lio Mart tracking is flawless. Best affiliate platform right now.' },
];

import { getProductPlatformUrl, getStoreUrl } from '../utils/openUrl';

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
  
  if (deal.comparisons && deal.comparisons.length > 0) {
    return deal.comparisons.map(comp => {
      const platformName = comp.platform || 'Amazon';
      const store = STORES_INFO.find(s => s.platform.toLowerCase() === platformName.toLowerCase()) || STORES_INFO[0];
      const dealPrice = comp.listedPrice || comp.dealPrice || deal.dealPrice || 0;
      const cashbackPercent = comp.cashbackPercent || store.cashbackPercent || 10;
      const cashbackEarned = parseFloat(((dealPrice * cashbackPercent) / 100).toFixed(2));
      const effectivePrice = parseFloat((dealPrice - cashbackEarned).toFixed(2));
      const link = comp.link || getProductPlatformUrl(deal, platformName);
      return {
        platform: platformName,
        logo: comp.logo || store.logo,
        dealPrice,
        cashbackPercent,
        cashbackEarned,
        effectivePrice,
        link,
        isOriginal: platformName.toLowerCase() === (deal.platform || '').toLowerCase()
      };
    }).sort((a, b) => a.effectivePrice - b.effectivePrice);
  }

  let platforms = ['Amazon', 'Flipkart'];
  if (deal.category === 'fashion') {
    platforms = ['Myntra', 'Ajio', 'Flipkart', 'Amazon'];
  } else if (deal.category === 'health' || deal.category === 'beauty') {
    platforms = ['Nykaa Beauty', 'Amazon', 'Flipkart'];
  } else if (deal.category === 'travel') {
    platforms = ['MakeMyTrip', 'Amazon'];
  } else {
    platforms = ['Amazon', 'Flipkart', 'Myntra', 'Ajio'];
  }

  return platforms.map(platformName => {
    const store = STORES_INFO.find(s => s.platform === platformName) || STORES_INFO[0];
    
    let dealPrice = deal.dealPrice || 0;
    if (platformName !== deal.platform) {
      const hash = platformName.split('').reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
      const percentDiff = ((hash % 21) - 10) / 100; // -10% to +10%
      dealPrice = parseFloat((dealPrice * (1 + percentDiff)).toFixed(2));
    }
    
    const cashbackValue = store.cashbackPercent;
    const cashbackEarned = parseFloat(((dealPrice * cashbackValue) / 100).toFixed(2));
    const effectivePrice = parseFloat((dealPrice - cashbackEarned).toFixed(2));
    const link = getProductPlatformUrl(deal, platformName);
    
    return {
      platform: platformName,
      logo: store.logo,
      dealPrice,
      cashbackPercent: cashbackValue,
      cashbackEarned,
      effectivePrice,
      link,
      isOriginal: platformName === deal.platform
    };
  }).sort((a, b) => a.effectivePrice - b.effectivePrice);
};

export default function MobileApp({
  currentUser,
  trackedOrders = [],
  withdrawRequests = [],
  onAddWithdrawalRequest,
  storesData = [],
  dealsData = [],
  onAddNotification,
  openAuthModal,
  onLogout,
  onGrabDeal,
  theme = 'light',
  toggleTheme,
  onStoreSelect
}) {
  const [activeTab, setActiveTab] = useState('home');
  const [copiedLink, setCopiedLink] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  
  // Carousel active state
  const [activeSlide, setActiveSlide] = useState(0);

  // Spend controls state (savings calculator)
  const [fashionSpend, setFashionSpend] = useState(100);
  const [electronicsSpend, setElectronicsSpend] = useState(150);
  const [grocerySpend, setGrocerySpend] = useState(200);
  const [travelSpend, setTravelSpend] = useState(250);
  
  // Withdrawal Form States
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [upiId, setUpiId] = useState('');
  const [withdrawLoading, setWithdrawLoading] = useState(false);

  // Selected Order for tracking modal
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [comparisonDeal, setComparisonDeal] = useState(null);

  // Auto-play hero slider
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  // Theme support mapping
  const isDark = theme === 'dark';
  const themeStyles = {
    container: {
      backgroundColor: isDark ? '#090d16' : '#f8fafc',
    },
    header: {
      backgroundColor: isDark ? '#111827' : '#ffffff',
      borderBottomColor: isDark ? '#1f2937' : '#e5e7eb',
    },
    text: {
      color: isDark ? '#f3f4f6' : '#0f172a',
    },
    textMuted: {
      color: isDark ? '#9ca3af' : '#6b7280',
    },
    card: {
      backgroundColor: isDark ? '#111827' : '#ffffff',
      borderColor: isDark ? '#1f2937' : '#e5e7eb',
      borderWidth: isDark ? 1 : 0,
    },
    input: {
      backgroundColor: isDark ? '#111827' : '#ffffff',
      borderColor: isDark ? '#374151' : '#d1d5db',
      color: isDark ? '#f3f4f6' : '#111827',
    },
    bottomNav: {
      backgroundColor: isDark ? '#111827' : '#ffffff',
      borderTopColor: isDark ? '#1f2937' : '#e5e7eb',
    },
    activeNavItem: {
      backgroundColor: isDark ? '#1a202c' : '#f9fafb',
    },
    borderTop: {
      borderTopColor: isDark ? '#1f2937' : '#e2e8f0',
    }
  };

  const isGuest = !currentUser;
  const user = currentUser || {
    name: 'Guest User',
    wallet: { confirmed: 0.00, pending: 0.00, referral: 0.00 }
  };

  const refLink = `${window.location.origin}/join?ref=${user.name.toLowerCase().replace(' ', '')}`;
  const userTrackedOrders = trackedOrders.filter(o => o.userName === user.name);

  const handleShareLink = async () => {
    try {
      await Share.share({
        message: `Join Lio Mart Cashback and earn real money back on every purchase! Here's my link: ${refLink}`,
      });
      setCopiedLink(true);
      onAddNotification('Referral link shared!', 'success');
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (error) {
      console.error(error);
    }
  };

  const handleGrabDeal = (deal) => {
    setComparisonDeal(deal);
  };

  const executeSimulatorGrabDeal = (dealItem, storeItem) => {
    setComparisonDeal(null);
    onAddNotification(`Opening ${storeItem.platform}... Cashback tracking activated!`, 'success');
    
    const link = storeItem?.link || dealItem?.affiliateUrl || dealItem?.link || getProductPlatformUrl(dealItem, storeItem?.platform);
    Linking.openURL(link).catch(() => {
      Linking.openURL('https://www.amazon.in');
    });
  };

  const handleStoreClick = (store) => {
    if (onStoreSelect) {
      onStoreSelect(store.id);
    } else {
      onAddNotification(`Opening ${store.name}... Tracking active!`, 'success');
      const storeUrl = store.affiliateUrl || store.link || getStoreUrl(store.name);
      Linking.openURL(storeUrl).catch(() => Linking.openURL('https://google.com'));
    }
  };

  const handleRequestWithdrawal = () => {
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
    onAddNotification('Submitting withdrawal request to Admin...', 'info');

    setTimeout(() => {
      const newRequest = {
        userName: user.name,
        coins: Math.round(amount * 100),
        amount: amount,
        upiId: upiId,
        date: new Date().toISOString().split('T')[0],
      };
      
      onAddWithdrawalRequest(newRequest);
      
      setWithdrawAmount('');
      setUpiId('');
      setWithdrawLoading(false);
      onAddNotification('Withdrawal requested successfully! Awaiting Admin approval.', 'success');
    }, 1800);
  };

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

  // Filter stores
  const filteredStores = storesData
    .filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .filter(s => activeCategory === 'all' || s.category === activeCategory);

  const slide = HERO_SLIDES[activeSlide];

  // Savings Calculator Math
  const fashionRate = 0.12;
  const electronicsRate = 0.05;
  const groceryRate = 0.04;
  const travelRate = 0.08;

  const monthlyCashback =
    fashionSpend * fashionRate +
    electronicsSpend * electronicsRate +
    grocerySpend * groceryRate +
    travelSpend * travelRate;

  const yearlyCashback = monthlyCashback * 12;

  const renderCalculatorControl = (label, value, setValue, step, max, rateLabel) => {
    return (
      <View style={styles.calcControl}>
        <View style={styles.calcControlLabelRow}>
          <Text style={[styles.calcControlName, themeStyles.text]}>{label}</Text>
          <Text style={styles.calcControlRate}>{rateLabel}</Text>
        </View>
        <View style={styles.calcControlActionRow}>
          <TouchableOpacity 
            style={styles.calcBtn} 
            onPress={() => setValue(prev => Math.max(0, prev - step))}
          >
            <Text style={styles.calcBtnText}>-</Text>
          </TouchableOpacity>
          <Text style={[styles.calcValueText, themeStyles.text]}>₹{value} / mo</Text>
          <TouchableOpacity 
            style={styles.calcBtn} 
            onPress={() => setValue(prev => Math.min(max, prev + step))}
          >
            <Text style={styles.calcBtnText}>+</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.calcProgressTrack}>
          <View style={[styles.calcProgressFill, { width: `${(value / max) * 100}%` }]} />
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, themeStyles.container]}>
      {/* Top Application Header */}
      <View style={[styles.header, themeStyles.header]}>
        <View style={styles.branding}>
          <Image source={{ uri: '/logo.webp' }} style={{ width: 28, height: 28, marginRight: 8 }} resizeMode="contain" />
          <Text style={[styles.brandingText, themeStyles.text]}>LIO</Text>
          <Text style={styles.brandingSubText}> MART</Text>
        </View>
        
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={toggleTheme} style={styles.themeToggle}>
            {isDark ? <Sun size={18} color="#f59e0b" /> : <Moon size={18} color="#4b5563" />}
          </TouchableOpacity>

          {isGuest ? (
            <TouchableOpacity style={[styles.loginBtn, { backgroundColor: '#ff4f2f' }]} onPress={openAuthModal}>
              <Text style={styles.loginBtnText}>Login</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.userProfile}>
              <View style={[styles.userAvatar, { backgroundColor: '#ff4f2f' }]}>
                <Text style={styles.userAvatarText}>{user.name[0].toUpperCase()}</Text>
              </View>
              <TouchableOpacity style={styles.logoutIcon} onPress={onLogout}>
                <LogOut size={16} color="#ef4444" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      {/* Main Screen Content Scroll */}
      <ScrollView style={styles.screenContent} contentContainerStyle={{ paddingBottom: 80 }}>
        
        {/* TAB 1: HOME SCREEN */}
        {activeTab === 'home' && (
          <View style={styles.tabPanel}>
            
            {/* 1. Hero Slide Carousel */}
            <View style={[styles.heroWrapper, themeStyles.card]}>
              <View style={styles.heroContent}>
                <View style={styles.heroTagRow}>
                  <Sparkles size={12} color="#ff4f2f" />
                  <Text style={styles.heroTagText}>{slide.tag}</Text>
                </View>
                <Text style={[styles.heroTitle, themeStyles.text]}>{slide.title}</Text>
                <Text style={[styles.heroDesc, themeStyles.textMuted]}>{slide.desc}</Text>
                
                <TouchableOpacity 
                  style={[styles.heroCta, { backgroundColor: '#ff4f2f' }]}
                  onPress={() => {
                    if (slide.id === 3) {
                      setActiveTab('wallet');
                    } else {
                      setActiveTab('stores');
                    }
                  }}
                >
                  <Text style={styles.heroCtaText}>{slide.cta}</Text>
                  <ArrowRight size={12} color="#fff" />
                </TouchableOpacity>
              </View>

              <View style={styles.heroGraphics}>
                <View style={[styles.heroImageCard, { borderColor: isDark ? '#1f2937' : '#e5e7eb' }]}>
                  <Image source={{ uri: slide.logo }} style={styles.heroCardLogo} resizeMode="contain" />
                  <View style={styles.heroCardDeal}>
                    <Text style={styles.heroCardRate}>{slide.cashbackRate} CB</Text>
                  </View>
                </View>
              </View>

              {/* Slider pagination dots */}
              <View style={styles.heroDots}>
                {HERO_SLIDES.map((_, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[styles.heroDot, index === activeSlide && styles.heroDotActive]}
                    onPress={() => setActiveSlide(index)}
                  />
                ))}
              </View>
            </View>

            {/* Wallet Quick Summary */}
            <View style={[styles.quickWallet, { backgroundColor: isDark ? '#1a1008' : '#fff5f0', borderColor: '#ffcfc7', borderWidth: 1 }]}>
              <View style={styles.quickWalletHeader}>
                <Text style={[styles.quickWalletTitle, { color: '#ff4f2f' }]}>Cashback Wallet Balance</Text>
                <TrendingUp size={16} color="#10b981" />
              </View>
              <Text style={[styles.quickWalletBalance, { color: isDark ? '#ff7e5a' : '#ff4f2f' }]}>
                ₹{(user.wallet.confirmed + user.wallet.pending).toFixed(2)}
              </Text>
              <View style={[styles.quickWalletBreakdown, { borderTopColor: 'rgba(255, 79, 47, 0.15)' }]}>
                <Text style={[styles.quickWalletBreakdownText, { color: isDark ? '#ffcfc7' : '#6b211a' }]}>
                  Confirmed: <Text style={styles.boldText}>₹{user.wallet.confirmed.toFixed(2)}</Text>
                </Text>
                <Text style={[styles.quickWalletBreakdownText, { color: isDark ? '#ffcfc7' : '#6b211a' }]}>
                  Pending: <Text style={styles.boldText}>₹{user.wallet.pending.toFixed(2)}</Text>
                </Text>
              </View>
            </View>

            {/* 2. Shop by Category filter scroll */}
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleWrap}>
                <Layers size={18} color="#ff4f2f" />
                <Text style={[styles.sectionTitle, themeStyles.text]}>Shop by Category</Text>
              </View>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isSelected = activeCategory === cat.id;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.categoryCard,
                      themeStyles.card,
                      isSelected && { backgroundColor: '#ff4f2f', borderColor: '#ff4f2f' }
                    ]}
                    onPress={() => {
                      setActiveCategory(cat.id);
                      if (cat.id !== 'all') {
                        onAddNotification(`Filtered by ${cat.name}`, 'info');
                      }
                    }}
                  >
                    <Icon size={16} color={isSelected ? '#fff' : '#ff4f2f'} />
                    <Text style={[styles.categoryCardText, themeStyles.text, isSelected && { color: '#fff', fontWeight: '700' }]}>
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* 3. Popular Cashback Retailers */}
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleWrap}>
                <ShieldCheck size={18} color="#ff4f2f" />
                <Text style={[styles.sectionTitle, themeStyles.text]}>Popular Retailers</Text>
              </View>
              <TouchableOpacity onPress={() => { setActiveTab('stores'); setActiveCategory('all'); }}>
                <Text style={styles.seeAllBtnText}>See All</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.homeStoresGrid}>
              {filteredStores.slice(0, 4).map(store => (
                <TouchableOpacity key={store.id} style={[styles.homeStoreCard, themeStyles.card]} onPress={() => handleStoreClick(store)}>
                  {store.isPopular && (
                    <View style={styles.storePopularTag}>
                      <Star size={8} color="#fff" fill="#fff" />
                      <Text style={styles.storePopularTagText}>Popular</Text>
                    </View>
                  )}
                  <View style={styles.storeLogoBox}>
                    <Image source={{ uri: store.logo }} style={styles.storeLogoImg} resizeMode="contain" />
                  </View>
                  <Text style={[styles.storeCardName, themeStyles.text]}>{store.name}</Text>
                  <Text style={styles.storeCardRate}>Up to {store.cashbackRate} CB</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* 4. Top Deals horizontal scroll */}
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleWrap}>
                <Gift size={18} color="#ff4f2f" />
                <Text style={[styles.sectionTitle, themeStyles.text]}>Top Deals of the Day</Text>
              </View>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dealsScroll} contentContainerStyle={{ paddingRight: 16 }}>
              {dealsData.map(deal => {
                const discountPercent = Math.round(((deal.retailPrice - deal.dealPrice) / deal.retailPrice) * 100);
                const finalEffectivePrice = (deal.dealPrice - deal.cashbackEarned).toFixed(2);
                return (
                  <TouchableOpacity key={deal.id} style={[styles.homeDealCard, themeStyles.card]} onPress={() => handleGrabDeal(deal)}>
                    <View style={styles.dealDiscountTag}>
                      <Text style={styles.dealDiscountTagText}>{discountPercent}% OFF</Text>
                    </View>
                    <Image source={{ uri: deal.image }} style={styles.homeDealImage} resizeMode="contain" />
                    <View style={styles.homeDealInfo}>
                      <Text style={[styles.homeDealTitle, themeStyles.text]} numberOfLines={1}>{deal.title}</Text>
                      <View style={styles.homeDealPrices}>
                        <Text style={[styles.homeDealRetail, themeStyles.textMuted]}>₹{deal.retailPrice.toFixed(2)}</Text>
                        <Text style={[styles.homeDealSpecial, themeStyles.text]}>₹{deal.dealPrice.toFixed(2)}</Text>
                      </View>
                      <Text style={styles.homeDealCashback}>+₹{deal.cashbackEarned.toFixed(2)} CB</Text>
                      <View style={styles.homeDealEffectiveRow}>
                        <Text style={styles.homeDealEffectiveLabel}>Effective Price:</Text>
                        <Text style={styles.homeDealEffectiveValue}>₹{finalEffectivePrice}</Text>
                      </View>
                      <TouchableOpacity style={[styles.homeDealGrabBtn, { backgroundColor: '#ff4f2f' }]} onPress={() => handleGrabDeal(deal)}>
                        <Text style={styles.homeDealGrabBtnText}>Grab Deal</Text>
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* 5. Savings Calculator */}
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleWrap}>
                <Calculator size={18} color="#ff4f2f" />
                <Text style={[styles.sectionTitle, themeStyles.text]}>Interactive Savings Calculator</Text>
              </View>
            </View>

            <View style={[styles.calculatorCard, themeStyles.card]}>
              <Text style={[styles.calcDescText, themeStyles.textMuted]}>
                Estimate your annual earnings based on monthly spends:
              </Text>
              {renderCalculatorControl('Fashion & Lifestyle', fashionSpend, setFashionSpend, 50, 1000, '12% CB')}
              {renderCalculatorControl('Electronics & Mobiles', electronicsSpend, setElectronicsSpend, 100, 2000, '5% CB')}
              {renderCalculatorControl('Food & Daily Groceries', grocerySpend, setGrocerySpend, 50, 1000, '4% CB')}
              {renderCalculatorControl('Travel & Hotel Bookings', travelSpend, setTravelSpend, 100, 3000, '8% CB')}

              <View style={[styles.calcResultBox, { backgroundColor: isDark ? 'rgba(255, 79, 47, 0.08)' : '#fff5f3', borderColor: '#ffcfc7', borderWidth: 1 }]}>
                <Text style={[styles.calcResultLabel, themeStyles.text]}>Estimated Annual Payout</Text>
                <Text style={styles.calcResultAmount}>₹{yearlyCashback.toFixed(0)}</Text>
                <Text style={styles.calcResultDetail}>
                  Based on a monthly spend of ₹{fashionSpend + electronicsSpend + grocerySpend + travelSpend}. Withdrawable directly to bank account!
                </Text>
              </View>
            </View>

            {/* 6. Testimonials */}
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleWrap}>
                <CheckCircle size={18} color="#ff4f2f" />
                <Text style={[styles.sectionTitle, themeStyles.text]}>What Users Say</Text>
              </View>
            </View>
            
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.testimonialsScroll}>
              {TESTIMONIALS.map(t => (
                <View key={t.id} style={[styles.testimonialCard, themeStyles.card]}>
                  <Text style={styles.testimonialRating}>{t.rating}</Text>
                  <Text style={[styles.testimonialText, themeStyles.textMuted]}>"{t.text}"</Text>
                  <Text style={[styles.testimonialName, themeStyles.text]}>- {t.name}</Text>
                </View>
              ))}
            </ScrollView>

            {/* 7. Footer */}
            <View style={[styles.footer, themeStyles.borderTop]}>
              <View style={styles.brandingCenter}>
                <Image source={{ uri: '/logo.webp' }} style={{ width: 24, height: 24, marginRight: 6 }} resizeMode="contain" />
                <Text style={[styles.brandingText, themeStyles.text]}>LIO</Text>
                <Text style={styles.brandingSubText}> MART</Text>
              </View>
              <Text style={[styles.footerText, themeStyles.textMuted]}>Save Real Money & Coupons at 500+ Stores</Text>
              <Text style={styles.footerCopyright}>© 2026 LIO MART Affiliate Marketing.</Text>
            </View>

          </View>
        )}

        {/* TAB 2: STORES GRID */}
        {activeTab === 'stores' && (
          <View style={styles.tabPanel}>
            <View style={[styles.searchBox, themeStyles.input]}>
              <Search size={16} color={isDark ? '#9ca3af' : '#6b7280'} />
              <TextInput 
                style={[styles.searchInput, { color: isDark ? '#f3f4f6' : '#111827' }]}
                placeholder="Search Myntra, Flipkart, Amazon..." 
                placeholderTextColor="#6b7280"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            {/* Categories filter Scroll in Stores Tab too */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={[styles.categoriesScroll, { marginBottom: 12 }]}>
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isSelected = activeCategory === cat.id;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.categoryCard,
                      themeStyles.card,
                      isSelected && { backgroundColor: '#ff4f2f', borderColor: '#ff4f2f' }
                    ]}
                    onPress={() => setActiveCategory(cat.id)}
                  >
                    <Icon size={16} color={isSelected ? '#fff' : '#ff4f2f'} />
                    <Text style={[styles.categoryCardText, themeStyles.text, isSelected && { color: '#fff', fontWeight: '700' }]}>
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <Text style={[styles.partnerTitle, themeStyles.text]}>Cashback Partners ({filteredStores.length})</Text>
            <View style={styles.storesList}>
              {filteredStores.map(store => (
                <TouchableOpacity key={store.id} style={[styles.storeRow, themeStyles.card]} onPress={() => handleStoreClick(store)}>
                  <Image source={{ uri: store.logo }} style={styles.storeLogo} resizeMode="contain" />
                  <View style={styles.storeRowInfo}>
                    <Text style={[styles.storeName, themeStyles.text]}>{store.name}</Text>
                    <Text style={styles.storeRate}>Up to {store.cashbackRate} Cashback</Text>
                  </View>
                  <View style={[styles.storeGoBtn, { backgroundColor: '#ff4f2f' }]}>
                    <Text style={styles.storeGoText}>Shop </Text>
                    <ArrowRight size={10} color="#fff" />
                  </View>
                </TouchableOpacity>
              ))}
              {filteredStores.length === 0 && (
                <View style={[styles.emptyStateCard, themeStyles.card]}>
                  <AlertCircle size={32} color="#ff4f2f" style={{ marginBottom: 8 }} />
                  <Text style={[styles.emptyStateTitle, themeStyles.text]}>No stores found</Text>
                  <Text style={[styles.emptyStateText, themeStyles.textMuted]}>Try typing another brand name or reset the category filter.</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* TAB 3: PRODUCT TRACKING TIMELINE */}
        {activeTab === 'track' && (
          <View style={styles.tabPanel}>
            <View style={styles.tabTitleHeader}>
              <Text style={[styles.tabTitle, themeStyles.text]}>Track My Cashback</Text>
              <Text style={[styles.tabSub, themeStyles.textMuted]}>Verify delivery progress and return policy cooldowns</Text>
            </View>

            {isGuest ? (
              <View style={[styles.emptyStateCard, themeStyles.card]}>
                <AlertCircle size={32} color="#ff4f2f" style={{ marginBottom: 8 }} />
                <Text style={[styles.emptyStateTitle, themeStyles.text]}>Login Required</Text>
                <Text style={[styles.emptyStateText, themeStyles.textMuted]}>Please login to view active product cashback tracking cycles.</Text>
                <TouchableOpacity style={[styles.loginBtn, { alignSelf: 'center', marginTop: 12, backgroundColor: '#ff4f2f' }]} onPress={openAuthModal}>
                  <Text style={styles.loginBtnText}>Login / Sign Up</Text>
                </TouchableOpacity>
              </View>
            ) : userTrackedOrders.length === 0 ? (
              <View style={[styles.emptyStateCard, themeStyles.card]}>
                <Clock size={32} color={isDark ? '#4b5563' : '#9ca3af'} style={{ marginBottom: 8 }} />
                <Text style={[styles.emptyStateTitle, themeStyles.text]}>No Tracked Purchases Yet</Text>
                <Text style={[styles.emptyStateText, themeStyles.textMuted]}>Click on any deal or store to shop. When merchant registers your purchase, it will appear here instantly.</Text>
                <TouchableOpacity style={[styles.loginBtn, { alignSelf: 'center', marginTop: 12, backgroundColor: '#ff4f2f' }]} onPress={() => setActiveTab('stores')}>
                  <Text style={styles.loginBtnText}>Browse Stores</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={{ gap: 12 }}>
                {userTrackedOrders.map(item => {
                  const statusInfo = getUserReturnInfo(item);
                  return (
                    <TouchableOpacity 
                      key={item.id} 
                      style={[styles.trackCard, themeStyles.card, styles[item.status]]}
                      onPress={() => setSelectedOrder(item)}
                    >
                      <View style={styles.trackCardHeader}>
                        <Text style={[styles.trackId, themeStyles.text]}>{item.id}</Text>
                        <Text style={styles.trackPlatform}>{item.platform}</Text>
                      </View>
                      
                      <Text style={[styles.trackProductName, themeStyles.text]}>{item.productName}</Text>
                      
                      <View style={styles.trackValues}>
                        <Text style={[styles.trackValueText, themeStyles.textMuted]}>Price: <Text style={[styles.boldText, themeStyles.text]}>₹{item.price.toFixed(2)}</Text></Text>
                        <Text style={styles.trackCbVal}>+₹{item.cashbackAmount.toFixed(2)} CB</Text>
                      </View>

                      <View style={[styles.trackStatusProgress, themeStyles.borderTop]}>
                        <Text style={[styles.trackStatusText, themeStyles.textMuted]}>
                          Status: <Text style={[styles.boldText, themeStyles.text]}>{item.status.toUpperCase().replace('_', ' ')}</Text>
                        </Text>
                        <Text style={{ fontSize: 11, color: statusInfo.color, fontWeight: '700' }}>
                          {statusInfo.text}
                        </Text>
                      </View>
                      
                      <Text style={styles.trackFooterText}>
                        Click to view timeline stepper &rarr;
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        )}

        {/* TAB 4: WALLET & CASHBACK WITHDRAWALS */}
        {activeTab === 'wallet' && (
          <View style={styles.tabPanel}>
            {/* Wallet balance display */}
            <View style={[styles.walletDetailsCard, { backgroundColor: isDark ? '#1a1008' : '#fff5f3', borderColor: '#ffcfc7', borderWidth: 1 }]}>
              <Text style={[styles.walletDetailsTitle, { color: isDark ? '#ffcfc7' : '#6b211a' }]}>My Cashback Wallet</Text>
              
              <View style={styles.walletBalanceRow}>
                <View style={[styles.walletBalBox, { backgroundColor: isDark ? 'rgba(255, 79, 47, 0.05)' : '#fff' }]}>
                  <Text style={[styles.walletBalLbl, themeStyles.textMuted]}>CONFIRMED</Text>
                  <Text style={[styles.walletBalNum, { color: '#10b981' }]}>
                    ₹{user.wallet.confirmed.toFixed(2)}
                  </Text>
                </View>
                <View style={[styles.walletBalBox, { backgroundColor: isDark ? 'rgba(255, 79, 47, 0.05)' : '#fff' }]}>
                  <Text style={[styles.walletBalLbl, themeStyles.textMuted]}>PENDING</Text>
                  <Text style={[styles.walletBalNum, { color: '#f59e0b' }]}>
                    ₹{user.wallet.pending.toFixed(2)}
                  </Text>
                </View>
              </View>

              <Text style={[styles.walletDisclaimer, { color: isDark ? '#ffcfc7' : '#6b211a' }]}>* Only confirmed cashback is withdrawable. Minimum threshold is ₹10.00.</Text>
            </View>

            {/* Request Withdrawal Form */}
            <View style={[styles.withdrawalFormCard, themeStyles.card]}>
              <Text style={[styles.formTitle, themeStyles.text]}>Request Bank Transfer</Text>
              
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, themeStyles.text]}>Amount (₹)</Text>
                <TextInput 
                  style={[styles.formInput, themeStyles.input]}
                  keyboardType="numeric"
                  placeholder="Enter amount (min ₹10)" 
                  placeholderTextColor="#9ca3af"
                  value={withdrawAmount}
                  onChangeText={setWithdrawAmount}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, themeStyles.text]}>Linked UPI Address / Account</Text>
                <TextInput 
                  style={[styles.formInput, themeStyles.input]}
                  autoCapitalize="none"
                  placeholder="e.g. username@paytm" 
                  placeholderTextColor="#9ca3af"
                  value={upiId}
                  onChangeText={setUpiId}
                />
              </View>

              <TouchableOpacity 
                style={[styles.withdrawSubmitBtn, user.wallet.confirmed < 10 && styles.disabledBtn, { backgroundColor: '#ff4f2f' }]}
                disabled={withdrawLoading || user.wallet.confirmed < 10}
                onPress={handleRequestWithdrawal}
              >
                <Text style={styles.withdrawSubmitBtnText}>
                  {withdrawLoading ? 'Sending request to Admin...' : 'Request Instant Payout'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Invite link share */}
            <View style={[styles.inviteCard, themeStyles.card]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Gift size={16} color="#ff4f2f" />
                <Text style={[styles.inviteCardTitle, themeStyles.text]}>Your Referral Code</Text>
              </View>
              <Text style={[styles.inviteCardText, themeStyles.textMuted]}>Share this link to claim lifetime 10% commission on referrals.</Text>
              <View style={[styles.referralCopyBox, themeStyles.input]}>
                <Text style={[styles.referralLink, themeStyles.text]} numberOfLines={1}>{refLink}</Text>
                <TouchableOpacity style={styles.copyBtn} onPress={handleShareLink}>
                  {copiedLink ? <Check size={14} color="#10b981" /> : <Copy size={14} color="#ff4f2f" />}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

      </ScrollView>

      {/* App Mobile Stepper Details Modal */}
      {selectedOrder && (
        <Modal
          visible={selectedOrder !== null}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setSelectedOrder(null)}
        >
          <View style={styles.modalBackdrop}>
            <View style={[styles.modalContent, themeStyles.card]}>
              <View style={[styles.modalHeader, themeStyles.borderTop]}>
                <Text style={[styles.modalTitle, themeStyles.text]}>Order Track Status</Text>
                <TouchableOpacity style={styles.modalClose} onPress={() => setSelectedOrder(null)}>
                  <Text style={styles.modalCloseText}>✕</Text>
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.modalBody}>
                <View style={[styles.modalMetaBox, { backgroundColor: isDark ? '#1a202c' : '#f9fafb' }]}>
                  <Text style={[styles.metaLabel, themeStyles.text]}>Product: <Text style={styles.metaValue}>{selectedOrder.productName}</Text></Text>
                  <Text style={[styles.metaLabel, themeStyles.text]}>Retailer: <Text style={[styles.metaValue, { color: '#ff4f2f' }]}>{selectedOrder.platform}</Text></Text>
                  <Text style={[styles.metaLabel, themeStyles.text]}>Cashback Earned: <Text style={[styles.metaValue, { color: '#10b981' }]}>+₹{selectedOrder.cashbackAmount.toFixed(2)}</Text></Text>
                </View>

                {/* Vertical Mobile Stepper */}
                <View style={styles.stepperContainer}>
                  
                  {/* Step 1 */}
                  <View style={[styles.stepItem, styles.stepCompleted]}>
                    <View style={styles.stepCircle}><Check size={10} color="#fff" /></View>
                    <View style={styles.stepDetails}>
                      <Text style={[styles.stepHeading, themeStyles.text]}>Order Placed</Text>
                      <Text style={[styles.stepSubText, themeStyles.textMuted]}>Tracked ID linked on click-out.</Text>
                      <Text style={styles.stepTime}>{selectedOrder.orderDate}</Text>
                    </View>
                  </View>

                  {/* Step 2 */}
                  <View style={[styles.stepItem, ['confirmed', 'shipped', 'delivered', 'return_active', 'completed'].includes(selectedOrder.status) ? styles.stepCompleted : selectedOrder.status === 'ordered' ? styles.stepActive : {}]}>
                    <View style={styles.stepCircle}>
                      {['confirmed', 'shipped', 'delivered', 'return_active', 'completed'].includes(selectedOrder.status) ? <Check size={10} color="#fff" /> : null}
                    </View>
                    <View style={styles.stepDetails}>
                      <Text style={[styles.stepHeading, themeStyles.text]}>Merchant Confirmed</Text>
                      <Text style={[styles.stepSubText, themeStyles.textMuted]}>Sale validated by partner store.</Text>
                      {selectedOrder.confirmedDate && <Text style={styles.stepTime}>{selectedOrder.confirmedDate}</Text>}
                    </View>
                  </View>

                  {/* Step 3 */}
                  <View style={[styles.stepItem, ['shipped', 'delivered', 'return_active', 'completed'].includes(selectedOrder.status) ? styles.stepCompleted : selectedOrder.status === 'confirmed' ? styles.stepActive : {}]}>
                    <View style={styles.stepCircle}>
                      {['shipped', 'delivered', 'return_active', 'completed'].includes(selectedOrder.status) ? <Check size={10} color="#fff" /> : null}
                    </View>
                    <View style={styles.stepDetails}>
                      <Text style={[styles.stepHeading, themeStyles.text]}>Package Dispatched</Text>
                      <Text style={[styles.stepSubText, themeStyles.textMuted]}>Product shipped by merchant retailer.</Text>
                      {selectedOrder.shippedDate && <Text style={styles.stepTime}>{selectedOrder.shippedDate}</Text>}
                    </View>
                  </View>

                  {/* Step 4 */}
                  <View style={[styles.stepItem, ['delivered', 'return_active', 'completed'].includes(selectedOrder.status) ? styles.stepCompleted : selectedOrder.status === 'shipped' ? styles.stepActive : {}]}>
                    <View style={styles.stepCircle}>
                      {['delivered', 'return_active', 'completed'].includes(selectedOrder.status) ? <Check size={10} color="#fff" /> : null}
                    </View>
                    <View style={styles.stepDetails}>
                      <Text style={[styles.stepHeading, themeStyles.text]}>Order Delivered</Text>
                      <Text style={[styles.stepSubText, themeStyles.textMuted]}>Return policy window started.</Text>
                      {selectedOrder.deliveredDate && <Text style={styles.stepTime}>{selectedOrder.deliveredDate}</Text>}
                    </View>
                  </View>

                  {/* Step 5 */}
                  {selectedOrder.status === 'returned' ? (
                    <View style={[styles.stepItem, styles.stepFailed]}>
                      <View style={styles.stepCircle}><Text style={{ color: '#fff', fontSize: 10 }}>✕</Text></View>
                      <View style={styles.stepDetails}>
                        <Text style={[styles.stepHeading, themeStyles.text]}>Returned & Refunded</Text>
                        <Text style={[styles.stepSubText, themeStyles.textMuted]}>Refund claimed. Cashback cancelled.</Text>
                      </View>
                    </View>
                  ) : (
                    <View style={[styles.stepItem, selectedOrder.status === 'completed' ? styles.stepCompleted : selectedOrder.status === 'return_active' ? styles.stepActive : {}]}>
                      <View style={styles.stepCircle}>
                        {selectedOrder.status === 'completed' ? <Check size={10} color="#fff" /> : null}
                      </View>
                      <View style={styles.stepDetails}>
                        <Text style={[styles.stepHeading, themeStyles.text]}>Return Cooldown Period</Text>
                        <Text style={[styles.stepSubText, themeStyles.textMuted]}>{selectedOrder.returnWindowDays}-day return conditions active.</Text>
                        {selectedOrder.status === 'return_active' && (
                          <View style={styles.countdownBadge}>
                            <Text style={styles.countdownBadgeText}>Under review until {selectedOrder.returnExpiryDate}</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  )}

                  {/* Step 6 */}
                  {selectedOrder.status !== 'returned' && (
                    <View style={[styles.stepItem, selectedOrder.status === 'completed' ? styles.stepCompleted : {}]}>
                      <View style={styles.stepCircle}>
                        {selectedOrder.status === 'completed' ? <Check size={10} color="#fff" /> : null}
                      </View>
                      <View style={styles.stepDetails}>
                        <Text style={[styles.stepHeading, themeStyles.text]}>Cashback Unlocked</Text>
                        <Text style={[styles.stepSubText, themeStyles.textMuted]}>Clearance passed. Coins withdrawable.</Text>
                      </View>
                    </View>
                  )}
                </View>
              </ScrollView>
              
              <TouchableOpacity style={styles.modalBtn} onPress={() => setSelectedOrder(null)}>
                <Text style={styles.modalBtnText}>Close Timeline</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {/* Price Comparison Modal */}
      {comparisonDeal && (
        <Modal
          visible={comparisonDeal !== null}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setComparisonDeal(null)}
        >
          <View style={styles.modalBackdrop}>
            <View style={[styles.modalContent, themeStyles.card, { maxHeight: '80%' }]}>
              <View style={[styles.modalHeader, themeStyles.borderTop]}>
                <Text style={[styles.modalTitle, themeStyles.text, { fontSize: 16 }]}>🔍 Compare Prices & Cashback</Text>
                <TouchableOpacity style={styles.modalClose} onPress={() => setComparisonDeal(null)}>
                  <Text style={styles.modalCloseText}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* Product header */}
              <View style={{ flexDirection: 'row', gap: 12, padding: 14, backgroundColor: isDark ? '#1a202c' : '#f8fafc', borderBottomWidth: 1, borderBottomColor: isDark ? '#2d3748' : '#edf2f7' }}>
                <Image
                  source={{ uri: comparisonDeal.image }}
                  style={{ width: 44, height: 44, borderRadius: 4, resizeMode: 'cover' }}
                />
                <View style={{ flex: 1, justifyContent: 'center' }}>
                  <Text style={[themeStyles.text, { fontSize: 13, fontWeight: '700' }]} numberOfLines={1}>
                    {comparisonDeal.title || comparisonDeal.name}
                  </Text>
                  <Text style={[themeStyles.textMuted, { fontSize: 10, textTransform: 'capitalize', marginTop: 2 }]}>
                    Category: {comparisonDeal.category}
                  </Text>
                </View>
              </View>

              <ScrollView style={[styles.modalBody, { padding: 14 }]}>
                <View style={{ gap: 10, paddingBottom: 20 }}>
                  {generatePriceComparisons(comparisonDeal).map((item, index) => {
                    const isBestValue = index === 0;
                    return (
                      <View
                        key={item.platform}
                        style={{
                          borderWidth: isBestValue ? 2 : 1,
                          borderColor: isBestValue ? '#10b981' : isDark ? '#2d3748' : '#e2e8f0',
                          borderRadius: 8,
                          padding: 12,
                          backgroundColor: isDark ? '#111827' : '#ffffff',
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          position: 'relative'
                        }}
                      >
                        {isBestValue && (
                          <View style={{
                            position: 'absolute',
                            top: -9,
                            left: 10,
                            backgroundColor: '#10b981',
                            paddingVertical: 1,
                            paddingHorizontal: 6,
                            borderRadius: 6
                          }}>
                            <Text style={{ color: '#ffffff', fontSize: 7, fontWeight: '800', textTransform: 'uppercase' }}>
                              🏆 Best Value
                            </Text>
                          </View>
                        )}

                        {/* Left Info */}
                        <View style={{ gap: 2 }}>
                          <Text style={[themeStyles.text, { fontSize: 12, fontWeight: '700' }]}>{item.platform}</Text>
                          <Text style={[themeStyles.textMuted, { fontSize: 9, textDecorationLine: 'line-through' }]}>
                            ₹{item.dealPrice.toFixed(2)}
                          </Text>
                          <Text style={{ fontSize: 9, color: '#10b981', fontWeight: '700' }}>
                            -{item.cashbackPercent}% Cashback
                          </Text>
                        </View>

                        {/* Right CTA */}
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                          <View style={{ alignItems: 'flex-end' }}>
                            <Text style={[themeStyles.textMuted, { fontSize: 8 }]}>Effective Price:</Text>
                            <Text style={{ fontSize: 13, fontWeight: '800', color: isBestValue ? '#10b981' : isDark ? '#f3f4f6' : '#0f172a' }}>
                              ₹{item.effectivePrice.toFixed(2)}
                            </Text>
                          </View>

                          <TouchableOpacity
                            style={{
                              backgroundColor: '#ff4f2f',
                              paddingVertical: 6,
                              paddingHorizontal: 10,
                              borderRadius: 4
                            }}
                            onPress={() => executeSimulatorGrabDeal(comparisonDeal, item)}
                          >
                            <Text style={{ color: '#ffffff', fontSize: 10, fontWeight: '700' }}>Buy</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </ScrollView>

              <TouchableOpacity style={[styles.modalBtn, { marginTop: 0 }]} onPress={() => setComparisonDeal(null)}>
                <Text style={styles.modalBtnText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {/* Bottom Tab Menu */}
      <View style={[styles.bottomNav, themeStyles.bottomNav]}>
        <TouchableOpacity 
          style={[styles.navItem, activeTab === 'home' && themeStyles.activeNavItem]}
          onPress={() => setActiveTab('home')}
        >
          <Home size={18} color={activeTab === 'home' ? '#ff4f2f' : '#6b7280'} />
          <Text style={[styles.navText, activeTab === 'home' && styles.activeNavText]}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.navItem, activeTab === 'stores' && themeStyles.activeNavItem]}
          onPress={() => setActiveTab('stores')}
        >
          <ShoppingBag size={18} color={activeTab === 'stores' ? '#ff4f2f' : '#6b7280'} />
          <Text style={[styles.navText, activeTab === 'stores' && styles.activeNavText]}>Stores</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.navItem, activeTab === 'track' && themeStyles.activeNavItem]}
          onPress={() => setActiveTab('track')}
        >
          <Clock size={18} color={activeTab === 'track' ? '#ff4f2f' : '#6b7280'} />
          <Text style={[styles.navText, activeTab === 'track' && styles.activeNavText]}>Track</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.navItem, activeTab === 'wallet' && themeStyles.activeNavItem]}
          onPress={() => setActiveTab('wallet')}
        >
          <Wallet size={18} color={activeTab === 'wallet' ? '#ff4f2f' : '#6b7280'} />
          <Text style={[styles.navText, activeTab === 'wallet' && styles.activeNavText]}>Wallet</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  branding: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandingCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  logoBullet: {
    width: 24,
    height: 24,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  logoBulletText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
  },
  brandingText: {
    fontSize: 16,
    fontWeight: '800',
  },
  brandingSubText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ff4f2f',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  themeToggle: {
    padding: 6,
  },
  loginBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 99,
  },
  loginBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  userProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  userAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userAvatarText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  logoutIcon: {
    padding: 4,
  },
  screenContent: {
    flex: 1,
  },
  tabPanel: {
    padding: 16,
  },
  // Hero Slide CSS mapping
  heroWrapper: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    minHeight: 180,
  },
  heroContent: {
    flex: 1.3,
    paddingRight: 8,
  },
  heroTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  heroTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#ff4f2f',
    textTransform: 'uppercase',
  },
  heroTitle: {
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 20,
    marginBottom: 6,
  },
  heroDesc: {
    fontSize: 11,
    lineHeight: 15,
    marginBottom: 10,
  },
  heroCta: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  heroCtaText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  heroGraphics: {
    flex: 0.8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroImageCard: {
    width: '100%',
    height: 100,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
    position: 'relative',
  },
  heroCardLogo: {
    width: '80%',
    height: '60%',
  },
  heroCardDeal: {
    position: 'absolute',
    bottom: -6,
    backgroundColor: '#10b981',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  heroCardRate: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
  },
  heroDots: {
    position: 'absolute',
    bottom: 8,
    right: 16,
    flexDirection: 'row',
    gap: 4,
  },
  heroDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#cbd5e1',
  },
  heroDotActive: {
    backgroundColor: '#ff4f2f',
    width: 12,
  },
  // Wallet Quick Summary
  quickWallet: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
  quickWalletHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  quickWalletTitle: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  quickWalletBalance: {
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 8,
  },
  quickWalletBreakdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    paddingTop: 8,
  },
  quickWalletBreakdownText: {
    fontSize: 12,
  },
  boldText: {
    fontWeight: '800',
  },
  // Categories Filter
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 10,
  },
  sectionTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  seeAllBtnText: {
    color: '#ff4f2f',
    fontSize: 11,
    fontWeight: '700',
  },
  categoriesScroll: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 99,
    marginRight: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
    elevation: 1,
  },
  categoryCardText: {
    fontSize: 12,
    fontWeight: '600',
  },
  // Popular Stores Grid
  homeStoresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  homeStoreCard: {
    width: '48%',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
    elevation: 1,
    marginBottom: 12,
  },
  storePopularTag: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: '#f59e0b',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  storePopularTagText: {
    color: '#fff',
    fontSize: 7,
    fontWeight: '700',
  },
  storeLogoBox: {
    width: 60,
    height: 40,
    backgroundColor: '#fff',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
    marginBottom: 8,
  },
  storeLogoImg: {
    width: '100%',
    height: '100%',
  },
  storeCardName: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 2,
  },
  storeCardRate: {
    fontSize: 11,
    color: '#10b981',
    fontWeight: '700',
  },
  // Top Deals horizontal scroll
  dealsScroll: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  homeDealCard: {
    width: 170,
    borderRadius: 12,
    padding: 10,
    marginRight: 12,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
    elevation: 1,
  },
  dealDiscountTag: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#ff4f2f',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    zIndex: 2,
  },
  dealDiscountTagText: {
    color: '#fff',
    fontSize: 8,
    fontWeight: '800',
  },
  homeDealImage: {
    width: '100%',
    height: 90,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 6,
  },
  homeDealInfo: {
    gap: 2,
  },
  homeDealTitle: {
    fontSize: 11,
    fontWeight: '700',
  },
  homeDealPrices: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  homeDealRetail: {
    fontSize: 10,
    textDecorationLine: 'line-through',
  },
  homeDealSpecial: {
    fontSize: 12,
    fontWeight: '800',
  },
  homeDealCashback: {
    fontSize: 10,
    color: '#10b981',
    fontWeight: '700',
  },
  homeDealEffectiveRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 4,
    marginTop: 4,
  },
  homeDealEffectiveLabel: {
    fontSize: 9,
    color: '#94a3b8',
    fontWeight: '600',
  },
  homeDealEffectiveValue: {
    fontSize: 11,
    fontWeight: '800',
    color: '#ff4f2f',
  },
  homeDealGrabBtn: {
    borderRadius: 6,
    paddingVertical: 5,
    alignItems: 'center',
    marginTop: 6,
  },
  homeDealGrabBtnText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  // Savings Calculator
  calculatorCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
    elevation: 1,
  },
  calcDescText: {
    fontSize: 11,
    lineHeight: 15,
    marginBottom: 12,
  },
  calcControl: {
    marginBottom: 12,
  },
  calcControlLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  calcControlName: {
    fontSize: 11,
    fontWeight: '700',
  },
  calcControlRate: {
    fontSize: 10,
    color: '#10b981',
    fontWeight: '700',
  },
  calcControlActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  calcBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#ff4f2f',
    justifyContent: 'center',
    alignItems: 'center',
  },
  calcBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  calcValueText: {
    fontSize: 13,
    fontWeight: '800',
  },
  calcProgressTrack: {
    height: 4,
    backgroundColor: '#e2e8f0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  calcProgressFill: {
    height: '100%',
    backgroundColor: '#ff4f2f',
  },
  calcResultBox: {
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  calcResultLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  calcResultAmount: {
    fontSize: 26,
    fontWeight: '800',
    color: '#ff4f2f',
    marginVertical: 2,
  },
  calcResultDetail: {
    fontSize: 9,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 13,
  },
  // Testimonials
  testimonialsScroll: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  testimonialCard: {
    width: 220,
    borderRadius: 12,
    padding: 12,
    marginRight: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
    elevation: 1,
  },
  testimonialRating: {
    fontSize: 12,
    marginBottom: 6,
  },
  testimonialText: {
    fontSize: 11,
    lineHeight: 15,
    fontStyle: 'italic',
    marginBottom: 6,
  },
  testimonialName: {
    fontSize: 10,
    fontWeight: '700',
  },
  // Footer
  footer: {
    borderTopWidth: 1,
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  brandingCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  footerText: {
    fontSize: 11,
    marginBottom: 4,
  },
  footerCopyright: {
    fontSize: 9,
    color: '#94a3b8',
  },
  // Search and Stores Tab CSS mapping
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 42,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
  },
  partnerTitle: {
    marginVertical: 8,
    fontSize: 13,
    fontWeight: '700',
  },
  storesList: {
    gap: 10,
  },
  storeRow: {
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
    elevation: 1,
  },
  storeLogo: {
    width: 44,
    height: 32,
    backgroundColor: '#fff',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  storeRowInfo: {
    flex: 1,
    marginLeft: 12,
  },
  storeName: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  storeRate: {
    fontSize: 11,
    color: '#10b981',
    fontWeight: '700',
  },
  storeGoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  storeGoText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  tabTitleHeader: {
    marginBottom: 16,
  },
  tabTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 2,
  },
  tabSub: {
    fontSize: 11,
  },
  emptyStateCard: {
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
    elevation: 1,
    borderStyle: 'dashed',
    borderWidth: 1,
  },
  emptyStateTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  emptyStateText: {
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
  },
  trackCard: {
    borderRadius: 16,
    padding: 14,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
    elevation: 1,
  },
  completed: {
    borderLeftColor: '#10b981',
  },
  returned: {
    borderLeftColor: '#ef4444',
  },
  return_active: {
    borderLeftColor: '#ff4f2f',
  },
  shipped: {
    borderLeftColor: '#f59e0b',
  },
  ordered: {
    borderLeftColor: '#6b7280',
  },
  trackCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  trackId: {
    fontSize: 11,
    fontWeight: '800',
  },
  trackPlatform: {
    fontSize: 10,
    fontWeight: '700',
    color: '#ff4f2f',
    backgroundColor: 'rgba(255, 79, 47, 0.08)',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  trackProductName: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
  },
  trackValues: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  trackValueText: {
    fontSize: 12,
  },
  trackCbVal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#10b981',
  },
  trackStatusProgress: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingTop: 8,
  },
  trackStatusText: {
    fontSize: 12,
  },
  trackFooterText: {
    fontSize: 9,
    color: '#ff4f2f',
    fontWeight: '700',
    textAlign: 'right',
    marginTop: 8,
  },
  walletDetailsCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 2,
  },
  walletDetailsTitle: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  walletBalanceRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  walletBalBox: {
    flex: 1,
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 79, 47, 0.1)',
  },
  walletBalLbl: {
    fontSize: 9,
    fontWeight: '700',
    marginBottom: 2,
  },
  walletBalNum: {
    fontSize: 18,
    fontWeight: '800',
  },
  walletDisclaimer: {
    fontSize: 9,
    lineHeight: 13,
  },
  withdrawalFormCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
    elevation: 1,
  },
  formTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 12,
  },
  inputGroup: {
    marginBottom: 10,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 4,
  },
  formInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 38,
    fontSize: 12,
  },
  withdrawSubmitBtn: {
    borderRadius: 8,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 6,
  },
  disabledBtn: {
    backgroundColor: '#cbd5e1',
  },
  withdrawSubmitBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  inviteCard: {
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
    elevation: 1,
  },
  inviteCardTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  inviteCardText: {
    fontSize: 11,
    marginBottom: 8,
    lineHeight: 14,
  },
  referralCopyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingLeft: 10,
    height: 36,
    overflow: 'hidden',
  },
  referralLink: {
    flex: 1,
    fontSize: 11,
  },
  copyBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderLeftWidth: 1,
    borderLeftColor: '#e2e8f0',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 8,
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  modalClose: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 11,
    color: '#6b7280',
    fontWeight: '700',
  },
  modalBody: {
    marginBottom: 16,
  },
  modalMetaBox: {
    borderRadius: 10,
    padding: 12,
    gap: 4,
    marginBottom: 16,
  },
  metaLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  metaValue: {
    fontWeight: '700',
  },
  stepperContainer: {
    paddingLeft: 8,
  },
  stepItem: {
    flexDirection: 'row',
    gap: 12,
    borderLeftWidth: 2,
    borderLeftColor: '#cbd5e1',
    paddingLeft: 16,
    paddingBottom: 20,
    position: 'relative',
  },
  stepCircle: {
    position: 'absolute',
    left: -7,
    top: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#cbd5e1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepCompleted: {
    borderLeftColor: '#10b981',
  },
  stepActive: {
    borderLeftColor: '#ff4f2f',
  },
  stepFailed: {
    borderLeftColor: '#ef4444',
  },
  stepDetails: {
    flex: 1,
  },
  stepHeading: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 2,
  },
  stepSubText: {
    fontSize: 10,
    marginBottom: 2,
  },
  stepTime: {
    fontSize: 9,
    color: '#94a3b8',
  },
  countdownBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 4,
    paddingVertical: 1,
    paddingHorizontal: 6,
    marginTop: 4,
  },
  countdownBadgeText: {
    fontSize: 8,
    color: '#1e40af',
    fontWeight: '700',
  },
  modalBtn: {
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBtnText: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '700',
  },
  bottomNav: {
    height: 56,
    borderTopWidth: 1,
    flexDirection: 'row',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  navItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 2,
  },
  navText: {
    fontSize: 10,
    color: '#6b7280',
    fontWeight: '500',
  },
  activeNavText: {
    color: '#ff4f2f',
    fontWeight: '700',
  },
});
