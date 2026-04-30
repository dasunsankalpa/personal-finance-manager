import React, { useState } from 'react';
import { loginUser } from '../api';
import jarLogo from '../jar.png';
import './auth.css';

export default function LoginPage({ onLogin, onNavigate }) {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) return setError('Please fill in all fields.');
    setError('');
    setLoading(true);
    try {
      const data = await loginUser(form);
      localStorage.setItem('user', JSON.stringify(data.user));
      onLogin(data.user);
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const googleLogin = async () => {
    // Google login not implemented yet
    setError('Google login is not available at this time.');
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <img src={jarLogo} alt="logo" />
        </div>
        <h2 className="auth-title">Sign In</h2>
        <p className="auth-sub">Sign in to Money Flow Monitor</p>

        <button className="google-btn" onClick={googleLogin} disabled={loading}>
          <svg width="18" height="18" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          </svg>
          Continue with Google
        </button>

        <div className="auth-divider"><span>or</span></div>

        <form onSubmit={submit} className="auth-form">
          {error && <p className="auth-error">{error}</p>}
          <div className="field-group">
            <label>Email</label>
            <input name="email" type="email" placeholder="you@example.com" value={form.email} onChange={handle} />
          </div>
          <div className="field-group">
            <label>Password</label>
            <input name="password" type="password" placeholder="••••••••" value={form.password} onChange={handle} />
          </div>
          <div className="auth-forgot">
            <button type="button" className="link-btn" onClick={() => onNavigate('forgot')}>
              Forgot password?
            </button>
          </div>
          <button className="auth-submit" type="submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p className="auth-switch">
          Don't have an account?{' '}
          <button className="link-btn" onClick={() => onNavigate('signup')}>Sign up</button>
        </p>
      </div>
    </div>
  );
}
