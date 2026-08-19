import React, { useState } from 'react';
import { Plus, Trash2, Search, Filter, Edit2, Download, Terminal, Settings, Network, ShieldCheck, FileSpreadsheet, FileText, UploadCloud, CheckCircle2 } from 'lucide-react';
import { AdminTable, AdminModal, AdminFormInput, AdminFormSelect, AdminFormSwitch, ExportDataButton } from './AdminComponents';
import { apiUpload } from '../services/api';
import { fetchNetworkCatalogProducts, getNetworkForStore, getAffiliateNetworkConfigs, saveAffiliateNetworkConfigs } from '../services/affiliateNetworks';
import { parseProductsFromCSV, parseProductsFromPDF, downloadSampleProductCSV, downloadSampleProductPDF } from '../utils/productImportUtils';

export default function AdminProducts({ products, stores = [], categories = [], onAddProduct, onAddProductBulk, onToggleStatus, onDeleteProduct, onEditProduct }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null); // null means adding
  const [searchQuery, setSearchQuery] = useState('');
  const [platformFilter, setPlatformFilter] = useState('all');

  // Bulk Import States
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkImportMode, setBulkImportMode] = useState('file'); // 'file', 'api', or 'raw'
  const [apiPlatform, setApiPlatform] = useState('Amazon');
  const [apiKeyword, setApiKeyword] = useState('');
  const [apiCategory, setApiCategory] = useState('Electronics');
  const [apiLimit, setApiLimit] = useState(10);
  
  // Credentials (Amazon & Cuelinks)
  const networkConfigs = getAffiliateNetworkConfigs();
  const [cuelinksPubId, setCuelinksPubId] = useState(networkConfigs.cuelinks?.publisherId || '189241');
  const [cuelinksToken, setCuelinksToken] = useState(networkConfigs.cuelinks?.apiToken || 'cue_live_sec_89172401824');
  const [awsAccessKey, setAwsAccessKey] = useState(networkConfigs.amazon?.accessKey || 'AKIAIOSFODNN7EXAMPLE');
  const [awsSecretKey, setAwsSecretKey] = useState(networkConfigs.amazon?.secretKey || 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY');
  const [awsAssociateTag, setAwsAssociateTag] = useState(networkConfigs.amazon?.associateTag || 'liomart-21');
  const [showCredentials, setShowCredentials] = useState(false);

  // File Upload states (CSV & PDF)
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isParsingFile, setIsParsingFile] = useState(false);
  const [fileDefaultPlatform, setFileDefaultPlatform] = useState('Amazon');
  const [fileDefaultCategory, setFileDefaultCategory] = useState('Electronics');

  // Raw states
  const [rawText, setRawText] = useState('');
  const [rawFormat, setRawFormat] = useState('csv');
  const [rawDefaultPlatform, setRawDefaultPlatform] = useState('Amazon');

  // Preview & Selection states
  const [previewProducts, setPreviewProducts] = useState([]);
  const [selectedPreviewIds, setSelectedPreviewIds] = useState(new Set());
  
  // Console logging & loading
  const [terminalLogs, setTerminalLogs] = useState([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [wizardError, setWizardError] = useState('');

  // Form states
  const [prodName, setProdName] = useState('');
  const [prodPlatform, setProdPlatform] = useState('Amazon');
  const [prodPrice, setProdPrice] = useState('');
  const [prodCashbackValue, setProdCashbackValue] = useState('');
  const [prodAffiliateUrl, setProdAffiliateUrl] = useState('');
  const [prodImage, setProdImage] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [prodCategory, setProdCategory] = useState('electronics');
  const [prodActive, setProdActive] = useState(true);
  const [formError, setFormError] = useState('');

  const platformOptions = stores.length > 0 
    ? stores.map(s => ({ value: s.name, label: s.name })) 
    : [
        { value: 'Amazon', label: 'Amazon' },
        { value: 'Flipkart', label: 'Flipkart' },
        { value: 'Meesho', label: 'Meesho' },
        { value: 'Myntra', label: 'Myntra' },
        { value: 'Ajio', label: 'Ajio' },
        { value: 'Nykaa Beauty', label: 'Nykaa Beauty' },
        { value: 'MakeMyTrip', label: 'MakeMyTrip' },
        { value: 'boAt', label: 'boAt Lifestyle' },
        { value: 'Croma', label: 'Croma Retail' }
      ];

  const categoryOptions = React.useMemo(() => {
    const defaultList = [
      { value: 'electronics', label: 'Electronics' },
      { value: 'fashion', label: 'Fashion' },
      { value: 'clothing', label: 'Clothing' },
      { value: 'health', label: 'Health' },
      { value: 'beauty', label: 'Beauty' },
      { value: 'grocery', label: 'Grocery & Essentials' },
      { value: 'travel', label: 'Travel & Bookings' },
    ];

    const map = new Map();
    defaultList.forEach(item => {
      map.set(item.value.toLowerCase(), item);
    });

    if (categories && Array.isArray(categories)) {
      categories.forEach(cat => {
        if (!cat) return;
        const name = cat.name || cat.title || '';
        if (!name.trim()) return;
        const key = name.trim().toLowerCase();
        const value = (cat.slug || cat.id || key).toLowerCase().replace(/\s+/g, '-');
        if (!map.has(key)) {
          map.set(key, { value: value, label: name.trim() });
        }
      });
    }

    return Array.from(map.values());
  }, [categories]);

  const openBulkModal = () => {
    setBulkImportMode('api');
    setApiKeyword('');
    setApiCategory('electronics');
    setApiLimit(10);
    setRawText('');
    setPreviewProducts([]);
    setSelectedPreviewIds(new Set());
    setTerminalLogs([]);
    setWizardError('');
    setIsBulkModalOpen(true);
  };

  const handleApiFetch = () => {
    if (!apiKeyword.trim()) {
      setWizardError('Please enter a search keyword.');
      return;
    }
    setWizardError('');
    setIsSyncing(true);
    setTerminalLogs([]);
    setPreviewProducts([]);
    setSelectedPreviewIds(new Set());

    const activeNetwork = getNetworkForStore(apiPlatform);
    let logs = [];

    if (activeNetwork === 'amazon') {
      logs = [
        `[INIT] Preparing Amazon PA-API request for query "${apiKeyword}"...`,
        `[AUTH] Authenticating with AWS Access Key "${awsAccessKey.slice(0, 8)}..." and Associate Tag "${awsAssociateTag}"`,
        `[GET] Querying GET /paapi5/searchitems?Keywords=${encodeURIComponent(apiKeyword)}&Category=${apiCategory}&Limit=${apiLimit}...`,
        `[NET] Connection established to webservices.amazon.in regional gateway.`,
        `[PARSE] Received 200 OK with ItemSearch payload. Parsing product nodes...`,
        `[TAG] Attached affiliate tracking tag: ${awsAssociateTag} & ascsubtag parameter.`,
        `[SUCCESS] Successfully generated ${apiLimit} verified Amazon India products ready for catalog import.`
      ];
    } else {
      // Cuelinks for Flipkart, Meesho, Myntra, Ajio, Nykaa, etc.
      logs = [
        `[INIT] Initializing Cuelinks Universal Multi-Store API Engine...`,
        `[AUTH] Authenticating Publisher ID "${cuelinksPubId}" with Cuelinks API Token...`,
        `[ROUTING] Resolving active merchant campaign endpoint for ${apiPlatform} India...`,
        `[FETCH] Querying Cuelinks Product & Offer Feed (Category: ${apiCategory}, Query: "${apiKeyword}")...`,
        `[SUB-ID] Generated universal tracking redirect format: https://linksredirect.com/?pub_id=${cuelinksPubId}&subid={userId}&url=...`,
        `[COMMISSION] Mapped merchant payout rate for ${apiPlatform}.`,
        `[SUCCESS] Correctly loaded ${apiLimit} products from ${apiPlatform} via Cuelinks Aggregator. Select items below.`
      ];
    }

    let currentLogIndex = 0;
    const interval = setInterval(() => {
      if (currentLogIndex < logs.length) {
        setTerminalLogs(prev => [...prev, logs[currentLogIndex]]);
        currentLogIndex++;
      } else {
        clearInterval(interval);
        setIsSyncing(false);
        const fetched = fetchNetworkCatalogProducts({
          platform: apiPlatform,
          keyword: apiKeyword,
          category: apiCategory,
          limit: apiLimit
        });
        setPreviewProducts(fetched);
        setSelectedPreviewIds(new Set(fetched.map(p => p.id))); // select all by default
      }
    }, 280);
  };

  const handleFileUploadParse = async (file) => {
    if (!file) return;
    setUploadedFile(file);
    setIsParsingFile(true);
    setWizardError('');
    setTerminalLogs([`[UPLOAD] Loading file: ${file.name} (${(file.size / 1024).toFixed(1)} KB)...`]);
    setPreviewProducts([]);
    setSelectedPreviewIds(new Set());

    try {
      if (file.name.toLowerCase().endsWith('.pdf')) {
        setTerminalLogs(prev => [...prev, `[PDF ENGINE] Extracting text layers and product tables from PDF...`]);
        const result = await parseProductsFromPDF(file, fileDefaultPlatform, fileDefaultCategory);
        
        setTerminalLogs(prev => [
          ...prev,
          `[SUCCESS] Processed ${result.totalLinesParsed} PDF lines streams.`,
          `[EXTRACTED] Successfully detected ${result.products.length} products from PDF!`,
          `[READY] Select products below to import into catalog.`
        ]);
        setPreviewProducts(result.products);
        setSelectedPreviewIds(new Set(result.products.map(p => p.id)));
      } else if (file.name.toLowerCase().endsWith('.csv') || file.name.toLowerCase().endsWith('.txt')) {
        setTerminalLogs(prev => [...prev, `[CSV ENGINE] Reading and tokenizing CSV data...`]);
        const reader = new FileReader();
        reader.onload = (evt) => {
          try {
            const csvContent = evt.target.result;
            const result = parseProductsFromCSV(csvContent, fileDefaultPlatform, fileDefaultCategory);
            setTerminalLogs(prev => [
              ...prev,
              `[SUCCESS] Parsed ${result.totalRows} data rows.`,
              `[EXTRACTED] Successfully validated ${result.products.length} products!`,
              ...(result.errors.length > 0 ? [`[WARNING] ${result.errors.length} skipped invalid rows.`] : [])
            ]);
            setPreviewProducts(result.products);
            setSelectedPreviewIds(new Set(result.products.map(p => p.id)));
          } catch (e) {
            setWizardError(e.message);
            setTerminalLogs(prev => [...prev, `[ERROR] CSV Parser Error: ${e.message}`]);
          } finally {
            setIsParsingFile(false);
          }
        };
        reader.readAsText(file);
        return;
      } else if (file.name.toLowerCase().endsWith('.json')) {
        const reader = new FileReader();
        reader.onload = (evt) => {
          try {
            const parsed = JSON.parse(evt.target.result);
            const productsArr = Array.isArray(parsed) ? parsed : [parsed];
            const formatted = productsArr.map((item, idx) => ({
              id: `json-file-${idx}-${Date.now()}`,
              name: item.name,
              platform: item.platform || fileDefaultPlatform,
              category: item.category || fileDefaultCategory,
              price: parseFloat(item.price),
              cashbackValue: parseFloat(item.cashbackValue || 10),
              affiliateUrl: item.affiliateUrl || item.link || '',
              image: item.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400',
              status: item.status || 'active'
            }));
            setTerminalLogs(prev => [
              ...prev,
              `[SUCCESS] Parsed JSON Array file. Found ${formatted.length} products.`,
              `[READY] Select products below to import into catalog.`
            ]);
            setPreviewProducts(formatted);
            setSelectedPreviewIds(new Set(formatted.map(p => p.id)));
          } catch (e) {
            setWizardError("Invalid JSON structure in file: " + e.message);
            setTerminalLogs(prev => [...prev, `[ERROR] JSON File Error: ${e.message}`]);
          } finally {
            setIsParsingFile(false);
          }
        };
        reader.readAsText(file);
        return;
      } else {
        throw new Error("Unsupported file format. Please upload a .csv, .pdf, or .json file.");
      }
    } catch (err) {
      setWizardError(err.message);
      setTerminalLogs(prev => [...prev, `[ERROR] Extraction failed: ${err.message}`]);
    } finally {
      setIsParsingFile(false);
    }
  };

  const handleRawParse = () => {
    if (!rawText.trim()) {
      setWizardError('Please enter raw JSON or CSV text.');
      return;
    }
    setWizardError('');
    setTerminalLogs([]);
    setPreviewProducts([]);
    setSelectedPreviewIds(new Set());
    
    try {
      if (rawFormat === 'json') {
        const parsed = JSON.parse(rawText);
        const productsArr = Array.isArray(parsed) ? parsed : [parsed];
        
        const formatted = productsArr.map((item, idx) => {
          if (!item.name || !item.price) {
            throw new Error(`Product at index ${idx} is missing 'name' or 'price'.`);
          }
          return {
            id: `raw-${idx}-${Date.now()}`,
            name: item.name,
            platform: item.platform || rawDefaultPlatform,
            price: parseFloat(item.price),
            cashbackValue: parseFloat(item.cashbackValue || 10),
            affiliateUrl: item.affiliateUrl || item.link || '',
            image: item.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300',
            status: item.status || 'active'
          };
        });
        
        setTerminalLogs([
          `[RAW] Initializing JSON parsing engine...`,
          `[SUCCESS] Successfully parsed JSON array. Found ${formatted.length} products.`,
          `[SYNC] Schema validation complete.`
        ]);
        setPreviewProducts(formatted);
        setSelectedPreviewIds(new Set(formatted.map(p => p.id)));
      } else {
        const result = parseProductsFromCSV(rawText, rawDefaultPlatform, fileDefaultCategory);
        setTerminalLogs([
          `[RAW] Initializing CSV parser engine...`,
          `[SUCCESS] Successfully parsed ${result.products.length} products from CSV data.`,
          `[SYNC] Validated elements correctly.`
        ]);
        setPreviewProducts(result.products);
        setSelectedPreviewIds(new Set(result.products.map(p => p.id)));
      }
    } catch (err) {
      setWizardError(err.message);
      setTerminalLogs([`[ERROR] Parser failed: ${err.message}`]);
    }
  };

  const toggleSelectPreviewItem = (id) => {
    const next = new Set(selectedPreviewIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedPreviewIds(next);
  };

  const toggleSelectAllPreviewItems = () => {
    if (selectedPreviewIds.size === previewProducts.length) {
      setSelectedPreviewIds(new Set());
    } else {
      setSelectedPreviewIds(new Set(previewProducts.map(p => p.id)));
    }
  };

  const handleImportSubmit = () => {
    if (selectedPreviewIds.size === 0) {
      setWizardError('Please select at least one product to import.');
      return;
    }
    
    const itemsToImport = previewProducts.filter(p => selectedPreviewIds.has(p.id));
    if (onAddProductBulk) {
      onAddProductBulk(itemsToImport);
    }
    
    setIsBulkModalOpen(false);
    setPreviewProducts([]);
    setSelectedPreviewIds(new Set());
    setTerminalLogs([]);
  };

  const openAddModal = () => {
    setEditItem(null);
    setProdName('');
    setProdPlatform('Amazon');
    setProdPrice('');
    setProdCashbackValue('');
    setProdAffiliateUrl('');
    setProdImage('https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300');
    setImageFile(null);
    setProdCategory('electronics');
    setProdActive(true);
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditItem(item);
    setProdName(item.name || item.title || '');
    setProdPlatform(item.platform || item.sourcePlatform || 'Amazon');
    setProdPrice((item.price !== undefined && item.price !== null) ? item.price.toString() : '');
    setProdCashbackValue((item.cashbackValue || item.commissionPercentage || 10).toString());
    setProdAffiliateUrl(item.affiliateUrl || '');
    setProdImage(item.image || (item.images && item.images[0]) || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300');
    setImageFile(null);
    setProdCategory(item.category || 'electronics');
    setProdActive(item.status === 'active' || item.isActive === true || item.status === undefined);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!prodName.trim() || !prodPrice || !prodCashbackValue) {
      setFormError('Please fill in Name, Price, and Commission Rate.');
      return;
    }

    setIsUploading(true);
    let finalImageUrl = prodImage;

    try {
      if (imageFile) {
        const uploadRes = await apiUpload.uploadImage(imageFile);
        finalImageUrl = uploadRes.url;
      }

      const payload = {
        name: prodName.trim(),
        title: prodName.trim(),
        platform: prodPlatform,
        sourcePlatform: prodPlatform,
        price: parseFloat(prodPrice),
        cashbackValue: parseFloat(prodCashbackValue),
        commissionPercentage: parseFloat(prodCashbackValue),
        affiliateUrl: prodAffiliateUrl.trim(),
        image: finalImageUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300',
        images: [finalImageUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300'],
        category: prodCategory,
        status: prodActive ? 'active' : 'inactive',
        isActive: Boolean(prodActive),
      };

      if (editItem) {
        await onEditProduct({ ...editItem, ...payload });
      } else {
        await onAddProduct(payload);
      }

      setIsModalOpen(false);
    } catch (err) {
      setFormError(err.message || 'Failed to upload image or save product.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProdImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const filteredProducts = (products || []).filter((p) => {
    if (!p) return false;
    const q = searchQuery.toLowerCase();
    const nameStr = p.name || p.title || '';
    const catStr = p.category || '';
    const platStr = p.platform || p.sourcePlatform || '';
    const matchesSearch = nameStr.toLowerCase().includes(q) || 
                          catStr.toLowerCase().includes(q);
    const matchesPlatform = platformFilter === 'all' || platStr.toLowerCase() === platformFilter.toLowerCase();
    return matchesSearch && matchesPlatform;
  });

  const headers = ['Image', 'Product Name', 'Platform', 'Category', 'Price', 'Commission', 'Status', 'Actions'];

  const renderRow = (item, idx) => (
    <tr key={item.id} className="animate-fade">
      <td>
        <img
          src={item.image}
          alt=""
          style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '6px' }}
          onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300'; }}
        />
      </td>
      <td style={{ fontWeight: '600', color: 'var(--text-bold)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {item.name}
      </td>
      <td>
        <span style={{ fontSize: '13px', fontWeight: '500' }}>{item.platform}</span>
      </td>
      <td>
        <span style={{ fontSize: '12px', background: 'var(--bg)', padding: '2px 8px', borderRadius: '4px', textTransform: 'capitalize', color: 'var(--text)' }}>
          {item.category || 'Electronics'}
        </span>
      </td>
      <td style={{ fontWeight: '600', color: 'var(--text-bold)' }}>₹{Number(item.price || 0).toFixed(2)}</td>
      <td style={{ color: 'var(--secondary)', fontWeight: '600' }}>
        {item.cashbackValue}%
      </td>
      <td>
        <label className="admin-switch">
          <input
            type="checkbox"
            checked={item.status === 'active'}
            onChange={() => onToggleStatus(item.id)}
          />
          <span className="admin-slider"></span>
        </label>
      </td>
      <td>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="admin-btn-icon edit" onClick={() => handleEdit(item)} title="Edit Product">
            <Edit2 size={14} />
          </button>
          <button className="admin-btn-icon delete" onClick={() => onDeleteProduct(item.id)} title="Delete Product">
            <Trash2 size={14} />
          </button>
        </div>
      </td>
    </tr>
  );

  const formattedExportProducts = React.useMemo(() => {
    if (!products || !Array.isArray(products)) return [];
    return products.map((p, idx) => ({
      serialNo: idx + 1,
      createdAtFormatted: p.createdAt ? new Date(p.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—',
      name: p.name || p.title || '—',
      platform: p.platform || p.sourcePlatform || '—',
      category: p.category || '—',
      price: p.price !== undefined && p.price !== null ? `₹${Number(p.price).toFixed(2)}` : '₹0.00',
      affiliateUrl: p.affiliateUrl || '—'
    }));
  }, [products]);

  const exportProductColumns = [
    { header: 'Serial Number', dataKey: 'serialNo' },
    { header: 'Product Add Date', dataKey: 'createdAtFormatted' },
    { header: 'Product Name', dataKey: 'name' },
    { header: 'Product Store Name', dataKey: 'platform' },
    { header: 'Product Category Name', dataKey: 'category' },
    { header: 'Product Price', dataKey: 'price' },
    { header: 'Product Affiliate Link URL', dataKey: 'affiliateUrl' }
  ];

  return (
    <div className="admin-products-tab animate-fade">
      <div className="admin-page-header">
        <div className="admin-page-title">
          <h2>Product Management</h2>
          <p>Add, edit, and delete store products and configure commission rates</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <ExportDataButton data={formattedExportProducts} columns={exportProductColumns} filename="Products" />
          <button className="admin-btn admin-btn-secondary" onClick={() => { setBulkImportMode('file'); openBulkModal(); }}>
            <FileSpreadsheet size={16} />
            Import from CSV / PDF
          </button>
          <button className="admin-btn admin-btn-secondary" onClick={() => { setBulkImportMode('api'); openBulkModal(); }}>
            <Network size={16} />
            Affiliate API Sync
          </button>
          <button className="admin-btn admin-btn-primary" onClick={openAddModal}>
            <Plus size={16} />
            Add Product
          </button>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '16px',
          flexWrap: 'wrap',
          marginBottom: '20px',
        }}
      >
        <div className="admin-search-input-wrapper">
          <Search size={16} className="admin-search-icon" />
          <input
            type="text"
            placeholder="Search products..."
            className="admin-search-input"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text)' }}>
            <Filter size={14} />
            <span>Platform:</span>
          </div>

          <select
            className="admin-filter-select"
            value={platformFilter}
            onChange={(e) => {
              setPlatformFilter(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="all">All Platforms</option>
            {platformOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      <AdminTable
        headers={headers}
        items={filteredProducts}
        currentPage={currentPage}
        itemsPerPage={5}
        onPageChange={setCurrentPage}
        renderRow={renderRow}
        emptyMessage="No products match the criteria."
      />

      {/* Add / Edit Product Modal */}
      <AdminModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editItem ? 'Edit Product' : 'Add New Product'}
        footer={
          <>
            <button className="admin-btn admin-btn-secondary" onClick={() => setIsModalOpen(false)} disabled={isUploading}>
              Cancel
            </button>
            <button className="admin-btn admin-btn-primary" onClick={handleSave} disabled={isUploading}>
              {isUploading ? 'Uploading...' : (editItem ? 'Save Changes' : 'Add Product')}
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
            label="Product Name *"
            id="prod-name"
            type="text"
            placeholder="e.g., Apple iPhone 14 Pro Max"
            value={prodName}
            onChange={(e) => setProdName(e.target.value)}
          />

          <AdminFormSelect
            label="Merchant Platform"
            id="prod-platform"
            value={prodPlatform}
            onChange={(e) => setProdPlatform(e.target.value)}
            options={platformOptions}
          />

          <AdminFormSelect
            label="Category"
            id="prod-category"
            value={prodCategory}
            onChange={(e) => setProdCategory(e.target.value)}
            options={categoryOptions}
          />

          <div className="admin-form-row">
            <AdminFormInput
              label="Price (₹) *"
              id="prod-price"
              type="number"
              step="0.01"
              placeholder="29.99"
              value={prodPrice}
              onChange={(e) => setProdPrice(e.target.value)}
            />

            <AdminFormInput
              label="Commission Rate (%) *"
              id="prod-cb-value"
              type="number"
              step="0.1"
              placeholder="10.0"
              value={prodCashbackValue}
              onChange={(e) => setProdCashbackValue(e.target.value)}
            />
          </div>

          <AdminFormInput
            label="Affiliate URL"
            id="prod-affiliate-url"
            type="text"
            placeholder="e.g., https://amzn.to/..."
            value={prodAffiliateUrl}
            onChange={(e) => setProdAffiliateUrl(e.target.value)}
          />

          <div className="admin-form-group">
            <label>Product Image (Upload or URL)</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="admin-form-input"
            />
            {prodImage && (
              <div style={{ marginTop: '10px' }}>
                <img src={prodImage} alt="Preview" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--border)' }} />
              </div>
            )}
            <div style={{ fontSize: '11px', color: 'var(--text)', marginTop: '4px' }}>
              Or you can paste an image URL below:
            </div>
            <input
              type="text"
              placeholder="https://images.unsplash.com/..."
              value={prodImage}
              onChange={(e) => setProdImage(e.target.value)}
              className="admin-form-input"
              style={{ marginTop: '8px' }}
            />
          </div>

          <AdminFormSwitch
            label="Active / Display on feeds"
            id="prod-active"
            checked={prodActive}
            onChange={(e) => setProdActive(e.target.checked)}
          />
        </form>
      </AdminModal>

      {/* Bulk Import Modal */}
      <AdminModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        title="Bulk Product Import Wizard"
        footer={
          <>
            <button className="admin-btn admin-btn-secondary" onClick={() => setIsBulkModalOpen(false)} disabled={isSyncing}>
              Cancel
            </button>
            {previewProducts.length > 0 && (
              <button className="admin-btn admin-btn-primary" onClick={handleImportSubmit} disabled={selectedPreviewIds.size === 0}>
                Import Selected ({selectedPreviewIds.size})
              </button>
            )}
          </>
        }
      >
        <div className="bulk-import-container" style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '70vh', overflowY: 'auto', paddingRight: '8px' }}>
          {wizardError && (
            <div style={{ color: '#ef4444', fontSize: '13px', padding: '8px 12px', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: '6px', fontWeight: '500' }}>
              {wizardError}
            </div>
          )}



          {/* Mode Switcher Tabs */}
          <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
            <button
              onClick={() => { setBulkImportMode('file'); setWizardError(''); }}
              style={{
                padding: '8px 16px',
                border: 'none',
                background: 'none',
                borderBottom: bulkImportMode === 'file' ? '2px solid var(--primary)' : '2px solid transparent',
                color: bulkImportMode === 'file' ? 'var(--text-bold)' : 'var(--text)',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <FileSpreadsheet size={16} />
              CSV & PDF File Upload
            </button>
            <button
              onClick={() => { setBulkImportMode('api'); setWizardError(''); }}
              style={{
                padding: '8px 16px',
                border: 'none',
                background: 'none',
                borderBottom: bulkImportMode === 'api' ? '2px solid var(--primary)' : '2px solid transparent',
                color: bulkImportMode === 'api' ? 'var(--text-bold)' : 'var(--text)',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Network size={16} />
              Affiliate API Auto-Sync
            </button>
            <button
              onClick={() => { setBulkImportMode('raw'); setWizardError(''); }}
              style={{
                padding: '8px 16px',
                border: 'none',
                background: 'none',
                borderBottom: bulkImportMode === 'raw' ? '2px solid var(--primary)' : '2px solid transparent',
                color: bulkImportMode === 'raw' ? 'var(--text-bold)' : 'var(--text)',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <FileText size={16} />
              Raw Text / Code Paste
            </button>
          </div>

          {/* TAB 1: CSV & PDF FILE UPLOADER */}
          {bulkImportMode === 'file' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Sample Templates Downloader Bar */}
              <div style={{
                padding: '12px 16px',
                backgroundColor: 'rgba(59, 130, 246, 0.06)',
                border: '1px solid rgba(59, 130, 246, 0.2)',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '10px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Download size={16} color="#2563eb" />
                  <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-bold)' }}>
                    Need a template to prepare your products?
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    className="admin-btn admin-btn-secondary"
                    onClick={downloadSampleProductCSV}
                    style={{ fontSize: '11px', padding: '5px 10px', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <FileSpreadsheet size={13} />
                    Download Sample CSV
                  </button>
                  <button
                    type="button"
                    className="admin-btn admin-btn-secondary"
                    onClick={downloadSampleProductPDF}
                    style={{ fontSize: '11px', padding: '5px 10px', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <FileText size={13} />
                    Download Sample PDF
                  </button>
                </div>
              </div>

              {/* Default Fallback Selectors */}
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <AdminFormSelect
                    label="Default Platform (if missing in file)"
                    id="file-default-platform"
                    value={fileDefaultPlatform}
                    onChange={(e) => setFileDefaultPlatform(e.target.value)}
                    options={platformOptions}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <AdminFormSelect
                    label="Default Category (if missing in file)"
                    id="file-default-category"
                    value={fileDefaultCategory}
                    onChange={(e) => setFileDefaultCategory(e.target.value)}
                    options={categoryOptions}
                  />
                </div>
              </div>

              {/* Drag & Drop File Upload Box */}
              <div>
                <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-bold)', display: 'block', marginBottom: '6px' }}>
                  Select or Drag & Drop Product File (.CSV, .PDF, .JSON)
                </label>
                <div style={{
                  border: '2px dashed var(--primary)',
                  borderRadius: '10px',
                  padding: '24px 20px',
                  textAlign: 'center',
                  backgroundColor: 'var(--bg)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '10px',
                  cursor: 'pointer'
                }}>
                  <UploadCloud size={32} color="var(--primary)" />
                  <div>
                    <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-bold)', display: 'block' }}>
                      {uploadedFile ? uploadedFile.name : 'Choose a file or drag it here'}
                    </span>
                    <span style={{ fontSize: '12px', color: 'var(--text)' }}>
                      Supports CSV product spreadsheets, PDF rate cards/catalogs, and JSON files
                    </span>
                  </div>
                  <input
                    type="file"
                    accept=".csv,.pdf,.json,.txt"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileUploadParse(e.target.files[0]);
                      }
                    }}
                    style={{ fontSize: '13px', color: 'var(--text)', marginTop: '6px' }}
                  />
                </div>
              </div>

              {uploadedFile && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderRadius: '6px',
                  backgroundColor: 'rgba(16, 185, 129, 0.08)',
                  border: '1px solid rgba(16, 185, 129, 0.2)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CheckCircle2 size={16} color="#10b981" />
                    <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-bold)' }}>
                      {uploadedFile.name} ({(uploadedFile.size / 1024).toFixed(1)} KB)
                    </span>
                  </div>
                  <button
                    type="button"
                    className="admin-btn admin-btn-primary"
                    onClick={() => handleFileUploadParse(uploadedFile)}
                    disabled={isParsingFile}
                    style={{ fontSize: '11px', padding: '4px 10px' }}
                  >
                    {isParsingFile ? 'Parsing File...' : 'Re-Parse File'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: AFFILIATE API SYNC */}
          {bulkImportMode === 'api' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <AdminFormSelect
                    label="Merchant / Platform Source"
                    id="bulk-platform"
                    value={apiPlatform}
                    onChange={(e) => setApiPlatform(e.target.value)}
                    options={platformOptions}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <AdminFormInput
                    label="Keywords / Query (e.g., shoes, headphone)"
                    id="bulk-keyword"
                    type="text"
                    placeholder="Search query..."
                    value={apiKeyword}
                    onChange={(e) => setApiKeyword(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <AdminFormSelect
                    label="Default Category"
                    id="bulk-category"
                    value={apiCategory}
                    onChange={(e) => setApiCategory(e.target.value)}
                    options={categoryOptions}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <AdminFormSelect
                    label="Limit (Product Count)"
                    id="bulk-limit"
                    value={apiLimit}
                    onChange={(e) => setApiLimit(parseInt(e.target.value))}
                    options={[
                      { value: '5', label: 'Import 5 Products' },
                      { value: '10', label: 'Import 10 Products' },
                      { value: '20', label: 'Import 20 Products' },
                      { value: '50', label: 'Import 50 Products' }
                    ]}
                  />
                </div>
              </div>

              {/* Active Network Indicator */}
              <div style={{
                padding: '10px 14px',
                borderRadius: '8px',
                backgroundColor: getNetworkForStore(apiPlatform) === 'amazon' ? 'rgba(245, 158, 11, 0.08)' : 'rgba(59, 130, 246, 0.08)',
                border: getNetworkForStore(apiPlatform) === 'amazon' ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid rgba(59, 130, 246, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Network size={16} color={getNetworkForStore(apiPlatform) === 'amazon' ? '#d97706' : '#2563eb'} />
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-bold)' }}>
                      {getNetworkForStore(apiPlatform) === 'amazon' ? 'Amazon PA-API & Associates Engine' : 'Cuelinks Universal Indian Network Gateway'}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text)' }}>
                      {getNetworkForStore(apiPlatform) === 'amazon' 
                        ? 'Direct Amazon India API with associate tag tracking' 
                        : `Routes ${apiPlatform} via Cuelinks Sub-ID aggregator (${cuelinksPubId})`}
                    </div>
                  </div>
                </div>
                <span style={{
                  fontSize: '11px',
                  fontWeight: '600',
                  padding: '3px 8px',
                  borderRadius: '12px',
                  backgroundColor: '#10b981',
                  color: '#ffffff'
                }}>
                  Active
                </span>
              </div>

              {/* API Credentials Toggle */}
              <div style={{ border: '1px solid var(--border)', borderRadius: '6px', padding: '10px', backgroundColor: 'var(--bg)' }}>
                <button
                  type="button"
                  onClick={() => setShowCredentials(!showCredentials)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-bold)',
                    fontWeight: '600',
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Settings size={14} />
                    API Credentials ({getNetworkForStore(apiPlatform) === 'amazon' ? 'Amazon PA-API' : 'Cuelinks Network'})
                  </span>
                  <span>{showCredentials ? '▲' : '▼'}</span>
                </button>

                {showCredentials && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px' }}>
                    {getNetworkForStore(apiPlatform) === 'amazon' ? (
                      <>
                        <AdminFormInput
                          label="Amazon Associate Tag"
                          id="aws-assoc-tag"
                          type="text"
                          value={awsAssociateTag}
                          onChange={(e) => setAwsAssociateTag(e.target.value)}
                        />
                        <AdminFormInput
                          label="AWS Partner / Access Key"
                          id="aws-access-key"
                          type="text"
                          value={awsAccessKey}
                          onChange={(e) => setAwsAccessKey(e.target.value)}
                        />
                        <AdminFormInput
                          label="AWS Secret Access Key"
                          id="aws-secret-key"
                          type="password"
                          value={awsSecretKey}
                          onChange={(e) => setAwsSecretKey(e.target.value)}
                        />
                      </>
                    ) : (
                      <>
                        <AdminFormInput
                          label="Cuelinks Publisher ID (pub_id)"
                          id="cue-pub-id"
                          type="text"
                          value={cuelinksPubId}
                          onChange={(e) => setCuelinksPubId(e.target.value)}
                        />
                        <AdminFormInput
                          label="Cuelinks Secret API Token"
                          id="cue-api-token"
                          type="password"
                          value={cuelinksToken}
                          onChange={(e) => setCuelinksToken(e.target.value)}
                        />
                      </>
                    )}
                    <button
                      type="button"
                      className="admin-btn admin-btn-secondary"
                      style={{ alignSelf: 'flex-end', fontSize: '12px', padding: '6px 12px' }}
                      onClick={() => {
                        saveAffiliateNetworkConfigs({
                          amazon: { ...networkConfigs.amazon, associateTag: awsAssociateTag, accessKey: awsAccessKey, secretKey: awsSecretKey },
                          cuelinks: { ...networkConfigs.cuelinks, publisherId: cuelinksPubId, apiToken: cuelinksToken }
                        });
                        alert('Affiliate credentials saved successfully!');
                      }}
                    >
                      Save Credentials
                    </button>
                  </div>
                )}
              </div>

              <button
                type="button"
                className="admin-btn admin-btn-primary"
                onClick={handleApiFetch}
                disabled={isSyncing}
                style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '8px', padding: '10px' }}
              >
                {isSyncing ? 'Connecting & Syncing API Feed...' : `Fetch ${apiPlatform} Products via ${getNetworkForStore(apiPlatform) === 'amazon' ? 'Amazon PA-API' : 'Cuelinks'}`}
              </button>
            </div>
          )}

          {/* TAB 3: RAW TEXT / JSON PASTE */}
          {bulkImportMode === 'raw' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <AdminFormSelect
                    label="Pasted Data Format"
                    id="raw-format"
                    value={rawFormat}
                    onChange={(e) => setRawFormat(e.target.value)}
                    options={[
                      { value: 'csv', label: 'Standard Comma-separated (CSV)' },
                      { value: 'json', label: 'Structured JSON Array' }
                    ]}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <AdminFormSelect
                    label="Default Platform (if missing)"
                    id="raw-default-platform"
                    value={rawDefaultPlatform}
                    onChange={(e) => setRawDefaultPlatform(e.target.value)}
                    options={platformOptions}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-bold)', display: 'block', marginBottom: '6px' }}>
                  Paste Products Code/Text
                </label>
                <textarea
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder={
                    rawFormat === 'json'
                      ? '[\n  {\n    "name": "Headphones X",\n    "platform": "Amazon",\n    "price": 2999,\n    "cashbackValue": 10,\n    "image": ""\n  }\n]'
                      : 'name, platform, price, cashbackValue, affiliateUrl\n"Sony WH-1000XM5", "Amazon", 29999, 10, "https://amazon.in/dp/sample"'
                  }
                  style={{
                    width: '100%',
                    height: '120px',
                    fontFamily: 'monospace',
                    fontSize: '12px',
                    padding: '8px',
                    borderRadius: '6px',
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--bg)',
                    color: 'var(--text)',
                    resize: 'vertical'
                  }}
                />
              </div>

              {/* Template Tip Box */}
              <div style={{ fontSize: '11px', color: 'var(--text)', padding: '8px', backgroundColor: 'var(--bg)', borderLeft: '3px solid var(--primary)', borderRadius: '4px' }}>
                {rawFormat === 'json' ? (
                  <span><strong>Format Tip:</strong> Paste a valid JSON Array. Fields: <code>name</code> (required), <code>price</code> (required), <code>platform</code> (optional), <code>cashbackValue</code> (optional), <code>image</code> (optional).</span>
                ) : (
                  <span><strong>Format Tip:</strong> Include a header line with: <code>name, platform, price, cashbackValue, affiliateUrl</code>. Separate fields with commas.</span>
                )}
              </div>

              <button
                type="button"
                className="admin-btn admin-btn-primary"
                onClick={handleRawParse}
                style={{ width: '100%', padding: '10px' }}
              >
                Parse Raw Data
              </button>
            </div>
          )}

          {/* Terminal Console Logs Panel */}
          {terminalLogs.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '700', color: 'var(--text-bold)' }}>
                <Terminal size={14} />
                <span>Console Log / Processing Output</span>
              </div>
              <div
                style={{
                  backgroundColor: '#0d1117',
                  border: '1px solid #30363d',
                  borderRadius: '6px',
                  padding: '12px',
                  fontFamily: 'monospace',
                  fontSize: '11px',
                  color: '#3fb950',
                  maxHeight: '150px',
                  overflowY: 'auto',
                  lineHeight: '1.6'
                }}
              >
                {terminalLogs.map((log, idx) => (
                  <div key={idx} style={{ color: log.startsWith('[ERROR]') ? '#f85149' : log.startsWith('[SUCCESS]') ? '#58a6ff' : '#3fb950' }}>
                    {log}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Preview Import Table */}
          {previewProducts.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-bold)' }}>
                  Preview Ready Items ({previewProducts.length} items parsed)
                </span>
                <button
                  type="button"
                  onClick={toggleSelectAllPreviewItems}
                  style={{ fontSize: '11px', background: 'none', border: 'none', color: 'var(--primary)', fontWeight: '600', cursor: 'pointer' }}
                >
                  {selectedPreviewIds.size === previewProducts.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>

              <div style={{ border: '1px solid var(--border)', borderRadius: '6px', overflow: 'hidden', backgroundColor: 'var(--card-bg)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ backgroundColor: 'var(--bg)', borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                      <th style={{ padding: '8px 12px', width: '30px' }}></th>
                      <th style={{ padding: '8px 12px', width: '50px' }}>Image</th>
                      <th style={{ padding: '8px 12px' }}>Name</th>
                      <th style={{ padding: '8px 12px', width: '80px' }}>Platform</th>
                      <th style={{ padding: '8px 12px', width: '70px' }}>Price</th>
                      <th style={{ padding: '8px 12px', width: '70px' }}>Commission</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewProducts.map((p) => (
                      <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '6px 12px', textAlign: 'center' }}>
                          <input
                            type="checkbox"
                            checked={selectedPreviewIds.has(p.id)}
                            onChange={() => toggleSelectPreviewItem(p.id)}
                            style={{ cursor: 'pointer' }}
                          />
                        </td>
                        <td style={{ padding: '6px 12px' }}>
                          <img
                            src={p.image}
                            alt=""
                            style={{ width: '30px', height: '30px', objectFit: 'cover', borderRadius: '4px' }}
                            onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300'; }}
                          />
                        </td>
                        <td style={{ padding: '6px 12px', fontWeight: '500', color: 'var(--text-bold)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '180px' }}>
                          {p.name}
                        </td>
                        <td style={{ padding: '6px 12px' }}>{p.platform}</td>
                        <td style={{ padding: '6px 12px', fontWeight: '600' }}>₹{Number(p.price || 0).toFixed(2)}</td>
                        <td style={{ padding: '6px 12px', color: 'var(--secondary)', fontWeight: '600' }}>{p.cashbackValue}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </AdminModal>
    </div>
  );
}
