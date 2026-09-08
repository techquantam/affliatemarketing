/**
 * Generates an ultra-reliable inline SVG data URI for store logo fallbacks.
 * Zero network dependencies, instant rendering, never 404s.
 */
export function getFallbackStoreLogo(name = 'Store') {
  const safeName = String(name || 'Store').trim() || 'Store';
  const initial = safeName.charAt(0).toUpperCase();
  const displayName = safeName.length > 14 ? safeName.substring(0, 12) + '..' : safeName;

  // Modern SVG with gradient background and clean typography
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="80" viewBox="0 0 160 80">
    <defs>
      <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#fff5f0"/>
        <stop offset="100%" stop-color="#fed7aa"/>
      </linearGradient>
    </defs>
    <rect width="100%" height="100%" rx="12" fill="url(#grad)" stroke="#fdba74" stroke-width="1.5"/>
    <circle cx="40" cy="40" r="22" fill="#ff4f2f" />
    <text x="40" y="47" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="20" font-weight="bold" fill="#ffffff" text-anchor="middle">${initial}</text>
    <text x="72" y="45" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="700" fill="#1f2937">${displayName}</text>
  </svg>`.trim().replace(/\n\s*/g, '');

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Validates and normalizes store logo URL with fallback.
 */
export function normalizeStoreLogo(logo, storeName = 'Store') {
  if (!logo || typeof logo !== 'string') {
    return getFallbackStoreLogo(storeName);
  }
  const clean = logo.trim();
  if (!clean) {
    return getFallbackStoreLogo(storeName);
  }
  return clean;
}
