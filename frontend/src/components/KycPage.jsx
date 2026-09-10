import React, { useState, useEffect, useCallback } from 'react';
import { ShieldCheck, ShieldAlert, CheckCircle, Clock, AlertCircle, RotateCw, Camera, Upload, Check } from 'lucide-react';
import { apiUsers, apiUpload } from '../services/api';

/**
 * Unified KYC Status Resolution
 * Uniform status values: 'approved', 'pending', 'rejected', 'not_submitted'
 * Fix condition as specified:
 * if (kycData.status === 'approved' || kycData.is_verified === 1) => Show Approved Badge (Green)
 * else if pending => Show Pending (Yellow)
 * else => Show Rejected (Red)
 */
export const getUnifiedKycStatus = (data) => {
  if (!data) return 'not_submitted';
  const rawStatus = String(data.status || data.kyc_status || data.kycStatus || '').toLowerCase().trim();
  const isVerified = data.is_verified === 1 || data.is_kyc_verified === 1 || data.isKycVerified === true;

  if (rawStatus === 'approved' || rawStatus === 'approve' || isVerified) {
    return 'approved';
  }
  if (rawStatus === 'pending') {
    return 'pending';
  }
  if (rawStatus === 'rejected' || rawStatus === 'reject') {
    return 'rejected';
  }
  return rawStatus || 'not_submitted';
};

export const isKycApproved = (data) => getUnifiedKycStatus(data) === 'approved';
export const isKycPending = (data) => getUnifiedKycStatus(data) === 'pending';
export const isKycRejected = (data) => getUnifiedKycStatus(data) === 'rejected';

