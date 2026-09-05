import React, { useState, useEffect } from 'react';
import { Search, ShieldCheck, ShieldAlert, Eye, Edit2, UserPlus, Trash2, Crown, Shield, Users, Headphones, PenTool, CheckSquare } from 'lucide-react';
import { AdminTable, AdminModal, AdminFormInput, AdminFormSelect } from './AdminComponents';
import { apiAdminManagement, apiUsers } from '../services/api';

const ROLE_OPTIONS = [
  { value: 'SUPER_ADMIN', label: 'Super Admin', icon: Crown, color: '#f59e0b', description: 'Full access to everything, can manage other admins' },
  { value: 'ADMIN', label: 'Admin', icon: Shield, color: '#3b82f6', description: 'Full access except admin management & audit logs' },
  { value: 'CONTENT_MANAGER', label: 'Content Manager', icon: PenTool, color: '#8b5cf6', description: 'Manages products, categories, deals, stores, banners, SEO' },
  { value: 'AFFILIATE_MANAGER', label: 'Affiliate Manager', icon: Users, color: '#10b981', description: 'Manages users, conversions, referrals, commissions, network' },
  { value: 'SUPPORT_ADMIN', label: 'Support Admin', icon: Headphones, color: '#ef4444', description: 'View-only with edit access to users & withdrawals' },
];

const PERMISSION_LABELS = [
  { key: 'view', label: 'View Records' },
  { key: 'add', label: 'Add New' },
  { key: 'edit', label: 'Edit Existing' },
  { key: 'delete', label: 'Delete Records' },
  { key: 'export', label: 'Export Data' },
  { key: 'settings', label: 'Change Settings' },
  { key: 'manageAdmins', label: 'Manage Admins' },
];

const MODULE_LABELS = {
  'dashboard': 'Dashboard',
  'users': 'Users',
  'roles': 'Roles & Permissions',
  'products': 'Products',
  'withdrawals': 'Withdrawals',
  'click-logs': 'Click Logs',
  'conversions': 'Conversions',
  'referrals': 'Referrals',
  'shared-commissions': 'Shared Commissions',
  'categories': 'Categories',
  'deals': 'Deals',
  'stores': 'Stores',
  'banners': 'Banners',
  'affiliate-network': 'Affiliate Network',
  'ledger': 'Ledger Management',
  'seo': 'SEO',
  'settings': 'Settings',
  'activity-logs': 'Activity Logs',
  'login-history': 'Login History',
  'finance': 'Finance',
};

const ALL_MODULES = Object.keys(MODULE_LABELS);

const ROLE_MODULE_DEFAULTS = {
  'SUPER_ADMIN': ALL_MODULES,
  'ADMIN': ['dashboard', 'users', 'products', 'withdrawals', 'click-logs', 'conversions', 'referrals', 'shared-commissions', 'categories', 'deals', 'stores', 'banners', 'affiliate-network', 'ledger', 'seo', 'settings', 'finance'],
  'CONTENT_MANAGER': ['dashboard', 'products', 'categories', 'deals', 'stores', 'banners', 'seo'],
  'AFFILIATE_MANAGER': ['dashboard', 'users', 'conversions', 'referrals', 'shared-commissions', 'click-logs', 'affiliate-network', 'ledger', 'finance'],
  'SUPPORT_ADMIN': ['dashboard', 'users', 'withdrawals', 'conversions'],
};

const ROLE_BADGE_COLORS = {
  'SUPER_ADMIN': { bg: '#fef3c7', text: '#92400e', border: '#f59e0b' },
  'ADMIN': { bg: '#dbeafe', text: '#1e40af', border: '#3b82f6' },
  'CONTENT_MANAGER': { bg: '#ede9fe', text: '#5b21b6', border: '#8b5cf6' },
  'AFFILIATE_MANAGER': { bg: '#d1fae5', text: '#065f46', border: '#10b981' },
  'SUPPORT_ADMIN': { bg: '#fee2e2', text: '#991b1b', border: '#ef4444' },
};

