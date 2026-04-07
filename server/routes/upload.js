const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pdfParse = require('pdf-parse');
const { db } = require('../db');
const { getTextByPage } = require('../pdf-pages');

const uploadsDir = process.env.UPLOADS_DIR || path.join(__dirname, '..', '..', 'uploads');

const storage = multer.diskStorage({
  destination: uploadsDir,
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  },
});

/**
 * Parse questions PDF text into structured MCQ questions.
 *
 * Supports numbered MCQs with 4-5 options (A-D or A-E). No answer line expected.
 * Question number can be bare (e.g. "1 ") or with dot/paren (e.g. "1." or "1)").
 * Options can be formatted as: A text, A) text, A. text, or A: text.
 * Question text may span multiple lines before options start.
 */
function parseQuestions(text, subject, sourceFilename) {
  const questions = [];
  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // Pre-process: join option lines where the value is on the next line
  // e.g., "B\n260 mL" -> "B 260 mL"
  const joined = normalized.replace(/\n([A-E])\n(\S)/g, '\n$1 $2');

  // Split into question blocks. Look for a number followed by text on the same line
  // (not just a bare number which could be a page number).
  // Match: start of line, 1-2 digit number, optional dot/paren, space, then at least one letter
  const blocks = joined.split(/\n(?=\d{1,2}[\.\)]*\s+[A-Za-z'""'])/);

  for (const block of blocks) {
    const lines = block.trim().split('\n').map(l => l.trim()).filter(l => l);
    if (lines.length < 3) continue;

    try {
      // Check first line starts with a question number
      if (!/^\d{1,2}[\.\)]*\s+/.test(lines[0])) continue;

      // Find where options start (first line matching option A)
      const optAPattern = /^A[\)\.\:]\s+.+|^A\s{1,3}\S+/;
      let optionStartIdx = -1;
      for (let i = 1; i < lines.length; i++) {
        if (optAPattern.test(lines[i])) {
          optionStartIdx = i;
          break;
        }
      }
      if (optionStartIdx < 1) continue;

      // Question text is everything from line 0 to optionStartIdx - 1
      let questionTextParts = [];
      for (let i = 0; i < optionStartIdx; i++) {
        let part = lines[i];
        if (i === 0) {
          part = part.replace(/^\d{1,2}[\.\)]*\s*/, '').trim();
        }
        // Skip lines that are just page numbers, diagram labels, or very short noise
        if (/^\d+$/.test(part)) continue;
        if (/^\[.*\]$/.test(part)) continue;
        if (part) questionTextParts.push(part);
      }
      const questionText = questionTextParts.join(' ');
      if (!questionText || questionText.length < 5) continue;

      // Extract options from optionStartIdx onward
      const optionLines = lines.slice(optionStartIdx);
      const optionA = extractOption(optionLines, 'A');
      const optionB = extractOption(optionLines, 'B');
      const optionC = extractOption(optionLines, 'C');
      const optionD = extractOption(optionLines, 'D');
      const optionE = extractOption(optionLines, 'E');

      if (!optionA || !optionB || !optionC || !optionD) continue;

      questions.push({
        subject,
        question_text: questionText,
        option_a: optionA,
        option_b: optionB,
        option_c: optionC,
        option_d: optionD,
        option_e: optionE || '',
        correct_answer: 'A', // placeholder — updated when answers PDF is uploaded
        explanation: '',
        source_pdf: sourceFilename,
      });
    } catch (e) {
      continue;
    }
  }

  return questions;
}

/**
 * Parse a simple answer key PDF.
 *
 * Format (two-column table):
 *   Test Order  Answer
 *   1           E
 *   2           A
 *   ...
 *
 * Returns array of { number, correct_answer }
 */
function parseAnswerKey(text) {
  const answers = [];
  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = normalized.split('\n').map(l => l.trim()).filter(l => l);

  for (const line of lines) {
    // Match lines like "1 E" or "12 A" — a number followed by a single letter
    const match = line.match(/^(\d{1,3})\s+([A-G])$/i);
    if (match) {
      answers.push({
        number: parseInt(match[1], 10),
        correct_answer: match[2].toUpperCase(),
      });
    }
  }

  return answers;
}

