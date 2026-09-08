import React, { useState, useEffect, useMemo } from 'react';
import {
  Info, BookOpen, UserCheck, User, ShoppingBag, Tag, Wallet, CheckCircle,
  Share2, CreditCard, Activity, ShieldAlert, CheckCircle2, FileCheck,
  ShieldCheck, Cookie, AlertTriangle, Scale, Globe, Layers, Trash2, Edit3,
  HelpCircle, FileText, RefreshCw, Bell, PhoneCall, ArrowLeft, Printer,
  Search, Copy, Check, ChevronRight, ArrowUp, FileSpreadsheet
} from 'lucide-react';
import TERMS_SECTIONS from '../data/termsData.json';

const ICON_COMPONENTS = {
  Info, BookOpen, UserCheck, User, ShoppingBag, Tag, Wallet, CheckCircle,
  Share2, CreditCard, Activity, ShieldAlert, CheckCircle2, FileCheck,
  ShieldCheck, Cookie, AlertTriangle, Scale, Globe, Layers, Trash2, Edit3,
  HelpCircle, FileText, RefreshCw, Bell, PhoneCall
};

export default function TermsAndConditions({ onBack, setView }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSectionId, setActiveSectionId] = useState(TERMS_SECTIONS[0]?.id || 'section-introduction');
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 350);

      // Scrollspy for active section in TOC
      const scrollPosition = window.scrollY + 200;
      for (let i = TERMS_SECTIONS.length - 1; i >= 0; i--) {
        const sec = TERMS_SECTIONS[i];
        const el = document.getElementById(sec.id);
        if (el && el.offsetTop <= scrollPosition) {
          setActiveSectionId(sec.id);
          break;
        }
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (setView) {
      setView('home');
    } else {
      window.location.hash = '';
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopyEmail = (email = 'support@liomart.co.in') => {
    if (navigator && navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(email);
    }
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2500);
  };

  const scrollToSection = (id) => {
    setActiveSectionId(id);
    const element = document.getElementById(id);
    if (element) {
      const yOffset = -90;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return TERMS_SECTIONS;
    const q = searchQuery.toLowerCase().trim();
    return TERMS_SECTIONS.filter((sec) => {
      if (sec.title.toLowerCase().includes(q)) return true;
      return sec.blocks.some((b) => {
        if (b.type === 'paragraph' || b.type === 'subheading') {
          return b.text.toLowerCase().includes(q);
        }
        if (b.type === 'list') {
          return b.items.some((it) => it.toLowerCase().includes(q));
        }
        return false;
      });
    });
  }, [searchQuery]);

  return (
    <div className="terms-conditions-page" style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)' }}>
      {/* Top Hero / Banner */}
      <div
        className="terms-hero"
        style={{
          background: 'linear-gradient(135deg, rgba(255, 77, 0, 0.08) 0%, rgba(16, 185, 129, 0.06) 100%)',
          borderBottom: '1px solid var(--border)',
          padding: '36px 20px 28px',
          position: 'relative'
        }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          {/* Breadcrumb & Top Actions */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text)' }}>
              <button
                type="button"
                onClick={handleBack}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--primary)',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '4px 8px',
                  borderRadius: '6px'
                }}
              >
                <ArrowLeft size={16} /> Back to Home
              </button>
              <ChevronRight size={14} style={{ opacity: 0.5 }} />
              <span style={{ fontWeight: '500', color: 'var(--text-bold)' }}>Legal</span>
              <ChevronRight size={14} style={{ opacity: 0.5 }} />
              <span style={{ color: 'var(--primary)', fontWeight: '600' }}>Terms &amp; Conditions</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                onClick={handlePrint}
                className="terms-btn-action"
                title="Print or Save as PDF"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 14px',
                  fontSize: '13px',
                  fontWeight: '600',
                  background: 'var(--card-bg)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  color: 'var(--text-bold)',
                  cursor: 'pointer',
                  boxShadow: 'var(--shadow)'
                }}
              >
                <Printer size={15} /> Print Terms
              </button>
              <button
                type="button"
                onClick={() => handleCopyEmail()}
                className="terms-btn-action"
                title="Copy support email"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 14px',
                  fontSize: '13px',
                  fontWeight: '600',
                  background: copiedEmail ? 'var(--secondary)' : 'var(--card-bg)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  color: copiedEmail ? '#ffffff' : 'var(--text-bold)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: 'var(--shadow)'
                }}
              >
                {copiedEmail ? <Check size={15} /> : <Copy size={15} />}
                {copiedEmail ? 'Email Copied!' : 'Copy Support Email'}
              </button>
            </div>
          </div>

          {/* Title & Metadata Badges */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, var(--primary) 0%, #ff7e40 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                boxShadow: '0 8px 16px rgba(255, 77, 0, 0.25)',
                flexShrink: 0
              }}
            >
              <FileSpreadsheet size={28} />
            </div>

            <div style={{ flex: 1, minWidth: '280px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '6px' }}>
                <span
                  style={{
                    background: 'rgba(255, 77, 0, 0.12)',
                    color: 'var(--primary)',
                    fontSize: '12px',
                    fontWeight: '700',
                    padding: '3px 10px',
                    borderRadius: '20px',
                    letterSpacing: '0.5px',
                    textTransform: 'uppercase'
                  }}
                >
                  Version 1.0
                </span>
                <span
                  style={{
                    background: 'rgba(16, 185, 129, 0.12)',
                    color: 'var(--secondary)',
                    fontSize: '12px',
                    fontWeight: '700',
                    padding: '3px 10px',
                    borderRadius: '20px'
                  }}
                >
                  Active &amp; Legally Binding
                </span>
                <span style={{ fontSize: '12px', color: 'var(--text)', opacity: 0.8 }}>
                  Effective Date: 01/01/2026 • Last Updated: March 2026
                </span>
              </div>

              <h1
                style={{
                  fontSize: 'clamp(24px, 3.5vw, 34px)',
                  fontFamily: 'var(--heading)',
                  fontWeight: '800',
                  color: 'var(--text-bold)',
                  lineHeight: '1.2',
                  marginBottom: '6px'
                }}
              >
                LIO MART – TERMS &amp; CONDITIONS
              </h1>
              <p style={{ fontSize: '15px', color: 'var(--text)', fontWeight: '500', marginBottom: '16px' }}>
                Affiliate Shopping • Cashback • Rewards • Referral Platform
              </p>

              {/* Recital Card */}
              <div
                style={{
                  background: 'var(--card-bg)',
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  padding: '16px 20px',
                  fontSize: '14px',
                  lineHeight: '1.65',
                  color: 'var(--text)',
                  boxShadow: 'var(--shadow)'
                }}
              >
                <p style={{ marginBottom: '8px' }}>
                  <strong>Welcome to Lio Mart.</strong> Lio Mart is an Affiliate Shopping and Cashback Platform that provides users with access to products, offers, coupons, deals, cashback opportunities, and other promotional services from various online shopping websites, brands, merchants, and service providers.
                </p>
                <p style={{ marginBottom: '8px' }}>
                  Lio Mart is not the manufacturer, seller, distributor, or owner of the products listed or promoted through the Platform. Product information, prices, availability, offers, delivery, warranty, and other details may be provided or controlled by the respective Merchant.
                </p>
                <p style={{ fontWeight: '600', color: 'var(--text-bold)', margin: 0 }}>
                  By accessing or using the Lio Mart website, mobile application, or any related service, you acknowledge that you have read, understood, and agreed to these Terms &amp; Conditions. If you do not agree with these Terms, you must not use Lio Mart.
                </p>
              </div>
            </div>
          </div>

          {/* Search / Filter Bar */}
          <div style={{ marginTop: '24px', maxWidth: '640px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                background: 'var(--card-bg)',
                border: '1px solid var(--border)',
                borderRadius: '10px',
                padding: '4px 14px',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              <Search size={18} style={{ color: 'var(--text)', opacity: 0.6, marginRight: '10px' }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search topics in terms (e.g., Cashback, Wallet, Withdrawal, KYC, Liability)..."
                style={{
                  border: 'none',
                  outline: 'none',
                  width: '100%',
                  fontSize: '14px',
                  background: 'transparent',
                  color: 'var(--text-bold)',
                  padding: '8px 0'
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text)',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: '600',
                    padding: '2px 6px'
                  }}
                >
                  Clear
                </button>
              )}
            </div>
            {searchQuery && (
              <div style={{ fontSize: '12px', color: 'var(--text)', marginTop: '6px', paddingLeft: '4px' }}>
                Showing {filteredSections.length} of {TERMS_SECTIONS.length} sections matching &ldquo;{searchQuery}&rdquo;
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area: 2-Column Grid */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 20px 60px' }}>
        <div className="terms-content-grid" style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '32px', alignItems: 'start' }}>
          
          {/* Left Column: Sticky Table of Contents (Desktop) */}
          <aside
            className="terms-sidebar-toc"
            style={{
              position: 'sticky',
              top: '84px',
              maxHeight: 'calc(100vh - 110px)',
              overflowY: 'auto',
              background: 'var(--card-bg)',
              border: '1px solid var(--border)',
              borderRadius: '16px',
              padding: '16px',
              boxShadow: 'var(--shadow)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', paddingBottom: '10px', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-bold)' }}>
                Table of Contents
              </span>
              <span style={{ fontSize: '12px', color: 'var(--text)', opacity: 0.7 }}>
                {TERMS_SECTIONS.length} Sections
              </span>
            </div>

            <nav style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {TERMS_SECTIONS.map((sec) => {
                const isActive = activeSectionId === sec.id;

                return (
                  <button
                    key={sec.id}
                    type="button"
                    onClick={() => scrollToSection(sec.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      fontSize: '13px',
                      textAlign: 'left',
                      background: isActive ? 'rgba(255, 77, 0, 0.08)' : 'transparent',
                      color: isActive ? 'var(--primary)' : 'var(--text)',
                      fontWeight: isActive ? '700' : '400',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      width: '100%'
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) e.currentTarget.style.background = 'var(--bg)';
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: '700',
                        color: isActive ? 'var(--primary)' : 'var(--text)',
                        opacity: isActive ? 1 : 0.6,
                        minWidth: '18px'
                      }}
                    >
                      {String(sec.num).padStart(2, '0')}
                    </span>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                      {sec.title}
                    </span>
                  </button>
                );
              })}
            </nav>
          </aside>

          {/* Right Column: Terms Sections Cards */}
          <main style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {filteredSections.length === 0 ? (
              <div
                style={{
                  background: 'var(--card-bg)',
                  border: '1px solid var(--border)',
                  borderRadius: '16px',
                  padding: '40px',
                  textAlign: 'center',
                  boxShadow: 'var(--shadow)'
                }}
              >
                <Search size={36} style={{ color: 'var(--text)', opacity: 0.4, marginBottom: '12px' }} />
                <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-bold)', marginBottom: '8px' }}>
                  No matching terms found
                </h3>
                <p style={{ fontSize: '14px', color: 'var(--text)', marginBottom: '16px' }}>
                  No clauses in the terms match &ldquo;{searchQuery}&rdquo;.
                </p>
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="btn-primary"
                  style={{ padding: '8px 18px', borderRadius: '8px', fontSize: '13px' }}
                >
                  View All Sections
                </button>
              </div>
            ) : (
              filteredSections.map((sec) => {
                const IconComponent = ICON_COMPONENTS[sec.icon] || FileText;
                const isSpecial = sec.num === 17 || sec.num === 23 || sec.num === 30 || sec.num === 31; // Disclaimer, Support, Contact, Acceptance

                return (
                  <article
                    key={sec.id}
                    id={sec.id}
                    className="terms-section-card"
                    style={{
                      background: 'var(--card-bg)',
                      border: isSpecial ? '1px solid var(--primary)' : '1px solid var(--border)',
                      borderRadius: '16px',
                      padding: '24px 28px',
                      boxShadow: isSpecial ? '0 4px 20px rgba(255, 77, 0, 0.08)' : 'var(--shadow)',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      position: 'relative'
                    }}
                  >
                    {/* Section Header */}
                    <header
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '14px',
                        marginBottom: '18px',
                        paddingBottom: '14px',
                        borderBottom: '1px solid var(--border)'
                      }}
                    >
                      <div
                        style={{
                          width: '42px',
                          height: '42px',
                          borderRadius: '12px',
                          background: isSpecial
                            ? 'linear-gradient(135deg, var(--primary) 0%, #ff7e40 100%)'
                            : 'rgba(255, 77, 0, 0.1)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: isSpecial ? '#ffffff' : 'var(--primary)',
                          flexShrink: 0
                        }}
                      >
                        <IconComponent size={20} />
                      </div>

                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: '800',
                              color: 'var(--primary)',
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px'
                            }}
                          >
                            Section {String(sec.num).padStart(2, '0')}
                          </span>
                        </div>
                        <h2
                          style={{
                            fontSize: '18px',
                            fontWeight: '700',
                            fontFamily: 'var(--heading)',
                            color: 'var(--text-bold)',
                            lineHeight: '1.3'
                          }}
                        >
                          {sec.title}
                        </h2>
                      </div>
                    </header>

                    {/* Section Body */}
                    <div className="terms-body-content" style={{ fontSize: '14px', lineHeight: '1.7', color: 'var(--text)' }}>
                      {sec.blocks.map((block, bIdx) => {
                        if (block.type === 'subheading') {
                          return (
                            <h3
                              key={bIdx}
                              style={{
                                fontSize: '15px',
                                fontWeight: '700',
                                color: 'var(--text-bold)',
                                marginTop: bIdx === 0 ? 0 : '18px',
                                marginBottom: '10px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                              }}
                            >
                              <span
                                style={{
                                  width: '6px',
                                  height: '6px',
                                  borderRadius: '50%',
                                  background: 'var(--primary)',
                                  display: 'inline-block'
                                }}
                              />
                              {block.text}
                            </h3>
                          );
                        }

                        if (block.type === 'list') {
                          return (
                            <ul
                              key={bIdx}
                              style={{
                                listStyle: 'none',
                                paddingLeft: '8px',
                                margin: '10px 0 16px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '8px'
                              }}
                            >
                              {block.items.map((item, itemIdx) => (
                                <li
                                  key={itemIdx}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'baseline',
                                    gap: '10px'
                                  }}
                                >
                                  <span
                                    style={{
                                      width: '6px',
                                      height: '6px',
                                      borderRadius: '50%',
                                      background: 'var(--secondary)',
                                      flexShrink: 0,
                                      marginTop: '7px'
                                    }}
                                  />
                                  <span>{item}</span>
                                </li>
                              ))}
                            </ul>
                          );
                        }

                        // Paragraph
                        const text = block.text;
                        const isEmailLine = text.includes('support@liomart.co.in');
                        const isWebsiteLine = text.includes('https://liomart.co.in') || text.includes('liomart.co.in');

                        return (
                          <p
                            key={bIdx}
                            style={{
                              marginBottom: bIdx === sec.blocks.length - 1 ? 0 : '12px',
                              color: 'var(--text)'
                            }}
                          >
                            {isEmailLine ? (
                              <span>
                                {text.split('support@liomart.co.in')[0]}
                                <a
                                  href="mailto:support@liomart.co.in"
                                  style={{ color: 'var(--primary)', fontWeight: '600', textDecoration: 'underline' }}
                                >
                                  support@liomart.co.in
                                </a>
                                {text.split('support@liomart.co.in')[1]}
                              </span>
                            ) : isWebsiteLine ? (
                              <span>
                                {text.split('https://liomart.co.in')[0]}
                                <a
                                  href="https://liomart.co.in"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{ color: 'var(--primary)', fontWeight: '600', textDecoration: 'underline' }}
                                >
                                  https://liomart.co.in
                                </a>
                                {text.split('https://liomart.co.in')[1]}
                              </span>
                            ) : (
                              text
                            )}
                          </p>
                        );
                      })}
                    </div>
                  </article>
                );
              })
            )}

            {/* Document Footer / Support Box */}
            <div
              style={{
                background: 'linear-gradient(135deg, rgba(255, 77, 0, 0.04) 0%, rgba(16, 185, 129, 0.05) 100%)',
                border: '1px solid var(--border)',
                borderRadius: '16px',
                padding: '24px 28px',
                textAlign: 'center',
                marginTop: '12px'
              }}
            >
              <CheckCircle size={28} style={{ color: 'var(--secondary)', marginBottom: '8px' }} />
              <h4 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-bold)', marginBottom: '4px' }}>
                Lio Mart – Affiliate Shopping • Cashback • Rewards • Referral
              </h4>
              <p style={{ fontSize: '13px', color: 'var(--text)', marginBottom: '16px' }}>
                © Lio Mart. All Rights Reserved. These Terms &amp; Conditions are legally binding in accordance with Indian Law.
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={handleBack}
                  className="btn-primary"
                  style={{ padding: '8px 20px', borderRadius: '8px', fontSize: '13px' }}
                >
                  Return to Home
                </button>
                <button
                  type="button"
                  onClick={() => handleCopyEmail()}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: '600',
                    background: 'var(--card-bg)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-bold)',
                    cursor: 'pointer'
                  }}
                >
                  {copiedEmail ? 'Copied support@liomart.co.in' : 'Contact Support'}
                </button>
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* Floating Scroll-To-Top Button */}
      {showScrollTop && (
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label="Scroll to top"
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            background: 'var(--primary)',
            color: '#ffffff',
            border: 'none',
            boxShadow: '0 6px 16px rgba(255, 77, 0, 0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 99,
            transition: 'transform 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-3px)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <ArrowUp size={20} />
        </button>
      )}

      {/* Responsive Stylesheet for Terms */}
      <style>{`
        @media (max-width: 960px) {
          .terms-content-grid {
            grid-template-columns: 1fr !important;
          }
          .terms-sidebar-toc {
            display: none !important;
          }
        }
        @media print {
          .terms-sidebar-toc,
          .terms-btn-action,
          .terms-hero button,
          .home-category-bar-sticky,
          header,
          footer {
            display: none !important;
          }
          .terms-content-grid {
            grid-template-columns: 1fr !important;
          }
          .terms-section-card {
            box-shadow: none !important;
            border: 1px solid #ccc !important;
            page-break-inside: avoid;
            margin-bottom: 20px !important;
          }
        }
      `}</style>
    </div>
  );
}