export default function AdminRoles({ users, setUsers, onEditUser, onAddNotification, currentUser }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
  // Edit states
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editStatus, setEditStatus] = useState('active');
  const [editPassword, setEditPassword] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const [editRole, setEditRole] = useState('USER');
  const [editPermissions, setEditPermissions] = useState({
    view: false, add: false, edit: false, delete: false, export: false, settings: false, manageAdmins: false,
  });
  const [editAllowedModules, setEditAllowedModules] = useState([]);

  // Create states
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminPhone, setNewAdminPhone] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [newAdminRole, setNewAdminRole] = useState('ADMIN');
  const [newAdminPermissions, setNewAdminPermissions] = useState({
    view: true, add: true, edit: true, delete: true, export: true, settings: true, manageAdmins: false,
  });
  const [newAdminAllowedModules, setNewAdminAllowedModules] = useState(ROLE_MODULE_DEFAULTS['ADMIN']);
  const [creating, setCreating] = useState(false);

  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';

  const isMasterAdmin = (email) => {
    if (!email) return false;
    const em = email.toLowerCase().trim();
    return em === 'admin@cyvanta.com' || em === 'admin@affiliateapp.com';
  };

  // Handlers for edit role modal
  const openEditModal = (user) => {
    setSelectedUser(user);
    setEditName(user.name || '');
    setEditEmail(user.email || '');
    setEditPhone(user.phone || '');
    setEditStatus(user.isBlocked === true || user.status === 'blocked' ? 'blocked' : 'active');
    setEditPassword('');
    setEditRole(user.role || 'USER');
    
    // Set permissions mapping
    setEditPermissions({
      view: !!user.permissions?.view,
      add: !!user.permissions?.add,
      edit: !!user.permissions?.edit,
      delete: !!user.permissions?.delete,
      export: !!user.permissions?.export,
      settings: !!user.permissions?.settings,
      manageAdmins: !!user.permissions?.manageAdmins,
    });

    const allowed = user.permissions?.allowedModules;
    if (allowed && allowed.length > 0) {
      setEditAllowedModules(allowed);
    } else {
      // Default to role mapping if not present
      setEditAllowedModules(ROLE_MODULE_DEFAULTS[user.role] || []);
    }

    setIsEditModalOpen(true);
  };

  const handleToggleBlockAdmin = async (user) => {
    const targetId = user.id || user._id;
    const isCurrentlyBlocked = user.isBlocked === true || user.status === 'blocked';
    const actionName = isCurrentlyBlocked ? 'unblock' : 'block';

    if (isMasterAdmin(user.email)) {
      onAddNotification('Master super admin account cannot be blocked.', 'error');
      return;
    }

    if (targetId === currentUser?.id) {
      onAddNotification('You cannot block your own admin account.', 'error');
      return;
    }

    if (!window.confirm(`Are you sure you want to ${actionName.toUpperCase()} admin "${user.name}"?`)) {
      return;
    }

    try {
      await apiAdminManagement.toggleBlockAdmin(targetId, isCurrentlyBlocked, currentUser?.id);
      const newStatus = isCurrentlyBlocked ? 'active' : 'blocked';
      const newIsBlocked = !isCurrentlyBlocked;

      setUsers((prev) => prev.map((u) => {
        const uid = u.id || u._id;
        if (uid === targetId) {
          return { ...u, status: newStatus, isBlocked: newIsBlocked };
        }
        return u;
      }));

      onAddNotification(`Admin "${user.name}" has been ${isCurrentlyBlocked ? 'unblocked' : 'blocked'} successfully.`, 'success');
    } catch (err) {
      console.error(err);
      onAddNotification(`Failed to ${actionName} admin: ` + (err.message || 'Unknown error'), 'error');
    }
  };

  const handleDeleteAdmin = async (user) => {
    const targetId = user.id || user._id;

    if (isMasterAdmin(user.email)) {
      onAddNotification('Master super admin account cannot be deleted.', 'error');
      return;
    }

    if (targetId === currentUser?.id) {
      onAddNotification('You cannot delete your own admin account.', 'error');
      return;
    }

    if (!window.confirm(`Are you sure you want to permanently DELETE admin "${user.name}" (${user.email || user.phone || 'ID: ' + targetId})? This action cannot be undone.`)) {
      return;
    }

    try {
      await apiAdminManagement.deleteAdmin(targetId, currentUser?.id);
      setUsers((prev) => prev.filter((u) => (u.id || u._id) !== targetId));
      onAddNotification(`Admin "${user.name}" has been permanently deleted.`, 'success');
    } catch (err) {
      console.error(err);
      onAddNotification('Failed to delete admin: ' + (err.message || 'Unknown error'), 'error');
    }
  };

  const handleRoleChange = (role, isEdit = true) => {
    if (isEdit) {
      setEditRole(role);
      setEditAllowedModules(ROLE_MODULE_DEFAULTS[role] || []);
    } else {
      setNewAdminRole(role);
      setNewAdminAllowedModules(ROLE_MODULE_DEFAULTS[role] || []);
    }
  };

  const toggleModule = (module, isEdit = true) => {
    if (isEdit) {
      setEditAllowedModules(prev => 
        prev.includes(module) ? prev.filter(m => m !== module) : [...prev, module]
      );
    } else {
      setNewAdminAllowedModules(prev => 
        prev.includes(module) ? prev.filter(m => m !== module) : [...prev, module]
      );
    }
  };

  const selectAllModules = (isEdit = true) => {
    if (isEdit) setEditAllowedModules(ALL_MODULES);
    else setNewAdminAllowedModules(ALL_MODULES);
  };

  const deselectAllModules = (isEdit = true) => {
    if (isEdit) setEditAllowedModules([]);
    else setNewAdminAllowedModules([]);
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    if (!selectedUser) return;

    setSavingEdit(true);
    const targetId = selectedUser.id || selectedUser._id;
    const fullPermissions = { ...editPermissions, allowedModules: editAllowedModules };

    try {
      const payload = {
        name: editName,
        email: editEmail,
        phone: editPhone,
        role: editRole,
        status: editStatus,
        isBlocked: editStatus === 'blocked',
        permissions: fullPermissions,
        adminId: currentUser?.id,
      };

      if (editPassword && editPassword.trim().length > 0) {
        payload.password = editPassword.trim();
      }

      const updated = await apiAdminManagement.updateAdmin(targetId, payload);

      setUsers((prev) => prev.map((u) => {
        const uid = u.id || u._id;
        if (uid === targetId) {
          return {
            ...u,
            name: updated.name || editName,
            email: updated.email || editEmail,
            phone: updated.phone || editPhone,
            role: updated.role || editRole,
            status: updated.status || editStatus,
            isBlocked: updated.isBlocked !== undefined ? updated.isBlocked : (editStatus === 'blocked'),
            permissions: updated.permissions || fullPermissions,
          };
        }
        return u;
      }));

      onAddNotification(`Admin details and access rights updated for "${editName}".`, 'success');
      setIsEditModalOpen(false);
    } catch (err) {
      console.error(err);
      onAddNotification('Failed to update admin: ' + (err.message || 'Unknown error'), 'error');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    if (!newAdminName || !newAdminPassword || (!newAdminEmail && !newAdminPhone)) {
      onAddNotification('Please fill in all required fields.', 'error');
      return;
    }

    setCreating(true);
    try {
      const result = await apiAdminManagement.createAdmin({
        name: newAdminName,
        email: newAdminEmail || undefined,
        phone: newAdminPhone || undefined,
        password: newAdminPassword,
        role: newAdminRole,
      }, currentUser.id);

      const fullPermissions = { ...newAdminPermissions, allowedModules: newAdminAllowedModules };
      
      // Update the newly created admin with the custom permissions
      const finalUser = await apiUsers.update(result.id, { role: newAdminRole, permissions: fullPermissions });

      setUsers((prev) => [...prev, {
        id: finalUser.id,
        name: finalUser.name,
        email: finalUser.email,
        role: finalUser.role,
        permissions: finalUser.permissions,
        status: 'active',
      }]);

      onAddNotification(`Admin "${result.name}" created with custom access rights!`, 'success');
      setIsCreateModalOpen(false);
      resetCreateForm();
    } catch (err) {
      console.error(err);
      onAddNotification('Failed to create admin: ' + (err.message || 'Unknown error'), 'error');
    } finally {
      setCreating(false);
    }
  };

  const resetCreateForm = () => {
    setNewAdminName('');
    setNewAdminEmail('');
    setNewAdminPhone('');
    setNewAdminPassword('');
    setNewAdminRole('ADMIN');
    setNewAdminAllowedModules(ROLE_MODULE_DEFAULTS['ADMIN']);
    setNewAdminPermissions({
      view: true, add: true, edit: true, delete: true, export: true, settings: true, manageAdmins: false,
    });
  };

  // Render Module Checkboxes
  const renderModuleSelection = (allowedModules, isEdit) => (
    <div style={{ marginTop: '16px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h4 style={{ margin: 0, fontSize: '14px', color: 'var(--text-bold)' }}>Allowed Pages & Modules</h4>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button type="button" onClick={() => selectAllModules(isEdit)} style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg)', cursor: 'pointer' }}>Select All</button>
          <button type="button" onClick={() => deselectAllModules(isEdit)} style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg)', cursor: 'pointer' }}>Clear All</button>
        </div>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        {ALL_MODULES.map(mod => (
          <label key={mod} className="admin-checkbox-card" style={{ padding: '8px 12px' }}>
            <input
              type="checkbox"
              checked={allowedModules.includes(mod)}
              onChange={() => toggleModule(mod, isEdit)}
            />
            <span style={{ fontSize: '13px' }}>{MODULE_LABELS[mod]}</span>
          </label>
        ))}
      </div>
    </div>
  );

  const adminUsers = users.filter((user) => user.role && user.role !== 'USER');

  const filteredUsers = adminUsers.filter((user) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (user.name || '').toLowerCase().includes(q) ||
      (user.email || '').toLowerCase().includes(q) ||
      (user.role || '').toLowerCase().includes(q);
  });

  const getRoleBadge = (role) => {
    const colors = ROLE_BADGE_COLORS[role] || { bg: '#f3f4f6', text: '#374151', border: '#d1d5db' };
    const roleInfo = ROLE_OPTIONS.find(r => r.value === role);
    const Icon = roleInfo?.icon || Shield;
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: '5px',
        padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600',
        backgroundColor: colors.bg, color: colors.text, border: `1px solid ${colors.border}`, whiteSpace: 'nowrap',
      }}>
        <Icon size={12} />
        {roleInfo?.label || role}
      </span>
    );
  };

  const headers = ['Admin', 'Email', 'Role', 'Status', 'Modules Access', 'Actions'];

  const renderRow = (user) => {
    const targetId = user.id || user._id;
    const isRoot = isMasterAdmin(user.email);
    const isSelf = targetId === currentUser?.id;
    const isBlocked = user.isBlocked === true || user.status === 'blocked';
    const moduleCount = user.permissions?.allowedModules?.length || 0;
    const totalModules = ALL_MODULES.length;

    return (
      <tr key={targetId} className="animate-fade">
        <td>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: '12px', fontWeight: '700',
            }}>
              {(user.name || 'A').substring(0, 2).toUpperCase()}
            </div>
            <div>
              <div style={{ fontWeight: '600' }}>{user.name}</div>
              {user.phone && <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{user.phone}</div>}
            </div>
          </div>
        </td>
        <td style={{ fontSize: '13px', color: 'var(--text)' }}>{user.email || '—'}</td>
        <td>{getRoleBadge(user.role)}</td>
        <td>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '5px',
            padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600',
            backgroundColor: isBlocked ? '#fee2e2' : '#dcfce7',
            color: isBlocked ? '#dc2626' : '#16a34a',
            border: `1px solid ${isBlocked ? '#fca5a5' : '#86efac'}`,
          }}>
            {isBlocked ? <ShieldAlert size={12} /> : <ShieldCheck size={12} />}
            {isBlocked ? 'Blocked' : 'Active'}
          </span>
        </td>
        <td>
          <span style={{
            fontSize: '12px',
            color: moduleCount === totalModules ? '#10b981' : 'var(--text)',
            fontWeight: '500',
          }}>
            {moduleCount === totalModules ? 'All Modules' : `${moduleCount} of ${totalModules}`}
          </span>
        </td>
        <td>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <button
              className="admin-btn-icon"
              onClick={() => openEditModal(user)}
              title="Edit Admin Details & Permissions"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <Edit2 size={14} />
            </button>

            {isSuperAdmin && !isRoot && !isSelf && (
              <>
                <button
                  className="admin-btn-icon"
                  onClick={() => handleToggleBlockAdmin(user)}
                  title={isBlocked ? "Unblock Admin" : "Block Admin"}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: isBlocked ? '#16a34a' : '#dc2626',
                    borderColor: isBlocked ? '#86efac' : '#fca5a5',
                    backgroundColor: isBlocked ? '#f0fdf4' : '#fef2f2'
                  }}
                >
                  {isBlocked ? <ShieldCheck size={14} /> : <ShieldAlert size={14} />}
                </button>

                <button
                  className="admin-btn-icon"
                  onClick={() => handleDeleteAdmin(user)}
                  title="Delete Admin Account"
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#dc2626',
                    borderColor: '#fca5a5',
                    backgroundColor: '#fef2f2'
                  }}
                >
                  <Trash2 size={14} />
                </button>
              </>
            )}
          </div>
        </td>
      </tr>
    );
  };

  return (
    <div className="admin-roles-tab animate-fade">
      <div className="admin-page-header">
        <div className="admin-page-title">
          <h2>Admin Roles & Permissions</h2>
          <p>Create admins, update credentials & granularly assign specific modules and access rights</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '14px', marginBottom: '24px' }}>
        {ROLE_OPTIONS.filter(r => r.value !== 'USER').map((role) => {
          const Icon = role.icon;
          const count = adminUsers.filter(u => u.role === role.value).length;
          return (
            <div key={role.value} style={{
              padding: '16px', borderRadius: '12px', border: `1px solid ${role.color}22`,
              backgroundColor: `${role.color}08`, display: 'flex', flexDirection: 'column', gap: '8px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '32px', height: '32px', borderRadius: '8px', backgroundColor: `${role.color}20`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon size={16} color={role.color} />
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-bold)' }}>{role.label}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text)' }}>{count} user{count !== 1 ? 's' : ''}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
        <div className="admin-search-input-wrapper">
          <Search size={16} className="admin-search-icon" />
          <input
            type="text"
            className="admin-search-input"
            placeholder="Search by name, email or role..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
          />
        </div>
        {isSuperAdmin && (
          <button
            className="admin-btn admin-btn-primary"
            onClick={() => setIsCreateModalOpen(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <UserPlus size={16} /> Add Custom Admin
          </button>
        )}
      </div>

      <AdminTable
        headers={headers}
        items={filteredUsers}
        currentPage={currentPage}
        itemsPerPage={6}
        onPageChange={setCurrentPage}
        renderRow={renderRow}
        emptyMessage="No admin accounts found."
      />

      {/* Edit Role & Account Modal */}
      {selectedUser && (
        <AdminModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title={`Edit Admin Details — ${selectedUser.name}`}
          footer={
            <>
              <button className="admin-btn admin-btn-secondary" onClick={() => setIsEditModalOpen(false)} disabled={savingEdit}>Cancel</button>
              <button className="admin-btn admin-btn-primary" onClick={handleSave} disabled={savingEdit}>
                {savingEdit ? 'Saving Changes...' : 'Save Changes'}
              </button>
            </>
          }
        >
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <AdminFormInput
                label="Full Name *"
                id="edit-admin-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Enter admin name"
              />
              <AdminFormInput
                label="Email"
                id="edit-admin-email"
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                placeholder="admin@example.com"
                disabled={isMasterAdmin(selectedUser.email)}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <AdminFormInput
                label="Phone"
                id="edit-admin-phone"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                placeholder="+91XXXXXXXXXX"
              />
              <AdminFormSelect
                label="Account Status"
                id="edit-admin-status"
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value)}
                disabled={isMasterAdmin(selectedUser.email) || (selectedUser.id || selectedUser._id) === currentUser?.id}
                options={[
                  { value: 'active', label: 'Active (Access Allowed)' },
                  { value: 'blocked', label: 'Blocked (Access Denied)' },
                ]}
              />
            </div>

            <AdminFormInput
              label="Reset Password (Optional)"
              id="edit-admin-password"
              type="password"
              value={editPassword}
              onChange={(e) => setEditPassword(e.target.value)}
              placeholder="Leave blank to keep existing password"
            />

            <AdminFormSelect
              label="Base Role Template"
              id="admin-role"
              value={editRole}
              onChange={(e) => handleRoleChange(e.target.value, true)}
              disabled={isMasterAdmin(selectedUser.email)}
              options={isSuperAdmin ? ROLE_OPTIONS : ROLE_OPTIONS.filter(r => r.value !== 'SUPER_ADMIN')}
            />

            <div>
              <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: 'var(--text-bold)' }}>Global Actions</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {PERMISSION_LABELS.map((perm) => (
                  <label key={perm.key} className="admin-checkbox-card" style={{ padding: '8px 12px' }}>
                    <input
                      type="checkbox"
                      checked={editPermissions[perm.key] || false}
                      onChange={(e) => setEditPermissions((prev) => ({ ...prev, [perm.key]: e.target.checked }))}
                    />
                    <span style={{ fontSize: '13px' }}>{perm.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {renderModuleSelection(editAllowedModules, true)}
          </form>
        </AdminModal>
      )}

      {/* Create Admin Modal */}
      <AdminModal
        isOpen={isCreateModalOpen}
        onClose={() => { setIsCreateModalOpen(false); resetCreateForm(); }}
        title="Create Custom Admin Account"
        footer={
          <>
            <button className="admin-btn admin-btn-secondary" onClick={() => { setIsCreateModalOpen(false); resetCreateForm(); }}>Cancel</button>
            <button className="admin-btn admin-btn-primary" onClick={handleCreateAdmin} disabled={creating}>
              {creating ? 'Creating...' : 'Create Admin'}
            </button>
          </>
        }
      >
          <form onSubmit={handleCreateAdmin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <AdminFormInput label="Full Name *" id="new-admin-name" value={newAdminName} onChange={(e) => setNewAdminName(e.target.value)} placeholder="Enter admin name" />
              <AdminFormInput label="Email" id="new-admin-email" type="email" value={newAdminEmail} onChange={(e) => setNewAdminEmail(e.target.value)} placeholder="admin@example.com" />
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <AdminFormInput label="Phone" id="new-admin-phone" value={newAdminPhone} onChange={(e) => setNewAdminPhone(e.target.value)} placeholder="+91XXXXXXXXXX" />
              <AdminFormInput label="Password *" id="new-admin-password" type="password" value={newAdminPassword} onChange={(e) => setNewAdminPassword(e.target.value)} placeholder="Set a strong password" />
            </div>

            <AdminFormSelect
              label="Base Role Template (Auto-fills permissions)"
              id="new-admin-role"
              value={newAdminRole}
              onChange={(e) => handleRoleChange(e.target.value, false)}
              options={ROLE_OPTIONS.filter(r => r.value !== 'USER')}
            />

            <div>
              <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: 'var(--text-bold)' }}>Global Actions</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {PERMISSION_LABELS.map((perm) => (
                  <label key={perm.key} className="admin-checkbox-card" style={{ padding: '8px 12px' }}>
                    <input
                      type="checkbox"
                      checked={newAdminPermissions[perm.key] || false}
                      onChange={(e) => setNewAdminPermissions((prev) => ({ ...prev, [perm.key]: e.target.checked }))}
                    />
                    <span style={{ fontSize: '13px' }}>{perm.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {renderModuleSelection(newAdminAllowedModules, false)}
          </form>
      </AdminModal>
    </div>
  );
}
