import React, { useState } from 'react';
import {
  LayoutDashboard,
  Users as UsersIcon,
  ShoppingBag,
  Gift,
  Wallet,
  MousePointer,
  CheckSquare,
  Share2,
  Settings as SettingsIcon,
  LogOut,
  Bell,
  Sun,
  Moon,
  Menu,
  Truck,
  Globe,
  FileText,
  ShieldCheck,
  HelpCircle,
} from 'lucide-react';
import '../Admin.css';

// Subcomponents to import
import AdminDashboard from './AdminDashboard';
import AdminUsers from './AdminUsers';
import AdminRoles from './AdminRoles';
import AdminActivityLogs from './AdminActivityLogs';
import AdminLoginHistory from './AdminLoginHistory';
import AdminProducts from './AdminProducts';
import AdminWithdrawals from './AdminWithdrawals';
import AdminClickLogs from './AdminClickLogs';
import AdminConversions from './AdminConversions';
import AdminReferrals from './AdminReferrals';
import AdminSettings from './AdminSettings';
import AdminSharedCommissions from './AdminSharedCommissions';
import AdminCategories from './AdminCategories';
import AdminDeals from './AdminDeals';
import AdminStores from './AdminStores';
import AdminBanners from './AdminBanners';
import AdminAffiliateNetwork from './AdminAffiliateNetwork';
import AdminSEO from './AdminSEO';
import AdminLedger from './AdminLedger';
import AdminTickets from './AdminTickets';

import {
  apiUsers,
  apiProducts,
  apiWithdrawals,
  apiAnalytics,
  apiFinance,
  apiSettings,
  apiSharedLinks,
  apiSharedCommissions,
  apiCategories,
  apiDeals,
  apiStores,
  apiBanners,
  apiCashback,
  apiTracking,
  apiAffiliate,
  apiAdmin
} from '../services/api';

