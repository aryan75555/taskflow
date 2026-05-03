import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/client';
import Layout from '../components/Layout';
import Modal from '../components/Modal';
import TaskCard from '../components/TaskCard';

const STATUS_COLS = [
  { key: 'todo', label: 'To do' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'done', label: 'Done' },
];

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [tab, setTab] = useState('tasks');
  const [loading, setLoading] = useState(true);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [taskForm, setTaskForm] = useState({ title: '', description: '', priority: 'medium', status: 'todo', assigned_to: '', due_date: '' });
  const [memberForm, setMemberForm] = useState({ userId: '', role: 'member' });
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');

  const isAdmin = project?.my_role === 'admin';

  useEffect(() => {
    const load = async () => {
      try {
        const [pRes, tRes, mRes, uRes] = await Promise.all([
          api.get(`/projects/${id}`),
          api.get(`/projects/${id}/tasks`),
          api.get(`/projects/${id}/members`),
          api.get('/auth/users'),
        ]);
        setProject(pRes.data);
        setTasks(tRes.data);
        setMembers(mRes.data);
        setAllUsers(uRes.data);
        setEditForm({ name: pRes.data.name, description: pRes.data.description, status: pRes.data.status });
      } catch (err) {
        if (err.response?.status === 403 || err.response?.status === 404) navigate('/projects');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const createTask = async (e) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      const payload = { ...taskForm, assigned_to: taskForm.assigned_to || null, due_date: taskForm.due_date || null };
      const res = await api.post(`/projects/${id}/tasks`, payload);
      setTasks(t => [...t, res.data]);
      setShowTaskModal(false); setTaskForm({ title: '', description: '', priority: 'medium', status: 'todo', assigned_to: '', due_date: '' });
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.errors?.map(e => e.msg).join(', ') || 'Failed to create task');
    } finally { setSaving(false); }
  };

  const updateTask = (updated) => setTasks(t => t.map(x => x.id === updated.id ? updated : x));
  const deleteTask = async (taskId) => {
    if (!confirm('Delete this task?')) return;
    await api.delete(`/tasks/${taskId}`);
    setTasks(t => t.filter(x => x.id !== taskId));
  };

  const addMember = async (e) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      const res = await api.post(`/projects/${id}/members`, memberForm);
      setMembers(m => { const f = m.filter(x => x.id !== res.data.id); return [...f, res.data]; });
      setShowMemberModal(false); setMemberForm({ userId: '', role: 'member' });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add member');
    } finally { setSaving(false); }
  };

  const removeMember = async (userId) => {
    if (!confirm('Remove this member?')) return;
    await api.delete(`/projects/${id}/members/${userId}`);
    setMembers(m => m.filter(x => x.id !== userId));
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.put(`/projects/${id}`, editForm);
      setProject(p => ({ ...p, ...res.data }));
      setShowEditModal(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update');
    } finally { setSaving(false); }
  };

  const deleteProject = async () => {
    if (!confirm('Delete this project and all its tasks? This cannot be undone.')) return;
    await api.delete(`/projects/${id}`);
    navigate('/projects');
  };

  const filteredTasks = filter === 'all' ? tasks : filter === 'mine' ? tasks.filter(t => t.assigned_to === project?.owner_id) : tasks.filter(t => t.status === filter);
  const nonMembers = allUsers.filter(u => !members.find(m => m.id === u.id));

  if (loading) return <Layout><div className="page-loader"><div className="loader" style={{ width: 32, height: 32 }} /></div></Layout>;

  return (
    <Layout>
      <div style={{ padding: '32px 36px', maxWidth: 1200 }}>
        {/* Project header */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 8 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <button onClick={() => navigate('/projects')} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: '0.8rem', padding: 0 }}>
                  ← Projects
                </button>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <h1 style={{ fontSize: '1.6rem' }}>{project?.name}</h1>
                <span className={`badge badge-${project?.status}`}>{project?.status?.replace('_', ' ')}</span>
                <span className={`badge badge-${project?.my_role}`}>{project?.my_role}</span>
              </div>
              {project?.description && <p style={{ color: 'var(--text2)', fontSize: '0.875rem', marginTop: 4 }}>{project.description}</p>}
            </div>
            {isAdmin && (
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                <button className="btn btn-ghost btn-sm" onClick={() => setShowEditModal(true)}>Edit</button>
                <button className="btn btn-danger btn-sm" onClick={deleteProject}>Delete</button>
              </div>
            )}
          </div>
          {/* Stats */}
          <div style={{ display: 'flex', gap: 20, fontSize: '0.8rem', color: 'var(--text3)', fontFamily: 'var(--font-mono)' }}>
            <span>{tasks.length} tasks</span>
            <span>{tasks.filter(t => t.status === 'done').length} done</span>
            <span>{tasks.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'done').length} overdue</span>
            <span>{members.length} members</span>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 2, marginBottom: 24, borderBottom: '1px solid var(--border)', paddingBottom: 0 }}>
          {['tasks', 'members'].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              background: 'none', border: 'none', cursor: 'pointer', padding: '8px 16px',
              fontSize: '0.875rem', fontWeight: 500, color: tab === t ? 'var(--accent)' : 'var(--text2)',
              borderBottom: tab === t ? '2px solid var(--accent)' : '2px solid transparent',
              marginBottom: '-1px', transition: 'color 0.15s', textTransform: 'capitalize',
            }}>
              {t} {t === 'tasks' ? `(${tasks.length})` : `(${members.length})`}
            </button>
          ))}
        </div>

        {/* TASKS TAB */}
        {tab === 'tasks' && (
          <div>
            {/* Toolbar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, gap: 12 }}>
              <div style={{ display: 'flex', gap: 6 }}>
                {['all', 'todo', 'in_progress', 'done'].map(f => (
                  <button key={f} onClick={() => setFilter(f)} className="btn btn-ghost btn-sm" style={{
                    color: filter === f ? 'var(--accent)' : 'var(--text2)',
                    borderColor: filter === f ? 'var(--accent)' : 'var(--border)',
                    background: filter === f ? 'var(--accent-dim)' : 'transparent',
                    fontSize: '0.78rem',
                  }}>
                    {f.replace('_', ' ')}
                  </button>
                ))}
              </div>
              {isAdmin && (
                <button className="btn btn-primary btn-sm" onClick={() => setShowTaskModal(true)}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  Add task
                </button>
              )}
            </div>

            {/* Kanban columns */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
              {STATUS_COLS.map(col => {
                const colTasks = filteredTasks.filter(t => t.status === col.key);
                return (
                  <div key={col.key}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                      <span className={`badge badge-${col.key}`}>{col.label}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text3)', fontFamily: 'var(--font-mono)' }}>{colTasks.length}</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minHeight: 80 }}>
                      {colTasks.length === 0 ? (
                        <div style={{ padding: '24px 16px', textAlign: 'center', border: '1px dashed var(--border)', borderRadius: 'var(--radius)', color: 'var(--text3)', fontSize: '0.8rem' }}>
                          No tasks
                        </div>
                      ) : colTasks.map(task => (
                        <TaskCard key={task.id} task={task} projectRole={project?.my_role} onUpdate={updateTask} onDelete={deleteTask} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* MEMBERS TAB */}
        {tab === 'members' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
              {isAdmin && (
                <button className="btn btn-primary btn-sm" onClick={() => setShowMemberModal(true)}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  Add member
                </button>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {members.map(m => (
                <div key={m.id} className="card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'var(--surface2)', border: '1px solid var(--border2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'var(--accent)' }}>
                      {m.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{m.name}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text3)' }}>{m.email}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span className={`badge badge-${m.project_role}`}>{m.project_role}</span>
                    {isAdmin && (
                      <button className="btn btn-danger btn-sm" onClick={() => removeMember(m.id)} style={{ padding: '3px 8px' }}>Remove</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Create Task Modal */}
      {showTaskModal && (
        <Modal title="Add task" onClose={() => { setShowTaskModal(false); setError(''); }}>
          <form onSubmit={createTask} className="modal-form">
            {error && <div className="alert alert-error">{error}</div>}
            <div className="form-group">
              <label>Title *</label>
              <input className="input" placeholder="Task title" value={taskForm.title} onChange={e => setTaskForm(f => ({ ...f, title: e.target.value }))} required autoFocus />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea className="textarea" placeholder="Optional details..." value={taskForm.description} onChange={e => setTaskForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Priority</label>
                <select className="select" value={taskForm.priority} onChange={e => setTaskForm(f => ({ ...f, priority: e.target.value }))}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div className="form-group">
                <label>Status</label>
                <select className="select" value={taskForm.status} onChange={e => setTaskForm(f => ({ ...f, status: e.target.value }))}>
                  <option value="todo">To do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="done">Done</option>
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Assign to</label>
                <select className="select" value={taskForm.assigned_to} onChange={e => setTaskForm(f => ({ ...f, assigned_to: e.target.value }))}>
                  <option value="">Unassigned</option>
                  {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Due date</label>
                <input className="input" type="date" value={taskForm.due_date} onChange={e => setTaskForm(f => ({ ...f, due_date: e.target.value }))} />
              </div>
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setShowTaskModal(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? <span className="loader" /> : 'Create task'}</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Add Member Modal */}
      {showMemberModal && (
        <Modal title="Add member" onClose={() => { setShowMemberModal(false); setError(''); }}>
          <form onSubmit={addMember} className="modal-form">
            {error && <div className="alert alert-error">{error}</div>}
            <div className="form-group">
              <label>Select user</label>
              <select className="select" value={memberForm.userId} onChange={e => setMemberForm(f => ({ ...f, userId: e.target.value }))} required>
                <option value="">Choose a user...</option>
                {nonMembers.map(u => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Role</label>
              <select className="select" value={memberForm.role} onChange={e => setMemberForm(f => ({ ...f, role: e.target.value }))}>
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setShowMemberModal(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={saving || !memberForm.userId}>{saving ? <span className="loader" /> : 'Add member'}</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit Project Modal */}
      {showEditModal && (
        <Modal title="Edit project" onClose={() => setShowEditModal(false)}>
          <form onSubmit={saveEdit} className="modal-form">
            <div className="form-group">
              <label>Project name</label>
              <input className="input" value={editForm.name || ''} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea className="textarea" value={editForm.description || ''} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="form-group">
              <label>Status</label>
              <select className="select" value={editForm.status || 'active'} onChange={e => setEditForm(f => ({ ...f, status: e.target.value }))}>
                <option value="active">Active</option>
                <option value="on_hold">On Hold</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setShowEditModal(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? <span className="loader" /> : 'Save changes'}</button>
            </div>
          </form>
        </Modal>
      )}
    </Layout>
  );
}
