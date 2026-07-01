import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User, Eye, EyeOff, ShieldAlert, ArrowRight } from 'lucide-react';
import { API_BASE as API } from '../../api';

export default function HRLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // If already logged in, redirect straight to dashboard
  useEffect(() => {
    document.title = "Secure Login | RIS HR Portal";
    const token = localStorage.getItem('hr_token');
    if (token) {
      navigate('/hr', { replace: true });
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Please fill in both fields.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (res.status === 200 && data.token) {
        localStorage.setItem('hr_token', data.token);
        navigate('/hr');
      } else {
        setError(data.detail || 'Invalid username or password.');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Could not connect to authentication server. Please check your network.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(circle at top right, #1e293b 0%, #0f172a 100%)',
      fontFamily: 'Inter, sans-serif',
      padding: '20px'
    }}>
      {/* Background decoration flares */}
      <div style={{
        position: 'absolute',
        width: '350px',
        height: '350px',
        background: 'rgba(56, 189, 248, 0.08)',
        filter: 'blur(80px)',
        borderRadius: '50%',
        top: '15%',
        right: '25%',
        zIndex: 0
      }} />
      <div style={{
        position: 'absolute',
        width: '300px',
        height: '300px',
        background: 'rgba(99, 102, 241, 0.08)',
        filter: 'blur(70px)',
        borderRadius: '50%',
        bottom: '15%',
        left: '25%',
        zIndex: 0
      }} />

      {/* Main Login Card */}
      <div style={{
        width: '100%',
        maxWidth: '420px',
        background: 'rgba(30, 41, 59, 0.7)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '24px',
        padding: '40px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        zIndex: 10
      }}>
        {/* Brand/Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <img 
            src="/logo.jpg" 
            alt="RIS Logo" 
            style={{ 
              height: '55px', 
              borderRadius: '10px',
              border: '2px solid rgba(255, 255, 255, 0.1)',
              padding: '2px',
              background: 'white',
              marginBottom: '16px' 
            }} 
          />
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f8fafc', margin: '0 0 6px 0' }}>RIS Portal</h2>
          <p style={{ fontSize: '0.825rem', color: '#94a3b8', margin: 0, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Administrative Access Only</p>
        </div>

        {/* Error Alert Box */}
        {error && (
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '12px',
            padding: '12px 16px',
            marginBottom: '24px'
          }}>
            <ShieldAlert size={20} style={{ color: '#f87171', flexShrink: 0, marginTop: '2px' }} />
            <span style={{ fontSize: '0.85rem', color: '#fca5a5', lineHeight: 1.4 }}>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Username Field */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
              Username
            </label>
            <div style={{ position: 'relative' }}>
              <User size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
              <input 
                type="text" 
                placeholder="Enter username" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '14px 16px 14px 48px',
                  background: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  fontSize: '0.95rem',
                  color: '#f8fafc',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = '#38bdf8'}
                onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
              <input 
                type={showPassword ? 'text' : 'password'} 
                placeholder="Enter password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '14px 44px 14px 48px',
                  background: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  fontSize: '0.95rem',
                  color: '#f8fafc',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = '#38bdf8'}
                onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '16px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  color: '#64748b',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button 
            type="submit" 
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              background: 'linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '1rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 12px rgba(56, 189, 248, 0.2)',
              marginTop: '10px',
              opacity: loading ? 0.7 : 1,
              transition: 'opacity 0.2s'
            }}
          >
            {loading ? (
              <span className="login-spinner" style={{
                border: '2px solid rgba(255,255,255,0.3)',
                borderTop: '2px solid white',
                borderRadius: '50%',
                width: '18px',
                height: '18px',
                animation: 'spin 0.8s linear infinite'
              }} />
            ) : (
              <>
                Sign In <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        {/* Back Link */}
        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <button 
            onClick={() => navigate('/')}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '0.85rem',
              color: '#64748b',
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            Back to Public Job Board
          </button>
        </div>
      </div>
      
      {/* Dynamic spinner CSS animation */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
