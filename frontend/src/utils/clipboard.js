export const copyToClipboard = async (text) => {
  if (!text) return false;
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (err) {
    console.warn('navigator.clipboard failed, using fallback:', err);
  }

  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.top = '-9999px';
    textArea.style.left = '-9999px';
    textArea.setAttribute('readonly', '');
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    console.error('Copy fallback failed:', err);
    return false;
  }
};

export const getReferralDetails = (user) => {
  if (!user) return { code: 'LIOMART', link: 'https://liomart.co.in/signup?ref=LIOMART', shareText: 'Join LIO MART and earn cashback on every shopping! https://liomart.co.in' };
  
  let code = user.referralCode || user.referral_code;
  if (!code || code.trim() === '') {
    const cleanName = user.name ? user.name.replace(/[^a-zA-Z]/g, '').toUpperCase() : '';
    const prefix = cleanName.length >= 3 ? cleanName.substring(0, 3) : 'LIO';
    const idSuffix = user.id ? user.id.replace(/[^0-9]/g, '').slice(-4) : '12345';
    code = `${prefix}${idSuffix || '10001'}`;
  }
  
  const link = user.referralLink || user.referral_link || `https://liomart.co.in/signup?ref=${code}`;
  const shareText = `Join LIO MART and earn cashback on every shopping! Use my code ${code} - ${link}`;
  
  return { code, link, shareText };
};
