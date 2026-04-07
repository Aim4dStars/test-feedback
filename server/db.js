const Database = require('better-sqlite3');
const path = require('path');

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
const dbPath = path.join(DATA_DIR, 'exam.db');
const fs = require('fs');

// Ensure data directory exists
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initialize() {
  // Check if questions table exists and needs migration
  const tableInfo = db.prepare("PRAGMA table_info(questions)").all();
  const hasOptionE = tableInfo.some(col => col.name === 'option_e');

  const hasSourcePage = tableInfo.some(col => col.name === 'source_page');

  if (tableInfo.length > 0 && (!hasOptionE || !hasSourcePage)) {
    // Migrate: drop old tables and recreate (old CHECK constraints can't be altered in SQLite)
    db.exec(`
      DROP TABLE IF EXISTS test_answers;
      DROP TABLE IF EXISTS test_sessions;
      DROP TABLE IF EXISTS questions;
    `);
  }

  db.exec(`
    CREATE TABLE IF NOT EXISTS questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      subject TEXT NOT NULL CHECK(subject IN ('maths', 'reading', 'thinking', 'writing')),
      question_text TEXT NOT NULL,
      option_a TEXT NOT NULL,
      option_b TEXT NOT NULL,
      option_c TEXT NOT NULL,
      option_d TEXT NOT NULL,
      option_e TEXT DEFAULT '',
      correct_answer TEXT NOT NULL CHECK(correct_answer IN ('A', 'B', 'C', 'D', 'E')),
      explanation TEXT DEFAULT '',
      source_pdf TEXT DEFAULT '',
      source_page INTEGER DEFAULT 0,
      source_pdf_stored TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS test_sessions (
      id TEXT PRIMARY KEY,
      subject TEXT NOT NULL,
      total_questions INTEGER NOT NULL,
      time_limit_seconds INTEGER NOT NULL,
      started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      completed_at DATETIME,
      score INTEGER DEFAULT 0,
      status TEXT DEFAULT 'in_progress' CHECK(status IN ('in_progress', 'completed', 'abandoned'))
    );

    CREATE TABLE IF NOT EXISTS test_answers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL,
      question_id INTEGER NOT NULL,
      selected_answer TEXT CHECK(selected_answer IN ('A', 'B', 'C', 'D', 'E', NULL)),
      is_correct INTEGER DEFAULT 0,
      time_spent_seconds INTEGER DEFAULT 0,
      FOREIGN KEY (session_id) REFERENCES test_sessions(id),
      FOREIGN KEY (question_id) REFERENCES questions(id)
    );
  `);
}

module.exports = { db, initialize };
