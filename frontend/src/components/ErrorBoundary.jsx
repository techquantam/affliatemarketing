import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '70vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 20px',
          textAlign: 'center',
          backgroundColor: 'var(--bg, #f9fafb)',
          color: 'var(--text-bold, #111827)'
        }}>
          <div style={{
            maxWidth: '480px',
            width: '100%',
            backgroundColor: 'var(--card-bg, #ffffff)',
            borderRadius: '16px',
            padding: '36px 24px',
            border: '1px solid var(--border, #e5e7eb)',
            boxShadow: '0 10px 25px rgba(0,0,0,0.06)'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚡</div>
            <h2 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 10px 0' }}>Something went wrong</h2>
            <p style={{ fontSize: '14px', color: 'var(--text-muted, #6b7280)', margin: '0 0 24px 0', lineHeight: '1.5' }}>
              We encountered an unexpected error while loading this page. Don't worry, your data and wallet are completely safe.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={this.handleReset}
                style={{
                  padding: '12px 24px',
                  backgroundColor: 'var(--primary, #ff4d00)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '10px',
                  fontWeight: 700,
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                Back to Home
              </button>
              <button
                onClick={() => window.location.reload()}
                style={{
                  padding: '12px 20px',
                  backgroundColor: 'transparent',
                  color: 'var(--text-bold, #111827)',
                  border: '1px solid var(--border, #d1d5db)',
                  borderRadius: '10px',
                  fontWeight: 600,
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                Reload
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
