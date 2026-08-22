import React, { useState, useEffect, useMemo } from 'react';
import { BookOpen, ArrowUpCircle, ArrowDownCircle, Clock, CheckCircle, XCircle, Filter, Search, Download, FileText, RefreshCw } from 'lucide-react';
import { apiWallet } from '../services/api';
import { exportToCSV, exportToPDF } from '../utils/exportUtils';

const STATUS_CONFIG = {
  PENDING: { label: 'Pending', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  APPROVED: { label: 'Approved', color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
  COMPLETED: { label: 'Paid', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
  PAID: { label: 'Paid', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
  REJECTED: { label: 'Rejected', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
};

const CATEGORY_OPTIONS = [
  { value: '', label: 'All Types' },
  { value: 'COMMISSION', label: 'Commission' },
  { value: 'SHARED_COMMISSION', label: 'Shared Commission' },
  { value: 'WITHDRAWAL', label: 'Withdrawal' },
  { value: 'ADJUSTMENT', label: 'Adjustment' },
  { value: 'REFUND', label: 'Refund' },
  { value: 'OTHER', label: 'Other' },
];

export default function UserLedger({ currentUser, onAddNotification }) {
  const [entries, setEntries] = useState([]);
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const fetchLedger = async () => {
    if (!currentUser?.id) return;
    try {
      setLoading(true);
      const [ledger, walletData] = await Promise.all([
        apiWallet.getFullLedger(currentUser.id),
        apiWallet.getBalance(currentUser.id),
      ]);
      setEntries(ledger || []);
      setWallet(walletData || null);
    } catch (err) {
      console.error('Failed to load ledger:', err);
      onAddNotification?.('Failed to load your ledger. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLedger();
  }, [currentUser?.id]);

  // Computed summaries
  const summaries = useMemo(() => {
    let totalCredits = 0, totalDebits = 0, pendingAmount = 0, approvedAmount = 0;
    entries.forEach(e => {
      const amt = e.amount || 0;
      if (e.status === 'REJECTED' || e.status === 'rejected') {
        return; // Ignore rejected transactions from all summaries
      }
      if (e.type === 'CREDIT') {
        totalCredits += amt;
        if (e.status === 'PENDING' || e.status === 'pending') pendingAmount += amt;
        if (e.status === 'APPROVED' || e.status === 'approved' || e.status === 'COMPLETED' || e.status === 'completed' || e.status === 'PAID' || e.status === 'paid') approvedAmount += amt;
      } else {
        totalDebits += amt;
      }
    });
    return { totalCredits, totalDebits, pendingAmount, approvedAmount, netBalance: totalCredits - totalDebits };
  }, [entries]);

  // Filtered entries
  const filteredEntries = useMemo(() => {
    return entries.filter(entry => {
      if (categoryFilter && entry.category !== categoryFilter) return false;
      if (statusFilter && entry.status !== statusFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matches = (entry.description || '').toLowerCase().includes(q) ||
          (entry.transactionId || '').toLowerCase().includes(q) ||
          (entry.category || '').toLowerCase().includes(q);
        if (!matches) return false;
      }
      if (dateFrom) {
        const entryDate = entry.date ? entry.date.substring(0, 10) : '';
        if (entryDate < dateFrom) return false;
      }
      if (dateTo) {
        const entryDate = entry.date ? entry.date.substring(0, 10) : '';
        if (entryDate > dateTo) return false;
      }
      return true;
    });
  }, [entries, categoryFilter, statusFilter, searchQuery, dateFrom, dateTo]);

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return dateStr.substring(0, 10);
    }
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const exportColumns = [
    { header: 'Date', dataKey: 'formattedDate' },
    { header: 'Transaction ID', dataKey: 'transactionId' },
    { header: 'Description', dataKey: 'description' },
    { header: 'Type', dataKey: 'type' },
    { header: 'Category', dataKey: 'category' },
    { header: 'Amount (₹)', dataKey: 'amount' },
    { header: 'Status', dataKey: 'status' },
  ];

  const exportData = filteredEntries.map(e => ({
    ...e,
    formattedDate: formatDate(e.date),
    amount: (e.amount || 0).toFixed(2),
  }));

  const handleExportCSV = () => exportToCSV(exportData, exportColumns, `My_Ledger_${new Date().toISOString().split('T')[0]}`);
  const handleExportPDF = () => exportToPDF(exportData, exportColumns, `My_Ledger_${new Date().toISOString().split('T')[0]}`, `${currentUser?.name || 'User'}'s Financial Ledger`);

  // Stat Card component
  const StatCard = ({ icon, label, value, color, borderColor }) => (
    <div style={{
      padding: '20px',
      borderRadius: '14px',
      background: 'var(--card-bg)',
      border: `1px solid var(--border)`,
      borderLeft: `4px solid ${borderColor || 'var(--primary)'}`,
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      boxShadow: 'var(--shadow)',
      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {icon}
        <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</span>
      </div>
      <span style={{ fontSize: '24px', fontWeight: 800, color: color || 'var(--text-bold)', fontFamily: 'var(--heading)' }}>{value}</span>
    </div>
  );

  return (
    <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
            <BookOpen size={24} style={{ color: 'var(--primary)' }} /> My Ledger
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--text)', marginTop: '4px' }}>
            Complete financial history — earnings, withdrawals, and adjustments.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button onClick={fetchLedger} disabled={loading} style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 600,
            backgroundColor: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-bold)', cursor: 'pointer',
            transition: 'all 0.2s'
          }}>
            <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh
          </button>
          <button onClick={handleExportCSV} style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 600,
            backgroundColor: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-bold)', cursor: 'pointer',
          }}>
            <Download size={14} /> CSV
          </button>
          <button onClick={handleExportPDF} style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 600,
            background: 'var(--gradient-primary)', border: 'none', color: '#fff', cursor: 'pointer',
            boxShadow: '0 4px 10px rgba(255,79,47,0.2)',
          }}>
            <FileText size={14} /> PDF
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <StatCard
          icon={<ArrowUpCircle size={18} style={{ color: '#10b981' }} />}
          label="Total Credits"
          value={`₹${summaries.totalCredits.toFixed(2)}`}
          color="#10b981"
          borderColor="#10b981"
        />
        <StatCard
          icon={<ArrowDownCircle size={18} style={{ color: '#ef4444' }} />}
          label="Total Debits"
          value={`₹${summaries.totalDebits.toFixed(2)}`}
          color="#ef4444"
          borderColor="#ef4444"
        />
        <StatCard
          icon={<Clock size={18} style={{ color: '#f59e0b' }} />}
          label="Pending"
          value={`₹${summaries.pendingAmount.toFixed(2)}`}
          color="#f59e0b"
          borderColor="#f59e0b"
        />
        <StatCard
          icon={<CheckCircle size={18} style={{ color: '#3b82f6' }} />}
          label="Wallet Balance"
          value={`₹${(wallet?.approvedBalance || 0).toFixed(2)}`}
          color="#3b82f6"
          borderColor="#3b82f6"
        />
      </div>

      {/* Filters */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center',
        padding: '16px 20px', borderRadius: '12px', background: 'var(--card-bg)', border: '1px solid var(--border)',
      }}>
        <Filter size={16} style={{ color: 'var(--text)' }} />

        <div style={{ position: 'relative', flex: '1 1 200px' }}>
          <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text)', opacity: 0.6 }} />
          <input
            type="text" placeholder="Search by description or ID..."
            value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            style={{
              width: '100%', padding: '8px 12px 8px 32px', borderRadius: '8px', fontSize: '13px',
              border: '1px solid var(--border)', backgroundColor: 'var(--bg)', color: 'var(--text-bold)',
            }}
          />
        </div>

        <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} style={{
          padding: '8px 12px', borderRadius: '8px', fontSize: '13px',
          border: '1px solid var(--border)', backgroundColor: 'var(--bg)', color: 'var(--text-bold)', cursor: 'pointer',
        }}>
          {CATEGORY_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>

        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{
          padding: '8px 12px', borderRadius: '8px', fontSize: '13px',
          border: '1px solid var(--border)', backgroundColor: 'var(--bg)', color: 'var(--text-bold)', cursor: 'pointer',
        }}>
          <option value="">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="COMPLETED">Paid</option>
          <option value="REJECTED">Rejected</option>
        </select>

        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} title="From date" style={{
          padding: '8px 12px', borderRadius: '8px', fontSize: '13px',
          border: '1px solid var(--border)', backgroundColor: 'var(--bg)', color: 'var(--text-bold)',
        }} />
        <span style={{ color: 'var(--text)', fontSize: '13px' }}>to</span>
        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} title="To date" style={{
          padding: '8px 12px', borderRadius: '8px', fontSize: '13px',
          border: '1px solid var(--border)', backgroundColor: 'var(--bg)', color: 'var(--text-bold)',
        }} />
      </div>

      {/* Transaction Table */}
      <div style={{ borderRadius: '12px', background: 'var(--card-bg)', border: '1px solid var(--border)', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text-bold)' }}>
            Transaction History
          </span>
          <span style={{ fontSize: '12px', color: 'var(--text)' }}>
            {filteredEntries.length} of {entries.length} records
          </span>
        </div>

        {loading ? (
          <div style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--text)' }}>
            <RefreshCw size={28} className="spin" style={{ color: 'var(--primary)', marginBottom: '12px' }} />
            <p>Loading your ledger...</p>
          </div>
        ) : filteredEntries.length === 0 ? (
          <div style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--text)' }}>
            <BookOpen size={40} style={{ color: 'var(--border)', marginBottom: '12px' }} />
            <p style={{ fontWeight: 600, color: 'var(--text-bold)', fontSize: '15px' }}>No transactions found</p>
            <p style={{ fontSize: '13px' }}>
              {entries.length > 0 ? 'Try adjusting your filters.' : 'Your financial activity will appear here.'}
            </p>
          </div>
        ) : (
          <div className="table-responsive" style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '750px' }}>
              <thead>
                <tr>
                  {['Date', 'Transaction ID', 'Description', 'Type', 'Amount', 'Status'].map(h => (
                    <th key={h} style={{
                      padding: '12px 16px', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase',
                      color: 'var(--text)', borderBottom: '1px solid var(--border)', textAlign: 'left',
                      letterSpacing: '0.4px', backgroundColor: 'rgba(var(--primary-rgb), 0.02)',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredEntries.map((entry, idx) => {
                  const isCredit = entry.type === 'CREDIT';
                  const statusConf = STATUS_CONFIG[entry.status] || STATUS_CONFIG.PENDING;
                  return (
                    <tr key={entry.id || idx} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.15s' }}
                      onMouseOver={e => e.currentTarget.style.backgroundColor = 'rgba(var(--primary-rgb), 0.015)'}
                      onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <td style={{ padding: '14px 16px', fontSize: '13px' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-bold)' }}>{formatDate(entry.date)}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text)', marginTop: '2px' }}>{formatTime(entry.date)}</div>
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: '12px', color: 'var(--text)', fontFamily: 'monospace' }}>
                        {(entry.transactionId || '').substring(0, 12)}...
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: '13px', color: 'var(--text-bold)', maxWidth: '280px' }}>
                        <div style={{ fontWeight: 500 }}>{entry.description || '—'}</div>
                        <div style={{ fontSize: '10px', color: 'var(--text)', marginTop: '3px', textTransform: 'capitalize' }}>
                          {(entry.category || '').replace(/_/g, ' ').toLowerCase()}
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: '4px',
                          padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700,
                          backgroundColor: isCredit ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                          color: isCredit ? '#10b981' : '#ef4444',
                        }}>
                          {isCredit ? <ArrowUpCircle size={12} /> : <ArrowDownCircle size={12} />}
                          {isCredit ? 'Credit' : 'Debit'}
                        </span>
                      </td>
                      <td style={{
                        padding: '14px 16px', fontWeight: 700, fontSize: '14px',
                        color: isCredit ? '#10b981' : '#ef4444',
                      }}>
                        {isCredit ? '+' : '-'}₹{(entry.amount || 0).toFixed(2)}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: '4px',
                          padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600,
                          backgroundColor: statusConf.bg, color: statusConf.color,
                        }}>
                          {entry.status === 'APPROVED' || entry.status === 'COMPLETED' || entry.status === 'PAID'
                            ? <CheckCircle size={11} /> : entry.status === 'REJECTED'
                            ? <XCircle size={11} /> : <Clock size={11} />}
                          {statusConf.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Spin animation for loading icon */}
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  );
}
