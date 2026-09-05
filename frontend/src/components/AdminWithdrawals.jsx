import React, { useState } from 'react';
import { Check, X, Search, Filter, Eye, RotateCw } from 'lucide-react';
import { AdminTable, AdminModal, ExportDataButton } from './AdminComponents';

export default function AdminWithdrawals({
  withdrawRequests = [],
  onApprove,
  onReject,
  onRefresh,
  refreshing = false,
  lastUpdated = null,
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modal State
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredRequests = withdrawRequests.filter((w) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      w.userName.toLowerCase().includes(query) ||
      w.upiId.toLowerCase().includes(query);
    const matchesStatus = statusFilter === 'all' || w.status.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  const openDetailsModal = (req) => {
    setSelectedRequest(req);
    setIsModalOpen(true);
  };

  const headers = ['User Name', 'Coins Redeemed', 'Cash Amount', 'UPI Address', 'Request Date', 'Status', 'Actions'];

  const renderRow = (item, idx) => (
    <tr key={item.id} className="animate-fade">
      <td style={{ fontWeight: '600', color: 'var(--text-bold)' }}>{item.userName}</td>
      <td style={{ fontWeight: '500' }}>{(item.coins || item.amount * 100).toLocaleString()} Coins</td>
      <td style={{ fontWeight: '700', color: 'var(--text-bold)' }}>₹{item.amount.toFixed(2)}</td>
      <td style={{ fontFamily: 'monospace', color: 'var(--primary)', fontWeight: '600' }}>{item.upiId}</td>
      <td>{item.date}</td>
      <td>
        <span className={`status-badge ${item.status}`}>{item.status}</span>
      </td>
      <td>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className="admin-btn-icon"
            onClick={() => openDetailsModal(item)}
            title="View Payout Details"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <Eye size={14} />
          </button>

          {item.status === 'pending' ? (
            <>
              <button
                className="admin-btn-icon edit"
                onClick={() => {
                  if (window.confirm(`Are you sure you want to approve this withdrawal of ₹${item.amount.toFixed(2)} for ${item.userName}?`)) {
                    onApprove(item.id, item.amount);
                  }
                }}
                title="Approve & Payout"
                style={{ padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <Check size={14} />
              </button>
              <button
                className="admin-btn-icon delete"
                onClick={() => {
                  if (window.confirm(`Are you sure you want to reject this withdrawal of ₹${item.amount.toFixed(2)} for ${item.userName}?`)) {
                    onReject(item.id);
                  }
                }}
                title="Reject Request"
                style={{ padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={14} />
              </button>
            </>
          ) : null}
        </div>
      </td>
    </tr>
  );

  const exportColumns = [
    { header: 'ID', dataKey: 'id' },
    { header: 'User Name', dataKey: 'userName' },
    { header: 'Amount (INR)', dataKey: 'amount' },
    { header: 'UPI Address', dataKey: 'upiId' },
    { header: 'Date', dataKey: 'date' },
    { header: 'Status', dataKey: 'status' }
  ];

  return (
    <div className="admin-withdrawals-tab animate-fade">
      <div className="admin-page-header">
        <div className="admin-page-title">
          <h2>Withdrawal Management</h2>
          <p>Review and settle user cash-out claims to UPI bank handles</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12px',
            fontWeight: '600',
            color: '#16a34a',
            backgroundColor: '#dcfce7',
            padding: '6px 12px',
            borderRadius: '20px',
            border: '1px solid #86efac'
          }}>
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: '#16a34a',
              boxShadow: '0 0 6px #16a34a',
              display: 'inline-block'
            }} />
            Live Sync (8s)
          </div>

          {onRefresh && (
            <button
              className="admin-btn admin-btn-secondary"
              onClick={onRefresh}
              disabled={refreshing}
              title="Refresh Withdrawal Requests"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
            >
              <RotateCw size={14} className={refreshing ? 'animate-spin' : ''} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          )}

          <ExportDataButton data={withdrawRequests} columns={exportColumns} filename="Withdrawals" />
        </div>
      </div>

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
            placeholder="Search User or UPI Address..."
            className="admin-search-input"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text)' }}>
            <Filter size={14} />
            <span>Status:</span>
          </div>

          <select
            className="admin-filter-select"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="all">All Withdrawals</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      <AdminTable
        headers={headers}
        items={filteredRequests}
        currentPage={currentPage}
        itemsPerPage={5}
        onPageChange={setCurrentPage}
        renderRow={renderRow}
        emptyMessage="No withdraw requests match filters."
      />

      {/* Details Modal */}
      {selectedRequest && (
        <AdminModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Withdrawal Details"
          footer={
            <div style={{ display: 'flex', gap: '12px' }}>
              {selectedRequest.status === 'pending' && (
                <>
                  <button
                    className="admin-btn admin-btn-secondary"
                    onClick={() => {
                      if (window.confirm(`Are you sure you want to reject this withdrawal of ₹${selectedRequest.amount.toFixed(2)} for ${selectedRequest.userName}?`)) {
                        onReject(selectedRequest.id);
                        setIsModalOpen(false);
                      }
                    }}
                    style={{ color: '#ef4444' }}
                  >
                    Reject Claim
                  </button>
                  <button
                    className="admin-btn admin-btn-primary"
                    onClick={() => {
                      if (window.confirm(`Are you sure you want to approve this withdrawal of ₹${selectedRequest.amount.toFixed(2)} for ${selectedRequest.userName}?`)) {
                        onApprove(selectedRequest.id, selectedRequest.amount);
                        setIsModalOpen(false);
                      }
                    }}
                  >
                    Approve & Disburse
                  </button>
                </>
              )}
              <button className="admin-btn admin-btn-secondary" onClick={() => setIsModalOpen(false)}>
                Close
              </button>
            </div>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text)', textTransform: 'uppercase', fontWeight: '600' }}>Claim ID</span>
              <p style={{ fontFamily: 'monospace', fontWeight: '700', fontSize: '15px', color: 'var(--text-bold)' }}>
                WDR-{selectedRequest.id}
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text)', textTransform: 'uppercase', fontWeight: '600' }}>User Name</span>
                <p style={{ fontWeight: '600', color: 'var(--text-bold)', fontSize: '14px', marginTop: '2px' }}>{selectedRequest.userName}</p>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text)', textTransform: 'uppercase', fontWeight: '600' }}>UPI Account Address</span>
                <p style={{ fontWeight: '700', color: 'var(--primary)', fontFamily: 'monospace', fontSize: '14px', marginTop: '2px' }}>
                  {selectedRequest.upiId}
                </p>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text)', textTransform: 'uppercase', fontWeight: '600' }}>Coins Redeemed</span>
                <p style={{ fontWeight: '500', color: 'var(--text-bold)', fontSize: '14px', marginTop: '2px' }}>
                  {(selectedRequest.coins || selectedRequest.amount * 100).toLocaleString()} Coins
                </p>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text)', textTransform: 'uppercase', fontWeight: '600' }}>Payout Value (₹)</span>
                <p style={{ fontWeight: '700', color: 'var(--secondary)', fontSize: '15px', marginTop: '2px' }}>
                  ₹{selectedRequest.amount.toFixed(2)}
                </p>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text)', textTransform: 'uppercase', fontWeight: '600' }}>Submission Date</span>
                <p style={{ fontWeight: '500', color: 'var(--text-bold)', fontSize: '14px', marginTop: '2px' }}>{selectedRequest.date}</p>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text)', textTransform: 'uppercase', fontWeight: '600' }}>Settle Status</span>
                <p style={{ marginTop: '2px' }}>
                  <span className={`status-badge ${selectedRequest.status}`}>{selectedRequest.status}</span>
                </p>
              </div>
            </div>
          </div>
        </AdminModal>
      )}
    </div>
  );
}
