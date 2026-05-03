import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../contexts/AuthContext';

export default function Signup() {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'member' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handle = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res = await api.post('/auth/register', form);
      login(res.data.token, res.data.user);
      navigate('/dashboard');
    } catch (err) {
      const msgs = err.response?.data?.errors?.map(e => e.msg).join(', ');
      setError(msgs || err.response?.data?.error || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 40 }}>
          <div style={{ width: 36, height: 36, background: 'var(--accent)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.3rem', color: 'var(--text)' }}>Taskflow</span>
        </div>

        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 800, marginBottom: 6 }}>Create account</h1>
        <p style={{ color: 'var(--text2)', marginBottom: 28, fontSize: '0.875rem' }}>Set up your workspace in seconds.</p>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={submit} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label>Full name</label>
            <input className="input" type="text" name="name" placeholder="Jane Smith" value={form.name} onChange={handle} required />
          </div>
          <div className="form-group">
            <label>Email address</label>
            <input className="input" type="email" name="email" placeholder="you@example.com" value={form.email} onChange={handle} required />
          </div>
          <div className="form-group">
            <label>Password <span style={{ color: 'var(--text3)', fontSize: '0.8em' }}>(min. 6 chars)</span></label>
            <input className="input" type="password" name="password" placeholder="••••••••" value={form.password} onChange={handle} required minLength={6} />
          </div>
          <div className="form-group">
            <label>Account role</label>
            <select className="select" name="role" value={form.role} onChange={handle}>
              <option value="member">Member — join and work on projects</option>
              <option value="admin">Admin — create and manage projects</option>
            </select>
          </div>
          <button className="btn btn-primary" type="submit" disabled={loading} style={{ padding: '11px', justifyContent: 'center' }}>
            {loading ? <span className="loader" /> : 'Create account'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: '0.875rem', color: 'var(--text3)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 500 }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
