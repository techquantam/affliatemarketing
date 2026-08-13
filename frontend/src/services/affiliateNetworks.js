/**
 * Universal Affiliate Network Service
 * Handles Amazon PA-API, Cuelinks Multi-Store Aggregator (Flipkart, Meesho, Myntra, Ajio, etc.), and AWIN Network
 */

const STORAGE_KEY = 'liomart_affiliate_networks_config';

const DEFAULT_CONFIGS = {
  amazon: {
    id: 'amazon',
    name: 'Amazon India Associates & PA-API',
    status: 'active',
    associateTag: 'liomart-21',
    accessKey: 'AKIAIOSFODNN7EXAMPLE',
    secretKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
    region: 'webservices.amazon.in',
    description: 'Direct PA-API integration for Amazon India retail catalog & deals.',
    storesCovered: ['Amazon']
  },
  cuelinks: {
    id: 'cuelinks',
    name: 'Cuelinks Universal Indian Aggregator',
    status: 'active',
    publisherId: '189241',
    apiToken: 'cue_live_sec_89172401824',
    channelId: 'liomart_app',
    redirectDomain: 'https://linksredirect.com/',
    description: 'Master affiliate gateway for Flipkart, Meesho, Myntra, Ajio, Nykaa, MakeMyTrip, Boat & 1000+ Indian merchants.',
    storesCovered: ['Flipkart', 'Meesho', 'Myntra', 'Ajio', 'Nykaa', 'Nykaa Beauty', 'MakeMyTrip', 'boAt', 'Croma', 'Tata Cliq', 'Mamaearth', 'Swiggy', 'Zomato']
  },
  awin: {
    id: 'awin',
    name: 'AWIN Global Network',
    status: 'upcoming',
    publisherId: 'AWIN-PUB-99410',
    apiToken: 'awin_token_placeholder',
    description: 'Global fashion & international retail network (Planned for Phase 2 expansion).',
    storesCovered: ['ASOS', 'AliExpress', 'Farfetch', 'Global Brands']
  }
};

export const getAffiliateNetworkConfigs = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...DEFAULT_CONFIGS, ...parsed };
    }
  } catch (e) {
    console.warn('Failed to load saved affiliate network configs:', e);
  }
  return DEFAULT_CONFIGS;
};

export const saveAffiliateNetworkConfigs = (newConfigs) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newConfigs));
  } catch (e) {
    console.error('Failed to save affiliate network configs:', e);
  }
};

export const getNetworkForStore = (storeName = '') => {
  const clean = (storeName || '').trim().toLowerCase();
  if (clean.includes('amazon')) {
    return 'amazon';
  }
  return 'cuelinks'; // Default to Cuelinks for all Indian retailers (Flipkart, Meesho, Myntra, Ajio, etc.)
};

/**
 * Builds standard tracking URL using the active affiliate network
 */
export const buildAffiliateTrackingUrl = ({ targetUrl, storeName = 'Amazon', userId = 'guest', clickId = '' }) => {
  if (!targetUrl) return 'https://www.amazon.in';

  const configs = getAffiliateNetworkConfigs();
  const network = getNetworkForStore(storeName);
  const subId = `${userId}_${clickId || Date.now()}`;

  if (network === 'amazon') {
    const amazonTag = configs.amazon?.associateTag || 'liomart-21';
    try {
      const parsed = new URL(targetUrl.startsWith('http') ? targetUrl : `https://${targetUrl}`);
      parsed.searchParams.set('tag', amazonTag);
      parsed.searchParams.set('ascsubtag', subId);
      return parsed.toString();
    } catch {
      const separator = targetUrl.includes('?') ? '&' : '?';
      return `${targetUrl}${separator}tag=${encodeURIComponent(amazonTag)}&ascsubtag=${encodeURIComponent(subId)}`;
    }
  }

  if (network === 'cuelinks') {
    const pubId = configs.cuelinks?.publisherId || '189241';
    const redirectBase = configs.cuelinks?.redirectDomain || 'https://linksredirect.com/';
    return `${redirectBase}?pub_id=${encodeURIComponent(pubId)}&subid=${encodeURIComponent(subId)}&url=${encodeURIComponent(targetUrl)}`;
  }

  return targetUrl;
};

