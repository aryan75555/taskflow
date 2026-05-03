import api from '../api/client';

const priorityDot = { high: '#ff4d6d', medium: '#f5a623', low: '#4d6680' };

function formatDate(d) {
  if (!d) return null;
  const date = new Date(d);
  const now = new Date();
  const isOverdue = date < now && date.toDateString() !== now.toDateString();
  return {
    str: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    overdue: isOverdue,
  };
}

export default function TaskCard({ task, onUpdate, onDelete, projectRole }) {
  const isAdmin = projectRole === 'admin';
  const dueInfo = task.due_date ? formatDate(task.due_date) : null;

  const cycleStatus = async () => {
    const next = { todo: 'in_progress', in_progress: 'done', done: 'todo' };
    try {
      const res = await api.put(`/tasks/${task.id}`, { status: next[task.status] });
      onUpdate(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="card" style={{
      padding: '16px', transition: 'border-color 0.15s, transform 0.15s',
      borderColor: task.status === 'done' ? 'rgba(0,200,150,0.2)' : 'var(--border)',
      opacity: task.status === 'done' ? 0.7 : 1,
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border2)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = task.status === 'done' ? 'rgba(0,200,150,0.2)' : 'var(--border)'; e.currentTarget.style.transform = ''; }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, flex: 1, minWidth: 0 }}>
          {/* Priority dot */}
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: priorityDot[task.priority], flexShrink: 0, marginTop: 6 }} title={task.priority} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontWeight: 600, fontSize: '0.9rem', color: 'var(--text)',
              textDecoration: task.status === 'done' ? 'line-through' : 'none',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>{task.title}</div>
            {task.description && (
              <div style={{ fontSize: '0.8rem', color: 'var(--text3)', marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {task.description}
              </div>
            )}
          </div>
        </div>
        <span className={`badge badge-${task.status}`} style={{ flexShrink: 0 }}>
          {task.status.replace('_', ' ')}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {task.assigned_to_name && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.76rem', color: 'var(--text3)' }}>
              <span style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--surface2)', border: '1px solid var(--border2)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 700, color: 'var(--accent)' }}>
                {task.assigned_to_name.charAt(0)}
              </span>
              {task.assigned_to_name.split(' ')[0]}
            </span>
          )}
          {dueInfo && (
            <span style={{ fontSize: '0.76rem', color: dueInfo.overdue ? 'var(--red)' : 'var(--text3)', fontFamily: 'var(--font-mono)' }}>
              {dueInfo.overdue ? '⚠ ' : ''}{dueInfo.str}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', gap: 4 }}>
          <button className="btn btn-ghost btn-sm" onClick={cycleStatus} title="Cycle status" style={{ padding: '3px 8px', fontSize: '0.72rem' }}>
            {task.status === 'todo' ? '▶ Start' : task.status === 'in_progress' ? '✓ Done' : '↩ Reopen'}
          </button>
          {isAdmin && (
            <button className="btn btn-danger btn-sm" onClick={() => onDelete(task.id)} title="Delete task" style={{ padding: '3px 8px' }}>
              ✕
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
