const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// GET /api/settings/test-config?exam_type=selective
// Public — anyone can read defaults
router.get('/test-config', (req, res) => {
  const examType = req.query.exam_type || 'selective';
  const config = db.prepare('SELECT * FROM test_config WHERE exam_type = ?').get(examType);
  if (!config) {
    return res.json({ exam_type: examType, default_questions: 20, default_time_minutes: 30 });
  }
  res.json(config);
});

// PUT /api/settings/test-config — admin only
router.put('/test-config', authenticateToken, requireAdmin, (req, res) => {
  const { exam_type, default_questions, default_time_minutes } = req.body;

  if (!['selective', 'oc'].includes(exam_type)) {
    return res.status(400).json({ error: 'Invalid exam type.' });
  }
  if (!Number.isInteger(default_questions) || default_questions < 1 || default_questions > 100) {
    return res.status(400).json({ error: 'Questions must be 1-100.' });
  }
  if (!Number.isInteger(default_time_minutes) || default_time_minutes < 1 || default_time_minutes > 180) {
    return res.status(400).json({ error: 'Time must be 1-180 minutes.' });
  }

  db.prepare(
    'UPDATE test_config SET default_questions = ?, default_time_minutes = ?, updated_at = CURRENT_TIMESTAMP WHERE exam_type = ?'
  ).run(default_questions, default_time_minutes, exam_type);

  const config = db.prepare('SELECT * FROM test_config WHERE exam_type = ?').get(exam_type);
  res.json(config);
});

module.exports = router;
