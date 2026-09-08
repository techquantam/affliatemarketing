import React, { useRef, useState, useEffect, useCallback } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { getFallbackStoreLogo } from '../utils/storeLogoHelper';
import { apiStores } from '../services/api';

export default function StoreGrid({ stores: initialStores, onStoreSelect, title = "Popular Stores", onRefresh }) {
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [localStores, setLocalStores] = useState(initialStores || []);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Synchronize when parent prop updates
  useEffect(() => {
    if (initialStores && Array.isArray(initialStores)) {
      setLocalStores(initialStores);
    }
  }, [initialStores]);

  // Re-fetch logic without hard refresh
  const refetchStores = useCallback(async () => {
    try {
      setIsRefreshing(true);
      if (onRefresh) {
        await onRefresh();
      } else {
        const fresh = await apiStores.getAll({ status: 'active', is_active: 1 });
        if (fresh && Array.isArray(fresh) && fresh.length > 0) {
          setLocalStores(fresh);
        }
      }
    } catch (err) {
      console.warn('StoreGrid auto-refetch failed:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, [onRefresh]);

  // Listen for store creation / updates across tabs and components
  useEffect(() => {
    const handleStoreChange = (e) => {
      // If a specific new store was created, prepend immediately
      if (e?.detail && (e.type === 'store:created' || e.type === 'store:updated')) {
        const incoming = e.detail;
        const incomingId = incoming.id || incoming._id;
        setLocalStores((prev) => {
          const exists = prev.some((s) => (s.id && s.id === incomingId) || (s._id && s._id === incomingId));
          return exists ? prev.map((s) => ((s.id && s.id === incomingId) || (s._id && s._id === incomingId) ? incoming : s)) : [incoming, ...prev];
        });
      }
      refetchStores();
    };

    window.addEventListener('store:created', handleStoreChange);
    window.addEventListener('store:updated', handleStoreChange);
    window.addEventListener('store:deleted', handleStoreChange);
    window.addEventListener('stores:cache_cleared', refetchStores);

    let bc;
    if (typeof BroadcastChannel !== 'undefined') {
      bc = new BroadcastChannel('affiliate_admin_sync');
      bc.onmessage = (event) => {
        if (event.data?.type === 'STORE_CREATED' || event.data?.type === 'STORE_UPDATED' || event.data?.type === 'STORE_DELETED') {
          if (event.data.data) {
            const incoming = event.data.data;
            const incomingId = incoming.id || incoming._id;
            setLocalStores((prev) => {
              const exists = prev.some((s) => (s.id && s.id === incomingId) || (s._id && s._id === incomingId));
              return exists ? prev.map((s) => ((s.id && s.id === incomingId) || (s._id && s._id === incomingId) ? incoming : s)) : [incoming, ...prev];
            });
          }
          refetchStores();
        }
      };
    }

    return () => {
      window.removeEventListener('store:created', handleStoreChange);
      window.removeEventListener('store:updated', handleStoreChange);
      window.removeEventListener('store:deleted', handleStoreChange);
      window.removeEventListener('stores:cache_cleared', refetchStores);
      if (bc) bc.close();
    };
  }, [refetchStores]);

  const stores = (localStores && localStores.length > 0) ? localStores : initialStores;

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
        <div className="store-nav-arrows" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            className={`store-scroll-arrow-btn ${isRefreshing ? 'animate-spin' : ''}`}
            onClick={refetchStores}
            title="Refresh stores"
            aria-label="Refresh stores"
          >
            <RefreshCw size={14} />
          </button>
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
                  src={(store.logo && !store.logo.includes('null') && !store.logo.includes('undefined')) ? store.logo : (store.imageUrl || store.banner || getFallbackStoreLogo(store.name))} 
                  alt={store.name || 'Store'} 
                  className="store-logo-img"
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = getFallbackStoreLogo(store.name);
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
