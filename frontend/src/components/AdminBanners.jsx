import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Image } from 'lucide-react';
import { AdminTable, AdminModal, AdminFormInput, AdminFormSelect, ExportDataButton } from './AdminComponents';

export default function AdminBanners({ banners, onAddBanner, onEditBanner, onDeleteBanner, onAddNotification }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);

  // Form states
  const [tag, setTag] = useState('');
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [cta, setCta] = useState('');
  const [storeName, setStoreName] = useState('');
  const [cashbackRate, setCashbackRate] = useState('');
  const [logo, setLogo] = useState('');
  const [type, setType] = useState('HERO'); // HERO, AD
  const [targetUrl, setTargetUrl] = useState('');
  const [isActive, setIsActive] = useState(true);

  const [formError, setFormError] = useState('');

  const openAddModal = () => {
    setEditItem(null);
    setTag('');
    setTitle('');
    setDesc('');
    setCta('');
    setStoreName('');
    setCashbackRate('');
    setLogo('');
    setType('HERO');
    setTargetUrl('');
    setIsActive(true);
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditItem(item);
    setTag(item.tag || '');
    setTitle(item.title || '');
    setDesc(item.desc || '');
    setCta(item.cta || '');
    setStoreName(item.storeName || '');
    setCashbackRate(item.cashbackRate || '');
    setLogo(item.logo || '');
    setType(item.type || 'HERO');
    setTargetUrl(item.targetUrl || '');
    setIsActive(item.isActive === undefined ? true : item.isActive);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    setFormError('');

    if (!title.trim() || !storeName.trim() || !logo.trim()) {
      setFormError('Title, Store Name, and Logo are required.');
      return;
    }

    if (!window.confirm(`Are you sure you want to ${editItem ? 'save changes to' : 'create'} this banner?`)) {
      return;
    }

    const bannerData = {
      tag,
      title,
      desc,
      cta,
      storeName,
      cashbackRate,
      logo,
      type,
      targetUrl,
      isActive,
    };

    if (editItem) {
      onEditBanner({ ...editItem, ...bannerData });
    } else {
      onAddBanner(bannerData);
    }

    setIsModalOpen(false);
  };

  const headers = ['Logo', 'Title & Tag', 'Type', 'Store', 'Cashback Rate', 'Status', 'Actions'];

  const renderRow = (item) => (
    <tr key={item.id} className="animate-fade">
      <td>
        <img src={item.logo} alt={item.storeName} style={{ width: '40px', height: '40px', objectFit: 'contain', borderRadius: '4px', backgroundColor: 'var(--bg)' }} />
      </td>
      <td>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <strong style={{ color: 'var(--text-bold)', fontSize: '14px' }} dangerouslySetInnerHTML={{ __html: item.title }} />
          <span style={{ color: 'var(--text)', fontSize: '12px' }}>{item.tag}</span>
        </div>
      </td>
      <td>
        <span style={{ 
          fontSize: '11px', 
          fontWeight: 'bold', 
          padding: '2px 8px', 
          borderRadius: '12px', 
          backgroundColor: item.type === 'AD' ? 'rgba(168,85,247,0.1)' : 'rgba(59,130,246,0.1)',
          color: item.type === 'AD' ? '#a855f7' : '#3b82f6'
        }}>
          {item.type === 'AD' ? 'Promo Ad' : 'Hero Slider'}
        </span>
      </td>
      <td style={{ fontWeight: '500' }}>{item.storeName}</td>
      <td style={{ color: 'var(--secondary)', fontWeight: 'bold' }}>{item.cashbackRate}</td>
      <td>
        <span className={`status-badge ${item.isActive ? 'active' : 'inactive'}`}>
          {item.isActive ? 'Active' : 'Inactive'}
        </span>
      </td>
      <td>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="admin-btn-icon edit" onClick={() => openEditModal(item)} title="Edit Banner">
            <Edit2 size={14} />
          </button>
          <button className="admin-btn-icon delete" onClick={() => {
            if (window.confirm("Are you sure you want to delete this banner?")) {
              onDeleteBanner(item.id);
            }
          }} title="Delete Banner">
            <Trash2 size={14} />
          </button>
        </div>
      </td>
    </tr>
  );

  const exportColumns = [
    { header: 'Store', dataKey: 'storeName' },
    { header: 'Type', dataKey: 'type' },
    { header: 'Title', dataKey: 'title' },
    { header: 'Tag', dataKey: 'tag' },
    { header: 'Cashback Rate', dataKey: 'cashbackRate' },
    { header: 'CTA', dataKey: 'cta' },
    { header: 'Target URL', dataKey: 'targetUrl' },
    { header: 'Status', dataKey: 'isActive' }
  ];

  return (
    <div className="admin-banners-tab animate-fade">
      <div className="admin-page-header">
        <div className="admin-page-title">
          <h2>Hero & Promo Ad Banners</h2>
          <p>Manage the top homepage sliding banners and promo ad banner placements.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <ExportDataButton data={banners} columns={exportColumns} filename="Banners" />
          <button className="admin-btn admin-btn-primary" onClick={openAddModal}>
            <Plus size={16} />
            Add Banner
          </button>
        </div>
      </div>

      <AdminTable
        headers={headers}
        items={banners}
        currentPage={currentPage}
        itemsPerPage={10}
        onPageChange={setCurrentPage}
        renderRow={renderRow}
        emptyMessage="No banners found. Add some to display on the homepage."
      />

      {/* Add / Edit Modal */}
      <AdminModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editItem ? 'Edit Banner' : 'Add Banner'}
        footer={
          <>
            <button className="admin-btn admin-btn-secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </button>
            <button className="admin-btn admin-btn-primary" onClick={handleSave}>
              Save Banner
            </button>
          </>
        }
      >
        <div style={{ maxHeight: '65vh', overflowY: 'auto', paddingRight: '8px' }}>
          <form onSubmit={handleSave}>
            {formError && (
              <div style={{ color: '#ef4444', fontSize: '13px', marginBottom: '12px', fontWeight: '500' }}>
                {formError}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <AdminFormSelect
                label="Banner Type"
                id="banner-type"
                value={type}
                onChange={(e) => setType(e.target.value)}
                options={[
                  { value: 'HERO', label: 'Hero Home Slider' },
                  { value: 'AD', label: 'Promo Ad Placement' },
                ]}
              />
              <AdminFormInput
                label="Target Link / Click URL"
                id="banner-targetUrl"
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                placeholder="e.g. https://amazon.to/promo"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <AdminFormInput
                label="Banner Tag"
                id="banner-tag"
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                placeholder="e.g. Limited Time Bonanza"
              />
              <AdminFormInput
                label="Call to Action (CTA) Text"
                id="banner-cta"
                value={cta}
                onChange={(e) => setCta(e.target.value)}
                placeholder="e.g. Browse Top Offers"
              />
            </div>

            <AdminFormInput
              label="Title (HTML allowed for styling e.g. <span>)"
              id="banner-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Earn Real Cashback. <span>Withdraw to Bank.</span>"
            />

            <AdminFormInput
              label="Description"
              id="banner-desc"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Shop at Amazon, Ajio, Flipkart..."
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <AdminFormInput
                label="Store Name"
                id="banner-storeName"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                placeholder="e.g. Myntra Fashion"
              />
              <AdminFormInput
                label="Cashback Rate (Display)"
                id="banner-cashbackRate"
                value={cashbackRate}
                onChange={(e) => setCashbackRate(e.target.value)}
                placeholder="e.g. 12%"
              />
            </div>

            <AdminFormInput
              label="Logo / Image URL"
              id="banner-logo"
              value={logo}
              onChange={(e) => setLogo(e.target.value)}
              placeholder="https://..."
            />

            <div className="admin-form-group" style={{ display: 'flex', flexDirection: 'column', marginTop: '16px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', paddingBottom: '8px' }}>
                <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} style={{ width: '16px', height: '16px', accentColor: 'var(--primary)' }} />
                <span style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-bold)' }}>Banner is Active</span>
              </label>
            </div>
          </form>
        </div>
      </AdminModal>
    </div>
  );
}
