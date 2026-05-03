import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handle = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res = await api.post('/auth/login', form);
      login(res.data.token, res.data.user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--bg)' }}>
      {/* Left panel */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 32px' }}>
        <div style={{ width: '100%', maxWidth: 380 }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 48 }}>
            <div style={{ width: 36, height: 36, background: 'var(--accent)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.3rem', color: 'var(--text)' }}>Taskflow</span>
          </div>

          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 800, marginBottom: 8, lineHeight: 1.15 }}>
            Welcome back
          </h1>
          <p style={{ color: 'var(--text2)', marginBottom: 32, fontSize: '0.9rem' }}>Sign in to manage your projects and tasks.</p>

          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-group">
              <label>Email address</label>
              <input className="input" type="email" name="email" placeholder="you@example.com" value={form.email} onChange={handle} required autoComplete="email" />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input className="input" type="password" name="password" placeholder="••••••••" value={form.password} onChange={handle} required autoComplete="current-password" />
            </div>
            <button className="btn btn-primary" type="submit" disabled={loading} style={{ marginTop: 8, padding: '11px', justifyContent: 'center', fontSize: '0.95rem' }}>
              {loading ? <span className="loader" /> : 'Sign in'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 24, fontSize: '0.875rem', color: 'var(--text3)' }}>
            Don't have an account?{' '}
            <Link to="/signup" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 500 }}>Create one</Link>
          </p>

          {/* Demo hint */}
          <div style={{ marginTop: 32, padding: '14px 16px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text3)', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Demo Accounts</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text2)', fontFamily: 'var(--font-mono)', lineHeight: 1.8 }}>
              admin@demo.com / demo123<br/>
              member@demo.com / demo123
            </div>
          </div>
        </div>
      </div>

      {/* Right decorative panel */}
      <div style={{
        width: 420, background: 'var(--bg2)', borderLeft: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: 48,
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Background decoration */}
        <div style={{ position: 'absolute', top: -60, right: -60, width: 240, height: 240, borderRadius: '50%', background: 'var(--accent-dim)', filter: 'blur(60px)' }} />
        <div style={{ position: 'absolute', bottom: 80, left: -40, width: 160, height: 160, borderRadius: '50%', background: 'rgba(245,166,35,0.06)', filter: 'blur(40px)' }} />

        <div style={{ position: 'relative' }}>
          {[
            { icon: '⚡', title: 'Real-time tracking', desc: 'Monitor task progress with live status updates across your team.' },
            { icon: '🔐', title: 'Role-based access', desc: 'Admins manage projects; members focus on execution.' },
            { icon: '📊', title: 'Dashboard insights', desc: 'See overdue tasks, progress, and team workload at a glance.' },
          ].map((f, i) => (
            <div key={i} style={{ display: 'flex', gap: 14, marginBottom: 28 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--surface)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0 }}>{f.icon}</div>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.95rem', marginBottom: 4 }}>{f.title}</div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text2)', lineHeight: 1.5 }}>{f.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
