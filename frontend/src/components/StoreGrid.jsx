import React, { useRef, useState, useEffect } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';

export default function StoreGrid({ stores, onStoreSelect, title = "Popular Stores" }) {
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 5);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 5);
    }
  };

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (el) {
      el.addEventListener('scroll', checkScroll, { passive: true });
      window.addEventListener('resize', checkScroll);
      return () => {
        el.removeEventListener('scroll', checkScroll);
        window.removeEventListener('resize', checkScroll);
      };
    }
  }, [stores]);

  const handleScroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -340 : 340;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  if (!stores || stores.length === 0) return null;

  return (
    <div className="home-store-section">
      <div className="section-header">
        <div className="section-title-wrap">
          <h3 className="section-title">{title}</h3>
        </div>
        <div className="store-nav-arrows">
          <button
            type="button"
            className="store-scroll-arrow-btn"
            onClick={() => handleScroll('left')}
            disabled={!canScrollLeft}
            aria-label="Previous stores"
            title="Previous stores"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            className="store-scroll-arrow-btn"
            onClick={() => handleScroll('right')}
            disabled={!canScrollRight}
            aria-label="Next stores"
            title="Next stores"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className="store-scroll-wrapper">
        <button
          type="button"
          className={`store-side-scroll-btn left ${canScrollLeft ? 'visible' : ''}`}
          onClick={() => handleScroll('left')}
          aria-label="Scroll left"
          tabIndex={canScrollLeft ? 0 : -1}
        >
          <ChevronLeft size={18} />
        </button>

        <div
          ref={scrollRef}
          className="stores-grid flex flex-row overflow-x-auto flex-nowrap"
        >
          {stores.map((store) => (
            <div
              key={store.id || store._id}
              className="store-card w-[160px] min-w-[160px] h-[180px] animate-fade"
              onClick={() => onStoreSelect(store.id || store._id)}
            >
              {/* Top Right Popular Badge */}
              <span className="store-popular-tag">
                ★ Popular
              </span>

              {/* Store Logo centered inside a small rounded rectangle with light border */}
              <div className="store-logo-box">
                <img 
                  src={store.logo || store.imageUrl || store.banner || `https://placehold.co/120x60/f8fafc/64748b?text=${encodeURIComponent(store.name || 'Store')}`} 
                  alt={store.name || 'Store'} 
                  className="store-logo-img"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = `https://placehold.co/120x60/f8fafc/64748b?text=${encodeURIComponent(store.name || 'Store')}`;
                  }}
                />
              </div>

              {/* Middle: Store name & Bold Green text "Up to X% Commission" */}
              <div className="store-meta">
                <span className="store-name" title={store.name}>
                  {store.name || 'Store'}
                </span>
                <span className="store-cashback-badge">
                  Up to {store.cashbackRate || '10%'} Commission
                </span>
              </div>

              {/* Bottom: Orange button "Grab Deal ->" */}
              <div className="store-card-actions">
                <button
                  type="button"
                  className="btn-card-primary store-btn-compact"
                  onClick={(e) => {
                    e.stopPropagation();
                    onStoreSelect(store.id || store._id);
                  }}
                >
                  Grab Deal <ArrowRight size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          className={`store-side-scroll-btn right ${canScrollRight ? 'visible' : ''}`}
          onClick={() => handleScroll('right')}
          aria-label="Scroll right"
          tabIndex={canScrollRight ? 0 : -1}
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}
