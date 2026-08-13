import React, { useState, useEffect } from 'react';
import { apiAffiliate, apiUsers, apiProducts } from '../services/api';
import { Network, CheckCircle, XCircle, Settings, Link2, ExternalLink, ShieldCheck, Zap, Layers, RefreshCw, ShoppingCart, Key, Radio, Check } from 'lucide-react';
import { ExportDataButton } from './AdminComponents';
import { getAffiliateNetworkConfigs, saveAffiliateNetworkConfigs, buildAffiliateTrackingUrl } from '../services/affiliateNetworks';

export default function AdminAffiliateNetwork({ addNotification }) {
  const [activeSubTab, setActiveSubTab] = useState('overview'); // 'overview', 'credentials', 'tester', 'logs'
  const [clicks, setClicks] = useState([]);
  const [commissions, setCommissions] = useState([]);
  const [usersMap, setUsersMap] = useState({});
  const [productsMap, setProductsMap] = useState({});
  
  // Network Configs
  const [configs, setConfigs] = useState(getAffiliateNetworkConfigs());

  // Deep Link Tester States
  const [testStore, setTestStore] = useState('Flipkart');
  const [testProductUrl, setTestProductUrl] = useState('https://www.flipkart.com/apple-iphone-15/p/itm123456');
  const [testUserId, setTestUserId] = useState('user_9921');
  const [generatedTestUrl, setGeneratedTestUrl] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  const fetchData = async () => {
    try {
      const [clicksRes, commsRes, usersRes, productsRes] = await Promise.all([
        apiAffiliate.getAllClicks().catch(() => []),
        apiAffiliate.getCommissionHistory().catch(() => []),
        apiUsers.getAll().catch(() => []),
        apiProducts.getAll().catch(() => [])
      ]);
      setClicks(clicksRes || []);
      setCommissions(commsRes || []);

      const uMap = {};
      (usersRes || []).forEach(u => uMap[u.id] = u.name);
      setUsersMap(uMap);

      const pMap = {};
      (productsRes || []).forEach(p => pMap[p.id] = p.name);
      setProductsMap(pMap);
    } catch (e) {
      console.error(e);
      if (addNotification) addNotification('Failed to load affiliate data', 'error');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveConfigs = (e) => {
    e.preventDefault();
    saveAffiliateNetworkConfigs(configs);
    if (addNotification) addNotification('Affiliate Network configurations saved successfully!', 'success');
  };

  const handleGenerateTestLink = (e) => {
    e.preventDefault();
    if (!testProductUrl.trim()) {
      if (addNotification) addNotification('Please enter a valid product URL.', 'error');
      return;
    }
    const trackingUrl = buildAffiliateTrackingUrl({
      targetUrl: testProductUrl,
      storeName: testStore,
      userId: testUserId || 'demo_user',
      clickId: `test_${Date.now()}`
    });
    setGeneratedTestUrl(trackingUrl);
    if (addNotification) addNotification('Trackable deep link generated!', 'success');
  };

  const handleApprove = async (trackingId) => {
    try {
      await apiAffiliate.approveCommission(trackingId);
      if (addNotification) addNotification('Commission Approved!', 'success');
      fetchData();
    } catch (e) {
      console.error(e);
      if (addNotification) addNotification('Failed to approve commission', 'error');
    }
  };

  const handleReject = async (trackingId) => {
    try {
      await apiAffiliate.rejectCommission(trackingId);
      if (addNotification) addNotification('Commission Rejected!', 'error');
      fetchData();
    } catch (e) {
      console.error(e);
      if (addNotification) addNotification('Failed to reject commission', 'error');
    }
  };

  const STORE_ROUTING = [
    { store: 'Amazon', network: 'Amazon PA-API / Direct', status: 'Active', commission: '10.0%', tag: configs.amazon?.associateTag || 'liomart-21', note: 'Direct PA-API & Associate SubTag' },
    { store: 'Flipkart', network: 'Cuelinks Universal Aggregator', status: 'Active', commission: '8.5%', tag: `pub_id=${configs.cuelinks?.publisherId}`, note: 'Cuelinks Campaign Sub-ID' },
    { store: 'Meesho', network: 'Cuelinks Universal Aggregator', status: 'Active', commission: '14.0%', tag: `pub_id=${configs.cuelinks?.publisherId}`, note: 'Cuelinks Campaign Sub-ID' },
    { store: 'Myntra', network: 'Cuelinks Universal Aggregator', status: 'Active', commission: '12.0%', tag: `pub_id=${configs.cuelinks?.publisherId}`, note: 'Cuelinks Campaign Sub-ID' },
    { store: 'Ajio', network: 'Cuelinks Universal Aggregator', status: 'Active', commission: '15.0%', tag: `pub_id=${configs.cuelinks?.publisherId}`, note: 'Cuelinks Campaign Sub-ID' },
    { store: 'Nykaa Beauty', network: 'Cuelinks Universal Aggregator', status: 'Active', commission: '7.0%', tag: `pub_id=${configs.cuelinks?.publisherId}`, note: 'Cuelinks Campaign Sub-ID' },
    { store: 'MakeMyTrip', network: 'Cuelinks Universal Aggregator', status: 'Active', commission: '9.0%', tag: `pub_id=${configs.cuelinks?.publisherId}`, note: 'Cuelinks Campaign Sub-ID' },
    { store: 'boAt Lifestyle', network: 'Cuelinks Universal Aggregator', status: 'Active', commission: '12.0%', tag: `pub_id=${configs.cuelinks?.publisherId}`, note: 'Cuelinks Campaign Sub-ID' },
    { store: 'Global Brands (ASOS/AliExpress)', network: 'AWIN Network', status: 'Upcoming', commission: '6.0 - 15.0%', tag: configs.awin?.publisherId || 'AWIN-PUB', note: 'Planned for Phase 2' },
  ];

  const exportClicksColumns = [
    { header: 'Date', dataKey: 'date' },
    { header: 'Buyer', dataKey: 'buyer' },
    { header: 'Referrer ShareID', dataKey: 'shareId' },
    { header: 'Product', dataKey: 'product' },
    { header: 'Tracking ID', dataKey: 'trackingId' },
    { header: 'Order ID', dataKey: 'orderId' },
    { header: 'Status', dataKey: 'status' }
  ];

  const formattedClicks = clicks.map(c => ({
    ...c,
    date: new Date(c.createdAt || Date.now()).toLocaleDateString(),
    buyer: c.buyerId ? usersMap[c.buyerId] || c.buyerId : 'Guest',
    product: c.productId ? productsMap[c.productId] || c.productId : 'N/A'
  }));

  const exportCommissionsColumns = [
    { header: 'Date', dataKey: 'date' },
    { header: 'Tracking ID', dataKey: 'trackingId' },
    { header: 'Referrer', dataKey: 'referrer' },
    { header: 'Payout Amount (INR)', dataKey: 'amount' },
    { header: 'Status', dataKey: 'status' }
  ];

  const formattedCommissions = commissions.map(c => ({
    ...c,
    date: new Date(c.createdAt || Date.now()).toLocaleDateString(),
    referrer: usersMap[c.referrerId] || c.referrerId
  }));

  return (
    <div className="admin-affiliate-network animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="admin-page-header">
        <div className="admin-page-title">
          <h2>Affiliate Network & API Gateway</h2>
          <p>Manage Cuelinks Universal Aggregator, Amazon PA-API, and future AWIN API deep-linking pipelines</p>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div style={{ display: 'flex', gap: '10px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
        <button
          className={`admin-btn ${activeSubTab === 'overview' ? 'admin-btn-primary' : 'admin-btn-secondary'}`}
          onClick={() => setActiveSubTab('overview')}
        >
          <Layers size={16} />
          Networks & Routing Matrix
        </button>
        <button
          className={`admin-btn ${activeSubTab === 'credentials' ? 'admin-btn-primary' : 'admin-btn-secondary'}`}
          onClick={() => setActiveSubTab('credentials')}
        >
          <Key size={16} />
          API Credentials & Keys
        </button>
        <button
          className={`admin-btn ${activeSubTab === 'tester' ? 'admin-btn-primary' : 'admin-btn-secondary'}`}
          onClick={() => setActiveSubTab('tester')}
        >
          <Link2 size={16} />
          Live Deep Link Tester
        </button>
        <button
          className={`admin-btn ${activeSubTab === 'logs' ? 'admin-btn-primary' : 'admin-btn-secondary'}`}
          onClick={() => setActiveSubTab('logs')}
        >
          <Radio size={16} />
          Click Logs & Approvals ({clicks.length})
        </button>
      </div>

      {/* 1. OVERVIEW & STORE ROUTING MATRIX */}
      {activeSubTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Active Network Cards Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            {/* Amazon Direct */}
            <div style={{ padding: '20px', borderRadius: '12px', border: '1px solid rgba(245, 158, 11, 0.3)', backgroundColor: 'rgba(245, 158, 11, 0.05)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#d97706' }}>Direct Retail Partner</span>
                <span style={{ fontSize: '11px', fontWeight: '600', padding: '2px 8px', borderRadius: '10px', backgroundColor: '#10b981', color: '#fff' }}>Active</span>
              </div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: 'var(--text-bold)' }}>Amazon PA-API & Associates</h3>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--text)' }}>
                Powers direct product imports, price updates, and tag-based cashback tracking for <strong>Amazon.in</strong>.
              </p>
              <div style={{ fontSize: '12px', fontFamily: 'monospace', backgroundColor: 'var(--card-bg)', padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border)' }}>
                Tag: <strong>{configs.amazon?.associateTag || 'liomart-21'}</strong>
              </div>
            </div>

            {/* Cuelinks Aggregator */}
            <div style={{ padding: '20px', borderRadius: '12px', border: '1px solid rgba(59, 130, 246, 0.3)', backgroundColor: 'rgba(59, 130, 246, 0.05)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#2563eb' }}>Universal Indian Gateway</span>
                <span style={{ fontSize: '11px', fontWeight: '600', padding: '2px 8px', borderRadius: '10px', backgroundColor: '#10b981', color: '#fff' }}>Active</span>
              </div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: 'var(--text-bold)' }}>Cuelinks Multi-Store API</h3>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--text)' }}>
                Master aggregator powering <strong>Flipkart, Meesho, Myntra, Ajio, Nykaa, boAt, MakeMyTrip</strong> via sub-ID tracking.
              </p>
              <div style={{ fontSize: '12px', fontFamily: 'monospace', backgroundColor: 'var(--card-bg)', padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border)' }}>
                Publisher ID: <strong>{configs.cuelinks?.publisherId || '189241'}</strong>
              </div>
            </div>

            {/* AWIN Future Ready */}
            <div style={{ padding: '20px', borderRadius: '12px', border: '1px solid rgba(139, 92, 246, 0.3)', backgroundColor: 'rgba(139, 92, 246, 0.05)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#7c3aed' }}>Global Network (Phase 2)</span>
                <span style={{ fontSize: '11px', fontWeight: '600', padding: '2px 8px', borderRadius: '10px', backgroundColor: '#6b7280', color: '#fff' }}>Planned</span>
              </div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: 'var(--text-bold)' }}>AWIN Global Affiliate API</h3>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--text)' }}>
                Integrated architecture ready for upcoming international merchants and global fashion retailers (ASOS, AliExpress, etc.).
              </p>
              <div style={{ fontSize: '12px', fontFamily: 'monospace', backgroundColor: 'var(--card-bg)', padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border)' }}>
                Status: <strong>Ready for Phase 2 deployment</strong>
              </div>
            </div>
          </div>

          {/* Store Routing Matrix */}
          <div className="admin-table-card animate-fade">
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: 'var(--text-bold)' }}>
                Store-to-Network Affiliate Routing Matrix
              </h3>
              <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text)' }}>
                Every Indian merchant without a direct public API is automatically routed through Cuelinks Sub-ID Engine.
              </p>
            </div>
            <div className="table-responsive">
              <table className="history-table">
                <thead>
                  <tr>
                    <th>Store / Platform</th>
                    <th>Routed Affiliate Network</th>
                    <th>Network Status</th>
                    <th>Commission Rate</th>
                    <th>Tracking Identifier</th>
                    <th>Routing Mechanism</th>
                  </tr>
                </thead>
                <tbody>
                  {STORE_ROUTING.map((row, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: '600', color: 'var(--text-bold)' }}>{row.store}</td>
                      <td>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: '600',
                          backgroundColor: row.network.includes('Amazon') ? 'rgba(245, 158, 11, 0.1)' : row.network.includes('Cuelinks') ? 'rgba(59, 130, 246, 0.1)' : 'rgba(139, 92, 246, 0.1)',
                          color: row.network.includes('Amazon') ? '#d97706' : row.network.includes('Cuelinks') ? '#2563eb' : '#7c3aed'
                        }}>
                          {row.network}
                        </span>
                      </td>
                      <td>
                        <span className={`history-status ${row.status === 'Active' ? 'approved' : 'pending'}`}>
                          {row.status}
                        </span>
                      </td>
                      <td style={{ fontWeight: '700', color: 'var(--primary)' }}>{row.commission}</td>
                      <td style={{ fontFamily: 'monospace', fontSize: '11px' }}>{row.tag}</td>
                      <td style={{ fontSize: '12px', color: 'var(--text)' }}>{row.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 2. CREDENTIALS & API KEYS TAB */}
      {activeSubTab === 'credentials' && (
        <form onSubmit={handleSaveConfigs} style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '800px' }}>
          {/* Cuelinks API Settings */}
          <div className="admin-table-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Network size={18} color="#2563eb" />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: 'var(--text-bold)' }}>Cuelinks API Configuration</h3>
                <p style={{ margin: 0, fontSize: '12px', color: 'var(--text)' }}>Handles Flipkart, Meesho, Myntra, Ajio, Nykaa, MakeMyTrip, boAt, Croma catalog & links</p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-bold)', display: 'block', marginBottom: '6px' }}>
                  Cuelinks Publisher ID (pub_id) *
                </label>
                <input
                  type="text"
                  className="admin-search-input"
                  value={configs.cuelinks?.publisherId || ''}
                  onChange={(e) => setConfigs({ ...configs, cuelinks: { ...configs.cuelinks, publisherId: e.target.value } })}
                  placeholder="189241"
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-bold)', display: 'block', marginBottom: '6px' }}>
                  Cuelinks Channel ID (Optional Sub-Channel)
                </label>
                <input
                  type="text"
                  className="admin-search-input"
                  value={configs.cuelinks?.channelId || ''}
                  onChange={(e) => setConfigs({ ...configs, cuelinks: { ...configs.cuelinks, channelId: e.target.value } })}
                  placeholder="liomart_app"
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-bold)', display: 'block', marginBottom: '6px' }}>
                Cuelinks Secret API Token *
              </label>
              <input
                type="password"
                className="admin-search-input"
                value={configs.cuelinks?.apiToken || ''}
                onChange={(e) => setConfigs({ ...configs, cuelinks: { ...configs.cuelinks, apiToken: e.target.value } })}
                placeholder="cue_live_sec_token_..."
                required
              />
            </div>

            <div>
              <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-bold)', display: 'block', marginBottom: '6px' }}>
                Redirect Domain
              </label>
              <input
                type="text"
                className="admin-search-input"
                value={configs.cuelinks?.redirectDomain || 'https://linksredirect.com/'}
                onChange={(e) => setConfigs({ ...configs, cuelinks: { ...configs.cuelinks, redirectDomain: e.target.value } })}
                placeholder="https://linksredirect.com/"
              />
            </div>
          </div>

          {/* Amazon PA-API Settings */}
          <div className="admin-table-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: 'rgba(245, 158, 11, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShoppingCart size={18} color="#d97706" />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: 'var(--text-bold)' }}>Amazon Associates & PA-API</h3>
                <p style={{ margin: 0, fontSize: '12px', color: 'var(--text)' }}>Direct Amazon India product feeds and Associate Tag tracking</p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-bold)', display: 'block', marginBottom: '6px' }}>
                  Amazon Associate Tag *
                </label>
                <input
                  type="text"
                  className="admin-search-input"
                  value={configs.amazon?.associateTag || ''}
                  onChange={(e) => setConfigs({ ...configs, amazon: { ...configs.amazon, associateTag: e.target.value } })}
                  placeholder="liomart-21"
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-bold)', display: 'block', marginBottom: '6px' }}>
                  Amazon PA-API Access Key
                </label>
                <input
                  type="text"
                  className="admin-search-input"
                  value={configs.amazon?.accessKey || ''}
                  onChange={(e) => setConfigs({ ...configs, amazon: { ...configs.amazon, accessKey: e.target.value } })}
                  placeholder="AKIAIOSFODNN7EXAMPLE"
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-bold)', display: 'block', marginBottom: '6px' }}>
                Amazon PA-API Secret Access Key
              </label>
              <input
                type="password"
                className="admin-search-input"
                value={configs.amazon?.secretKey || ''}
                onChange={(e) => setConfigs({ ...configs, amazon: { ...configs.amazon, secretKey: e.target.value } })}
                placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
              />
            </div>
          </div>

          {/* AWIN Settings */}
          <div className="admin-table-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: 'rgba(139, 92, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Zap size={18} color="#7c3aed" />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: 'var(--text-bold)' }}>AWIN Global Network (Upcoming)</h3>
                <p style={{ margin: 0, fontSize: '12px', color: 'var(--text)' }}>Configuration saved for Phase 2 global expansion</p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-bold)', display: 'block', marginBottom: '6px' }}>
                  AWIN Publisher ID (affid)
                </label>
                <input
                  type="text"
                  className="admin-search-input"
                  value={configs.awin?.publisherId || ''}
                  onChange={(e) => setConfigs({ ...configs, awin: { ...configs.awin, publisherId: e.target.value } })}
                  placeholder="AWIN-PUB-99410"
                />
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-bold)', display: 'block', marginBottom: '6px' }}>
                  AWIN API Key Token
                </label>
                <input
                  type="password"
                  className="admin-search-input"
                  value={configs.awin?.apiToken || ''}
                  onChange={(e) => setConfigs({ ...configs, awin: { ...configs.awin, apiToken: e.target.value } })}
                  placeholder="awin_api_token_..."
                />
              </div>
            </div>
          </div>

          <button type="submit" className="admin-btn admin-btn-primary" style={{ padding: '12px 24px', fontSize: '14px', alignSelf: 'flex-start' }}>
            <ShieldCheck size={18} />
            Save Network API Credentials
          </button>
        </form>
      )}

      {/* 3. LIVE DEEP LINK TESTER TAB */}
      {activeSubTab === 'tester' && (
        <div className="admin-table-card animate-fade" style={{ padding: '28px', maxWidth: '750px' }}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '700', color: 'var(--text-bold)' }}>
            Live Affiliate Deep Link & Sub-ID Generator
          </h3>
          <p style={{ margin: '0 0 20px 0', fontSize: '13px', color: 'var(--text)' }}>
            Test how product links from Flipkart, Meesho, Myntra, and Amazon are transformed into trackable affiliate URLs.
          </p>

          <form onSubmit={handleGenerateTestLink} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-bold)', display: 'block', marginBottom: '6px' }}>
                  Target Store
                </label>
                <select
                  className="admin-filter-select"
                  value={testStore}
                  onChange={(e) => setTestStore(e.target.value)}
                  style={{ width: '100%' }}
                >
                  <option value="Flipkart">Flipkart (via Cuelinks)</option>
                  <option value="Meesho">Meesho (via Cuelinks)</option>
                  <option value="Myntra">Myntra (via Cuelinks)</option>
                  <option value="Amazon">Amazon (via Amazon PA-API)</option>
                  <option value="Ajio">Ajio (via Cuelinks)</option>
                  <option value="Nykaa Beauty">Nykaa Beauty (via Cuelinks)</option>
                  <option value="MakeMyTrip">MakeMyTrip (via Cuelinks)</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-bold)', display: 'block', marginBottom: '6px' }}>
                  User ID / Sub-ID Tracking Key
                </label>
                <input
                  type="text"
                  className="admin-search-input"
                  value={testUserId}
                  onChange={(e) => setTestUserId(e.target.value)}
                  placeholder="user_9921"
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-bold)', display: 'block', marginBottom: '6px' }}>
                Raw Product / Store URL *
              </label>
              <input
                type="url"
                className="admin-search-input"
                value={testProductUrl}
                onChange={(e) => setTestProductUrl(e.target.value)}
                placeholder="https://www.flipkart.com/..."
                required
              />
            </div>

            <button type="submit" className="admin-btn admin-btn-primary" style={{ padding: '10px 20px', alignSelf: 'flex-start' }}>
              <Link2 size={16} />
              Generate Trackable Link
            </button>
          </form>

          {generatedTestUrl && (
            <div style={{ marginTop: '24px', padding: '16px', borderRadius: '8px', backgroundColor: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
              <div style={{ fontSize: '12px', fontWeight: '700', color: '#2563eb', marginBottom: '6px', textTransform: 'uppercase' }}>
                Generated Output Link ({testStore.toLowerCase() === 'amazon' ? 'Amazon Direct Tag' : 'Cuelinks Universal Redirect'}):
              </div>
              <div style={{ fontSize: '12px', fontFamily: 'monospace', wordBreak: 'break-all', backgroundColor: 'var(--card-bg)', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', marginBottom: '12px' }}>
                {generatedTestUrl}
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  className="admin-btn admin-btn-secondary"
                  onClick={() => {
                    navigator.clipboard.writeText(generatedTestUrl);
                    setCopiedLink(true);
                    setTimeout(() => setCopiedLink(false), 2000);
                  }}
                  style={{ fontSize: '12px' }}
                >
                  {copiedLink ? <Check size={14} /> : <Link2 size={14} />}
                  {copiedLink ? 'Copied!' : 'Copy Link'}
                </button>
                <a
                  href={generatedTestUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="admin-btn admin-btn-primary"
                  style={{ fontSize: '12px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <ExternalLink size={14} />
                  Test Open in Browser
                </a>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. CLICK LOGS & COMMISSIONS TAB */}
      {activeSubTab === 'logs' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="history-card" style={{ padding: '24px', borderRadius: '12px', border: '1px solid var(--border)', backgroundColor: 'var(--card-bg)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Network Click Tracking Logs</h3>
              <ExportDataButton data={formattedClicks} columns={exportClicksColumns} filename="Affiliate_Clicks" />
            </div>
            <div className="table-responsive">
              <table className="history-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Buyer</th>
                    <th>Referrer ShareID</th>
                    <th>Product</th>
                    <th>Tracking ID</th>
                    <th>Order ID</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {clicks.map(c => (
                    <tr key={c.id}>
                      <td>{new Date(c.createdAt || Date.now()).toLocaleDateString()}</td>
                      <td>{c.buyerId ? usersMap[c.buyerId] || c.buyerId : 'Guest'}</td>
                      <td>{c.shareId || 'Direct'}</td>
                      <td>{c.productId ? productsMap[c.productId] || c.productId : 'N/A'}</td>
                      <td style={{ fontSize: '11px', fontFamily: 'monospace' }}>{c.trackingId}</td>
                      <td style={{ fontSize: '11px', fontFamily: 'monospace' }}>{c.orderId || '-'}</td>
                      <td>
                        <span className={`history-status ${c.status.toLowerCase()}`}>
                          {c.status}
                        </span>
                      </td>
                      <td>
                        {c.status === 'PURCHASED' && (
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button className="btn-primary" onClick={() => handleApprove(c.trackingId)} style={{ padding: '4px 8px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <CheckCircle size={12}/> Approve
                            </button>
                            <button className="btn-withdraw" onClick={() => handleReject(c.trackingId)} style={{ padding: '4px 8px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <XCircle size={12}/> Reject
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                  {clicks.length === 0 && (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', padding: '24px' }}>No tracking data found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="history-card" style={{ padding: '24px', borderRadius: '12px', border: '1px solid var(--border)', backgroundColor: 'var(--card-bg)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Commission Payout History</h3>
              <ExportDataButton data={formattedCommissions} columns={exportCommissionsColumns} filename="Affiliate_Commissions" />
            </div>
            <div className="table-responsive">
              <table className="history-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Tracking ID</th>
                    <th>Referrer</th>
                    <th>Payout Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {commissions.map(c => (
                    <tr key={c.id}>
                      <td>{new Date(c.createdAt || Date.now()).toLocaleDateString()}</td>
                      <td style={{ fontSize: '11px', fontFamily: 'monospace' }}>{c.trackingId}</td>
                      <td>{usersMap[c.referrerId] || c.referrerId}</td>
                      <td style={{ fontWeight: 700, color: 'var(--primary)' }}>₹{c.amount.toFixed(2)}</td>
                      <td>
                        <span className={`history-status ${c.status.toLowerCase()}`}>
                          {c.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {commissions.length === 0 && (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', padding: '24px' }}>No payouts generated yet</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
