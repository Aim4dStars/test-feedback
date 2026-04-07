const express = require('express');
const router = express.Router();
const { db } = require('../db');

// Get all questions, optionally filtered by subject
router.get('/', (req, res) => {
  const { subject } = req.query;
  let questions;
  if (subject) {
    questions = db.prepare('SELECT * FROM questions WHERE subject = ? ORDER BY id').all(subject);
  } else {
    questions = db.prepare('SELECT * FROM questions ORDER BY subject, id').all();
  }
  res.json(questions);
});

// Get question count per subject
router.get('/counts', (req, res) => {
  const counts = db.prepare(`
    SELECT subject, COUNT(*) as count FROM questions GROUP BY subject
  `).all();

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
