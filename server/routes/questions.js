const express = require('express');
const router = express.Router();
const { db } = require('../db');

// Get all questions, optionally filtered by subject and exam_type
router.get('/', (req, res) => {
  const { subject } = req.query;
  const exam_type = req.query.exam_type || 'selective';
  let questions;
  if (subject) {
    questions = db.prepare('SELECT * FROM questions WHERE exam_type = ? AND subject = ? ORDER BY id').all(exam_type, subject);
  } else {
    questions = db.prepare('SELECT * FROM questions WHERE exam_type = ? ORDER BY subject, id').all(exam_type);
  }
  res.json(questions);
});

// Get question count per subject
router.get('/counts', (req, res) => {
  const exam_type = req.query.exam_type || 'selective';
  const counts = db.prepare(`
    SELECT subject, COUNT(*) as count FROM questions WHERE exam_type = ? GROUP BY subject
  `).all(exam_type);

  const result = { maths: 0, reading: 0, thinking: 0, writing: 0 };
  counts.forEach(c => { result[c.subject] = c.count; });
  res.json(result);
});

// Delete a question
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  db.prepare('DELETE FROM questions WHERE id = ?').run(id);
  res.json({ success: true });
});

module.exports = router;
