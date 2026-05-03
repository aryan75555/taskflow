const router = require('express').Router();
const { body, validationResult } = require('express-validator');
const { pool } = require('../db');
const { authenticate, isProjectAdmin, isProjectMember } = require('../middleware/auth');

// GET /api/projects — list projects the user belongs to
router.get('/', authenticate, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.*, u.name AS owner_name, pm.role AS my_role,
        (SELECT COUNT(*) FROM project_members WHERE project_id = p.id) AS member_count,
        (SELECT COUNT(*) FROM tasks WHERE project_id = p.id) AS task_count,
        (SELECT COUNT(*) FROM tasks WHERE project_id = p.id AND status = 'done') AS done_count
      FROM projects p
      JOIN project_members pm ON pm.project_id = p.id AND pm.user_id = $1
      LEFT JOIN users u ON u.id = p.owner_id
      ORDER BY p.updated_at DESC
    `, [req.user.id]);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/projects — create a project (any authenticated user becomes admin)
router.post('/', authenticate, [
  body('name').trim().notEmpty().withMessage('Project name is required'),
  body('description').optional().trim(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { name, description } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const proj = await client.query(
      'INSERT INTO projects (name, description, owner_id) VALUES ($1, $2, $3) RETURNING *',
      [name, description || '', req.user.id]
    );
    const project = proj.rows[0];
    // Creator becomes project admin
    await client.query(
      'INSERT INTO project_members (project_id, user_id, role) VALUES ($1, $2, $3)',
      [project.id, req.user.id, 'admin']
    );
    await client.query('COMMIT');
    res.status(201).json({ ...project, my_role: 'admin' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
});

// GET /api/projects/:id
router.get('/:id', authenticate, isProjectMember, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.*, u.name AS owner_name, $2::text AS my_role,
        (SELECT COUNT(*) FROM project_members WHERE project_id = p.id) AS member_count,
        (SELECT COUNT(*) FROM tasks WHERE project_id = p.id) AS task_count
      FROM projects p
      LEFT JOIN users u ON u.id = p.owner_id
      WHERE p.id = $1
    `, [req.params.id, req.projectRole]);
    if (!result.rows.length) return res.status(404).json({ error: 'Project not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/projects/:id — update project (admin only)
router.put('/:id', authenticate, isProjectAdmin, [
  body('name').optional().trim().notEmpty(),
  body('status').optional().isIn(['active', 'completed', 'on_hold']),
], async (req, res) => {
  const { name, description, status } = req.body;
  try {
    const result = await pool.query(`
      UPDATE projects SET
        name = COALESCE($1, name),
        description = COALESCE($2, description),
        status = COALESCE($3, status),
        updated_at = NOW()
      WHERE id = $4 RETURNING *
    `, [name, description, status, req.params.id]);
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/projects/:id (admin only)
router.delete('/:id', authenticate, isProjectAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM projects WHERE id = $1', [req.params.id]);
    res.json({ message: 'Project deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/projects/:id/members
router.get('/:id/members', authenticate, isProjectMember, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT u.id, u.name, u.email, u.role AS system_role, pm.role AS project_role, pm.joined_at
      FROM project_members pm
      JOIN users u ON u.id = pm.user_id
      WHERE pm.project_id = $1
      ORDER BY pm.role DESC, u.name
    `, [req.params.id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/projects/:id/members — add member (admin only)
router.post('/:id/members', authenticate, isProjectAdmin, [
  body('userId').isInt().withMessage('Valid user ID required'),
  body('role').isIn(['admin', 'member']).withMessage('Role must be admin or member'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { userId, role } = req.body;
  try {
    await pool.query(
      'INSERT INTO project_members (project_id, user_id, role) VALUES ($1, $2, $3) ON CONFLICT (project_id, user_id) DO UPDATE SET role = $3',
      [req.params.id, userId, role]
    );
    const result = await pool.query(
      'SELECT u.id, u.name, u.email, pm.role AS project_role FROM project_members pm JOIN users u ON u.id = pm.user_id WHERE pm.project_id = $1 AND pm.user_id = $2',
      [req.params.id, userId]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/projects/:id/members/:userId (admin only)
router.delete('/:id/members/:userId', authenticate, isProjectAdmin, async (req, res) => {
  // Prevent removing yourself if you're the only admin
  const admins = await pool.query(
    'SELECT COUNT(*) FROM project_members WHERE project_id = $1 AND role = $2',
    [req.params.id, 'admin']
  );
  if (parseInt(admins.rows[0].count) <= 1 && req.params.userId == req.user.id) {
    return res.status(400).json({ error: 'Cannot remove the only admin' });
  }
  try {
    await pool.query(
      'DELETE FROM project_members WHERE project_id = $1 AND user_id = $2',
      [req.params.id, req.params.userId]
    );
    res.json({ message: 'Member removed' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/projects/:id/tasks
router.get('/:id/tasks', authenticate, isProjectMember, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT t.*, 
        u.name AS assigned_to_name, u.email AS assigned_to_email,
        c.name AS created_by_name
      FROM tasks t
      LEFT JOIN users u ON u.id = t.assigned_to
      LEFT JOIN users c ON c.id = t.created_by
      WHERE t.project_id = $1
      ORDER BY
        CASE t.priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END,
        t.due_date NULLS LAST,
        t.created_at DESC
    `, [req.params.id]);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/projects/:id/tasks (admin only)
router.post('/:id/tasks', authenticate, isProjectAdmin, [
  body('title').trim().notEmpty().withMessage('Task title required'),
  body('priority').optional().isIn(['low', 'medium', 'high']),
  body('status').optional().isIn(['todo', 'in_progress', 'done']),
  body('due_date').optional().isDate(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { title, description, priority, status, assigned_to, due_date } = req.body;
  try {
    const result = await pool.query(`
      INSERT INTO tasks (project_id, title, description, priority, status, assigned_to, due_date, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *
    `, [req.params.id, title, description || '', priority || 'medium', status || 'todo', assigned_to || null, due_date || null, req.user.id]);

    const task = result.rows[0];
    // Fetch with user info
    const full = await pool.query(`
      SELECT t.*, u.name AS assigned_to_name, u.email AS assigned_to_email
      FROM tasks t LEFT JOIN users u ON u.id = t.assigned_to WHERE t.id = $1
    `, [task.id]);
    res.status(201).json(full.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
