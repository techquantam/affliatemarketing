import React, { useState } from 'react';
import { CreditCard, Smartphone, Banknote, ShieldCheck, CheckCircle, ChevronRight, Truck, Wallet } from 'lucide-react';

export default function CheckoutModal({ deal, store, onClose, onPlaceOrder }) {
  const [selectedMethod, setSelectedMethod] = useState('upi');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [redirectingUpi, setRedirectingUpi] = useState(false);

  const deliveryFee = 0;
  const rawPrice = (store && (store.dealPrice ?? store.price ?? store.listedPrice ?? store.effectivePrice)) 
    ?? (deal && (deal.dealPrice ?? deal.price)) 
    ?? 0;
  const totalAmount = (typeof rawPrice === 'number' ? rawPrice : (parseFloat(rawPrice) || 0)) + deliveryFee;
  const cashbackEarnedVal = (store && store.cashbackEarned != null)
    ? (typeof store.cashbackEarned === 'number' ? store.cashbackEarned : (parseFloat(store.cashbackEarned) || 0))
    : (deal && deal.cashbackEarned != null ? (typeof deal.cashbackEarned === 'number' ? deal.cashbackEarned : (parseFloat(deal.cashbackEarned) || 0)) : 0);

  const handlePlaceOrder = (e) => {
    if (e) e.preventDefault();
    setIsProcessing(true);
    
    if (selectedMethod === 'upi') {
      setRedirectingUpi(true);
      // Simulate opening UPI app (GPay/PhonePe)
      setTimeout(() => {
        setRedirectingUpi(false);
        finishOrder();
      }, 2500);
      
      // Attempt actual UPI intent for mobile devices
      const upiUrl = `upi://pay?pa=merchant@upi&pn=LioMart&am=${totalAmount}&cu=INR`;
      if (typeof window !== 'undefined' && /Mobi|Android/i.test(navigator.userAgent)) {
        window.location.href = upiUrl;
      }
    } else {
      setTimeout(() => {
        finishOrder();
      }, 1500);
    }
  };

  const finishOrder = () => {
    setIsProcessing(false);
    setIsSuccess(true);
    setTimeout(() => {
      onPlaceOrder(deal, store);
    }, 2000);
  };

  return (
    <div className="checkout-overlay" style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 3000, padding: '20px'
    }}>
      <div className="checkout-modal" style={{
        backgroundColor: '#f1f5f9', width: '100%', maxWidth: '500px',
        maxHeight: '90vh', borderRadius: '12px', display: 'flex',
        flexDirection: 'column', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
        animation: 'slideUp 0.3s ease-out'
      }}>
        
        {/* Header */}
        <div style={{
          backgroundColor: '#fff', padding: '16px 20px', display: 'flex',
          justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0'
        }}>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={20} color="#10b981" /> Secure Checkout
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '24px', color: '#64748b', cursor: 'pointer' }}>&times;</button>
        </div>

        {isSuccess ? (
          /* Success Screen */
          <div style={{ padding: '60px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', backgroundColor: '#fff', flex: 1 }}>
            <CheckCircle size={80} color="#10b981" style={{ animation: 'bounce 1s ease' }} />
            <h2 style={{ color: '#10b981', marginTop: '20px', marginBottom: '8px' }}>Order Placed!</h2>
            <p style={{ color: '#64748b', fontSize: '15px' }}>Your order has been placed successfully via {selectedMethod.toUpperCase()}.</p>
            <p style={{ color: '#10b981', fontWeight: '600', marginTop: '12px' }}>₹{cashbackEarnedVal.toFixed(2)} Cashback Tracked</p>
          </div>
        ) : redirectingUpi ? (
           /* UPI Redirecting Screen */
           <div style={{ padding: '60px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', backgroundColor: '#fff', flex: 1 }}>
             <Smartphone size={60} color="#3b82f6" style={{ animation: 'pulse 1s infinite' }} />
             <h2 style={{ color: '#1e293b', marginTop: '20px', marginBottom: '8px' }}>Opening UPI App...</h2>
             <p style={{ color: '#64748b', fontSize: '15px' }}>Please complete the payment of ₹{totalAmount.toFixed(2)} on your phone.</p>
           </div>
        ) : (
          <form onSubmit={handlePlaceOrder} style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', flex: 1, margin: 0, padding: 0 }}>
            
            {/* Order Summary */}
            <div style={{ backgroundColor: '#fff', padding: '16px 20px', marginBottom: '10px' }}>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <img src={deal?.image || (deal?.images && deal.images[0]) || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300'} alt={deal?.title || deal?.name} style={{ width: '60px', height: '60px', objectFit: 'contain', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                <div style={{ flex: 1 }}>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', color: '#1e293b', fontWeight: '600' }}>{deal?.title || deal?.name || 'Product'}</h4>
                  <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>Sold by: {store?.platform || deal?.platform || 'Store'}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>₹{totalAmount.toFixed(2)}</div>
                  <div style={{ fontSize: '12px', color: '#10b981', fontWeight: '600' }}>Cashback: ₹{cashbackEarnedVal.toFixed(2)}</div>
                </div>
              </div>
            </div>

            {/* Payment Methods */}
            <div style={{ backgroundColor: '#fff', padding: '16px 20px', flex: 1 }}>
              <h4 style={{ margin: '0 0 16px 0', fontSize: '15px', color: '#1e293b' }}>Payment Options</h4>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                
                {/* UPI */}
                <div style={{ border: `1px solid ${selectedMethod === 'upi' ? '#3b82f6' : '#e2e8f0'}`, borderRadius: '8px', overflow: 'hidden', backgroundColor: selectedMethod === 'upi' ? '#eff6ff' : '#fff', transition: 'all 0.2s' }}>
                  <label style={{ display: 'flex', alignItems: 'center', padding: '12px', cursor: 'pointer' }}>
                    <input type="radio" name="payment" value="upi" checked={selectedMethod === 'upi'} onChange={(e) => setSelectedMethod(e.target.value)} style={{ accentColor: '#3b82f6', width: '18px', height: '18px', marginRight: '12px' }} />
                    <Smartphone size={22} color={selectedMethod === 'upi' ? '#3b82f6' : '#64748b'} style={{ marginRight: '12px' }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '15px', fontWeight: '600', color: '#1e293b' }}>UPI (GPay, PhonePe, Paytm)</div>
                    </div>
                  </label>
                  {selectedMethod === 'upi' && (
                    <div style={{ padding: '0 12px 16px 52px', fontSize: '13px', color: '#475569' }}>
                      You will be redirected to your UPI app to securely complete the payment.
                    </div>
                  )}
                </div>

                {/* Card */}
                <div style={{ border: `1px solid ${selectedMethod === 'card' ? '#3b82f6' : '#e2e8f0'}`, borderRadius: '8px', overflow: 'hidden', backgroundColor: selectedMethod === 'card' ? '#eff6ff' : '#fff', transition: 'all 0.2s' }}>
                  <label style={{ display: 'flex', alignItems: 'center', padding: '12px', cursor: 'pointer' }}>
                    <input type="radio" name="payment" value="card" checked={selectedMethod === 'card'} onChange={(e) => setSelectedMethod(e.target.value)} style={{ accentColor: '#3b82f6', width: '18px', height: '18px', marginRight: '12px' }} />
                    <CreditCard size={22} color={selectedMethod === 'card' ? '#3b82f6' : '#64748b'} style={{ marginRight: '12px' }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '15px', fontWeight: '600', color: '#1e293b' }}>Credit / Debit / ATM Card</div>
                    </div>
                  </label>
                  {selectedMethod === 'card' && (
                    <div style={{ padding: '0 16px 16px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <input type="text" required placeholder="Card Number (16 Digits)" minLength="16" maxLength="16" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' }} />
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <input type="text" required placeholder="MM/YY" minLength="5" maxLength="5" style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' }} />
                        <input type="password" required placeholder="CVV" minLength="3" maxLength="3" style={{ width: '80px', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' }} />
                      </div>
                      <input type="text" required placeholder="Name on Card" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' }} />
                    </div>
                  )}
                </div>

                {/* Net Banking */}
                <div style={{ border: `1px solid ${selectedMethod === 'netbanking' ? '#3b82f6' : '#e2e8f0'}`, borderRadius: '8px', overflow: 'hidden', backgroundColor: selectedMethod === 'netbanking' ? '#eff6ff' : '#fff', transition: 'all 0.2s' }}>
                  <label style={{ display: 'flex', alignItems: 'center', padding: '12px', cursor: 'pointer' }}>
                    <input type="radio" name="payment" value="netbanking" checked={selectedMethod === 'netbanking'} onChange={(e) => setSelectedMethod(e.target.value)} style={{ accentColor: '#3b82f6', width: '18px', height: '18px', marginRight: '12px' }} />
                    <Wallet size={22} color={selectedMethod === 'netbanking' ? '#3b82f6' : '#64748b'} style={{ marginRight: '12px' }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '15px', fontWeight: '600', color: '#1e293b' }}>Net Banking</div>
                    </div>
                  </label>
                  {selectedMethod === 'netbanking' && (
                    <div style={{ padding: '0 16px 16px 16px' }}>
                      <select required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', backgroundColor: '#fff' }}>
                        <option value="">Select your Bank</option>
                        <option value="sbi">State Bank of India</option>
                        <option value="hdfc">HDFC Bank</option>
                        <option value="icici">ICICI Bank</option>
                        <option value="axis">Axis Bank</option>
                        <option value="kotak">Kotak Mahindra Bank</option>
                      </select>
                    </div>
                  )}
                </div>

                {/* Cash on Delivery */}
                <label className="payment-option" style={{ display: 'flex', alignItems: 'center', padding: '12px', border: `1px solid ${selectedMethod === 'cod' ? '#3b82f6' : '#e2e8f0'}`, borderRadius: '8px', cursor: 'pointer', backgroundColor: selectedMethod === 'cod' ? '#eff6ff' : '#fff', transition: 'all 0.2s' }}>
                  <input type="radio" name="payment" value="cod" checked={selectedMethod === 'cod'} onChange={(e) => setSelectedMethod(e.target.value)} style={{ accentColor: '#3b82f6', width: '18px', height: '18px', marginRight: '12px' }} />
                  <Banknote size={22} color={selectedMethod === 'cod' ? '#3b82f6' : '#64748b'} style={{ marginRight: '12px' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '15px', fontWeight: '600', color: '#1e293b' }}>Cash on Delivery</div>
                  </div>
                </label>
              </div>
            </div>

            {/* Footer / CTA */}
            <div style={{ backgroundColor: '#fff', padding: '16px 20px', borderTop: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', bottom: 0 }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a' }}>₹{totalAmount.toFixed(2)}</span>
                <span style={{ fontSize: '12px', color: '#10b981', fontWeight: '600' }}>View Detailed Bill <ChevronRight size={12} style={{ display: 'inline', verticalAlign: 'middle' }}/></span>
              </div>
              <button 
                type="submit"
                disabled={isProcessing}
                style={{
                  backgroundColor: '#fb923c',
                  color: '#fff', border: 'none', padding: '14px 32px', borderRadius: '6px',
                  fontSize: '16px', fontWeight: '700', cursor: isProcessing ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', gap: '8px', opacity: isProcessing ? 0.7 : 1,
                  boxShadow: '0 4px 12px rgba(251, 146, 60, 0.3)'
                }}
              >
                {isProcessing ? 'Processing...' : (selectedMethod === 'upi' ? 'Pay via UPI' : 'Place Order')}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
