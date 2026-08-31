import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an unhandled rendering crash:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f8fafc',
          padding: '20px',
          fontFamily: "'Inter', sans-serif"
        }}>
          <div style={{
            maxWidth: '520px',
            width: '100%',
            background: '#ffffff',
            border: '2px solid #002147',
            borderRadius: '12px',
            padding: '32px',
            boxShadow: '0 12px 32px rgba(0, 33, 71, 0.15)',
            textAlign: 'center'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              background: '#002147',
              color: '#d97706',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.8rem',
              fontWeight: 'bold',
              margin: '0 auto 20px auto',
              border: '2px solid #d97706'
            }}>
              🏛️
            </div>

            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#002147', margin: '0 0 10px 0' }}>
              System Health Notice
            </h2>

            <p style={{ fontSize: '0.92rem', color: '#475569', lineHeight: 1.6, marginBottom: '20px' }}>
              A temporary display error occurred. Your candidate information and form progress remain completely safe.
            </p>

            <div style={{
              background: '#f1f5f9',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              padding: '14px',
              fontSize: '0.85rem',
              color: '#1e293b',
              marginBottom: '24px',
              textAlign: 'left'
            }}>
              <strong>📧 Support Contact:</strong> For immediate assistance, please email Mr. Parmod Kumar at{' '}
              <a 
                href="mailto:parmod.kumar@ris.org.in?subject=RIS%20Portal%20System%20Notice" 
                style={{ color: '#002147', fontWeight: 700, textDecoration: 'underline' }}
              >
                parmod.kumar@ris.org.in
              </a>.
            </div>

            <button
              onClick={() => window.location.reload()}
              style={{
                width: '100%',
                padding: '12px 24px',
                background: '#002147',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '0.95rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'background 0.2s',
                boxShadow: '0 4px 12px rgba(0, 33, 71, 0.2)'
              }}
            >
              🔄 Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
