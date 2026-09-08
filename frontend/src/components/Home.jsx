import React, { useState, useEffect, useCallback } from 'react';
import StoreGrid from './StoreGrid';
import { apiStores } from '../services/api';

/**
 * Home component managing the live store list.
 * Calls store list API in useEffect and ensures state updates immediately after a new store is added.
 */
export default function Home({ onStoreSelect, initialStores = [] }) {
  const [stores, setStores] = useState(initialStores);
  const [loading, setLoading] = useState(!initialStores || initialStores.length === 0);
  const [error, setError] = useState(null);

  // Fetch active stores from API
  const fetchStores = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiStores.getAll({ status: 'active', is_active: 1 });
      if (res && Array.isArray(res)) {
        // Ensure active and approved stores, sorted latest first
        const activeOnly = res.filter(s => {
          if (!s) return false;
          if (s.isActive === false || s.is_active === 0 || s.is_active === false) return false;
          const st = String(s.status || '').toLowerCase().trim();
          if (st === 'inactive' || st === 'disabled' || st === 'pending' || st === '0') return false;
          if (s.is_approved !== undefined && s.is_approved !== null && (s.is_approved === 0 || s.is_approved === false)) return false;
          return true;
        });
        setStores(activeOnly);
      }
    } catch (err) {
      console.error('Failed to fetch stores in Home:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Call store list API in useEffect on mount
  useEffect(() => {
    fetchStores();
  }, [fetchStores]);

  // Ensure state updates immediately when a new store is added or updated
  useEffect(() => {
    const handleStoreCreated = (e) => {
      if (e?.detail) {
        const newStore = e.detail;
        const sid = newStore.id || newStore._id;
        // Verify store is active and approved
        const isActive = newStore.isActive !== false && newStore.is_active !== 0 && String(newStore.status || 'active').toLowerCase() !== 'inactive';
        if (isActive) {
          setStores((prev) => {
            const arr = Array.isArray(prev) ? prev : [];
            const exists = arr.some((s) => (s.id && s.id === sid) || (s._id && s._id === sid));
            return exists ? arr.map((s) => ((s.id && s.id === sid) || (s._id && s._id === sid) ? newStore : s)) : [newStore, ...arr];
          });
        }
      }
      fetchStores();
    };

    const handleStoresCacheCleared = () => {
      fetchStores();
    };

    window.addEventListener('store:created', handleStoreCreated);
    window.addEventListener('store:updated', handleStoreCreated);
    window.addEventListener('stores:cache_cleared', handleStoresCacheCleared);
    window.addEventListener('focus', handleStoresCacheCleared);

    let bc;
    if (typeof BroadcastChannel !== 'undefined') {
      bc = new BroadcastChannel('affiliate_admin_sync');
      bc.onmessage = (event) => {
        if (event.data?.type === 'STORE_CREATED' && event.data?.data) {
          handleStoreCreated({ detail: event.data.data });
        } else if (event.data?.type === 'STORE_UPDATED' || event.data?.type === 'STORE_DELETED') {
          fetchStores();
        }
      };
    }

    return () => {
      window.removeEventListener('store:created', handleStoreCreated);
      window.removeEventListener('store:updated', handleStoreCreated);
      window.removeEventListener('stores:cache_cleared', handleStoresCacheCleared);
      window.removeEventListener('focus', handleStoresCacheCleared);
      if (bc) bc.close();
    };
  }, [fetchStores]);

  return (
    <div className="home-container">
      <StoreGrid 
        stores={stores} 
        onStoreSelect={onStoreSelect || (() => {})} 
        onRefresh={fetchStores}
      />
    </div>
  );
}
