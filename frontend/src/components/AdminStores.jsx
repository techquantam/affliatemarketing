import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Tag, Percent } from 'lucide-react';
import { AdminTable, AdminModal, AdminFormInput, AdminFormSelect, ExportDataButton } from './AdminComponents';

export default function AdminStores({ stores, onAddStore, onEditStore, onDeleteStore, onAddNotification }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null); // null means adding

  // Store basic fields
  const [name, setName] = useState('');
  const [logo, setLogo] = useState('');
  const [cashbackRate, setCashbackRate] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [isPopular, setIsPopular] = useState(false);
  const [status, setStatus] = useState('active');

  // Coupons
  const [coupons, setCoupons] = useState([]);
  const [editingCouponIndex, setEditingCouponIndex] = useState(-1);
  
  // New/Edit Coupon form
  const [couponTitle, setCouponTitle] = useState('');
  const [couponDescription, setCouponDescription] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [couponExpiry, setCouponExpiry] = useState('');

  const [formError, setFormError] = useState('');
  const [couponFormError, setCouponFormError] = useState('');

  const openAddModal = () => {
    setEditItem(null);
    setName('');
    setLogo('');
    setCashbackRate('');
    setDescription('');
    setCategory('electronics');
    setIsPopular(false);
    setStatus('active');
    setCoupons([]);
    resetCouponForm();
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditItem(item);
    setName(item.name || '');
    setLogo(item.logo || '');
    setCashbackRate(item.cashbackRate || '');
    setDescription(item.description || '');
    setCategory(item.category || 'electronics');
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

  const handleSaveCoupon = (e) => {
    e.preventDefault();
    setCouponFormError('');
    if (!couponTitle.trim()) {
      setCouponFormError('Coupon title is required.');
      return;
    }

    const newCoupon = {
      id: editingCouponIndex >= 0 && coupons[editingCouponIndex].id 
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

  const handleSaveStore = (e) => {
    e.preventDefault();
    setFormError('');

    if (!name.trim()) {
      setFormError('Store name is required.');
      return;
    }

    if (!window.confirm(`Are you sure you want to ${editItem ? 'save changes to' : 'create'} this store?`)) {
      return;
    }

    const storeData = {
      name,
      logo,
      cashbackRate,
      description,
      category,
      isPopular,
      status,
      coupons
    };

    if (editItem) {
      onEditStore({ ...editItem, ...storeData });
    } else {
      onAddStore(storeData);
    }

    setIsModalOpen(false);
  };

  const headers = ['Logo', 'Store Name', 'Category', 'Commission', 'Coupons', 'Status', 'Actions'];

  const renderRow = (item) => (
    <tr key={item.id} className="animate-fade">
      <td>
        <img src={item.logo} alt={item.name} style={{ width: '40px', height: '40px', objectFit: 'contain', borderRadius: '4px', backgroundColor: 'var(--bg)' }} />
      </td>
      <td style={{ fontWeight: '600', color: 'var(--text-bold)' }}>{item.name} {item.isPopular ? '⭐' : ''}</td>
      <td style={{ textTransform: 'capitalize' }}>{item.category}</td>
      <td style={{ color: 'var(--secondary)', fontWeight: 'bold' }}>{item.cashbackRate}</td>
      <td>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Tag size={14} color="var(--primary)" />
          <strong>{item.coupons ? item.coupons.length : 0}</strong> active
        </div>
      </td>
      <td>
        <span className={`status-badge ${item.status}`}>{item.status}</span>
      </td>
      <td>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="admin-btn-icon edit" onClick={() => openEditModal(item)} title="Edit Store & Coupons">
            <Edit2 size={14} />
          </button>
          <button className="admin-btn-icon delete" onClick={() => {
            if (window.confirm("Are you sure you want to delete this store?")) {
              onDeleteStore(item.id);
            }
          }} title="Delete Store">
            <Trash2 size={14} />
          </button>
        </div>
      </td>
    </tr>
  );

  const exportColumns = [
    { header: 'Store Name', dataKey: 'name' },
    { header: 'Category', dataKey: 'category' },
    { header: 'Commission Rate', dataKey: 'cashbackRate' },
    { header: 'Popular', dataKey: 'isPopular' },
    { header: 'Status', dataKey: 'status' }
  ];

  return (
    <div className="admin-stores-tab animate-fade">
      <div className="admin-page-header">
        <div className="admin-page-title">
          <h2>Stores & Offers</h2>
          <p>Manage retail partners, cashback rates, and active promotional coupons</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <ExportDataButton data={stores} columns={exportColumns} filename="Stores" />
          <button className="admin-btn admin-btn-primary" onClick={openAddModal}>
            <Plus size={16} />
            Add Store
          </button>
        </div>
      </div>

      <AdminTable
        headers={headers}
        items={stores}
        currentPage={currentPage}
        itemsPerPage={10}
        onPageChange={setCurrentPage}
        renderRow={renderRow}
        emptyMessage="No stores available."
      />

      <AdminModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editItem ? 'Edit Store & Coupons' : 'Add Store'}
        footer={
          <>
            <button className="admin-btn admin-btn-secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </button>
            <button className="admin-btn admin-btn-primary" onClick={handleSaveStore}>
              Save Store Data
            </button>
          </>
        }
      >
        <div style={{ maxHeight: '65vh', overflowY: 'auto', paddingRight: '8px' }}>
          <form id="store-form" onSubmit={(e) => e.preventDefault()}>
            {formError && (
              <div style={{ color: '#ef4444', fontSize: '13px', marginBottom: '12px', fontWeight: '500' }}>
                {formError}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <AdminFormInput label="Store Name" id="store-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Amazon" />
              <AdminFormInput label="Logo URL" id="store-logo" value={logo} onChange={(e) => setLogo(e.target.value)} placeholder="https://..." />
              <AdminFormInput label="Commission Rate (Display)" id="store-cb" value={cashbackRate} onChange={(e) => setCashbackRate(e.target.value)} placeholder="e.g. 5%" />
              <AdminFormSelect
                label="Category"
                id="store-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                options={[
                  { value: 'electronics', label: 'Electronics' },
                  { value: 'fashion', label: 'Fashion' },
                  { value: 'beauty', label: 'Beauty' },
                  { value: 'travel', label: 'Travel' },
                  { value: 'grocery', label: 'Grocery' },
                  { value: 'other', label: 'Other' },
                ]}
              />
            </div>
            
            <AdminFormInput label="Short Description" id="store-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Store details..." />

            <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
              <AdminFormSelect
                label="Status"
                id="store-status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                options={[
                  { value: 'active', label: 'Active' },
                  { value: 'inactive', label: 'Inactive' },
                ]}
              />
              <div className="admin-form-group" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', paddingBottom: '8px' }}>
                  <input type="checkbox" checked={isPopular} onChange={(e) => setIsPopular(e.target.checked)} style={{ width: '16px', height: '16px', accentColor: 'var(--primary)' }} />
                  <span style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-bold)' }}>Featured / Popular</span>
                </label>
              </div>
            </div>

            {/* Coupons Management Section */}
            <div style={{ marginTop: '32px', paddingTop: '20px', borderTop: '2px dashed var(--border)' }}>
              <h3 style={{ fontSize: '16px', color: 'var(--text-bold)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Percent size={18} /> Manage Coupons & Offers
              </h3>
              
              {/* Existing Coupons List */}
              {coupons.length > 0 && (
                <div style={{ marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {coupons.map((c, idx) => (
                    <div key={idx} style={{ padding: '12px', border: '1px solid var(--border)', borderRadius: '6px', backgroundColor: 'var(--bg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <strong style={{ fontSize: '14px', color: 'var(--text-bold)' }}>{c.title}</strong>
                        {c.code && <span style={{ marginLeft: '8px', padding: '2px 6px', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>{c.code}</span>}
                        <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--text)' }}>{c.description} • Expires: {c.expiry || 'No expiry'}</p>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button type="button" className="admin-btn-icon edit" onClick={() => editCoupon(idx)}><Edit2 size={14} /></button>
                        <button type="button" className="admin-btn-icon delete" onClick={() => removeCoupon(idx)}><Trash2 size={14} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add/Edit Coupon Form */}
              <div style={{ backgroundColor: 'var(--bg)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <h4 style={{ fontSize: '14px', marginBottom: '12px', color: 'var(--text-bold)' }}>
                  {editingCouponIndex >= 0 ? 'Edit Offer' : 'Add New Offer'}
                </h4>
                
                {couponFormError && (
                  <div style={{ color: '#ef4444', fontSize: '12px', marginBottom: '8px', fontWeight: '500' }}>
                    {couponFormError}
                  </div>
                )}
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <AdminFormInput label="Offer Title" id="cpn-title" value={couponTitle} onChange={(e) => setCouponTitle(e.target.value)} placeholder="e.g. 50% Off Electronics" />
                  <AdminFormInput label="Promo Code (Leave empty if just a deal)" id="cpn-code" value={couponCode} onChange={(e) => setCouponCode(e.target.value)} placeholder="e.g. SAVE50" />
                </div>
                <AdminFormInput label="Description terms" id="cpn-desc" value={couponDescription} onChange={(e) => setCouponDescription(e.target.value)} placeholder="Valid on min purchase of $100..." />
                <AdminFormInput label="Expiry Info" id="cpn-expiry" value={couponExpiry} onChange={(e) => setCouponExpiry(e.target.value)} placeholder="e.g. Valid till 31st Oct" />
                
                <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                  <button type="button" className="admin-btn admin-btn-secondary" style={{ padding: '6px 12px', fontSize: '13px' }} onClick={handleSaveCoupon}>
                    {editingCouponIndex >= 0 ? 'Update Offer' : 'Add Offer to List'}
                  </button>
                  {editingCouponIndex >= 0 && (
                    <button type="button" className="admin-btn" style={{ padding: '6px 12px', fontSize: '13px', backgroundColor: 'transparent', border: '1px solid var(--border)', color: 'var(--text)' }} onClick={resetCouponForm}>
                      Cancel Edit
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
