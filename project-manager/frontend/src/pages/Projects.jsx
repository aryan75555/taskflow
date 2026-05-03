import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import Layout from '../components/Layout';
import Modal from '../components/Modal';

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/projects')
      .then(res => setProjects(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const createProject = async (e) => {
    e.preventDefault();
    setCreating(true); setError('');
    try {
      const res = await api.post('/projects', form);
      setProjects(p => [res.data, ...p]);
      setShowCreate(false); setForm({ name: '', description: '' });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create project');
    } finally {
      setCreating(false);
    }
  };

  const statusColors = { active: 'var(--accent)', completed: 'var(--blue)', on_hold: 'var(--amber)' };

  return (
    <Layout>
      <div style={{ padding: '32px 36px', maxWidth: 1100 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
          <div>
            <h1 style={{ fontSize: '1.6rem', marginBottom: 4 }}>Projects</h1>
            <p style={{ color: 'var(--text2)', fontSize: '0.875rem' }}>{projects.length} project{projects.length !== 1 ? 's' : ''} you're part of</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            New project
          </button>
        </div>

        {loading ? (
          <div className="page-loader"><div className="loader" style={{ width: 32, height: 32 }} /></div>
        ) : projects.length === 0 ? (
          <div className="empty-state" style={{ marginTop: 60 }}>
            <div className="empty-state-icon">📁</div>
            <h3>No projects yet</h3>
            <p style={{ marginBottom: 20 }}>Create your first project to get started.</p>
            <button className="btn btn-primary" onClick={() => setShowCreate(true)}>Create project</button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
            {projects.map(p => {
              const progress = p.task_count > 0 ? Math.round((p.done_count / p.task_count) * 100) : 0;
              return (
                <div key={p.id} className="card" style={{ cursor: 'pointer', transition: 'all 0.15s', padding: '22px' }}
                  onClick={() => navigate(`/projects/${p.id}`)}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border2)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = ''; }}
                >
                  {/* Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: statusColors[p.status] || 'var(--text3)', flexShrink: 0 }} />
                      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</h3>
                    </div>
                    <span className={`badge badge-${p.my_role}`} style={{ marginLeft: 8 }}>{p.my_role}</span>
                  </div>

                  {/* Description */}
                  <p style={{ fontSize: '0.82rem', color: 'var(--text3)', marginBottom: 16, lineHeight: 1.5, minHeight: 36, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                    {p.description || 'No description provided.'}
                  </p>

                  {/* Progress */}
                  <div className="progress-bar" style={{ marginBottom: 10 }}>
                    <div className="progress-fill" style={{ width: `${progress}%`, background: statusColors[p.status] || 'var(--accent)' }} />
                  </div>

                  {/* Footer stats */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', color: 'var(--text3)', fontFamily: 'var(--font-mono)' }}>
                    <span>{p.member_count} member{p.member_count !== 1 ? 's' : ''}</span>
                    <span>{progress}% · {p.done_count}/{p.task_count} tasks</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showCreate && (
        <Modal title="New project" onClose={() => { setShowCreate(false); setError(''); }}>
          <form onSubmit={createProject} className="modal-form">
            {error && <div className="alert alert-error">{error}</div>}
            <div className="form-group">
              <label>Project name *</label>
              <input className="input" placeholder="e.g. Website Redesign" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required autoFocus />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea className="textarea" placeholder="What is this project about?" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setShowCreate(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={creating}>
                {creating ? <span className="loader" /> : 'Create project'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </Layout>
  );
}
