import React, { useState, useEffect } from 'react';
import { Mail, Lock, ShieldAlert } from 'lucide-react';
import { apiUsers, BASE_URL } from '../services/api';
import '../Admin.css';

export default function AdminLogin({ onLoginSuccess, onAddNotification, setView }) {
  const [authStep, setAuthStep] = useState('details');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [pendingIdentifier, setPendingIdentifier] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [adminConfig, setAdminConfig] = useState(null);

  // Load admin config from backend on mount
  useEffect(() => {
    fetchAdminConfig();
    
    // Load saved identifier
    const savedIdentifier = localStorage.getItem('remember_admin_email');
    if (savedIdentifier) {
      setIdentifier(savedIdentifier);
      setRememberMe(true);
    }
  }, []);

  // Fetch admin configuration from backend
  const fetchAdminConfig = async () => {
    try {
      // GET /api/admin/config - Returns admin email hint
      const response = await fetch(`${BASE_URL}/admin/config`);
      const data = await response.json();
      setAdminConfig(data);
    } catch (error) {
      console.log('Admin config not available, using default');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (authStep === 'details') {
      if (!identifier || !password) {
        setError('Please fill in all fields.');
        return;
      }

      setLoading(true);

      apiUsers.adminLogin(identifier, password)
        .then((adminUser) => {
          if (rememberMe) {
            localStorage.setItem('remember_admin_email', identifier);
          } else {
            localStorage.removeItem('remember_admin_email');
          }

          localStorage.setItem('admin_session', JSON.stringify(adminUser));
          localStorage.setItem('is_admin', 'true');

          onAddNotification('Admin authentication successful! Access granted.', 'success');
          onLoginSuccess(adminUser);
          setLoading(false);
        })
        .catch((error) => {
          if (error.requireOtp) {
            setAuthStep('otp');
            setPendingIdentifier(identifier);
            setSuccessMessage(error.message || 'Please verify your email or phone to continue.');
            setLoading(false);
            return;
          }

          console.error('Admin login error:', error);
          setError(error.message || 'Invalid admin credentials. Please try again.');
          onAddNotification('Authentication failed: ' + (error.message || 'Incorrect identifier or password.'), 'error');
          setLoading(false);
        });
    } else {
      if (!otp || otp.length < 6) {
        setError('Please enter the 6-digit OTP.');
        return;
      }

      if (!pendingIdentifier) {
        setError('Missing identifier for OTP verification. Please restart login.');
        return;
      }

      setLoading(true);

      apiUsers.verifyOtp(pendingIdentifier, otp)
        .then((adminUser) => {
          localStorage.setItem('admin_session', JSON.stringify(adminUser));
          localStorage.setItem('is_admin', 'true');
          if (rememberMe) {
            localStorage.setItem('remember_admin_email', pendingIdentifier);
          }

          onAddNotification('Admin verified successfully! Access granted.', 'success');
          onLoginSuccess(adminUser);
          setLoading(false);
        })
        .catch((error) => {
          console.error('Admin OTP verification error:', error);
          setError(error.message || 'OTP verification failed.');
          setLoading(false);
        });
    }
  };

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleForgot = () => {
    setError('');
    setSuccessMessage('');
    setAuthStep('forgot');
  };

  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!identifier) {
      setError('Please enter your admin email or registered mobile number.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const res = await apiUsers.forgotPassword(identifier);
      setPendingIdentifier(identifier);
      setAuthStep('reset');
      setSuccessMessage(res.message || 'OTP sent successfully! Enter the OTP and your new password.');
      onAddNotification('OTP sent! Please check your email or phone.', 'info');
    } catch (err) {
      console.error('Forgot password error:', err);
      setError(err.message || 'Failed to send OTP. Please check your email/mobile.');
      onAddNotification('Error: ' + (err.message || 'Failed to send reset OTP.'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!otp || otp.length < 6) {
      setError('Please enter the valid 6-digit OTP.');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New password and confirm password do not match.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const res = await apiUsers.resetPassword(pendingIdentifier, otp, newPassword);
      onAddNotification('Password reset successfully! Please sign in with your new password.', 'success');
      setSuccessMessage(res.message || 'Password reset successfully! Please sign in.');
      setAuthStep('details');
      setPassword('');
      setOtp('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      console.error('Reset password error:', err);
      setError(err.message || 'Failed to reset password. Please verify your OTP.');
      onAddNotification('Reset failed: ' + (err.message || 'Invalid or expired OTP.'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const renderFormContent = () => {
    if (authStep === 'forgot') {
      return (
        <form onSubmit={handleForgotPasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div style={{ textAlign: 'left', marginBottom: '4px' }}>
            <h3 style={{ fontSize: '15px', color: '#f3f4f6', margin: '0 0 6px 0' }}>Reset Admin Password</h3>
            <p style={{ fontSize: '12px', color: '#9ca3af', margin: 0 }}>
              Enter your registered admin email or mobile number to receive a 6-digit verification OTP.
            </p>
          </div>

          <div className="admin-login-input-wrapper">
            <Mail size={18} />
            <input
              type="text"
              placeholder="Admin Email or Mobile"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              disabled={loading}
              autoFocus
            />
          </div>

          <button type="submit" className="admin-login-btn" disabled={loading || !identifier}>
            {loading ? 'Sending OTP...' : 'Send Verification OTP'}
          </button>

          <div style={{ textAlign: 'center', marginTop: '6px' }}>
            <button
              type="button"
              onClick={() => {
                setAuthStep('details');
                setError('');
                setSuccessMessage('');
              }}
              style={{ background: 'none', border: 'none', color: '#9ca3af', fontSize: '13px', cursor: 'pointer', textDecoration: 'underline' }}
            >
              Back to Sign In
            </button>
          </div>
        </form>
      );
    }

    if (authStep === 'reset') {
      return (
        <form onSubmit={handleResetPasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ textAlign: 'left', marginBottom: '4px' }}>
            <h3 style={{ fontSize: '15px', color: '#f3f4f6', margin: '0 0 6px 0' }}>Enter OTP & Set New Password</h3>
            <p style={{ fontSize: '12px', color: '#9ca3af', margin: 0 }}>
              An OTP was sent to <strong style={{ color: '#60a5fa' }}>{pendingIdentifier}</strong>.
            </p>
          </div>

          <div className="admin-login-input-wrapper">
            <Mail size={18} />
            <input
              type="text"
              placeholder="Enter 6-digit OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              disabled={loading}
              autoFocus
            />
          </div>

          <div className="admin-login-input-wrapper">
            <Lock size={18} />
            <input
              type="password"
              placeholder="New Password (min 6 chars)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="admin-login-input-wrapper">
            <Lock size={18} />
            <input
              type="password"
              placeholder="Confirm New Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
            />
          </div>

          <button type="submit" className="admin-login-btn" disabled={loading || otp.length < 6 || !newPassword}>
            {loading ? 'Resetting Password...' : 'Save New Password & Sign In'}
          </button>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
            <button
              type="button"
              onClick={() => {
                setAuthStep('details');
                setError('');
                setSuccessMessage('');
              }}
              style={{ background: 'none', border: 'none', color: '#9ca3af', fontSize: '13px', cursor: 'pointer', textDecoration: 'underline' }}
            >
              Back to Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                apiUsers.resendOtp(pendingIdentifier)
                  .then((res) => {
                    setSuccessMessage(res.message || 'OTP resent successfully.');
                    onAddNotification('OTP resent successfully.', 'info');
                  })
                  .catch((err) => {
                    setError(err.message || 'Failed to resend OTP.');
                    onAddNotification('Resend failed: ' + (err.message || 'Unknown error'), 'error');
                  });
              }}
              style={{ background: 'none', border: 'none', color: '#60a5fa', fontSize: '13px', cursor: 'pointer', textDecoration: 'underline' }}
            >
              Resend OTP
            </button>
          </div>
        </form>
      );
    }

    // Default: 'details' or 'otp'
    return (
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        {authStep === 'details' ? (
          <>
            <div className="admin-login-input-wrapper">
              <Mail size={18} />
              <input
                type="text"
                placeholder={adminConfig?.emailHint || "Admin Email or Mobile"}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="admin-login-input-wrapper">
              <Lock size={18} />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '-6px', marginBottom: '6px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#9ca3af', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  style={{ cursor: 'pointer', accentColor: 'var(--primary)' }}
                />
                Remember Me
              </label>
              <span className="admin-login-forgot-btn" onClick={handleForgot} style={{ fontSize: '12px', color: '#9ca3af', cursor: 'pointer' }}>
                Forgot Password?
              </span>
            </div>

            <button type="submit" className="admin-login-btn" disabled={loading}>
              {loading ? 'Verifying Credentials...' : 'Sign In to Dashboard'}
            </button>
          </>
        ) : (
          <>
            <div className="admin-login-input-wrapper">
              <Mail size={18} />
              <input
                type="text"
                placeholder="Enter OTP sent to your email or mobile"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                disabled={loading}
              />
            </div>

            <button type="submit" className="admin-login-btn" disabled={loading || otp.length < 6}>
              {loading ? 'Verifying OTP...' : 'Verify OTP & Continue'}
            </button>

            <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => {
                  setAuthStep('details');
                  setOtp('');
                  setError('');
                  setSuccessMessage('');
                }}
                style={{ background: 'none', border: 'none', color: '#9ca3af', fontSize: '13px', cursor: 'pointer', textDecoration: 'underline' }}
              >
                Back to login
              </button>
              <button
                type="button"
                onClick={() => {
                  apiUsers.resendOtp(pendingIdentifier)
                    .then((res) => setSuccessMessage(res.message || 'OTP resent successfully.'))
                    .catch((err) => setError(err.message || 'Failed to resend OTP.'));
                }}
                style={{ background: 'none', border: 'none', color: '#9ca3af', fontSize: '13px', cursor: 'pointer', textDecoration: 'underline' }}
              >
                Resend OTP
              </button>
            </div>
          </>
        )}
      </form>
    );
  };

  return (
    <div className="admin-login-layout animate-fade">
      <div className="admin-login-card">
        <div className="admin-login-header">
          <img src="/logo.webp" alt="Lio Mart Logo" style={{ width: '48px', height: '48px', margin: '0 auto 12px', display: 'block', objectFit: 'contain' }} />
          <h2>LIO MART Admin</h2>
          <p>Sign in to manage LIO MART rewards & catalog</p>
        </div>

        {error && (
          <div className="admin-login-error">
            <ShieldAlert size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
            {error}
          </div>
        )}

        {successMessage && (
          <div style={{
            backgroundColor: '#064e3b',
            color: '#34d399',
            padding: '10px 14px',
            borderRadius: '8px',
            fontSize: '13px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            {successMessage}
          </div>
        )}

        {renderFormContent()}

        {/* Admin Credentials Hint from Backend */}
        {adminConfig && authStep === 'details' && (
          <div style={{ 
            marginTop: '20px', 
            padding: '12px', 
            backgroundColor: '#1f2937', 
            borderRadius: '8px',
            fontSize: '12px',
            color: '#9ca3af'
          }}>
            <p style={{ margin: '0 0 6px 0', fontWeight: '600' }}>Admin Credentials:</p>
            <p style={{ margin: '0' }}>Email: <code style={{ color: '#60a5fa' }}>{adminConfig.adminEmail}</code></p>
            <p style={{ margin: '4px 0 0 0' }}>Password: <code style={{ color: '#60a5fa' }}>{adminConfig.adminPassword}</code></p>
            <p style={{ margin: '8px 0 0 0', fontSize: '11px', color: '#6b7280' }}>
              (Credentials stored securely in backend MongoDB)
            </p>
          </div>
        )}

        <div style={{ marginTop: '24px', textAlign: 'center' }}>
          <button
            onClick={() => setView('home')}
            style={{ color: '#9ca3af', fontSize: '13px', cursor: 'pointer', textDecoration: 'underline' }}
          >
            Back to Public Website
          </button>
        </div>
      </div>
    </div>
  );
}