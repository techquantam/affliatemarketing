import React from 'react';
import { ShieldCheck } from 'lucide-react';

export default function Footer({ setView }) {
  return (
    <footer className="footer-wrapper">
      <div className="footer-container animate-fade">
        <div className="footer-grid">
          {/* Column 1: Intro */}
          <div className="footer-col" style={{ gap: '12px' }}>
            <div className="logo-section" onClick={() => setView('home')} style={{ marginBottom: '8px' }}>
              <img src="/logo.webp" alt="Lio Mart Logo" style={{ width: '32px', height: '32px', objectFit: 'contain' }} />
              <h2 className="logo-text">
                LIO<span> MART</span>
              </h2>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text)', lineHeight: 1.6 }}>
              LIO MART is India's premium Cashback & Coupon rewards portal. Save real money on top of retail discounts
              at 500+ major stores with zero fees.
            </p>
          </div>

          {/* Column 2: Popular stores */}
          <div className="footer-col">
            <h4 className="footer-col-title">Top Retailers</h4>
            <ul className="footer-links-list">
              <li><a href="#" onClick={(e) => { e.preventDefault(); setView('home'); }}>Amazon Store</a></li>
              <li><a href="#" onClick={(e) => { e.preventDefault(); setView('home'); }}>Flipkart Coupons</a></li>
              <li><a href="#" onClick={(e) => { e.preventDefault(); setView('home'); }}>Myntra Fashion</a></li>
              <li><a href="#" onClick={(e) => { e.preventDefault(); setView('home'); }}>Ajio Outlet</a></li>
            </ul>
          </div>

          {/* Column 3: Company */}
          <div className="footer-col">
            <h4 className="footer-col-title">Company</h4>
            <ul className="footer-links-list">
              <li><a href="#how-it-works" onClick={(e) => { e.preventDefault(); if (setView) setView('home'); setTimeout(() => { const el = document.getElementById('how-it-works') || document.querySelector('.how-it-works-section'); if (el) el.scrollIntoView({ behavior: 'smooth' }); }, 100); }}>How it Works</a></li>
              <li><a href="#" onClick={(e) => { e.preventDefault(); if (setView) setView('home'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>About LIO MART</a></li>
              <li>
                <a 
                  href="#admin" 
                  onClick={(e) => { 
                    e.preventDefault(); 
                    const hasAdmin = (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('admin_session') === 'active') ||
                      (typeof localStorage !== 'undefined' && (Boolean(localStorage.getItem('admin_session')) || localStorage.getItem('is_admin') === 'true'));
                    if (typeof setView === 'function') setView(hasAdmin ? 'admin-panel' : 'admin-login'); 
                  }}
                >
                  Admin Portal
                </a>
              </li>
              <li><a href="#/terms-and-conditions" onClick={(e) => { e.preventDefault(); if (setView) setView('terms-and-conditions'); else window.location.hash = '#/terms-and-conditions'; }}>Terms & Conditions</a></li>
              <li><a href="#/privacy-policy" onClick={(e) => { e.preventDefault(); if (setView) setView('privacy-policy'); else window.location.hash = '#/privacy-policy'; }}>Privacy Policy</a></li>
            </ul>
          </div>

          {/* Column 4: Newsletter */}
          <div className="footer-col">
            <h4 className="footer-col-title">Stay Updated</h4>
            <p style={{ fontSize: '13px', color: 'var(--text)', marginBottom: '8px' }}>
              Subscribe to get handpicked daily deals and flash cashbacks directly in your inbox.
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="email"
                placeholder="Enter email..."
                className="form-input"
                style={{ padding: '8px 12px', fontSize: '13px', flex: 1, borderRadius: '6px' }}
              />
              <button className="btn-primary" style={{ padding: '8px 16px', fontSize: '13px', borderRadius: '6px' }}>
                Join
              </button>
            </div>
          </div>
        </div>

        {/* Bottom footer bar */}
        <div className="footer-bottom">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={18} style={{ color: 'var(--secondary)' }} />
            <span>© 2026 LIO MART Affiliate Marketing. All Rights Reserved. SSL Secured.</span>
          </div>

          <div className="footer-socials">
            <a href="#" onClick={(e) => e.preventDefault()} className="social-icon-btn" aria-label="Facebook">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
            </a>
            <a href="#" onClick={(e) => e.preventDefault()} className="social-icon-btn" aria-label="Twitter">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg>
            </a>
            <a href="#" onClick={(e) => e.preventDefault()} className="social-icon-btn" aria-label="Instagram">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
            </a>
            <a href="#" onClick={(e) => e.preventDefault()} className="social-icon-btn" aria-label="LinkedIn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
