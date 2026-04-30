import React, { useState } from 'react';
import jarLogo from '../jar.png';
import bgImage from '../start.jpg';
import './auth.css';
import { registerUser, loginUser } from '../api';

const features = [
  'This app helps you manage salary, essentials, and daily expenses.',
  'It highlights repeated small expenses, category insights, and spending spikes.',
];

function LoginModal({ onClose, onLogin, onSwitchToSignup, onNavigate }) {
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
      const data = await loginUser({ email: form.email, password: form.password });
      localStorage.setItem('user', JSON.stringify(data.user));
      onLogin(data.user);
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={m.overlay}>
      <div style={m.box} onClick={e => e.stopPropagation()}>
        <button style={m.close} onClick={onClose}>✕</button>
        <img src={jarLogo} alt="logo" style={m.logo} />
        <h2 style={m.title}>Sign In</h2>
        <p style={m.sub}>Sign in to Money Flow Monitor</p>
        {error && <p style={m.error}>{error}</p>}
        <form onSubmit={submit} style={m.form}>
          <input className="modal-input" name="email" type="email" placeholder="Email" value={form.email} onChange={handle} style={m.input} />
          <input className="modal-input" name="password" type="password" placeholder="Password" value={form.password} onChange={handle} style={m.input} />
          <button type="button" style={m.forgot} onClick={() => { onClose(); onNavigate('forgot'); }}>Forgot password?</button>
          <button type="submit" style={m.submit} disabled={loading}>{loading ? 'Signing in…' : 'Sign In'}</button>
        </form>
        <p style={m.switch}>
          No account?{' '}
          <span style={m.link} onClick={onSwitchToSignup}>Sign up</span>
        </p>
      </div>
    </div>
  );
}

