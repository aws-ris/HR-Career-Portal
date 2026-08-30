import React, { useState } from 'react';
import { Lock, Key, ShieldCheck, AlertCircle, CheckCircle2, HelpCircle, Mail, PhoneCall } from 'lucide-react';
import { API_BASE as API } from '../../api';

export default function HRSettings() {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    setError(null);

    if (!oldPassword) {
      setError('Please enter your current password.');
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
    const token = localStorage.getItem('hr_token');

    try {
      const res = await fetch(`${API}/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          old_password: oldPassword,
          new_password: newPassword
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Failed to update password.');
      }

      setMessage(data.message || 'Password updated successfully!');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err.message || 'Error connecting to server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="hr-page" style={{ maxWidth: '850px', margin: '0 auto' }}>
      
      {/* Header */}
      <div className="hr-page-header" style={{ marginBottom: '32px' }}>
        <div>
          <h1 className="hr-page-title" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Lock size={28} style={{ color: '#d97706' }} />
            Account Settings & Security
          </h1>
          <p className="hr-page-subtitle">
            Manage your administrator credentials and account security preferences.
          </p>
        </div>
      </div>

      {/* Main Password Change Form Card */}
      <div style={{
        background: '#ffffff',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        padding: '32px',
        boxShadow: '0 4px 14px -2px rgba(15, 23, 42, 0.04)',
        marginBottom: '32px'
      }}>
        
        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Key size={18} style={{ color: '#0284c7' }} />
          Change Password
        </h3>
        <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '24px' }}>
          Enter your current password followed by your new password below to confirm updates.
        </p>

        {/* Notifications */}
        {message && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            color: '#166534',
            padding: '14px 18px',
            borderRadius: '10px',
            fontSize: '0.9rem',
            fontWeight: 700,
            marginBottom: '24px'
          }}>
            <CheckCircle2 size={18} />
            <span>{message}</span>
          </div>
        )}

        {error && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#991b1b',
            padding: '14px 18px',
            borderRadius: '10px',
            fontSize: '0.9rem',
            fontWeight: 700,
            marginBottom: '24px'
          }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Current Password */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
              Current / Old Password *
            </label>
            <input 
              type="password"
              placeholder="Enter current password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '0.95rem',
                outline: 'none',
                background: '#f8fafc',
                transition: 'border 0.2s'
              }}
            />
          </div>

          {/* New Password */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
              New Password *
            </label>
            <input 
              type="password"
              placeholder="Enter new password (min. 6 characters)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '0.95rem',
                outline: 'none',
                background: '#f8fafc',
                transition: 'border 0.2s'
              }}
            />
          </div>

          {/* Confirm New Password */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
              Confirm New Password *
            </label>
            <input 
              type="password"
              placeholder="Retype new password to confirm"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '0.95rem',
                outline: 'none',
                background: '#f8fafc',
                transition: 'border 0.2s'
              }}
            />
          </div>

          {/* Submit Button */}
          <div style={{ marginTop: '10px' }}>
            <button
              type="submit"
              disabled={loading}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: '#f59e0b',
                color: '#090d16',
                fontWeight: 800,
                fontSize: '0.9rem',
                padding: '12px 24px',
                borderRadius: '10px',
                cursor: loading ? 'not-allowed' : 'pointer',
                border: 'none',
                boxShadow: '0 4px 12px rgba(245, 158, 11, 0.25)'
              }}
            >
              <ShieldCheck size={18} />
              <span>{loading ? 'Updating Password...' : 'Confirm & Update Password'}</span>
            </button>
          </div>

        </form>
      </div>

      {/* Forgot Password Notice Box */}
      <div style={{
        background: '#fffbe6',
        borderRadius: '16px',
        border: '1px solid #ffe58f',
        padding: '24px 28px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '16px'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '10px',
          background: '#faad14',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}>
          <HelpCircle size={22} />
        </div>
        <div>
          <h4 style={{ margin: '0 0 6px 0', fontSize: '1rem', fontWeight: 800, color: '#873800' }}>
            Forgot your current password?
          </h4>
          <p style={{ margin: '0 0 12px 0', fontSize: '0.875rem', color: '#612500', lineHeight: 1.6 }}>
            In case you have forgotten your password or are unable to log in, please contact the <strong>IT Department</strong> for password update assistance.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', fontSize: '0.825rem', color: '#873800', fontWeight: 700 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Mail size={14} /> Contact IT Support: <u>it-support@ris.org.in</u>
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <PhoneCall size={14} /> Extension: 402 / IT Cell
            </span>
          </div>
        </div>
      </div>

    </div>
  );
}
