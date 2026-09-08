import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { toast } from 'react-toastify';
import { Wallet, AlertCircle, CheckCircle2, ArrowRight, ShieldCheck, X, Loader2, CreditCard, Landmark } from 'lucide-react';
import { apiWithdrawals, BASE_URL } from '../services/api';
import { isKycApproved } from './KycPage';

export default function Withdrawal({
  currentUser,
  wallet,
  onWithdrawSuccess,
  onClose,
  isOpen = true,
  onAddNotification
}) {
  const userWallet = wallet || currentUser?.wallet || { confirmed: 0, pending: 0 };
  const confirmedBalance = userWallet.confirmed || 0;

  const [amount, setAmount] = useState('');
  const [upiId, setUpiId] = useState('');
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [minLimit, setMinLimit] = useState(500);

  // Fetch minimum withdrawal limit from backend and listen for real-time updates
  useEffect(() => {
    const fetchMinLimit = () => {
      axios.get('/api/settings')
        .then((res) => {
          const min = res.data?.min_withdrawal ?? res.data?.minimumWithdrawal;
          if (min != null && !isNaN(parseFloat(min))) {
            setMinLimit(parseFloat(min));
          }
        })
        .catch(() => {
          axios.get(`${BASE_URL}/settings`)
            .then((res) => {
              const min = res.data?.min_withdrawal ?? res.data?.minimumWithdrawal;
              if (min != null && !isNaN(parseFloat(min))) {
                setMinLimit(parseFloat(min));
              }
            })
            .catch(() => {
              apiWithdrawals.getSettings?.().catch(() => {});
            });
        });
    };

    fetchMinLimit();

    const handleSettingsUpdated = (e) => {
      const min = e?.detail?.min_withdrawal ?? e?.detail?.minimumWithdrawal;
      if (min != null && !isNaN(parseFloat(min))) {
        setMinLimit(parseFloat(min));
      } else {
        fetchMinLimit();
      }
    };

    window.addEventListener('settings:updated', handleSettingsUpdated);
    return () => window.removeEventListener('settings:updated', handleSettingsUpdated);
  }, []);

  // Pre-fill destination from currentUser
  useEffect(() => {
    if (currentUser?.upiId && currentUser.upiId.trim()) {
      setUpiId(currentUser.upiId.trim());
    } else if (currentUser?.bankAccountNumber) {
      setUpiId(`A/C: ${currentUser.bankAccountNumber.slice(-4)} (${currentUser.bankName || 'Bank'})`);
    } else {
      setUpiId('');
    }
  }, [currentUser]);

  // Handle click on Withdraw button -> opens Confirmation Modal
  const handleInitiateWithdraw = (e) => {
    if (e && e.preventDefault) e.preventDefault();

    if (!currentUser) {
      toast.error('Please log in to request a withdrawal.');
      return;
    }

    if (!isKycApproved(currentUser)) {
      Swal.fire({
        icon: 'warning',
        title: 'KYC Required',
        text: 'E-KYC verification is mandatory before making a withdrawal. Please verify your KYC in the Profile section.',
        confirmButtonColor: '#f59e0b'
      });
      toast.warn('E-KYC verification is mandatory before withdrawal.');
      return;
    }

    if (currentUser?.paymentDetailsStatus !== 'approved') {
      Swal.fire({
        icon: 'warning',
        title: 'Payment Details Unverified',
        text: 'Bank Account or UPI details verification is mandatory before requesting withdrawal.',
        confirmButtonColor: '#f59e0b'
      });
      toast.warn('Bank Account / UPI details must be approved by admin first.');
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount < minLimit) {
      toast.error(`Minimum withdrawal is Rs. ${minLimit}`);
      return;
    }

    if (numAmount > confirmedBalance) {
      Swal.fire({
        icon: 'error',
        title: 'Insufficient Balance',
        text: `You have ₹${confirmedBalance.toFixed(2)} confirmed balance. Cannot withdraw ₹${numAmount.toFixed(2)}.`,
        confirmButtonColor: '#ef4444'
      });
      toast.error('Insufficient confirmed commission balance.');
      return;
    }

    if (!upiId || !upiId.trim()) {
      toast.error('No payout destination configured. Please update your UPI or Bank details in Profile.');
      return;
    }

    // All preliminary checks passed -> Open custom Confirmation Modal!
    setIsConfirmModalOpen(true);
  };

  // Step 2: Confirmation modal action -> API Call
  const handleConfirmWithdraw = async () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount < minLimit) {
      setIsConfirmModalOpen(false);
      toast.error(`Minimum withdrawal is Rs. ${minLimit}`);
      return;
    }

    setIsLoading(true);

    try {
      const payload = {
        userId: currentUser?.id || currentUser?._id,
        userName: currentUser?.name || 'User',
        amount: numAmount,
        upiId: upiId,
        coins: Math.round(numAmount * 100),
        date: new Date().toISOString().split('T')[0]
      };

      // Call API: try axios.post('/api/withdraw', {amount}), fallback to apiWithdrawals.create
      let res;
      try {
        const axiosRes = await axios.post(`${BASE_URL}/withdraw`, payload, {
          headers: {
            'Content-Type': 'application/json',
            ...(payload.userId ? { 'X-User-Id': String(payload.userId) } : {})
          }
        });
        res = axiosRes.data;
      } catch (axiosErr) {
        if (axiosErr.response && axiosErr.response.data) {
          throw axiosErr;
        }
        res = await apiWithdrawals.create(payload);
      }

      // Close confirmation modal
      setIsConfirmModalOpen(false);
      setAmount('');

      // Trigger SweetAlert2 Success Popup
      await Swal.fire({
        icon: 'success',
        title: 'Withdrawal Successful!',
        text: `Rs. ${numAmount} withdrawal request submitted`,
        confirmButtonColor: '#10b981',
        timer: 4000
      });

      // Trigger Toast notification
      toast.success("Withdrawal Successful");

      if (onAddNotification) {
        onAddNotification(`Withdrawal of Rs. ${numAmount} requested successfully!`, 'success');
      }

      if (onWithdrawSuccess) {
        onWithdrawSuccess(res || payload);
      }

      if (onClose) {
        onClose();
      }
    } catch (err) {
      console.error('Withdrawal error:', err);
      const errMsg = err?.response?.data?.message || err?.response?.data?.error || err?.message || 'Withdrawal request failed';

      // Trigger SweetAlert2 Error Popup
      await Swal.fire({
        icon: 'error',
        title: 'Failed',
        text: errMsg,
        confirmButtonColor: '#ef4444'
      });

      // Trigger Toast error
      toast.error(errMsg);

      if (onAddNotification) {
        onAddNotification(errMsg, 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="withdrawal-container" style={{ width: '100%' }}>
      {/* Withdrawal Form Card */}
      <form onSubmit={handleInitiateWithdraw} className="referral-card animate-fade" style={{
        gridTemplateColumns: '1fr',
        padding: '24px',
        maxWidth: '520px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        border: '1px solid var(--border)',
        borderRadius: '16px',
        background: 'var(--card-bg)',
        boxShadow: 'var(--shadow-md)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Wallet size={20} style={{ color: '#10b981' }} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--text-bold)' }}>Request Cashback Payout</h3>
              <span style={{ fontSize: '12px', color: 'var(--text)' }}>Transfer confirmed earnings directly to your UPI / Bank</span>
            </div>
          </div>
          {onClose && (
            <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text)' }}>
              <X size={18} />
            </button>
          )}
        </div>

        {/* Balance info badge */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 16px',
          borderRadius: '10px',
          background: 'rgba(16,185,129,0.08)',
          border: '1px solid rgba(16,185,129,0.2)'
        }}>
          <div>
            <span style={{ fontSize: '12px', color: 'var(--text)', display: 'block' }}>Available Confirmed Balance</span>
            <strong style={{ fontSize: '20px', color: '#10b981', fontWeight: 800 }}>₹{confirmedBalance.toFixed(2)}</strong>
          </div>
          <button
            type="button"
            onClick={() => setAmount(confirmedBalance > 0 ? confirmedBalance.toString() : '0')}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              background: '#10b981',
              color: '#ffffff',
              border: 'none',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Withdraw Max
          </button>
        </div>

        {/* Amount Input */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-bold)' }}>
            Withdrawal Amount (₹) <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontWeight: 700, color: 'var(--text)' }}>₹</span>
            <input
              type="number"
              step="0.01"
              min={minLimit}
              max={confirmedBalance}
              placeholder={`e.g. ${minLimit}.00`}
              required
              disabled={isLoading}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px 10px 28px',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--bg)',
                color: 'var(--text-bold)',
                fontSize: '16px',
                fontWeight: 600,
                outline: 'none'
              }}
            />
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text)' }}>Minimum withdrawal: ₹{minLimit} • Instant admin approval process</span>
        </div>

        {/* Quick Amount Chips */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[minLimit, Math.round(minLimit * 2), Math.round(minLimit * 5), Math.max(5000, Math.round(minLimit * 10))]
            .filter((v, i, a) => a.indexOf(v) === i)
            .map((quickAmt) => (
            <button
              key={quickAmt}
              type="button"
              disabled={isLoading || quickAmt > confirmedBalance}
              onClick={() => setAmount(quickAmt.toString())}
              style={{
                padding: '5px 12px',
                borderRadius: '6px',
                border: '1px solid var(--border)',
                background: amount === quickAmt.toString() ? 'var(--primary)' : 'var(--bg)',
                color: amount === quickAmt.toString() ? '#fff' : 'var(--text)',
                fontSize: '12px',
                fontWeight: 600,
                cursor: quickAmt > confirmedBalance ? 'not-allowed' : 'pointer',
                opacity: quickAmt > confirmedBalance ? 0.4 : 1
              }}
            >
              ₹{quickAmt}
            </button>
          ))}
        </div>

        {/* Destination Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-bold)' }}>Payout Destination</label>
          <input
            type="text"
            readOnly
            value={upiId || 'No verified payout method added yet'}
            style={{
              padding: '10px 12px',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              backgroundColor: 'rgba(var(--primary-rgb), 0.05)',
              color: 'var(--text)',
              fontSize: '13px',
              fontFamily: 'monospace'
            }}
          />
        </div>

        {/* Action Button: Opens Confirmation Modal */}
        <button
          type="submit"
          disabled={isLoading || confirmedBalance < minLimit || !amount || parseFloat(amount) < minLimit || parseFloat(amount) > confirmedBalance}
          style={{
            padding: '14px',
            borderRadius: '10px',
            backgroundColor: '#10b981',
            color: '#ffffff',
            border: 'none',
            fontSize: '15px',
            fontWeight: 700,
            cursor: (isLoading || confirmedBalance < minLimit) ? 'not-allowed' : 'pointer',
            opacity: (isLoading || confirmedBalance < minLimit || !amount || parseFloat(amount) < minLimit || parseFloat(amount) > confirmedBalance) ? 0.6 : 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'all 0.2s ease',
            marginTop: '4px'
          }}
        >
          {isLoading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Processing...
            </>
          ) : (
            <>
              Withdraw Rs. {amount ? parseFloat(amount).toFixed(2) : '0.00'}
              <ArrowRight size={18} />
            </>
          )}
        </button>
      </form>

      {/* --- CUSTOM WITHDRAWAL CONFIRMATION MODAL --- */}
      {isConfirmModalOpen && (
        <div
          className="animate-fade"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
        >
          <div
            className="animate-scale"
            style={{
              backgroundColor: 'var(--card-bg, #ffffff)',
              borderRadius: '16px',
              maxWidth: '440px',
              width: '100%',
              padding: '24px',
              border: '1px solid var(--border)',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              display: 'flex',
              flexDirection: 'column',
              gap: '18px'
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(16, 185, 129, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Wallet size={20} style={{ color: '#10b981' }} />
                </div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--text-bold, #111827)' }}>
                  Confirm Withdrawal?
                </h3>
              </div>
              <button
                type="button"
                disabled={isLoading}
                onClick={() => setIsConfirmModalOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  color: 'var(--text)',
                  padding: '4px'
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Content */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <p style={{ margin: 0, fontSize: '15px', color: 'var(--text, #374151)', lineHeight: 1.5 }}>
                Are you sure you want to withdraw <strong style={{ color: '#10b981', fontSize: '16px' }}>Rs. {parseFloat(amount).toFixed(2)}</strong>?
              </p>

              {/* Amount & Destination Summary Box */}
              <div style={{
                backgroundColor: 'rgba(var(--primary-rgb, 16, 185, 129), 0.05)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                padding: '14px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                fontSize: '13px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text)' }}>Withdrawal Amount:</span>
                  <strong style={{ fontSize: '16px', color: '#10b981' }}>Rs. {parseFloat(amount).toFixed(2)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text)' }}>Payout Destination:</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-bold)', fontFamily: 'monospace' }}>{upiId}</span>
                </div>
              </div>

              <span style={{ fontSize: '12px', color: 'var(--text)', opacity: 0.8 }}>
                Once submitted, this amount will be placed under review and processed to your designated account.
              </span>
            </div>

            {/* Modal Buttons: [Cancel], [Yes, Withdraw] */}
            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end',
              marginTop: '6px',
              borderTop: '1px solid var(--border)',
              paddingTop: '16px'
            }}>
              <button
                type="button"
                disabled={isLoading}
                onClick={() => setIsConfirmModalOpen(false)}
                style={{
                  flex: 1,
                  padding: '11px 18px',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--bg, #f3f4f6)',
                  color: 'var(--text-bold, #1f2937)',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: isLoading ? 'not-allowed' : 'pointer'
                }}
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={isLoading}
                onClick={handleConfirmWithdraw}
                style={{
                  flex: 1.4,
                  padding: '11px 18px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: '#10b981',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  opacity: isLoading ? 0.7 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.3)'
                }}
              >
                {isLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} />
                    Yes, Withdraw
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}