/**
 * Generates realistic catalog products for API Bulk Import Wizard based on Cuelinks or Amazon PA-API
 */
export const fetchNetworkCatalogProducts = ({ platform = 'Amazon', keyword = '', category = 'electronics', limit = 10 }) => {
  const normalizedKeyword = (keyword || '').toLowerCase();
  let baseItems = [];

  if (normalizedKeyword.includes('head') || normalizedKeyword.includes('ear') || normalizedKeyword.includes('sound') || normalizedKeyword.includes('audio') || normalizedKeyword.includes('boat')) {
    baseItems = [
      { name: 'Sony WH-1000XM5 Wireless Active Noise Cancelling Headphones', price: 29990.00, image: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=300' },
      { name: 'boAt Rockerz 550 Over Ear Bluetooth Wireless Headphones', price: 1999.00, image: 'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=300' },
      { name: 'JBL Tune 760NC Over-Ear Active Noise Cancelling', price: 5499.00, image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300' },
      { name: 'OnePlus Buds Pro 2 Dual Driver TWS Earbuds', price: 9999.00, image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=300' },
      { name: 'Apple AirPods Pro (2nd Generation) Type-C MagSafe', price: 24900.00, image: 'https://images.unsplash.com/photo-1588449668338-d15168b5a4c5?w=300' },
    ];
  } else if (normalizedKeyword.includes('shoe') || normalizedKeyword.includes('sneaker') || normalizedKeyword.includes('boot') || normalizedKeyword.includes('run') || normalizedKeyword.includes('nike') || normalizedKeyword.includes('dress') || normalizedKeyword.includes('saree') || normalizedKeyword.includes('kurti')) {
    baseItems = [
      { name: 'Nike Air Max SYSTM Casual Sports Running Sneakers', price: 8495.00, image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300' },
      { name: 'Adidas Grand Court Base 2.0 Tennis Sneakers', price: 4299.00, image: 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=300' },
      { name: 'Puma Softride Enzo Evo High-Performance Running Shoes', price: 3499.00, image: 'https://images.unsplash.com/photo-1539185441755-769473a23570?w=300' },
      { name: 'Libas Women Embroidered Anarkali Kurta with Dupatta Set', price: 1899.00, image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=300' },
      { name: 'Woodland Camel Outdoor Hiking Genuine Leather Boots', price: 5295.00, image: 'https://images.unsplash.com/photo-1520639888713-7851133b1ed0?w=300' },
    ];
  } else if (normalizedKeyword.includes('laptop') || normalizedKeyword.includes('comput') || normalizedKeyword.includes('macbook') || normalizedKeyword.includes('dell') || normalizedKeyword.includes('phone') || normalizedKeyword.includes('mobile')) {
    baseItems = [
      { name: 'HP Laptop 15s AMD Ryzen 5 (16GB RAM/512GB NVMe SSD)', price: 43990.00, image: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=300' },
      { name: 'Apple MacBook Air M3 (8-core CPU, 256GB SSD, Liquid Retina)', price: 104900.00, image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=300' },
      { name: 'ASUS Vivobook 16 Intel Core i5 12th Gen Thin Laptop', price: 48990.00, image: 'https://images.unsplash.com/photo-1496181130204-7552cc14ac1a?w=300' },
      { name: 'Samsung Galaxy S24 5G AI Smartphone (8GB/256GB)', price: 69999.00, image: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=300' },
      { name: 'Dell Inspiron 3530 Laptop Intel Core i5-1335U FHD', price: 53490.00, image: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=300' },
    ];
  } else if (normalizedKeyword.includes('cream') || normalizedKeyword.includes('cleans') || normalizedKeyword.includes('serum') || normalizedKeyword.includes('skin') || normalizedKeyword.includes('shampoo') || normalizedKeyword.includes('nykaa') || normalizedKeyword.includes('beauty')) {
    baseItems = [
      { name: 'Cetaphil Gentle Skin Cleanser for Sensitive Skin (250ml)', price: 425.00, image: 'https://images.unsplash.com/photo-1608248597481-496100c8c836?w=300' },
      { name: 'L\'Oreal Paris Hyaluronic Acid Serum with Micro Epidermic (30ml)', price: 799.00, image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=300' },
      { name: 'Nivea Soft Light Moisturiser Cream with Vitamin E (300ml)', price: 349.00, image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=300' },
      { name: 'Neutrogena Ultra Sheer Dry-Touch Sunscreen SPF 50+ (88ml)', price: 650.00, image: 'https://images.unsplash.com/photo-1617897903246-719242758050?w=300' },
      { name: 'Minimalist 10% Vitamin C Face Serum for Glowing Skin (30ml)', price: 699.00, image: 'https://images.unsplash.com/photo-1601049676099-e7ed07d825b0?w=300' },
    ];
  } else if (normalizedKeyword.includes('hotel') || normalizedKeyword.includes('flight') || normalizedKeyword.includes('tour') || normalizedKeyword.includes('trip') || normalizedKeyword.includes('makemytrip')) {
    baseItems = [
      { name: 'Goa Holiday Package: 3 Nights Luxury Beach Resort + Breakfast Included', price: 14500.00, image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=300' },
      { name: 'Delhi to Mumbai Indigo Airlines Direct Flight Voucher', price: 4200.00, image: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=300' },
      { name: 'Himachal All-Inclusive Tour Package: Kullu-Manali 5D/4N', price: 22000.00, image: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=300' },
      { name: 'Taj Mahal Palace Mumbai: 1 Night Heritage Sea View Room Booking', price: 18500.00, image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=300' },
    ];
  } else {
    const seed = keyword ? keyword.charAt(0).toUpperCase() + keyword.slice(1) : 'Premium Brand';
    baseItems = [
      { name: `${seed} Pro Edition Series 2026`, price: 2999.00, image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300' },
      { name: `Original ${seed} Deluxe Multi-Functional Gadget`, price: 1499.00, image: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=300' },
      { name: `Ultra ${seed} Smart Living Essentials Pack`, price: 7999.00, image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300' },
      { name: `Compact ${seed} Travel Edition Pack`, price: 499.00, image: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=300' },
      { name: `Exclusive ${seed} Elite Flagship Edition`, price: 12500.00, image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300' },
    ];
  }

  const storeRates = {
    'Amazon': 10.0,
    'Myntra': 12.0,
    'Flipkart': 8.5,
    'Meesho': 14.0,
    'Ajio': 15.0,
    'Nykaa Beauty': 7.0,
    'Nykaa': 7.0,
    'MakeMyTrip': 9.0,
    'boAt': 12.0,
    'Croma': 6.0
  };

  const commission = storeRates[platform] || 10.0;
  const network = getNetworkForStore(platform);

  return baseItems.slice(0, limit).map((item, idx) => {
    // Generate real merchant destination and wrap with network tracker
    let rawMerchantUrl = `https://www.${platform.toLowerCase().replace(/\s+/g, '')}.com/p/${idx + 101}`;
    if (platform.toLowerCase() === 'amazon') rawMerchantUrl = `https://www.amazon.in/dp/B08N5WRWNW`;
    else if (platform.toLowerCase() === 'flipkart') rawMerchantUrl = `https://www.flipkart.com/product/p/itm${idx + 200}`;
    else if (platform.toLowerCase() === 'myntra') rawMerchantUrl = `https://www.myntra.com/${idx + 300}`;
    else if (platform.toLowerCase() === 'meesho') rawMerchantUrl = `https://www.meesho.com/product/p/${idx + 400}`;

    const trackableAffiliateUrl = buildAffiliateTrackingUrl({
      targetUrl: rawMerchantUrl,
      storeName: platform,
      userId: 'admin_catalog',
      clickId: `init_${Date.now()}_${idx}`
    });

    return {
      id: `prod-${platform.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}-${idx}`,
      name: item.name,
      platform: platform,
      price: item.price,
      cashbackValue: commission,
      affiliateUrl: trackableAffiliateUrl,
      image: item.image,
      category: category,
      network: network, // 'amazon' or 'cuelinks'
      status: 'active'
    };
  });
};