/**
 * Parse answers-with-explanations PDF.
 *
 * Format:
 *   1
 *   Some explanation text...
 *   the correct answer is X value.
 *
 *   2
 *   More explanation...
 *   the correct answer is A 1.
 *
 * Returns array of { number, correct_answer, explanation }
 */
function parseAnswersExplained(text) {
  const answers = [];
  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // Split into blocks at lines that are just a number (answer number)
  const blocks = normalized.split(/\n(?=\d{1,3}\s*\n)/);

  for (const block of blocks) {
    const trimmed = block.trim();
    if (!trimmed) continue;

    const lines = trimmed.split('\n').map(l => l.trim()).filter(l => l);
    if (lines.length === 0) continue;

    // First line should be the answer number
    const numMatch = lines[0].match(/^(\d{1,3})$/);
    if (!numMatch) continue;

    const answerNum = parseInt(numMatch[1], 10);

    // Full explanation text (everything after the number)
    const fullText = lines.slice(1).join(' ');

    // Find "the correct answer is X" — X is A-E, possibly with ** markdown bold
    const answerMatch = fullText.match(/the\s+correct\s+answer\s+is\s+\*{0,2}([A-E])/i);
    if (!answerMatch) continue;

    const correctAnswer = answerMatch[1].toUpperCase();

    answers.push({
      number: answerNum,
      correct_answer: correctAnswer,
      explanation: fullText.trim(),
    });
  }

  return answers;
}

function extractOption(lines, letter) {
  // Match: A) text, A. text, A: text, or A  text (letter followed by separator then text)
  const regex = new RegExp(`^${letter}[\\)\\.\\:]\\s+(.+)`, 'i');
  const regexBare = new RegExp(`^${letter}\\s{1,3}(\\S.+)`, 'i');
  for (const line of lines) {
    const match = line.match(regex);
    if (match) return match[1].trim();
    const bareMatch = line.match(regexBare);
    if (bareMatch) return bareMatch[1].trim();
  }
  return null;
}

