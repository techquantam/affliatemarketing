import React from 'react';
import { ArrowLeftRight, X, Trash2, ExternalLink } from 'lucide-react';

export default function CompareTray({
  compareList = [],
  onOpenCompare,
  onRemoveItem,
  onClearAll
}) {
  if (!compareList || compareList.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        backgroundColor: 'var(--card-bg, #ffffff)',
        color: 'var(--text-bold, #0f172a)',
        borderRadius: '16px',
        padding: '10px 16px',
        boxShadow: '0 20px 35px -5px rgba(0, 0, 0, 0.3), 0 0 0 1px var(--border, #cbd5e1)',
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        maxWidth: '92vw',
        animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
      }}
    >
      {/* Indicator Pill */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          backgroundColor: '#10b981',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(16, 185, 129, 0.4)'
        }}>
          <ArrowLeftRight size={16} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '13px', fontWeight: '800', lineHeight: 1.1 }}>
            Compare
          </span>
          <span style={{ fontSize: '11px', color: 'var(--text, #64748b)', fontWeight: '600' }}>
            {compareList.length} of 4 items
          </span>
        </div>
      </div>

      {/* Thumbnails preview */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        overflowX: 'auto',
        maxWidth: '380px',
        padding: '2px 0'
      }}>
        {compareList.map((item, index) => {
          const price = typeof item.dealPrice === 'number' && item.dealPrice > 0 ? item.dealPrice : (item.price || 0);
          return (
            <div
              key={item.id || index}
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 8px',
                borderRadius: '8px',
                backgroundColor: 'var(--bg, #f1f5f9)',
                border: '1px solid var(--border, #e2e8f0)',
                flexShrink: 0
              }}
            >
              <img
                src={item.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300'}
                alt={item.title}
                style={{ width: '24px', height: '24px', objectFit: 'contain', borderRadius: '4px' }}
              />
              <div style={{ display: 'flex', flexDirection: 'column', maxWidth: '75px' }}>
                <span style={{ fontSize: '10px', fontWeight: '700', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {item.platform || 'Shop'}
                </span>
                <span style={{ fontSize: '10px', color: '#10b981', fontWeight: '800' }}>
                  ₹{price.toFixed(0)}
                </span>
              </div>
              <button
                onClick={() => onRemoveItem(item.id)}
                title="Remove"
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text, #94a3b8)',
                  padding: '2px',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <X size={12} />
              </button>
            </div>
          );
        })}
      </div>

      {/* Primary Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          onClick={onOpenCompare}
          className="btn-primary"
          style={{
            padding: '8px 14px',
            fontSize: '12px',
            fontWeight: '800',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 4px 12px rgba(255, 79, 47, 0.25)',
            whiteSpace: 'nowrap'
          }}
        >
          Compare Now ({compareList.length})
        </button>

        <button
          onClick={onClearAll}
          title="Clear all"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--text, #94a3b8)',
            padding: '6px',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}
