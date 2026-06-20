import { useState } from 'react';
import { api } from '../api';

export function Auth({ onAuth }) {
  const [tab, setTab] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      let res;
      if (tab === 'login') {
        res = await api.login({ email: form.email, password: form.password });
        if (res?.token) {
          localStorage.setItem('token', res.token);
          const me = await api.me();
          onAuth(me);
        } else {
          setError('Unexpected response from server.');
        }
      } else {
        await api.register({ name: form.name, email: form.email, password: form.password });
        // register doesn't return a token — auto-login immediately after
        res = await api.login({ email: form.email, password: form.password });
        if (res?.token) {
          localStorage.setItem('token', res.token);
          const me = await api.me();
          onAuth(me);
        } else {
          setError('Registration succeeded but login failed.');
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-logo">Dev<span>Board</span></div>
        <p className="auth-subtitle">Your personal dev workspace</p>

        <div className="auth-tabs">
          <button className={`auth-tab ${tab === 'login' ? 'active' : ''}`} onClick={() => { setTab('login'); setError(''); }}>
            Sign in
          </button>
          <button className={`auth-tab ${tab === 'register' ? 'active' : ''}`} onClick={() => { setTab('register'); setError(''); }}>
            Register
          </button>
        </div>

        {error && <div className="error-banner">{error}</div>}

        <form onSubmit={submit}>
          {tab === 'register' && (
            <div className="field">
              <label>Username</label>
              <input value={form.name} onChange={set('name')} placeholder="Your name" required autoFocus />
            </div>
          )}
          <div className="field">
            <label>Email</label>
            <input type="email" value={form.email} onChange={set('email')} placeholder="you@example.com" required autoFocus={tab === 'login'} />
          </div>
          <div className="field">
            <label>Password</label>
            <input type="password" value={form.password} onChange={set('password')} placeholder="••••••••" required />
          </div>
          <button className="btn btn-primary" type="submit" disabled={loading} style={{ marginTop: 6 }}>
            {loading ? <span className="spinner" /> : null}
            {loading ? 'Working…' : tab === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </form>
      </div>
    </div>
  );
}
