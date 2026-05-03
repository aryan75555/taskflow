const router = require('express').Router();
const { pool } = require('../db');
const { authenticate } = require('../middleware/auth');

// GET /api/dashboard
router.get('/', authenticate, async (req, res) => {
  const userId = req.user.id;
  try {
    // Tasks assigned to me
    const myTasks = await pool.query(`
      SELECT t.*, p.name AS project_name, u.name AS assigned_to_name
      FROM tasks t
      JOIN projects p ON p.id = t.project_id
      JOIN project_members pm ON pm.project_id = t.project_id AND pm.user_id = $1
      LEFT JOIN users u ON u.id = t.assigned_to
      WHERE t.assigned_to = $1 AND t.status != 'done'
      ORDER BY t.due_date NULLS LAST, t.priority DESC
      LIMIT 10
    `, [userId]);

    // Overdue tasks (due_date in past, not done)
    const overdue = await pool.query(`
      SELECT t.*, p.name AS project_name, u.name AS assigned_to_name
      FROM tasks t
      JOIN projects p ON p.id = t.project_id
      JOIN project_members pm ON pm.project_id = t.project_id AND pm.user_id = $1
      LEFT JOIN users u ON u.id = t.assigned_to
      WHERE t.due_date < CURRENT_DATE AND t.status != 'done'
      ORDER BY t.due_date ASC
      LIMIT 10
    `, [userId]);

    // Projects summary
    const projects = await pool.query(`
      SELECT p.id, p.name, p.status, pm.role AS my_role,
        COUNT(DISTINCT t.id) AS total_tasks,
        COUNT(DISTINCT CASE WHEN t.status = 'done' THEN t.id END) AS done_tasks,
        COUNT(DISTINCT CASE WHEN t.status = 'in_progress' THEN t.id END) AS in_progress_tasks,
        COUNT(DISTINCT CASE WHEN t.due_date < CURRENT_DATE AND t.status != 'done' THEN t.id END) AS overdue_tasks
      FROM projects p
      JOIN project_members pm ON pm.project_id = p.id AND pm.user_id = $1
      LEFT JOIN tasks t ON t.project_id = p.id
      GROUP BY p.id, p.name, p.status, pm.role
      ORDER BY p.updated_at DESC
    `, [userId]);

    // Summary stats
    const stats = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM project_members WHERE user_id = $1) AS total_projects,
        (SELECT COUNT(*) FROM tasks t JOIN project_members pm ON pm.project_id = t.project_id AND pm.user_id = $1 WHERE t.assigned_to = $1 AND t.status != 'done') AS my_open_tasks,
        (SELECT COUNT(*) FROM tasks t JOIN project_members pm ON pm.project_id = t.project_id AND pm.user_id = $1 WHERE t.due_date < CURRENT_DATE AND t.status != 'done') AS overdue_count,
        (SELECT COUNT(*) FROM tasks t JOIN project_members pm ON pm.project_id = t.project_id AND pm.user_id = $1 WHERE t.status = 'in_progress') AS in_progress_count
    `, [userId]);

    // Task status breakdown
    const statusBreakdown = await pool.query(`
      SELECT t.status, COUNT(*) AS count
      FROM tasks t
      JOIN project_members pm ON pm.project_id = t.project_id AND pm.user_id = $1
      GROUP BY t.status
    `, [userId]);

    res.json({
      stats: stats.rows[0],
      myTasks: myTasks.rows,
      overdue: overdue.rows,
      projects: projects.rows,
      statusBreakdown: statusBreakdown.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