function SignupModal({ onClose, onLogin, onSwitchToLogin }) {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '', gender: '', birthday: '' });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const passwordRules = [
    { test: v => v.length >= 8,          msg: 'At least 8 characters' },
    { test: v => /[A-Z]/.test(v),        msg: 'One uppercase letter' },
    { test: v => /[0-9]/.test(v),        msg: 'One number' },
    { test: v => /[^A-Za-z0-9]/.test(v), msg: 'One special character' },
  ];

  const handle = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    const newErrors = { ...errors };
    if (name === 'email')
      newErrors.email = value && !emailRegex.test(value) ? 'Enter a valid email (e.g. user@example.com)' : '';
    if (name === 'password') {
      const failed = passwordRules.filter(r => !r.test(value)).map(r => r.msg);
      newErrors.password = failed.length ? `Needs: ${failed.join(', ')}` : '';
    }
    if (name === 'confirm')
      newErrors.confirm = value && value !== form.password ? 'Passwords do not match' : '';
    setErrors(newErrors);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password || !form.confirm || !form.gender || !form.birthday)
      return setError('Please fill in all fields.');
    if (!emailRegex.test(form.email))
      return setError('Enter a valid email address (e.g. user@example.com).');
    const failedRules = passwordRules.filter(r => !r.test(form.password));
    if (failedRules.length)
      return setError(`Password needs: ${failedRules.map(r => r.msg).join(', ')}.`);
    if (form.password !== form.confirm)
      return setError('Passwords do not match.');
    setError('');
    setLoading(true);
    try {
      await registerUser({ name: form.name, email: form.email, password: form.password });
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      onLogin(null);
    } catch (err) {
      setError(err.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line no-unused-vars
  const googleSignup = async () => {
    setError('Google signup is not available at this time.');
  };

  return (
    <div style={m.overlay}>
      <div style={{ ...m.box, maxWidth: '560px', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
        <button style={m.close} onClick={onClose}>✕</button>
        <img src={jarLogo} alt="logo" style={m.logo} />
        <h2 style={m.title}>Create Account</h2>
        <p style={m.sub}>Start your financial journey today</p>
        {error && <p style={m.error}>{error}</p>}
        <form onSubmit={submit} style={m.form}>
          <button type="button" style={{ ...m.googleBtn, opacity: 0.5, cursor: 'not-allowed' }} disabled title="Google signup is not available at this time.">
            <svg width="18" height="18" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
            Sign up with Google
          </button>
          <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)', margin: '-4px 0 4px', textAlign: 'center' }}>Google signup is not available at this time.</p>
          <div style={m.divider}><span style={m.dividerSpan}>or</span></div>
          <input className="modal-input" name="name" type="text" placeholder="Full Name" value={form.name} onChange={handle} style={m.input} />
          <div>
            <input className="modal-input" name="email" type="email" placeholder="Email (e.g. user@example.com)" value={form.email} onChange={handle} style={{ ...m.input, borderColor: errors.email ? '#ef4444' : 'rgba(255,255,255,0.3)' }} />
            {errors.email && <p style={{ color: '#fca5a5', fontSize: '0.72rem', margin: '4px 0 0', textAlign: 'left' }}>{errors.email}</p>}
          </div>
          <div style={m.row}>
            <div>
              <input className="modal-input" name="password" type="password" placeholder="Password" value={form.password} onChange={handle} style={{ ...m.input, borderColor: errors.password ? '#ef4444' : form.password && !errors.password ? '#22c55e' : 'rgba(255,255,255,0.3)' }} />
              {errors.password && <p style={{ color: '#fca5a5', fontSize: '0.72rem', margin: '4px 0 0', textAlign: 'left' }}>{errors.password}</p>}
              {form.password && !errors.password && <p style={{ color: '#86efac', fontSize: '0.72rem', margin: '4px 0 0', textAlign: 'left' }}>✓ Strong</p>}
            </div>
            <div>
              <input className="modal-input" name="confirm" type="password" placeholder="Confirm Password" value={form.confirm} onChange={handle} style={{ ...m.input, borderColor: errors.confirm ? '#ef4444' : form.confirm && !errors.confirm ? '#22c55e' : 'rgba(255,255,255,0.3)' }} />
              {errors.confirm && <p style={{ color: '#fca5a5', fontSize: '0.72rem', margin: '4px 0 0', textAlign: 'left' }}>{errors.confirm}</p>}
              {form.confirm && !errors.confirm && form.confirm === form.password && <p style={{ color: '#86efac', fontSize: '0.72rem', margin: '4px 0 0', textAlign: 'left' }}>✓ Match</p>}
            </div>
          </div>
          <div style={m.row}>
            <select name="gender" value={form.gender} onChange={handle} style={m.input}>
              <option value="" style={{ color: '#1e293b' }}>Select Gender</option>
              <option value="male" style={{ color: '#1e293b' }}>Male</option>
              <option value="female" style={{ color: '#1e293b' }}>Female</option>
            </select>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)', textAlign: 'left', paddingLeft: '4px' }}>🎂 Date of Birth</label>
              <input className="modal-input" name="birthday" type="date" value={form.birthday} onChange={handle} style={m.input} />
            </div>
          </div>
          <button type="submit" style={m.submit} disabled={loading}>
            {loading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>
        <p style={m.switch}>
          Already have an account?{' '}
          <span style={m.link} onClick={onSwitchToLogin}>Sign in</span>
        </p>
      </div>
    </div>
  );
}

export default function StartPage({ onNavigate }) {
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);

  return (
    <div style={styles.page}>
      {showLogin && (
        <LoginModal
          onClose={() => setShowLogin(false)}
          onLogin={(u) => onNavigate('_login_success_', u)}
          onSwitchToSignup={() => { setShowLogin(false); setShowSignup(true); }}
          onNavigate={onNavigate}
        />
      )}
      {showSignup && (
        <SignupModal
          onClose={() => setShowSignup(false)}
          onLogin={(u) => { setShowSignup(false); if (u) onNavigate('_login_success_', u); else setShowLogin(true); }}
          onSwitchToLogin={() => { setShowSignup(false); setShowLogin(true); }}
        />
      )}
      <div style={styles.card}>
        <img src={jarLogo} alt="logo" style={styles.logo} />
        <h1 style={styles.title}>💰 Money Flow Monitorr</h1>
        <p style={styles.subtitle}>Track your expenses, spot leaks, and stay in control.</p>

        <div style={styles.btnGroup}>
          <button style={styles.primary} onClick={() => setShowLogin(true)}>Login</button>
          <button style={styles.secondary} onClick={() => setShowSignup(true)}>Register</button>
          <button style={styles.outline} onClick={() => onNavigate('dashboard')}>Go to Dashboard</button>
        </div>

        <div style={styles.summary}>
          {features.map((f, i) => (
            <p key={i} style={styles.feature}>✦ {f}</p>
          ))}
        </div>
      </div>
    </div>
  );
}

const m = {
  overlay: {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0,0,0,0.6)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1000,
  },
  box: {
    background: 'rgba(255,255,255,0.1)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    borderRadius: '20px',
    padding: '40px 36px',
    width: '100%',
    maxWidth: '400px',
    position: 'relative',
    textAlign: 'center',
    boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
    border: '1px solid rgba(255,255,255,0.25)',
  },
  close: {
    position: 'absolute', top: '16px', right: '16px',
    background: 'none', border: 'none', fontSize: '1.2rem',
    cursor: 'pointer', color: '#ffffff',
  },
  logo: { width: '48px', height: '48px', objectFit: 'contain', marginBottom: '12px' },
  title: { fontSize: '1.4rem', fontWeight: 800, color: '#ffffff', margin: '0 0 4px' },
  sub: { fontSize: '0.9rem', color: 'rgba(255,255,255,0.8)', margin: '0 0 20px' },
  error: { color: '#fca5a5', fontSize: '0.85rem', margin: '0 0 12px' },
  form: { display: 'flex', flexDirection: 'column', gap: '12px' },
  input: {
    width: '100%', padding: '12px 14px', borderRadius: '10px',
    border: '1px solid rgba(255,255,255,0.3)',
    background: 'rgba(255,255,255,0.15)',
    color: '#ffffff', fontSize: '0.95rem',
    outline: 'none', fontFamily: 'inherit',
    WebkitTextFillColor: '#ffffff', boxSizing: 'border-box',
  },
  row: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' },
  forgot: {
    background: 'none', border: 'none', color: '#ffffff',
    fontSize: '0.85rem', cursor: 'pointer', textAlign: 'right', padding: 0,
  },
  submit: {
    background: '#4682B4', color: '#fff', border: 'none',
    borderRadius: '10px', padding: '13px', fontSize: '1rem',
    fontWeight: 700, cursor: 'pointer', width: '100%',
  },
  switch: { marginTop: '16px', fontSize: '0.9rem', color: '#ffffff' },
  link: { color: '#ffffff', cursor: 'pointer', fontWeight: 700, textDecoration: 'underline' },
  googleBtn: {
    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
    gap: '10px', padding: '12px', borderRadius: '10px',
    border: '1px solid rgba(255,255,255,0.3)',
    background: 'rgba(255,255,255,0.15)',
    color: '#ffffff', fontSize: '0.9rem', fontWeight: 600,
    cursor: 'pointer', fontFamily: 'inherit',
  },
  divider: {
    display: 'flex', alignItems: 'center',
    margin: '4px 0', borderTop: '1px solid rgba(255,255,255,0.2)',
    position: 'relative', height: '20px',
  },
  dividerSpan: {
    position: 'absolute', left: '50%', transform: 'translateX(-50%)',
    background: 'transparent', padding: '0 10px',
    color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem',
  },
};

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundImage: `linear-gradient(rgba(0,0,0,0.45), rgba(0,0,0,0.45)), url(${bgImage})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    padding: '24px',
  },
  card: {
    background: 'rgba(255,255,255,0.1)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    borderRadius: '24px',
    padding: '48px 60px',
    maxWidth: '720px',
    width: '100%',
    textAlign: 'center',
    boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
    border: '1px solid rgba(255,255,255,0.25)',
  },
  logo: { width: '64px', height: '64px', objectFit: 'contain', marginBottom: '16px' },
  title: {
    fontSize: '1.8rem', fontWeight: 800, color: '#ffffff',
    margin: '0 0 8px', textShadow: '0 2px 8px rgba(0,0,0,0.4)',
  },
  subtitle: { fontSize: '1rem', color: '#ffffff', margin: '0 0 32px', lineHeight: 1.5 },
  btnGroup: { display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' },
  primary: {
    background: '#4682B4', color: '#fff', border: 'none',
    borderRadius: '12px', padding: '14px', fontSize: '1rem',
    fontWeight: 700, cursor: 'pointer',
  },
  secondary: {
    background: '#f1f5f9', color: '#1e293b', border: '1px solid #e2e8f0',
    borderRadius: '12px', padding: '14px', fontSize: '1rem',
    fontWeight: 600, cursor: 'pointer',
  },
  outline: {
    background: 'transparent', color: '#ffffff', border: '2px solid #ffffff',
    borderRadius: '12px', padding: '13px', fontSize: '1rem',
    fontWeight: 600, cursor: 'pointer',
  },
  summary: {
    background: 'rgba(255,255,255,0.08)', borderRadius: '12px',
    padding: '20px', textAlign: 'left', border: '1px solid rgba(255,255,255,0.2)',
  },
  feature: {
    margin: '0 0 10px', fontSize: '0.9rem', color: '#ffffff',
    lineHeight: 1.6, textShadow: '0 1px 4px rgba(0,0,0,0.4)',
  },
};
