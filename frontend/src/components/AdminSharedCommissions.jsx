import React, { useState } from 'react';
import { Search, Filter, CheckCircle, XCircle, Edit2, Share2, Wallet, MousePointer, Gift } from 'lucide-react';
import { AdminTable, AdminModal, AdminFormInput, ExportDataButton } from './AdminComponents';

export default function AdminSharedCommissions({
  sharedLinks = [],
  sharedCommissions = [],
  onApproveCommission,
  onRejectCommission,
  onAdjustCommission,
  onAddNotification
}) {
  const [activeSubTab, setActiveSubTab] = useState('commissions');
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Adjust Modal States
  const [selectedComm, setSelectedComm] = useState(null);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [adjustTotalAmount, setAdjustTotalAmount] = useState('');
  const [adjustUserAmount, setAdjustUserAmount] = useState('');

  // Calculate statistics
  const totalClicks = sharedLinks.reduce((sum, l) => sum + (l.clicksCount || 0), 0);
  const totalConversions = sharedLinks.reduce((sum, l) => sum + (l.conversionsCount || 0), 0);
  const approvedEarnings = sharedCommissions
    .filter(c => (c.status || '').toLowerCase() === 'approved')
    .reduce((sum, c) => sum + parseFloat(c.userCommissionAmount != null ? c.userCommissionAmount : (c.commissionAmount || 0)), 0);
  const pendingEarnings = sharedCommissions
    .filter(c => (c.status || '').toLowerCase() === 'pending')
    .reduce((sum, c) => sum + parseFloat(c.userCommissionAmount != null ? c.userCommissionAmount : (c.commissionAmount || 0)), 0);

  const handleOpenAdjustModal = (comm) => {
    setSelectedComm(comm);
    setAdjustTotalAmount((comm.commissionAmount || 0).toString());
    setAdjustUserAmount((comm.userCommissionAmount || 0).toString());
    setIsAdjustModalOpen(true);
  };

  const handleSaveAdjustment = (e) => {
    e.preventDefault();
    const totalVal = parseFloat(adjustTotalAmount);
    const userVal = parseFloat(adjustUserAmount);
    if (isNaN(totalVal) || isNaN(userVal) || totalVal < 0 || userVal < 0) {
      onAddNotification('Please enter valid positive commission amounts.', 'error');
      return;
    }

    if (!window.confirm("Are you sure you want to adjust this commission payout split?")) {
      return;
    }

    onAdjustCommission(selectedComm.id, userVal, totalVal, selectedComm.status);
    setIsAdjustModalOpen(false);
  };

  const filteredLinks = sharedLinks.filter(l => {
    const query = searchQuery.toLowerCase();
    return (
      (l.userName || '').toLowerCase().includes(query) ||
      (l.productName || '').toLowerCase().includes(query) ||
      (l.store || '').toLowerCase().includes(query) ||
      (l.id || '').toLowerCase().includes(query)
    );
  });

  const filteredCommissions = sharedCommissions.filter(c => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = (
      (c.userName || '').toLowerCase().includes(query) ||
      (c.productName || '').toLowerCase().includes(query) ||
      (c.store || '').toLowerCase().includes(query) ||
      (c.id || '').toLowerCase().includes(query)
    );
    const matchesStatus = statusFilter === 'all' || (c.status || '').toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  const commHeaders = ['Share ID', 'Shared By', 'Product', 'Platform', 'Click ID', 'Order ID', 'Order Amt', 'Total Comm', 'Shared Comm', 'Admin Profit', 'Status', 'Actions'];
  const linkHeaders = ['Date Created', 'Creator Name', 'Product Name', 'Store', 'Creator Share', 'Destination Link', 'Clicks', 'Conversions', 'Total Creator Paid'];

  const renderCommRow = (item, idx) => (
    <tr key={item.id} className="animate-fade">
      <td style={{ fontSize: '10px', fontWeight: 'bold' }}>{item.shareId || item.linkId || 'N/A'}</td>
      <td style={{ fontWeight: '600', color: 'var(--text-bold)', fontSize: '11px' }}>{item.userName}</td>
      <td style={{ fontWeight: '500', fontSize: '11px' }} title={item.productName}>{item.productName}</td>
      <td style={{ fontSize: '10px' }}>{item.store}</td>
      <td style={{ fontSize: '10px', color: 'var(--text)' }}>{item.clickId || '-'}</td>
      <td style={{ fontSize: '10px', color: 'var(--text)' }}>{item.orderId || '-'}</td>
      <td style={{ fontWeight: 'bold', fontSize: '11px' }}>₹{(item.purchaseAmount || 0).toFixed(2)}</td>
      <td style={{ fontWeight: 'bold', color: 'var(--text-bold)', fontSize: '11px' }}>₹{(item.commissionAmount || 0).toFixed(2)}</td>
      <td style={{ fontWeight: '600', color: 'var(--primary)', fontSize: '11px' }}>₹{item.userCommissionAmount !== undefined ? (item.userCommissionAmount || 0).toFixed(2) : (item.commissionAmount || 0).toFixed(2)}</td>
      <td style={{ fontWeight: '600', color: '#10b981', fontSize: '11px' }}>₹{item.adminCommissionAmount !== undefined ? (item.adminCommissionAmount || 0).toFixed(2) : '0.00'}</td>
      <td>
        <span className={`status-badge ${(item.status || '').toLowerCase() === 'approved' ? 'active' : (item.status || '').toLowerCase() === 'pending' ? 'pending' : 'inactive'}`}>
          {(item.status || 'pending').toUpperCase()}
        </span>
      </td>
      <td>
        <div style={{ display: 'flex', gap: '8px' }}>
          {(item.status || '').toLowerCase() === 'pending' && (
            <>
              <button
                className="admin-btn-icon edit"
                onClick={() => {
                  const amt = item.userCommissionAmount !== undefined && item.userCommissionAmount !== null ? item.userCommissionAmount : (item.commissionAmount || 0);
                  if (window.confirm(`Are you sure you want to approve this payout of ₹${amt.toFixed(2)} for ${item.userName}?`)) {
                    onApproveCommission(item.id, amt);
                  }
                }}
                title="Approve Payout"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <CheckCircle size={14} />
              </button>
              <button
                className="admin-btn-icon delete"
                onClick={() => {
                  const amt = item.userCommissionAmount !== undefined && item.userCommissionAmount !== null ? item.userCommissionAmount : (item.commissionAmount || 0);
                  if (window.confirm(`Are you sure you want to reject this payout of ₹${amt.toFixed(2)} for ${item.userName}?`)) {
                    onRejectCommission(item.id);
                  }
                }}
                title="Reject Payout"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <XCircle size={14} />
              </button>
            </>
          )}
          <button
            className="admin-btn-icon"
            onClick={() => handleOpenAdjustModal(item)}
            title="Fix / Adjust Commission Amount"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}
          >
            <Edit2 size={14} />
          </button>
        </div>
      </td>
    </tr>
  );

  const renderLinkRow = (item, idx) => (
    <tr key={item.id} className="animate-fade">
      <td style={{ fontSize: '11px' }}>{item.date}</td>
      <td style={{ fontWeight: '600', color: 'var(--text-bold)', fontSize: '11px' }}>{item.userName}</td>
      <td style={{ fontWeight: '500', fontSize: '11px' }}>{item.productName}</td>
      <td>
        <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '10px', backgroundColor: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-bold)', fontWeight: 600 }}>
          {item.store}
        </span>
      </td>
      <td style={{ fontWeight: 500, fontSize: '11px' }}>
        {item.userSharePercent !== undefined ? `${item.userSharePercent}%` : '100%'}
      </td>
      <td style={{ fontSize: '10px' }}>
        <a href={item.productUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', textDecoration: 'none' }} title={item.productUrl}>
          {item.productUrl}
        </a>
      </td>
      <td style={{ fontWeight: '600', fontSize: '11px' }}>{item.clicksCount || 0}</td>
      <td style={{ fontWeight: '600', fontSize: '11px' }}>{item.conversionsCount || 0}</td>
      <td style={{ fontWeight: '700', color: '#10b981' }}>₹{(item.totalEarnings || 0).toFixed(2)}</td>
    </tr>
  );

  const exportCommColumns = [
    { header: 'Share ID', dataKey: 'shareId' },
    { header: 'Shared By', dataKey: 'userName' },
    { header: 'Product', dataKey: 'productName' },
    { header: 'Platform', dataKey: 'store' },
    { header: 'Click ID', dataKey: 'clickId' },
    { header: 'Order ID', dataKey: 'orderId' },
    { header: 'Order Amt', dataKey: 'purchaseAmount' },
    { header: 'Total Comm', dataKey: 'commissionAmount' },
    { header: 'Shared Comm', dataKey: 'userCommissionAmount' },
    { header: 'Status', dataKey: 'status' }
  ];

  const exportLinkColumns = [
    { header: 'Date Created', dataKey: 'date' },
    { header: 'Creator Name', dataKey: 'userName' },
    { header: 'Product Name', dataKey: 'productName' },
    { header: 'Store', dataKey: 'store' },
    { header: 'Creator Share', dataKey: 'userSharePercent' },
    { header: 'Destination Link', dataKey: 'productUrl' },
    { header: 'Clicks', dataKey: 'clicksCount' },
    { header: 'Conversions', dataKey: 'conversionsCount' },
    { header: 'Total Creator Paid', dataKey: 'totalEarnings' }
  ];

  return (
    <div className="admin-shared-tab animate-fade">
      <div className="admin-page-header">
        <div className="admin-page-title">
          <h2>Shared Commissions (Share & Earn)</h2>
          <p>Review shared links clicks and adjust/fix/approve commission payouts generated by users</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <ExportDataButton 
              data={activeSubTab === 'commissions' ? sharedCommissions : sharedLinks} 
              columns={activeSubTab === 'commissions' ? exportCommColumns : exportLinkColumns} 
              filename={activeSubTab === 'commissions' ? 'Shared_Commissions' : 'Shared_Links'} 
          />
        </div>
      </div>

      {/* Stats cards overview */}
      <div className="admin-kpi-grid">
        <div className="admin-kpi-card">
          <div className="admin-kpi-info">
            <h3>Total Shared Clicks</h3>
            <div className="admin-kpi-value">{totalClicks}</div>
          </div>
          <div className="admin-kpi-icon">
            <MousePointer size={20} />
          </div>
        </div>
        <div className="admin-kpi-card">
          <div className="admin-kpi-info">
            <h3>Total Link Sales</h3>
            <div className="admin-kpi-value">{totalConversions}</div>
          </div>
          <div className="admin-kpi-icon">
            <Share2 size={20} />
          </div>
        </div>
        <div className="admin-kpi-card">
          <div className="admin-kpi-info">
            <h3>Pending Payouts</h3>
            <div className="admin-kpi-value" style={{ color: '#f59e0b' }}>₹{pendingEarnings.toFixed(2)}</div>
          </div>
          <div className="admin-kpi-icon" style={{ color: '#f59e0b' }}>
            <Wallet size={20} />
          </div>
        </div>
        <div className="admin-kpi-card">
          <div className="admin-kpi-info">
            <h3>Approved Payouts</h3>
            <div className="admin-kpi-value" style={{ color: '#10b981' }}>₹{approvedEarnings.toFixed(2)}</div>
          </div>
          <div className="admin-kpi-icon" style={{ color: '#10b981' }}>
            <Gift size={20} />
          </div>
        </div>
      </div>

      {/* Sub-tabs selector */}
      <div className="admin-tabs" style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: '20px', gap: '20px' }}>
        <button
          onClick={() => { setActiveSubTab('commissions'); setCurrentPage(1); }}
          style={{
            padding: '12px 8px',
            border: 'none',
            background: 'none',
            fontSize: '14px',
            fontWeight: 600,
            color: activeSubTab === 'commissions' ? 'var(--primary)' : 'var(--text)',
            borderBottom: activeSubTab === 'commissions' ? '2px solid var(--primary)' : '2px solid transparent',
            cursor: 'pointer'
          }}
        >
          Shared Commissions Log ({filteredCommissions.length})
        </button>
        <button
          onClick={() => { setActiveSubTab('links'); setCurrentPage(1); }}
          style={{
            padding: '12px 8px',
            border: 'none',
            background: 'none',
            fontSize: '14px',
            fontWeight: 600,
            color: activeSubTab === 'links' ? 'var(--primary)' : 'var(--text)',
            borderBottom: activeSubTab === 'links' ? '2px solid var(--primary)' : '2px solid transparent',
            cursor: 'pointer'
          }}
        >
          Generated Share Links ({filteredLinks.length})
        </button>
      </div>

      {/* Filter and Search controls */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '16px',
          flexWrap: 'wrap',
          marginBottom: '20px',
        }}
      >
        <div className="admin-search-input-wrapper">
          <Search size={16} className="admin-search-icon" />
          <input
            type="text"
            placeholder={activeSubTab === 'commissions' ? "Search log by user, product, or store..." : "Search links..."}
            className="admin-search-input"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>

        {activeSubTab === 'commissions' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text)' }}>Filter Status:</span>
            <select
              className="admin-filter-select"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="all">All Logs</option>
              <option value="pending">Pending Only</option>
              <option value="approved">Approved Only</option>
              <option value="rejected">Rejected Only</option>
            </select>
          </div>
        )}
      </div>

      {/* Tables rendering */}
      {activeSubTab === 'commissions' ? (
        <AdminTable
          headers={commHeaders}
          items={filteredCommissions}
          currentPage={currentPage}
          itemsPerPage={5}
          onPageChange={setCurrentPage}
          renderRow={renderCommRow}
          emptyMessage="No shared commission logs found matching query."
        />
      ) : (
        <AdminTable
          headers={linkHeaders}
          items={filteredLinks}
          currentPage={currentPage}
          itemsPerPage={5}
          onPageChange={setCurrentPage}
          renderRow={renderLinkRow}
          emptyMessage="No active user shared links found."
        />
      )}

      {/* Fix / Adjust Modal */}
      {selectedComm && (
        <AdminModal
          isOpen={isAdjustModalOpen}
          onClose={() => setIsAdjustModalOpen(false)}
          title="Fix / Adjust Shared Commission Payout"
          footer={
            <>
              <button className="admin-btn admin-btn-secondary" onClick={() => setIsAdjustModalOpen(false)}>
                Cancel
              </button>
              <button className="admin-btn admin-btn-primary" onClick={handleSaveAdjustment}>
                Save Fixed Payout
              </button>
            </>
          }
        >
          <form onSubmit={handleSaveAdjustment}>
            <div style={{ padding: '8px 12px', backgroundColor: 'var(--bg)', borderRadius: '6px', border: '1px solid var(--border)', marginBottom: '16px' }}>
              <span style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 600, color: 'var(--text)' }}>Original Transaction details</span>
              <div style={{ marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '13px', color: 'var(--text-bold)' }}>
                <span>User: <strong>{selectedComm.userName}</strong></span>
                <span>Product Name: <strong>{selectedComm.productName}</strong></span>
                <span>Partner store: <strong>{selectedComm.store}</strong></span>
                <span>Total Order price: <strong>₹{(selectedComm.purchaseAmount || 0).toFixed(2)}</strong></span>
                <span>Commission Rate applied: <strong>{selectedComm.commissionRate || 0}%</strong></span>
                <span>Creator Share: <strong>{selectedComm.userSharePercent}%</strong></span>
              </div>
            </div>

            <AdminFormInput
              label="Total Commission Received from Network (₹)"
              id="adjust-total-amount"
              type="number"
              step="0.01"
              value={adjustTotalAmount}
              onChange={(e) => setAdjustTotalAmount(e.target.value)}
              placeholder="e.g. 100.00"
              required
            />

            <AdminFormInput
              label="Affiliate Payout Amount (User A's cut) (₹)"
              id="adjust-user-amount"
              type="number"
              step="0.01"
              value={adjustUserAmount}
              onChange={(e) => setAdjustUserAmount(e.target.value)}
              placeholder="e.g. 60.00"
              required
            />

            <div style={{ margin: '12px 0', padding: '10px 12px', backgroundColor: 'rgba(var(--primary-rgb), 0.04)', border: '1px solid var(--border)', borderRadius: '6px' }}>
              <span style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 700, color: 'var(--primary)', display: 'block', marginBottom: '6px' }}>Payout Split Preview</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '13px', color: 'var(--text-bold)' }}>
                <span>Total Commission: <strong>₹{(parseFloat(adjustTotalAmount) || 0).toFixed(2)}</strong></span>
                <span>Sharer gets: <strong style={{ color: 'var(--primary)' }}>₹{(parseFloat(adjustUserAmount) || 0).toFixed(2)}</strong></span>
                <span>Admin Profit: <strong style={{ color: '#10b981' }}>₹{Math.max(0, (parseFloat(adjustTotalAmount) || 0) - (parseFloat(adjustUserAmount) || 0)).toFixed(2)}</strong></span>
              </div>
            </div>
            
            <p style={{ fontSize: '11px', color: 'var(--text)', marginTop: '8px' }}>
              * Adjusting the payout changes the commission credited to this user's wallet. If the payout is already approved, the difference will be retroactively synced.
            </p>
          </form>
        </AdminModal>
      )}
    </div>
  );
}
