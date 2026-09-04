import React from 'react';
import { Layers } from 'lucide-react';
import CategoryIcon from './CategoryIcon';

const DEFAULT_CATEGORIES = [
  { id: 'all', slug: 'all', name: 'All Stores', icon: 'Layers', badgeColor: '#3b82f6' },
  { id: 'fashion', slug: 'fashion', name: 'Fashion', icon: 'Shirt', badgeColor: '#ec4899' },
  { id: 'electronics', slug: 'electronics', name: 'Electronics', icon: 'Smartphone', badgeColor: '#3b82f6' },
  { id: 'health', slug: 'health', name: 'Health & Beauty', icon: 'Heart', badgeColor: '#10b981' },
  { id: 'grocery', slug: 'grocery', name: 'Food & Grocery', icon: 'ShoppingBag', badgeColor: '#f59e0b' },
  { id: 'travel', slug: 'travel', name: 'Travel & Flights', icon: 'Plane', badgeColor: '#8b5cf6' },
];

export default function CategoryGrid({ activeCategory, onCategoryChange, categories = [], isScrolled = false }) {
  const mergedCategories = React.useMemo(() => {
    // If admin categories are provided from backend/admin state
    if (categories && Array.isArray(categories) && categories.length > 0) {
      const activeOnly = categories.filter(c => c && (c.status === 'active' || c.status === undefined));
      
      const adminList = activeOnly.map(c => ({
        id: (c.slug || c.id || c.name).toLowerCase().replace(/\s+/g, '-'),
        slug: c.slug || c.id || c.name,
        name: c.name,
        icon: c.icon,
        iconType: c.iconType,
        customIconUrl: c.customIconUrl,
        badgeColor: c.badgeColor || '#3b82f6',
        displayOrder: c.displayOrder ?? 0,
        featured: c.featured
      })).sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));

      return [
        { id: 'all', slug: 'all', name: 'All Stores', icon: 'Layers', badgeColor: 'var(--primary)' },
        ...adminList
      ];
    }

    return DEFAULT_CATEGORIES;
  }, [categories]);

  return (
    <div className={`category-grid-sticky-wrapper ${isScrolled ? 'is-scrolled' : ''}`} style={{ width: '100%' }}>
      {!isScrolled && (
        <div className="section-header category-sticky-header">
          <div className="section-title-wrap">
            <Layers className="section-icon" size={16} />
            <h3 className="section-title">Shop by Category</h3>
          </div>
        </div>
      )}

      <div className={`categories-container ${isScrolled ? 'is-scrolled' : ''}`}>
        {mergedCategories.map((cat) => {
          const isActive = activeCategory === cat.id || 
            (activeCategory && cat.slug && activeCategory.toLowerCase() === cat.slug.toLowerCase()) ||
            (activeCategory && activeCategory.toLowerCase() === cat.name.toLowerCase());

          return (
            <div
              key={cat.id || cat.slug || cat.name}
              className={`category-card ${isActive ? 'active' : ''} ${isScrolled ? 'is-scrolled' : ''}`}
              onClick={() => onCategoryChange(cat.slug || cat.id)}
            >
              <div 
                className={`category-icon-box ${isScrolled ? 'is-scrolled' : ''}`}
                style={{
                  color: cat.badgeColor || 'var(--primary)',
                  borderColor: isActive ? (cat.badgeColor || 'var(--primary)') : undefined
                }}
              >
                <CategoryIcon
                  icon={cat.icon}
                  iconType={cat.iconType}
                  customIconUrl={cat.customIconUrl}
                  color={isActive ? '#fff' : (cat.badgeColor || 'var(--primary)')}
                  size={isScrolled ? 11 : 14}
                />
              </div>
              <span className="category-name">{cat.name}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
