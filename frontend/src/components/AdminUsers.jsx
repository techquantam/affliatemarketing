import React, { useState } from 'react';
import { Search, Filter, ShieldCheck, ShieldAlert, Eye, Edit2, Wallet } from 'lucide-react';
import { AdminTable, AdminModal, AdminFormInput, AdminFormSelect, ExportDataButton } from './AdminComponents';
import AdminWalletModal from './AdminWalletModal';
import { apiUsers } from '../services/api';

export default function AdminUsers({ users, setUsers, onEditUser, onAddNotification, currentUser }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modal States
  const [selectedUser, setSelectedUser] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [walletModalUser, setWalletModalUser] = useState(null);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);

  // KYC verification states
  const [showRejectReasonInput, setShowRejectReasonInput] = useState(false);
  const [kycRemarks, setKycRemarks] = useState('');

  const handleApproveKyc = async () => {
    try {
      await apiUsers.updateKyc(selectedUser.id, { status: 'approved' });
      setUsers(prev => prev.map(u => u.id === selectedUser.id ? { ...u, kycStatus: 'approved' } : u));
      setSelectedUser(prev => ({ ...prev, kycStatus: 'approved' }));
      onAddNotification('User E-KYC has been approved successfully!', 'success');
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
    } catch (err) {
      console.error(err);
      onAddNotification('Failed to reject KYC.', 'error');
    }
  };

  // Edit Form Fields
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editMobile, setEditMobile] = useState('');
  const [editStatus, setEditStatus] = useState('active');
  const [editSharedCommRate, setEditSharedCommRate] = useState('');

  const handleToggleUserStatus = (userId) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          const nextStatus = u.status === 'active' ? 'blocked' : 'active';
          onAddNotification(`User ${u.name} status updated to ${nextStatus}.`, 'info');
          return { ...u, status: nextStatus };
        }
        return u;
      })
    );
  };

  const openViewModal = (user) => {
    setSelectedUser(user);
    setIsViewModalOpen(true);
  };

  const openEditModal = (user) => {
    setEditUser(user);
    setEditName(user.name);
    setEditEmail(user.email || `${user.name.toLowerCase().replace(' ', '')}@gmail.com`);
    setEditMobile(user.phone || '+91 9876543210');
    setEditStatus(user.status);
    setEditSharedCommRate(user.sharedCommissionRate !== null && user.sharedCommissionRate !== undefined ? user.sharedCommissionRate.toString() : '');
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!editName.trim() || !editEmail.trim() || !editMobile.trim()) {
      onAddNotification('Please fill in Name, Email, and Mobile.', 'error');
      return;
    }

    if (onEditUser) {
      onEditUser(editUser.id, {
        name: editName,
        email: editEmail,
        phone: editMobile,
        status: editStatus,
        sharedCommissionRate: editSharedCommRate.trim() === '' ? null : parseFloat(editSharedCommRate),
      });
    } else {
      setUsers((prev) =>
        prev.map((u) =>
          u.id === editUser.id
            ? {
                ...u,
                name: editName,
                email: editEmail,
                phone: editMobile,
                status: editStatus,
                sharedCommissionRate: editSharedCommRate.trim() === '' ? null : parseFloat(editSharedCommRate),
              }
            : u
        )
      );
      onAddNotification('User details updated locally.', 'success');
    }

    setIsEditModalOpen(false);
  };

  const filteredUsers = users.filter((u) => {
    const query = searchQuery.toLowerCase();
    const emailStr = (u.email || '').toLowerCase();
    const matchesSearch =
      u.name.toLowerCase().includes(query) ||
      u.phone.includes(query) ||
      u.referralCode.toLowerCase().includes(query) ||
      emailStr.includes(query);
    const matchesStatus = statusFilter === 'all' || u.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const exportColumns = [
    { header: 'ID', dataKey: 'id' },
    { header: 'Name', dataKey: 'name' },
    { header: 'Email', dataKey: 'email' },
    { header: 'Phone', dataKey: 'phone' },
    { header: 'Role', dataKey: 'role' },
    { header: 'Status', dataKey: 'status' },
    { header: 'Wallet Balance (₹)', dataKey: 'walletBalance' },
    { header: 'Referral Code', dataKey: 'referralCode' }
  ];

  const headers = ['User Name', 'Email', 'Mobile', 'Referral Code', 'Join Date', 'Status', 'KYC Status', 'Actions'];

  const renderRow = (item, idx) => (
    <tr key={item.id} className="animate-fade">
      <td style={{ fontWeight: '600', color: 'var(--text-bold)' }}>{item.name}</td>
      <td>{item.email || `${item.name.toLowerCase().replace(' ', '')}@gmail.com`}</td>
      <td>{item.phone}</td>
      <td style={{ fontFamily: 'monospace', fontWeight: '600', color: 'var(--primary)' }}>{item.referralCode}</td>
      <td>{item.joinDate}</td>
      <td>
        <span className={`status-badge ${item.status === 'active' ? 'active' : 'inactive'}`}>
          {item.status}
        </span>
      </td>
      <td>
        <span className="status-badge" style={{
          backgroundColor: item.kycStatus === 'approved' ? 'rgba(16,185,129,0.1)' : item.kycStatus === 'pending' ? 'rgba(245,158,11,0.1)' : item.kycStatus === 'rejected' ? 'rgba(239,68,68,0.1)' : 'rgba(100,116,139,0.1)',
          color: item.kycStatus === 'approved' ? '#10b981' : item.kycStatus === 'pending' ? '#f59e0b' : item.kycStatus === 'rejected' ? '#ef4444' : '#64748b',
          fontWeight: 'bold'
        }}>
          {item.kycStatus ? item.kycStatus.toUpperCase().replace('_', ' ') : 'NONE'}
        </span>
      </td>
      <td>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className="admin-btn-icon"
            onClick={() => openViewModal(item)}
            title="View User Details"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <Eye size={14} />
          </button>
          <button
            className="admin-btn-icon edit"
            onClick={() => openEditModal(item)}
            title="Edit User Profile"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <Edit2 size={14} />
          </button>
          <button
            className="admin-btn-icon"
            onClick={() => { setWalletModalUser(item); setIsWalletModalOpen(true); }}
            title="Manage Wallet & Ledger"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '4px 10px', height: 'auto', backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.4)', borderRadius: '6px', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}
          >
            <Wallet size={13} />
            <span>Wallet</span>
          </button>
          <button
            className={`admin-btn-icon ${item.status === 'active' ? 'delete' : 'edit'}`}
            onClick={() => handleToggleUserStatus(item.id)}
            title={item.status === 'active' ? 'Block User' : 'Unblock User'}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            {item.status === 'active' ? <ShieldAlert size={14} /> : <ShieldCheck size={14} />}
          </button>
        </div>
      </td>
    </tr>
  );

  return (
    <div className="admin-users-tab animate-fade">
      <div className="admin-page-header">
        <div className="admin-page-title">
          <h2>User Management</h2>
          <p>Search, view logs, edit profiles, and block/unblock members</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <ExportDataButton data={users} columns={exportColumns} filename="Users_Report" />
        </div>
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
            placeholder="Search by name, email, phone or code..."
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
            <span>Filter Status:</span>
          </div>

          <select
            className="admin-filter-select"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="blocked">Blocked Only</option>
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
        emptyMessage="No users found matching requirements."
      />

      {/* View User Modal */}
      {selectedUser && (
        <AdminModal
          isOpen={isViewModalOpen}
          onClose={() => setIsViewModalOpen(false)}
          title="User Details"
          footer={
            <button className="admin-btn admin-btn-primary" onClick={() => setIsViewModalOpen(false)}>
              Close Profile
            </button>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
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
                <h4 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-bold)' }}>{selectedUser.name}</h4>
                <p style={{ fontSize: '13px', color: 'var(--text)' }}>
                  User ID: <span style={{ fontFamily: 'monospace' }}>USR-{selectedUser.id}</span>
                </p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text)', textTransform: 'uppercase', fontWeight: '600' }}>Email Address</span>
                <p style={{ fontWeight: '500', color: 'var(--text-bold)', fontSize: '14px', marginTop: '2px' }}>
                  {selectedUser.email || `${selectedUser.name.toLowerCase().replace(' ', '')}@gmail.com`}
                </p>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text)', textTransform: 'uppercase', fontWeight: '600' }}>Mobile Number</span>
                <p style={{ fontWeight: '500', color: 'var(--text-bold)', fontSize: '14px', marginTop: '2px' }}>{selectedUser.phone}</p>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text)', textTransform: 'uppercase', fontWeight: '600' }}>Referral Code</span>
                <p style={{ fontWeight: '700', color: 'var(--primary)', fontSize: '14px', marginTop: '2px' }}>{selectedUser.referralCode}</p>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text)', textTransform: 'uppercase', fontWeight: '600' }}>Referred By</span>
                <p style={{ fontWeight: '500', color: 'var(--text-bold)', fontSize: '14px', marginTop: '2px' }}>{selectedUser.referredBy || '—'}</p>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text)', textTransform: 'uppercase', fontWeight: '600' }}>Join Date</span>
                <p style={{ fontWeight: '500', color: 'var(--text-bold)', fontSize: '14px', marginTop: '2px' }}>{selectedUser.joinDate}</p>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text)', textTransform: 'uppercase', fontWeight: '600' }}>Account Status</span>
                <p style={{ marginTop: '2px' }}>
                  <span className={`status-badge ${selectedUser.status === 'active' ? 'active' : 'inactive'}`}>{selectedUser.status}</span>
                </p>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text)', textTransform: 'uppercase', fontWeight: '600' }}>Date of Birth</span>
                <p style={{ fontWeight: '500', color: 'var(--text-bold)', fontSize: '14px', marginTop: '2px' }}>{selectedUser.dob || '—'}</p>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text)', textTransform: 'uppercase', fontWeight: '600' }}>Gender</span>
                <p style={{ fontWeight: '500', color: 'var(--text-bold)', fontSize: '14px', marginTop: '2px' }}>{selectedUser.gender || '—'}</p>
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <span style={{ fontSize: '11px', color: 'var(--text)', textTransform: 'uppercase', fontWeight: '600' }}>Full Address</span>
                <p style={{ fontWeight: '500', color: 'var(--text-bold)', fontSize: '14px', marginTop: '2px' }}>
                  {selectedUser.address ? `${selectedUser.address}, ${selectedUser.city}, ${selectedUser.state} - ${selectedUser.pincode}` : '—'}
                </p>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text)', textTransform: 'uppercase', fontWeight: '600' }}>Shared Commission Rate</span>
                <p style={{ fontWeight: '500', color: 'var(--text-bold)', fontSize: '14px', marginTop: '2px' }}>
                  {selectedUser.sharedCommissionRate !== null && selectedUser.sharedCommissionRate !== undefined ? `${selectedUser.sharedCommissionRate}%` : 'Platform Default'}
                </p>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text)', textTransform: 'uppercase', fontWeight: '600' }}>KYC Status</span>
                <p style={{ marginTop: '2px' }}>
                  <span className="status-badge" style={{
                    backgroundColor: selectedUser.kycStatus === 'approved' ? 'rgba(16,185,129,0.1)' : selectedUser.kycStatus === 'pending' ? 'rgba(245,158,11,0.1)' : selectedUser.kycStatus === 'rejected' ? 'rgba(239,68,68,0.1)' : 'rgba(100,116,139,0.1)',
                    color: selectedUser.kycStatus === 'approved' ? '#10b981' : selectedUser.kycStatus === 'pending' ? '#f59e0b' : selectedUser.kycStatus === 'rejected' ? '#ef4444' : '#64748b',
                    fontWeight: 'bold'
                  }}>
                    {selectedUser.kycStatus ? selectedUser.kycStatus.toUpperCase().replace('_', ' ') : 'NOT SUBMITTED'}
                  </span>
                </p>
              </div>
            </div>

            {/* KYC Identity Numbers & Document Images */}
            {(selectedUser.aadhaarNumber || selectedUser.panNumber) && (
              <div style={{ marginTop: '8px', borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
                <h5 style={{ margin: '0 0 10px', fontSize: '14px', fontWeight: 'bold', color: 'var(--text-bold)' }}>E-KYC Documents</h5>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--text)' }}>Aadhaar Card Number</span>
                    <p style={{ fontWeight: '700', fontSize: '13px', fontFamily: 'monospace', color: 'var(--text-bold)', marginTop: '2px' }}>{selectedUser.aadhaarNumber || '—'}</p>
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--text)' }}>PAN Card Number</span>
                    <p style={{ fontWeight: '700', fontSize: '13px', fontFamily: 'monospace', color: 'var(--text-bold)', marginTop: '2px' }}>{selectedUser.panNumber || '—'}</p>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '10px' }}>
                  {selectedUser.aadhaarFrontUrl && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ fontSize: '10px', color: 'var(--text)', fontWeight: 600 }}>Aadhaar Front</span>
                      <a href={selectedUser.aadhaarFrontUrl} target="_blank" rel="noreferrer" style={{ display: 'block', border: '1px solid var(--border)', borderRadius: '6px', overflow: 'hidden' }}>
                        <img src={selectedUser.aadhaarFrontUrl} alt="Aadhaar Front" style={{ width: '100%', height: '80px', objectFit: 'cover' }} />
                      </a>
                    </div>
                  )}
                  {selectedUser.aadhaarBackUrl && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ fontSize: '10px', color: 'var(--text)', fontWeight: 600 }}>Aadhaar Back</span>
                      <a href={selectedUser.aadhaarBackUrl} target="_blank" rel="noreferrer" style={{ display: 'block', border: '1px solid var(--border)', borderRadius: '6px', overflow: 'hidden' }}>
                        <img src={selectedUser.aadhaarBackUrl} alt="Aadhaar Back" style={{ width: '100%', height: '80px', objectFit: 'cover' }} />
                      </a>
                    </div>
                  )}
                  {selectedUser.panCardUrl && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ fontSize: '10px', color: 'var(--text)', fontWeight: 600 }}>PAN Card</span>
                      <a href={selectedUser.panCardUrl} target="_blank" rel="noreferrer" style={{ display: 'block', border: '1px solid var(--border)', borderRadius: '6px', overflow: 'hidden' }}>
                        <img src={selectedUser.panCardUrl} alt="PAN Card" style={{ width: '100%', height: '80px', objectFit: 'cover' }} />
                      </a>
                    </div>
                  )}
                  {selectedUser.selfieUrl && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ fontSize: '10px', color: 'var(--text)', fontWeight: 600 }}>Selfie Photo</span>
                      <a href={selectedUser.selfieUrl} target="_blank" rel="noreferrer" style={{ display: 'block', border: '1px solid var(--border)', borderRadius: '6px', overflow: 'hidden' }}>
                        <img src={selectedUser.selfieUrl} alt="Selfie" style={{ width: '100%', height: '80px', objectFit: 'cover' }} />
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* KYC Admin Actions */}
            {selectedUser.kycStatus === 'pending' && (
              <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <h5 style={{ margin: 0, fontSize: '14px', fontWeight: 'bold', color: 'var(--text-bold)' }}>Verify E-KYC Documents</h5>
                
                {showRejectReasonInput ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <input
                      type="text"
                      placeholder="Enter reason for rejection (remarks)"
                      value={kycRemarks}
                      onChange={e => setKycRemarks(e.target.value)}
                      style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '13px', backgroundColor: 'var(--bg)', color: 'var(--text-bold)' }}
                    />
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={handleRejectKyc} className="admin-btn admin-btn-danger" style={{ flex: 1 }}>Confirm Reject</button>
                      <button onClick={() => setShowRejectReasonInput(false)} className="admin-btn admin-btn-secondary">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={handleApproveKyc} className="admin-btn admin-btn-primary" style={{ flex: 1, backgroundColor: '#10b981', border: 'none', color: '#fff', fontWeight: 'bold' }}>Approve KYC</button>
                    <button onClick={() => setShowRejectReasonInput(true)} className="admin-btn admin-btn-danger" style={{ flex: 1, fontWeight: 'bold' }}>Reject KYC</button>
                  </div>
                )}
              </div>
            )}
          </div>
        </AdminModal>
      )}

      {/* Edit User Modal */}
      {editUser && (
        <AdminModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title="Edit User Profile"
          footer={
            <>
              <button className="admin-btn admin-btn-secondary" onClick={() => setIsEditModalOpen(false)}>
                Cancel
              </button>
              <button className="admin-btn admin-btn-primary" onClick={handleSaveEdit}>
                Save Changes
              </button>
            </>
          }
        >
          <form onSubmit={handleSaveEdit}>
            <AdminFormInput
              label="Full Name"
              id="edit-name"
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
            />
            <AdminFormInput
              label="Email Address"
              id="edit-email"
              type="email"
              value={editEmail}
              onChange={(e) => setEditEmail(e.target.value)}
            />
            <AdminFormInput
              label="Mobile Number"
              id="edit-mobile"
              type="text"
              value={editMobile}
              onChange={(e) => setEditMobile(e.target.value)}
            />
            <AdminFormInput
              label="Custom Shared Commission Rate (%) (Leave blank for default)"
              id="edit-shared-comm-rate"
              type="number"
              step="0.1"
              value={editSharedCommRate}
              onChange={(e) => setEditSharedCommRate(e.target.value)}
              placeholder="e.g. 6.0"
            />
            <AdminFormSelect
              label="Account Status"
              id="edit-status"
              value={editStatus}
              onChange={(e) => setEditStatus(e.target.value)}
              options={[
                { value: 'active', label: 'Active' },
                { value: 'blocked', label: 'Blocked' },
              ]}
            />
          </form>
        </AdminModal>
      )}

      {/* Admin Wallet & Ledger Management Modal */}
      <AdminWalletModal
        isOpen={isWalletModalOpen}
        onClose={() => setIsWalletModalOpen(false)}
        user={walletModalUser}
        currentUser={currentUser}
        onAddNotification={onAddNotification}
      />
    </div>
  );
}