export default function KycPage({ currentUser, setCurrentUser, onAddNotification, onRefreshProfile }) {
  const userId = currentUser?.id || currentUser?._id;

  const [kycData, setKycData] = useState(() => currentUser || {});
  const [loadingFresh, setLoadingFresh] = useState(false);

  // Form states
  const [aadhaarNumber, setAadhaarNumber] = useState(currentUser?.aadhaarNumber || '');
  const [panNumber, setPanNumber] = useState(currentUser?.panNumber || '');
  const [aadhaarFront, setAadhaarFront] = useState(currentUser?.aadhaarFrontUrl || '');
  const [aadhaarBack, setAadhaarBack] = useState(currentUser?.aadhaarBackUrl || '');
  const [panCard, setPanCard] = useState(currentUser?.panCardUrl || '');
  const [selfie, setSelfie] = useState(currentUser?.selfieUrl || '');

  const [uploadingField, setUploadingField] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Fetch fresh KYC status from DB directly (GET /api/kyc-status?user_id=)
  const fetchFreshKycStatus = useCallback(async (silent = true) => {
    if (!userId) return;
    if (!silent) setLoadingFresh(true);
    try {
      const fresh = await apiUsers.getKycStatus(userId);
      if (fresh) {
        setKycData(fresh);
        if (fresh.aadhaarNumber) setAadhaarNumber(fresh.aadhaarNumber);
        if (fresh.panNumber) setPanNumber(fresh.panNumber);
        if (fresh.aadhaarFrontUrl) setAadhaarFrontUrl(fresh.aadhaarFrontUrl);
        if (fresh.aadhaarBackUrl) setAadhaarBackUrl(fresh.aadhaarBackUrl);
        if (fresh.panCardUrl) setPanCardUrl(fresh.panCardUrl);
        if (fresh.selfieUrl) setSelfieUrl(fresh.selfieUrl);

        if (setCurrentUser) {
          const { status: _kycStatusVal, ...cleanFreshKyc } = fresh;
          setCurrentUser(prev => prev ? {
            ...prev,
            ...cleanFreshKyc,
            kycStatus: _kycStatusVal || fresh.kycStatus || 'approved',
            kyc_status: _kycStatusVal || fresh.kyc_status || 'approved',
            is_verified: fresh.is_verified,
            is_kyc_verified: fresh.is_kyc_verified,
          } : fresh);
        }

        if (!silent && onAddNotification) {
          const s = getUnifiedKycStatus(fresh);
          onAddNotification(`KYC status refreshed: ${s.toUpperCase()}`, 'info');
        }
      }
    } catch (err) {
      console.warn('[KycPage] Failed to fetch fresh KYC status:', err);
    } finally {
      if (!silent) setLoadingFresh(false);
    }
  }, [userId, setCurrentUser, onAddNotification]);

  // Initial fetch on mount & real-time sync
  useEffect(() => {
    fetchFreshKycStatus(true);

    const handleKycEvent = () => fetchFreshKycStatus(true);
    window.addEventListener('user:kyc_updated', handleKycEvent);

    let bc = null;
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        bc = new BroadcastChannel('affiliate_admin_sync');
        bc.onmessage = (event) => {
          if (event.data?.type === 'USER_KYC_UPDATED') {
            if (!event.data.userId || event.data.userId === userId) {
              fetchFreshKycStatus(true);
            }
          }
        };
      }
    } catch (e) {}

    const handleFocus = () => fetchFreshKycStatus(true);
    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('user:kyc_updated', handleKycEvent);
      window.removeEventListener('focus', handleFocus);
      if (bc) bc.close();
    };
  }, [fetchFreshKycStatus, userId]);

  // Keep state synced with currentUser prop
  useEffect(() => {
    if (currentUser) {
      setKycData(prev => ({ ...prev, ...currentUser }));
      if (currentUser.aadhaarNumber) setAadhaarNumber(currentUser.aadhaarNumber);
      if (currentUser.panNumber) setPanNumber(currentUser.panNumber);
      if (currentUser.aadhaarFrontUrl) setAadhaarFront(currentUser.aadhaarFrontUrl);
      if (currentUser.aadhaarBackUrl) setAadhaarBack(currentUser.aadhaarBackUrl);
      if (currentUser.panCardUrl) setPanCard(currentUser.panCardUrl);
      if (currentUser.selfieUrl) setSelfie(currentUser.selfieUrl);
    }
  }, [currentUser]);

  // Status computation
  const status = getUnifiedKycStatus(kycData);
  const isApproved = status === 'approved';
  const isPending = status === 'pending';
  const isRejected = status === 'rejected';

  // Handle document upload
  const handleUploadFile = async (e, field) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingField(field);
    try {
      const res = await apiUpload.uploadFile(file);
      const url = res.url || res.fileUrl || res.path;
      if (field === 'aadhaarFront') setAadhaarFront(url);
      else if (field === 'aadhaarBack') setAadhaarBack(url);
      else if (field === 'panCard') setPanCard(url);
      else if (field === 'selfie') setSelfie(url);

      if (onAddNotification) {
        onAddNotification('Document uploaded successfully!', 'success');
      }
    } catch (err) {
      console.error('File upload error:', err);
      if (onAddNotification) {
        onAddNotification('Failed to upload file: ' + (err.message || 'Unknown error'), 'error');
      }
    } finally {
      setUploadingField(null);
    }
  };

  // Submit KYC for verification
  const handleSubmitKyc = async (e) => {
    e.preventDefault();
    if (!userId) return;

    if (!aadhaarNumber || aadhaarNumber.length !== 12) {
      if (onAddNotification) onAddNotification('Please enter a valid 12-digit Aadhaar number.', 'error');
      return;
    }

    if (!panNumber || panNumber.length !== 10) {
      if (onAddNotification) onAddNotification('Please enter a valid 10-character PAN number.', 'error');
      return;
    }

    if (!aadhaarFront || !aadhaarBack || !panCard || !selfie) {
      if (onAddNotification) onAddNotification('Please upload all 4 required document images.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        aadhaarNumber,
        panNumber: panNumber.toUpperCase(),
        aadhaarFrontUrl: aadhaarFront,
        aadhaarBackUrl: aadhaarBack,
        panCardUrl: panCard,
        selfieUrl: selfie,
        status: 'pending',
        kycStatus: 'pending',
        kyc_status: 'pending',
      };

      const updated = await apiUsers.update(userId, payload);
      setKycData(prev => ({ ...prev, ...updated, status: 'pending', kycStatus: 'pending' }));

      if (setCurrentUser) {
        setCurrentUser(prev => prev ? ({ ...prev, ...updated, status: 'pending', kycStatus: 'pending' }) : null);
      }

      if (onAddNotification) {
        onAddNotification('KYC documents submitted for review! Approval usually takes 24 hours.', 'success');
      }
    } catch (err) {
      console.error(err);
      if (onAddNotification) {
        onAddNotification('Failed to submit KYC: ' + (err.message || 'Unknown error'), 'error');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="kyc-page-container animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header with Title and Live Sync */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: 'var(--text-bold)' }}>
            E-KYC Verification
          </h2>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
            Mandatory Aadhaar & PAN verification required to unlock cashback withdrawals
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            onClick={() => fetchFreshKycStatus(false)}
            disabled={loadingFresh}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              background: 'var(--card-bg)',
              color: 'var(--text)',
              fontSize: '12px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            <RotateCw size={14} className={loadingFresh ? 'animate-spin' : ''} />
            {loadingFresh ? 'Checking...' : 'Refresh Status'}
          </button>
        </div>
      </div>

      {/* KYC Status Badge & Banner Card */}
      <div style={{
        padding: '20px',
        borderRadius: '12px',
        background: isApproved
          ? 'rgba(16,185,129,0.08)'
          : isPending
          ? 'rgba(245,158,11,0.08)'
          : isRejected
          ? 'rgba(239,68,68,0.08)'
          : 'var(--card-bg)',
        border: `1px solid ${
          isApproved
            ? '#86efac'
            : isPending
            ? '#fcd34d'
            : isRejected
            ? '#fca5a5'
            : 'var(--border)'
        }`,
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {isApproved && <ShieldCheck size={26} color="#16a34a" />}
            {isPending && <Clock size={26} color="#d97706" />}
            {isRejected && <ShieldAlert size={26} color="#dc2626" />}
            {!isApproved && !isPending && !isRejected && <ShieldAlert size={26} color="var(--text)" />}

            <div>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)' }}>
                Current Verification Status
              </div>
              <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-bold)' }}>
                {isApproved ? 'Account Fully Verified & Approved' : isPending ? 'Under Admin Review' : isRejected ? 'Verification Rejected' : 'Not Submitted'}
              </div>
            </div>
          </div>

          {/* Unified Badge according to requested condition */}
          <div>
            {isApproved && (
              <span
                className="kyc-badge-approved"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 14px',
                  borderRadius: '20px',
                  backgroundColor: '#dcfce7',
                  color: '#16a34a',
                  border: '1px solid #86efac',
                  fontWeight: '700',
                  fontSize: '13px',
                }}
              >
                <CheckCircle size={16} color="#16a34a" /> Approved ✓
              </span>
            )}

            {isPending && (
              <span
                className="kyc-badge-pending"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 14px',
                  borderRadius: '20px',
                  backgroundColor: '#fef3c7',
                  color: '#d97706',
                  border: '1px solid #fcd34d',
                  fontWeight: '700',
                  fontSize: '13px',
                }}
              >
                <Clock size={16} color="#d97706" /> Pending
              </span>
            )}

            {isRejected && (
              <span
                className="kyc-badge-rejected"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 14px',
                  borderRadius: '20px',
                  backgroundColor: '#fee2e2',
                  color: '#dc2626',
                  border: '1px solid #fca5a5',
                  fontWeight: '700',
                  fontSize: '13px',
                }}
              >
                <AlertCircle size={16} color="#dc2626" /> Rejected
              </span>
            )}

            {!isApproved && !isPending && !isRejected && (
              <span
                className="kyc-badge-notsubmitted"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 14px',
                  borderRadius: '20px',
                  backgroundColor: 'var(--bg)',
                  color: 'var(--text)',
                  border: '1px solid var(--border)',
                  fontWeight: '600',
                  fontSize: '13px',
                }}
              >
                Action Required
              </span>
            )}
          </div>
        </div>

        {/* Informational Message */}
        <p style={{ margin: 0, fontSize: '13px', color: 'var(--text)' }}>
          {isApproved
            ? 'Your E-KYC has been successfully reviewed and approved by the admin. Cashback payouts and bank withdrawals are active for your account.'
            : isPending
            ? 'Your documents have been submitted and are pending admin review. Approvals are typically processed within 24 hours. Withdrawals will unlock automatically once approved.'
            : isRejected
            ? `Your E-KYC verification was rejected. Reason: "${kycData.admin_remark || kycData.kycRemarks || 'Invalid document copies'}". Please review the requirements below and re-submit clear photos.`
            : 'To comply with regulatory standards and protect payout security, please complete your Aadhaar and PAN verification.'}
        </p>
      </div>

      {/* Main Content Area */}
      {isApproved ? (
        /* Approved Locked View */
        <div style={{
          padding: '24px',
          borderRadius: '12px',
          background: 'var(--card-bg)',
          border: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: 'var(--text-bold)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle size={18} color="#16a34a" /> Verified Document Details
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            <div style={{ padding: '12px', borderRadius: '8px', background: 'var(--bg)', border: '1px solid var(--border)' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>Aadhaar Number</span>
              <strong style={{ fontSize: '14px', fontFamily: 'monospace', color: 'var(--text-bold)' }}>
                XXXX-XXXX-{aadhaarNumber ? aadhaarNumber.slice(-4) : '****'}
              </strong>
            </div>

            <div style={{ padding: '12px', borderRadius: '8px', background: 'var(--bg)', border: '1px solid var(--border)' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>PAN Card Number</span>
              <strong style={{ fontSize: '14px', fontFamily: 'monospace', color: 'var(--text-bold)' }}>
                XXXXXX{panNumber ? panNumber.slice(-4) : '****'}
              </strong>
            </div>

            <div style={{ padding: '12px', borderRadius: '8px', background: 'var(--bg)', border: '1px solid var(--border)' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>Withdrawal Access</span>
              <strong style={{ fontSize: '14px', color: '#16a34a' }}>
                Active & Unlocked ✓
              </strong>
            </div>
          </div>

          <div style={{
            padding: '10px 14px',
            backgroundColor: '#dcfce7',
            color: '#15803d',
            borderRadius: '8px',
            fontSize: '12px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <Check size={16} /> E-KYC is verified and locked against accidental modifications.
          </div>
        </div>
      ) : (
        /* Document Upload & Edit Form */
        <form onSubmit={handleSubmitKyc} style={{
          padding: '24px',
          borderRadius: '12px',
          background: 'var(--card-bg)',
          border: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: 'var(--text-bold)' }}>
            {isPending ? 'Update & Re-Submit KYC Documents' : 'Submit Documents for Verification'}
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-bold)' }}>
                Aadhaar Card Number (12 Digits) *
              </label>
              <input
                type="text"
                required
                maxLength="12"
                placeholder="1234 5678 9012"
                value={aadhaarNumber}
                onChange={(e) => setAadhaarNumber(e.target.value.replace(/\D/g, '').slice(0, 12))}
                style={{
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--bg)',
                  color: 'var(--text-bold)',
                  fontFamily: 'monospace',
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-bold)' }}>
                PAN Card Number (10 Characters) *
              </label>
              <input
                type="text"
                required
                maxLength="10"
                placeholder="ABCDE1234F"
                value={panNumber}
                onChange={(e) => setPanNumber(e.target.value.toUpperCase().slice(0, 10))}
                style={{
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--bg)',
                  color: 'var(--text-bold)',
                  fontFamily: 'monospace',
                }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginTop: '6px' }}>
            {/* Aadhaar Front */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text)' }}>Aadhaar Front *</span>
              <label style={{
                cursor: 'pointer',
                padding: '12px',
                borderRadius: '8px',
                border: '1px dashed var(--border)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'var(--bg)',
                height: '80px',
                textAlign: 'center',
              }}>
                <input type="file" accept="image/*" onChange={(e) => handleUploadFile(e, 'aadhaarFront')} style={{ display: 'none' }} />
                <Camera size={20} color="var(--primary)" style={{ marginBottom: '4px' }} />
                <span style={{ fontSize: '10px', color: 'var(--text)' }}>
                  {uploadingField === 'aadhaarFront' ? 'Uploading...' : aadhaarFront ? 'Uploaded ✓' : 'Click to Upload'}
                </span>
              </label>
            </div>

            {/* Aadhaar Back */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text)' }}>Aadhaar Back *</span>
              <label style={{
                cursor: 'pointer',
                padding: '12px',
                borderRadius: '8px',
                border: '1px dashed var(--border)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'var(--bg)',
                height: '80px',
                textAlign: 'center',
              }}>
                <input type="file" accept="image/*" onChange={(e) => handleUploadFile(e, 'aadhaarBack')} style={{ display: 'none' }} />
                <Camera size={20} color="var(--primary)" style={{ marginBottom: '4px' }} />
                <span style={{ fontSize: '10px', color: 'var(--text)' }}>
                  {uploadingField === 'aadhaarBack' ? 'Uploading...' : aadhaarBack ? 'Uploaded ✓' : 'Click to Upload'}
                </span>
              </label>
            </div>

            {/* PAN Card */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text)' }}>PAN Card Photo *</span>
              <label style={{
                cursor: 'pointer',
                padding: '12px',
                borderRadius: '8px',
                border: '1px dashed var(--border)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'var(--bg)',
                height: '80px',
                textAlign: 'center',
              }}>
                <input type="file" accept="image/*" onChange={(e) => handleUploadFile(e, 'panCard')} style={{ display: 'none' }} />
                <Camera size={20} color="var(--primary)" style={{ marginBottom: '4px' }} />
                <span style={{ fontSize: '10px', color: 'var(--text)' }}>
                  {uploadingField === 'panCard' ? 'Uploading...' : panCard ? 'Uploaded ✓' : 'Click to Upload'}
                </span>
              </label>
            </div>

            {/* Selfie with ID */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text)' }}>Selfie with ID *</span>
              <label style={{
                cursor: 'pointer',
                padding: '12px',
                borderRadius: '8px',
                border: '1px dashed var(--border)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'var(--bg)',
                height: '80px',
                textAlign: 'center',
              }}>
                <input type="file" accept="image/*" onChange={(e) => handleUploadFile(e, 'selfie')} style={{ display: 'none' }} />
                <Camera size={20} color="var(--primary)" style={{ marginBottom: '4px' }} />
                <span style={{ fontSize: '10px', color: 'var(--text)' }}>
                  {uploadingField === 'selfie' ? 'Uploading...' : selfie ? 'Uploaded ✓' : 'Click to Upload'}
                </span>
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting || uploadingField !== null}
            style={{
              marginTop: '12px',
              padding: '10px 16px',
              borderRadius: '8px',
              backgroundColor: 'var(--primary)',
              color: '#fff',
              border: 'none',
              fontWeight: '700',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            {submitting ? 'Submitting Documents...' : isPending ? 'Update & Re-Submit KYC' : 'Submit KYC for Verification'}
          </button>
        </form>
      )}
    </div>
  );
}
