import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { AdminTable, AdminModal, AdminFormInput, ExportDataButton } from './AdminComponents';

export default function AdminDeals({ deals, onAddDeal, onDeleteDeal }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [dealName, setDealName] = useState('');
  const [dealImg, setDealImg] = useState('');
  const [dealOffer, setDealOffer] = useState('');
  const [dealUrl, setDealUrl] = useState('');
  const [dealCashback, setDealCashback] = useState('');
  const [comparisons, setComparisons] = useState([]);
  const [formError, setFormError] = useState('');

  const handleAddComparison = () => {
    setComparisons([...comparisons, { platform: 'Amazon', listedPrice: '', cashbackPercent: '', link: '' }]);
  };

  const handleComparisonChange = (index, field, value) => {
    const newComps = [...comparisons];
    newComps[index][field] = value;
    setComparisons(newComps);
  };

  const handleRemoveComparison = (index) => {
    setComparisons(comparisons.filter((_, i) => i !== index));
  };

  const openAddModal = () => {
    setDealName('');
    setDealImg('https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300');
    setDealOffer('');
    setDealUrl('');
    setDealCashback('');
    setComparisons([]);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    setFormError('');

    if (!dealName.trim() || !dealOffer.trim() || !dealCashback.trim()) {
      setFormError('Please fill in Deal Name, Offer Text, and Cashback value.');
      return;
    }

    if (!window.confirm("Are you sure you want to save this featured deal?")) {
      return;
    }

    onAddDeal({
      name: dealName,
      image: dealImg || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300',
      offerText: dealOffer,
      link: dealUrl || 'https://google.com',
      cashback: dealCashback,
      comparisons: comparisons.map(c => ({
        ...c,
        listedPrice: parseFloat(c.listedPrice) || 0,
        cashbackPercent: parseFloat(c.cashbackPercent) || 0
      }))
    });

    setIsModalOpen(false);
  };

  const headers = ['Banner Image', 'Deal Name', 'Offer Text', 'Cashback', 'Status', 'Actions'];

  const renderRow = (item, idx) => (
    <tr key={item.id} className="animate-fade">
      <td>
        <img
          src={item.image}
          alt={item.name}
          style={{ width: '70px', height: '40px', objectFit: 'cover', borderRadius: '4px' }}
          onError={(e) => {
            e.target.src = 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300';
          }}
        />
      </td>
      <td style={{ fontWeight: '600', color: 'var(--text-bold)' }}>{item.name}</td>
      <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.offerText}</td>
      <td style={{ color: 'var(--secondary)', fontWeight: '600' }}>{item.cashback}</td>
      <td>
        <span className={`status-badge ${item.status}`}>{item.status}</span>
      </td>
      <td>
        <button className="admin-btn-icon delete" onClick={() => {
          if (window.confirm("Are you sure you want to delete this featured deal?")) {
            onDeleteDeal(item.id);
          }
        }} title="Delete Banner Deal">
          <Trash2 size={14} />
        </button>
      </td>
    </tr>
  );

  const exportColumns = [
    { header: 'Deal Name', dataKey: 'name' },
    { header: 'Offer Text', dataKey: 'offerText' },
    { header: 'Cashback', dataKey: 'cashback' },
    { header: 'Status', dataKey: 'status' }
  ];

  return (
    <div className="admin-deals-tab animate-fade">
      <div className="admin-page-header">
        <div className="admin-page-title">
          <h2>Deals & Banners</h2>
          <p>Configure homepage featured banners and promo codes</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <ExportDataButton data={deals} columns={exportColumns} filename="Deals" />
          <button className="admin-btn admin-btn-primary" onClick={openAddModal}>
            <Plus size={16} />
            Add Featured Deal
          </button>
        </div>
      </div>

      <AdminTable
        headers={headers}
        items={deals}
        currentPage={currentPage}
        itemsPerPage={5}
        onPageChange={setCurrentPage}
        renderRow={renderRow}
        emptyMessage="No deals or banners configured."
      />

      {/* Add Deal Modal */}
      <AdminModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Featured Banner Deal"
        footer={
          <>
            <button className="admin-btn admin-btn-secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </button>
            <button className="admin-btn admin-btn-primary" onClick={handleSave}>
              Save Deal
            </button>
          </>
        }
      >
        <form onSubmit={handleSave}>
          {formError && (
            <div style={{ color: '#ef4444', fontSize: '13px', marginBottom: '12px', fontWeight: '500' }}>
              {formError}
            </div>
          )}

          <AdminFormInput
            label="Deal / Banner Name *"
            id="deal-name"
            type="text"
            placeholder="e.g., Amazon Electronics Flash Deal"
            value={dealName}
            onChange={(e) => setDealName(e.target.value)}
          />

          <AdminFormInput
            label="Offer Text *"
            id="deal-offer"
            type="text"
            placeholder="e.g., Up to 50% Off Kitchen Ware + 10% Cashback"
            value={dealOffer}
            onChange={(e) => setDealOffer(e.target.value)}
          />

          <div className="admin-form-row">
            <AdminFormInput
              label="Cashback Reward (e.g., 10% or ₹5.00) *"
              id="deal-cashback"
              type="text"
              placeholder="e.g., 10%"
              value={dealCashback}
              onChange={(e) => setDealCashback(e.target.value)}
            />

            <AdminFormInput
              label="Affiliate Target Link"
              id="deal-url"
              type="url"
              placeholder="https://amazon.to/abcde"
              value={dealUrl}
              onChange={(e) => setDealUrl(e.target.value)}
            />
          </div>

          <AdminFormInput
            label="Banner / Product Image URL"
            id="deal-img"
            type="text"
            placeholder="https://images.unsplash.com/..."
            value={dealImg}
            onChange={(e) => setDealImg(e.target.value)}
          />

          <div style={{ marginTop: '20px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h4 style={{ fontSize: '14px', margin: 0 }}>Price Comparisons</h4>
              <button type="button" className="admin-btn admin-btn-secondary" onClick={handleAddComparison} style={{ padding: '4px 8px', fontSize: '12px' }}>
                <Plus size={12} /> Add Store Variant
              </button>
            </div>
            {comparisons.length === 0 ? (
              <p style={{ fontSize: '12px', color: 'var(--text)' }}>No price comparisons added.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {comparisons.map((comp, idx) => (
                  <div key={idx} style={{ padding: '12px', backgroundColor: 'var(--bg)', borderRadius: '6px', border: '1px solid var(--border)', position: 'relative' }}>
                    <button type="button" onClick={() => handleRemoveComparison(idx)} style={{ position: 'absolute', top: '8px', right: '8px', background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
                      <Trash2 size={14} />
                    </button>
                    <div className="admin-form-row">
                      <AdminFormInput
                        label="Platform"
                        id={`comp-plat-${idx}`}
                        type="text"
                        placeholder="Amazon"
                        value={comp.platform}
                        onChange={(e) => handleComparisonChange(idx, 'platform', e.target.value)}
                      />
                      <AdminFormInput
                        label="Listed Price"
                        id={`comp-price-${idx}`}
                        type="number"
                        placeholder="59.99"
                        value={comp.listedPrice}
                        onChange={(e) => handleComparisonChange(idx, 'listedPrice', e.target.value)}
                      />
                    </div>
                    <div className="admin-form-row">
                      <AdminFormInput
                        label="Cashback (%)"
                        id={`comp-cb-${idx}`}
                        type="number"
                        placeholder="10.0"
                        value={comp.cashbackPercent}
                        onChange={(e) => handleComparisonChange(idx, 'cashbackPercent', e.target.value)}
                      />
                      <AdminFormInput
                        label="Store Link"
                        id={`comp-link-${idx}`}
                        type="url"
                        placeholder="https://..."
                        value={comp.link}
                        onChange={(e) => handleComparisonChange(idx, 'link', e.target.value)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </form>
      </AdminModal>
    </div>
  );
}
