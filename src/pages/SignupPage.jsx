import React, { useState } from 'react';
import { registerUser } from '../api';
import jarLogo from '../jar.png';
import bgImage from '../start.jpg';
import './auth.css';

export default function SignupPage({ onLogin, onNavigate }) {
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
    // Live validation
    const newErrors = { ...errors };
    if (name === 'email') {
      newErrors.email = value && !emailRegex.test(value) ? 'Enter a valid email (e.g. user@example.com)' : '';
    }
    if (name === 'password') {
      const failed = passwordRules.filter(r => !r.test(value)).map(r => r.msg);
      newErrors.password = failed.length ? `Password needs: ${failed.join(', ')}` : '';
    }
    if (name === 'confirm') {
      newErrors.confirm = value && value !== form.password ? 'Passwords do not match' : '';
    }
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
      onLogin();
    } catch (err) {
      setError(err.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line no-unused-vars
  const googleSignup = async () => {
    // Google signup not implemented yet
    setError('Google signup is not available at this time.');
  };

  return (
    <div style={s.page}>
      <div style={s.card}>
        <img src={jarLogo} alt="logo" style={s.logo} />
        <h2 style={s.title}>Create Account</h2>
        <p style={s.sub}>Start your financial journey today</p>

        <button style={{ ...s.googleBtn, opacity: 0.5, cursor: 'not-allowed' }} disabled title="Google signup is not available at this time.">
          <svg width="18" height="18" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          </svg>
          Sign up with Google
        </button>
        <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', margin: '-8px 0 4px', textAlign: 'center' }}>Google signup is not available at this time.</p>

        <div style={s.divider}><span style={s.dividerText}>or</span></div>

        <form onSubmit={submit} style={s.form}>
          {error && <p style={s.error}>{error}</p>}

          <div style={s.fieldGroup}>
            <input className="field-group" name="name" type="text" placeholder="Full Name" value={form.name} onChange={handle} />
          </div>
          
          <div style={s.fieldGroup}>
            <input className="field-group" name="email" type="email" placeholder="Email (e.g. user@example.com)" value={form.email} onChange={handle} style={{ borderColor: errors.email ? '#ef4444' : '' }} />
            {errors.email && <p style={s.fieldError}>{errors.email}</p>}
          </div>

          <div style={s.fieldRow}>
            <div style={s.fieldGroup}>
              <input className="field-group" name="password" type="password" placeholder="Password" value={form.password} onChange={handle} style={{ borderColor: errors.password ? '#ef4444' : form.password && !errors.password ? '#22c55e' : '' }} />
              {errors.password && <p style={s.fieldError}>{errors.password}</p>}
              {form.password && !errors.password && <p style={s.fieldSuccess}>✓ Password looks good</p>}
            </div>
            <div style={s.fieldGroup}>
              <input className="field-group" name="confirm" type="password" placeholder="Confirm Password" value={form.confirm} onChange={handle} style={{ borderColor: errors.confirm ? '#ef4444' : form.confirm && !errors.confirm ? '#22c55e' : '' }} />
              {errors.confirm && <p style={s.fieldError}>{errors.confirm}</p>}
              {form.confirm && !errors.confirm && form.confirm === form.password && <p style={s.fieldSuccess}>✓ Passwords match</p>}
            </div>
          </div>

          <div style={s.fieldRow}>
            <div style={s.fieldGroup}>
              <select className="field-group" name="gender" value={form.gender} onChange={handle}>
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
            <div style={s.fieldGroup}>
              <label style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)', textAlign: 'left', marginBottom: '4px', display: 'block' }}>🎂 Date of Birth</label>
              <input className="field-group" name="birthday" type="date" value={form.birthday} onChange={handle} />
            </div>
          </div>

          <button type="submit" style={s.submit} disabled={loading}>
            {loading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        <p style={s.switch}>
          Already have an account?{' '}
          <span style={s.link} onClick={() => onNavigate('login')}>Sign in</span>
        </p>
      </div>
    </div>
  );
}

const s = {
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
    padding: '40px 48px',
    maxWidth: '560px',
    width: '100%',
    textAlign: 'center',
    boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
    border: '1px solid rgba(255,255,255,0.25)',
  },
  logo: { width: '56px', height: '56px', objectFit: 'contain', marginBottom: '12px' },
  title: { fontSize: '1.6rem', fontWeight: 800, color: '#ffffff', margin: '0 0 4px', textShadow: '0 2px 8px rgba(0,0,0,0.4)' },
  sub: { fontSize: '0.9rem', color: 'rgba(255,255,255,0.85)', margin: '0 0 24px' },
  googleBtn: {
    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
    gap: '10px', padding: '12px', borderRadius: '12px',
    border: '1px solid rgba(255,255,255,0.3)',
    background: 'rgba(255,255,255,0.15)',
    color: '#ffffff', fontSize: '0.9rem', fontWeight: 600,
    cursor: 'pointer', fontFamily: 'inherit',
  },
  divider: {
    display: 'flex', alignItems: 'center', gap: '12px',
    margin: '20px 0',
    borderTop: '1px solid rgba(255,255,255,0.2)',
    position: 'relative',
  },
  dividerText: {
    position: 'absolute', left: '50%', transform: 'translateX(-50%)',
    background: 'transparent', padding: '0 10px',
    color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem',
  },
  form: { display: 'flex', flexDirection: 'column', gap: '12px' },
  fieldGroup: { marginBottom: '8px' },
  fieldRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' },
  error: { color: '#fca5a5', fontSize: '0.85rem', margin: '0 0 4px' },
  fieldError:   { color: '#fca5a5', fontSize: '0.75rem', margin: '4px 0 0', textAlign: 'left' },
  fieldSuccess: { color: '#86efac', fontSize: '0.75rem', margin: '4px 0 0', textAlign: 'left' },
  submit: {
    width: '100%', padding: '13px', borderRadius: '12px', border: 'none',
    background: '#4682B4', color: '#fff', fontSize: '1rem',
    fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', marginTop: '4px',
  },
  switch: { marginTop: '16px', fontSize: '0.9rem', color: '#ffffff' },
  link: { color: '#ffffff', cursor: 'pointer', fontWeight: 700, textDecoration: 'underline' },
};
