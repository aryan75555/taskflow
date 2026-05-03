const jwt = require('jsonwebtoken');
const { pool } = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';

const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const result = await pool.query('SELECT id, name, email, role FROM users WHERE id = $1', [decoded.id]);
    if (!result.rows.length) return res.status(401).json({ error: 'User not found' });
    req.user = result.rows[0];
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Check if user is a project admin
const isProjectAdmin = async (req, res, next) => {
  const projectId = req.params.projectId || req.params.id;
  const userId = req.user.id;

  const result = await pool.query(
    `SELECT pm.role FROM project_members pm
     WHERE pm.project_id = $1 AND pm.user_id = $2`,
    [projectId, userId]
  );

  if (!result.rows.length) {
    return res.status(403).json({ error: 'Not a project member' });
  }
  if (result.rows[0].role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Check if user is a project member (any role)
const isProjectMember = async (req, res, next) => {
  const projectId = req.params.projectId || req.params.id;
  const userId = req.user.id;

  const result = await pool.query(
    `SELECT pm.role FROM project_members pm WHERE pm.project_id = $1 AND pm.user_id = $2`,
    [projectId, userId]
  );

  if (!result.rows.length) {
    return res.status(403).json({ error: 'Not a project member' });
  }
  req.projectRole = result.rows[0].role;
  next();
};

const generateToken = (user) => {
  return jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
};

module.exports = { authenticate, isProjectAdmin, isProjectMember, generateToken };
