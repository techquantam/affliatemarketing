// Detect if running inside Capacitor native shell (Android/iOS)
const isCapacitorNative = typeof window !== 'undefined' && window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform();

// IMPORTANT: APK runs on 'localhost', so we must NOT use localhost:8080 logic for the APK.
// We force the Render URL for the APK/Native build.
const localHostnames = ['localhost', '127.0.0.1', '::1'];
const isLocalhost = typeof window !== 'undefined' && localHostnames.includes(window.location.hostname);

export const BASE_URL = import.meta.env.VITE_API_URL ||
  (isCapacitorNative ? 'https://affliatemarketing.onrender.com/api' :
   (isLocalhost ? 'http://localhost:8080/api' : 'https://affliatemarketing.onrender.com/api'));

console.log(`[API Service] Running in BACKEND (${BASE_URL}) mode. Native: ${isCapacitorNative}`);

// --- HELPER WRAPPER TO MAKE FETCH REQUESTS ---
async function request(url, options = {}, retryCount = 0) {
  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  // In Capacitor native, the WebView origin is http://localhost which causes
  // CORS preflight failures when mode is 'cors'. Omit mode entirely so the
  // browser/webview uses the default (no-cors won't work for reading JSON,
  // but omitting mode lets the native layer handle it correctly).
  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  // Only set cors mode when running in a real browser (not Capacitor native)
  if (!isCapacitorNative) {
    config.mode = options.mode || 'cors';
  }

  // Add a 180-second timeout to handle Render free-tier cold starts (takes ~130s to wake up)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 180000);
  config.signal = controller.signal;

  try {
    const response = await fetch(`${BASE_URL}${url}`, config);
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = errorText || `API error: ${response.status}`;
      let parsedError = null;
      try {
        parsedError = JSON.parse(errorText);
        if (parsedError.error) errorMessage = parsedError.error;
        else if (parsedError.message) errorMessage = parsedError.message;
      } catch (e) {}
      const err = new Error(errorMessage);
      // Attach all parsed fields (e.g. requireOtp) so callers can inspect them
      if (parsedError) Object.assign(err, parsedError);
      err.status = response.status;
      throw err;
    }

    if (response.status === 204) return null;
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  } catch (err) {
    clearTimeout(timeoutId);
    // Auto-retry once on network/timeout errors (common with Render cold starts)
    if (retryCount < 1 && (err.name === 'AbortError' || err.message === 'Failed to fetch' || err.name === 'TypeError')) {
      console.warn(`[API] Request to ${url} failed (${err.message}), retrying...`);
      return request(url, options, retryCount + 1);
    }
    throw err;
  }
}

// --- API ACTIONS DEFINITIONS ---

export const apiStores = {
  getAll: () => request('/stores'),
  create: (store) => request('/stores', { method: 'POST', body: JSON.stringify(store) }),
  update: (id, store) => request(`/stores/${id}`, { method: 'PUT', body: JSON.stringify(store) }),
  delete: (id) => request(`/stores/${id}`, { method: 'DELETE' })
};

