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
  HelpCircle,
  Camera,
  ArrowLeft,
  ShieldAlert,
  Link2,
  Bell,
  CreditCard,
  Landmark,
  ArrowLeftRight
} from 'lucide-react';
import UserLedger from './UserLedger';
import UserSupport from './UserSupport';
import CategoryIcon from './CategoryIcon';
import PriceComparisonModal from './PriceComparisonModal';
import { apiUsers, apiUpload, apiSharedLinks, apiNotifications } from '../services/api';
import { apiAffiliate } from '../services/api';
import { openExternalUrl, getStoreUrl, getProductPlatformUrl } from '../utils/openUrl';
import { getCleanedUrlIdentifier } from '../utils/urlMatcher';

const STORES_INFO = [
  { platform: 'Amazon', logo: 'https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg', cashbackPercent: 10.0 },
  { platform: 'Flipkart', logo: 'https://upload.wikimedia.org/wikipedia/commons/7/7a/Flipkart_logo.svg', cashbackPercent: 8.5 },
  { platform: 'Myntra', logo: 'https://upload.wikimedia.org/wikipedia/commons/b/bc/Myntra_Logo.png', cashbackPercent: 12.0 },
  { platform: 'Ajio', logo: 'https://upload.wikimedia.org/wikipedia/commons/c/c9/Ajio_Logo.svg', cashbackPercent: 15.0 },
  { platform: 'Nykaa Beauty', logo: 'https://upload.wikimedia.org/wikipedia/commons/5/5b/Nykaa_Logo.svg', cashbackPercent: 7.0 },
  { platform: 'MakeMyTrip', logo: 'https://upload.wikimedia.org/wikipedia/commons/f/fb/MakeMyTrip_Logo.svg', cashbackPercent: 9.0 }
];

const isBlacklistedBrand = (str) => {
  if (!str || typeof str !== 'string') return false;
  const s = str.toLowerCase().replace(/[\s_\-]+/g, '');
  return s.includes('shopsy') || s.includes('shopysy') || s.includes('smartmart');
};