// Upload and parse PDF
router.post('/', upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No PDF file uploaded' });
    }

    const subject = req.body.subject;
    if (!['maths', 'reading', 'thinking', 'writing'].includes(subject)) {
      return res.status(400).json({ error: 'Invalid subject. Must be one of: maths, reading, thinking, writing' });
    }

    const uploadType = req.body.type || 'questions';
    if (!['questions', 'answers', 'answers_explained'].includes(uploadType)) {
      return res.status(400).json({ error: 'Invalid type. Must be "questions", "answers", or "answers_explained".' });
    }

    const pdfBuffer = fs.readFileSync(req.file.path);
    const pdfData = await pdfParse(pdfBuffer);

    if (uploadType === 'questions') {
      const questions = parseQuestions(pdfData.text, subject, req.file.originalname);

      if (questions.length === 0) {
        return res.status(400).json({
          error: 'No valid questions found in the PDF. Please check the format.',
          expectedFormat: 'Each question should be numbered with options A-D (or A-E).',
          rawTextPreview: pdfData.text.substring(0, 500),
        });
      }

      // Determine which PDF page each question appears on
      let pageTexts = [];
      try {
        pageTexts = await getTextByPage(pdfBuffer);
      } catch (e) {
        console.warn('Could not extract per-page text:', e.message);
      }

      const storedFilename = req.file.filename;
      // Normalize text for matching: collapse whitespace
      const normalize = (s) => s.replace(/\s+/g, ' ').trim().toLowerCase();
      const normalizedPageTexts = pageTexts.map(pt => ({
        page: pt.page,
        text: normalize(pt.text),
      }));

      for (const q of questions) {
        q.source_pdf_stored = storedFilename;
        q.source_page = 0;
        if (normalizedPageTexts.length > 0) {
          // Use first 30 chars of question text, normalized, to find the page
          const snippet = normalize(q.question_text).substring(0, 30);
          if (snippet.length >= 10) {
            for (const pt of normalizedPageTexts) {
              if (pt.text.includes(snippet)) {
                q.source_page = pt.page;
                break;
              }
            }
          }
        }
      }

      const insert = db.prepare(`
        INSERT INTO questions (subject, question_text, option_a, option_b, option_c, option_d, option_e, correct_answer, explanation, source_pdf, source_page, source_pdf_stored)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const insertAll = db.transaction((qs) => {
        for (const q of qs) {
          insert.run(q.subject, q.question_text, q.option_a, q.option_b, q.option_c, q.option_d, q.option_e, q.correct_answer, q.explanation, q.source_pdf, q.source_page, q.source_pdf_stored);
        }
      });

      insertAll(questions);

      res.json({
        success: true,
        type: 'questions',
        questionsImported: questions.length,
        subject,
        filename: req.file.originalname,
      });
    } else if (uploadType === 'answers') {
      // Simple answer key: "1 E", "2 A", etc.
      const answers = parseAnswerKey(pdfData.text);

      if (answers.length === 0) {
        return res.status(400).json({
          error: 'No valid answers found in the PDF. Expected format: "1 E" (number followed by letter).',
          rawTextPreview: pdfData.text.substring(0, 500),
        });
      }

      const existingQuestions = db.prepare(
        'SELECT id FROM questions WHERE subject = ? ORDER BY id'
      ).all(subject);

      const updateStmt = db.prepare(
        'UPDATE questions SET correct_answer = ? WHERE id = ?'
      );

      let updatedCount = 0;
      const updateAll = db.transaction(() => {
        for (const answer of answers) {
          const idx = answer.number - 1;
          if (idx >= 0 && idx < existingQuestions.length) {
            updateStmt.run(answer.correct_answer, existingQuestions[idx].id);
            updatedCount++;
          }
        }
      });

      updateAll();

      res.json({
        success: true,
        type: 'answers',
        answersParsed: answers.length,
        questionsUpdated: updatedCount,
        totalQuestionsInSubject: existingQuestions.length,
        subject,
        filename: req.file.originalname,
      });
    } else {
      // type === 'answers_explained'
      const answers = parseAnswersExplained(pdfData.text);

      if (answers.length === 0) {
        return res.status(400).json({
          error: 'No valid explained answers found. Expected "the correct answer is X" in each entry.',
          rawTextPreview: pdfData.text.substring(0, 500),
        });
      }

      const existingQuestions = db.prepare(
        'SELECT id FROM questions WHERE subject = ? ORDER BY id'
      ).all(subject);

      const updateStmt = db.prepare(
        'UPDATE questions SET correct_answer = ?, explanation = ? WHERE id = ?'
      );

      let updatedCount = 0;
      const updateAll = db.transaction(() => {
        for (const answer of answers) {
          const idx = answer.number - 1;
          if (idx >= 0 && idx < existingQuestions.length) {
            updateStmt.run(answer.correct_answer, answer.explanation, existingQuestions[idx].id);
            updatedCount++;
          }
        }
      });

      updateAll();

      res.json({
        success: true,
        type: 'answers_explained',
        answersParsed: answers.length,
        questionsUpdated: updatedCount,
        totalQuestionsInSubject: existingQuestions.length,
        subject,
        filename: req.file.originalname,
      });
    }
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to process PDF: ' + error.message });
  }
});

// Get list of uploaded files
router.get('/files', (req, res) => {
  const files = db.prepare(`
    SELECT source_pdf, subject, COUNT(*) as question_count, MIN(created_at) as uploaded_at
    FROM questions
    WHERE source_pdf != ''
    GROUP BY source_pdf, subject
    ORDER BY uploaded_at DESC
  `).all();
  res.json(files);
});

// Get distinct sources grouped by subject
router.get('/sources', (req, res) => {
  const rows = db.prepare(`
    SELECT subject, source_pdf, COUNT(*) as question_count
    FROM questions
    WHERE source_pdf != ''
    GROUP BY subject, source_pdf
    ORDER BY subject, source_pdf
  `).all();

  const grouped = {};
  for (const row of rows) {
    if (!grouped[row.subject]) grouped[row.subject] = [];
    grouped[row.subject].push({
      source_pdf: row.source_pdf,
      question_count: row.question_count,
    });
  }

  res.json(grouped);
});

module.exports = router;
