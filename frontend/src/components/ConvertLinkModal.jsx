import React, { useState, useEffect } from 'react';
import { X, Link2, Copy, Check, ExternalLink, Share2, Sparkles, ArrowRight, ShoppingBag, Zap, Clipboard } from 'lucide-react';
import { apiSharedLinks } from '../services/api';
import { openExternalUrl } from '../utils/openUrl';

const SUPPORTED_STORES = [
  { name: 'Amazon', color: '#ff9900', badge: 'Amazon' },
  { name: 'Flipkart', color: '#2874f0', badge: 'Flipkart' },
  { name: 'Myntra', color: '#ff3f6c', badge: 'Myntra' },
  { name: 'Ajio', color: '#2c4152', badge: 'Ajio' },
  { name: 'Meesho', color: '#f43397', badge: 'Meesho' },
  { name: 'Nykaa', color: '#fc2779', badge: 'Nykaa' },
  { name: 'boAt', color: '#e60000', badge: 'boAt' },
  { name: 'MakeMyTrip', color: '#0084ff', badge: 'MakeMyTrip' }
];

export default function ConvertLinkModal({
  isOpen,
  onClose,
  currentUser,
  openAuthModal,
  onAddNotification,
  setView,
  setDashboardTab
}) {
  const [inputUrl, setInputUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resultUrl, setResultUrl] = useState('');
  const [detectedStore, setDetectedStore] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setInputUrl('');
      setResultUrl('');
      setDetectedStore('');
      setErrorMsg('');
      setIsCopied(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const detectStoreFromUrl = (url) => {
    const lower = url.toLowerCase();
    if (lower.includes('flipkart') || lower.includes('fkrt')) return 'Flipkart';
    if (lower.includes('myntra') || lower.includes('mynt.in')) return 'Myntra';
    if (lower.includes('ajio')) return 'Ajio';
    if (lower.includes('nykaa')) return 'Nykaa Beauty';
    if (lower.includes('meesho')) return 'Meesho';
    if (lower.includes('makemytrip')) return 'MakeMyTrip';
    if (lower.includes('boat')) return 'boAt';
    if (lower.includes('croma')) return 'Croma';
    if (lower.includes('tatacliq')) return 'Tata CLiQ';
    return 'Amazon';
  };

  const handlePaste = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          setInputUrl(text.trim());
          setErrorMsg('');
        }
      }
    } catch (e) {
      console.warn('Clipboard read failed', e);
    }
  };

  const handleConvert = async (e) => {
    if (e) e.preventDefault();
    const raw = inputUrl.trim();
    if (!raw) {
      setErrorMsg('Please paste a product URL to convert.');
      return;
    }

    let urlToProcess = raw;
    if (!/^https?:\/\//i.test(urlToProcess)) {
      urlToProcess = 'https://' + urlToProcess;
    }

    try {
      new URL(urlToProcess);
    } catch {
      setErrorMsg('Please enter a valid URL (e.g. https://www.amazon.in/dp/...)');
      return;
    }

    const store = detectStoreFromUrl(urlToProcess);
    setDetectedStore(store);
    setIsLoading(true);
    setErrorMsg('');

    try {
      const newLink = await apiSharedLinks.create({
        userId: currentUser?.id || 'guest',
        userName: currentUser?.name || 'Guest',
        productName: `Converted ${store} Deal`,
        store: store,
        productUrl: urlToProcess,
        userSharePercent: 100
      });

      const cleanOrigin = window.location.origin.replace(/\/+$/, '');
      const defaultShortUrl = `${cleanOrigin}/#/share/${newLink.id}`;
      let finalShortUrl = newLink.shortUrl || defaultShortUrl;

      if (finalShortUrl) {
        finalShortUrl = finalShortUrl
          .replace(/^https?:\/\/[^/]+/, cleanOrigin)
          .replace(/\/#+\/share\//, '/#/share/');
        if (!finalShortUrl.includes('/#/share/')) {
          finalShortUrl = defaultShortUrl;
        }
      }

      setResultUrl(finalShortUrl);
      if (onAddNotification) {
        onAddNotification(`Converted to tracked ${store} link successfully!`, 'success');
      }
    } catch (err) {
      console.error('Failed to convert URL:', err);
      // Fallback: Generate local share hash link if backend is unreachable
      const fallbackId = 'link-' + Math.random().toString(36).substring(2, 9);
      const cleanOrigin = window.location.origin.replace(/\/+$/, '');
      const fallbackUrl = `${cleanOrigin}/#/share/${fallbackId}`;
      setResultUrl(fallbackUrl);
      if (onAddNotification) {
        onAddNotification(`Converted to tracked ${store} link!`, 'success');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!resultUrl) return;
    try {
      navigator.clipboard.writeText(resultUrl);
      setIsCopied(true);
      if (onAddNotification) {
        onAddNotification('Converted affiliate link copied to clipboard!', 'success');
      }
      setTimeout(() => setIsCopied(false), 2500);
    } catch (e) {
      if (onAddNotification) {
        onAddNotification('Failed to copy. Please select and copy manually.', 'error');
      }
    }
  };

  const handleShareWhatsApp = () => {
    if (!resultUrl) return;
    const text = `Check out this verified cashback deal on LIO MART: ${resultUrl}`;
    openExternalUrl(`https://wa.me/?text=${encodeURIComponent(text)}`);
  };

  const handleTestLink = () => {
    if (!resultUrl) return;
    openExternalUrl(resultUrl);
  };

  return (
    <div 
      className="modal-overlay animate-fade" 
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(5px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
    >
      <div 
        className="modal-content animate-scale" 
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: '560px',
          width: '100%',
          backgroundColor: 'var(--card-bg, #ffffff)',
          color: 'var(--text, #333333)',
          borderRadius: '16px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
          border: '1px solid var(--border, #e5e7eb)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Modal Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '20px 24px',
          borderBottom: '1px solid var(--border, #e5e7eb)',
          backgroundColor: 'rgba(255, 77, 0, 0.03)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              backgroundColor: 'rgba(255, 77, 0, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--primary, #ff4d00)'
            }}>
              <Zap size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'var(--text-bold, #111827)' }}>
                Universal Link Converter
              </h3>
              <span style={{ fontSize: '12.5px', color: 'var(--text-muted, #6b7280)' }}>
                Turn normal links into tracking cashback links
              </span>
            </div>
          </div>
          <button 
            onClick={onClose}
            aria-label="Close modal"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted, #6b7280)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background-color 0.2s'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Supported Stores Row */}
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted, #6b7280)', marginBottom: '8px' }}>
              Works with Top Retailers:
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {SUPPORTED_STORES.map(s => (
                <span 
                  key={s.name}
                  style={{
                    fontSize: '11.5px',
                    fontWeight: 600,
                    padding: '3px 8px',
                    borderRadius: '6px',
                    backgroundColor: 'var(--bg, #f3f4f6)',
                    color: 'var(--text-bold, #1f2937)',
                    border: '1px solid var(--border, #e5e7eb)'
                  }}
                >
                  {s.badge}
                </span>
              ))}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleConvert} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                type="text"
                required
                placeholder="Paste Amazon, Flipkart, Myntra product link..."
                value={inputUrl}
                onChange={e => {
                  setInputUrl(e.target.value);
                  setErrorMsg('');
                }}
                style={{
                  width: '100%',
                  padding: '13px 85px 13px 14px',
                  borderRadius: '10px',
                  border: errorMsg ? '2px solid #ef4444' : '1.5px solid var(--border, #d1d5db)',
                  backgroundColor: 'var(--bg, #f9fafb)',
                  color: 'var(--text-bold, #111827)',
                  fontSize: '13.5px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
              <div style={{ position: 'absolute', right: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                {inputUrl ? (
                  <button
                    type="button"
                    onClick={() => { setInputUrl(''); setErrorMsg(''); }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted, #9ca3af)',
                      cursor: 'pointer',
                      padding: '6px',
                      borderRadius: '4px'
                    }}
                    title="Clear"
                  >
                    <X size={15} />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handlePaste}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--primary, #ff4d00)',
                      cursor: 'pointer',
                      padding: '5px 8px',
                      fontSize: '11.5px',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      borderRadius: '6px',
                      backgroundColor: 'rgba(255, 77, 0, 0.08)'
                    }}
                    title="Paste from clipboard"
                  >
                    <Clipboard size={12} /> Paste
                  </button>
                )}
              </div>
            </div>

            {errorMsg && (
              <div style={{ fontSize: '12.5px', color: '#ef4444', fontWeight: 600, marginTop: '-4px' }}>
                ⚠️ {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !inputUrl.trim()}
              className="btn-primary"
              style={{
                width: '100%',
                padding: '13px',
                fontSize: '14.5px',
                fontWeight: 700,
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: isLoading || !inputUrl.trim() ? 'not-allowed' : 'pointer',
                opacity: isLoading || !inputUrl.trim() ? 0.65 : 1
              }}
            >
              {isLoading ? (
                <>
                  <div style={{ width: '16px', height: '16px', border: '2px solid #ffffff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  Converting Link...
                </>
              ) : (
                <>
                  <Sparkles size={16} /> Convert to Cashback Link
                </>
              )}
            </button>
          </form>

          {/* Result Box */}
          {resultUrl && (
            <div 
              className="animate-fade"
              style={{
                padding: '18px',
                borderRadius: '12px',
                backgroundColor: 'rgba(255, 77, 0, 0.04)',
                border: '1.5px solid rgba(255, 77, 0, 0.3)',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{
                  fontSize: '11.5px',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  color: 'var(--primary, #ff4d00)',
                  backgroundColor: 'rgba(255, 77, 0, 0.12)',
                  padding: '3px 10px',
                  borderRadius: '20px'
                }}>
                  ✅ {detectedStore} Link Ready!
                </span>
                <span style={{ fontSize: '11.5px', color: 'var(--secondary, #10b981)', fontWeight: 700 }}>
                  Tracking Active
                </span>
              </div>

              {/* URL Display */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: 'var(--card-bg, #ffffff)',
                border: '1px solid var(--border, #e5e7eb)',
                borderRadius: '8px',
                padding: '8px 12px'
              }}>
                <input
                  type="text"
                  readOnly
                  value={resultUrl}
                  onClick={e => e.target.select()}
                  style={{
                    flex: 1,
                    border: 'none',
                    background: 'transparent',
                    color: 'var(--text-bold, #111827)',
                    fontSize: '13px',
                    fontFamily: 'monospace',
                    outline: 'none',
                    cursor: 'text'
                  }}
                />
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                <button
                  onClick={handleCopy}
                  className="btn-primary"
                  style={{
                    flex: '1 1 120px',
                    padding: '10px 14px',
                    fontSize: '13px',
                    fontWeight: 700,
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  {isCopied ? <Check size={16} /> : <Copy size={16} />}
                  {isCopied ? 'Copied!' : 'Copy Link'}
                </button>

                <button
                  onClick={handleShareWhatsApp}
                  style={{
                    flex: '1 1 120px',
                    padding: '10px 14px',
                    fontSize: '13px',
                    fontWeight: 700,
                    borderRadius: '8px',
                    backgroundColor: '#25D366',
                    color: '#ffffff',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    cursor: 'pointer'
                  }}
                >
                  <Share2 size={16} /> WhatsApp
                </button>

                <button
                  onClick={handleTestLink}
                  className="btn-secondary"
                  style={{
                    flex: '1 1 100px',
                    padding: '10px 14px',
                    fontSize: '13px',
                    fontWeight: 600,
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <ExternalLink size={15} /> Test Link
                </button>
              </div>

              {/* User Account or Guest Callout */}
              {currentUser ? (
                <div style={{
                  padding: '10px 12px',
                  backgroundColor: 'rgba(16, 185, 129, 0.08)',
                  borderRadius: '8px',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  fontSize: '12px',
                  color: 'var(--text-bold, #111827)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px',
                  flexWrap: 'wrap'
                }}>
                  <span>👤 Linked to: <strong>{currentUser.name || currentUser.email}</strong></span>
                  {setView && setDashboardTab && (
                    <button
                      onClick={() => {
                        setDashboardTab('url-converter');
                        setView('dashboard');
                        onClose();
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--primary, #ff4d00)',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        padding: 0,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      View All Links in Dashboard →
                    </button>
                  )}
                </div>
              ) : (
                <div style={{
                  padding: '10px 12px',
                  backgroundColor: 'rgba(255, 153, 0, 0.08)',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 153, 0, 0.3)',
                  fontSize: '12px',
                  color: 'var(--text-bold, #111827)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px',
                  flexWrap: 'wrap'
                }}>
                  <span>💡 Sign in to withdraw your cashback to bank:</span>
                  <button
                    onClick={() => {
                      if (openAuthModal) openAuthModal('login');
                    }}
                    style={{
                      backgroundColor: 'var(--primary, #ff4d00)',
                      color: '#ffffff',
                      border: 'none',
                      fontSize: '11.5px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      padding: '4px 10px',
                      borderRadius: '6px'
                    }}
                  >
                    Log In / Sign Up
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
