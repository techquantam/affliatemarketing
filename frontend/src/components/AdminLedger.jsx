import React, { useState, useEffect } from 'react';
import { Wallet, Search, Filter, User, ArrowLeft, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { AdminTable, ExportDataButton } from './AdminComponents';
import { apiFinance } from '../services/api';

export default function AdminLedger({ users }) {
  const [ledgerData, setLedgerData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [selectedUser, setSelectedUser] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchLedger();
  }, []);

  const fetchLedger = async () => {
    try {
      setLoading(true);
      const data = await apiFinance.getLedger();
      setLedgerData(data || []);
    } catch (err) {
      console.error('Failed to fetch ledger:', err);
    } finally {
      setLoading(false);
    }
  };

  // Map users for quick lookup
  const userMap = {};
  users?.forEach(u => {
    userMap[u.id] = u.name;
  });

  const getUserName = (userId) => {
    if (!userId) return 'System / Unknown';
    return userMap[userId] || `User (${userId.substring(0, 8)}...)`;
  };

  // Apply filters
  let filteredData = ledgerData.filter(item => {
    if (selectedUser && item.userId !== selectedUser.id) return false;
    if (filterType !== 'ALL' && item.type !== filterType) return false;
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const userName = getUserName(item.userId).toLowerCase();
      const desc = (item.description || '').toLowerCase();
      const category = (item.category || '').toLowerCase();
      return userName.includes(query) || desc.includes(query) || category.includes(query);
    }
    return true;
  });

  const headers = ['Date', 'Txn ID', 'User', 'Type', 'Amount', 'Prev. Bal', 'New Bal', 'Reason / Description', 'Updated By', 'Status', 'Actions'];

  const renderRow = (item) => (
    <tr key={item.id} className="animate-fade">
      <td>{new Date(item.date).toLocaleDateString()} {new Date(item.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
      <td style={{ fontFamily: 'monospace', fontSize: '11px', color: '#a855f7' }}>
        {item.transactionId || item.id || '-'}
      </td>
      <td>
        <button 
          className="admin-link-btn" 
          onClick={() => { setSelectedUser({ id: item.userId, name: getUserName(item.userId) }); setCurrentPage(1); }}
          style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}
        >
          <User size={14} /> {getUserName(item.userId)}
        </button>
      </td>
      <td>
        <span style={{ 
          color: item.type === 'CREDIT' ? '#10b981' : '#ef4444', 
          fontWeight: 'bold',
          display: 'flex', alignItems: 'center', gap: '4px'
        }}>
          {item.type === 'CREDIT' ? <ArrowDownRight size={14} /> : <ArrowUpRight size={14} />}
          {item.category === 'ADMIN_ADJUSTMENT' ? 'ADJUSTMENT' : item.type}
        </span>
      </td>
      <td style={{ fontWeight: 'bold', color: item.type === 'CREDIT' ? '#10b981' : '#ef4444' }}>
        ₹{item.amount?.toFixed(2) || '0.00'}
      </td>
      <td style={{ color: 'var(--text-muted)' }}>
        {item.previousBalance !== undefined && item.previousBalance !== null ? `₹${item.previousBalance.toFixed(2)}` : '-'}
      </td>
      <td style={{ fontWeight: '600' }}>
        {item.newBalance !== undefined && item.newBalance !== null ? `₹${item.newBalance.toFixed(2)}` : '-'}
      </td>
      <td style={{ maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={item.reason || item.description}>
        {item.reason || item.description || '-'}
      </td>
      <td style={{ color: '#a855f7', fontWeight: '600' }}>
        {item.updatedBy || item.adminName || 'System'}
      </td>
      <td>
        <span className={`status-badge ${item.status?.toLowerCase() || 'completed'}`}>{item.status || 'Completed'}</span>
      </td>
      <td>
        <button 
          className="admin-btn-icon view"
          onClick={() => alert(`Transaction Details:\n\nTxn ID: ${item.transactionId || item.id}\nUser: ${getUserName(item.userId)}\nCategory: ${item.category}\nAmount: ₹${item.amount}\nPrevious Balance: ${item.previousBalance != null ? '₹' + item.previousBalance : 'N/A'}\nNew Balance: ${item.newBalance != null ? '₹' + item.newBalance : 'N/A'}\nReason: ${item.reason || item.description}\nUpdated By: ${item.updatedBy || item.adminName || 'System'}\nStatus: ${item.status}`)}
          title="View Details"
        >
          <Search size={14} />
        </button>
      </td>
    </tr>
  );

  const exportColumns = [
    { header: 'Date', dataKey: 'formattedDate' },
    { header: 'User', dataKey: 'userName' },
    { header: 'Type', dataKey: 'type' },
    { header: 'Category', dataKey: 'category' },
    { header: 'Description', dataKey: 'description' },
    { header: 'Amount (INR)', dataKey: 'amount' },
    { header: 'Status', dataKey: 'status' }
  ];

  const exportData = filteredData.map(item => ({
    ...item,
    formattedDate: new Date(item.date).toLocaleString(),
    userName: getUserName(item.userId)
  }));

  // Calculate stats for current view
  const totalCredits = filteredData
    .filter(i => i.type === 'CREDIT' && i.status?.toLowerCase() !== 'rejected')
    .reduce((sum, i) => sum + (i.amount || 0), 0);
  const totalDebits = filteredData
    .filter(i => i.type === 'DEBIT' && i.status?.toLowerCase() !== 'rejected')
    .reduce((sum, i) => sum + (i.amount || 0), 0);

  return (
    <div className="admin-ledger-tab animate-fade">
      <div className="admin-page-header">
        <div className="admin-page-title">
          <h2>{selectedUser ? `${selectedUser.name}'s Ledger` : 'Master Financial Ledger'}</h2>
          <p>
            {selectedUser 
              ? `Viewing complete transaction history for ${selectedUser.name}.`
              : 'Complete history of all money approvals, payments, and liabilities across the platform.'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <ExportDataButton data={exportData} columns={exportColumns} filename={selectedUser ? `Ledger_${selectedUser.name.replace(/\s+/g, '_')}` : 'Master_Ledger'} />
          {selectedUser && (
            <button className="admin-btn admin-btn-secondary" onClick={() => { setSelectedUser(null); setCurrentPage(1); }}>
              <ArrowLeft size={16} /> Back to Master
            </button>
          )}
        </div>
      </div>

      <div className="admin-kpi-grid" style={{ marginBottom: '24px' }}>
        <div className="admin-kpi-card">
          <div className="admin-kpi-info">
            <h3>Total Credits (Approved)</h3>
            <div className="admin-kpi-value" style={{ color: '#10b981' }}>₹{totalCredits.toFixed(2)}</div>
            <span style={{ fontSize: '12px', color: 'var(--text)' }}>Earnings added to wallets</span>
          </div>
        </div>
        <div className="admin-kpi-card">
          <div className="admin-kpi-info">
            <h3>Total Debits (Payouts/Adjustments)</h3>
            <div className="admin-kpi-value" style={{ color: '#ef4444' }}>₹{totalDebits.toFixed(2)}</div>
            <span style={{ fontSize: '12px', color: 'var(--text)' }}>Funds withdrawn or removed</span>
          </div>
        </div>
        <div className="admin-kpi-card">
          <div className="admin-kpi-info">
            <h3>Net Balance (Current View)</h3>
            <div className="admin-kpi-value" style={{ color: totalCredits - totalDebits >= 0 ? '#10b981' : '#ef4444' }}>
              ₹{(totalCredits - totalDebits).toFixed(2)}
            </div>
            <span style={{ fontSize: '12px', color: 'var(--text)' }}>Credits minus Debits</span>
          </div>
        </div>
      </div>

      <div className="admin-table-card">
        <div className="admin-table-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <h3 className="admin-table-title" style={{ margin: 0 }}>Transaction Records</h3>
          <div style={{ display: 'flex', gap: '12px' }}>
            <div className="admin-search-input-wrapper" style={{ width: '250px' }}>
              <Search size={16} className="admin-search-icon" />
              <input 
                type="text" 
                placeholder="Search user, category..." 
                className="admin-search-input"
                style={{ width: '100%', paddingLeft: '38px' }}
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Filter size={14} color="var(--text)" />
              <select 
                value={filterType} 
                onChange={(e) => { setFilterType(e.target.value); setCurrentPage(1); }}
                className="admin-filter-select"
              >
                <option value="ALL">All Types</option>
                <option value="CREDIT">Credits Only</option>
                <option value="DEBIT">Debits Only</option>
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text)' }}>Loading ledger data...</div>
        ) : (
          <AdminTable
            headers={headers}
            items={filteredData}
            currentPage={currentPage}
            itemsPerPage={15}
            onPageChange={setCurrentPage}
            renderRow={renderRow}
            emptyMessage="No ledger transactions found matching the criteria."
          />
        )}
      </div>
    </div>
  );
}
