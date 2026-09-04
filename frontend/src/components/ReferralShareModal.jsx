import React, { useState } from 'react';
import { X, Copy, Check, Share2 } from 'lucide-react';
import { copyToClipboard } from '../utils/clipboard';

export default function ReferralShareModal({ isOpen, onClose, referralCode, referralLink, onNotification }) {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen) return null;

  const code = referralCode || 'LIOMART';
  const link = referralLink || `https://liomart.co.in/signup?ref=${code}`;
  const shareText = `Join LIO MART and earn cashback on every shopping! Use my code ${code} - ${link}`;

  const handleCopyCode = async () => {
    const ok = await copyToClipboard(code);
    if (ok) {
      setCopiedCode(true);
      if (onNotification) onNotification('Referral code copied to clipboard!', 'success');
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleCopyLink = async () => {
    const ok = await copyToClipboard(link);
    if (ok) {
      setCopiedLink(true);
      if (onNotification) onNotification('Referral link copied to clipboard!', 'success');
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join LIO MART & Earn Cashback',
          text: shareText,
          url: link,
        });
        if (onNotification) onNotification('Shared successfully!', 'success');
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.warn('Native share failed:', err);
        }
      }
    }
  };

  const openShareUrl = (url) => {
    window.open(url, '_blank', 'noopener,noreferrer,width=600,height=500');
  };

  const shareWhatsapp = () => {
    openShareUrl(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`);
  };

  const shareTelegram = () => {
    openShareUrl(`https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(shareText)}`);
  };

  const shareTwitter = () => {
    openShareUrl(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`);
  };

  const shareFacebook = () => {
    openShareUrl(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`);
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999,
        padding: '16px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--card-bg, #ffffff)',
          color: 'var(--text, #1f2937)',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '440px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)',
          overflow: 'hidden',
          border: '1px solid var(--border, #e5e7eb)',
          animation: 'modalSlideIn 0.25s ease-out',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border, #e5e7eb)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: 'rgba(255, 77, 0, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--primary, #ff4d00)',
              }}
            >
              <Share2 size={18} />
            </div>
            <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '700', color: 'var(--text-bold, #111827)' }}>
              Refer & Earn
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted, #6b7280)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--text-muted, #6b7280)', lineHeight: '1.5' }}>
            Invite friends to LIO MART. When they sign up using your code or link, you earn a flat <strong>10% lifetime bonus</strong> on all their cashback earnings!
          </p>

          {/* Referral Code Box */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted, #4b5563)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Your Referral Code
            </label>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                backgroundColor: 'var(--bg, #f9fafb)',
                border: '1.5px dashed var(--primary, #ff4d00)',
                borderRadius: '10px',
              }}
            >
              <span style={{ fontSize: '18px', fontWeight: '800', letterSpacing: '1.5px', color: 'var(--primary, #ff4d00)' }}>
                {code}
              </span>
              <button
                type="button"
                onClick={handleCopyCode}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: copiedCode ? '#10b981' : 'var(--primary, #ff4d00)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '7px 12px',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                }}
              >
                {copiedCode ? <Check size={14} /> : <Copy size={14} />}
                {copiedCode ? 'Copied' : 'Copy Code'}
              </button>
            </div>
          </div>

          {/* Referral Link Box */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted, #4b5563)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Your Referral Link
            </label>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: 'var(--bg, #f9fafb)',
                border: '1px solid var(--border, #e5e7eb)',
                borderRadius: '10px',
                padding: '6px 8px 6px 12px',
              }}
            >
              <input
                type="text"
                readOnly
                value={link}
                style={{
                  flex: 1,
                  background: 'none',
                  border: 'none',
                  outline: 'none',
                  fontSize: '13px',
                  color: 'var(--text, #1f2937)',
                  fontFamily: 'monospace',
                }}
              />
              <button
                type="button"
                onClick={handleCopyLink}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: copiedLink ? '#10b981' : 'var(--text-bold, #111827)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '7px 12px',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                {copiedLink ? <Check size={14} /> : <Copy size={14} />}
                {copiedLink ? 'Copied' : 'Copy Link'}
              </button>
            </div>
          </div>

          {/* Social Share Section */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted, #4b5563)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Share With Friends
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
              {/* WhatsApp */}
              <button
                type="button"
                onClick={shareWhatsapp}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '10px 4px',
                  borderRadius: '10px',
                  border: '1px solid #dcfce7',
                  backgroundColor: '#f0fdf4',
                  color: '#15803d',
                  fontSize: '11px',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="#25D366">
                  <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.599 2.679-.702c.971.554 1.77.851 2.781.851 3.183 0 5.77-2.587 5.77-5.766.001-3.182-2.585-5.768-5.77-5.768zm3.385 8.163c-.145.407-.745.748-1.034.793-.289.046-.66.069-1.077-.066-.757-.245-1.745-.88-2.518-1.654-.775-.774-1.411-1.761-1.656-2.518-.135-.417-.113-.788-.066-1.077.045-.289.386-.889.793-1.034.135-.048.271-.024.375.059.104.084.582 1.393.633 1.517.051.124.038.257-.04.364-.078.106-.156.196-.248.307-.091.111-.19.231-.082.417.108.186.48 1.042 1.03 1.592.551.55 1.406.922 1.592 1.03.186.108.306.009.417-.082.111-.091.201-.17.307-.248.107-.078.24-.091.364-.04.124.051 1.433.529 1.517.633.083.104.107.24.059.375z" />
                </svg>
                WhatsApp
              </button>

              {/* Telegram */}
              <button
                type="button"
                onClick={shareTelegram}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '10px 4px',
                  borderRadius: '10px',
                  border: '1px solid #e0f2fe',
                  backgroundColor: '#f0f9ff',
                  color: '#0369a1',
                  fontSize: '11px',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="#0088cc">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.75-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
                </svg>
                Telegram
              </button>

              {/* Twitter / X */}
              <button
                type="button"
                onClick={shareTwitter}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '10px 4px',
                  borderRadius: '10px',
                  border: '1px solid var(--border, #e5e7eb)',
                  backgroundColor: 'var(--bg, #f9fafb)',
                  color: 'var(--text-bold, #111827)',
                  fontSize: '11px',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
                Twitter / X
              </button>

              {/* Facebook */}
              <button
                type="button"
                onClick={shareFacebook}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '10px 4px',
                  borderRadius: '10px',
                  border: '1px solid #dbeafe',
                  backgroundColor: '#eff6ff',
                  color: '#1d4ed8',
                  fontSize: '11px',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="#1877F2">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                Facebook
              </button>
            </div>
          </div>

          {/* Native Web Share Button (if supported or accessible) */}
          {typeof navigator !== 'undefined' && navigator.share && (
            <button
              type="button"
              onClick={handleNativeShare}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '12px',
                backgroundColor: 'var(--primary, #ff4d00)',
                color: '#fff',
                border: 'none',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: '700',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(255, 77, 0, 0.25)',
              }}
            >
              <Share2 size={16} />
              Share via Other Apps
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
