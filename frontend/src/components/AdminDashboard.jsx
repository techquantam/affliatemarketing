import React, { useState } from 'react';
import { Users, MousePointer, CheckSquare, Gift, Wallet, TrendingUp, ShoppingBag } from 'lucide-react';

export default function AdminDashboard({ users = [], products = [], orders = [], withdrawRequests = [], finance = {}, cashbackList = [], clickLogsCount = 1245, conversionsCount = 340, setTab }) {
  const [activeReport, setActiveReport] = useState('clicks'); // 'clicks', 'cashback', 'revenue'

  // Calculations
  const totalUsers = users ? users.length : 0;
  const totalProducts = products ? products.length : 0;
  const activeProductsCount = products ? products.filter(p => p && (p.status === 'active' || p.isActive === true || p.status === undefined)).length : 0;
  const totalClicks = clickLogsCount || 0;
  const totalConversions = conversionsCount || 0;
  const totalCashbackVal = (finance && finance.totalCashbackPaid) || 0;
  const totalWithdrawalsVal = (finance && finance.totalWithdrawPaid) || 0;

  // Filter pending/recent lists
  const recentWithdrawals = withdrawRequests ? withdrawRequests.slice(-3).reverse() : [];
  const recentCashbacks = cashbackList ? cashbackList.slice(-3).reverse() : [];

  // SVG Chart points definitions for the reports
  const clicksPointsLine = "M 20 160 L 100 110 L 180 130 L 260 70 L 340 100 L 420 50 L 480 20";
  const clicksPointsArea = "20,180 20,160 100,110 180,130 260,70 340,100 420,50 480,20 480,180";
  const clicksDots = [
    { cx: 20, cy: 160, label: 'Mon' },
    { cx: 100, cy: 110, label: 'Tue' },
    { cx: 180, cy: 130, label: 'Wed' },
    { cx: 260, cy: 70, label: 'Thu' },
    { cx: 340, cy: 100, label: 'Fri' },
    { cx: 420, cy: 50, label: 'Sat' },
    { cx: 480, cy: 20, label: 'Sun' },
  ];

  const cashbackPointsLine = "M 20 170 L 100 140 L 180 120 L 260 110 L 340 80 L 420 60 L 480 50";
  const cashbackPointsArea = "20,180 20,170 100,140 180,120 260,110 340,80 420,60 480,50 480,180";
  const cashbackDots = [
    { cx: 20, cy: 170, label: 'Jan' },
    { cx: 100, cy: 140, label: 'Feb' },
    { cx: 180, cy: 120, label: 'Mar' },
    { cx: 260, cy: 110, label: 'Apr' },
    { cx: 340, cy: 80, label: 'May' },
    { cx: 420, cy: 60, label: 'Jun' },
    { cx: 480, cy: 50, label: 'Jul' },
  ];

  const revenuePointsLine = "M 20 150 L 100 130 L 180 90 L 260 80 L 340 50 L 420 40 L 480 30";
  const revenuePointsArea = "20,180 20,150 100,130 180,90 260,80 340,50 420,40 480,30 480,180";
  const revenueDots = [
    { cx: 20, cy: 150, label: 'Jan' },
    { cx: 100, cy: 130, label: 'Feb' },
    { cx: 180, cy: 90, label: 'Mar' },
    { cx: 260, cy: 80, label: 'Apr' },
    { cx: 340, cy: 50, label: 'May' },
    { cx: 420, cy: 40, label: 'Jun' },
    { cx: 480, cy: 30, label: 'Jul' },
  ];

  const getActiveChartDetails = () => {
    switch (activeReport) {
      case 'clicks':
        return { line: clicksPointsLine, area: clicksPointsArea, dots: clicksDots, color: '#8b5cf6', fill: 'url(#areaGradientSecondary)' };
      case 'cashback':
        return { line: cashbackPointsLine, area: cashbackPointsArea, dots: cashbackDots, color: 'var(--secondary)', fill: 'url(#areaGradientCashback)' };
      case 'revenue':
        return { line: revenuePointsLine, area: revenuePointsArea, dots: revenueDots, color: 'var(--primary)', fill: 'url(#areaGradientPrimary)' };
      default:
        return { line: clicksPointsLine, area: clicksPointsArea, dots: clicksDots, color: '#8b5cf6', fill: 'url(#areaGradientSecondary)' };
    }
  };

  const chart = getActiveChartDetails();

  return (
    <div className="admin-dashboard-tab animate-fade">
      <div className="admin-page-header">
        <div className="admin-page-title">
          <h2>Dashboard Overview</h2>
          <p>Key analytics, visual reports, and recent verification queues</p>
        </div>
      </div>

      {/* 6 KPI Cards Grid */}
      <div className="admin-kpi-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        {/* Total Products */}
        <div 
          className="admin-kpi-card" 
          onClick={() => setTab && setTab('products')} 
          style={{ cursor: setTab ? 'pointer' : 'default' }}
          title="Click to view and manage products"
        >
          <div className="admin-kpi-info">
            <h3>Total Products</h3>
            <div className="admin-kpi-value">{totalProducts}</div>
            <span className="admin-kpi-trend positive">
              <TrendingUp size={12} style={{ marginRight: '2px' }} /> {activeProductsCount} Active
            </span>
          </div>
          <div className="admin-kpi-icon" style={{ color: '#10b981' }}>
            <ShoppingBag size={20} />
          </div>
        </div>

        {/* Total Users */}
        <div 
          className="admin-kpi-card"
          onClick={() => setTab && setTab('users')}
          style={{ cursor: setTab ? 'pointer' : 'default' }}
          title="Click to view users"
        >
          <div className="admin-kpi-info">
            <h3>Total Users</h3>
            <div className="admin-kpi-value">{totalUsers}</div>
            <span className="admin-kpi-trend positive">
              <TrendingUp size={12} style={{ marginRight: '2px' }} /> Registered
            </span>
          </div>
          <div className="admin-kpi-icon" style={{ color: '#3b82f6' }}>
            <Users size={20} />
          </div>
        </div>

        {/* Total Clicks */}
        <div 
          className="admin-kpi-card"
          onClick={() => setTab && setTab('click-logs')}
          style={{ cursor: setTab ? 'pointer' : 'default' }}
          title="Click to view click logs"
        >
          <div className="admin-kpi-info">
            <h3>Total Clicks</h3>
            <div className="admin-kpi-value">{totalClicks.toLocaleString()}</div>
            <span className="admin-kpi-trend positive">
              <TrendingUp size={12} style={{ marginRight: '2px' }} /> Tracking
            </span>
          </div>
          <div className="admin-kpi-icon" style={{ color: '#8b5cf6' }}>
            <MousePointer size={20} />
          </div>
        </div>

        {/* Total Conversions */}
        <div 
          className="admin-kpi-card"
          onClick={() => setTab && setTab('conversions')}
          style={{ cursor: setTab ? 'pointer' : 'default' }}
          title="Click to view conversions"
        >
          <div className="admin-kpi-info">
            <h3>Conversions</h3>
            <div className="admin-kpi-value">{totalConversions}</div>
            <span className="admin-kpi-trend positive">
              <TrendingUp size={12} style={{ marginRight: '2px' }} /> Verified
            </span>
          </div>
          <div className="admin-kpi-icon" style={{ color: '#ec4899' }}>
            <CheckSquare size={20} />
          </div>
        </div>

        {/* Total Cashback Paid */}
        <div 
          className="admin-kpi-card"
          onClick={() => setTab && setTab('finance')}
          style={{ cursor: setTab ? 'pointer' : 'default' }}
          title="Click to view finance"
        >
          <div className="admin-kpi-info">
            <h3>Total Cashback</h3>
            <div className="admin-kpi-value">₹{totalCashbackVal.toFixed(2)}</div>
            <span className="admin-kpi-trend positive">
              <TrendingUp size={12} style={{ marginRight: '2px' }} /> Disbursed
            </span>
          </div>
          <div className="admin-kpi-icon" style={{ color: 'var(--secondary)' }}>
            <Gift size={20} />
          </div>
        </div>

        {/* Total Withdrawals Paid */}
        <div 
          className="admin-kpi-card"
          onClick={() => setTab && setTab('withdrawals')}
          style={{ cursor: setTab ? 'pointer' : 'default' }}
          title="Click to view withdrawals"
        >
          <div className="admin-kpi-info">
            <h3>Total Withdrawals</h3>
            <div className="admin-kpi-value">₹{totalWithdrawalsVal.toFixed(2)}</div>
            <span className="admin-kpi-trend positive">
              <TrendingUp size={12} style={{ marginRight: '2px' }} /> Processed
            </span>
          </div>
          <div className="admin-kpi-icon" style={{ color: 'var(--primary)' }}>
            <Wallet size={20} />
          </div>
        </div>
      </div>

      {/* Selectable SVG Reports Section */}
      <div className="admin-chart-card">
        <div className="admin-chart-header">
          <div>
            <h3 className="admin-chart-title">System Performance & Ledger Reports</h3>
            <p style={{ fontSize: '12px', color: 'var(--text)', marginTop: '2px' }}>Interactive data visualization of platform KPIs</p>
          </div>
          <div className="admin-table-actions">
            <button
              className={`admin-btn ${activeReport === 'clicks' ? 'admin-btn-primary' : 'admin-btn-secondary'}`}
              onClick={() => setActiveReport('clicks')}
              style={{ padding: '6px 12px', fontSize: '12px' }}
            >
              Daily Clicks
            </button>
            <button
              className={`admin-btn ${activeReport === 'cashback' ? 'admin-btn-primary' : 'admin-btn-secondary'}`}
              onClick={() => setActiveReport('cashback')}
              style={{ padding: '6px 12px', fontSize: '12px' }}
            >
              Cashback Reports
            </button>
            <button
              className={`admin-btn ${activeReport === 'revenue' ? 'admin-btn-primary' : 'admin-btn-secondary'}`}
              onClick={() => setActiveReport('revenue')}
              style={{ padding: '6px 12px', fontSize: '12px' }}
            >
              Revenue Reports
            </button>
          </div>
        </div>

        <div className="admin-chart-visualization" style={{ display: 'block', height: '240px' }}>
          <svg viewBox="0 0 500 200" width="100%" height="180px">
            <defs>
              <linearGradient id="areaGradientPrimary" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.4" />
                <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="areaGradientSecondary" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="areaGradientCashback" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--secondary)" stopOpacity="0.4" />
                <stop offset="100%" stopColor="var(--secondary)" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Gridlines */}
            <line x1="20" y1="40" x2="480" y2="40" className="chart-grid-line" />
            <line x1="20" y1="90" x2="480" y2="90" className="chart-grid-line" />
            <line x1="20" y1="140" x2="480" y2="140" className="chart-grid-line" />
            <line x1="20" y1="180" x2="480" y2="180" className="chart-axis-line" />

            {/* Dynamic Rendering */}
            <polygon points={chart.area} fill={chart.fill} opacity="0.15" />
            <path d={chart.line} stroke={chart.color} strokeWidth="3" fill="none" strokeLinecap="round" />
            
            {chart.dots.map((dot, idx) => (
              <circle key={idx} cx={dot.cx} cy={dot.cy} r="4" fill={chart.color} />
            ))}
          </svg>

          <div className="chart-legend">
            {chart.dots.map((dot, idx) => (
              <div key={idx} className="chart-legend-item">
                <span style={{ color: 'var(--text-bold)', fontSize: '11px', fontWeight: '500' }}>{dot.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Two Column Grid: Withdrawals vs Cashback Requests */}
      <div className="admin-dashboard-two-col">
        {/* Withdraw Requests Activity */}
        <div className="admin-table-card">
          <div className="admin-table-header">
            <h3 className="admin-table-title">Recent Withdraw Requests</h3>
          </div>
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentWithdrawals.map((w) => (
                  <tr key={w.id}>
                    <td>{w.userName}</td>
                    <td style={{ fontWeight: '700', color: 'var(--text-bold)' }}>₹{w.amount.toFixed(2)}</td>
                    <td>
                      <span className={`status-badge ${w.status}`}>{w.status}</span>
                    </td>
                  </tr>
                ))}
                {recentWithdrawals.length === 0 && (
                  <tr>
                    <td colSpan="3" style={{ textAlign: 'center', padding: '16px', opacity: 0.6 }}>No recent withdrawal requests.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Cashback Requests Activity */}
        <div className="admin-table-card">
          <div className="admin-table-header">
            <h3 className="admin-table-title">Recent Cashback Requests</h3>
          </div>
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Cashback</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentCashbacks.map((c) => (
                  <tr key={c.id}>
                    <td>{c.userName}</td>
                    <td style={{ fontWeight: '700', color: 'var(--secondary)' }}>₹{c.amount.toFixed(2)}</td>
                    <td>
                      <span className={`status-badge ${c.status}`}>{c.status}</span>
                    </td>
                  </tr>
                ))}
                {recentCashbacks.length === 0 && (
                  <tr>
                    <td colSpan="3" style={{ textAlign: 'center', padding: '16px', opacity: 0.6 }}>No recent cashback requests.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
