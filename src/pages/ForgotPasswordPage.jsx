import React, { useState } from 'react';
import axios from 'axios';
import jarLogo from '../jar.png';
import './auth.css';

export default function ForgotPasswordPage({ onNavigate }) {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (!email) return setError('Please enter your email address.');
    setError('');
    setLoading(true);
    try {
      await axios.post('http://localhost:5001/api/auth/forgot-password', { email });
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <img src={jarLogo} alt="logo" />
        </div>

        {sent ? (
          <div className="reset-success">
            <div className="reset-success-icon">✉</div>
            <h2 className="auth-title">Check your email</h2>
            <p className="auth-sub">
              We sent a password reset link to<br />
              <strong>{email}</strong>
            </p>
            <button className="auth-submit" style={{ marginTop: 24 }} onClick={() => onNavigate('login')}>
              Back to Sign In
            </button>
          </div>
        ) : (
          <>
            <h2 className="auth-title">Forgot Password?</h2>
            <p className="auth-sub">Enter your email and we'll send you a reset link.</p>

            <form onSubmit={submit} className="auth-form">
              {error && <p className="auth-error">{error}</p>}
              <div className="field-group">
                <label>Email</label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <button className="auth-submit" type="submit" disabled={loading}>
                {loading ? 'Sending…' : 'Send Reset Link'}
              </button>
            </form>

            <p className="auth-switch">
              Remember your password?{' '}
              <button className="link-btn" onClick={() => onNavigate('login')}>Sign in</button>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
