import React, { useState } from 'react';
import { Search, Filter, ShieldCheck, ShieldAlert, Eye, Check, X, Camera } from 'lucide-react';
import { AdminTable, AdminModal, ExportDataButton } from './AdminComponents';
import { apiUsers } from '../services/api';

export default function AdminKYC({ users, setUsers, onAddNotification, currentUser }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending');

  // Modal State
  const [selectedUser, setSelectedUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showRejectReasonInput, setShowRejectReasonInput] = useState(false);
  const [kycRemarks, setKycRemarks] = useState('');

  const filteredUsers = users.filter((u) => {
    const kycStatus = u.kycStatus || 'not_submitted';
    
    // Check search query
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      u.name.toLowerCase().includes(query) ||
      (u.email || '').toLowerCase().includes(query) ||
      (u.aadhaarNumber || '').includes(query) ||
      (u.panNumber || '').toLowerCase().includes(query);
      
    // Apply status filter
    const matchesStatus = statusFilter === 'all' || kycStatus.toLowerCase() === statusFilter.toLowerCase();
    
    return matchesSearch && matchesStatus;
  });

  const openDetailsModal = (user) => {
    setSelectedUser(user);
    setShowRejectReasonInput(false);
    setKycRemarks('');
    setIsModalOpen(true);
  };

  const handleApproveKyc = async () => {
    try {
      await apiUsers.updateKyc(selectedUser.id, { status: 'approved' });
      setUsers(prev => prev.map(u => u.id === selectedUser.id ? { ...u, kycStatus: 'approved' } : u));
      setSelectedUser(prev => ({ ...prev, kycStatus: 'approved' }));
      onAddNotification('User E-KYC has been approved successfully!', 'success');
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      onAddNotification('Failed to approve KYC.', 'error');
    }
  };

  const handleRejectKyc = async () => {
    if (!kycRemarks.trim()) {
      onAddNotification('Please enter rejection remarks.', 'error');
      return;
    }
    try {
      await apiUsers.updateKyc(selectedUser.id, { status: 'rejected', remarks: kycRemarks });
      setUsers(prev => prev.map(u => u.id === selectedUser.id ? { ...u, kycStatus: 'rejected', kycRemarks: kycRemarks } : u));
      setSelectedUser(prev => ({ ...prev, kycStatus: 'rejected', kycRemarks: kycRemarks }));
      setShowRejectReasonInput(false);
      setKycRemarks('');
      onAddNotification('User E-KYC has been rejected.', 'info');
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      onAddNotification('Failed to reject KYC.', 'error');
    }
  };

  const headers = ['User Name', 'Email', 'Mobile', 'Aadhaar Number', 'PAN Number', 'KYC Status', 'Actions'];

  const renderRow = (item, idx) => {
    const kycStatus = item.kycStatus || 'not_submitted';
    return (
      <tr key={item.id} className="animate-fade">
        <td style={{ fontWeight: '600', color: 'var(--text-bold)' }}>{item.name}</td>
        <td>{item.email || `${item.name.toLowerCase().replace(' ', '')}@gmail.com`}</td>
        <td>{item.phone || '—'}</td>
        <td style={{ fontFamily: 'monospace' }}>{item.aadhaarNumber || '—'}</td>
        <td style={{ fontFamily: 'monospace', textTransform: 'uppercase' }}>{item.panNumber || '—'}</td>
        <td>
          <span className="status-badge" style={{
            backgroundColor: kycStatus === 'approved' ? 'rgba(16,185,129,0.1)' : kycStatus === 'pending' ? 'rgba(245,158,11,0.1)' : kycStatus === 'rejected' ? 'rgba(239,68,68,0.1)' : 'rgba(100,116,139,0.1)',
            color: kycStatus === 'approved' ? '#10b981' : kycStatus === 'pending' ? '#f59e0b' : kycStatus === 'rejected' ? '#ef4444' : '#64748b',
            fontWeight: 'bold'
          }}>
            {kycStatus.toUpperCase().replace('_', ' ')}
          </span>
        </td>
        <td>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className="admin-btn-icon"
              onClick={() => openDetailsModal(item)}
              title="Verify & Action KYC"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <Eye size={14} />
            </button>
          </div>
        </td>
      </tr>
    );
  };

  const exportColumns = [
    { header: 'ID', dataKey: 'id' },
    { header: 'Name', dataKey: 'name' },
    { header: 'Email', dataKey: 'email' },
    { header: 'Aadhaar Number', dataKey: 'aadhaarNumber' },
    { header: 'PAN Number', dataKey: 'panNumber' },
    { header: 'KYC Status', dataKey: 'kycStatus' },
    { header: 'Remarks', dataKey: 'kycRemarks' }
  ];

  return (
    <div className="admin-kyc-tab animate-fade">
      <div className="admin-page-header">
        <div className="admin-page-title">
          <h2>User KYC Verification</h2>
          <p>Review uploaded documents, verify identity details, and approve/reject E-KYC status</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <ExportDataButton data={filteredUsers} columns={exportColumns} filename="KYC_Submissions" />
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
            placeholder="Search by name, email, Aadhaar or PAN..."
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
            <span>KYC Status:</span>
          </div>

          <select
            className="admin-filter-select"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="all">All Submissions</option>
            <option value="pending">Pending Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="not_submitted">Not Submitted</option>
          </select>
        </div>
      </div>

      <AdminTable
        headers={headers}
        items={filteredUsers}
        currentPage={currentPage}
        itemsPerPage={5}
        onPageChange={setCurrentPage}
        renderRow={renderRow}
        emptyMessage="No KYC submissions found matching criteria."
      />

      {/* KYC Details Modal */}
      {selectedUser && (
        <AdminModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Verify E-KYC Documents"
          footer={
            <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
              {selectedUser.kycStatus === 'pending' && !showRejectReasonInput && (
                <>
                  <button
                    className="admin-btn admin-btn-danger"
                    onClick={() => setShowRejectReasonInput(true)}
                    style={{ flex: 1, fontWeight: 'bold' }}
                  >
                    Reject KYC
                  </button>
                  <button
                    className="admin-btn admin-btn-primary"
                    onClick={handleApproveKyc}
                    style={{ flex: 1, backgroundColor: '#10b981', border: 'none', color: '#fff', fontWeight: 'bold' }}
                  >
                    Approve KYC
                  </button>
                </>
              )}
              <button 
                className="admin-btn admin-btn-secondary" 
                onClick={() => setIsModalOpen(false)}
                style={{ flex: selectedUser.kycStatus === 'pending' ? 'none' : 1 }}
              >
                Close
              </button>
            </div>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background: 'var(--gradient-primary)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '700',
                  fontSize: '22px',
                }}
              >
                {selectedUser.name[0].toUpperCase()}
              </div>
              <div>
                <h4 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-bold)', margin: 0 }}>{selectedUser.name}</h4>
                <p style={{ fontSize: '13px', color: 'var(--text)', margin: '4px 0 0' }}>
                  User ID: <span style={{ fontFamily: 'monospace' }}>USR-{selectedUser.id}</span>
                </p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text)', textTransform: 'uppercase', fontWeight: '600' }}>Email Address</span>
                <p style={{ fontWeight: '500', color: 'var(--text-bold)', fontSize: '14px', marginTop: '2px', wordBreak: 'break-all' }}>
                  {selectedUser.email || `${selectedUser.name.toLowerCase().replace(' ', '')}@gmail.com`}
                </p>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text)', textTransform: 'uppercase', fontWeight: '600' }}>Mobile Number</span>
                <p style={{ fontWeight: '500', color: 'var(--text-bold)', fontSize: '14px', marginTop: '2px' }}>{selectedUser.phone || '—'}</p>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text)', textTransform: 'uppercase', fontWeight: '600' }}>Aadhaar Card Number</span>
                <p style={{ fontWeight: '700', fontSize: '14px', fontFamily: 'monospace', color: 'var(--text-bold)', marginTop: '2px' }}>
                  {selectedUser.aadhaarNumber || '—'}
                </p>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text)', textTransform: 'uppercase', fontWeight: '600' }}>PAN Card Number</span>
                <p style={{ fontWeight: '700', fontSize: '14px', fontFamily: 'monospace', color: 'var(--text-bold)', marginTop: '2px', textTransform: 'uppercase' }}>
                  {selectedUser.panNumber || '—'}
                </p>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text)', textTransform: 'uppercase', fontWeight: '600' }}>Current KYC Status</span>
                <p style={{ marginTop: '2px' }}>
                  <span className="status-badge" style={{
                    backgroundColor: selectedUser.kycStatus === 'approved' ? 'rgba(16,185,129,0.1)' : selectedUser.kycStatus === 'pending' ? 'rgba(245,158,11,0.1)' : selectedUser.kycStatus === 'rejected' ? 'rgba(239,68,68,0.1)' : 'rgba(100,116,139,0.1)',
                    color: selectedUser.kycStatus === 'approved' ? '#10b981' : selectedUser.kycStatus === 'pending' ? '#f59e0b' : selectedUser.kycStatus === 'rejected' ? '#ef4444' : '#64748b',
                    fontWeight: 'bold'
                  }}>
                    {(selectedUser.kycStatus || 'NOT SUBMITTED').toUpperCase().replace('_', ' ')}
                  </span>
                </p>
              </div>
              {selectedUser.kycRemarks && (
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--text)', textTransform: 'uppercase', fontWeight: '600' }}>Admin Remarks</span>
                  <p style={{ fontWeight: '500', color: '#ef4444', fontSize: '13px', marginTop: '2px' }}>{selectedUser.kycRemarks}</p>
                </div>
              )}
            </div>

            {/* Document Images */}
            <div style={{ marginTop: '8px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
              <h5 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: 'bold', color: 'var(--text-bold)' }}>Uploaded E-KYC Files</h5>
              
              {(!selectedUser.aadhaarFrontUrl && !selectedUser.aadhaarBackUrl && !selectedUser.panCardUrl && !selectedUser.selfieUrl) ? (
                <p style={{ fontSize: '13px', color: 'var(--text)', fontStyle: 'italic', textAlign: 'center', padding: '16px 0' }}>
                  No uploaded document images found for this user.
                </p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px' }}>
                  {selectedUser.aadhaarFrontUrl && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text)', fontWeight: 600 }}>Aadhaar Front</span>
                      <a href={selectedUser.aadhaarFrontUrl} target="_blank" rel="noreferrer" style={{ display: 'block', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden', backgroundColor: 'var(--bg)' }}>
                        <img src={selectedUser.aadhaarFrontUrl} alt="Aadhaar Front" style={{ width: '100%', height: '90px', objectFit: 'cover' }} />
                      </a>
                    </div>
                  )}
                  {selectedUser.aadhaarBackUrl && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text)', fontWeight: 600 }}>Aadhaar Back</span>
                      <a href={selectedUser.aadhaarBackUrl} target="_blank" rel="noreferrer" style={{ display: 'block', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden', backgroundColor: 'var(--bg)' }}>
                        <img src={selectedUser.aadhaarBackUrl} alt="Aadhaar Back" style={{ width: '100%', height: '90px', objectFit: 'cover' }} />
                      </a>
                    </div>
                  )}
                  {selectedUser.panCardUrl && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text)', fontWeight: 600 }}>PAN Card</span>
                      <a href={selectedUser.panCardUrl} target="_blank" rel="noreferrer" style={{ display: 'block', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden', backgroundColor: 'var(--bg)' }}>
                        <img src={selectedUser.panCardUrl} alt="PAN Card" style={{ width: '100%', height: '90px', objectFit: 'cover' }} />
                      </a>
                    </div>
                  )}
                  {selectedUser.selfieUrl && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text)', fontWeight: 600 }}>Selfie Photo</span>
                      <a href={selectedUser.selfieUrl} target="_blank" rel="noreferrer" style={{ display: 'block', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden', backgroundColor: 'var(--bg)' }}>
                        <img src={selectedUser.selfieUrl} alt="Selfie" style={{ width: '100%', height: '90px', objectFit: 'cover' }} />
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Rejection input */}
            {showRejectReasonInput && (
              <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <h5 style={{ margin: 0, fontSize: '14px', fontWeight: 'bold', color: 'var(--text-bold)' }}>Enter Rejection Reason</h5>
                <input
                  type="text"
                  placeholder="Specify why the documents are rejected..."
                  value={kycRemarks}
                  onChange={e => setKycRemarks(e.target.value)}
                  style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '13px', backgroundColor: 'var(--bg)', color: 'var(--text-bold)' }}
                  required
                />
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={handleRejectKyc} className="admin-btn admin-btn-danger" style={{ flex: 1, fontWeight: 'bold' }}>
                    Confirm Reject
                  </button>
                  <button onClick={() => setShowRejectReasonInput(false)} className="admin-btn admin-btn-secondary" style={{ flex: 1 }}>
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </AdminModal>
      )}
    </div>
  );
}
