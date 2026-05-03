import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';

function StatCard({ value, label, color = 'var(--accent)', sub }) {
  return (
    <div className="card" style={{ padding: '20px 24px' }}>
      <div style={{ fontSize: '2.2rem', fontFamily: 'var(--font-display)', fontWeight: 800, color, lineHeight: 1, marginBottom: 4 }}>{value}</div>
      <div style={{ fontSize: '0.8rem', color: 'var(--text2)', fontWeight: 500 }}>{label}</div>
      {sub && <div style={{ fontSize: '0.75rem', color: 'var(--text3)', marginTop: 3 }}>{sub}</div>}
    </div>
  );
}

function formatDue(d) {
  if (!d) return null;
  const date = new Date(d);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/dashboard')
      .then(res => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Layout><div className="page-loader"><div className="loader" style={{ width: 32, height: 32 }} /></div></Layout>;

  const stats = data?.stats || {};
  const statusMap = Object.fromEntries((data?.statusBreakdown || []).map(r => [r.status, r.count]));

  return (
    <Layout>
      <div style={{ padding: '32px 36px', maxWidth: 1100 }}>
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: '1.6rem', marginBottom: 4 }}>Good {getGreeting()}, {user?.name?.split(' ')[0]} 👋</h1>
          <p style={{ color: 'var(--text2)', fontSize: '0.875rem' }}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
        </div>

        {/* Stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
          <StatCard value={stats.total_projects || 0} label="Projects" color="var(--text)" />
          <StatCard value={stats.my_open_tasks || 0} label="My open tasks" color="var(--blue)" />
          <StatCard value={stats.in_progress_count || 0} label="In progress" color="var(--amber)" />
          <StatCard value={stats.overdue_count || 0} label="Overdue" color={stats.overdue_count > 0 ? 'var(--red)' : 'var(--text3)'} sub={stats.overdue_count > 0 ? 'Needs attention' : ''} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          {/* My Tasks */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <h2 style={{ fontSize: '1rem', color: 'var(--text)' }}>My tasks</h2>
              <span style={{ fontSize: '0.78rem', color: 'var(--text3)', fontFamily: 'var(--font-mono)' }}>{data?.myTasks?.length || 0} open</span>
            </div>
            {data?.myTasks?.length === 0 ? (
              <div className="empty-state card" style={{ padding: '32px 20px' }}>
                <div className="empty-state-icon">✓</div>
                <h3>All caught up!</h3>
                <p>No tasks assigned to you right now.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {data.myTasks.map(task => (
                  <div key={task.id} className="card" style={{ padding: '14px 16px', cursor: 'pointer', transition: 'border-color 0.15s' }}
                    onClick={() => navigate(`/projects/${task.project_id}`)}
                    onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border2)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.title}</div>
                        <div style={{ fontSize: '0.76rem', color: 'var(--text3)', marginTop: 2 }}>{task.project_name}</div>
                      </div>
                      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                        <span className={`badge badge-${task.priority}`}>{task.priority}</span>
                        {task.due_date && (
                          <span style={{ fontSize: '0.75rem', color: new Date(task.due_date) < new Date() ? 'var(--red)' : 'var(--text3)', fontFamily: 'var(--font-mono)' }}>
                            {formatDue(task.due_date)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Overdue Tasks */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <h2 style={{ fontSize: '1rem', color: 'var(--text)' }}>
                Overdue <span style={{ color: 'var(--red)' }}>({data?.overdue?.length || 0})</span>
              </h2>
            </div>
            {data?.overdue?.length === 0 ? (
              <div className="empty-state card" style={{ padding: '32px 20px' }}>
                <div className="empty-state-icon">🎉</div>
                <h3>No overdue tasks</h3>
                <p>Everything is on track.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {data.overdue.map(task => (
                  <div key={task.id} className="card" style={{ padding: '14px 16px', borderColor: 'rgba(255,77,109,0.2)', cursor: 'pointer' }}
                    onClick={() => navigate(`/projects/${task.project_id}`)}
                    onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255,77,109,0.4)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,77,109,0.2)'}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--red)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.title}</div>
                        <div style={{ fontSize: '0.76rem', color: 'var(--text3)', marginTop: 2 }}>{task.project_name} · {task.assigned_to_name}</div>
                      </div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--red)', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>
                        ⚠ {formatDue(task.due_date)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Project Progress */}
        {data?.projects?.length > 0 && (
          <div style={{ marginTop: 32 }}>
            <h2 style={{ fontSize: '1rem', marginBottom: 14 }}>Project progress</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
              {data.projects.map(p => {
                const progress = p.total_tasks > 0 ? Math.round((p.done_tasks / p.total_tasks) * 100) : 0;
                return (
                  <div key={p.id} className="card" style={{ cursor: 'pointer', padding: '16px 18px' }}
                    onClick={() => navigate(`/projects/${p.id}`)}
                    onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border2)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{p.name}</div>
                      <div style={{ display: 'flex', gap: 6, flexShrink: 0, marginLeft: 8 }}>
                        <span className={`badge badge-${p.my_role}`}>{p.my_role}</span>
                      </div>
                    </div>
                    <div className="progress-bar" style={{ marginBottom: 8 }}>
                      <div className="progress-fill" style={{ width: `${progress}%` }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', color: 'var(--text3)', fontFamily: 'var(--font-mono)' }}>
                      <span>{progress}% complete</span>
                      <span>{p.done_tasks}/{p.total_tasks} tasks{p.overdue_tasks > 0 ? ` · ${p.overdue_tasks} overdue` : ''}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}
