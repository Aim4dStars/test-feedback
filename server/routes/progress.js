const express = require('express');
const router = express.Router();
const { db } = require('../db');

// Get overall progress/stats
router.get('/', (req, res) => {
  const totalTests = db.prepare(`
    SELECT COUNT(*) as count FROM test_sessions WHERE status = 'completed'
  `).get();

  const subjectStats = db.prepare(`
    SELECT
      subject,
      COUNT(*) as tests_taken,
      ROUND(AVG(score * 100.0 / total_questions), 1) as avg_score,
      MAX(score * 100.0 / total_questions) as best_score,
      SUM(time_limit_seconds) as total_time
    FROM test_sessions
    WHERE status = 'completed'
    GROUP BY subject
  `).all();

  const recentTests = db.prepare(`
    SELECT id, subject, score, total_questions,
      ROUND(score * 100.0 / total_questions, 1) as percentage,
      started_at, completed_at
    FROM test_sessions
    WHERE status = 'completed'
    ORDER BY completed_at DESC
    LIMIT 10
  `).all();

  res.json({
    totalTestsCompleted: totalTests.count,
    subjectStats,
    recentTests,
  });
});

// Get progress trend for a specific subject
router.get('/:subject', (req, res) => {
  const { subject } = req.params;

  const trend = db.prepare(`
    SELECT
      id, score, total_questions,
      ROUND(score * 100.0 / total_questions, 1) as percentage,
      started_at, completed_at
    FROM test_sessions
    WHERE subject = ? AND status = 'completed'
    ORDER BY completed_at ASC
  `).all(subject);

  res.json(trend);
});

module.exports = router;
