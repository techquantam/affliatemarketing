/**
 * Helper to clean and extract product identifier from a URL (e.g. Amazon ASIN or Flipkart PID).
 * Returns host/path details for general URLs.
 */
export const getCleanedUrlIdentifier = (urlStr) => {
  if (!urlStr || typeof urlStr !== 'string') return null;
  
  let normalizedUrlStr = urlStr.trim();
  
  // Quick check: if it doesn't contain a dot or slashes, it's not a URL
  if (!normalizedUrlStr.includes('.') && !normalizedUrlStr.includes('/') && !normalizedUrlStr.includes('://')) {
    return null;
  }

  // Prepend https:// if it looks like a domain but lacks protocol (e.g. "amazon.in/dp/...")
  if (!/^https?:\/\//i.test(normalizedUrlStr)) {
    normalizedUrlStr = 'https://' + normalizedUrlStr;
  }

  try {
    const url = new URL(normalizedUrlStr);
    
    // 1. Resolve tracking redirects
    if (url.searchParams.has('targetUrl')) {
      return getCleanedUrlIdentifier(url.searchParams.get('targetUrl'));
    }
    if (url.searchParams.has('url')) {
      return getCleanedUrlIdentifier(url.searchParams.get('url'));
    }
    
    const host = url.hostname.toLowerCase().replace(/^www\./, '');
    const pathname = url.pathname;
    
    // 2. Platform-specific product IDs
    if (host.includes('amazon.')) {
      const dpMatch = pathname.match(/\/(?:dp|gp\/product)\/([A-Z0-9]{10})/i);
      if (dpMatch) return `amazon-${dpMatch[1].toUpperCase()}`;
    }
    
    if (host.includes('flipkart.')) {
      const pid = url.searchParams.get('pid');
      if (pid) return `flipkart-${pid.toUpperCase()}`;
      
      const pMatch = pathname.match(/\/p\/([a-z0-9]{16})/i);
      if (pMatch) return `flipkart-${pMatch[1].toUpperCase()}`;
    }
    
    // 3. Fallback generic path match (ignoring query params and trailing slashes)
    const cleanedPath = pathname.replace(/\/+$/, '').toLowerCase();
    return `${host}${cleanedPath}`;
  } catch (e) {
    return null;
  }
};
