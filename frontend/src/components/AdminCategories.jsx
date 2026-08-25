import React, { useState, useMemo } from 'react';
import {
  Plus, Edit2, Trash2, Copy, Search, Check, Star, Eye,
  Sparkles, Image as ImageIcon, Smile, ArrowUpDown, Filter,
  CheckCircle2, XCircle, Layers
} from 'lucide-react';
import CategoryIcon, { AVAILABLE_ICONS, POPULAR_COLORS } from './CategoryIcon';
import { AdminTable, AdminModal, AdminFormInput, ExportDataButton } from './AdminComponents';

export default function AdminCategories({
  categories = [],
  onAddCategory,
  onEditCategory,
  onDeleteCategory
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all, active, inactive, featured
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);

  // Form states
  const [catName, setCatName] = useState('');
  const [catSlug, setCatSlug] = useState('');
  const [catDescription, setCatDescription] = useState('');
  const [catIconType, setCatIconType] = useState('lucide'); // 'lucide', 'url', 'emoji'
  const [catIcon, setCatIcon] = useState('Smartphone');
  const [catCustomIconUrl, setCatCustomIconUrl] = useState('');
  const [catBadgeColor, setCatBadgeColor] = useState('#3b82f6');
  const [catDisplayOrder, setCatDisplayOrder] = useState(0);
  const [catFeatured, setCatFeatured] = useState(false);
  const [catStatus, setCatStatus] = useState('active');
  const [formError, setFormError] = useState('');

  // Icon search in picker modal
  const [iconSearch, setIconSearch] = useState('');
  const [iconCategoryFilter, setIconCategoryFilter] = useState('All');

  // Quick Emoji Presets
  const EMOJI_PRESETS = ['📱', '👗', '💄', '🛒', '✈️', '🎮', '💻', '🍕', '🏠', '🎁', '👟', '⌚', '🎧', '⚡', '🌟', '📚', '☕', '🚗', '🧴', '💎'];

  // Categories for icons
  const ICON_CATEGORIES = ['All', 'Tech', 'Fashion', 'Beauty', 'Grocery', 'Food', 'Travel', 'Gaming', 'Entertainment', 'Home', 'Shopping', 'General'];

  const filteredIconLibrary = useMemo(() => {
    return AVAILABLE_ICONS.filter(item => {
      const matchCat = iconCategoryFilter === 'All' || item.category === iconCategoryFilter;
      const matchQuery = !iconSearch || item.name.toLowerCase().includes(iconSearch.toLowerCase());
      return matchCat && matchQuery;
    });
  }, [iconSearch, iconCategoryFilter]);

  // Statistics
  const stats = useMemo(() => {
    const total = categories.length;
    const active = categories.filter(c => c.status === 'active' || c.status === undefined).length;
    const featured = categories.filter(c => c.featured === true).length;
    const customIcons = categories.filter(c => c.iconType === 'url' || c.iconType === 'emoji').length;
    return { total, active, featured, customIcons };
  }, [categories]);

  // Filtered categories for table
  const filteredCategories = useMemo(() => {
    return categories.filter(cat => {
      const matchesSearch =
        (cat.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (cat.slug || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (cat.description || '').toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (statusFilter === 'active') return cat.status === 'active' || cat.status === undefined;
      if (statusFilter === 'inactive') return cat.status === 'inactive';
      if (statusFilter === 'featured') return cat.featured === true;

      return true;
    }).sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
  }, [categories, searchQuery, statusFilter]);

  const openAddModal = () => {
    setEditItem(null);
    setCatName('');
    setCatSlug('');
    setCatDescription('');
    setCatIconType('lucide');
    setCatIcon('Smartphone');
    setCatCustomIconUrl('');
    setCatBadgeColor('#3b82f6');
    setCatDisplayOrder(categories.length + 1);
    setCatFeatured(false);
    setCatStatus('active');
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditItem(item);
    setCatName(item.name || '');
    setCatSlug(item.slug || '');
    setCatDescription(item.description || '');
    setCatIconType(item.iconType || (item.icon && item.icon.startsWith('http') ? 'url' : 'lucide'));
    setCatIcon(item.icon || 'Smartphone');
    setCatCustomIconUrl(item.customIconUrl || (item.icon && item.icon.startsWith('http') ? item.icon : ''));
    setCatBadgeColor(item.badgeColor || '#3b82f6');
    setCatDisplayOrder(item.displayOrder ?? 0);
    setCatFeatured(item.featured || false);
    setCatStatus(item.status || 'active');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleDuplicate = (item) => {
    onAddCategory({
      name: `${item.name} (Copy)`,
      slug: `${item.slug || item.name.toLowerCase().replace(/\s+/g, '-')}-copy`,
      description: item.description || '',
      icon: item.icon || 'ShoppingBag',
      iconType: item.iconType || 'lucide',
      customIconUrl: item.customIconUrl || '',
      badgeColor: item.badgeColor || '#3b82f6',
      displayOrder: (item.displayOrder || 0) + 1,
      featured: false,
      status: 'active'
    });
  };

  const handleToggleStatus = (item) => {
    const nextStatus = item.status === 'inactive' ? 'active' : 'inactive';
    onEditCategory({
      ...item,
      status: nextStatus
    });
  };

  const handleNameChange = (name) => {
    setCatName(name);
    // Auto-generate slug if adding new or slug matches previous auto-slug
    if (!editItem || !catSlug) {
      const generatedSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      setCatSlug(generatedSlug);
    }
  };

  const handleSave = (e) => {
    if (e) e.preventDefault();
    setFormError('');

    if (!catName.trim()) {
      setFormError('Category name is required.');
      return;
    }

    if (!window.confirm(`Are you sure you want to ${editItem ? 'save changes to' : 'create'} this category?`)) {
      return;
    }

    const payload = {
      ...(editItem || {}),
      name: catName.trim(),
      slug: catSlug.trim() || catName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
      description: catDescription.trim(),
      iconType: catIconType,
      icon: catIconType === 'url' ? catCustomIconUrl : catIcon,
      customIconUrl: catIconType === 'url' ? catCustomIconUrl : '',
      badgeColor: catBadgeColor || '#3b82f6',
      displayOrder: parseInt(catDisplayOrder, 10) || 0,
      featured: Boolean(catFeatured),
      status: catStatus || 'active'
    };

    if (editItem) {
      onEditCategory(payload);
    } else {
      onAddCategory(payload);
    }

    setIsModalOpen(false);
  };

  const headers = ['Order', 'Icon & Category', 'Slug', 'Badge Color', 'Featured', 'Status', 'Actions'];

  const renderRow = (item, idx) => {
    const isActive = item.status === 'active' || item.status === undefined;
    return (
      <tr key={item.id || idx} className="animate-fade">
        <td style={{ width: '60px', textAlign: 'center' }}>
          <span style={{
            fontSize: '11px',
            fontWeight: '700',
            backgroundColor: 'var(--border)',
            padding: '2px 8px',
            borderRadius: '12px',
            color: 'var(--text-bold)'
          }}>
            #{item.displayOrder ?? idx + 1}
          </span>
        </td>
        <td>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '8px',
              backgroundColor: `${item.badgeColor || '#3b82f6'}15`,
              border: `1px solid ${item.badgeColor || '#3b82f6'}30`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: item.badgeColor || '#3b82f6',
              flexShrink: 0
            }}>
              <CategoryIcon
                icon={item.icon}
                iconType={item.iconType}
                customIconUrl={item.customIconUrl}
                color={item.badgeColor || '#3b82f6'}
                size={20}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontWeight: '700', color: 'var(--text-bold)', fontSize: '14px' }}>
                {item.name}
              </span>
              {item.description && (
                <span style={{ fontSize: '11px', color: 'var(--text)', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {item.description}
                </span>
              )}
            </div>
          </div>
        </td>
        <td>
          <code style={{ fontSize: '11px', backgroundColor: 'var(--bg)', padding: '2px 6px', borderRadius: '4px', color: 'var(--primary)' }}>
            {item.slug || item.name?.toLowerCase().replace(/\s+/g, '-')}
          </code>
        </td>
        <td>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{
              width: '14px',
              height: '14px',
              borderRadius: '50%',
              backgroundColor: item.badgeColor || '#3b82f6',
              display: 'inline-block',
              boxShadow: '0 0 4px rgba(0,0,0,0.15)'
            }} />
            <span style={{ fontSize: '11px', color: 'var(--text)' }}>
              {item.badgeColor || '#3b82f6'}
            </span>
          </div>
        </td>
        <td>
          {item.featured ? (
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '11px',
              fontWeight: '700',
              color: '#f59e0b',
              backgroundColor: 'rgba(245, 158, 11, 0.1)',
              padding: '2px 8px',
              borderRadius: '12px'
            }}>
              <Star size={12} fill="#f59e0b" /> Featured
            </span>
          ) : (
            <span style={{ fontSize: '11px', color: 'var(--text)', opacity: 0.5 }}>—</span>
          )}
        </td>
        <td>
          <button
            onClick={() => handleToggleStatus(item)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              borderRadius: '12px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '11px',
              fontWeight: '700',
              backgroundColor: isActive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              color: isActive ? '#10b981' : '#ef4444',
              transition: 'all 0.2s'
            }}
            title="Click to toggle status"
          >
            {isActive ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
            {isActive ? 'Active' : 'Inactive'}
          </button>
        </td>
        <td>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              className="admin-btn-icon edit"
              onClick={() => openEditModal(item)}
              title="Edit Category"
            >
              <Edit2 size={13} />
            </button>
            <button
              className="admin-btn-icon"
              style={{ color: 'var(--text)', border: '1px solid var(--border)', background: 'transparent' }}
              onClick={() => handleDuplicate(item)}
              title="Duplicate Category"
            >
              <Copy size={13} />
            </button>
            <button
              className="admin-btn-icon delete"
              onClick={() => {
                if (window.confirm("Are you sure you want to delete this category?")) {
                  onDeleteCategory(item.id);
                }
              }}
              title="Delete Category"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </td>
      </tr>
    );
  };

  const exportColumns = [
    { header: 'Order', dataKey: 'displayOrder' },
    { header: 'Category Name', dataKey: 'name' },
    { header: 'Slug', dataKey: 'slug' },
    { header: 'Icon Symbol', dataKey: 'icon' },
    { header: 'Badge Color', dataKey: 'badgeColor' },
    { header: 'Featured', dataKey: 'featured' },
    { header: 'Status', dataKey: 'status' }
  ];

  return (
    <div className="admin-categories-tab animate-fade">
      {/* Page Header */}
      <div className="admin-page-header">
        <div className="admin-page-title">
          <h2>Category Management</h2>
          <p>Configure storefront categories, icons, colors, display orders, and routing</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <ExportDataButton data={categories} columns={exportColumns} filename="Categories" />
          <button className="admin-btn admin-btn-primary" onClick={openAddModal}>
            <Plus size={16} />
            Add Category
          </button>
        </div>
      </div>

      {/* Summary Statistics Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '14px',
        marginBottom: '20px'
      }}>
        <div className="admin-stat-card" style={{ padding: '14px 16px', borderRadius: '10px', border: '1px solid var(--border)', backgroundColor: 'var(--card-bg)' }}>
          <span style={{ fontSize: '11px', color: 'var(--text)', textTransform: 'uppercase', fontWeight: '700' }}>Total Categories</span>
          <div style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-bold)', marginTop: '4px' }}>{stats.total}</div>
        </div>
        <div className="admin-stat-card" style={{ padding: '14px 16px', borderRadius: '10px', border: '1px solid var(--border)', backgroundColor: 'var(--card-bg)' }}>
          <span style={{ fontSize: '11px', color: '#10b981', textTransform: 'uppercase', fontWeight: '700' }}>Active in Store</span>
          <div style={{ fontSize: '22px', fontWeight: '800', color: '#10b981', marginTop: '4px' }}>{stats.active}</div>
        </div>
        <div className="admin-stat-card" style={{ padding: '14px 16px', borderRadius: '10px', border: '1px solid var(--border)', backgroundColor: 'var(--card-bg)' }}>
          <span style={{ fontSize: '11px', color: '#f59e0b', textTransform: 'uppercase', fontWeight: '700' }}>Featured on Home</span>
          <div style={{ fontSize: '22px', fontWeight: '800', color: '#f59e0b', marginTop: '4px' }}>{stats.featured}</div>
        </div>
        <div className="admin-stat-card" style={{ padding: '14px 16px', borderRadius: '10px', border: '1px solid var(--border)', backgroundColor: 'var(--card-bg)' }}>
          <span style={{ fontSize: '11px', color: '#8b5cf6', textTransform: 'uppercase', fontWeight: '700' }}>Custom Icons/Emojis</span>
          <div style={{ fontSize: '22px', fontWeight: '800', color: '#8b5cf6', marginTop: '4px' }}>{stats.customIcons}</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '16px',
        flexWrap: 'wrap'
      }}>
        {/* Search */}
        <div style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          flex: '1',
          minWidth: '240px',
          maxWidth: '380px'
        }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', color: 'var(--text)', opacity: 0.5 }} />
          <input
            type="text"
            placeholder="Search category name, slug or tagline..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px 8px 36px',
              backgroundColor: 'var(--card-bg)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              fontSize: '13px',
              color: 'var(--text-bold)',
              outline: 'none'
            }}
          />
        </div>

        {/* Status Filter Chips */}
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <Filter size={14} style={{ color: 'var(--text)', opacity: 0.6 }} />
          {['all', 'active', 'inactive', 'featured'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid var(--border)',
                backgroundColor: statusFilter === st ? 'var(--primary)' : 'var(--card-bg)',
                color: statusFilter === st ? '#fff' : 'var(--text)',
                fontSize: '12px',
                fontWeight: statusFilter === st ? '700' : '500',
                cursor: 'pointer',
                textTransform: 'capitalize'
              }}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Main Categories Table */}
      <AdminTable
        headers={headers}
        items={filteredCategories}
        currentPage={currentPage}
        itemsPerPage={8}
        onPageChange={setCurrentPage}
        renderRow={renderRow}
        emptyMessage="No categories matched your criteria."
      />

      {/* Supercharged Add / Edit Category Modal */}
      <AdminModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editItem ? `Edit Category: ${editItem.name}` : 'Add New Category'}
        footer={
          <>
            <button className="admin-btn admin-btn-secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </button>
            <button className="admin-btn admin-btn-primary" onClick={handleSave}>
              {editItem ? 'Save Changes' : 'Create Category'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {formError && (
            <div style={{
              color: '#ef4444',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              padding: '8px 12px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: '600'
            }}>
              {formError}
            </div>
          )}

          {/* Live Store Preview Card */}
          <div style={{
            padding: '12px 16px',
            borderRadius: '10px',
            backgroundColor: 'var(--bg)',
            border: '1px dashed var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                backgroundColor: `${catBadgeColor}20`,
                border: `1px solid ${catBadgeColor}40`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: catBadgeColor
              }}>
                <CategoryIcon
                  icon={catIconType === 'url' ? catCustomIconUrl : catIcon}
                  iconType={catIconType}
                  customIconUrl={catCustomIconUrl}
                  color={catBadgeColor}
                  size={22}
                />
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text)', textTransform: 'uppercase', fontWeight: '700' }}>Storefront Preview</span>
                <h4 style={{ margin: 0, fontSize: '15px', color: 'var(--text-bold)', fontWeight: '800' }}>
                  {catName || 'Category Title'}
                </h4>
              </div>
            </div>
            {catFeatured && (
              <span style={{ fontSize: '11px', color: '#f59e0b', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '3px' }}>
                <Star size={13} fill="#f59e0b" /> Home Hero
              </span>
            )}
          </div>

          {/* Category Name & Slug */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <AdminFormInput
              label="Category Name *"
              id="cat-name"
              type="text"
              placeholder="e.g. Gaming & Consoles"
              value={catName}
              onChange={(e) => handleNameChange(e.target.value)}
            />
            <AdminFormInput
              label="Slug (URL Key)"
              id="cat-slug"
              type="text"
              placeholder="e.g. gaming-consoles"
              value={catSlug}
              onChange={(e) => setCatSlug(e.target.value)}
            />
          </div>

          {/* Description */}
          <AdminFormInput
            label="Tagline / Short Description"
            id="cat-description"
            type="text"
            placeholder="e.g. Save up to 50% on PlayStation, Xbox & PC Gear"
            value={catDescription}
            onChange={(e) => setCatDescription(e.target.value)}
          />

          {/* Icon Type Selection */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-bold)' }}>
              Category Icon Mode
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {[
                { id: 'lucide', label: 'Preset Icons Grid', icon: Sparkles },
                { id: 'url', label: 'Custom Image / SVG URL', icon: ImageIcon },
                { id: 'emoji', label: 'Emoji Icon', icon: Smile }
              ].map(mode => {
                const ModeIcon = mode.icon;
                const isSelected = catIconType === mode.id;
                return (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setCatIconType(mode.id)}
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      padding: '8px',
                      borderRadius: '8px',
                      border: `1px solid ${isSelected ? 'var(--primary)' : 'var(--border)'}`,
                      backgroundColor: isSelected ? 'rgba(var(--primary-rgb, 255, 79, 47), 0.08)' : 'var(--card-bg)',
                      color: isSelected ? 'var(--primary)' : 'var(--text)',
                      fontWeight: isSelected ? '700' : '500',
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    <ModeIcon size={14} />
                    {mode.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Mode 1: Lucide Icon Library */}
          {catIconType === 'lucide' && (
            <div style={{
              border: '1px solid var(--border)',
              borderRadius: '8px',
              padding: '12px',
              backgroundColor: 'var(--card-bg)',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
                <input
                  type="text"
                  placeholder="Search 50+ icons..."
                  value={iconSearch}
                  onChange={(e) => setIconSearch(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '6px 10px',
                    fontSize: '12px',
                    borderRadius: '6px',
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--bg)',
                    color: 'var(--text-bold)',
                    outline: 'none'
                  }}
                />
                <select
                  value={iconCategoryFilter}
                  onChange={(e) => setIconCategoryFilter(e.target.value)}
                  style={{
                    padding: '6px 10px',
                    fontSize: '12px',
                    borderRadius: '6px',
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--bg)',
                    color: 'var(--text-bold)',
                    outline: 'none'
                  }}
                >
                  {ICON_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {/* Icon Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(42px, 1fr))',
                gap: '8px',
                maxHeight: '160px',
                overflowY: 'auto',
                padding: '4px'
              }}>
                {filteredIconLibrary.map((item) => {
                  const IconComp = item.icon;
                  const isSelected = catIcon === item.name;
                  return (
                    <button
                      key={item.name}
                      type="button"
                      onClick={() => setCatIcon(item.name)}
                      title={item.name}
                      style={{
                        height: '42px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '6px',
                        border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border)',
                        backgroundColor: isSelected ? 'rgba(var(--primary-rgb, 255, 79, 47), 0.12)' : 'var(--bg)',
                        color: isSelected ? 'var(--primary)' : 'var(--text)',
                        cursor: 'pointer',
                        transition: 'all 0.15s'
                      }}
                    >
                      <IconComp size={18} />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Mode 2: Custom Image URL */}
          {catIconType === 'url' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <AdminFormInput
                label="Custom Image or SVG URL"
                id="cat-custom-icon"
                type="url"
                placeholder="https://example.com/icons/category.svg or https://images.unsplash.com/..."
                value={catCustomIconUrl}
                onChange={(e) => setCatCustomIconUrl(e.target.value)}
              />
              <span style={{ fontSize: '11px', color: 'var(--text)' }}>
                Tip: Paste any transparent PNG, WebP, or SVG URL.
              </span>
            </div>
          )}

          {/* Mode 3: Emoji Selector */}
          {catIconType === 'emoji' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <AdminFormInput
                label="Emoji Symbol"
                id="cat-emoji"
                type="text"
                placeholder="Type or paste any emoji (e.g. 📱, 👗, 🎮)"
                value={catIcon}
                onChange={(e) => setCatIcon(e.target.value)}
              />
              <div>
                <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-bold)', display: 'block', marginBottom: '6px' }}>
                  Popular Preset Emojis:
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {EMOJI_PRESETS.map((em) => (
                    <button
                      key={em}
                      type="button"
                      onClick={() => setCatIcon(em)}
                      style={{
                        width: '36px',
                        height: '36px',
                        fontSize: '18px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '6px',
                        border: catIcon === em ? '2px solid var(--primary)' : '1px solid var(--border)',
                        backgroundColor: catIcon === em ? 'rgba(var(--primary-rgb, 255, 79, 47), 0.1)' : 'var(--card-bg)',
                        cursor: 'pointer'
                      }}
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Accent Color Selection */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-bold)' }}>
              Accent Theme Color
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              {POPULAR_COLORS.map((col) => (
                <button
                  key={col.value}
                  type="button"
                  onClick={() => setCatBadgeColor(col.value)}
                  title={col.name}
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    backgroundColor: col.value,
                    border: catBadgeColor === col.value ? '2px solid #fff' : '2px solid transparent',
                    boxShadow: catBadgeColor === col.value ? '0 0 0 2px var(--primary)' : 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {catBadgeColor === col.value && <Check size={14} color="#fff" />}
                </button>
              ))}
              <input
                type="color"
                value={catBadgeColor}
                onChange={(e) => setCatBadgeColor(e.target.value)}
                style={{
                  width: '32px',
                  height: '32px',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  backgroundColor: 'transparent'
                }}
                title="Custom Color"
              />
              <span style={{ fontSize: '12px', color: 'var(--text)', fontFamily: 'monospace' }}>
                {catBadgeColor}
              </span>
            </div>
          </div>

          {/* Display Order, Featured & Status Controls */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', alignItems: 'center' }}>
            <AdminFormInput
              label="Display Order"
              id="cat-order"
              type="number"
              min="0"
              placeholder="0"
              value={catDisplayOrder}
              onChange={(e) => setCatDisplayOrder(e.target.value)}
            />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-bold)' }}>
                Featured on Home
              </label>
              <button
                type="button"
                onClick={() => setCatFeatured(!catFeatured)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: `1px solid ${catFeatured ? '#f59e0b' : 'var(--border)'}`,
                  backgroundColor: catFeatured ? 'rgba(245, 158, 11, 0.1)' : 'var(--card-bg)',
                  color: catFeatured ? '#f59e0b' : 'var(--text)',
                  fontWeight: '700',
                  fontSize: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Star size={14} fill={catFeatured ? '#f59e0b' : 'none'} />
                {catFeatured ? 'Featured (Yes)' : 'Standard (No)'}
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-bold)' }}>
                Status
              </label>
              <button
                type="button"
                onClick={() => setCatStatus(catStatus === 'active' ? 'inactive' : 'active')}
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: `1px solid ${catStatus === 'active' ? '#10b981' : 'var(--border)'}`,
                  backgroundColor: catStatus === 'active' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                  color: catStatus === 'active' ? '#10b981' : '#ef4444',
                  fontWeight: '700',
                  fontSize: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                {catStatus === 'active' ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                {catStatus === 'active' ? 'Active' : 'Inactive'}
              </button>
            </div>
          </div>
        </form>
      </AdminModal>
    </div>
  );
}
