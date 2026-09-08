import React, { useState, useEffect, useMemo } from 'react';
import {
  Info, Layers, Database, Activity, CheckCircle, ExternalLink, Cookie,
  Share2, CreditCard, UserCheck, Wallet, ShieldCheck, Clock, Sliders,
  User, Mail, Bell, AlertCircle, Link2, ShieldAlert, Globe, AlertTriangle,
  Edit3, Trash2, HelpCircle, Scale, Key, Briefcase, RefreshCw, FileCheck,
  FileText, PhoneCall, CheckCircle2, ArrowLeft, Printer, Search, Copy, Check,
  ChevronRight, ArrowUp, Shield
} from 'lucide-react';
import POLICY_SECTIONS from '../data/privacyPolicyData.json';

const ICON_COMPONENTS = {
  Info, Layers, Database, Activity, CheckCircle, ExternalLink, Cookie,
  Share2, CreditCard, UserCheck, Wallet, ShieldCheck, Clock, Sliders,
  User, Mail, Bell, AlertCircle, Link2, ShieldAlert, Globe, AlertTriangle,
  Edit3, Trash2, HelpCircle, Scale, Key, Briefcase, RefreshCw, FileCheck,
  FileText, PhoneCall, CheckCircle2
};

export default function PrivacyPolicy({ onBack, setView }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSectionId, setActiveSectionId] = useState('section-1');
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 350);

      // Scrollspy for active section in TOC
      const scrollPosition = window.scrollY + 200;
      for (let i = POLICY_SECTIONS.length - 1; i >= 0; i--) {
        const sec = POLICY_SECTIONS[i];
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
    if (!searchQuery.trim()) return POLICY_SECTIONS;
    const q = searchQuery.toLowerCase().trim();
    return POLICY_SECTIONS.filter((sec) => {
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
    <div className="privacy-policy-page" style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)' }}>
      {/* Top Banner / Hero */}
      <div
        className="privacy-hero"
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
              <span style={{ color: 'var(--primary)', fontWeight: '600' }}>Privacy Policy</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                onClick={handlePrint}
                className="privacy-btn-action"
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
                <Printer size={15} /> Print Policy
              </button>
              <button
                type="button"
                onClick={() => handleCopyEmail()}
                className="privacy-btn-action"
                title="Copy grievance and support email"
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
              <Shield size={28} />
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
                  Active & Legally Binding
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
                LIO MART – PRIVACY POLICY
              </h1>
              <p style={{ fontSize: '15px', color: 'var(--text)', fontWeight: '500', marginBottom: '16px' }}>
                Affiliate Shopping • Cashback • Rewards • Referral Platform
              </p>

              {/* Intro recital card */}
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
                  <strong>Lio Mart</strong> (&ldquo;Lio Mart&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;) respects the privacy of its users (&ldquo;User&rdquo;, &ldquo;you&rdquo;, or &ldquo;your&rdquo;) and is committed to protecting personal information collected through the Lio Mart website, mobile application, web application, services, and related platforms.
                </p>
                <p style={{ marginBottom: '8px' }}>
                  This Privacy Policy explains how Lio Mart collects, uses, stores, processes, protects, and shares information when you access or use our services.
                </p>
                <p style={{ fontWeight: '600', color: 'var(--text-bold)', margin: 0 }}>
                  By registering with, accessing, or using Lio Mart, you acknowledge that you have read and understood this Privacy Policy.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Search & Filter bar */}
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
                placeholder="Search topics in policy (e.g., KYC, Cashback, Cookies, Delete Account)..."
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
                Showing {filteredSections.length} of {POLICY_SECTIONS.length} sections matching &ldquo;{searchQuery}&rdquo;
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area: 2-Column Grid */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 20px 60px' }}>
        <div className="privacy-content-grid" style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '32px', alignItems: 'start' }}>
          
          {/* Left Column: Sticky Table of Contents (Desktop) */}
          <aside
            className="privacy-sidebar-toc"
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
                {POLICY_SECTIONS.length} Sections
              </span>
            </div>

            <nav style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {POLICY_SECTIONS.map((sec) => {
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

          {/* Right Column: Policy Document Cards */}
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
                  No matching sections found
                </h3>
                <p style={{ fontSize: '14px', color: 'var(--text)', marginBottom: '16px' }}>
                  No clauses in the privacy policy match &ldquo;{searchQuery}&rdquo;.
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
                const isSpecial = sec.num === 25 || sec.num === 32 || sec.num === 33; // Grievance, Contact, Acceptance

                return (
                  <article
                    key={sec.id}
                    id={sec.id}
                    className="policy-section-card"
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
                    {/* Card Header with Icon & Title */}
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

                    {/* Content Blocks */}
                    <div className="policy-body-content" style={{ fontSize: '14px', lineHeight: '1.7', color: 'var(--text)' }}>
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
                                  <span>{item};</span>
                                </li>
                              ))}
                            </ul>
                          );
                        }

                        // Paragraph rendering with link auto-detection for support email & website
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

            {/* Document Closing Footer Card */}
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
              <ShieldCheck size={28} style={{ color: 'var(--secondary)', marginBottom: '8px' }} />
              <h4 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-bold)', marginBottom: '4px' }}>
                Lio Mart – Affiliate Shopping • Cashback • Rewards • Referral
              </h4>
              <p style={{ fontSize: '13px', color: 'var(--text)', marginBottom: '16px' }}>
                © Lio Mart. All Rights Reserved. Fully compliant with applicable Indian data protection principles.
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

      {/* Responsive Stylesheet for Privacy Policy */}
      <style>{`
        @media (max-width: 960px) {
          .privacy-content-grid {
            grid-template-columns: 1fr !important;
          }
          .privacy-sidebar-toc {
            display: none !important;
          }
        }
        @media print {
          .privacy-sidebar-toc,
          .privacy-btn-action,
          .privacy-hero button,
          .home-category-bar-sticky,
          header,
          footer {
            display: none !important;
          }
          .privacy-content-grid {
            grid-template-columns: 1fr !important;
          }
          .policy-section-card {
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
