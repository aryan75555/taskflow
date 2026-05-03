const router = require('express').Router();
const { body, validationResult } = require('express-validator');
const { pool } = require('../db');
const { authenticate } = require('../middleware/auth');

// Helper: get user's role in a task's project
const getProjectRole = async (taskId, userId) => {
  const result = await pool.query(`
    SELECT pm.role FROM tasks t
    JOIN project_members pm ON pm.project_id = t.project_id AND pm.user_id = $2
    WHERE t.id = $1
  `, [taskId, userId]);
  return result.rows[0]?.role || null;
};

// GET /api/tasks/:id
router.get('/:id', authenticate, async (req, res) => {
  const role = await getProjectRole(req.params.id, req.user.id);
  if (!role) return res.status(403).json({ error: 'Access denied' });

  try {
    const result = await pool.query(`
      SELECT t.*, 
        u.name AS assigned_to_name, u.email AS assigned_to_email,
        c.name AS created_by_name, p.name AS project_name
      FROM tasks t
      LEFT JOIN users u ON u.id = t.assigned_to
      LEFT JOIN users c ON c.id = t.created_by
      LEFT JOIN projects p ON p.id = t.project_id
      WHERE t.id = $1
    `, [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Task not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/tasks/:id
// Admin: can update all fields
// Member: can only update status (if assigned to them)
router.put('/:id', authenticate, [
  body('title').optional().trim().notEmpty(),
  body('status').optional().isIn(['todo', 'in_progress', 'done']),
  body('priority').optional().isIn(['low', 'medium', 'high']),
  body('due_date').optional({ nullable: true }).isDate(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const role = await getProjectRole(req.params.id, req.user.id);
  if (!role) return res.status(403).json({ error: 'Access denied' });

  // Get current task
  const taskResult = await pool.query('SELECT * FROM tasks WHERE id = $1', [req.params.id]);
  if (!taskResult.rows.length) return res.status(404).json({ error: 'Task not found' });
  const task = taskResult.rows[0];

  const { title, description, status, priority, assigned_to, due_date } = req.body;

  // Members can only update status and only if assigned to them
  if (role === 'member') {
    if (task.assigned_to !== req.user.id) {
      return res.status(403).json({ error: 'You can only update tasks assigned to you' });
    }
    if (title !== undefined || description !== undefined || priority !== undefined || assigned_to !== undefined || due_date !== undefined) {
      return res.status(403).json({ error: 'Members can only update task status' });
    }
  }

  try {
    const result = await pool.query(`
      UPDATE tasks SET
        title = COALESCE($1, title),
        description = COALESCE($2, description),
        status = COALESCE($3, status),
        priority = COALESCE($4, priority),
        assigned_to = CASE WHEN $5::text = 'null' THEN NULL WHEN $5 IS NOT NULL THEN $5::integer ELSE assigned_to END,
        due_date = CASE WHEN $6::text = 'null' THEN NULL WHEN $6 IS NOT NULL THEN $6::date ELSE due_date END,
        updated_at = NOW()
      WHERE id = $7 RETURNING *
    `, [title, description, status, priority, assigned_to === null ? 'null' : assigned_to?.toString(), due_date === null ? 'null' : due_date, req.params.id]);

    const full = await pool.query(`
      SELECT t.*, u.name AS assigned_to_name, u.email AS assigned_to_email, c.name AS created_by_name
      FROM tasks t
      LEFT JOIN users u ON u.id = t.assigned_to
      LEFT JOIN users c ON c.id = t.created_by
      WHERE t.id = $1
    `, [req.params.id]);
    res.json(full.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/tasks/:id (admin only)
router.delete('/:id', authenticate, async (req, res) => {
  const role = await getProjectRole(req.params.id, req.user.id);
  if (role !== 'admin') return res.status(403).json({ error: 'Admin access required' });

  try {
    await pool.query('DELETE FROM tasks WHERE id = $1', [req.params.id]);
    res.json({ message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
