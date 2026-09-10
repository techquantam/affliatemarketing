import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';

const FALLBACK_SLIDES = [
  {
    id: 1,
    tag: 'Limited Time Bonanza',
    title: 'Discover Top Deals. <span>Shop Safely.</span>',
    desc: 'Shop at Amazon, Ajio, Flipkart & 500+ stores via LIO MART and find the best active deals.',
    cta: 'Browse Top Offers',
    storeName: 'Myntra Fashion',
    dealRate: 'Best Deals',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/b/bc/Myntra_Logo.png',
  },
  {
    id: 2,
    tag: 'Electronics Mega Deal',
    title: 'Up to <span>80% OFF</span> on Gadgets & Tech',
    desc: 'Upgrade your phone, laptop, or home devices. Get guaranteed deals and active merchant coupons.',
    cta: 'Shop Electronics Now',
    storeName: 'Flipkart Electronics',
    dealRate: 'Top Discounts',
    logo: 'https://www.google.com/s2/favicons?sz=256&domain=flipkart.com',
  },
  {
    id: 3,
    tag: 'Affiliate Program',
    title: 'Share Links. <span>Earn Commissions!</span>',
    desc: 'Generate tracking links for any product. Share them and earn a commission when someone buys!',
    cta: 'Start Earning Now',
    storeName: 'LIO MART Affiliate',
    dealRate: 'Earn Cash',
    logo: 'https://www.google.com/s2/favicons?sz=256&domain=ajio.com',
  },
];

export default function Hero({ banners, onCtaClick, setView, currentUser, openAuthModal, onOpenConvertLinkModal }) {
  const [activeSlide, setActiveSlide] = useState(0);

  const displaySlides = banners && banners.length > 0 ? banners : FALLBACK_SLIDES;

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % displaySlides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [displaySlides.length]);

  const slide = displaySlides[activeSlide] || displaySlides[0];

  const handleCta = () => {
    if (activeSlide === 2) {
      if (onOpenConvertLinkModal) {
        onOpenConvertLinkModal();
      } else if (currentUser) {
        setView('dashboard');
      } else {
        openAuthModal();
      }
    } else {
      onCtaClick();
    }
  };

  return (
    <div className="hero-wrapper">
      <div className="hero-slide" key={slide.id}>
        <div className="hero-content">
          <span className="hero-tag">
            <Sparkles size={14} />
            {slide.tag}
          </span>
          <h2 className="hero-title" dangerouslySetInnerHTML={{ __html: slide.title }} />
          <p className="hero-desc">{slide.desc}</p>
          <div className="hero-ctas">
            <button className="btn-primary" onClick={handleCta}>
              {slide.cta} <ArrowRight size={16} style={{ marginLeft: '6px', display: 'inline' }} />
            </button>
          </div>
        </div>

        <div className="hero-graphics">
          <div className="hero-image-card">
            <img src={slide.logo} alt={slide.storeName} className="hero-card-logo" />
            <div className="hero-card-deal">
              <span className="hero-card-rate">{slide.dealRate}</span>
              <span className="hero-card-desc" style={{ display: 'block' }}>Verified Deal</span>
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text)', opacity: 0.7 }}>
              *Tracked Securely
            </span>
          </div>
        </div>
      </div>

      <div className="hero-dots">
        {displaySlides.map((_, index) => (
          <div
            key={index}
            className={`hero-dot ${index === activeSlide ? 'active' : ''}`}
            onClick={() => setActiveSlide(index)}
          />
        ))}
      </div>
    </div>
  );
}
