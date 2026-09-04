import React, { useState, useEffect } from 'react';
import { Wallet, Link, History, Gift, Copy, Check, ShieldCheck, ArrowUpRight, Share2, Percent, Trash2, Play, ExternalLink, Plus, BookOpen, HelpCircle, User, Camera, ArrowLeft, ShieldAlert, CreditCard, Landmark } from 'lucide-react';
import { apiSharedLinks, apiSharedCommissions, apiSettings, apiUsers, apiUpload } from '../services/api';
import UserLedger from './UserLedger';
import UserSupport from './UserSupport';
import { buildAffiliateTrackingUrl } from '../services/affiliateNetworks';

const DUMMY_CLICKS = [];

export default function Dashboard({ currentUser, onAddNotification, setView, onAddWithdrawalRequest, onUpdateUser, initialTab, setInitialTab }) {
  const [activeTab, setActiveTabRaw] = useState(initialTab || 'overview');

  const setActiveTab = (tab) => {
    setActiveTabRaw(tab);
    if (setInitialTab) setInitialTab(tab);
  };

  useEffect(() => {
    if (initialTab && initialTab !== activeTab) {
      setActiveTabRaw(initialTab);
    }
  }, [initialTab]);

  const [copiedLink, setCopiedLink] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);

  // --- WITHDRAWAL STATES ---
  const [showWithdrawForm, setShowWithdrawForm] = useState(false);
  const [withdrawUpi, setWithdrawUpi] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');

  // --- PROFILE STATES ---
  const [profileName, setProfileName] = useState(currentUser?.name || '');
  const [profileEmail, setProfileEmail] = useState(currentUser?.email || '');
  const [profilePhone, setProfilePhone] = useState(currentUser?.phone || '');
  const [profileDob, setProfileDob] = useState(currentUser?.dob || '');
  const [profileGender, setProfileGender] = useState(currentUser?.gender || 'Male');
  const [profileAddress, setProfileAddress] = useState(currentUser?.address || '');
  const [profileCity, setProfileCity] = useState(currentUser?.city || '');
  const [profileState, setProfileState] = useState(currentUser?.state || '');
  const [profilePincode, setProfilePincode] = useState(currentUser?.pincode || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // --- PAYMENT DETAILS STATES ---
  const [upiId, setUpiId] = useState(currentUser?.upiId || '');
  const [bankAccountName, setBankAccountName] = useState(currentUser?.bankAccountName || '');
  const [bankAccountNumber, setBankAccountNumber] = useState(currentUser?.bankAccountNumber || '');
  const [bankIfsc, setBankIfsc] = useState(currentUser?.bankIfsc || '');
  const [bankName, setBankName] = useState(currentUser?.bankName || '');
  const [isEditingPayment, setIsEditingPayment] = useState(
    !currentUser?.upiId && !currentUser?.bankAccountNumber
  );
  const [isSavingPayment, setIsSavingPayment] = useState(false);

  // --- KYC STATES ---
  const [kycAadhaar, setKycAadhaar] = useState(currentUser?.aadhaarNumber || '');
  const [kycPan, setKycPan] = useState(currentUser?.panNumber || '');
  const [aadhaarFront, setAadhaarFront] = useState(currentUser?.aadhaarFrontUrl || '');
  const [aadhaarBack, setAadhaarBack] = useState(currentUser?.aadhaarBackUrl || '');
  const [panCard, setPanCard] = useState(currentUser?.panCardUrl || '');
  const [selfie, setSelfie] = useState(currentUser?.selfieUrl || '');
  const [uploadingField, setUploadingField] = useState(null);
  const [isSubmittingKyc, setIsSubmittingKyc] = useState(false);

  // Keep payment details, profile, and KYC states in sync with latest currentUser from DB
  useEffect(() => {
    if (currentUser) {
      setUpiId(currentUser.upiId || '');
      setBankAccountName(currentUser.bankAccountName || '');
      setBankAccountNumber(currentUser.bankAccountNumber || '');
      setBankIfsc(currentUser.bankIfsc || '');
      setBankName(currentUser.bankName || '');
      if (currentUser.upiId || currentUser.bankAccountNumber) {
        setIsEditingPayment(false);
      }
      setProfileName(currentUser.name || '');
      setProfileEmail(currentUser.email || '');
      setProfilePhone(currentUser.phone || '');
      setProfileDob(currentUser.dob || '');
      setProfileGender(currentUser.gender || 'Male');
      setProfileAddress(currentUser.address || '');
      setProfileCity(currentUser.city || '');
      setProfileState(currentUser.state || '');
      setProfilePincode(currentUser.pincode || '');
      setKycAadhaar(currentUser.aadhaarNumber || '');
      setKycPan(currentUser.panNumber || '');
      setAadhaarFront(currentUser.aadhaarFrontUrl || '');
      setAadhaarBack(currentUser.aadhaarBackUrl || '');
      setPanCard(currentUser.panCardUrl || '');
      setSelfie(currentUser.selfieUrl || '');
    }
  }, [currentUser]);

  // --- CONVERTER STATES ---
  const [convertInputUrl, setConvertInputUrl] = useState('');
  const [convertResultUrl, setConvertResultUrl] = useState('');
  const [convertStore, setConvertStore] = useState('');

  // --- SHARED COMMISSION STATES ---
  const [sharedLinks, setSharedLinks] = useState([]);
  const [sharedCommissions, setSharedCommissions] = useState([]);
  const [loadingShared, setLoadingShared] = useState(true);
  const [globalShareRate, setGlobalShareRate] = useState(5.0);
  const [newLinkProduct, setNewLinkProduct] = useState('');
  const [newLinkStore, setNewLinkStore] = useState('Amazon');
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [generatedShortUrl, setGeneratedShortUrl] = useState('');
  const [copiedSharedId, setCopiedSharedId] = useState(null);

  // Fetch shared links and commissions
  useEffect(() => {
    const fetchSharedData = async () => {
      try {
        setLoadingShared(true);
        const [links, comms, settings] = await Promise.all([
          apiSharedLinks.getByUser(currentUser.id),
          apiSharedCommissions.getByUser(currentUser.id),
          apiSettings.get()
        ]);
        setSharedLinks(links || []);
        setSharedCommissions(comms || []);
        setGlobalShareRate(settings?.sharedCommissionPercent || 5.0);
      } catch (err) {
        console.error('Failed to load shared link data:', err);
      } finally {
        setLoadingShared(false);
      }
    };
    if (currentUser) {
      fetchSharedData();
    }
  }, [currentUser]);

  const handleGenerateLink = async (e) => {
    e.preventDefault();
    if (!newLinkProduct.trim() || !newLinkUrl.trim()) {
      onAddNotification('Please fill out Product Name and Product URL.', 'error');
      return;
    }
    if (!newLinkUrl.startsWith('http://') && !newLinkUrl.startsWith('https://')) {
      onAddNotification('Product URL must start with http:// or https://', 'error');
      return;
    }

    try {
      const newLink = await apiSharedLinks.create({
        userId: currentUser.id,
        userName: currentUser.name,
        productName: newLinkProduct,
        store: newLinkStore,
        productUrl: newLinkUrl,
        userSharePercent: 100
      });
      const defaultShortUrl = `${window.location.origin}/#/share/${newLink.id}`;
      const savedLink = { ...newLink, shortUrl: newLink.shortUrl || defaultShortUrl };
      setSharedLinks(prev => [savedLink, ...prev]);
      setGeneratedShortUrl(newLink.shortUrl || defaultShortUrl);
      setNewLinkProduct('');
      setNewLinkUrl('');
      onAddNotification('Shared link generated successfully!', 'success');
    } catch (err) {
      console.error(err);
      onAddNotification('Failed to generate shared link.', 'error');
    }
  };

  const handleDeleteLink = async (id) => {
    if (!window.confirm("Are you sure you want to delete this shared link? All click data for this link will be lost.")) {
      return;
    }
    try {
      await apiSharedLinks.delete(id);
      setSharedLinks(prev => prev.filter(l => l.id !== id));
      onAddNotification('Shared link deleted.', 'info');
    } catch (err) {
      console.error(err);
      onAddNotification('Failed to delete shared link.', 'error');
    }
  };

  const handleSimulateClick = async (id) => {
    try {
      onAddNotification('Simulating user click & potential purchase...', 'info');
      const updated = await apiSharedLinks.incrementClicks(id);
      
      // Update link list
      setSharedLinks(prev => prev.map(l => l.id === id ? { ...l, clicksCount: updated.clicksCount, conversionsCount: updated.conversionsCount } : l));
      
      // Re-fetch commissions & sync
      const comms = await apiSharedCommissions.getByUser(currentUser.id);
      setSharedCommissions(comms);
      
      onAddNotification('Simulation completed! Conversions and clicks updated.', 'success');
    } catch (err) {
      console.error(err);
      onAddNotification('Simulation error.', 'error');
    }
  };

  const handleCopySharedLink = (linkUrl, linkId) => {
    navigator.clipboard.writeText(linkUrl);
    setCopiedSharedId(linkId);
    onAddNotification('Shared link copied to clipboard!', 'success');
    setTimeout(() => setCopiedSharedId(null), 2000);
  };

  const refLink = `${window.location.origin}/join?ref=${currentUser.name.toLowerCase()}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(refLink);
    setCopiedLink(true);
    onAddNotification('Referral link copied to clipboard!', 'success');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // --- WITHDRAWAL SUBMISSION ---
  const handleWithdraw = () => {
    const userWallet = currentUser?.wallet || { confirmed: 0, pending: 0, referral: 0 };
    if (currentUser?.kycStatus !== 'approved') {
      onAddNotification('E-KYC verification is mandatory before making a withdrawal. Please go to the "My Profile & KYC" tab to submit your documents.', 'error');
      return;
    }
    if (currentUser?.paymentDetailsStatus !== 'approved') {
      onAddNotification('Bank Account / UPI details verification is mandatory before making a withdrawal. Please submit them in the "My Profile & KYC" tab.', 'error');
      return;
    }
    if (userWallet.confirmed < 10) {
      onAddNotification('Minimum withdrawal amount is ₹10.', 'error');
      return;
    }
    setWithdrawAmount(userWallet.confirmed.toString());
    
    // Prefill destination
    if (currentUser?.upiId && currentUser.upiId.trim()) {
      setWithdrawUpi(currentUser.upiId.trim());
    } else if (currentUser?.bankAccountNumber) {
      setWithdrawUpi(`A/C: ${currentUser.bankAccountNumber.slice(-4)} (${currentUser.bankName || 'Bank'})`);
    } else {
      setWithdrawUpi('No verified payment method found');
    }
    
    setShowWithdrawForm(true);
  };

  const handleWithdrawalRequest = async (e) => {
    e.preventDefault();
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount < 10) {
      onAddNotification('Please enter a valid amount (minimum ₹10).', 'error');
      return;
    }
    const userWallet = currentUser?.wallet || { confirmed: 0, pending: 0, referral: 0 };
    if (amount > userWallet.confirmed) {
      onAddNotification('Insufficient confirmed commission balance.', 'error');
      return;
    }
    if (!withdrawUpi || !withdrawUpi.trim()) {
      onAddNotification('No payout destination configured.', 'error');
      return;
    }

    setWithdrawing(true);
    try {
      const newRequest = {
        userId: currentUser.id,
        userName: currentUser.name,
        coins: Math.round(amount * 100),
        amount: amount,
        upiId: withdrawUpi,
        date: new Date().toISOString().split('T')[0],
      };

      if (onAddWithdrawalRequest) {
        await onAddWithdrawalRequest(newRequest);
      }
      setShowWithdrawForm(false);
      setWithdrawAmount('');
      setWithdrawUpi('');
    } catch (err) {
      console.error(err);
    } finally {
      setWithdrawing(false);
    }
  };

  // --- PROFILE SAVE ---
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!profileName.trim() || !profileDob.trim() || !profileAddress.trim() || !profileCity.trim() || !profileState.trim() || !profilePincode.trim()) {
      onAddNotification('Please fill in all profile fields to complete your profile.', 'error');
      return;
    }

    setIsSavingProfile(true);
    try {
      const updatedUser = await apiUsers.update(currentUser.id, {
        name: profileName,
        dob: profileDob,
        gender: profileGender,
        address: profileAddress,
        city: profileCity,
        state: profileState,
        pincode: profilePincode,
        isProfileComplete: true
      });
      if (onUpdateUser) {
        onUpdateUser(updatedUser);
      }
      onAddNotification('Profile saved and marked as COMPLETE!', 'success');
    } catch (err) {
      console.error(err);
      onAddNotification('Failed to save profile.', 'error');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSavePaymentDetails = async (e) => {
    e.preventDefault();
    const cleanUpi = upiId.trim();
    const cleanAccNo = bankAccountNumber.trim();
    const cleanIfsc = bankIfsc.trim().toUpperCase();
    const cleanAccName = bankAccountName.trim();
    const cleanBank = bankName.trim();

    if (!cleanUpi && !cleanAccNo) {
      onAddNotification('Please enter either a UPI ID or Bank Account details.', 'error');
      return;
    }

    // 1. UPI Validation
    if (cleanUpi) {
      const upiRegex = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;
      if (!upiRegex.test(cleanUpi)) {
        onAddNotification('Please enter a valid UPI ID (e.g. name@bank or 9876543210@paytm).', 'error');
        return;
      }
    }

    // 2. Bank Details Validation
    if (cleanAccNo) {
      const accRegex = /^\d{9,18}$/;
      if (!accRegex.test(cleanAccNo)) {
        onAddNotification('Bank Account Number must be between 9 and 18 digits.', 'error');
        return;
      }
      const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
      if (!ifscRegex.test(cleanIfsc)) {
        onAddNotification('Please enter a valid 11-character IFSC Code (e.g. SBIN0001234).', 'error');
        return;
      }
      if (cleanAccName.length < 2) {
        onAddNotification('Please enter the Account Holder Name (minimum 2 characters).', 'error');
        return;
      }
    }

    setIsSavingPayment(true);
    try {
      const updatedUser = await apiUsers.updatePaymentDetails(currentUser.id, {
        upiId: cleanUpi,
        bankAccountName: cleanAccName,
        bankAccountNumber: cleanAccNo,
        bankIfsc: cleanIfsc,
        bankName: cleanBank,
      });
      if (onUpdateUser) {
        onUpdateUser(updatedUser);
      }
      setIsEditingPayment(false);
      onAddNotification('Payment details saved successfully!', 'success');
    } catch (err) {
      console.error(err);
      onAddNotification(err.message || 'Failed to save payment details.', 'error');
    } finally {
      setIsSavingPayment(false);
    }
  };

  // --- KYC FILE UPLOAD ---
  const handleUploadKycFile = async (e, field) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingField(field);
    try {
      const res = await apiUpload.uploadImage(file);
      if (res && res.url) {
        if (field === 'aadhaarFront') setAadhaarFront(res.url);
        if (field === 'aadhaarBack') setAadhaarBack(res.url);
        if (field === 'panCard') setPanCard(res.url);
        if (field === 'selfie') setSelfie(res.url);
        onAddNotification('Document uploaded successfully!', 'success');
      }
    } catch (err) {
      console.error(err);
      onAddNotification('Failed to upload document. Please try again.', 'error');
    } finally {
      setUploadingField(null);
    }
  };

  // --- KYC SUBMIT ---
  const handleSubmitKyc = async (e) => {
    e.preventDefault();
    if (!kycAadhaar.trim() || kycAadhaar.trim().length < 12) {
      onAddNotification('Please enter a valid 12-digit Aadhaar Number.', 'error');
      return;
    }
    if (!kycPan.trim() || kycPan.trim().length < 10) {
      onAddNotification('Please enter a valid 10-digit PAN Card Number.', 'error');
      return;
    }
    if (!aadhaarFront || !aadhaarBack || !panCard || !selfie) {
      onAddNotification('Please upload all required KYC documents (Aadhaar Front & Back, PAN, Selfie).', 'error');
      return;
    }

    setIsSubmittingKyc(true);
    try {
      const updatedUser = await apiUsers.update(currentUser.id, {
        aadhaarNumber: kycAadhaar,
        panNumber: kycPan,
        aadhaarFrontUrl: aadhaarFront,
        aadhaarBackUrl: aadhaarBack,
        panCardUrl: panCard,
        selfieUrl: selfie,
        kycStatus: 'pending'
      });
      if (onUpdateUser) {
        onUpdateUser(updatedUser);
      }
      onAddNotification('E-KYC documents submitted successfully for review!', 'success');
    } catch (err) {
      console.error(err);
      onAddNotification('Failed to submit E-KYC documents.', 'error');
    } finally {
      setIsSubmittingKyc(false);
    }
  };

  // --- URL CONVERTER ---
  const handleConvertUrl = async (e) => {
    e.preventDefault();
    if (!convertInputUrl.trim()) {
      onAddNotification('Please paste a product URL.', 'error');
      return;
    }

    const url = convertInputUrl.trim();
    let store = 'Amazon';
    const lowerUrl = url.toLowerCase();

    if (lowerUrl.includes('flipkart') || lowerUrl.includes('fkrt')) store = 'Flipkart';
    else if (lowerUrl.includes('myntra') || lowerUrl.includes('mynt.in')) store = 'Myntra';
    else if (lowerUrl.includes('ajio')) store = 'Ajio';
    else if (lowerUrl.includes('nykaa')) store = 'Nykaa Beauty';
    else if (lowerUrl.includes('meesho')) store = 'Meesho';
    else if (lowerUrl.includes('makemytrip')) store = 'MakeMyTrip';
    else if (lowerUrl.includes('boat')) store = 'boAt';

    setConvertStore(store);
    try {
      const newLink = await apiSharedLinks.create({
        userId: currentUser?.id || 'guest',
        userName: currentUser?.name || 'Guest',
        productName: `Converted ${store} Product`,
        store: store,
        productUrl: url,
        userSharePercent: 100
      });
      const defaultShortUrl = `${window.location.origin}/#/share/${newLink.id}`;
      const finalShortUrl = newLink.shortUrl || defaultShortUrl;
      
      const savedLink = { ...newLink, shortUrl: finalShortUrl };
      setSharedLinks(prev => [savedLink, ...prev]);
      setConvertResultUrl(finalShortUrl);
      onAddNotification(`Converted to tracked ${store} link successfully!`, 'success');
    } catch (err) {
      console.error(err);
      onAddNotification('Failed to convert URL.', 'error');
    }
  };

  const handleCopyConverted = () => {
    navigator.clipboard.writeText(convertResultUrl);
    onAddNotification('Affiliate link copied to clipboard!', 'success');
  };

  const renderPaymentDetailsCard = () => (
    <div id="payment-details-section" className="referral-card" style={{ gridTemplateColumns: '1fr', padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px', marginTop: activeTab === 'payment' ? '0' : '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
        <h3 className="referral-title" style={{ fontSize: '17px', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CreditCard size={20} style={{ color: 'var(--primary)' }} /> Payment Details / Bank Account
        </h3>
        <span className={`status-badge ${currentUser?.paymentDetailsStatus || 'not_submitted'}`} style={{ fontSize: '11px', textTransform: 'uppercase' }}>
          {(currentUser?.paymentDetailsStatus || 'not_submitted').replace('_', ' ')}
        </span>
      </div>

      {currentUser?.paymentDetailsStatus === 'pending' && (
        <div style={{ padding: '10px 14px', backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#d97706', borderRadius: '8px', fontSize: '13px', border: '1px solid #f59e0b', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShieldAlert size={16} />
          <span>Payment & Bank details are <strong>PENDING ADMIN APPROVAL</strong>. Withdrawals will activate once approved. You can still edit details below if needed.</span>
        </div>
      )}

      {currentUser?.paymentDetailsRemarks && currentUser?.paymentDetailsStatus === 'rejected' && (
        <div style={{ padding: '10px 14px', backgroundColor: '#fee2e2', color: '#dc2626', borderRadius: '8px', fontSize: '13px', border: '1px solid #ef4444' }}>
          <strong>Rejection Reason:</strong> {currentUser.paymentDetailsRemarks} (Please edit and re-submit your details)
        </div>
      )}

      {!isEditingPayment && (currentUser?.upiId || currentUser?.bankAccountNumber) ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            {currentUser?.upiId && (
              <div style={{ padding: '14px', borderRadius: '8px', backgroundColor: 'var(--bg)', border: '1px solid var(--border)' }}>
                <span style={{ fontSize: '11px', color: 'var(--text)', display: 'block', fontWeight: 600 }}>UPI ID</span>
                <p style={{ fontWeight: '700', color: 'var(--text-bold)', margin: '6px 0 0 0', fontSize: '15px' }}>{currentUser.upiId}</p>
              </div>
            )}
            {currentUser?.bankAccountName && (
              <div style={{ padding: '14px', borderRadius: '8px', backgroundColor: 'var(--bg)', border: '1px solid var(--border)' }}>
                <span style={{ fontSize: '11px', color: 'var(--text)', display: 'block', fontWeight: 600 }}>Account Holder Name</span>
                <p style={{ fontWeight: '700', color: 'var(--text-bold)', margin: '6px 0 0 0', fontSize: '15px' }}>{currentUser.bankAccountName}</p>
              </div>
            )}
            {currentUser?.bankName && (
              <div style={{ padding: '14px', borderRadius: '8px', backgroundColor: 'var(--bg)', border: '1px solid var(--border)' }}>
                <span style={{ fontSize: '11px', color: 'var(--text)', display: 'block', fontWeight: 600 }}>Bank Name</span>
                <p style={{ fontWeight: '700', color: 'var(--text-bold)', margin: '6px 0 0 0', fontSize: '15px' }}>{currentUser.bankName}</p>
              </div>
            )}
            {currentUser?.bankAccountNumber && (
              <div style={{ padding: '14px', borderRadius: '8px', backgroundColor: 'var(--bg)', border: '1px solid var(--border)' }}>
                <span style={{ fontSize: '11px', color: 'var(--text)', display: 'block', fontWeight: 600 }}>Account Number</span>
                <p style={{ fontWeight: '700', color: 'var(--text-bold)', margin: '6px 0 0 0', fontSize: '15px' }}>
                  XXXXXX{currentUser.bankAccountNumber.slice(-4)}
                </p>
              </div>
            )}
            {currentUser?.bankIfsc && (
              <div style={{ padding: '14px', borderRadius: '8px', backgroundColor: 'var(--bg)', border: '1px solid var(--border)' }}>
                <span style={{ fontSize: '11px', color: 'var(--text)', display: 'block', fontWeight: 600 }}>IFSC Code</span>
                <p style={{ fontWeight: '700', color: 'var(--text-bold)', margin: '6px 0 0 0', fontFamily: 'monospace', fontSize: '15px' }}>{currentUser.bankIfsc}</p>
              </div>
            )}
          </div>
          
          {currentUser?.paymentDetailsStatus === 'approved' ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 16px',
              borderRadius: '8px',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid #10b981',
              color: '#059669',
              fontSize: '13px',
              fontWeight: '600'
            }}>
              <ShieldCheck size={18} style={{ color: '#10b981' }} />
              <span>Payment & Bank details are verified & approved (Locked). To request changes, please contact support.</span>
            </div>
          ) : (
            <button 
              type="button" 
              onClick={() => setIsEditingPayment(true)} 
              className="btn-primary" 
              style={{ alignSelf: 'flex-start', padding: '8px 20px', fontSize: '13px' }}
            >
              Edit / Update Details
            </button>
          )}
        </div>
      ) : (
        <form onSubmit={handleSavePaymentDetails} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <p style={{ fontSize: '13px', color: 'var(--text)', margin: 0 }}>
            Enter your preferred payout details (UPI ID or Bank Account). These details will be saved to your profile and pre-filled for future withdrawals.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-bold)' }}>UPI ID (e.g. name@bank or 9876543210@paytm)</label>
            <input 
              type="text" 
              placeholder="e.g. rahul@oksbi" 
              value={upiId} 
              onChange={e => setUpiId(e.target.value)} 
              style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--bg)', color: 'var(--text-bold)' }} 
            />
          </div>

          <div style={{ borderTop: '1px dashed var(--border)', margin: '6px 0', position: 'relative', textAlign: 'center' }}>
            <span style={{ position: 'relative', top: '-10px', background: 'var(--card-bg)', padding: '0 8px', fontSize: '11px', color: 'var(--text)', fontWeight: 600 }}>OR BANK ACCOUNT DETAILS</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-bold)' }}>Account Holder Name</label>
              <input 
                type="text" 
                placeholder="Name as in bank records" 
                value={bankAccountName} 
                onChange={e => setBankAccountName(e.target.value)} 
                style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--bg)', color: 'var(--text-bold)' }} 
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-bold)' }}>Bank Name (Optional)</label>
              <input 
                type="text" 
                placeholder="e.g. State Bank of India" 
                value={bankName} 
                onChange={e => setBankName(e.target.value)} 
                style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--bg)', color: 'var(--text-bold)' }} 
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-bold)' }}>Bank Account Number</label>
              <input 
                type="text" 
                placeholder="9-18 digit account number" 
                value={bankAccountNumber} 
                onChange={e => setBankAccountNumber(e.target.value.replace(/\D/g, ''))} 
                style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--bg)', color: 'var(--text-bold)' }} 
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-bold)' }}>IFSC Code</label>
              <input 
                type="text" 
                maxLength={11}
                placeholder="e.g. SBIN0001234" 
                value={bankIfsc} 
                onChange={e => setBankIfsc(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))} 
                style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--bg)', color: 'var(--text-bold)', fontFamily: 'monospace' }} 
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
            <button 
              type="submit" 
              disabled={isSavingPayment} 
              className="btn-primary" 
              style={{ padding: '10px 20px', fontWeight: 'bold' }}
            >
              {isSavingPayment ? 'Saving...' : 'Save Payment Details'}
            </button>
            {(currentUser?.upiId || currentUser?.bankAccountNumber) && (
              <button 
                type="button" 
                onClick={() => {
                  setUpiId(currentUser?.upiId || '');
                  setBankAccountName(currentUser?.bankAccountName || '');
                  setBankAccountNumber(currentUser?.bankAccountNumber || '');
                  setBankIfsc(currentUser?.bankIfsc || '');
                  setBankName(currentUser?.bankName || '');
                  setIsEditingPayment(false);
                }} 
                className="btn-secondary" 
                style={{ padding: '10px 20px' }}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      )}
    </div>
  );

  return (
    <div className="dashboard-grid animate-fade">
      {/* Sidebar navigation */}
      <div className="dashboard-sidebar">
        <div className="dashboard-menu">
          <div
            className={`dashboard-menu-item ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <Wallet size={18} /> Commission Wallet
          </div>
          <div
            className={`dashboard-menu-item ${activeTab === 'share-earn' ? 'active' : ''}`}
            onClick={() => setActiveTab('share-earn')}
          >
            <Share2 size={18} /> Share & Earn
          </div>
          <div
            className={`dashboard-menu-item ${activeTab === 'refer' ? 'active' : ''}`}
            onClick={() => setActiveTab('refer')}
          >
            <Link size={18} /> Refer & Earn 10%
          </div>
          <div
            className={`dashboard-menu-item ${activeTab === 'ledger' ? 'active' : ''}`}
            onClick={() => setActiveTab('ledger')}
          >
            <BookOpen size={18} /> My Ledger
          </div>
          <div
            className={`dashboard-menu-item ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <User size={18} /> My Profile & KYC
          </div>
          <div
            className={`dashboard-menu-item ${activeTab === 'payment' ? 'active' : ''}`}
            onClick={() => setActiveTab('payment')}
          >
            <CreditCard size={18} /> Payment Details
          </div>
          <div
            className={`dashboard-menu-item ${activeTab === 'url-converter' ? 'active' : ''}`}
            onClick={() => setActiveTab('url-converter')}
          >
            <Link size={18} /> URL Converter Tool
          </div>
          <div
            className={`dashboard-menu-item ${activeTab === 'support' ? 'active' : ''}`}
            onClick={() => setActiveTab('support')}
          >
            <HelpCircle size={18} /> Support Tickets
          </div>

        <div style={{ marginTop: 'auto', borderTop: '1px solid var(--border)', paddingTop: '16px', fontSize: '13px', color: 'var(--text)' }}>
          <span style={{ fontWeight: 600, display: 'block', marginBottom: '4px' }}>Help & Support</span>
          Email: support@liomart.com
        </div>
        </div>
      </div>

      {/* Main Contents */}
      <div className="dashboard-content">
        {activeTab === 'overview' && (
          <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <h2 className="section-title">My Wallet Overview</h2>

            {/* Wallet values banner */}
            <div className="wallet-banner">
              <div className="wallet-stat">
                <span className="wallet-stat-label">Confirmed Commission</span>
                <span className="wallet-stat-val">₹{(currentUser?.wallet?.confirmed || 0).toFixed(2)}</span>
              </div>
              <div className="wallet-stat">
                <span className="wallet-stat-label">Pending Rewards</span>
                <span className="wallet-stat-val">₹{(currentUser?.wallet?.pending || 0).toFixed(2)}</span>
              </div>
              <div className="wallet-stat">
                <span className="wallet-stat-label">Referral Earnings</span>
                <span className="wallet-stat-val">₹{(currentUser?.wallet?.referral || 0).toFixed(2)}</span>
              </div>

              <button
                className="btn-withdraw"
                onClick={handleWithdraw}
                disabled={withdrawing}
                style={{ gridColumn: 'span 3', width: '220px', alignSelf: 'center', marginTop: '8px' }}
              >
                {withdrawing ? 'Processing...' : 'Transfer to Bank / PayPal'}
              </button>
            </div>

            {showWithdrawForm && (
              <form onSubmit={handleWithdrawalRequest} className="referral-card animate-fade" style={{ gridTemplateColumns: '1fr', padding: '24px', maxWidth: '500px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
                  <h3 className="referral-title" style={{ fontSize: '16px', margin: 0 }}>Request Withdrawal</h3>
                  <button type="button" onClick={() => setShowWithdrawForm(false)} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 'bold' }}>
                    <ArrowLeft size={14} /> Back
                  </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-bold)', textTransform: 'uppercase' }}>Payout Destination (Verified)</label>
                  <input
                    type="text"
                    disabled
                    value={withdrawUpi}
                    style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--card-bg)', color: 'var(--text)', fontSize: '14px', cursor: 'not-allowed' }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-bold)', textTransform: 'uppercase' }}>Amount (₹)</label>
                  <input
                    type="number"
                    required
                    min="10"
                    max={currentUser?.wallet?.confirmed || 0}
                    step="0.01"
                    placeholder="Enter amount"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--bg)', color: 'var(--text-bold)', fontSize: '14px' }}
                  />
                  <span style={{ fontSize: '11px', color: 'var(--text)' }}>
                    Max withdrawable: ₹{(currentUser?.wallet?.confirmed || 0).toFixed(2)}
                  </span>
                </div>
                <button type="submit" disabled={withdrawing} className="btn-primary" style={{ padding: '12px', borderRadius: '8px', fontSize: '14px', fontWeight: 'bold', width: '100%' }}>
                  {withdrawing ? 'Submitting...' : 'Submit Payout Request'}
                </button>
              </form>
            )}

            {/* Referral Info Card */}
            <div className="referral-card">
              <div className="referral-info">
                <h3 className="referral-title">Invite friends, get 10% of their earnings for life!</h3>
                <p style={{ fontSize: '14px', color: 'var(--text)' }}>
                  When your friends register via your unique referral link and share deals, you receive a flat
                  10% lifetime referral bonus on all commissions they earn!
                </p>
                <div className="referral-link-box">
                  <input type="text" readOnly value={refLink} className="referral-link-input" />
                  <button
                    className="btn-primary"
                    onClick={handleCopyLink}
                    style={{
                      padding: '8px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      borderRadius: '6px',
                      fontSize: '13px',
                    }}
                  >
                    {copiedLink ? <Check size={16} /> : <Copy size={16} />}
                    {copiedLink ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <Gift size={80} style={{ color: 'var(--primary)', opacity: 0.8 }} />
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'share-earn' && (
          <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="admin-page-header" style={{ marginBottom: 0, paddingBottom: 0 }}>
              <h2 className="section-title" style={{ margin: 0 }}>Share & Earn Dashboard</h2>
              <p style={{ fontSize: '14px', color: 'var(--text)', marginTop: '4px' }}>
                Generate custom product tracking links, share them, and earn commissions on successful purchases.
              </p>
            </div>

            {/* Stats Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
              <div className="wallet-stat" style={{ padding: '20px', borderRadius: '12px', background: 'var(--card-bg)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span className="wallet-stat-label" style={{ fontSize: '12px', color: 'var(--text)', fontWeight: 500 }}>Total Shared Clicks</span>
                <span className="wallet-stat-val" style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-bold)' }}>
                  {sharedLinks.reduce((sum, l) => sum + l.clicksCount, 0)}
                </span>
              </div>
              <div className="wallet-stat" style={{ padding: '20px', borderRadius: '12px', background: 'var(--card-bg)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span className="wallet-stat-label" style={{ fontSize: '12px', color: 'var(--text)', fontWeight: 500 }}>Total Conversions</span>
                <span className="wallet-stat-val" style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-bold)' }}>
                  {sharedLinks.reduce((sum, l) => sum + l.conversionsCount, 0)}
                </span>
              </div>
              <div className="wallet-stat" style={{ padding: '20px', borderRadius: '12px', background: 'var(--card-bg)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span className="wallet-stat-label" style={{ fontSize: '12px', color: 'var(--text)', fontWeight: 500 }}>Pending Commission</span>
                <span className="wallet-stat-val" style={{ fontSize: '24px', fontWeight: 700, color: '#f59e0b' }}>
                  ₹{sharedCommissions.filter(c => c.status === 'pending').reduce((sum, c) => sum + c.commissionAmount, 0).toFixed(2)}
                </span>
              </div>
              <div className="wallet-stat" style={{ padding: '20px', borderRadius: '12px', background: 'var(--card-bg)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span className="wallet-stat-label" style={{ fontSize: '12px', color: 'var(--text)', fontWeight: 500 }}>Approved Earnings</span>
                <span className="wallet-stat-val" style={{ fontSize: '24px', fontWeight: 700, color: '#10b981' }}>
                  ₹{sharedCommissions.filter(c => c.status === 'approved').reduce((sum, c) => sum + c.commissionAmount, 0).toFixed(2)}
                </span>
              </div>
              <div className="wallet-stat" style={{ padding: '20px', borderRadius: '12px', background: 'var(--card-bg)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span className="wallet-stat-label" style={{ fontSize: '12px', color: 'var(--text)', fontWeight: 500 }}>My Commission Rate</span>
                <span className="wallet-stat-val" style={{ fontSize: '24px', fontWeight: 700, color: 'var(--primary)' }}>
                  {currentUser.sharedCommissionRate !== null && currentUser.sharedCommissionRate !== undefined
                    ? `${currentUser.sharedCommissionRate}%`
                    : `${globalShareRate}% (Default)`}
                </span>
              </div>
            </div>

            {/* Link Generation Form */}
            <div className="referral-card" style={{ gridTemplateColumns: '1fr', padding: '24px', borderRadius: '12px', border: '1px solid var(--border)', backgroundColor: 'var(--card-bg)' }}>
              <h3 className="referral-title" style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-bold)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Share2 size={20} style={{ color: 'var(--primary)' }} /> Generate Shareable Commission Link
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text)', marginBottom: '16px' }}>
                Paste any product URL from our partner stores below to generate a tracking link.
              </p>

              <form onSubmit={handleGenerateLink} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', width: '100%' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-bold)' }}>Product Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Wireless Noise Cancelling Earphones"
                    value={newLinkProduct}
                    onChange={e => setNewLinkProduct(e.target.value)}
                    style={{ padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--bg)', color: 'var(--text-bold)' }}
                    required
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-bold)' }}>Select Store</label>
                  <select
                    value={newLinkStore}
                    onChange={e => setNewLinkStore(e.target.value)}
                    style={{ padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--bg)', color: 'var(--text-bold)' }}
                  >
                    <option value="Amazon">Amazon</option>
                    <option value="Myntra">Myntra</option>
                    <option value="Flipkart">Flipkart</option>
                    <option value="Ajio">Ajio</option>
                    <option value="Nykaa Beauty">Nykaa Beauty</option>
                    <option value="MakeMyTrip">MakeMyTrip</option>
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', gridColumn: 'span 2' }}>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-bold)' }}>Product URL</label>
                  <input
                    type="url"
                    placeholder="https://amazon.in/dp/product-id..."
                    value={newLinkUrl}
                    onChange={e => setNewLinkUrl(e.target.value)}
                    style={{ padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--bg)', color: 'var(--text-bold)' }}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="btn-primary"
                  style={{ gridColumn: 'span 2', padding: '12px', borderRadius: '6px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '8px' }}
                >
                  <Plus size={18} /> Generate Short Link
                </button>
              </form>

              {generatedShortUrl && (
                <div className="animate-fade" style={{ marginTop: '20px', padding: '16px', backgroundColor: 'rgba(var(--primary-rgb), 0.05)', borderRadius: '8px', border: '1px solid rgba(var(--primary-rgb), 0.15)' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Your Generated Tracking Link</span>
                  <div className="referral-link-box" style={{ marginTop: 0 }}>
                    <input type="text" readOnly value={generatedShortUrl} className="referral-link-input" style={{ backgroundColor: 'var(--card-bg)' }} />
                    <button
                      className="btn-primary"
                      onClick={() => handleCopySharedLink(generatedShortUrl, 'gen')}
                      style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                      {copiedSharedId === 'gen' ? <Check size={16} /> : <Copy size={16} />}
                      {copiedSharedId === 'gen' ? 'Copied!' : 'Copy Link'}
                    </button>
                  </div>
                  <p style={{ fontSize: '11px', color: 'var(--text)', marginTop: '8px' }}>
                    Copy this link and share it. When someone clicks it and orders, their purchase commission will show up below.
                  </p>
                </div>
              )}
            </div>

            {/* Generated Links List */}
            <div className="history-card" style={{ padding: '24px', borderRadius: '12px', border: '1px solid var(--border)', backgroundColor: 'var(--card-bg)' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-bold)', marginBottom: '12px' }}>My Active Shared Links</h3>
              {sharedLinks.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text)' }}>
                  No active shared links. Generate one above to get started!
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="history-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Product Name</th>
                        <th>Store</th>
                        <th>Deep Link</th>
                        <th>Clicks</th>
                        <th>Conversions</th>
                        <th>My Earnings</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sharedLinks.map(link => {
                        const displayLink = link.shortUrl || `${window.location.origin}/#/share/${link.id}`;
                        return (
                          <tr key={link.id}>
                            <td>{link.date}</td>
                            <td style={{ fontWeight: 600, color: 'var(--text-bold)' }}>{link.productName}</td>
                            <td>
                              <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '10px', backgroundColor: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-bold)', fontWeight: 600 }}>
                                {link.store}
                              </span>
                            </td>
                            <td style={{ maxWidth: '260px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              <a href={displayLink} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>
                                {displayLink}
                              </a>
                            </td>
                            <td style={{ fontWeight: 600 }}>{link.clicksCount}</td>
                            <td style={{ fontWeight: 600 }}>{link.conversionsCount}</td>
                            <td style={{ fontWeight: 700, color: '#10b981' }}>₹{link.totalEarnings.toFixed(2)}</td>
                            <td>
                              <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                  type="button"
                                  className="btn-primary"
                                  onClick={() => handleCopySharedLink(displayLink, link.id)}
                                  title="Copy Short Link"
                                  style={{ padding: '6px 10px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                >
                                  {copiedSharedId === link.id ? <Check size={13} /> : <Copy size={13} />}
                                </button>
                                <button
                                  type="button"
                                  className="btn-primary"
                                  onClick={() => handleSimulateClick(link.id)}
                                  title="Simulate Visitor Click & Order"
                                  style={{ padding: '6px 10px', borderRadius: '4px', backgroundColor: '#8b5cf6', borderColor: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}
                                >
                                  <Play size={13} />
                                </button>
                                <button
                                  type="button"
                                  className="btn-withdraw"
                                  onClick={() => handleDeleteLink(link.id)}
                                  title="Delete Link"
                                  style={{ padding: '6px 10px', borderRadius: '4px', backgroundColor: '#ef4444', borderColor: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Commissions conversions history */}
            <div className="history-card" style={{ padding: '24px', borderRadius: '12px', border: '1px solid var(--border)', backgroundColor: 'var(--card-bg)' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-bold)', marginBottom: '12px' }}>Shared Link Commissions Log</h3>
              {sharedCommissions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text)' }}>
                  No conversions tracked yet. Use the purple play button (simulate tool) above to test a sale simulation!
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="history-table">
                    <thead>
                      <tr>
                        <th>Transaction Date</th>
                        <th>Product / Store</th>
                        <th>Order Amount</th>
                        <th>Rate Used</th>
                        <th>Earned Commission</th>
                        <th>Admin Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sharedCommissions.map(comm => (
                        <tr key={comm.id}>
                          <td>{comm.date}</td>
                          <td>
                            <div>
                              <div style={{ fontWeight: 600, color: 'var(--text-bold)' }}>{comm.productName}</div>
                              <span style={{ fontSize: '10px', color: 'var(--text)' }}>{comm.store}</span>
                            </div>
                          </td>
                          <td style={{ fontWeight: 500 }}>₹{comm.purchaseAmount.toFixed(2)}</td>
                          <td style={{ fontWeight: 500 }}>{comm.commissionRate}%</td>
                          <td>
                            <div>
                              <div style={{ fontWeight: 700, color: comm.status === 'approved' ? '#10b981' : 'var(--text-bold)' }}>
                                ₹{comm.userCommissionAmount !== undefined ? comm.userCommissionAmount.toFixed(2) : comm.commissionAmount.toFixed(2)}
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className={`history-status ${comm.status.toLowerCase()}`}>
                              {comm.status.toUpperCase()}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'ledger' && (
          <UserLedger currentUser={currentUser} onAddNotification={onAddNotification} />
        )}

        {activeTab === 'support' && (
          <UserSupport currentUser={currentUser} onAddNotification={onAddNotification} />
        )}

        {activeTab === 'support' && (
          <UserSupport currentUser={currentUser} onAddNotification={onAddNotification} />
        )}

        {activeTab === 'profile' && (
          <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <h2 className="section-title">My Profile & E-KYC Verification</h2>

            {/* Status Alert Banner */}
            <div style={{
              padding: '16px 20px',
              borderRadius: '12px',
              background: currentUser?.kycStatus === 'approved' ? 'rgba(16,185,129,0.1)' : currentUser?.kycStatus === 'pending' ? 'rgba(245,158,11,0.1)' : currentUser?.kycStatus === 'rejected' ? 'rgba(239,68,68,0.1)' : 'var(--card-bg)',
              border: `1px solid ${currentUser?.kycStatus === 'approved' ? '#10b981' : currentUser?.kycStatus === 'pending' ? '#f59e0b' : currentUser?.kycStatus === 'rejected' ? '#ef4444' : 'var(--border)'}`,
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={20} style={{ color: currentUser?.kycStatus === 'approved' ? '#10b981' : currentUser?.kycStatus === 'pending' ? '#f59e0b' : currentUser?.kycStatus === 'rejected' ? '#ef4444' : 'var(--text)' }} />
                <strong style={{ fontSize: '15px', color: 'var(--text-bold)' }}>
                  KYC Status: {currentUser?.kycStatus ? currentUser.kycStatus.toUpperCase().replace('_', ' ') : 'NOT SUBMITTED'}
                </strong>
              </div>
              <span style={{ fontSize: '13px', color: 'var(--text)' }}>
                {currentUser?.kycStatus === 'approved' 
                  ? 'Your E-KYC is approved! You can now request withdrawals.'
                  : currentUser?.kycStatus === 'pending'
                  ? 'Your E-KYC verification is pending admin review. Withdrawals are temporarily blocked.'
                  : currentUser?.kycStatus === 'rejected'
                  ? `Your E-KYC was rejected. Reason: ${currentUser?.kycRemarks || 'Invalid documents'}. Please update and re-submit.`
                  : 'Please fill in your profile details and upload Aadhaar, PAN and Selfie to activate withdrawals.'}
              </span>
            </div>

            {/* Profile Progress Tracker */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div style={{ padding: '16px', borderRadius: '12px', background: 'var(--card-bg)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text)' }}>Profile Completion Status</span>
                <strong style={{ fontSize: '18px', color: currentUser?.isProfileComplete ? '#10b981' : '#f59e0b' }}>
                  {currentUser?.isProfileComplete ? 'COMPLETE (100%)' : 'INCOMPLETE (Please fill details)'}
                </strong>
              </div>
              <div style={{ padding: '16px', borderRadius: '12px', background: 'var(--card-bg)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text)' }}>Withdrawal Eligibility</span>
                <strong style={{ fontSize: '18px', color: currentUser?.kycStatus === 'approved' ? '#10b981' : '#ef4444' }}>
                  {currentUser?.kycStatus === 'approved' ? 'ELIGIBLE' : 'BLOCKED (Needs Approved KYC)'}
                </strong>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
              {/* Personal Information Form */}
              {currentUser?.kycStatus !== 'approved' ? (
                <form onSubmit={handleSaveProfile} className="referral-card" style={{ gridTemplateColumns: '1fr', padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <h3 className="referral-title" style={{ fontSize: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>Personal Information</h3>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-bold)' }}>Full Name</label>
                    <input type="text" required value={profileName} onChange={e => setProfileName(e.target.value)} style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--bg)', color: 'var(--text-bold)' }} />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-bold)' }}>Email Address</label>
                    <input type="email" readOnly disabled value={profileEmail} style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'rgba(var(--primary-rgb), 0.05)', color: 'var(--text)' }} />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-bold)' }}>Phone Number</label>
                    <input type="text" readOnly disabled value={profilePhone} style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'rgba(var(--primary-rgb), 0.05)', color: 'var(--text)' }} />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-bold)' }}>Date of Birth</label>
                    <input type="date" required value={profileDob} onChange={e => setProfileDob(e.target.value)} style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--bg)', color: 'var(--text-bold)' }} />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-bold)' }}>Gender</label>
                    <select value={profileGender} onChange={e => setProfileGender(e.target.value)} style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--bg)', color: 'var(--text-bold)' }}>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-bold)' }}>Street Address</label>
                    <input type="text" required value={profileAddress} onChange={e => setProfileAddress(e.target.value)} style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--bg)', color: 'var(--text-bold)' }} />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-bold)' }}>City</label>
                      <input type="text" required value={profileCity} onChange={e => setProfileCity(e.target.value)} style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--bg)', color: 'var(--text-bold)' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-bold)' }}>State</label>
                      <input type="text" required value={profileState} onChange={e => setProfileState(e.target.value)} style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--bg)', color: 'var(--text-bold)' }} />
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-bold)' }}>Pincode / ZIP</label>
                    <input type="text" required value={profilePincode} onChange={e => setProfilePincode(e.target.value)} style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--bg)', color: 'var(--text-bold)' }} />
                    <button type="submit" disabled={isSavingProfile} className="btn-primary" style={{ padding: '10px', borderRadius: '8px', marginTop: '8px', fontWeight: 'bold' }}>
                      {isSavingProfile ? 'Saving...' : 'Save & Complete Profile'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="referral-card" style={{ gridTemplateColumns: '1fr', padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <h3 className="referral-title" style={{ fontSize: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ShieldCheck size={18} style={{ color: '#10b981' }} /> Personal Information (Verified & Locked)
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px' }}>
                    <div><span style={{ opacity: 0.6, display: 'block', fontSize: '11px' }}>Full Name</span><strong>{currentUser.name}</strong></div>
                    <div><span style={{ opacity: 0.6, display: 'block', fontSize: '11px' }}>Date of Birth</span><strong>{currentUser.dob || 'N/A'}</strong></div>
                    <div><span style={{ opacity: 0.6, display: 'block', fontSize: '11px' }}>Gender</span><strong>{currentUser.gender || 'N/A'}</strong></div>
                    <div><span style={{ opacity: 0.6, display: 'block', fontSize: '11px' }}>Address</span><strong>{currentUser.address || 'N/A'}, {currentUser.city || ''}</strong></div>
                  </div>
                  <div style={{ padding: '8px 12px', backgroundColor: 'rgba(16,185,129,0.1)', color: '#059669', borderRadius: '6px', fontSize: '12px', fontWeight: 600 }}>
                    Profile details are verified. Contact admin to request profile updates.
                  </div>
                </div>
              )}

              {/* KYC Document Upload Form */}
              {currentUser?.kycStatus !== 'approved' ? (
                <form onSubmit={handleSubmitKyc} className="referral-card" style={{ gridTemplateColumns: '1fr', padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <h3 className="referral-title" style={{ fontSize: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
                    E-KYC Verification {currentUser?.kycStatus === 'pending' ? '(Pending Review)' : ''}
                  </h3>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-bold)' }}>Aadhaar Card Number (12 Digits)</label>
                    <input type="text" required maxLength="12" placeholder="e.g. 1234 5678 9012" value={kycAadhaar} onChange={e => setKycAadhaar(e.target.value.replace(/\s/g, ''))} style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--bg)', color: 'var(--text-bold)', fontFamily: 'monospace' }} />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-bold)' }}>PAN Card Number (10 Characters)</label>
                    <input type="text" required maxLength="10" placeholder="e.g. ABCDE1234F" value={kycPan} onChange={e => setKycPan(e.target.value.toUpperCase())} style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--bg)', color: 'var(--text-bold)', fontFamily: 'monospace' }} />
                  </div>

                  {/* Upload elements */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '8px' }}>
                    {/* Aadhaar Front */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text)' }}>Aadhaar Front Image</span>
                      <label style={{ cursor: 'pointer', padding: '10px', borderRadius: '8px', border: '1px dashed var(--border)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg)', height: '70px', position: 'relative' }}>
                        <input type="file" accept="image/*" onChange={e => handleUploadKycFile(e, 'aadhaarFront')} style={{ display: 'none' }} />
                        <Camera size={18} style={{ color: 'var(--primary)', marginBottom: '4px' }} />
                        <span style={{ fontSize: '10px', color: 'var(--text)', textAlign: 'center' }}>
                          {uploadingField === 'aadhaarFront' ? 'Uploading...' : aadhaarFront ? 'Uploaded ✓' : 'Click to Upload'}
                        </span>
                      </label>
                    </div>

                    {/* Aadhaar Back */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text)' }}>Aadhaar Back Image</span>
                      <label style={{ cursor: 'pointer', padding: '10px', borderRadius: '8px', border: '1px dashed var(--border)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg)', height: '70px', position: 'relative' }}>
                        <input type="file" accept="image/*" onChange={e => handleUploadKycFile(e, 'aadhaarBack')} style={{ display: 'none' }} />
                        <Camera size={18} style={{ color: 'var(--primary)', marginBottom: '4px' }} />
                        <span style={{ fontSize: '10px', color: 'var(--text)', textAlign: 'center' }}>
                          {uploadingField === 'aadhaarBack' ? 'Uploading...' : aadhaarBack ? 'Uploaded ✓' : 'Click to Upload'}
                        </span>
                      </label>
                    </div>

                    {/* PAN Card */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text)' }}>PAN Card Image</span>
                      <label style={{ cursor: 'pointer', padding: '10px', borderRadius: '8px', border: '1px dashed var(--border)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg)', height: '70px', position: 'relative' }}>
                        <input type="file" accept="image/*" onChange={e => handleUploadKycFile(e, 'panCard')} style={{ display: 'none' }} />
                        <Camera size={18} style={{ color: 'var(--primary)', marginBottom: '4px' }} />
                        <span style={{ fontSize: '10px', color: 'var(--text)', textAlign: 'center' }}>
                          {uploadingField === 'panCard' ? 'Uploading...' : panCard ? 'Uploaded ✓' : 'Click to Upload'}
                        </span>
                      </label>
                    </div>

                    {/* Selfie */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text)' }}>Selfie with ID Card</span>
                      <label style={{ cursor: 'pointer', padding: '10px', borderRadius: '8px', border: '1px dashed var(--border)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg)', height: '70px', position: 'relative' }}>
                        <input type="file" accept="image/*" onChange={e => handleUploadKycFile(e, 'selfie')} style={{ display: 'none' }} />
                        <Camera size={18} style={{ color: 'var(--primary)', marginBottom: '4px' }} />
                        <span style={{ fontSize: '10px', color: 'var(--text)', textAlign: 'center' }}>
                          {uploadingField === 'selfie' ? 'Uploading...' : selfie ? 'Uploaded ✓' : 'Click to Upload'}
                        </span>
                      </label>
                    </div>
                  </div>

                  <button type="submit" disabled={isSubmittingKyc} className="btn-primary" style={{ padding: '10px', borderRadius: '8px', marginTop: '8px', fontWeight: 'bold' }}>
                    {isSubmittingKyc ? 'Submitting...' : currentUser?.kycStatus === 'pending' ? 'Update & Re-Submit KYC' : 'Submit KYC for Verification'}
                  </button>
                </form>
              ) : (
                <div className="referral-card" style={{ gridTemplateColumns: '1fr', padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <h3 className="referral-title" style={{ fontSize: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ShieldCheck size={18} style={{ color: '#10b981' }} /> E-KYC Documents (Verified & Approved)
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px' }}>
                    <div><span style={{ opacity: 0.6, display: 'block', fontSize: '11px' }}>Aadhaar Number</span><strong>XXXX-XXXX-{currentUser.aadhaarNumber ? currentUser.aadhaarNumber.slice(-4) : '****'}</strong></div>
                    <div><span style={{ opacity: 0.6, display: 'block', fontSize: '11px' }}>PAN Card</span><strong>XXXXXX{currentUser.panNumber ? currentUser.panNumber.slice(-4) : '****'}</strong></div>
                  </div>
                  <div style={{ padding: '8px 12px', backgroundColor: 'rgba(16,185,129,0.1)', color: '#059669', borderRadius: '6px', fontSize: '12px', fontWeight: 600 }}>
                    Your E-KYC has been reviewed and verified by Admin. Document editing is locked.
                  </div>
                </div>
              )}
            </div>

            {/* Bank Account & UPI Details Card */}
            {renderPaymentDetailsCard()}
          </div>
        )}

        {activeTab === 'payment' && (
          <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <h2 className="section-title">Payment & Bank Details</h2>
            <div style={{
              padding: '16px 20px',
              borderRadius: '12px',
              background: 'rgba(var(--primary-rgb), 0.05)',
              border: '1px solid rgba(var(--primary-rgb), 0.2)',
              fontSize: '13px',
              color: 'var(--text)'
            }}>
              Add or update your UPI ID and Bank Account details below. These are pre-filled automatically and saved to your account for quick and seamless cashback payouts.
            </div>
            {renderPaymentDetailsCard()}
          </div>
        )}

        {activeTab === 'url-converter' && (
          <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <h2 className="section-title">Universal Affiliate Link Converter</h2>

            <div className="referral-card" style={{ gridTemplateColumns: '1fr', padding: '24px' }}>
              <h3 className="referral-title" style={{ fontSize: '18px' }}>
                Paste Normal Product URL to Convert
              </h3>
              <p style={{ fontSize: '14px', color: 'var(--text)', lineHeight: '1.6' }}>
                Paste any standard link from supported retailers (Amazon, Flipkart, Myntra, Ajio, Meesho, Nykaa, MakeMyTrip, boAt).
                Our system will auto-detect the store and generate your unique affiliate link wrapped with tracking Sub-IDs!
              </p>

              <form onSubmit={handleConvertUrl} style={{ display: 'flex', gap: '10px', marginTop: '16px', flexWrap: 'wrap' }}>
                <input
                  type="url"
                  required
                  placeholder="Paste URL (e.g. https://www.amazon.in/dp/B0C...) here"
                  value={convertInputUrl}
                  onChange={e => setConvertInputUrl(e.target.value)}
                  style={{ flex: 1, minWidth: '260px', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--bg)', color: 'var(--text-bold)' }}
                />
                <button type="submit" className="btn-primary" style={{ padding: '12px 24px', fontWeight: 'bold' }}>
                  Convert Link
                </button>
              </form>

              {convertResultUrl && (
                <div className="animate-fade" style={{ marginTop: '24px', padding: '20px', borderRadius: '10px', backgroundColor: 'rgba(var(--primary-rgb), 0.05)', border: '1px solid var(--border)' }}>
                  <span style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--primary)', textTransform: 'uppercase' }}>
                    Detected Store: {convertStore}
                  </span>
                  
                  <div style={{ display: 'flex', gap: '10px', marginTop: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <input
                      type="text"
                      readOnly
                      value={convertResultUrl}
                      style={{ flex: 1, minWidth: '240px', padding: '10px 14px', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--card-bg)', color: 'var(--text-bold)', fontSize: '13px', fontFamily: 'monospace' }}
                    />
                    <button onClick={handleCopyConverted} className="btn-primary" style={{ padding: '10px 20px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                      <Copy size={14} /> Copy Link
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'refer' && (
          <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <h2 className="section-title">Refer & Earn Program</h2>
            <div className="referral-card" style={{ gridTemplateColumns: '1fr' }}>
              <h3 className="referral-title" style={{ color: 'var(--primary)', fontSize: '24px' }}>
                Flat 10% Lifetime Commission
              </h3>
              <p style={{ color: 'var(--text)', fontSize: '15px', lineHeight: 1.6 }}>
                Share your personalized referral code with your audience, friends, or family. As soon
                as they register, their profiles are permanently tagged under your account. Whenever
                they claim cashback on any deal, 10% of their cashback rate is automatically credited
                into your referral balance!
              </p>

              <div className="referral-link-box" style={{ maxWidth: '600px', marginTop: '16px' }}>
                <input type="text" readOnly value={refLink} className="referral-link-input" style={{ fontSize: '15px', padding: '12px' }} />
                <button
                  className="btn-primary"
                  onClick={handleCopyLink}
                  style={{ padding: '12px 24px', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  {copiedLink ? <Check size={18} /> : <Copy size={18} />}
                  {copiedLink ? 'Link Copied!' : 'Copy Invitation Link'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