export const apiUpload = {
  uploadImage: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch(`${BASE_URL}/upload`, {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Upload failed: ${errText}`);
    }
    return await response.json();
  }
};

export const apiBanners = {
  getAll: () => request('/banners'),
  getActive: () => request('/banners/active'),
  create: (banner) => request('/banners', { method: 'POST', body: JSON.stringify(banner) }),
  update: (id, banner) => request(`/banners/${id}`, { method: 'PUT', body: JSON.stringify(banner) }),
  delete: (id) => request(`/banners/${id}`, { method: 'DELETE' })
};

export const apiDeals = {
  getAll: () => request('/deals'),
  create: (deal) => request('/deals', { method: 'POST', body: JSON.stringify(deal) }),
  update: (id, deal) => request(`/deals/${id}`, { method: 'PUT', body: JSON.stringify(deal) }),
  delete: (id) => request(`/deals/${id}`, { method: 'DELETE' })
};

export const apiUsers = {
  getAll: () => request('/users'),
  login: (identifier, password) => {
    const payload = { password, identifier };
    if (identifier && identifier.includes('@')) payload.email = identifier;
    else payload.phone = identifier;
    return request('/users/login', { method: 'POST', body: JSON.stringify(payload) });
  },
  adminLogin: (identifier, password) => {
    const payload = { password, identifier };
    if (identifier && identifier.includes('@')) payload.email = identifier;
    else payload.phone = identifier;
    return request('/users/admin/login', { method: 'POST', body: JSON.stringify(payload) });
  },
  register: (name, identifier, password, referredBy = null) => {
    const payload = { name, password, referredBy, identifier };
    if (identifier && identifier.includes('@')) payload.email = identifier;
    else payload.phone = identifier;
    return request('/users/register', { method: 'POST', body: JSON.stringify(payload) });
  },
  verifyOtp: (identifier, otp) => request('/users/verify-otp', { method: 'POST', body: JSON.stringify({ identifier, otp }) }),
  resendOtp: (identifier) => request('/users/resend-otp', { method: 'POST', body: JSON.stringify({ identifier }) }),
  updateStatus: (id, status) => request(`/users/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
  update: (id, userData) => request(`/users/${id}`, { method: 'PUT', body: JSON.stringify(userData) })
};

export const apiProducts = {
  getAll: () => request('/products'),
  create: (product) => request('/products', { method: 'POST', body: JSON.stringify(product) }),
  createBulk: (productsList) => request('/products/bulk', { method: 'POST', body: JSON.stringify(productsList) }),
  update: (product) => request(`/products/${product.id}`, { method: 'PUT', body: JSON.stringify(product) }),
  delete: (id) => request(`/products/${id}`, { method: 'DELETE' })
};

export const apiTracking = {
  getAll: () => request('/tracking'),
  create: (trackedOrder) => request('/tracking', { method: 'POST', body: JSON.stringify(trackedOrder) }),
  updateStatus: (id, status, datesUpdate = {}) => request(`/tracking/${id}/status`, { method: 'PUT', body: JSON.stringify({ status, ...datesUpdate }) })
};

export const apiCashback = {
  getAll: () => request('/cashback'),
  approve: (id, amount) => request(`/cashback/${id}/approve`, { method: 'PUT', body: JSON.stringify({ amount }) }),
  reject: (id) => request(`/cashback/${id}/reject`, { method: 'PUT' })
};

export const apiWithdrawals = {
  getAll: () => request('/withdrawals'),
  create: (req) => request('/withdrawals', { method: 'POST', body: JSON.stringify(req) }),
  approve: (id, amount) => request(`/withdrawals/${id}/approve`, { method: 'PUT', body: JSON.stringify({ amount }) }),
  reject: (id, amount) => request(`/withdrawals/${id}/reject`, { method: 'PUT', body: JSON.stringify({ amount }) })
};

export const apiAnalytics = {
  getClickLogs: () => request('/analytics/clicks'),
  getConversions: () => request('/analytics/conversions'),
  adjustConversion: (id, amount, type) => request(`/analytics/conversions/${id}/adjust`, { method: 'PUT', body: JSON.stringify({ amount, type }) })
};

export const apiFinance = {
  getData: () => request('/finance'),
  getLedger: () => request('/finance/ledger'),
  getWallets: () => request('/finance/wallets')
};

export const apiWallet = {
  getLedger: (userId) => request(`/wallet/${userId}/ledger`),
  getFullLedger: (userId) => request(`/wallet/${userId}/full-ledger`),
  getBalance: (userId) => request(`/wallet/${userId}`),
  adminAdjustWallet: (payload) => request('/wallet/admin/adjust', { method: 'POST', body: JSON.stringify(payload) }),
};

export const apiSettings = {
  get: () => request('/settings'),
  update: (settingsData) => request('/settings', { method: 'PUT', body: JSON.stringify(settingsData) })
};

export const apiAffiliate = {
  createShare: (referrerId, productId) => request('/affiliate/share', { method: 'POST', body: JSON.stringify({ referrerId, productId }) }),
  getAllShares: () => request('/affiliate/shares'),
  createClick: (buyerId, shareId, productId) => request('/affiliate/clicks', { method: 'POST', body: JSON.stringify({ buyerId, shareId, productId }) }),
  getAllClicks: () => request('/affiliate/clicks'),
  approveCommission: (trackingId) => request(`/affiliate/clicks/${trackingId}/approve`, { method: 'POST' }),
  rejectCommission: (trackingId) => request(`/affiliate/clicks/${trackingId}/reject`, { method: 'POST' }),
  getCommissionHistory: () => request('/affiliate/commissions'),
};

export const apiSharedLinks = {
  getAll: () => request('/shared-links'),
  getByUser: (userId) => request(`/shared-links/user/${userId}`),
  create: (linkData) => request('/shared-links', { method: 'POST', body: JSON.stringify(linkData) }),
  delete: (id) => request(`/shared-links/${id}`, { method: 'DELETE' }),
  incrementClicks: (id) => request(`/shared-links/${id}/click`, { method: 'POST' })
};

export const apiSharedCommissions = {
  getAll: () => request('/shared-commissions'),
  getByUser: (userId) => request(`/shared-commissions/user/${userId}`),
  create: (commData) => request('/shared-commissions', { method: 'POST', body: JSON.stringify(commData) }),
  updateStatus: (id, status, amount) => request(`/shared-commissions/${id}/status`, { method: 'PUT', body: JSON.stringify({ status, amount }) })
};

export const apiAdmin = {
  getActivityLogs: () => request('/admin/activity-logs'),
  getLoginHistory: () => request('/admin/login-history'),
};

export const apiAdminManagement = {
  getAllAdmins: () => request('/users/admins'),
  createAdmin: (adminData, requesterId) => request('/users/admin/create', {
    method: 'POST',
    body: JSON.stringify(adminData),
    headers: { 'X-Admin-Id': requesterId }
  }),
  changeRole: (userId, role, requesterId) => request(`/users/${userId}/role`, {
    method: 'PUT',
    body: JSON.stringify({ role }),
    headers: { 'X-Admin-Id': requesterId }
  }),
};

export const apiCategories = {
  getAll: () => request('/categories'),
  create: (category) => request('/categories', { method: 'POST', body: JSON.stringify(category) }),
  update: (category) => request(`/categories/${category.id}`, { method: 'PUT', body: JSON.stringify(category) }),
  delete: (id) => request(`/categories/${id}`, { method: 'DELETE' })
};

export const apiTickets = {
  // User endpoints
  create: (ticket) => request('/tickets', { method: 'POST', body: JSON.stringify(ticket) }),
  getByUser: (userId) => request(`/tickets/user/${userId}`),
  getById: (id) => request(`/tickets/${id}`),
  addMessage: (id, message) => request(`/tickets/${id}/messages`, { method: 'POST', body: JSON.stringify(message) }),
  // Admin endpoints
  getAll: () => request('/tickets'),
  getStats: () => request('/tickets/stats'),
  updateStatus: (id, status) => request(`/tickets/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
  updatePriority: (id, priority) => request(`/tickets/${id}/priority`, { method: 'PUT', body: JSON.stringify({ priority }) }),
  assign: (id, adminId, adminName) => request(`/tickets/${id}/assign`, { method: 'PUT', body: JSON.stringify({ adminId, adminName }) }),
  delete: (id) => request(`/tickets/${id}`, { method: 'DELETE' }),
};
