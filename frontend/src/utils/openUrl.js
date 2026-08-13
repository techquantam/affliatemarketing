import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';
import { buildAffiliateTrackingUrl, getNetworkForStore } from '../services/affiliateNetworks';

/**
 * Standard store base URLs
 */
const STORE_BASE_URLS = {
  'amazon': 'https://www.amazon.in',
  'flipkart': 'https://www.flipkart.com',
  'myntra': 'https://www.myntra.com',
  'ajio': 'https://www.ajio.com',
  'nykaa': 'https://www.nykaa.com',
  'nykaa beauty': 'https://www.nykaa.com',
  'makemytrip': 'https://www.makemytrip.com',
  'meesho': 'https://www.meesho.com',
  'croma': 'https://www.croma.com',
  'tata cliq': 'https://www.tatacliq.com',
  'swiggy': 'https://www.swiggy.com',
  'zomato': 'https://www.zomato.com'
};

/**
 * Check if a URL is a real valid external destination (not a dummy placeholder)
 */
export const isValidShoppingUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (trimmed === '' || trimmed === '#' || trimmed === 'https://google.com' || trimmed === 'http://google.com') return false;
  
  // Disallow common mock or broken placeholder links
  if (
    trimmed.includes('example.com') ||
    trimmed.includes('link.amazon/') ||
    trimmed.includes('mock.affiliate.link') ||
    trimmed.includes('affiliate.example')
  ) {
    return false;
  }
  
  // Must be parseable as a valid domain with a real extension
  try {
    const full = /^https?:\/\//i.test(trimmed) ? trimmed : 'https://' + trimmed;
    const parsed = new URL(full);
    return Boolean(parsed.hostname && parsed.hostname.includes('.'));
  } catch (e) {
    return false;
  }
};

/**
 * Helper to ensure a URL has http/https protocol
 */
export const ensureProtocol = (url = '') => {
  if (!url || typeof url !== 'string') return 'https://www.amazon.in';
  let target = url.trim();
  if (target === '' || target === '#') return 'https://www.amazon.in';
  if (!/^https?:\/\//i.test(target)) {
    target = 'https://' + target;
  }
  return target;
};

/**
 * Get direct destination URL for a store with affiliate tracking
 */
export const getStoreUrl = (storeName = '', customUrl = '', userId = 'user') => {
  let baseTarget = 'https://www.amazon.in';
  if (isValidShoppingUrl(customUrl)) {
    baseTarget = ensureProtocol(customUrl);
  } else {
    const cleanName = (storeName || '').trim().toLowerCase();
    for (const [key, val] of Object.entries(STORE_BASE_URLS)) {
      if (cleanName === key || cleanName.includes(key) || key.includes(cleanName)) {
        baseTarget = val;
        break;
      }
    }
    if (baseTarget === 'https://www.amazon.in' && cleanName && !cleanName.includes('amazon')) {
      baseTarget = `https://www.flipkart.com/search?q=${encodeURIComponent(storeName)}`;
    }
  }

  // Wrap with Cuelinks or Amazon tracking
  return buildAffiliateTrackingUrl({ targetUrl: baseTarget, storeName, userId });
};

/**
 * Get destination product search or affiliate link for a product on a specific platform
 * Optimized for direct fast product opening with Cuelinks / Amazon affiliate attribution
 */
export const getProductPlatformUrl = (productOrDeal, platformName = '', userId = 'user') => {
  if (!productOrDeal) return getStoreUrl(platformName, '', userId);

  const title = (productOrDeal.title || productOrDeal.name || '').trim();
  const productPlatform = (productOrDeal.platform || productOrDeal.sourcePlatform || 'Amazon').trim();
  const targetPlatform = (platformName || productPlatform).trim();

  const isSamePlatform = targetPlatform.toLowerCase() === productPlatform.toLowerCase() ||
    (targetPlatform.toLowerCase().includes('amazon') && productPlatform.toLowerCase().includes('amazon')) ||
    (targetPlatform.toLowerCase().includes('flipkart') && productPlatform.toLowerCase().includes('flipkart')) ||
    (targetPlatform.toLowerCase().includes('myntra') && productPlatform.toLowerCase().includes('myntra')) ||
    (targetPlatform.toLowerCase().includes('meesho') && productPlatform.toLowerCase().includes('meesho')) ||
    (targetPlatform.toLowerCase().includes('ajio') && productPlatform.toLowerCase().includes('ajio')) ||
    (targetPlatform.toLowerCase().includes('nykaa') && productPlatform.toLowerCase().includes('nykaa'));

  // If clicking on the product's native platform and a valid affiliate/product link is saved, use it directly
  if (isSamePlatform) {
    const directLink = productOrDeal.affiliateUrl || productOrDeal.productUrl || productOrDeal.link || productOrDeal.url;
    if (isValidShoppingUrl(directLink)) {
      return buildAffiliateTrackingUrl({ targetUrl: ensureProtocol(directLink), storeName: targetPlatform, userId });
    }
  }

  if (!title) {
    return getStoreUrl(targetPlatform, '', userId);
  }

  let merchantSearchUrl = `https://www.amazon.in/s?k=${encodeURIComponent(title)}`;
  const cleanTarget = targetPlatform.toLowerCase();

  // Fast direct merchant search / product URL
  if (cleanTarget.includes('amazon')) {
    merchantSearchUrl = `https://www.amazon.in/s?k=${encodeURIComponent(title)}`;
  } else if (cleanTarget.includes('flipkart')) {
    merchantSearchUrl = `https://www.flipkart.com/search?q=${encodeURIComponent(title)}`;
  } else if (cleanTarget.includes('myntra')) {
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    merchantSearchUrl = `https://www.myntra.com/${encodeURIComponent(slug)}`;
  } else if (cleanTarget.includes('meesho')) {
    merchantSearchUrl = `https://www.meesho.com/search?q=${encodeURIComponent(title)}`;
  } else if (cleanTarget.includes('ajio')) {
    merchantSearchUrl = `https://www.ajio.com/search/?text=${encodeURIComponent(title)}`;
  } else if (cleanTarget.includes('nykaa')) {
    merchantSearchUrl = `https://www.nykaa.com/search/result/?q=${encodeURIComponent(title)}`;
  } else if (cleanTarget.includes('makemytrip')) {
    merchantSearchUrl = `https://www.makemytrip.com`;
  } else if (cleanTarget.includes('croma')) {
    merchantSearchUrl = `https://www.croma.com/searchB?q=${encodeURIComponent(title)}`;
  }

  return buildAffiliateTrackingUrl({
    targetUrl: merchantSearchUrl,
    storeName: targetPlatform,
    userId
  });
};

/**
 * Open an external URL instantaneously in Native Android / iOS and Web browsers.
 */
export const openExternalUrl = async (url) => {
  if (!url) return;
  const targetUrl = ensureProtocol(url);

  // 1. In Native Android/Capacitor App: open Chrome Custom Tab / In-App browser immediately
  if (Capacitor.isNativePlatform()) {
    try {
      await Browser.open({ url: targetUrl, windowName: '_blank' });
      return;
    } catch (err) {
      console.warn('Native Browser.open failed, falling back to window.open', err);
    }
  }

  // 2. In Web Browser / Fallback: open new tab directly
  try {
    const newWindow = window.open(targetUrl, '_blank', 'noopener,noreferrer');
    if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
      window.location.href = targetUrl;
    }
  } catch (e) {
    window.location.href = targetUrl;
  }
};
