const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { v4: uuidv4 } = require('uuid');

// Start a new test session
router.post('/start', (req, res) => {
  const { subject, questionCount, timeLimitMinutes } = req.body;

  // Fetch random questions for the subject
  const questions = db.prepare(`
    SELECT * FROM questions WHERE subject = ? ORDER BY RANDOM() LIMIT ?
  `).all(subject, questionCount || 20);

  if (questions.length === 0) {
    return res.status(400).json({ error: 'No questions available for this subject. Please upload a PDF first.' });
  }

  const sessionId = uuidv4();
  const timeLimitSeconds = (timeLimitMinutes || 30) * 60;

  db.prepare(`
    INSERT INTO test_sessions (id, subject, total_questions, time_limit_seconds)
    VALUES (?, ?, ?, ?)
  `).run(sessionId, subject, questions.length, timeLimitSeconds);

  // Create answer placeholders
  const insertAnswer = db.prepare(`
    INSERT INTO test_answers (session_id, question_id) VALUES (?, ?)
  `);
  const insertMany = db.transaction((qs) => {
    qs.forEach(q => insertAnswer.run(sessionId, q.id));
  });
  insertMany(questions);

  res.json({
    sessionId,
    questions: questions.map((q, idx) => ({
      index: idx + 1,
      id: q.id,
      question_text: q.question_text,
      option_a: q.option_a,
      option_b: q.option_b,
      option_c: q.option_c,
      option_d: q.option_d,
      option_e: q.option_e,
      source_page: q.source_page,
      source_pdf_stored: q.source_pdf_stored,
    })),
    timeLimitSeconds,
    totalQuestions: questions.length,
  });
});

// Submit an answer for a question
router.post('/:sessionId/answer', (req, res) => {
  const { sessionId } = req.params;
  const { questionId, selectedAnswer, timeSpent } = req.body;

  const question = db.prepare('SELECT correct_answer FROM questions WHERE id = ?').get(questionId);
  if (!question) {
    return res.status(404).json({ error: 'Question not found' });
  }

  const isCorrect = selectedAnswer === question.correct_answer ? 1 : 0;

  db.prepare(`
    UPDATE test_answers
    SET selected_answer = ?, is_correct = ?, time_spent_seconds = ?
    WHERE session_id = ? AND question_id = ?
  `).run(selectedAnswer, isCorrect, timeSpent || 0, sessionId, questionId);

  res.json({ saved: true });
});

// Complete a test session
router.post('/:sessionId/complete', (req, res) => {
  const { sessionId } = req.params;

  const score = db.prepare(`
    SELECT COUNT(*) as correct FROM test_answers
    WHERE session_id = ? AND is_correct = 1
  `).get(sessionId);

  db.prepare(`
    UPDATE test_sessions
    SET status = 'completed', completed_at = CURRENT_TIMESTAMP, score = ?
    WHERE id = ?
  `).run(score.correct, sessionId);

  // Return full results with explanations
  const results = db.prepare(`
    SELECT
      q.id, q.question_text, q.option_a, q.option_b, q.option_c, q.option_d, q.option_e,
      q.correct_answer, q.explanation, q.source_page, q.source_pdf_stored,
      ta.selected_answer, ta.is_correct, ta.time_spent_seconds
    FROM test_answers ta
    JOIN questions q ON ta.question_id = q.id
    WHERE ta.session_id = ?
    ORDER BY ta.id
  `).all(sessionId);

  const session = db.prepare('SELECT * FROM test_sessions WHERE id = ?').get(sessionId);

  res.json({
    session,
    score: score.correct,
    totalQuestions: session.total_questions,
    percentage: Math.round((score.correct / session.total_questions) * 100),
    results,
  });
});

// Get test results (for reviewing past tests)
router.get('/:sessionId/results', (req, res) => {
  const { sessionId } = req.params;

  const session = db.prepare('SELECT * FROM test_sessions WHERE id = ?').get(sessionId);
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  const results = db.prepare(`
    SELECT
      q.id, q.question_text, q.option_a, q.option_b, q.option_c, q.option_d, q.option_e,
      q.correct_answer, q.explanation, q.source_page, q.source_pdf_stored,
      ta.selected_answer, ta.is_correct, ta.time_spent_seconds
    FROM test_answers ta
    JOIN questions q ON ta.question_id = q.id
    WHERE ta.session_id = ?
    ORDER BY ta.id
  `).all(sessionId);

  res.json({
    session,
    score: session.score,
    totalQuestions: session.total_questions,
    percentage: Math.round((session.score / session.total_questions) * 100),
    results,
  });
});

module.exports = router;
