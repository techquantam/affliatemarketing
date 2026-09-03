import React, { useState, useMemo, useRef } from 'react';
import { 
  Plus, Edit2, Trash2, Tag, Percent, Upload, CheckCircle, XCircle, 
  Eye, EyeOff, Search, MapPin, User, Phone, Mail, Globe, Image as ImageIcon,
  Building2, ShieldCheck, Check, AlertCircle, RefreshCw
} from 'lucide-react';
import { AdminTable, AdminModal, AdminFormInput, AdminFormSelect, ExportDataButton } from './AdminComponents';
import { apiUpload } from '../services/api';

export default function AdminStores({ 
  stores = [], 
  onAddStore, 
  onEditStore, 
  onToggleStatus, 
  onDeleteStore, 
  onAddNotification 
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null); // null means adding

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'active', 'inactive'
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Shop basic identity fields
  const [name, setName] = useState('');
  const [logo, setLogo] = useState('');
  const [banner, setBanner] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('retail');
  const [link, setLink] = useState('');

  // Owner Details
  const [ownerName, setOwnerName] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');

  // Address & Location
  const [address, setAddress] = useState('');
  const [location, setLocation] = useState('');

  // Commission & Settings
  const [cashbackRate, setCashbackRate] = useState('');
  const [isPopular, setIsPopular] = useState(false);
  const [status, setStatus] = useState('active');

  // Upload states
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const logoInputRef = useRef(null);
  const bannerInputRef = useRef(null);

  // Coupons / Offers (optional)
  const [coupons, setCoupons] = useState([]);
  const [editingCouponIndex, setEditingCouponIndex] = useState(-1);
  const [couponTitle, setCouponTitle] = useState('');
  const [couponDescription, setCouponDescription] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [couponExpiry, setCouponExpiry] = useState('');

  const [formError, setFormError] = useState('');
  const [couponFormError, setCouponFormError] = useState('');

  // Categories list
  const STANDARD_CATEGORIES = [
    { value: 'retail', label: 'Retail & Shopping' },
    { value: 'electronics', label: 'Electronics & Mobiles' },
    { value: 'fashion', label: 'Fashion & Clothing' },
    { value: 'grocery', label: 'Grocery & Supermarket' },
    { value: 'beauty', label: 'Beauty & Personal Care' },
    { value: 'food', label: 'Food, Dining & Cafe' },
    { value: 'pharmacy', label: 'Pharmacy & Healthcare' },
    { value: 'services', label: 'Local Services' },
    { value: 'travel', label: 'Travel & Bookings' },
    { value: 'other', label: 'Other' }
  ];

  // Open modal to add a brand new shop
  const openAddModal = () => {
    setEditItem(null);
    setName('');
    setLogo('');
    setBanner('');
    setDescription('');
    setCategory('retail');
    setLink('');
    setOwnerName('');
    setOwnerPhone('');
    setOwnerEmail('');
    setAddress('');
    setLocation('');
    setCashbackRate('10%');
    setIsPopular(false);
    setStatus('active');
    setCoupons([]);
    resetCouponForm();
    setFormError('');
    setIsModalOpen(true);
  };

  // Open modal to edit existing shop
  const openEditModal = (item) => {
    setEditItem(item);
    setName(item.name || '');
    setLogo(item.logo || '');
    setBanner(item.banner || '');
    setDescription(item.description || '');
    setCategory(item.category || 'retail');
    setLink(item.affiliateUrl || item.link || '');
    setOwnerName(item.ownerName || '');
    setOwnerPhone(item.ownerPhone || '');
    setOwnerEmail(item.ownerEmail || '');
    setAddress(item.address || '');
    setLocation(item.location || '');
    setCashbackRate(item.cashbackRate || '');
    setIsPopular(item.isPopular || false);
    setStatus(item.status || 'active');
    setCoupons(item.coupons ? [...item.coupons] : []);
    resetCouponForm();
    setFormError('');
    setIsModalOpen(true);
  };

  const resetCouponForm = () => {
    setEditingCouponIndex(-1);
    setCouponTitle('');
    setCouponDescription('');
    setCouponCode('');
    setCouponExpiry('');
    setCouponFormError('');
  };

  // Handle Logo file upload
  const handleLogoUpload = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    try {
      setUploadingLogo(true);
      const res = await apiUpload.uploadImage(file);
      if (res && res.url) {
        setLogo(res.url);
        onAddNotification?.('Shop logo uploaded successfully!', 'success');
      }
    } catch (err) {
      console.error(err);
      onAddNotification?.('Failed to upload logo image.', 'error');
    } finally {
      setUploadingLogo(false);
    }
  };

  // Handle Banner file upload
  const handleBannerUpload = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    try {
      setUploadingBanner(true);
      const res = await apiUpload.uploadImage(file);
      if (res && res.url) {
        setBanner(res.url);
        onAddNotification?.('Shop banner uploaded successfully!', 'success');
      }
    } catch (err) {
      console.error(err);
      onAddNotification?.('Failed to upload banner image.', 'error');
    } finally {
      setUploadingBanner(false);
    }
  };

  // Coupon handling
  const handleSaveCoupon = (e) => {
    e.preventDefault();
    setCouponFormError('');
    if (!couponTitle.trim()) {
      setCouponFormError('Coupon title is required.');
      return;
    }

    const newCoupon = {
      id: editingCouponIndex >= 0 && coupons[editingCouponIndex]?.id 
          ? coupons[editingCouponIndex].id 
          : `coupon-${Date.now()}`,
      title: couponTitle,
      description: couponDescription,
      code: couponCode,
      expiry: couponExpiry
    };

    if (editingCouponIndex >= 0) {
      const updatedCoupons = [...coupons];
      updatedCoupons[editingCouponIndex] = newCoupon;
      setCoupons(updatedCoupons);
    } else {
      setCoupons([...coupons, newCoupon]);
    }
    resetCouponForm();
  };

  const removeCoupon = (idx) => {
    const updated = [...coupons];
    updated.splice(idx, 1);
    setCoupons(updated);
  };

  const editCoupon = (idx) => {
    const c = coupons[idx];
    setEditingCouponIndex(idx);
    setCouponTitle(c.title || '');
    setCouponDescription(c.description || '');
    setCouponCode(c.code || '');
    setCouponExpiry(c.expiry || '');
  };

  // Save Shop (Create or Update)
  const handleSaveStore = (e) => {
    e.preventDefault();
    setFormError('');

    if (!name.trim()) {
      setFormError('Shop Name is required.');
      return;
    }

    const shopData = {
      name: name.trim(),
      logo: logo.trim(),
      banner: banner.trim(),
      cashbackRate: cashbackRate.trim() || '10%',
      description: description.trim(),
      category: category || 'retail',
      ownerName: ownerName.trim(),
      ownerPhone: ownerPhone.trim(),
      ownerEmail: ownerEmail.trim(),
      address: address.trim(),
      location: location.trim(),
      link: link.trim(),
      affiliateUrl: link.trim(),
      isPopular: Boolean(isPopular),
      status: status || 'active',
      coupons: coupons || []
    };

    if (editItem) {
      onEditStore({ ...editItem, ...shopData });
    } else {
      onAddStore(shopData);
    }

    setIsModalOpen(false);
  };

  // Quick 1-click Enable/Disable toggle
  const handleToggleShopStatus = (item) => {
    if (onToggleStatus) {
      onToggleStatus(item.id);
    } else {
      const newStatus = item.status === 'active' ? 'inactive' : 'active';
      onEditStore({ ...item, status: newStatus });
    }
  };

  // Filtered shops list based on search and status
  const filteredStores = useMemo(() => {
    return stores.filter(store => {
      // Status filter
      if (statusFilter === 'active' && store.status !== 'active') return false;
      if (statusFilter === 'inactive' && store.status === 'active') return false;

      // Category filter
      if (categoryFilter !== 'all' && store.category !== categoryFilter) return false;

      // Search term
      if (!searchTerm.trim()) return true;
      const q = searchTerm.toLowerCase().trim();
      const sName = (store.name || '').toLowerCase();
      const sOwner = (store.ownerName || '').toLowerCase();
      const sPhone = (store.ownerPhone || '').toLowerCase();
      const sEmail = (store.ownerEmail || '').toLowerCase();
      const sAddr = (store.address || '').toLowerCase();
      const sLoc = (store.location || '').toLowerCase();
      const sCat = (store.category || '').toLowerCase();
      return sName.includes(q) || sOwner.includes(q) || sPhone.includes(q) || sEmail.includes(q) || sAddr.includes(q) || sLoc.includes(q) || sCat.includes(q);
    });
  }, [stores, searchTerm, statusFilter, categoryFilter]);

  const headers = ['Logo / Banner', 'Shop Name & Category', 'Owner Details', 'Address / Location', 'Commission', 'Status', 'Actions'];

  const renderRow = (item) => {
    const isActive = item.status === 'active';

    return (
      <tr key={item.id} className="animate-fade">
        {/* Logo & Banner Thumbnail */}
        <td>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              backgroundColor: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              flexShrink: 0
            }}>
              {item.logo ? (
                <img src={item.logo} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '4px' }} />
              ) : (
                <Building2 size={20} color="var(--text-muted, #94a3b8)" />
              )}
            </div>
            {item.banner && (
              <div 
                title="Custom Banner Added"
                style={{
                  width: '54px',
                  height: '28px',
                  borderRadius: '4px',
                  border: '1px solid var(--border)',
                  overflow: 'hidden',
                  flexShrink: 0,
                  display: 'inline-block'
                }}
              >
                <img src={item.banner} alt="Banner" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            )}
          </div>
        </td>

        {/* Shop Name & Category */}
        <td>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ fontWeight: '700', fontSize: '14px', color: 'var(--text-bold)' }}>
              {item.name} {item.isPopular ? '⭐' : ''}
            </span>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
              {item.category || 'General Store'}
            </span>
          </div>
        </td>

        {/* Owner Details */}
        <td>
          {item.ownerName || item.ownerPhone || item.ownerEmail ? (
            <div style={{ fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {item.ownerName && (
                <span style={{ fontWeight: '600', color: 'var(--text-bold)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <User size={12} /> {item.ownerName}
                </span>
              )}
              {item.ownerPhone && (
                <a href={`tel:${item.ownerPhone}`} style={{ color: 'var(--primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Phone size={12} /> {item.ownerPhone}
                </a>
              )}
              {item.ownerEmail && (
                <a href={`mailto:${item.ownerEmail}`} style={{ color: 'var(--text-muted)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Mail size={12} /> {item.ownerEmail}
                </a>
              )}
            </div>
          ) : (
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic' }}>Not specified</span>
          )}
        </td>

        {/* Address / Location */}
        <td>
          {item.address || item.location ? (
            <div style={{ fontSize: '12px', display: 'flex', alignItems: 'flex-start', gap: '4px', maxWidth: '180px' }}>
              <MapPin size={14} style={{ color: '#ef4444', flexShrink: 0, marginTop: '2px' }} />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {item.address && <span>{item.address}</span>}
                {item.location && <strong style={{ color: 'var(--text-bold)' }}>{item.location}</strong>}
              </div>
            </div>
          ) : (
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic' }}>Online / Global</span>
          )}
        </td>

        {/* Commission */}
        <td>
          <span style={{ fontWeight: '700', color: '#10b981', fontSize: '13px' }}>
            {item.cashbackRate || '10%'}
          </span>
          {item.coupons && item.coupons.length > 0 && (
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '3px' }}>
              <Tag size={11} color="var(--primary)" /> {item.coupons.length} offers
            </div>
          )}
        </td>

        {/* Status Badge */}
        <td>
          <span 
            className={`status-badge ${isActive ? 'active' : 'inactive'}`}
            style={{
              padding: '4px 10px',
              borderRadius: '20px',
              fontSize: '11px',
              fontWeight: '700',
              textTransform: 'uppercase',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            {isActive ? <CheckCircle size={12} /> : <XCircle size={12} />}
            {isActive ? 'Active' : 'Disabled'}
          </span>
        </td>

        {/* Action Buttons */}
        <td>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {/* 1-Click Enable / Disable button */}
            <button
              className="admin-btn-icon"
              onClick={() => handleToggleShopStatus(item)}
              title={isActive ? 'Disable this Shop (Hide from Users)' : 'Enable this Shop (Show to Users)'}
              style={{
                backgroundColor: isActive ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
                color: isActive ? '#ef4444' : '#10b981',
                border: 'none',
                borderRadius: '6px',
                padding: '6px',
                cursor: 'pointer'
              }}
            >
              {isActive ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>

            {/* Edit Button */}
            <button 
              className="admin-btn-icon edit" 
              onClick={() => openEditModal(item)} 
              title="Edit Shop Details"
            >
              <Edit2 size={14} />
            </button>

            {/* Delete Button */}
            <button 
              className="admin-btn-icon delete" 
              onClick={() => {
                if (window.confirm(`Are you sure you want to permanently delete "${item.name}"?`)) {
                  onDeleteStore(item.id);
                }
              }} 
              title="Delete Shop"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </td>
      </tr>
    );
  };

  const exportColumns = [
    { header: 'Shop Name', dataKey: 'name' },
    { header: 'Category', dataKey: 'category' },
    { header: 'Owner Name', dataKey: 'ownerName' },
    { header: 'Owner Mobile', dataKey: 'ownerPhone' },
    { header: 'Owner Email', dataKey: 'ownerEmail' },
    { header: 'Address', dataKey: 'address' },
    { header: 'Location', dataKey: 'location' },
    { header: 'Commission Rate', dataKey: 'cashbackRate' },
    { header: 'Status', dataKey: 'status' }
  ];

  return (
    <div className="admin-stores-tab animate-fade">
      {/* Header with Title and "Add New Shop" Button */}
      <div className="admin-page-header">
        <div className="admin-page-title">
          <h2>Shop Management</h2>
          <p>Create and manage custom shops, retail partners, commission rates, owner details, and shop status</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <ExportDataButton data={stores} columns={exportColumns} filename="Shops" />
          <button 
            className="admin-btn admin-btn-primary" 
            onClick={openAddModal}
            style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '8px', 
              padding: '10px 18px', 
              fontWeight: '700',
              fontSize: '14px',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(255,79,47,0.2)'
            }}
          >
            <Plus size={18} />
            Add New Shop
          </button>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div style={{
        display: 'flex',
        gap: '12px',
        marginBottom: '18px',
        flexWrap: 'wrap',
        backgroundColor: 'var(--card-bg)',
        padding: '14px 16px',
        borderRadius: '10px',
        border: '1px solid var(--border)'
      }}>
        <div style={{
          flex: 1,
          minWidth: '240px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          backgroundColor: 'var(--bg)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          padding: '8px 12px'
        }}>
          <Search size={16} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="Search shops by name, owner, phone, city, address..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              border: 'none',
              outline: 'none',
              backgroundColor: 'transparent',
              fontSize: '13px',
              color: 'var(--text-bold)',
              width: '100%'
            }}
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')} 
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0 }}
            >
              ✕
            </button>
          )}
        </div>

        {/* Category Filter */}
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          style={{
            padding: '8px 12px',
            borderRadius: '8px',
            border: '1px solid var(--border)',
            backgroundColor: 'var(--bg)',
            color: 'var(--text-bold)',
            fontSize: '13px'
          }}
        >
          <option value="all">All Categories</option>
          {STANDARD_CATEGORIES.map(c => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{
            padding: '8px 12px',
            borderRadius: '8px',
            border: '1px solid var(--border)',
            backgroundColor: 'var(--bg)',
            color: 'var(--text-bold)',
            fontSize: '13px'
          }}
        >
          <option value="all">All Statuses ({stores.length})</option>
          <option value="active">Active Only ({stores.filter(s => s.status === 'active').length})</option>
          <option value="inactive">Disabled Only ({stores.filter(s => s.status !== 'active').length})</option>
        </select>
      </div>

      {/* Shops Table */}
      <AdminTable
        headers={headers}
        items={filteredStores}
        currentPage={currentPage}
        itemsPerPage={10}
        onPageChange={setCurrentPage}
        renderRow={renderRow}
        emptyMessage={
          searchTerm || statusFilter !== 'all' || categoryFilter !== 'all'
            ? "No shops match your search criteria."
            : "No shops created yet. Click 'Add New Shop' above to add your first custom shop!"
        }
      />

      {/* Add / Edit Shop Modal */}
      <AdminModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editItem ? `Edit Shop: ${editItem.name}` : 'Add New Custom Shop'}
        footer={
          <>
            <button className="admin-btn admin-btn-secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </button>
            <button 
              className="admin-btn admin-btn-primary" 
              onClick={handleSaveStore}
              style={{ fontWeight: '700', padding: '10px 24px' }}
            >
              {editItem ? 'Save Shop Changes' : 'Create & Publish Shop'}
            </button>
          </>
        }
      >
        <div style={{ maxHeight: '72vh', overflowY: 'auto', paddingRight: '8px' }}>
          <form id="shop-form" onSubmit={(e) => e.preventDefault()}>
            {formError && (
              <div style={{ 
                color: '#ef4444', 
                backgroundColor: 'rgba(239,68,68,0.08)',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid rgba(239,68,68,0.2)',
                fontSize: '13px', 
                marginBottom: '16px', 
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <AlertCircle size={16} />
                {formError}
              </div>
            )}

            {/* Section 1: Shop Basic Information */}
            <div style={{ marginBottom: '22px' }}>
              <h3 style={{ fontSize: '15px', color: 'var(--text-bold)', fontWeight: '700', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Building2 size={16} color="var(--primary)" /> Shop Identity & Details
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <AdminFormInput 
                  label="Shop Name *" 
                  id="shop-name" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  placeholder="e.g. Royal Supermarket" 
                  required 
                />
                
                <AdminFormSelect
                  label="Category *"
                  id="shop-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  options={STANDARD_CATEGORIES}
                />
              </div>

              <div style={{ marginTop: '10px' }}>
                <AdminFormInput 
                  label="Shop Website or Target Link" 
                  id="shop-link" 
                  value={link} 
                  onChange={(e) => setLink(e.target.value)} 
                  placeholder="https://example.com or store page URL" 
                />
              </div>

              <div style={{ marginTop: '10px' }}>
                <AdminFormInput 
                  label="Shop Description" 
                  id="shop-desc" 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)} 
                  placeholder="Describe the shop, products offered, and key highlights..." 
                />
              </div>
            </div>

            {/* Section 2: Branding & Media (Logo & Banner) */}
            <div style={{ marginBottom: '22px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
              <h3 style={{ fontSize: '15px', color: 'var(--text-bold)', fontWeight: '700', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ImageIcon size={16} color="var(--primary)" /> Shop Logo & Banner Image
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                {/* Logo Field */}
                <div>
                  <AdminFormInput 
                    label="Shop Logo URL" 
                    id="shop-logo" 
                    value={logo} 
                    onChange={(e) => setLogo(e.target.value)} 
                    placeholder="https://.../logo.png" 
                  />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px' }}>
                    <input 
                      type="file" 
                      ref={logoInputRef} 
                      onChange={handleLogoUpload} 
                      accept="image/*" 
                      style={{ display: 'none' }} 
                    />
                    <button
                      type="button"
                      className="admin-btn admin-btn-secondary"
                      onClick={() => logoInputRef.current && logoInputRef.current.click()}
                      disabled={uploadingLogo}
                      style={{ padding: '6px 12px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                      {uploadingLogo ? <RefreshCw size={12} className="animate-spin" /> : <Upload size={12} />}
                      {uploadingLogo ? 'Uploading...' : 'Upload Logo File'}
                    </button>
                    {logo && (
                      <div style={{ width: '36px', height: '36px', borderRadius: '6px', border: '1px solid var(--border)', overflow: 'hidden', backgroundColor: '#fff' }}>
                        <img src={logo} alt="Logo Preview" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '2px' }} />
                      </div>
                    )}
                  </div>
                </div>

                {/* Banner Field */}
                <div>
                  <AdminFormInput 
                    label="Shop Banner Image URL" 
                    id="shop-banner" 
                    value={banner} 
                    onChange={(e) => setBanner(e.target.value)} 
                    placeholder="https://.../banner.jpg" 
                  />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px' }}>
                    <input 
                      type="file" 
                      ref={bannerInputRef} 
                      onChange={handleBannerUpload} 
                      accept="image/*" 
                      style={{ display: 'none' }} 
                    />
                    <button
                      type="button"
                      className="admin-btn admin-btn-secondary"
                      onClick={() => bannerInputRef.current && bannerInputRef.current.click()}
                      disabled={uploadingBanner}
                      style={{ padding: '6px 12px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                      {uploadingBanner ? <RefreshCw size={12} className="animate-spin" /> : <Upload size={12} />}
                      {uploadingBanner ? 'Uploading...' : 'Upload Banner File'}
                    </button>
                    {banner && (
                      <div style={{ width: '60px', height: '32px', borderRadius: '4px', border: '1px solid var(--border)', overflow: 'hidden' }}>
                        <img src={banner} alt="Banner Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Section 3: Owner Details */}
            <div style={{ marginBottom: '22px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
              <h3 style={{ fontSize: '15px', color: 'var(--text-bold)', fontWeight: '700', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <User size={16} color="var(--primary)" /> Owner / Merchant Details
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
                <AdminFormInput 
                  label="Owner Name" 
                  id="shop-owner-name" 
                  value={ownerName} 
                  onChange={(e) => setOwnerName(e.target.value)} 
                  placeholder="e.g. Ramesh Kumar" 
                />
                <AdminFormInput 
                  label="Mobile / Phone Number" 
                  id="shop-owner-phone" 
                  value={ownerPhone} 
                  onChange={(e) => setOwnerPhone(e.target.value)} 
                  placeholder="e.g. +91 9876543210" 
                />
                <AdminFormInput 
                  label="Email Address" 
                  id="shop-owner-email" 
                  type="email"
                  value={ownerEmail} 
                  onChange={(e) => setOwnerEmail(e.target.value)} 
                  placeholder="e.g. owner@example.com" 
                />
              </div>
            </div>

            {/* Section 4: Address / Location */}
            <div style={{ marginBottom: '22px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
              <h3 style={{ fontSize: '15px', color: 'var(--text-bold)', fontWeight: '700', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MapPin size={16} color="var(--primary)" /> Physical Address & Location
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '14px' }}>
                <AdminFormInput 
                  label="Shop Address" 
                  id="shop-address" 
                  value={address} 
                  onChange={(e) => setAddress(e.target.value)} 
                  placeholder="e.g. Shop #14, Main Market, MG Road" 
                />
                <AdminFormInput 
                  label="City / Area / State" 
                  id="shop-location" 
                  value={location} 
                  onChange={(e) => setLocation(e.target.value)} 
                  placeholder="e.g. Bangalore, Karnataka" 
                />
              </div>
            </div>

            {/* Section 5: Commission, Status & Visibility */}
            <div style={{ marginBottom: '22px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
              <h3 style={{ fontSize: '15px', color: 'var(--text-bold)', fontWeight: '700', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={16} color="var(--primary)" /> Commission & Shop Status
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px', alignItems: 'flex-end' }}>
                <AdminFormInput 
                  label="Commission / Cashback Rate" 
                  id="shop-cb" 
                  value={cashbackRate} 
                  onChange={(e) => setCashbackRate(e.target.value)} 
                  placeholder="e.g. 10% or Flat ₹50" 
                />

                <AdminFormSelect
                  label="Shop Status (Enable / Disable)"
                  id="shop-status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  options={[
                    { value: 'active', label: 'Active (Enabled - Visible to Users)' },
                    { value: 'inactive', label: 'Inactive (Disabled - Hidden from Users)' },
                  ]}
                />

                <div className="admin-form-group" style={{ paddingBottom: '10px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input 
                      type="checkbox" 
                      checked={isPopular} 
                      onChange={(e) => setIsPopular(e.target.checked)} 
                      style={{ width: '16px', height: '16px', accentColor: 'var(--primary)' }} 
                    />
                    <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-bold)' }}>
                      ⭐ Featured / Popular Shop
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Section 6: Promotional Coupons & Offers */}
            <div style={{ marginTop: '22px', paddingTop: '16px', borderTop: '2px dashed var(--border)' }}>
              <h3 style={{ fontSize: '15px', color: 'var(--text-bold)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Percent size={16} color="var(--primary)" /> Promotional Coupons & Offers (Optional)
              </h3>
              
              {/* Existing Coupons List */}
              {coupons.length > 0 && (
                <div style={{ marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {coupons.map((c, idx) => (
                    <div key={idx} style={{ padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '6px', backgroundColor: 'var(--bg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <strong style={{ fontSize: '13px', color: 'var(--text-bold)' }}>{c.title}</strong>
                        {c.code && (
                          <span style={{ marginLeft: '8px', padding: '2px 6px', backgroundColor: 'rgba(255,79,47,0.1)', color: 'var(--primary)', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>
                            {c.code}
                          </span>
                        )}
                        <p style={{ margin: '3px 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
                          {c.description} {c.expiry ? `• Expires: ${c.expiry}` : ''}
                        </p>
                      </div>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button type="button" className="admin-btn-icon edit" onClick={() => editCoupon(idx)}><Edit2 size={13} /></button>
                        <button type="button" className="admin-btn-icon delete" onClick={() => removeCoupon(idx)}><Trash2 size={13} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add/Edit Coupon Form */}
              <div style={{ backgroundColor: 'var(--bg)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <h4 style={{ fontSize: '13px', marginBottom: '10px', color: 'var(--text-bold)' }}>
                  {editingCouponIndex >= 0 ? 'Edit Offer' : 'Add New Offer for this Shop'}
                </h4>
                
                {couponFormError && (
                  <div style={{ color: '#ef4444', fontSize: '12px', marginBottom: '8px', fontWeight: '500' }}>
                    {couponFormError}
                  </div>
                )}
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <AdminFormInput label="Offer Title" id="cpn-title" value={couponTitle} onChange={(e) => setCouponTitle(e.target.value)} placeholder="e.g. Flat 20% Off on First Order" />
                  <AdminFormInput label="Promo Code (Optional)" id="cpn-code" value={couponCode} onChange={(e) => setCouponCode(e.target.value)} placeholder="e.g. WELCOME20" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px', marginTop: '6px' }}>
                  <AdminFormInput label="Terms / Description" id="cpn-desc" value={couponDescription} onChange={(e) => setCouponDescription(e.target.value)} placeholder="Valid on min purchase of ₹499..." />
                  <AdminFormInput label="Expiry Date / Text" id="cpn-expiry" value={couponExpiry} onChange={(e) => setCouponExpiry(e.target.value)} placeholder="e.g. Valid till 31st Oct" />
                </div>
                
                <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                  <button type="button" className="admin-btn admin-btn-secondary" style={{ padding: '6px 14px', fontSize: '12px' }} onClick={handleSaveCoupon}>
                    {editingCouponIndex >= 0 ? 'Update Offer' : 'Add Offer to List'}
                  </button>
                  {editingCouponIndex >= 0 && (
                    <button type="button" className="admin-btn" style={{ padding: '6px 12px', fontSize: '12px', backgroundColor: 'transparent', border: '1px solid var(--border)', color: 'var(--text)' }} onClick={resetCouponForm}>
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            </div>

          </form>
        </div>
      </AdminModal>
    </div>
  );
}
