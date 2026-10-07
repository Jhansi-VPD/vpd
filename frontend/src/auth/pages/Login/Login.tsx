import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth.context';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide both your corporate email and password.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const user = await login(email.trim(), password);
      const role = String(user.role || '').toLowerCase();
      if (['super_admin', 'admin', 'finance'].includes(role)) navigate('/admin');
      else if (['sales', 'marketing'].includes(role)) navigate('/sales');
      else if (role === 'hr') navigate('/hr');
      else if (role === 'project_manager') navigate('/delivery');
      else if (role === 'client') navigate('/client');
      else navigate('/employee');
    } catch (err: any) {
      setError(err.message || 'Invalid email or password. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        backgroundColor: '#0a0a0c',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        boxSizing: 'border-box',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      {/* Background radial accent glow */}
      <div
        style={{
          position: 'absolute',
          width: '450px',
          height: '450px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(212,175,55,0.08) 0%, rgba(10,10,12,0) 70%)',
          pointerEvents: 'none',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      />

      {/* Login Card */}
      <div
        style={{
          width: '100%',
          maxWidth: '420px',
          backgroundColor: '#121215',
          border: '1px solid #27272a',
          borderRadius: '16px',
          padding: '36px 32px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.85), 0 0 0 1px rgba(255, 255, 255, 0.03)',
          position: 'relative',
          zIndex: 10,
          boxSizing: 'border-box',
        }}
      >
        {/* Brand Logo & Title Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
            <img
              src="/logo.webp"
              alt="VPD Technologies"
              style={{
                height: '48px',
                width: 'auto',
                maxWidth: '180px',
                objectFit: 'contain',
                display: 'block',
              }}
            />
          </div>
          <h1
            style={{
              fontSize: '20px',
              fontWeight: '700',
              color: '#ffffff',
              margin: '0 0 6px 0',
              letterSpacing: '-0.02em',
            }}
          >
            Enterprise Access
          </h1>
          <p
            style={{
              fontSize: '13px',
              color: '#a1a1aa',
              margin: 0,
              lineHeight: '1.4',
            }}
          >
            Enter your corporate credentials to sign in
          </p>
        </div>

        {/* Error Notification */}
        {error && (
          <div
            style={{
              backgroundColor: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid #ef4444',
              borderRadius: '10px',
              padding: '10px 14px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <span style={{ color: '#ef4444', fontWeight: 'bold', fontSize: '14px' }}>⚠</span>
            <p style={{ margin: 0, fontSize: '12px', color: '#fca5a5', lineHeight: '1.4' }}>{error}</p>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Corporate Email Field */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label
              htmlFor="email"
              style={{
                fontSize: '11px',
                fontWeight: '700',
                color: '#d4d4d8',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}
            >
              Corporate Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@vpdtechnologies.com"
              required
              autoComplete="email"
              style={{
                width: '100%',
                padding: '11px 14px',
                backgroundColor: '#18181b',
                border: '1px solid #3f3f46',
                borderRadius: '10px',
                color: '#ffffff',
                fontSize: '14px',
                boxSizing: 'border-box',
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => (e.target.style.borderColor = '#d4af37')}
              onBlur={(e) => (e.target.style.borderColor = '#3f3f46')}
            />
          </div>

          {/* Password Field */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label
              htmlFor="password"
              style={{
                fontSize: '11px',
                fontWeight: '700',
                color: '#d4d4d8',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}
            >
              Password
            </label>
            <div style={{ position: 'relative', width: '100%' }}>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
                autoComplete="current-password"
                style={{
                  width: '100%',
                  padding: '11px 50px 11px 14px',
                  backgroundColor: '#18181b',
                  border: '1px solid #3f3f46',
                  borderRadius: '10px',
                  color: '#ffffff',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                }}
                onFocus={(e) => (e.target.style.borderColor = '#d4af37')}
                onBlur={(e) => (e.target.style.borderColor = '#3f3f46')}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  color: showPassword ? '#dfc067' : '#a1a1aa',
                  padding: '6px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'color 0.2s',
                }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = '#ffffff')}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = showPassword ? '#dfc067' : '#a1a1aa')}
              >
                {showPassword ? (
                  // Eye slash icon (hide)
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  // Eye icon (show)
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Submit Sign In Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              marginTop: '6px',
              padding: '12px',
              backgroundColor: '#d4af37',
              color: '#09090b',
              fontWeight: '700',
              fontSize: '14px',
              borderRadius: '10px',
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              transition: 'background-color 0.2s, transform 0.1s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 14px 0 rgba(212, 175, 55, 0.25)',
            }}
            onMouseEnter={(e) => {
              if (!loading) (e.target as HTMLElement).style.backgroundColor = '#dfc067';
            }}
            onMouseLeave={(e) => {
              if (!loading) (e.target as HTMLElement).style.backgroundColor = '#d4af37';
            }}
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