const generatePriceComparisons = (deal) => {
  if (!deal) return [];
  
  const basePrice = typeof deal.dealPrice === 'number' && deal.dealPrice > 0 
    ? deal.dealPrice 
    : (typeof deal.price === 'number' && deal.price > 0 ? deal.price : (parseFloat(deal.dealPrice || deal.price || '0') || 0));
    
  const retailPrice = typeof deal.retailPrice === 'number' && deal.retailPrice > 0 
    ? deal.retailPrice 
    : (deal.price && deal.dealPrice && deal.price > deal.dealPrice ? deal.price : parseFloat((basePrice * 1.4).toFixed(2)));

  let comps = [];
  if (deal.comparisons && deal.comparisons.length > 0) {
    comps = deal.comparisons.map(comp => {
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
    });
  } else {
    const platformName = deal.platform || 'Amazon';
    const store = STORES_INFO.find(s => s.platform.toLowerCase() === platformName.toLowerCase()) || STORES_INFO[0];
    const dealPrice = basePrice;
    const cashbackPercent = deal.cashbackValue || store.cashbackPercent || 10;
    const cashbackEarned = deal.cashbackEarned || parseFloat(((dealPrice * cashbackPercent) / 100).toFixed(2));
    const effectivePrice = parseFloat((dealPrice - cashbackEarned).toFixed(2));
    const link = deal.affiliateUrl || deal.link || getProductPlatformUrl(deal, platformName);
    comps = [{
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
  }

  // Sort them strictly by dealPrice so the lowest price shop is always first
  comps.sort((a, b) => a.dealPrice - b.dealPrice);
  if (comps.length > 0) {
    comps[0].isBestPrice = true;
  }
  return comps;
};

export default function MobileApp({
  currentUser,
  trackedOrders = [],
  withdrawRequests = [],
  onAddWithdrawalRequest,
  onUpdateUser,
  storesData = [],
  dealsData = [],
  categoriesData = [],
  onAddNotification,
  openAuthModal,
  onLogout,
  onGrabDeal,
  onShareDeal,
  onStoreSelect,
  setView,
  compareList = [],
  onToggleCompare,
  onOpenCompare
}) {
  const sanitizedStores = React.useMemo(() => {
    return (storesData || [])
      .filter(s => s.status === 'active' || s.status === 'ACTIVE' || !s.status)
      .filter(s => !isBlacklistedBrand(s?.name) && !isBlacklistedBrand(s?.description));
  }, [storesData]);

  const sanitizedDeals = React.useMemo(() => {
    return (dealsData || []).filter(d => !isBlacklistedBrand(d?.title) && !isBlacklistedBrand(d?.name) && !isBlacklistedBrand(d?.platform));
  }, [dealsData]);

  const [activeTab, setActiveTab] = useState('home');
  const [copiedLink, setCopiedLink] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Withdrawal Form States
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [upiId, setUpiId] = useState('');
  const [withdrawLoading, setWithdrawLoading] = useState(false);

  // URL Converter States
  const [convertInputUrl, setConvertInputUrl] = useState('');
  const [convertResultUrl, setConvertResultUrl] = useState('');
  const [convertStore, setConvertStore] = useState('');

  // Notification States (Mobile)
  const [userNotifications, setUserNotifications] = useState([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);

  // --- PROFILE STATES ---
  const [profileName, setProfileName] = useState(currentUser?.name || '');
  const [profileDob, setProfileDob] = useState(currentUser?.dob || '');
  const [profileGender, setProfileGender] = useState(currentUser?.gender || 'Male');
  const [profileAddress, setProfileAddress] = useState(currentUser?.address || '');
  const [profileCity, setProfileCity] = useState(currentUser?.city || '');
  const [profileState, setProfileState] = useState(currentUser?.state || '');
  const [profilePincode, setProfilePincode] = useState(currentUser?.pincode || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // --- PAYMENT DETAILS STATES (MOBILE) ---
  const [payUpiId, setPayUpiId] = useState(currentUser?.upiId || '');
  const [payAccountName, setPayAccountName] = useState(currentUser?.bankAccountName || '');
  const [payAccountNumber, setPayAccountNumber] = useState(currentUser?.bankAccountNumber || '');
  const [payIfsc, setPayIfsc] = useState(currentUser?.bankIfsc || '');
  const [payBankName, setPayBankName] = useState(currentUser?.bankName || '');
  const [isSavingPayment, setIsSavingPayment] = useState(false);
  const [isEditingPayment, setIsEditingPayment] = useState(
    !currentUser?.upiId && !currentUser?.bankAccountNumber
  );

  // --- E-KYC STATES ---
  const [kycAadhaar, setKycAadhaar] = useState(currentUser?.aadhaarNumber || '');
  const [kycPan, setKycPan] = useState(currentUser?.panNumber || '');
  const [aadhaarFront, setAadhaarFront] = useState(currentUser?.aadhaarFrontUrl || '');
  const [aadhaarBack, setAadhaarBack] = useState(currentUser?.aadhaarBackUrl || '');
  const [panCard, setPanCard] = useState(currentUser?.panCardUrl || '');
  const [selfie, setSelfie] = useState(currentUser?.selfieUrl || '');
  const [uploadingField, setUploadingField] = useState(null);
  const [isSubmittingKyc, setIsSubmittingKyc] = useState(false);

  // Synchronize state when currentUser updates or loads
  useEffect(() => {
    if (currentUser) {
      setProfileName(currentUser.name || '');
      setProfileDob(currentUser.dob || '');
      setProfileGender(currentUser.gender || 'Male');
      setProfileAddress(currentUser.address || '');
      setProfileCity(currentUser.city || '');
      setProfileState(currentUser.state || '');
      setProfilePincode(currentUser.pincode || '');
      setKycAadhaar(currentUser.aadhaarNumber || '');
      setKycPan(currentUser.panNumber || '');
      setAadhaarFront(currentUser.aadhaarFrontUrl || '');
      setAadhaarBack(currentUser.aadhaarBackUrl || '');
      setPanCard(currentUser.panCardUrl || '');
      setSelfie(currentUser.selfieUrl || '');

      setPayUpiId(currentUser.upiId || '');
      setPayAccountName(currentUser.bankAccountName || '');
      setPayAccountNumber(currentUser.bankAccountNumber || '');
      setPayIfsc(currentUser.bankIfsc || '');
      setPayBankName(currentUser.bankName || '');
      if (currentUser.upiId || currentUser.bankAccountNumber) {
        setIsEditingPayment(false);
      }
      if (currentUser.upiId) {
        setUpiId(currentUser.upiId);
      }
    }
  }, [currentUser]);

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
    
    const query = homeSearchQuery.trim();
    const queryIdentifier = getCleanedUrlIdentifier(query);
    
    return sanitizedStores.filter(store => {
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
  }, [homeSearchQuery, sanitizedStores]);

  const searchedCategories = React.useMemo(() => {
    if (!homeSearchQuery.trim()) return [];
    return CATEGORIES.filter(cat => 
      cat.id !== 'all' && 
      (cat.name || '').toLowerCase().includes(homeSearchQuery.toLowerCase())
    );
  }, [homeSearchQuery, CATEGORIES]);

  const searchedDeals = React.useMemo(() => {
    if (!homeSearchQuery.trim()) return [];
    
    const query = homeSearchQuery.trim();
    const queryIdentifier = getCleanedUrlIdentifier(query);
    
    return sanitizedDeals.filter(deal => {
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
  }, [homeSearchQuery, sanitizedDeals]);

  useEffect(() => {
    if (activeTab === 'home') {
      const timer = setInterval(() => {
        setActiveSlide((prev) => (prev + 1) % HERO_SLIDES.length);
      }, 5000);
      return () => clearInterval(timer);
    }
  }, [activeTab]);

  // Sync notifications for logged-in user (Mobile)
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

  const handleMobileReferLink = async (dealItem, storeItem) => {
    if (isGuest) {
      setComparisonDeal(null);
      onAddNotification('Please Login / Sign Up first to create referral links!', 'info');
      openAuthModal();
      return;
    }
    try {
      const res = await apiSharedLinks.create({
        userId: currentUser.id,
        userName: currentUser.name,
        productName: dealItem.title || dealItem.name,
        store: storeItem.platform,
        productUrl: storeItem.link || getProductPlatformUrl(dealItem, storeItem.platform),
        userSharePercent: 100
      });
      let shareUrl = res.shortUrl;
      if (shareUrl) {
        shareUrl = shareUrl
          .replace('https://liomart.com', window.location.origin + '/#')
          .replace('https://liomart.co.in', window.location.origin + '/#')
          .replace('http://localhost:5173', window.location.origin);
      }
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
        onAddNotification(`Referral link for ${storeItem.platform} copied to clipboard!`, 'success');
      } else {
        onAddNotification(`Referral link created!`, 'success');
      }
    } catch (err) {
      onAddNotification('Failed to create referral link.', 'error');
    }
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

  const handleRequestWithdrawal = async (e) => {
    e.preventDefault();
    if (isGuest) {
      onAddNotification('Please Login / Sign Up to request withdrawals.', 'error');
      openAuthModal();
      return;
    }
    
    if (user?.kycStatus !== 'approved') {
      onAddNotification('E-KYC verification is mandatory before making a withdrawal. Please click your initial at the top to go to "Profile & KYC" page.', 'error');
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
      userId: user.id,
      userName: user.name,
      coins: Math.round(amount * 100), // 100 coins = ₹1
      amount: amount,
      upiId: upiId,
      date: new Date().toISOString().split('T')[0],
    };

    try {
      if (onAddWithdrawalRequest) {
        await onAddWithdrawalRequest(newRequest);
      }
      setWithdrawAmount('');
      setUpiId('');
    } catch (err) {
      console.error(err);
    } finally {
      setWithdrawLoading(false);
    }
  };

  // --- URL CONVERTER HANDLERS (MOBILE) ---
  const handleConvertUrl = async (e) => {
    e.preventDefault();
    if (isGuest) {
      onAddNotification('Please Login / Sign Up to convert links.', 'error');
      openAuthModal();
      return;
    }

    if (!convertInputUrl.trim()) {
      onAddNotification('Please paste a product URL.', 'error');
      return;
    }

    const url = convertInputUrl.trim();
    let store = 'Amazon';
    const lowerUrl = url.toLowerCase();

    if (lowerUrl.includes('flipkart') || lowerUrl.includes('fkrt')) store = 'Flipkart';
    else if (lowerUrl.includes('myntra') || lowerUrl.includes('mynt.in')) store = 'Myntra';
    else if (lowerUrl.includes('ajio')) store = 'Ajio';
    else if (lowerUrl.includes('nykaa')) store = 'Nykaa Beauty';
    else if (lowerUrl.includes('meesho')) store = 'Meesho';
    else if (lowerUrl.includes('makemytrip')) store = 'MakeMyTrip';
    else if (lowerUrl.includes('boat')) store = 'boAt';

    setConvertStore(store);
    try {
      const newLink = await apiSharedLinks.create({
        userId: user.id,
        userName: user.name,
        productName: `Converted ${store} Product`,
        store: store,
        productUrl: url,
        userSharePercent: 100
      });
      const defaultShortUrl = `${window.location.origin}/#/share/${newLink.id}`;
      const finalShortUrl = newLink.shortUrl || defaultShortUrl;
      
      setConvertResultUrl(finalShortUrl);
      onAddNotification(`Converted to tracked ${store} link successfully!`, 'success');
    } catch (err) {
      console.error(err);
      onAddNotification('Failed to convert URL.', 'error');
    }
  };

  const handleCopyConverted = () => {
    navigator.clipboard.writeText(convertResultUrl);
    onAddNotification('Affiliate link copied to clipboard!', 'success');
  };

  // --- PROFILE SAVE (MOBILE) ---
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!profileName.trim() || !profileDob.trim() || !profileAddress.trim() || !profileCity.trim() || !profileState.trim() || !profilePincode.trim()) {
      onAddNotification('Please fill in all profile fields to complete your profile.', 'error');
      return;
    }

    setIsSavingProfile(true);
    try {
      const updatedUser = await apiUsers.update(currentUser.id, {
        name: profileName,
        dob: profileDob,
        gender: profileGender,
        address: profileAddress,
        city: profileCity,
        state: profileState,
        pincode: profilePincode,
        isProfileComplete: true
      });
      if (onUpdateUser) {
        onUpdateUser(updatedUser);
      }
      onAddNotification('Profile saved and marked as COMPLETE!', 'success');
    } catch (err) {
      console.error(err);
      onAddNotification('Failed to save profile.', 'error');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // --- PAYMENT DETAILS SAVE (MOBILE) ---
  const handleSavePaymentDetails = async (e) => {
    e.preventDefault();
    const cleanUpi = payUpiId.trim();
    const cleanAccNo = payAccountNumber.trim();
    const cleanIfsc = payIfsc.trim().toUpperCase();
    const cleanAccName = payAccountName.trim();
    const cleanBank = payBankName.trim();

    if (!cleanUpi && !cleanAccNo) {
      onAddNotification('Please enter either a UPI ID or Bank Account details.', 'error');
      return;
    }

    if (cleanUpi) {
      const upiRegex = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;
      if (!upiRegex.test(cleanUpi)) {
        onAddNotification('Please enter a valid UPI ID (e.g. name@bank or 9876543210@paytm).', 'error');
        return;
      }
    }

    if (cleanAccNo) {
      const accRegex = /^\d{9,18}$/;
      if (!accRegex.test(cleanAccNo)) {
        onAddNotification('Bank Account Number must be between 9 and 18 digits.', 'error');
        return;
      }
      const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
      if (!ifscRegex.test(cleanIfsc)) {
        onAddNotification('Please enter a valid 11-character IFSC Code (e.g. SBIN0001234).', 'error');
        return;
      }
      if (cleanAccName.length < 2) {
        onAddNotification('Please enter Account Holder Name (minimum 2 characters).', 'error');
        return;
      }
    }

    setIsSavingPayment(true);
    try {
      const updatedUser = await apiUsers.updatePaymentDetails(currentUser.id, {
        upiId: cleanUpi,
        bankAccountName: cleanAccName,
        bankAccountNumber: cleanAccNo,
        bankIfsc: cleanIfsc,
        bankName: cleanBank,
      });
      if (onUpdateUser) {
        onUpdateUser(updatedUser);
      }
      setIsEditingPayment(false);
      onAddNotification('Payment details saved successfully!', 'success');
    } catch (err) {
      console.error(err);
      onAddNotification(err.message || 'Failed to save payment details.', 'error');
    } finally {
      setIsSavingPayment(false);
    }
  };

  // --- KYC FILE UPLOAD (MOBILE) ---
  const handleUploadKycFile = async (e, field) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingField(field);
    try {
      const res = await apiUpload.uploadImage(file);
      if (res && res.url) {
        if (field === 'aadhaarFront') setAadhaarFront(res.url);
        if (field === 'aadhaarBack') setAadhaarBack(res.url);
        if (field === 'panCard') setPanCard(res.url);
        if (field === 'selfie') setSelfie(res.url);
        onAddNotification('Document uploaded successfully!', 'success');
      }
    } catch (err) {
      console.error(err);
      onAddNotification('Failed to upload document. Please try again.', 'error');
    } finally {
      setUploadingField(null);
    }
  };

  // --- KYC SUBMIT (MOBILE) ---
  const handleSubmitKyc = async (e) => {
    e.preventDefault();
    if (!kycAadhaar.trim() || kycAadhaar.trim().length < 12) {
      onAddNotification('Please enter a valid 12-digit Aadhaar Number.', 'error');
      return;
    }
    if (!kycPan.trim() || kycPan.trim().length < 10) {
      onAddNotification('Please enter a valid 10-digit PAN Card Number.', 'error');
      return;
    }
    if (!aadhaarFront || !aadhaarBack || !panCard || !selfie) {
      onAddNotification('Please upload all required KYC documents (Aadhaar Front & Back, PAN, Selfie).', 'error');
      return;
    }

    setIsSubmittingKyc(true);
    try {
      const updatedUser = await apiUsers.update(currentUser.id, {
        aadhaarNumber: kycAadhaar,
        panNumber: kycPan,
        aadhaarFrontUrl: aadhaarFront,
        aadhaarBackUrl: aadhaarBack,
        panCardUrl: panCard,
        selfieUrl: selfie,
        kycStatus: 'pending'
      });
      if (onUpdateUser) {
        onUpdateUser(updatedUser);
      }
      onAddNotification('E-KYC documents submitted successfully for review!', 'success');
    } catch (err) {
      console.error(err);
      onAddNotification('Failed to submit E-KYC documents.', 'error');
    } finally {
      setIsSubmittingKyc(false);
    }
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

          {currentUser && (
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                style={{
                  background: 'none',
                  border: 'none',
                  position: 'relative',
                  cursor: 'pointer',
                  color: 'var(--text)',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: '4px'
                }}
                title="Notifications"
              >
                <Bell size={16} />
                {userNotifications.filter(n => !n.read).length > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '-2px',
                    right: '-2px',
                    backgroundColor: '#ef4444',
                    color: '#fff',
                    borderRadius: '50%',
                    width: '12px',
                    height: '12px',
                    fontSize: '8px',
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
                  width: '280px',
                  backgroundColor: 'var(--card-bg, #ffffff)',
                  border: '1px solid var(--border, #e2e8f0)',
                  borderRadius: '10px',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                  zIndex: 2000,
                  display: 'flex',
                  flexDirection: 'column',
                  maxHeight: '300px'
                }}>
                  {/* Header */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 12px',
                    borderBottom: '1px solid var(--border)',
                    boxSizing: 'border-box'
                  }}>
                    <span style={{ fontWeight: '700', fontSize: '12px', color: 'var(--text-bold)' }}>Notifications</span>
                    {userNotifications.filter(n => !n.read).length > 0 && (
                      <button
                        onClick={handleMarkAllNotificationsRead}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--secondary, #10b981)',
                          fontSize: '10px',
                          fontWeight: '600',
                          cursor: 'pointer'
                        }}
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  {/* List */}
                  <div style={{ overflowY: 'auto', flex: 1, maxHeight: '240px' }}>
                    {userNotifications.length === 0 ? (
                      <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text)', opacity: 0.6, fontSize: '11px' }}>
                        No notifications yet.
                      </div>
                    ) : (
                      userNotifications.map(notif => (
                        <div
                          key={notif.id}
                          onClick={() => {
                            handleMarkNotificationRead(notif.id);
                          }}
                          style={{
                            padding: '10px 12px',
                            borderBottom: '1px solid var(--border)',
                            backgroundColor: notif.read ? 'transparent' : 'rgba(99, 102, 241, 0.05)',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '2px',
                            textAlign: 'left',
                            boxSizing: 'border-box'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '6px' }}>
                            <span style={{
                              fontWeight: notif.read ? '500' : '700',
                              fontSize: '11px',
                              color: 'var(--text-bold)'
                            }}>
                              {notif.title}
                            </span>
                          </div>
                          <p style={{
                            margin: 0,
                            fontSize: '10px',
                            color: 'var(--text)',
                            lineHeight: '1.3',
                            opacity: notif.read ? 0.7 : 0.9
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

          {isGuest ? (
            <button className="app-login-btn" onClick={openAuthModal}>Login</button>
          ) : (
            <div className="app-user-profile" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="app-user-initial" onClick={() => setActiveTab('profile')} style={{ cursor: 'pointer' }} title="My Profile & KYC">{user.name[0]}</span>
              <button className="app-logout-icon" onClick={onLogout} title="Logout App">
                <LogOut size={14} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Screen Content Frame */}
      <div className="mobile-app-screen-content">
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

                {/* Sticky Search & Categories Header */}
                <div className="mobile-sticky-search-categories">
                  <SearchBar
                    placeholder="Search products, brands, categories or stores..."
                    value={homeSearchQuery}
                    onChange={setHomeSearchQuery}
                  />

                  {!homeSearchQuery && (
                    <div className="mobile-sticky-categories-bar" style={{ width: '100%', marginTop: '4px' }}>
                      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px', scrollbarWidth: 'none' }}>
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
                                padding: '6px 12px',
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
                  )}
                </div>

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
                                     <button
                                       onClick={(e) => {
                                         e.stopPropagation();
                                         handleGrabDeal(deal);
                                       }}
                                       style={{
                                         flex: 1,
                                         backgroundColor: 'rgba(16, 185, 129, 0.1)',
                                         color: '#10b981',
                                         border: '1px solid rgba(16, 185, 129, 0.4)',
                                         borderRadius: '4px',
                                         padding: '4px 0',
                                         fontSize: '9px',
                                         fontWeight: '700',
                                         cursor: 'pointer'
                                       }}
                                     >
                                       ⇄ Compare
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
                        {sanitizedStores
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
                        {sanitizedDeals
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
                                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                                        color: '#10b981',
                                        border: '1px solid rgba(16, 185, 129, 0.4)',
                                        borderRadius: '4px',
                                        padding: '4px 6px',
                                        fontSize: '9px',
                                        fontWeight: '700',
                                        cursor: 'pointer'
                                      }}
                                    >
                                      ⇄ Compare
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
              {sanitizedStores
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                    <label style={{ margin: 0 }}>Linked UPI / Account</label>
                    <button 
                      type="button" 
                      onClick={() => setActiveTab('profile')}
                      style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '11px', cursor: 'pointer', fontWeight: 'bold', padding: 0 }}
                    >
                      Update Details &rarr;
                    </button>
                  </div>
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
        {activeTab === 'profile' && (
          <div className="mobile-screen-tab-panel animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingBottom: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button onClick={() => setActiveTab('home')} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', padding: 0, fontWeight: 'bold' }}>
                <ArrowLeft size={16} />
              </button>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: 'var(--text-bold)' }}>My Profile & E-KYC</h3>
            </div>

            {/* KYC Status Alert */}
            <div style={{
              padding: '12px 14px',
              borderRadius: '8px',
              background: currentUser?.kycStatus === 'approved' ? 'rgba(16,185,129,0.08)' : currentUser?.kycStatus === 'pending' ? 'rgba(245,158,11,0.08)' : currentUser?.kycStatus === 'rejected' ? 'rgba(239,68,68,0.08)' : 'var(--bg)',
              border: `1px solid ${currentUser?.kycStatus === 'approved' ? '#10b981' : currentUser?.kycStatus === 'pending' ? '#f59e0b' : currentUser?.kycStatus === 'rejected' ? '#ef4444' : 'var(--border)'}`,
              fontSize: '12px',
              color: 'var(--text)',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ShieldCheck size={16} style={{ color: currentUser?.kycStatus === 'approved' ? '#10b981' : currentUser?.kycStatus === 'pending' ? '#f59e0b' : currentUser?.kycStatus === 'rejected' ? '#ef4444' : 'var(--text)' }} />
                <strong style={{ color: 'var(--text-bold)' }}>
                  KYC Status: {currentUser?.kycStatus ? currentUser.kycStatus.toUpperCase().replace('_', ' ') : 'NOT SUBMITTED'}
                </strong>
              </div>
              <span>
                {currentUser?.kycStatus === 'approved' 
                  ? 'Your E-KYC is approved! You can request payouts.'
                  : currentUser?.kycStatus === 'pending'
                  ? 'KYC is pending admin review.'
                  : currentUser?.kycStatus === 'rejected'
                  ? `Rejected: ${currentUser?.kycRemarks || 'Invalid files'}`
                  : 'Complete profile & upload docs to request payouts.'}
              </span>
            </div>

            {/* Personal Details Form */}
            {currentUser?.kycStatus !== 'approved' && currentUser?.kycStatus !== 'pending' && (
              <form onSubmit={handleSaveProfile} className="app-withdrawal-form-card" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <h4 style={{ margin: '0 0 6px', fontSize: '13px', borderBottom: '1px solid var(--border)', paddingBottom: '6px', color: 'var(--text-bold)' }}>Personal Details</h4>
                
                <div className="app-input-group">
                  <label>Full Name</label>
                  <input type="text" required value={profileName} onChange={e => setProfileName(e.target.value)} />
                </div>
                <div className="app-input-group">
                  <label>Date of Birth</label>
                  <input type="date" required value={profileDob} onChange={e => setProfileDob(e.target.value)} />
                </div>
                <div className="app-input-group">
                  <label>Gender</label>
                  <select value={profileGender} onChange={e => setProfileGender(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--bg)', color: 'var(--text-bold)' }}>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="app-input-group">
                  <label>Address</label>
                  <input type="text" required value={profileAddress} onChange={e => setProfileAddress(e.target.value)} />
                </div>
                <div className="app-input-group">
                  <label>City</label>
                  <input type="text" required value={profileCity} onChange={e => setProfileCity(e.target.value)} />
                </div>
                <div className="app-input-group">
                  <label>State</label>
                  <input type="text" required value={profileState} onChange={e => setProfileState(e.target.value)} />
                </div>
                <div className="app-input-group">
                  <label>Pincode</label>
                  <input type="text" required value={profilePincode} onChange={e => setProfilePincode(e.target.value)} />
                </div>

                <button type="submit" disabled={isSavingProfile} className="app-withdraw-submit-btn" style={{ padding: '10px', fontSize: '12px' }}>
                  {isSavingProfile ? 'Saving...' : 'Save Details'}
                </button>
              </form>
            )}

            {/* E-KYC Upload Form */}
            {currentUser?.kycStatus !== 'approved' && currentUser?.kycStatus !== 'pending' && (
              <form onSubmit={handleSubmitKyc} className="app-withdrawal-form-card" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <h4 style={{ margin: '0 0 6px', fontSize: '13px', borderBottom: '1px solid var(--border)', paddingBottom: '6px', color: 'var(--text-bold)' }}>Identity Documents</h4>

                <div className="app-input-group">
                  <label>Aadhaar Card Number</label>
                  <input type="text" required maxLength="12" placeholder="12-digit Aadhaar Number" value={kycAadhaar} onChange={e => setKycAadhaar(e.target.value.replace(/\s/g, ''))} />
                </div>
                <div className="app-input-group">
                  <label>PAN Card Number</label>
                  <input type="text" required maxLength="10" placeholder="10-character PAN Number" value={kycPan} onChange={e => setKycPan(e.target.value.toUpperCase())} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '6px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text)' }}>Aadhaar Front</span>
                    <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60px', border: '1px dashed var(--border)', borderRadius: '6px', cursor: 'pointer', backgroundColor: 'var(--bg)' }}>
                      <input type="file" accept="image/*" onChange={e => handleUploadKycFile(e, 'aadhaarFront')} style={{ display: 'none' }} />
                      <Camera size={16} style={{ color: 'var(--primary)', marginBottom: '2px' }} />
                      <span style={{ fontSize: '9px', color: 'var(--text)' }}>{uploadingField === 'aadhaarFront' ? 'Uploading...' : aadhaarFront ? 'Uploaded ✓' : 'Upload'}</span>
                    </label>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text)' }}>Aadhaar Back</span>
                    <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60px', border: '1px dashed var(--border)', borderRadius: '6px', cursor: 'pointer', backgroundColor: 'var(--bg)' }}>
                      <input type="file" accept="image/*" onChange={e => handleUploadKycFile(e, 'aadhaarBack')} style={{ display: 'none' }} />
                      <Camera size={16} style={{ color: 'var(--primary)', marginBottom: '2px' }} />
                      <span style={{ fontSize: '9px', color: 'var(--text)' }}>{uploadingField === 'aadhaarBack' ? 'Uploading...' : aadhaarBack ? 'Uploaded ✓' : 'Upload'}</span>
                    </label>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text)' }}>PAN Card</span>
                    <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60px', border: '1px dashed var(--border)', borderRadius: '6px', cursor: 'pointer', backgroundColor: 'var(--bg)' }}>
                      <input type="file" accept="image/*" onChange={e => handleUploadKycFile(e, 'panCard')} style={{ display: 'none' }} />
                      <Camera size={16} style={{ color: 'var(--primary)', marginBottom: '2px' }} />
                      <span style={{ fontSize: '9px', color: 'var(--text)' }}>{uploadingField === 'panCard' ? 'Uploading...' : panCard ? 'Uploaded ✓' : 'Upload'}</span>
                    </label>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text)' }}>Selfie with ID</span>
                    <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60px', border: '1px dashed var(--border)', borderRadius: '6px', cursor: 'pointer', backgroundColor: 'var(--bg)' }}>
                      <input type="file" accept="image/*" onChange={e => handleUploadKycFile(e, 'selfie')} style={{ display: 'none' }} />
                      <Camera size={16} style={{ color: 'var(--primary)', marginBottom: '2px' }} />
                      <span style={{ fontSize: '9px', color: 'var(--text)' }}>{uploadingField === 'selfie' ? 'Uploading...' : selfie ? 'Uploaded ✓' : 'Upload'}</span>
                    </label>
                  </div>
                </div>

                <button type="submit" disabled={isSubmittingKyc || currentUser?.kycStatus === 'approved'} className="app-withdraw-submit-btn" style={{ padding: '10px', fontSize: '12px', marginTop: '6px', backgroundColor: currentUser?.kycStatus === 'approved' ? '#10b981' : 'var(--primary)' }}>
                  {isSubmittingKyc ? 'Submitting...' : currentUser?.kycStatus === 'approved' ? 'KYC Verification Approved' : 'Submit E-KYC'}
                </button>
              </form>
            )}

            {/* Payment Details / Bank Account Card (Mobile) */}
            <div className="app-withdrawal-form-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CreditCard size={16} style={{ color: 'var(--primary)' }} />
                  <h4 style={{ margin: 0, fontSize: '13px', color: 'var(--text-bold)', fontWeight: 'bold' }}>Payment & Bank Details</h4>
                </div>
                <span className={`status-badge ${currentUser?.paymentDetailsStatus || 'not_submitted'}`} style={{ fontSize: '10px', textTransform: 'uppercase' }}>
                  {(currentUser?.paymentDetailsStatus || 'not_submitted').replace('_', ' ')}
                </span>
              </div>

              {!isEditingPayment && (currentUser?.upiId || currentUser?.bankAccountNumber) ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {currentUser?.upiId && (
                    <div style={{ padding: '8px 10px', borderRadius: '6px', backgroundColor: 'var(--bg)', border: '1px solid var(--border)' }}>
                      <span style={{ fontSize: '10px', color: 'var(--text)', display: 'block' }}>UPI ID</span>
                      <strong style={{ fontSize: '13px', color: 'var(--text-bold)' }}>{currentUser.upiId}</strong>
                    </div>
                  )}
                  {currentUser?.bankAccountNumber && (
                    <div style={{ padding: '8px 10px', borderRadius: '6px', backgroundColor: 'var(--bg)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span style={{ fontSize: '10px', color: 'var(--text)', display: 'block' }}>Bank Account</span>
                      <strong style={{ fontSize: '13px', color: 'var(--text-bold)' }}>
                        {currentUser.bankAccountName ? `${currentUser.bankAccountName} • ` : ''}XXXXXX{currentUser.bankAccountNumber.slice(-4)}
                      </strong>
                      <span style={{ fontSize: '11px', color: 'var(--text)', fontFamily: 'monospace' }}>
                        IFSC: {currentUser.bankIfsc} {currentUser.bankName ? `(${currentUser.bankName})` : ''}
                      </span>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsEditingPayment(true)}
                    className="app-withdraw-submit-btn"
                    style={{ padding: '8px', fontSize: '12px', marginTop: '4px' }}
                  >
                    Edit / Update Payment Details
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSavePaymentDetails} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <p style={{ fontSize: '11px', color: 'var(--text)', margin: 0 }}>
                    Enter your UPI ID or Bank Account to receive cashback withdrawals.
                  </p>

                  <div className="app-input-group">
                    <label>UPI ID (e.g. name@okhdfcbank or 9876543210@paytm)</label>
                    <input
                      type="text"
                      placeholder="e.g. rahul@oksbi"
                      value={payUpiId}
                      onChange={e => setPayUpiId(e.target.value)}
                    />
                  </div>

                  <div style={{ textAlign: 'center', margin: '2px 0', position: 'relative' }}>
                    <span style={{ fontSize: '10px', color: 'var(--text)', fontWeight: 'bold' }}>— OR BANK ACCOUNT —</span>
                  </div>

                  <div className="app-input-group">
                    <label>Account Holder Name</label>
                    <input
                      type="text"
                      placeholder="Name as in bank account"
                      value={payAccountName}
                      onChange={e => setPayAccountName(e.target.value)}
                    />
                  </div>

                  <div className="app-input-group">
                    <label>Bank Name (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. State Bank of India"
                      value={payBankName}
                      onChange={e => setPayBankName(e.target.value)}
                    />
                  </div>

                  <div className="app-input-group">
                    <label>Bank Account Number</label>
                    <input
                      type="text"
                      placeholder="9-18 digit account number"
                      value={payAccountNumber}
                      onChange={e => setPayAccountNumber(e.target.value.replace(/\D/g, ''))}
                    />
                  </div>

                  <div className="app-input-group">
                    <label>IFSC Code</label>
                    <input
                      type="text"
                      maxLength={11}
                      placeholder="e.g. SBIN0001234"
                      value={payIfsc}
                      onChange={e => setPayIfsc(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                      style={{ fontFamily: 'monospace' }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                    <button
                      type="submit"
                      disabled={isSavingPayment}
                      className="app-withdraw-submit-btn"
                      style={{ flex: 1, padding: '10px', fontSize: '12px' }}
                    >
                      {isSavingPayment ? 'Saving...' : 'Save Payment Details'}
                    </button>
                    {(currentUser?.upiId || currentUser?.bankAccountNumber) && (
                      <button
                        type="button"
                        onClick={() => {
                          setPayUpiId(currentUser?.upiId || '');
                          setPayAccountName(currentUser?.bankAccountName || '');
                          setPayAccountNumber(currentUser?.bankAccountNumber || '');
                          setPayIfsc(currentUser?.bankIfsc || '');
                          setPayBankName(currentUser?.bankName || '');
                          setIsEditingPayment(false);
                        }}
                        style={{ padding: '10px 14px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '12px', cursor: 'pointer' }}
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              )}
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
        {activeTab === 'converter' && (
          <div className="mobile-screen-tab-panel animate-fade" style={{ paddingBottom: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <button onClick={() => setActiveTab('home')} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', padding: 0, fontWeight: 'bold' }}>
                <ArrowLeft size={16} />
              </button>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: 'var(--text-bold)' }}>Universal Link Converter</h3>
            </div>

            <div className="app-withdrawal-form-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <p style={{ fontSize: '12px', color: 'var(--text)', lineHeight: '1.5', margin: 0 }}>
                Paste any standard product link from supported stores (Amazon, Flipkart, Myntra, Ajio, Meesho, Nykaa, MakeMyTrip, boAt) to generate your custom affiliate link.
              </p>

              <form onSubmit={handleConvertUrl} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '8px' }}>
                <div className="app-input-group">
                  <label>Paste Normal Product URL</label>
                  <input
                    type="url"
                    required
                    placeholder="https://www.amazon.in/dp/..."
                    value={convertInputUrl}
                    onChange={e => setConvertInputUrl(e.target.value)}
                    style={{ width: '100%', boxSizing: 'border-box' }}
                  />
                </div>
                <button type="submit" className="app-withdraw-submit-btn" style={{ padding: '10px', fontSize: '13px', fontWeight: 'bold' }}>
                  Convert Link
                </button>
              </form>

              {convertResultUrl && (
                <div className="animate-fade" style={{ marginTop: '16px', padding: '14px', borderRadius: '8px', backgroundColor: 'rgba(25, 118, 210, 0.05)', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--primary)', textTransform: 'uppercase', marginBottom: '8px' }}>
                    Detected Store: {convertStore}
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                      type="text"
                      readOnly
                      value={convertResultUrl}
                      style={{ flex: 1, padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--card-bg)', color: 'var(--text-bold)', fontSize: '12px', fontFamily: 'monospace' }}
                    />
                    <button onClick={handleCopyConverted} className="btn-primary" style={{ padding: '8px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <Copy size={13} /> Copy
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
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
          className={`app-nav-item ${activeTab === 'converter' ? 'active' : ''}`}
          onClick={() => setActiveTab('converter')}
        >
          <Link2 size={18} />
          <span>Convert</span>
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

      {/* Floating Compare Pill for Mobile */}
      {compareList && compareList.length > 0 && (
        <div
          onClick={onOpenCompare}
          style={{
            position: 'absolute',
            bottom: '68px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: '#10b981',
            color: '#fff',
            padding: '7px 16px',
            borderRadius: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 16px rgba(16, 185, 129, 0.45)',
            zIndex: 100,
            cursor: 'pointer',
            fontSize: '11px',
            fontWeight: '800',
            whiteSpace: 'nowrap'
          }}
        >
          <ArrowLeftRight size={13} />
          <span>Compare ({compareList.length} items)</span>
        </div>
      )}

      {/* Price Comparison Modal (Matching exact user screenshot) */}
      <PriceComparisonModal
        isOpen={!!comparisonDeal}
        onClose={() => setComparisonDeal(null)}
        deal={comparisonDeal}
        onBuyAndEarn={executeSimulatorGrabDeal}
        onReferLink={handleMobileReferLink}
        storesData={storesData}
      />
    </div>
  );
}
