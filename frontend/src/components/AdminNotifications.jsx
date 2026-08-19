import React, { useState, useEffect } from 'react';
import { Bell, Send, Trash2, Users, Search, RefreshCw, Mail } from 'lucide-react';
import { apiNotifications } from '../services/api';
import { apiUsers } from '../services/api';
import { AdminTable, AdminFormInput, AdminFormSelect } from './AdminComponents';

export default function AdminNotifications({ onAddNotification, currentUser }) {
  const [notifications, setNotifications] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  // Form State
  const [targetType, setTargetType] = useState('ALL'); // 'ALL' or 'SPECIFIC'
  const [selectedUserId, setSelectedUserId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState('GLOBAL'); // GLOBAL, DEAL, PRODUCT, KYC, WITHDRAWAL
  const [sending, setSending] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      // Fetch users for the dropdown lookup and fetch global/recent notifications
      const [usersList, notifList] = await Promise.all([
        apiUsers.getAll().catch(() => []),
        // Since we want to display all notifications sent by admin, we can fetch for user 'admin' or list all. 
        // Our controller has a GET /user/{id} that returns user + global notifications.
        // Let's call getUserNotifications with 'admin' or just load a list from our new notifications table.
        // Note: getUserNotifications("all") or getUserNotifications("admin") gets global announcements.
        // To see ALL notifications, let's load for current user id or fetch global list.
        apiNotifications.getByUser(currentUser?.id || 'admin').catch(() => [])
      ]);
      setUsers(usersList || []);
      setNotifications(notifList || []);
    } catch (err) {
      console.error(err);
      onAddNotification('Failed to load notifications history.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      onAddNotification('Please fill in both Title and Message.', 'error');
      return;
    }

    if (targetType === 'SPECIFIC' && !selectedUserId) {
      onAddNotification('Please select a target user.', 'error');
      return;
    }

    try {
      setSending(true);
      const payload = {
        userId: targetType === 'ALL' ? '' : selectedUserId,
        title: title.trim(),
        message: message.trim(),
        type: type,
        read: false
      };

      await apiNotifications.create(payload);
      onAddNotification('Notification dispatched successfully!', 'success');
      
      // Reset form
      setTitle('');
      setMessage('');
      
      // Refresh list
      loadData();
    } catch (err) {
      console.error(err);
      onAddNotification('Failed to dispatch notification.', 'error');
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this notification record?')) return;
    try {
      await apiNotifications.delete(id);
      onAddNotification('Notification deleted successfully.', 'success');
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (err) {
      console.error(err);
      onAddNotification('Failed to delete notification.', 'error');
    }
  };

  const filteredUsers = users.filter(u => {
    const q = searchQuery.toLowerCase();
    return (u.name || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q) || (u.phone || '').includes(q);
  });

  const headers = ['Target', 'Title', 'Message', 'Category', 'Sent At', 'Actions'];

  const renderRow = (item) => {
    const matchedUser = users.find(u => u.id === item.userId);
    const targetText = item.userId ? (matchedUser ? `${matchedUser.name} (${matchedUser.email || matchedUser.phone})` : 'Specific User') : 'All Users (Global)';
    
    return (
      <tr key={item.id} className="animate-fade">
        <td style={{ fontWeight: '600', color: 'var(--text-bold)' }}>{targetText}</td>
        <td style={{ fontWeight: '500', color: 'var(--text-bold)' }}>{item.title}</td>
        <td style={{ fontSize: '13px', opacity: 0.85, maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.message}</td>
        <td>
          <span style={{
            fontSize: '11px',
            fontWeight: '600',
            backgroundColor: 'rgba(99, 102, 241, 0.1)',
            color: '#818cf8',
            padding: '2px 8px',
            borderRadius: '99px',
            textTransform: 'uppercase'
          }}>
            {item.type}
          </span>
        </td>
        <td style={{ fontSize: '12px', opacity: 0.7 }}>
          {item.createdAt ? new Date(item.createdAt).toLocaleString('en-IN') : '—'}
        </td>
        <td>
          <button className="admin-btn-icon delete" onClick={() => handleDelete(item.id)} title="Delete Record">
            <Trash2 size={14} />
          </button>
        </td>
      </tr>
    );
  };

  return (
    <div className="admin-notifications-tab animate-fade">
      <div className="admin-page-header">
        <div className="admin-page-title">
          <h2>Push Notifications Manager</h2>
          <p>Compose and dispatch custom alerts to individual users or broadcast to all platforms</p>
        </div>
        <button className="admin-btn admin-btn-secondary" onClick={loadData} disabled={loading}>
          <RefreshCw size={16} /> Refresh logs
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '24px', alignItems: 'start' }}>
        
        {/* Creator panel */}
        <div style={{
          backgroundColor: 'var(--card-bg)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '20px'
        }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-bold)' }}>
            <Send size={18} color="var(--primary)" /> Compose Notification
          </h3>

          <form onSubmit={handleSend} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            
            <div className="admin-form-group">
              <label style={{ fontSize: '13px', fontWeight: '600', display: 'block', marginBottom: '6px' }}>Target Audience</label>
              <div style={{ display: 'flex', gap: '12px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }}>
                  <input type="radio" checked={targetType === 'ALL'} onChange={() => setTargetType('ALL')} />
                  All Registered Users (Global Broadcast)
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }}>
                  <input type="radio" checked={targetType === 'SPECIFIC'} onChange={() => setTargetType('SPECIFIC')} />
                  Specific Target User
                </label>
              </div>
            </div>

            {targetType === 'SPECIFIC' && (
              <div style={{
                padding: '12px',
                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}>
                <div style={{ position: 'relative' }}>
                  <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
                  <input
                    type="text"
                    placeholder="Search user by name/email/phone..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '6px 12px 6px 30px',
                      borderRadius: '6px',
                      border: '1px solid var(--border)',
                      backgroundColor: 'rgba(0,0,0,0.15)',
                      color: 'inherit',
                      fontSize: '12px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '6px',
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--card-bg)',
                    color: 'inherit',
                    fontSize: '12px'
                  }}
                >
                  <option value="">-- Choose User ({filteredUsers.length} matches) --</option>
                  {filteredUsers.slice(0, 100).map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.email || u.phone})</option>
                  ))}
                </select>
              </div>
            )}

            <AdminFormInput
              label="Notification Title *"
              id="notif-title"
              type="text"
              placeholder="e.g. Special Weekend Deal Active!"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />

            <div className="admin-form-group">
              <label htmlFor="notif-message" style={{ fontSize: '13px', fontWeight: '600', display: 'block', marginBottom: '6px' }}>Message Body *</label>
              <textarea
                id="notif-message"
                placeholder="Write your alert message details here..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                style={{
                  width: '100%',
                  minHeight: '80px',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  backgroundColor: 'rgba(0, 0, 0, 0.1)',
                  color: 'inherit',
                  fontSize: '13px',
                  lineHeight: '1.4',
                  boxSizing: 'border-box',
                  resize: 'vertical'
                }}
              />
            </div>

            <AdminFormSelect
              label="Notification Type"
              id="notif-type"
              value={type}
              onChange={(e) => setType(e.target.value)}
              options={[
                { value: 'GLOBAL', label: 'Admin Announcement' },
                { value: 'DEAL', label: 'Best Deals / Price Drop' },
                { value: 'PRODUCT', label: 'New Product Release' },
                { value: 'KYC', label: 'Profile E-KYC Status' },
                { value: 'WITHDRAWAL', label: 'Withdrawal Request Update' }
              ]}
            />

            <button
              type="submit"
              disabled={sending || !title.trim() || !message.trim()}
              style={{
                width: '100%',
                padding: '10px 16px',
                borderRadius: '8px',
                border: 'none',
                background: 'linear-gradient(135deg, var(--primary), #4f46e5)',
                color: '#fff',
                fontWeight: 700,
                cursor: sending ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                marginTop: '10px'
              }}
            >
              <Send size={15} />
              {sending ? 'Sending...' : 'Dispatch Alert'}
            </button>
          </form>
        </div>

        {/* Logs table */}
        <AdminTable
          headers={headers}
          items={notifications}
          loading={loading}
          currentPage={currentPage}
          itemsPerPage={8}
          onPageChange={setCurrentPage}
          renderRow={renderRow}
          emptyMessage="No notifications logs present."
        />

      </div>
    </div>
  );
}