export default function AdminPanel({
  currentUser,
  onLogout,
  theme,
  toggleTheme,
  onAddNotification,
  onUpdateProducts,
  onUpdateDeals,
  onUpdateStores,
  onUpdateBanners,
  onUpdateCategories,
  onRefreshCatalog,
  setView
}) {
  const getInitialTab = () => {
    const hash = window.location.hash;
    if (hash === '#/admin/users') return 'users';
    if (hash === '#/admin/roles') return 'roles';    if (hash === '#/admin/roles') return 'roles';    if (hash === '#/admin/products') return 'products';
    if (hash === '#/admin/withdrawals') return 'withdrawals';
    if (hash === '#/admin/click-logs') return 'click-logs';
    if (hash === '#/admin/conversions') return 'conversions';
    if (hash === '#/admin/referrals') return 'referrals';
    if (hash === '#/admin/settings') return 'settings';
    if (hash === '#/admin/seo') return 'seo';
    if (hash === '#/admin/shared-commissions') return 'shared-commissions';
    if (hash === '#/admin/categories') return 'categories';
    if (hash === '#/admin/deals') return 'deals';
    if (hash === '#/admin/stores') return 'stores';
    if (hash === '#/admin/banners') return 'banners';

    const path = window.location.pathname;
    if (path === '/admin/users') return 'users';
    if (path === '/admin/roles') return 'roles';
    if (path === '/admin/products') return 'products';
    if (path === '/admin/withdrawals') return 'withdrawals';
    if (path === '/admin/click-logs') return 'click-logs';
    if (path === '/admin/conversions') return 'conversions';
    if (path === '/admin/referrals') return 'referrals';
    if (hash === '#/admin/settings') return 'settings';
    if (hash === '#/admin/seo') return 'seo';
    if (hash === '#/admin/activity-logs') return 'activity-logs';
    if (hash === '#/admin/login-history') return 'login-history';
    if (hash === '#/admin/shared-commissions') return 'shared-commissions';
    if (hash === '#/admin/categories') return 'categories';
    if (hash === '#/admin/deals') return 'deals';
    if (path === '/admin/stores' || hash === '#/admin/stores') return 'stores';
    if (path === '/admin/banners' || hash === '#/admin/banners') return 'banners';
    if (path === '/admin/affiliate-network' || hash === '#/admin/affiliate-network') return 'affiliate-network';
    if (path === '/admin/ledger' || hash === '#/admin/ledger') return 'ledger';
    if (path === '/admin/tickets' || hash === '#/admin/tickets') return 'tickets';
    return 'dashboard';
  };

  const [activeTab, setActiveTabRaw] = useState(getInitialTab);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const setActiveTab = (tabId) => {
    setActiveTabRaw(tabId);
    const newHash = `#/admin/${tabId}`;
    const newPath = `/admin/${tabId}`;
    if (window.location.hash !== newHash) {
      window.location.hash = newHash;
    }
    if (window.location.pathname !== newPath) {
      window.history.pushState(null, '', newPath);
    }
  };

  React.useEffect(() => {
    const handleAdminPopState = () => {
      setActiveTabRaw(getInitialTab());
    };
    window.addEventListener('popstate', handleAdminPopState);
    return () => window.removeEventListener('popstate', handleAdminPopState);
  }, []);

  // --- GLOBAL CONSTANTS STATE ---
  const [globalSettings, setGlobalSettings] = useState({
    cashbackPercent: 8.0,
    holdDays: 30,
    minimumWithdrawal: 10.00,
  });

  // --- DATABASE STATE ---
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [cashbackList, setCashbackList] = useState([]);
  const [trackedOrders, setTrackedOrders] = useState([]);
  const [withdrawRequests, setWithdrawRequests] = useState([]);
  const [clickLogs, setClickLogs] = useState([]);
  const [conversions, setConversions] = useState([]);
  const [sharedLinks, setSharedLinks] = useState([]);
  const [sharedCommissions, setSharedCommissions] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [loginHistory, setLoginHistory] = useState([]);
  const [categories, setCategories] = useState([]);
  const [deals, setDeals] = useState([]);
  const [storesData, setStoresData] = useState([]);
  const [banners, setBanners] = useState([]);
  const [finance, setFinance] = useState({
    totalRevenue: 0.00,
    totalCashbackPaid: 0.00,
    totalWithdrawPaid: 0.00,
    pendingWithdrawals: 0.00,
    totalApprovedBalance: 0.00,
    totalPendingBalance: 0.00,
    totalWithdrawnAmount: 0.00,
    totalWalletBalance: 0.00,
    transactions: [],
  });

  const [refreshKey, setRefreshKey] = useState(0);

  // --- FETCH DATA FROM SPRING BOOT / MOCK ON MOUNT ---
  React.useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        const [
          usersData,
          productsData,
          cashbackData,
          trackingData,
          withdrawData,
          clicksData,
          commsData,
          sharesData,
          conversionsData,
          financeData,
          settingsData,
          categoriesData,
          dealsData,
          storesRes,
          bannersData,
          sharedLinksData,
          sharedCommissionsData,
          activityLogsData,
          loginHistoryData
        ] = await Promise.all([
          apiUsers.getAll().catch(e => { console.warn('Users fetch failed', e); return []; }),
          apiProducts.getAll().catch(e => { console.warn('Products fetch failed', e); return []; }),
          apiCashback.getAll().catch(e => { console.warn('Cashback fetch failed', e); return []; }),
          apiTracking.getAll().catch(e => { console.warn('Tracking fetch failed', e); return []; }),
          apiWithdrawals.getAll().catch(e => { console.warn('Withdrawals fetch failed', e); return []; }),
          apiAffiliate.getAllClicks().catch(e => { console.warn('Affiliate Clicks fetch failed', e); return []; }),
          apiAffiliate.getCommissionHistory().catch(e => { console.warn('Affiliate Comms fetch failed', e); return []; }),
          apiAffiliate.getAllShares().catch(e => { console.warn('Affiliate Shares fetch failed', e); return []; }),
          apiAnalytics.getConversions().catch(e => { console.warn('Conversions fetch failed', e); return []; }),
          apiFinance.getData().catch(e => { console.warn('Finance fetch failed', e); return null; }),
          apiSettings.get().catch(e => { console.warn('Settings fetch failed', e); return null; }),
          apiCategories.getAll().catch(e => { console.warn('Categories fetch failed', e); return []; }),
          apiDeals.getAll().catch(e => { console.warn('Deals fetch failed', e); return []; }),
          apiStores.getAll().catch(e => { console.warn('Stores fetch failed', e); return []; }),
          apiBanners.getAll().catch(e => { console.warn('Banners fetch failed', e); return []; }),
          apiSharedLinks.getAll().catch(e => { console.warn('Shared links fetch failed', e); return []; }),
          apiSharedCommissions.getAll().catch(e => { console.warn('Shared comms fetch failed', e); return []; }),
          apiAdmin.getActivityLogs().catch(e => { console.warn('Activity logs fetch failed', e); return []; }),
          apiAdmin.getLoginHistory().catch(e => { console.warn('Login history fetch failed', e); return []; })
        ]);

        setUsers(usersData || []);
        setProducts(productsData || []);
        setCashbackList(cashbackData || []);
        setTrackedOrders(trackingData || []);
        setWithdrawRequests(withdrawData || []);
        
        // Map new AffiliateClicks to Legacy ClickLogs format
        const mappedClicks = (clicksData || []).map(click => {
           const buyer = (usersData || []).find(u => u.id === click.buyerId);
           const product = (productsData || []).find(p => p.id === click.productId);
           return {
              clickId: click.trackingId,
              userName: buyer ? buyer.name : 'Guest User',
              productName: product ? product.name : 'Unknown Product',
              network: product ? product.platform : 'Unknown Network',
              date: click.createdAt ? new Date(click.createdAt).toLocaleString() : 'N/A'
           };
        });
        setClickLogs(mappedClicks);

        // We no longer need the complex legacy mapping since we have a dedicated collection
        setSharedCommissions(sharedCommissionsData || []);
        setSharedLinks(sharedLinksData || []);
        
        setConversions(conversionsData || []);
        setFinance(financeData || {
          totalRevenue: 0.00,
          totalCashbackPaid: 0.00,
          totalWithdrawPaid: 0.00,
          pendingWithdrawals: 0.00,
          totalApprovedBalance: 0.00,
          totalPendingBalance: 0.00,
          totalWithdrawnAmount: 0.00,
          totalWalletBalance: 0.00,
          transactions: [],
        });
        setGlobalSettings(settingsData || {
          cashbackPercent: 8.0,
          holdDays: 30,
          minimumWithdrawal: 10.00,
        });

        setCategories(categoriesData || []);
        setDeals(dealsData || []);
        setStoresData(storesRes || []);
        setBanners(bannersData || []);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [refreshKey]);

  // --- AUTOMATIC EXPIRED RETURN WINDOWS CHECKER ---
  React.useEffect(() => {
    if (trackedOrders.length === 0) return;

    const checkExpirations = () => {
      if (!trackedOrders || trackedOrders.length === 0) return;
      const today = new Date();
      trackedOrders.forEach(o => {
        if (o.status === 'return_active' && o.returnExpiryDate) {
          const expiryDate = new Date(o.returnExpiryDate);
          if (expiryDate <= today) {
            console.log(`[Auto-Expiry] Return window for order ${o.id} expired. Completing tracking.`);
            updateTrackedOrderStatus(o.id, 'completed');
            onAddNotification(`Return window for order ${o.id} has expired. Cashback approved!`, 'success');
          }
        }
      });
    };

    checkExpirations();

    const interval = setInterval(checkExpirations, 10000);
    return () => clearInterval(interval);
  }, [trackedOrders]);

  const adminEmail = currentUser ? currentUser.email : "admin@liomart.com";
  const adminName = currentUser ? currentUser.name : "Administrator";
  const adminInitials = currentUser && currentUser.name ? currentUser.name.substring(0, 2).toUpperCase() : "AD";

  // Sidebar menu configuration mapping
  const allMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'users', label: 'Users', icon: UsersIcon },
    { id: 'roles', label: 'Roles & Permissions', icon: ShieldCheck },
    { id: 'products', label: 'Products', icon: ShoppingBag },
    { id: 'withdrawals', label: 'Withdrawals', icon: Wallet },
    { id: 'click-logs', label: 'Click Logs', icon: MousePointer },
    { id: 'conversions', label: 'Conversions', icon: CheckSquare },
    { id: 'shared-commissions', label: 'Shared Commissions', icon: Share2 },
    { id: 'referrals', label: 'Referrals', icon: Share2 },
    { id: 'banners', label: 'Banners', icon: LayoutDashboard },
    { id: 'stores', label: 'Stores', icon: ShoppingBag },
    { id: 'categories', label: 'Categories', icon: ShoppingBag },
    { id: 'deals', label: 'Deals', icon: Gift },
    { id: 'affiliate-network', label: 'Affiliate Network', icon: Globe },
    { id: 'ledger', label: 'Ledger Management', icon: Wallet },
    { id: 'seo', label: 'SEO', icon: FileText },
    { id: 'tickets', label: 'Support Tickets', icon: HelpCircle },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  // Filter menu items based on admin role's allowedModules
  const adminRole = currentUser?.role || 'USER';
  const isSuperAdmin = adminRole === 'SUPER_ADMIN';

  // Fallback module lists for when permissions.allowedModules is missing (old sessions)
  const ROLE_MODULE_DEFAULTS = {
    'SUPER_ADMIN': null, // null = all modules
    'ADMIN': ['dashboard', 'users', 'products', 'withdrawals', 'click-logs', 'conversions', 'referrals', 'shared-commissions', 'categories', 'deals', 'stores', 'banners', 'affiliate-network', 'ledger', 'seo', 'settings', 'finance', 'tickets'],
    'CONTENT_MANAGER': ['dashboard', 'products', 'categories', 'deals', 'stores', 'banners', 'seo'],
    'AFFILIATE_MANAGER': ['dashboard', 'users', 'conversions', 'referrals', 'shared-commissions', 'click-logs', 'affiliate-network', 'ledger', 'finance'],
    'SUPPORT_ADMIN': ['dashboard', 'users', 'withdrawals', 'conversions', 'tickets'],
  };

  const rawAllowedModules = currentUser?.permissions?.allowedModules;
  const allowedModules = (rawAllowedModules && rawAllowedModules.length > 0)
    ? rawAllowedModules
    : (ROLE_MODULE_DEFAULTS[adminRole] || []);

  const menuItems = isSuperAdmin
    ? allMenuItems
    : allMenuItems.filter(item => allowedModules.includes(item.id));

  // Helper actions
  const addProduct = async (prod) => {
    try {
      let newProd;
      try {
        newProd = await apiProducts.create(prod);
      } catch (apiErr) {
        console.warn('Backend API add failed, using local product:', apiErr);
        newProd = {
          ...prod,
          id: `prod-${Date.now()}`,
          status: 'active',
          isActive: true,
          createdAt: new Date().toISOString()
        };
      }
      if (!newProd) {
        newProd = { ...prod, id: `prod-${Date.now()}`, status: 'active', isActive: true, createdAt: new Date().toISOString() };
      }

      // Persist to localStorage immediately
      try {
        const stored = localStorage.getItem('lio_custom_products');
        const list = stored ? JSON.parse(stored) : [];
        const updatedList = [newProd, ...list.filter(p => p.id !== newProd.id && p.name !== newProd.name)];
        localStorage.setItem('lio_custom_products', JSON.stringify(updatedList));
      } catch (e) {
        console.warn('Could not save to localStorage:', e);
      }

      setProducts((prev) => [newProd, ...prev.filter(p => p.id !== newProd.id)]);
      if (onUpdateProducts) onUpdateProducts((prev) => [newProd, ...prev.filter(p => p.id !== newProd.id)]);
      if (onRefreshCatalog) onRefreshCatalog();
      onAddNotification('Product added successfully and published to Home Page!', 'success');
    } catch (err) {
      console.error(err);
      onAddNotification('Failed to add product.', 'error');
    }
  };

  const addProductBulk = async (productsList) => {
    try {
      let added;
      try {
        added = await apiProducts.createBulk(productsList);
      } catch (apiErr) {
        console.warn('Backend API bulk add failed, using local products:', apiErr);
        added = productsList.map((p, idx) => ({
          ...p,
          id: p.id || `bulk-prod-${Date.now()}-${idx}`,
          status: 'active',
          isActive: true,
          createdAt: new Date().toISOString()
        }));
      }

      if (!added || !Array.isArray(added)) {
        added = productsList.map((p, idx) => ({
          ...p,
          id: p.id || `bulk-prod-${Date.now()}-${idx}`,
          status: 'active',
          isActive: true,
          createdAt: new Date().toISOString()
        }));
      }

      // Persist to localStorage immediately
      try {
        const stored = localStorage.getItem('lio_custom_products');
        const list = stored ? JSON.parse(stored) : [];
        const updatedList = [...added, ...list.filter(lp => !added.some(ap => ap.id === lp.id || ap.name === lp.name))];
        localStorage.setItem('lio_custom_products', JSON.stringify(updatedList));
      } catch (e) {
        console.warn('Could not save to localStorage:', e);
      }

      setProducts((prev) => [...added, ...prev]);
      if (onUpdateProducts) onUpdateProducts((prev) => [...added, ...prev]);
      if (onRefreshCatalog) onRefreshCatalog();
      onAddNotification(`Successfully added ${added.length} products to catalog and Home Page!`, 'success');
    } catch (err) {
      console.error(err);
      onAddNotification('Failed to import products in bulk.', 'error');
    }
  };

  const editProduct = async (editedProd) => {
    try {
      let updatedProd;
      try {
        updatedProd = await apiProducts.update(editedProd);
      } catch (apiErr) {
        console.warn('Backend API update failed, falling back to local object:', apiErr);
        updatedProd = editedProd;
      }
      if (!updatedProd) updatedProd = editedProd;

      try {
        const stored = localStorage.getItem('lio_custom_products');
        if (stored) {
          const list = JSON.parse(stored);
          const updatedList = list.map(p => p.id === updatedProd.id ? updatedProd : p);
          localStorage.setItem('lio_custom_products', JSON.stringify(updatedList));
        }
      } catch (e) {}

      const updatedList = products.map((p) => (p.id === updatedProd.id ? updatedProd : p));
      setProducts(updatedList);
      if (onUpdateProducts) {
        onUpdateProducts((prev) => prev.map((p) => (p.id === updatedProd.id ? updatedProd : p)));
      }
      if (onRefreshCatalog) onRefreshCatalog();
      onAddNotification('Product details modified successfully.', 'success');
    } catch (err) {
      console.error(err);
      onAddNotification('Failed to update product details.', 'error');
    }
  };

  const toggleProductStatus = async (id) => {
    try {
      const current = products.find(p => p.id === id);
      if (!current) return;
      const nextStatus = current.status === 'active' ? 'inactive' : 'active';
      let updatedProd;
      try {
        updatedProd = await apiProducts.update({ ...current, status: nextStatus, isActive: nextStatus === 'active' });
      } catch (apiErr) {
        updatedProd = { ...current, status: nextStatus, isActive: nextStatus === 'active' };
      }
      if (!updatedProd) updatedProd = { ...current, status: nextStatus, isActive: nextStatus === 'active' };

      try {
        const stored = localStorage.getItem('lio_custom_products');
        if (stored) {
          const list = JSON.parse(stored);
          const updatedList = list.map(p => p.id === id ? { ...p, status: nextStatus, isActive: nextStatus === 'active' } : p);
          localStorage.setItem('lio_custom_products', JSON.stringify(updatedList));
        }
      } catch (e) {}

      const updatedList = products.map((p) => (p.id === id ? updatedProd : p));
      setProducts(updatedList);
      if (onUpdateProducts) {
        onUpdateProducts((prev) => prev.map((p) => (p.id === id ? updatedProd : p)));
      }
      if (onRefreshCatalog) onRefreshCatalog();
      onAddNotification(`Product status changed to ${nextStatus}.`, 'info');
    } catch (err) {
      console.error(err);
      onAddNotification('Failed to update product status.', 'error');
    }
  };

  const deleteProduct = async (id) => {
    try {
      try {
        await apiProducts.delete(id);
      } catch (apiErr) {
        console.warn('Backend delete API failed, removing locally:', apiErr);
      }

      try {
        const stored = localStorage.getItem('lio_custom_products');
        if (stored) {
          const list = JSON.parse(stored);
          const updatedList = list.filter(p => p.id !== id);
          localStorage.setItem('lio_custom_products', JSON.stringify(updatedList));
        }
      } catch (e) {}

      setProducts((prev) => prev.filter((p) => p.id !== id));
      if (onUpdateProducts) onUpdateProducts((prev) => prev.filter((p) => p.id !== id));
      if (onRefreshCatalog) onRefreshCatalog();
      onAddNotification('Product deleted successfully.', 'success');
    } catch (err) {
      console.error(err);
      onAddNotification('Failed to delete product.', 'error');
    }
  };

  const approveCashback = async (id, amount) => {
    try {
      await apiCashback.approve(id, amount);
      setCashbackList((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status: 'approved' } : c))
      );
      setFinance((prev) => ({
        ...prev,
        totalCashbackPaid: prev.totalCashbackPaid + amount,
      }));
      onAddNotification('Cashback claim approved.', 'success');
    } catch (err) {
      console.error(err);
      onAddNotification('Failed to approve cashback.', 'error');
    }
  };

  const rejectCashback = async (id) => {
    try {
      await apiCashback.reject(id);
      setCashbackList((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status: 'rejected' } : c))
      );
      onAddNotification('Cashback claim rejected.', 'error');
    } catch (err) {
      console.error(err);
      onAddNotification('Failed to reject cashback.', 'error');
    }
  };

  const approveWithdrawal = async (id, amount) => {
    try {
      await apiWithdrawals.approve(id, amount);
      setWithdrawRequests((prev) =>
        prev.map((w) => (w.id === id ? { ...w, status: 'approved' } : w))
      );
      // Re-fetch finance logs to stay fully in sync
      const financeData = await apiFinance.getData();
      setFinance(financeData);
      onAddNotification('Withdrawal payout settled.', 'success');
    } catch (err) {
      console.error(err);
      onAddNotification('Failed to approve withdrawal.', 'error');
    }
  };

  const rejectWithdrawal = async (id) => {
    try {
      const request = withdrawRequests.find(w => w.id === id);
      const amount = request ? request.amount : 0;
      await apiWithdrawals.reject(id, amount);
      setWithdrawRequests((prev) =>
        prev.map((w) => (w.id === id ? { ...w, status: 'rejected' } : w))
      );
      // Re-fetch finance logs to stay fully in sync
      const financeData = await apiFinance.getData();
      setFinance(financeData);
      onAddNotification('Withdrawal payout rejected and coins returned.', 'error');
    } catch (err) {
      console.error(err);
      onAddNotification('Failed to reject withdrawal.', 'error');
    }
  };

  const adjustConversion = async (id, amount, type) => {
    try {
      await apiAnalytics.adjustConversion(id, amount, type);
      setConversions((prev) =>
        prev.map((c) => {
          if (c.id === id) {
            const nextStatus = type === 'credit' ? 'approved' : 'rejected';
            return { ...c, commission: amount, status: nextStatus };
          }
          return c;
        })
      );
      // Re-fetch finance logs to stay fully in sync
      const financeData = await apiFinance.getData();
      setFinance(financeData);
      onAddNotification(type === 'credit' ? `Manual Credit: ₹${amount} added successfully.` : `Manual Debit: ₹${amount} deducted successfully.`, type === 'credit' ? 'success' : 'info');
    } catch (err) {
      console.error(err);
      onAddNotification('Failed to adjust conversion.', 'error');
    }
  };

  const addTrackedOrder = async (newTrackOrder) => {
    try {
      const addedOrder = await apiTracking.create(newTrackOrder);
      setTrackedOrders(prev => [addedOrder, ...prev]);

      // Re-fetch cashback and conversions since they sync with new tracking
      const [cashbackData, conversionsData] = await Promise.all([
        apiCashback.getAll(),
        apiAnalytics.getConversions()
      ]);
      setCashbackList(cashbackData);
      setConversions(conversionsData);

      onAddNotification(`Started tracking product: ${newTrackOrder.productName}`, 'success');
    } catch (err) {
      console.error(err);
      onAddNotification('Failed to initialize tracking.', 'error');
    }
  };

  const updateTrackedOrderStatus = async (trackId, newStatus, datesUpdate = {}) => {
    try {
      const updatedOrder = await apiTracking.updateStatus(trackId, newStatus, datesUpdate);
      setTrackedOrders(prev => prev.map(o => o.id === trackId ? updatedOrder : o));

      // Re-fetch synced state elements
      const [cashbackData, financeData] = await Promise.all([
        apiCashback.getAll(),
        apiFinance.getData()
      ]);
      setCashbackList(cashbackData);
      setFinance(financeData);
    } catch (err) {
      console.error(err);
      onAddNotification('Failed to update tracking status.', 'error');
    }
  };

  const updateGlobalSettings = async (newSettings) => {
    try {
      const settings = await apiSettings.update(newSettings);
      setGlobalSettings(settings);
      onAddNotification('Platform configurations updated successfully.', 'success');
    } catch (err) {
      console.error(err);
      onAddNotification('Failed to update platform settings.', 'error');
    }
  };

  const editUser = async (id, userData) => {
    try {
      const updatedUser = await apiUsers.update(id, userData);
      setUsers((prev) => prev.map((u) => (u.id === id ? updatedUser : u)));
      onAddNotification('User details updated successfully.', 'success');
    } catch (err) {
      console.error(err);
      onAddNotification('Failed to update user details.', 'error');
    }
  };

  const approveSharedCommission = async (id, amount) => {
    try {
      await apiSharedCommissions.updateStatus(id, { status: 'approved' });
      setRefreshKey(prev => prev + 1);
      onAddNotification('Shared link commission claim approved!', 'success');
    } catch (err) {
      console.error(err);
      onAddNotification('Failed to approve shared commission.', 'error');
    }
  };

  const rejectSharedCommission = async (id) => {
    try {
      await apiSharedCommissions.updateStatus(id, { status: 'rejected' });
      setRefreshKey(prev => prev + 1);
      onAddNotification('Shared link commission claim rejected.', 'error');
    } catch (err) {
      console.error(err);
      onAddNotification('Failed to reject shared commission.', 'error');
    }
  };

  const adjustSharedCommission = async (id, userAmount, totalAmount, currentStatus) => {
    try {
      await apiSharedCommissions.updateStatus(id, { userAmount: userAmount, amount: totalAmount, status: 'approved' });
      setRefreshKey(prev => prev + 1);
      onAddNotification(`Fixed commission payout adjusted and approved. User gets ₹${userAmount}.`, 'success');
    } catch (err) {
      console.error(err);
      onAddNotification('Failed to adjust shared commission.', 'error');
    }
  };

  const addCategory = async (cat) => {
    try {
      let newCat;
      try {
        newCat = await apiCategories.create(cat);
      } catch (apiErr) {
        console.warn('Backend API add category failed, falling back to local object:', apiErr);
        newCat = {
          ...cat,
          id: `cat-${Date.now()}`,
          created: new Date().toISOString().split('T')[0]
        };
      }
      setCategories((prev) => [...prev, newCat]);
      if (onUpdateCategories) onUpdateCategories((prev) => [...prev, newCat]);
      if (onRefreshCatalog) onRefreshCatalog();
      onAddNotification('Category added successfully.', 'success');
    } catch (err) {
      console.error(err);
      onAddNotification('Failed to add category.', 'error');
    }
  };

  const editCategory = async (cat) => {
    try {
      let updatedCat;
      try {
        updatedCat = await apiCategories.update(cat);
      } catch (apiErr) {
        console.warn('Backend API update category failed, falling back to local object:', apiErr);
        updatedCat = cat;
      }
      setCategories((prev) => prev.map((c) => (c.id === updatedCat.id ? updatedCat : c)));
      if (onUpdateCategories) onUpdateCategories((prev) => prev.map((c) => (c.id === updatedCat.id ? updatedCat : c)));
      if (onRefreshCatalog) onRefreshCatalog();
      onAddNotification('Category updated successfully.', 'success');
    } catch (err) {
      console.error(err);
      onAddNotification('Failed to update category.', 'error');
    }
  };

  const deleteCategory = async (id) => {
    try {
      try {
        await apiCategories.delete(id);
      } catch (apiErr) {
        console.warn('Backend delete category failed, removing locally:', apiErr);
      }
      setCategories((prev) => prev.filter((c) => c.id !== id));
      if (onUpdateCategories) onUpdateCategories((prev) => prev.filter((c) => c.id !== id));
      if (onRefreshCatalog) onRefreshCatalog();
      onAddNotification('Category deleted successfully.', 'success');
    } catch (err) {
      console.error(err);
      onAddNotification('Failed to delete category.', 'error');
    }
  };

  const addDeal = async (deal) => {
    try {
      const newDeal = await apiDeals.create(deal);
      setDeals((prev) => [...prev, newDeal]);
      if (onUpdateDeals) onUpdateDeals((prev) => [...prev, newDeal]);
      if (onRefreshCatalog) onRefreshCatalog();
      onAddNotification('Deal added successfully.', 'success');
    } catch (err) {
      console.error(err);
      onAddNotification('Failed to add deal.', 'error');
    }
  };

  const deleteDeal = async (id) => {
    try {
      await apiDeals.delete(id);
      setDeals((prev) => prev.filter((d) => d.id !== id));
      if (onUpdateDeals) onUpdateDeals((prev) => prev.filter((d) => d.id !== id));
      if (onRefreshCatalog) onRefreshCatalog();
      onAddNotification('Deal deleted successfully.', 'success');
    } catch (err) {
      console.error(err);
      onAddNotification('Failed to delete deal.', 'error');
    }
  };

  const addStore = async (store) => {
    try {
      const newStore = await apiStores.create(store);
      setStoresData((prev) => [...prev, newStore]);
      if (onUpdateStores) onUpdateStores((prev) => [...prev, newStore]);
      if (onRefreshCatalog) onRefreshCatalog();
      onAddNotification('Store added successfully.', 'success');
    } catch (err) {
      console.error(err);
      onAddNotification('Failed to add store.', 'error');
    }
  };

  const editStore = async (store) => {
    try {
      const updatedStore = await apiStores.update(store.id, store);
      setStoresData((prev) => prev.map((s) => (s.id === updatedStore.id ? updatedStore : s)));
      if (onUpdateStores) {
        onUpdateStores((prev) => prev.map((s) => (s.id === updatedStore.id ? updatedStore : s)));
      }
      if (onRefreshCatalog) onRefreshCatalog();
      onAddNotification('Store updated successfully.', 'success');
    } catch (err) {
      console.error(err);
      onAddNotification('Failed to update store.', 'error');
    }
  };

  const deleteStore = async (id) => {
    try {
      await apiStores.delete(id);
      setStoresData((prev) => prev.filter((s) => s.id !== id));
      if (onUpdateStores) onUpdateStores((prev) => prev.filter((s) => s.id !== id));
      if (onRefreshCatalog) onRefreshCatalog();
      onAddNotification('Store deleted successfully.', 'success');
    } catch (err) {
      console.error(err);
      onAddNotification('Failed to delete store.', 'error');
    }
  };

  const addBanner = async (banner) => {
    try {
      const newBanner = await apiBanners.create(banner);
      setBanners((prev) => [...prev, newBanner]);
      if (onUpdateBanners) onUpdateBanners((prev) => [...prev, newBanner]);
      if (onRefreshCatalog) onRefreshCatalog();
      onAddNotification('Banner added successfully.', 'success');
    } catch (err) {
      console.error(err);
      onAddNotification('Failed to add banner.', 'error');
    }
  };

  const editBanner = async (banner) => {
    try {
      const updatedBanner = await apiBanners.update(banner.id, banner);
      setBanners((prev) => prev.map((b) => (b.id === updatedBanner.id ? updatedBanner : b)));
      if (onUpdateBanners) {
        onUpdateBanners((prev) => prev.map((b) => (b.id === updatedBanner.id ? updatedBanner : b)));
      }
      if (onRefreshCatalog) onRefreshCatalog();
      onAddNotification('Banner updated successfully.', 'success');
    } catch (err) {
      console.error(err);
      onAddNotification('Failed to update banner.', 'error');
    }
  };

  const deleteBanner = async (id) => {
    try {
      await apiBanners.delete(id);
      setBanners((prev) => prev.filter((b) => b.id !== id));
      if (onUpdateBanners) onUpdateBanners((prev) => prev.filter((b) => b.id !== id));
      if (onRefreshCatalog) onRefreshCatalog();
      onAddNotification('Banner deleted successfully.', 'success');
    } catch (err) {
      console.error(err);
      onAddNotification('Failed to delete banner.', 'error');
    }
  };

  // Helper: check if current admin can access a given module
  const canAccessModule = (moduleId) => {
    if (isSuperAdmin || adminRole === 'ADMIN') return true;
    return allowedModules.includes(moduleId);
  };

  // Permission helpers for action-level control
  const canAdd = currentUser?.permissions?.add !== false;
  const canEdit = currentUser?.permissions?.edit !== false;
  const canDelete = currentUser?.permissions?.delete !== false;

  const renderContent = () => {
    // Guard: if admin navigates to a tab they don't have access to
    if (!canAccessModule(activeTab)) {
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          minHeight: '400px', gap: '16px', textAlign: 'center', padding: '40px',
        }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '50%',
            backgroundColor: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <ShieldCheck size={28} color="#ef4444" />
          </div>
          <h3 style={{ color: 'var(--text-bold)', margin: 0 }}>Access Denied</h3>
          <p style={{ color: 'var(--text)', fontSize: '14px', maxWidth: '400px' }}>
            Your role <strong>{(adminRole || '').replace('_', ' ')}</strong> doesn't have permission to access this module.
            Contact a Super Admin to request access.
          </p>
          <button className="admin-btn admin-btn-primary" onClick={() => setActiveTab('dashboard')}>
            Go to Dashboard
          </button>
        </div>
      );
    }

    switch (activeTab) {
      case 'dashboard':
        return (
          <AdminDashboard
            users={users}
            products={products}
            orders={cashbackList}
            withdrawRequests={withdrawRequests}
            finance={finance}
            cashbackList={cashbackList}
            clickLogsCount={clickLogs.length}
            conversionsCount={conversions.length}
            setTab={setActiveTab}
          />
        );
      case 'users':
        return (
          <AdminUsers
            users={users}
            setUsers={setUsers}
            onEditUser={editUser}
            onAddNotification={onAddNotification}
            currentUser={currentUser}
          />
        );
      case 'roles':
        return (
          <AdminRoles
            users={users}
            setUsers={setUsers}
            onEditUser={editUser}
            onAddNotification={onAddNotification}
            currentUser={currentUser}
          />
        );
      case 'products':
        return (
          <AdminProducts
            products={products}
            stores={storesData}
            categories={categories}
            onAddProduct={addProduct}
            onAddProductBulk={addProductBulk}
            onEditProduct={editProduct}
            onToggleStatus={toggleProductStatus}
            onDeleteProduct={deleteProduct}
          />
        );
      case 'withdrawals':
        return (
          <AdminWithdrawals
            withdrawRequests={withdrawRequests}
            onApprove={approveWithdrawal}
            onReject={rejectWithdrawal}
          />
        );
      case 'click-logs':
        return <AdminClickLogs clickLogs={clickLogs} />;
      case 'conversions':
        return (
          <AdminConversions
            conversions={conversions}
            onAdjustConversion={adjustConversion}
            onAddNotification={onAddNotification}
          />
        );
      case 'referrals':
        return <AdminReferrals users={users} />;
      case 'shared-commissions':
        return (
          <AdminSharedCommissions
            sharedLinks={sharedLinks}
            sharedCommissions={sharedCommissions}
            onApproveCommission={approveSharedCommission}
            onRejectCommission={rejectSharedCommission}
            onAdjustCommission={adjustSharedCommission}
            onAddNotification={onAddNotification}
          />
        );
      case 'ledger':
        return <AdminLedger users={users} />;
      case 'categories':
        return (
          <AdminCategories
            categories={categories}
            onAddCategory={addCategory}
            onEditCategory={editCategory}
            onDeleteCategory={deleteCategory}
          />
        );
      case 'deals':
        return (
          <AdminDeals
            deals={deals}
            onAddDeal={addDeal}
            onDeleteDeal={deleteDeal}
          />
        );
      case 'stores':
        return (
          <AdminStores
            stores={storesData}
            onAddStore={addStore}
            onEditStore={editStore}
            onDeleteStore={deleteStore}
            onAddNotification={onAddNotification}
          />
        );
      case 'banners':
        return (
          <AdminBanners
            banners={banners}
            onAddBanner={addBanner}
            onEditBanner={editBanner}
            onDeleteBanner={deleteBanner}
            onAddNotification={onAddNotification}
          />
        );
      case 'affiliate-network':
        return <AdminAffiliateNetwork addNotification={onAddNotification} />;
      case 'seo':
        return (
          <AdminSEO
            globalSettings={globalSettings}
            onSaveSettings={updateGlobalSettings}
          />
        );
      case 'settings':
        return (
          <AdminSettings
            globalSettings={globalSettings}
            onSaveSettings={updateGlobalSettings}
          />
        );
      case 'tickets':
        return <AdminTickets adminUser={currentUser} />;
      case 'activity-logs':
        return <AdminActivityLogs activityLogs={activityLogs} />;
      case 'login-history':
        return <AdminLoginHistory loginHistory={loginHistory} />;
      default:
        return (
          <AdminDashboard
            users={users}
            products={products}
            orders={cashbackList}
            withdrawRequests={withdrawRequests}
            finance={finance}
          />
        );
    }
  };

  const handleMobileNavClick = (tabId) => {
    setActiveTab(tabId);
    setIsMobileOpen(false);
  };

  return (
    <div className="admin-layout animate-fade">
      {/* Mobile Sidebar Backdrop */}
      {isMobileOpen && (
        <div
          className="admin-sidebar-backdrop"
          onClick={() => setIsMobileOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(2px)',
            zIndex: 99,
          }}
        />
      )}
      {/* Sidebar Component */}
      <aside className={`admin-sidebar ${isSidebarCollapsed ? 'collapsed' : ''} ${isMobileOpen ? 'mobile-open' : ''}`}>
        <div className="admin-sidebar-logo" onClick={() => setActiveTab('dashboard')}>
          <div className="logo-icon">L</div>
          <h2>
            LIO<span> MART Admin</span>
          </h2>
        </div>

        <nav className="admin-sidebar-menu">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                className={`admin-sidebar-link ${activeTab === item.id ? 'active' : ''}`}
                onClick={() => handleMobileNavClick(item.id)}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </div>
            );
          })}
        </nav>

        <div className="admin-sidebar-footer" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div className="admin-sidebar-link" onClick={() => {
            if (setView) setView('home');
            else { window.location.hash = '#/'; window.location.reload(); }
          }} style={{ color: '#3b82f6', cursor: 'pointer' }}>
            <Globe size={18} />
            <span>View User Store</span>
          </div>
          <div className="admin-sidebar-link" onClick={() => {
            window.history.pushState(null, '', '/');
            onLogout();
          }} style={{ color: '#ef4444' }}>
            <LogOut size={18} />
            <span>Logout Panel</span>
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <div className={`admin-main-container ${isSidebarCollapsed ? 'expanded' : ''}`}>
        {/* Top Navbar */}
        <header className="admin-navbar">
          <div className="admin-navbar-left">
            <button
              className="admin-toggle-sidebar-btn"
              onClick={() => {
                setIsSidebarCollapsed(!isSidebarCollapsed);
                setIsMobileOpen(!isMobileOpen);
              }}
              aria-label="Toggle sidebar"
            >
              <Menu size={18} />
            </button>
          </div>

          <div className="admin-navbar-right" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={() => {
                if (setView) setView('home');
                else { window.location.hash = '#/'; window.location.reload(); }
              }}
              className="admin-btn admin-btn-secondary"
              style={{ padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', borderRadius: '6px' }}
            >
              <Globe size={14} />
              <span>View User Store</span>
            </button>

            {/* Dark/Light mode toggle */}
            <button
              onClick={toggleTheme}
              className="theme-toggle-btn"
              aria-label="Toggle theme"
              style={{ border: '1px solid var(--border)', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--card-bg)' }}
            >
              {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
            </button>

            {/* Notification Badge */}
            <div style={{ position: 'relative' }}>
              <button
                className="admin-btn-icon"
                onClick={() => setShowNotifications(!showNotifications)}
                style={{ borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <Bell size={16} />
                {withdrawRequests.filter((w) => w.status === 'pending').length > 0 && (
                  <span style={{ position: 'absolute', top: '2px', right: '2px', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ef4444' }} />
                )}
              </button>

              {showNotifications && (
                <div
                  className="animate-fade"
                  style={{
                    position: 'absolute',
                    top: '44px',
                    right: 0,
                    backgroundColor: 'var(--card-bg)',
                    border: '1px solid var(--border)',
                    boxShadow: 'var(--shadow-lg)',
                    borderRadius: 'var(--radius-sm)',
                    width: '280px',
                    zIndex: 200,
                    padding: '12px',
                  }}
                >
                  <h4 style={{ fontSize: '13px', fontWeight: '700', marginBottom: '8px', color: 'var(--text-bold)' }}>Pending Notifications</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {withdrawRequests.filter((w) => w.status === 'pending').map((w) => (
                      <div
                        key={w.id}
                        style={{ fontSize: '12px', padding: '8px', backgroundColor: 'var(--bg)', borderRadius: '4px', cursor: 'pointer' }}
                        onClick={() => {
                          setActiveTab('withdrawals');
                          setShowNotifications(false);
                        }}
                      >
                        Withdraw request of <strong>₹{w.amount}</strong> from {w.userName} is pending.
                      </div>
                    ))}
                    {withdrawRequests.filter((w) => w.status === 'pending').length === 0 && (
                      <div style={{ fontSize: '12px', color: 'var(--text)', textAlign: 'center', padding: '12px' }}>
                        No pending alerts.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Admin Profile */}
            <div className="admin-profile-badge">
              <div className="admin-avatar">{adminInitials}</div>
              <div className="admin-profile-info">
                <span className="admin-profile-name">{adminName}</span>
                <span className="admin-profile-email" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {adminEmail}
                  <span style={{
                    fontSize: '9px',
                    padding: '1px 6px',
                    borderRadius: '10px',
                    backgroundColor: isSuperAdmin ? '#fef3c7' : '#dbeafe',
                    color: isSuperAdmin ? '#92400e' : '#1e40af',
                    fontWeight: '600',
                    whiteSpace: 'nowrap',
                  }}>
                    {(adminRole || 'ADMIN').replace('_', ' ')}
                  </span>
                </span>
              </div>
            </div>

            {/* Logout button */}
            <button
              onClick={() => {
                window.history.pushState(null, '', '/');
                onLogout();
              }}
              className="admin-btn-icon"
              title="Logout"
              style={{ color: '#ef4444', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <LogOut size={16} />
            </button>
          </div>
        </header>

        {/* Content Render Panel */}
        <main className="admin-content">{renderContent()}</main>
      </div>
    </div>
  );
}
