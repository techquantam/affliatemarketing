import React, { useState, useEffect } from 'react';
import { Wallet, PlusCircle, MinusCircle, RefreshCw, AlertCircle, Lock, Search, ArrowDownRight, ArrowUpRight, ShieldCheck, CheckCircle2, X } from 'lucide-react';
import { apiWallet } from '../services/api';

export default function AdminWalletModal({ isOpen, onClose, user, currentUser, onAddNotification, onWalletUpdated }) {
  const [wallet, setWallet] = useState(null);
  const [ledger, setLedger] = useState([]);
  const [loading, setLoading] = useState(true);

  // Action Form State
  const [actionType, setActionType] = useState('CREDIT'); // CREDIT, DEBIT, ADJUSTMENT
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (isOpen && user?.id) {
      loadWalletData();
    }
  }, [isOpen, user?.id]);

  const loadWalletData = async () => {
    try {
      setLoading(true);
      setFormError('');
      const [walletRes, ledgerRes] = await Promise.all([
        apiWallet.getBalance(user.id),
        apiWallet.getFullLedger(user.id)
      ]);
      setWallet(walletRes || { approvedBalance: 0, pendingBalance: 0, withdrawnAmount: 0 });
      setLedger(ledgerRes || []);
    } catch (err) {
      console.error('Failed to load wallet data:', err);
      if (onAddNotification) onAddNotification('Failed to load user wallet details.', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !user) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    const parsedAmount = parseFloat(amount);
    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
      setFormError('Please enter a valid amount greater than ₹0.');
      return;
    }

    if (!reason.trim()) {
      setFormError('Reason is mandatory for every wallet adjustment.');
      return;
    }

    if (actionType === 'DEBIT' && wallet && (wallet.approvedBalance || 0) < parsedAmount) {
      setFormError(`Insufficient balance for debit. Available approved balance is ₹${(wallet.approvedBalance || 0).toFixed(2)}.`);
      return;
    }

    try {
      setSubmitting(true);
      const adminName = currentUser?.name || currentUser?.email || 'Admin';
      const adminId = currentUser?.id || 'admin-001';

      await apiWallet.adminAdjustWallet({
        userId: user.id,
        actionType: actionType,
        amount: parsedAmount,
        reason: reason.trim(),
        adminId: adminId,
        adminName: adminName
      });

      if (onAddNotification) {
        onAddNotification(`Wallet ${actionType.toLowerCase()} of ₹${parsedAmount.toFixed(2)} recorded successfully!`, 'success');
      }

      setAmount('');
      setReason('');
      setFormError('');
      
      // Refresh wallet & ledger
      await loadWalletData();

      if (onWalletUpdated) {
        onWalletUpdated();
      }
    } catch (err) {
      console.error('Failed to process wallet adjustment:', err);
      setFormError(err.message || 'Failed to execute wallet transaction.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredLedger = ledger.filter(item => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const txnId = (item.transactionId || item.id || '').toLowerCase();
    const desc = (item.description || item.reason || '').toLowerCase();
    const admin = (item.updatedBy || item.adminName || '').toLowerCase();
    return txnId.includes(q) || desc.includes(q) || admin.includes(q);
  });

  return (
    <div className="admin-modal-overlay" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1100,
      padding: '20px'
    }}>
      <div className="admin-modal-content" style={{
        backgroundColor: 'var(--card-bg, #1e293b)',
        color: 'var(--text-color, #f8fafc)',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '900px',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(168, 85, 247, 0.1))'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #6366f1, #a855f7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff'
            }}>
              <Wallet size={22} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700 }}>Wallet & Ledger Management</h2>
              <p style={{ margin: 0, fontSize: '13px', opacity: 0.7 }}>
                Managing wallet for <strong>{user.name}</strong> ({user.email || user.phone || 'ID: ' + user.id})
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'inherit',
              cursor: 'pointer'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Read-Only Balance Cards */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted, #94a3b8)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Wallet Balances
              </span>
              <span style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', color: '#f59e0b', background: 'rgba(245, 158, 11, 0.1)', padding: '2px 8px', borderRadius: '12px' }}>
                <Lock size={12} /> Direct Editing Disabled (Audit Enforced)
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              
              <div style={{
                background: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '12px',
                padding: '16px'
              }}>
                <div style={{ fontSize: '12px', color: '#10b981', fontWeight: 600, marginBottom: '4px' }}>Approved Balance</div>
                <div style={{ fontSize: '24px', fontWeight: 800, color: '#10b981' }}>
                  ₹{(wallet?.approvedBalance || 0).toFixed(2)}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted, #94a3b8)', marginTop: '4px' }}>Available for payout/withdrawal</div>
              </div>

              <div style={{
                background: 'rgba(245, 158, 11, 0.08)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                borderRadius: '12px',
                padding: '16px'
              }}>
                <div style={{ fontSize: '12px', color: '#f59e0b', fontWeight: 600, marginBottom: '4px' }}>Pending Balance</div>
                <div style={{ fontSize: '24px', fontWeight: 800, color: '#f59e0b' }}>
                  ₹{(wallet?.pendingBalance || 0).toFixed(2)}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted, #94a3b8)', marginTop: '4px' }}>Awaiting merchant verification</div>
              </div>

              <div style={{
                background: 'rgba(59, 130, 246, 0.08)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                borderRadius: '12px',
                padding: '16px'
              }}>
                <div style={{ fontSize: '12px', color: '#3b82f6', fontWeight: 600, marginBottom: '4px' }}>Total Withdrawn</div>
                <div style={{ fontSize: '24px', fontWeight: 800, color: '#3b82f6' }}>
                  ₹{(wallet?.withdrawnAmount || 0).toFixed(2)}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted, #94a3b8)', marginTop: '4px' }}>Successfully paid out</div>
              </div>

            </div>
          </div>

          {/* Action Form */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '14px',
            padding: '20px'
          }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={18} color="#6366f1" /> Admin Wallet Operation
            </h3>

            {formError && (
              <div style={{
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                color: '#f87171',
                padding: '10px 14px',
                borderRadius: '8px',
                marginBottom: '16px',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <AlertCircle size={16} />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* Action Selection Tabs */}
              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '8px' }}>
                  Select Operation Type
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setActionType('CREDIT')}
                    style={{
                      padding: '10px',
                      borderRadius: '8px',
                      border: actionType === 'CREDIT' ? '2px solid #10b981' : '1px solid rgba(255, 255, 255, 0.1)',
                      background: actionType === 'CREDIT' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                      color: actionType === 'CREDIT' ? '#10b981' : 'inherit',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    <PlusCircle size={16} /> Credit (+ Add)
                  </button>

                  <button
                    type="button"
                    onClick={() => setActionType('DEBIT')}
                    style={{
                      padding: '10px',
                      borderRadius: '8px',
                      border: actionType === 'DEBIT' ? '2px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.1)',
                      background: actionType === 'DEBIT' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                      color: actionType === 'DEBIT' ? '#ef4444' : 'inherit',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    <MinusCircle size={16} /> Debit (- Deduct)
                  </button>

                  <button
                    type="button"
                    onClick={() => setActionType('ADJUSTMENT')}
                    style={{
                      padding: '10px',
                      borderRadius: '8px',
                      border: actionType === 'ADJUSTMENT' ? '2px solid #a855f7' : '1px solid rgba(255, 255, 255, 0.1)',
                      background: actionType === 'ADJUSTMENT' ? 'rgba(168, 85, 247, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                      color: actionType === 'ADJUSTMENT' ? '#c084fc' : 'inherit',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    <RefreshCw size={16} /> Adjustment
                  </button>
                </div>
              </div>

              {/* Amount Input */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                    Amount (₹) <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="e.g. 100.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      backgroundColor: 'rgba(0, 0, 0, 0.2)',
                      color: '#fff',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                    Reason (Mandatory) <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    placeholder={actionType === 'CREDIT' ? 'e.g. Manual Cashback Adjustment' : actionType === 'DEBIT' ? 'e.g. Duplicate Cashback Reversal' : 'e.g. System reconciliation'}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      backgroundColor: 'rgba(0, 0, 0, 0.2)',
                      color: '#fff',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              {/* Action Submit Button */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button
                  type="submit"
                  disabled={submitting || !amount || !reason.trim()}
                  style={{
                    padding: '10px 24px',
                    borderRadius: '8px',
                    border: 'none',
                    background: actionType === 'CREDIT' 
                      ? 'linear-gradient(135deg, #10b981, #059669)'
                      : actionType === 'DEBIT'
                      ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                      : 'linear-gradient(135deg, #a855f7, #7e22ce)',
                    color: '#fff',
                    fontWeight: 700,
                    cursor: submitting || !amount || !reason.trim() ? 'not-allowed' : 'pointer',
                    opacity: submitting || !amount || !reason.trim() ? 0.6 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  {submitting ? 'Processing...' : `Execute ${actionType.charAt(0) + actionType.slice(1).toLowerCase()}`}
                </button>
              </div>

            </form>
          </div>

          {/* Ledger Table Section */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Lock size={16} color="#10b981" /> Permanent Wallet Ledger
                </h3>
                <span style={{ fontSize: '12px', color: 'var(--text-muted, #94a3b8)' }}>
                  All transaction records are immutable and permanently audited.
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  position: 'relative',
                  width: '200px'
                }}>
                  <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
                  <input
                    type="text"
                    placeholder="Search ledger..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '6px 12px 6px 30px',
                      borderRadius: '6px',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      backgroundColor: 'rgba(0, 0, 0, 0.2)',
                      color: '#fff',
                      fontSize: '13px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>
            </div>

            {loading ? (
              <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted, #94a3b8)' }}>
                Loading ledger records...
              </div>
            ) : filteredLedger.length === 0 ? (
              <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted, #94a3b8)', border: '1px dashed rgba(255, 255, 255, 0.1)', borderRadius: '8px' }}>
                No wallet ledger transactions recorded for this user yet.
              </div>
            ) : (
              <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                      <th style={{ padding: '10px 12px' }}>Txn ID</th>
                      <th style={{ padding: '10px 12px' }}>Date & Time</th>
                      <th style={{ padding: '10px 12px' }}>Type</th>
                      <th style={{ padding: '10px 12px' }}>Amount</th>
                      <th style={{ padding: '10px 12px' }}>Prev. Balance</th>
                      <th style={{ padding: '10px 12px' }}>New Balance</th>
                      <th style={{ padding: '10px 12px' }}>Reason</th>
                      <th style={{ padding: '10px 12px' }}>Updated By</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLedger.map((item, idx) => {
                      const isCredit = (item.type || '').toUpperCase() === 'CREDIT';
                      const formattedDate = item.date 
                        ? new Date(item.date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })
                        : '-';
                      
                      return (
                        <tr 
                          key={item.id || idx}
                          style={{
                            borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                            backgroundColor: idx % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.015)'
                          }}
                        >
                          <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontSize: '12px', color: '#a855f7' }}>
                            {item.transactionId || item.id || '-'}
                          </td>
                          <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>{formattedDate}</td>
                          <td style={{ padding: '10px 12px' }}>
                            <span style={{
                              color: isCredit ? '#10b981' : '#ef4444',
                              fontWeight: 700,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}>
                              {isCredit ? <ArrowDownRight size={14} /> : <ArrowUpRight size={14} />}
                              {item.category === 'ADMIN_ADJUSTMENT' ? 'ADJUSTMENT' : item.type}
                            </span>
                          </td>
                          <td style={{ padding: '10px 12px', fontWeight: 700, color: isCredit ? '#10b981' : '#ef4444' }}>
                            {isCredit ? '+' : '-'}₹{(item.amount || 0).toFixed(2)}
                          </td>
                          <td style={{ padding: '10px 12px', color: 'var(--text-muted, #94a3b8)' }}>
                            {item.previousBalance !== undefined && item.previousBalance !== null ? `₹${item.previousBalance.toFixed(2)}` : '-'}
                          </td>
                          <td style={{ padding: '10px 12px', fontWeight: 600 }}>
                            {item.newBalance !== undefined && item.newBalance !== null ? `₹${item.newBalance.toFixed(2)}` : '-'}
                          </td>
                          <td style={{ padding: '10px 12px', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={item.reason || item.description}>
                            {item.reason || item.description || '-'}
                          </td>
                          <td style={{ padding: '10px 12px', color: '#c084fc', fontWeight: 600 }}>
                            {item.updatedBy || item.adminName || 'System'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
