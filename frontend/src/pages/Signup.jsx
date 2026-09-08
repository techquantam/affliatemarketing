import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { User, Mail, Lock, Gift, ShieldCheck, ArrowLeft } from 'lucide-react';
import { apiUsers } from '../services/api';

const Link = ({ to, children, className, target, style, ...props }) => {
  const href = to.startsWith('#') ? to : `#${to}`;
  return (
    <a
      href={href}
      target={target}
      rel={target === '_blank' ? 'noopener noreferrer' : undefined}
      className={className}
      style={style}
      {...props}
    >
      {children}
    </a>
  );
};

export default function Signup({ onLogin, setView }) {
  const [name, setName] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [referralCode, setReferralCode] = useState(() => localStorage.getItem('lio_referral_code') || '');
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [otpStep, setOtpStep] = useState(false);
  const [otp, setOtp] = useState('');

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!agreed) {
      toast.error("Please accept Terms & Conditions");
      setError("Please accept Terms & Conditions");
      return;
    }

    if (!name || !identifier || !password) {
      toast.error("Please fill in all required fields");
      setError("Please fill in all required fields");
      return;
    }

    setError('');
    setLoading(true);

    try {
      const refCodeToUse = (referralCode && referralCode.trim()) || localStorage.getItem('lio_referral_code') || null;
      const res = await apiUsers.register(name, identifier, password, refCodeToUse);

      if (res.requireOtp) {
        setOtpStep(true);
        toast.info(res.message || "OTP sent to your email or phone.");
        setLoading(false);
        return;
      }

      localStorage.setItem('user_session', JSON.stringify(res));
      localStorage.setItem('is_admin', 'false');
      toast.success("Account created successfully!");
      if (onLogin) onLogin(res);
      if (setView) setView('home');
      else window.location.hash = '';
    } catch (err) {
      if (err.requireOtp) {
        setOtpStep(true);
        toast.info(err.message || "OTP sent to your email or phone.");
      } else {
        const msg = err.message || "Registration failed. Please try again.";
        setError(msg);
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp || otp.length < 4) {
      toast.error("Please enter a valid OTP");
      return;
    }

    setLoading(true);
    try {
      const userData = await apiUsers.verifyOtp(identifier, otp);
      localStorage.setItem('user_session', JSON.stringify(userData));
      localStorage.setItem('is_admin', 'false');
      toast.success("Account verified & logged in!");
      if (onLogin) onLogin(userData);
      if (setView) setView('home');
      else window.location.hash = '';
    } catch (err) {
      toast.error(err.message || "Invalid OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="signup-page-container"
      style={{
        minHeight: '80vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        background: 'var(--bg, #f8fafc)'
      }}
    >
      <div
        className="signup-card"
        style={{
          width: '100%',
          maxWidth: '460px',
          background: 'var(--card-bg, #ffffff)',
          border: '1px solid var(--border, #e2e8f0)',
          borderRadius: '16px',
          padding: '32px 28px',
          boxShadow: 'var(--shadow-lg, 0 10px 25px rgba(0,0,0,0.05))'
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: '24px', textAlign: 'center' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-bold, #0f172a)', fontFamily: 'var(--heading, sans-serif)', marginBottom: '6px' }}>
            Create Your Account
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--text, #475569)' }}>
            Join LIO MART to earn cashback, rewards and exclusive referral benefits.
          </p>
        </div>

        {error && (
          <div style={{ padding: '10px 14px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', color: '#dc2626', fontSize: '13px', marginBottom: '16px' }}>
            {error}
          </div>
        )}

        {!otpStep ? (
          <form onSubmit={handleSignup} className="signup-form">
            {/* Full Name */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-bold, #1e293b)', marginBottom: '6px' }}>
                Full Name
              </label>
              <div style={{ position: 'relative' }}>
                <User size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
                <input
                  type="text"
                  placeholder="Enter full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 36px',
                    borderRadius: '8px',
                    border: '1px solid var(--border, #cbd5e1)',
                    background: 'var(--bg, #f8fafc)',
                    color: 'var(--text-bold, #0f172a)',
                    fontSize: '14px'
                  }}
                />
              </div>
            </div>

            {/* Email or Mobile Number */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-bold, #1e293b)', marginBottom: '6px' }}>
                Email or Mobile Number
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
                <input
                  type="text"
                  placeholder="Enter email or mobile number"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  required
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 36px',
                    borderRadius: '8px',
                    border: '1px solid var(--border, #cbd5e1)',
                    background: 'var(--bg, #f8fafc)',
                    color: 'var(--text-bold, #0f172a)',
                    fontSize: '14px'
                  }}
                />
              </div>
            </div>

            {/* Password */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-bold, #1e293b)', marginBottom: '6px' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
                <input
                  type="password"
                  placeholder="Create secure password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 36px',
                    borderRadius: '8px',
                    border: '1px solid var(--border, #cbd5e1)',
                    background: 'var(--bg, #f8fafc)',
                    color: 'var(--text-bold, #0f172a)',
                    fontSize: '14px'
                  }}
                />
              </div>
            </div>

            {/* Referral Code (Optional) */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-bold, #1e293b)', marginBottom: '6px' }}>
                Referral Code (Optional)
              </label>
              <div style={{ position: 'relative' }}>
                <Gift size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5, color: '#FF4D00' }} />
                <input
                  type="text"
                  placeholder="Referral Code (e.g. LIO12345)"
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 36px',
                    borderRadius: '8px',
                    border: '1px solid var(--border, #cbd5e1)',
                    background: 'var(--bg, #f8fafc)',
                    color: 'var(--text-bold, #0f172a)',
                    fontSize: '14px',
                    textTransform: 'uppercase'
                  }}
                />
              </div>
            </div>

            {/* Checkbox UI - Terms & Conditions & Privacy Policy */}
            <div className="flex items-start gap-2 mt-4" style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginTop: '16px', marginBottom: '20px' }}>
              <input
                type="checkbox"
                id="terms"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-1"
                style={{ marginTop: '3px', cursor: 'pointer', accentColor: '#FF4D00', width: '16px', height: '16px', flexShrink: 0 }}
              />
              <label htmlFor="terms" className="text-sm text-gray-600" style={{ fontSize: '13px', color: 'var(--text, #4b5563)', cursor: 'pointer', lineHeight: '1.4' }}>
                I have read and agree to the{' '}
                <Link to="/terms-conditions" target="_blank" className="text-blue-600 underline mx-1" style={{ color: 'var(--primary, #FF4D00)', textDecoration: 'underline', margin: '0 2px', fontWeight: '600' }}>
                  Terms &amp; Conditions
                </Link>{' '}
                and{' '}
                <Link to="/privacy-policy" target="_blank" className="text-blue-600 underline mx-1" style={{ color: 'var(--primary, #FF4D00)', textDecoration: 'underline', margin: '0 2px', fontWeight: '600' }}>
                  Privacy Policy
                </Link>.
              </label>
            </div>

            {/* Submit Button with Disabled Logic */}
            <button
              type="submit"
              disabled={!agreed || loading}
              className={`w-full py-2 rounded ${!agreed ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                fontWeight: '700',
                fontSize: '14px',
                border: 'none',
                cursor: !agreed || loading ? 'not-allowed' : 'pointer',
                backgroundColor: !agreed ? '#9ca3af' : 'var(--primary, #FF4D00)',
                color: '#ffffff',
                boxShadow: !agreed ? 'none' : '0 4px 12px rgba(255, 77, 0, 0.25)',
                transition: 'all 0.2s'
              }}
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-bold, #1e293b)', marginBottom: '6px' }}>
                Enter OTP sent to your email / phone
              </label>
              <div style={{ position: 'relative' }}>
                <ShieldCheck size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
                <input
                  type="text"
                  placeholder="Enter 4 or 6 digit OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 36px',
                    borderRadius: '8px',
                    border: '1px solid var(--border, #cbd5e1)',
                    background: 'var(--bg, #f8fafc)',
                    color: 'var(--text-bold, #0f172a)',
                    fontSize: '14px'
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 rounded bg-blue-600 text-white"
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                fontWeight: '700',
                fontSize: '14px',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: 'var(--primary, #FF4D00)',
                color: '#ffffff'
              }}
            >
              {loading ? 'Verifying...' : 'Verify OTP & Complete Signup'}
            </button>
          </form>
        )}

        <div style={{ textAlign: 'center', marginTop: '18px', fontSize: '13px', color: 'var(--text, #64748b)' }}>
          Already have an account?{' '}
          <a
            href="#/login"
            onClick={(e) => {
              e.preventDefault();
              if (setView) setView('home');
              else window.location.hash = '';
            }}
            style={{ color: 'var(--primary, #FF4D00)', fontWeight: '600', textDecoration: 'none' }}
          >
            Log In
          </a>
        </div>
      </div>
    </div>
  );
}
