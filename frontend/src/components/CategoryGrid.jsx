import React from 'react';
import { Layers, Shirt, Smartphone, Heart, ShoppingCart, Plane, ShoppingBag, Sparkles, Tag, Gift, Tv, Laptop, Watch, Zap } from 'lucide-react';

const ICON_MAP = {
  layers: Layers,
  shirt: Shirt,
  fashion: Shirt,
  clothing: Shirt,
  smartphone: Smartphone,
  electronics: Smartphone,
  heart: Heart,
  health: Heart,
  beauty: Heart,
  shoppingcart: ShoppingCart,
  grocery: ShoppingCart,
  food: ShoppingCart,
  plane: Plane,
  travel: Plane,
  flights: Plane,
  shoppingbag: ShoppingBag,
  sparkles: Sparkles,
  tag: Tag,
  gift: Gift,
  tv: Tv,
  laptop: Laptop,
  watch: Watch,
  zap: Zap
};

const DEFAULT_CATEGORIES = [
  { id: 'all', name: 'All Stores', icon: Layers },
  { id: 'fashion', name: 'Fashion', icon: Shirt },
  { id: 'electronics', name: 'Electronics', icon: Smartphone },
  { id: 'health', name: 'Health & Beauty', icon: Heart },
  { id: 'grocery', name: 'Food & Grocery', icon: ShoppingCart },
  { id: 'travel', name: 'Travel & Flights', icon: Plane },
];

export default function CategoryGrid({ activeCategory, onCategoryChange, categories = [] }) {
  const mergedCategories = React.useMemo(() => {
    const list = [...DEFAULT_CATEGORIES];
    const existingIds = new Set(list.map(c => c.id.toLowerCase()));

    if (categories && Array.isArray(categories)) {
      categories.forEach(cat => {
        if (!cat || !cat.name) return;
        const id = (cat.slug || cat.id || cat.name).toLowerCase().replace(/\s+/g, '-');
        if (!existingIds.has(id) && !existingIds.has(cat.name.toLowerCase())) {
          existingIds.add(id);
          const iconKey = (cat.icon || cat.name || '').toLowerCase().replace(/[^a-z]/g, '');
          const IconComponent = ICON_MAP[iconKey] || ShoppingBag;
          list.push({
            id: id,
            name: cat.name,
            icon: IconComponent
          });
        }
      });
    }
    return list;
  }, [categories]);

  return (
    <div style={{ width: '100%' }}>
      <div className="section-header">
        <div className="section-title-wrap">
          <Layers className="section-icon" size={24} />
          <h3 className="section-title">Shop by Category</h3>
        </div>
      </div>

      <div className="categories-container">
        {mergedCategories.map((cat) => {
          const Icon = cat.icon || ShoppingBag;
          const isActive = activeCategory === cat.id || (activeCategory && activeCategory.toLowerCase() === cat.id.toLowerCase());
          return (
            <div
              key={cat.id}
              className={`category-card ${isActive ? 'active' : ''}`}
              onClick={() => onCategoryChange(cat.id)}
            >
              <div className="category-icon-box">
                <Icon size={22} />
              </div>
              <span className="category-name">{cat.name}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
