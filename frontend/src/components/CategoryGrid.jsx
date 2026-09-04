import React from 'react';
import { 
  Layers, Laptop, Smartphone, Shirt, ShoppingBag, 
  Heart, Sparkles, BookOpen, Activity, Compass, Plane
} from 'lucide-react';
import CategoryIcon from './CategoryIcon';

const DEFAULT_CATEGORIES = [
  { id: 'all', slug: 'all', name: 'All Stores', icon: 'Layers' },
  { id: 'digital-product', slug: 'digital-product', name: 'Digital product', icon: 'Laptop' },
  { id: 'electronics', slug: 'electronics', name: 'Electronics', icon: 'Smartphone' },
  { id: 'fashion', slug: 'fashion', name: 'Fashion', icon: 'Shirt' },
  { id: 'groceries', slug: 'groceries', name: 'Groceries', icon: 'ShoppingBag' },
  { id: 'health-beauty', slug: 'health-beauty', name: 'Health & Beauty', icon: 'Heart' },
  { id: 'smart-fashion', slug: 'smart-fashion', name: 'Smart fashion', icon: 'Sparkles' },
  { id: 'beauty', slug: 'beauty', name: 'Beauty', icon: 'Sparkles' },
  { id: 'books', slug: 'books', name: 'Books', icon: 'BookOpen' },
  { id: 'sports', slug: 'sports', name: 'Sports', icon: 'Activity' },
];

export default function CategoryGrid({ activeCategory, onCategoryChange, categories = [] }) {
  const mergedCategories = React.useMemo(() => {
    // If admin categories are provided from backend/admin state
    if (categories && Array.isArray(categories) && categories.length > 0) {
      const activeOnly = categories.filter(c => c && (c.status === 'active' || c.status === undefined));
      if (activeOnly.length > 0) {
        const adminList = activeOnly.map(c => ({
          id: (c.slug || c.id || c.name).toLowerCase().replace(/\s+/g, '-'),
          slug: c.slug || c.id || c.name,
          name: c.name,
          icon: c.icon || 'Sparkles',
          iconType: c.iconType,
          customIconUrl: c.customIconUrl,
          displayOrder: c.displayOrder ?? 0
        })).sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));

        return [
          { id: 'all', slug: 'all', name: 'All Stores', icon: 'Layers' },
          ...adminList
        ];
      }
    }

    return DEFAULT_CATEGORIES;
  }, [categories]);

  return (
    <div className="category-filter-bar-container">
      <div className="category-filter-scroll">
        {mergedCategories.map((cat) => {
          const isActive = (!activeCategory && (cat.id === 'all' || cat.slug === 'all')) ||
            activeCategory === cat.id || 
            (activeCategory && cat.slug && activeCategory.toLowerCase() === cat.slug.toLowerCase()) ||
            (activeCategory && activeCategory.toLowerCase() === cat.name.toLowerCase());

          return (
            <button
              key={cat.id || cat.slug || cat.name}
              type="button"
              className={`category-filter-chip ${isActive ? 'active' : ''}`}
              onClick={() => onCategoryChange(cat.slug || cat.id)}
            >
              <span className="category-chip-icon">
                <CategoryIcon
                  icon={cat.icon}
                  iconType={cat.iconType}
                  customIconUrl={cat.customIconUrl}
                  color={isActive ? '#FF4D00' : 'currentColor'}
                  size={15}
                />
              </span>
              <span className="category-chip-label">{cat.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
