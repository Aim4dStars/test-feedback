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
  const hasExamType = tableInfo.some(col => col.name === 'exam_type');

  if (tableInfo.length > 0 && (!hasOptionE || !hasSourcePage || !hasExamType)) {
    // Migrate: drop old tables and recreate (old CHECK constraints can't be altered in SQLite)
    db.exec(`
      DROP TABLE IF EXISTS test_answers;
      DROP TABLE IF EXISTS test_sessions;
      DROP TABLE IF EXISTS questions;
    `);
  }

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      display_name TEXT DEFAULT '',
      subscription_type TEXT NOT NULL DEFAULT 'free' CHECK(subscription_type IN ('free', 'basic', 'premium')),
      subscription_expires_at DATETIME,
      is_admin INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Migrate users table: add is_admin if missing
  const userInfo = db.prepare("PRAGMA table_info(users)").all();
  if (userInfo.length > 0 && !userInfo.some(col => col.name === 'is_admin')) {
    db.exec("ALTER TABLE users ADD COLUMN is_admin INTEGER NOT NULL DEFAULT 0");
  }

  // Check if test_sessions needs user_id column
  const sessionInfo = db.prepare("PRAGMA table_info(test_sessions)").all();
  const hasUserId = sessionInfo.some(col => col.name === 'user_id');

  db.exec(`
    CREATE TABLE IF NOT EXISTS questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      subject TEXT NOT NULL CHECK(subject IN ('maths', 'reading', 'thinking', 'writing')),
      exam_type TEXT NOT NULL DEFAULT 'selective' CHECK(exam_type IN ('selective', 'oc')),
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
      user_id INTEGER DEFAULT NULL,
      subject TEXT NOT NULL,
      exam_type TEXT NOT NULL DEFAULT 'selective' CHECK(exam_type IN ('selective', 'oc')),
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

  // Migrate: add user_id to test_sessions if missing
  if (sessionInfo.length > 0 && !hasUserId) {
    db.exec(`ALTER TABLE test_sessions ADD COLUMN user_id INTEGER DEFAULT NULL`);
  }

  db.exec(`
    CREATE TABLE IF NOT EXISTS test_config (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      exam_type TEXT NOT NULL UNIQUE CHECK(exam_type IN ('selective', 'oc')),
      default_questions INTEGER NOT NULL DEFAULT 20,
      default_time_minutes INTEGER NOT NULL DEFAULT 30,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    INSERT OR IGNORE INTO test_config (exam_type, default_questions, default_time_minutes) VALUES ('selective', 20, 30);
    INSERT OR IGNORE INTO test_config (exam_type, default_questions, default_time_minutes) VALUES ('oc', 10, 10);
  `);

  // Seed default questions if the questions table is empty
  const questionCount = db.prepare('SELECT COUNT(*) as count FROM questions').get();
  if (questionCount.count === 0) {
    const localSeedDir = path.join(__dirname, '..', 'data');
    const dockerSeedDir = path.join(__dirname, '..', 'seed-data');
    const seedDir = fs.existsSync(dockerSeedDir) ? dockerSeedDir : localSeedDir;
    const seedFiles = ['seed-maths.json', 'seed-reading.json', 'seed-thinking.json'];
    const insert = db.prepare(`
      INSERT INTO questions (subject, exam_type, question_text, option_a, option_b, option_c, option_d, option_e, correct_answer, explanation, source_pdf, source_page, source_pdf_stored)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const seedAll = db.transaction(() => {
      for (const file of seedFiles) {
        const filePath = path.join(seedDir, file);
        if (!fs.existsSync(filePath)) continue;
        const questions = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        for (const q of questions) {
          insert.run(
            q.subject, q.exam_type || 'selective', q.question_text,
            q.option_a, q.option_b, q.option_c, q.option_d, q.option_e || '',
            q.correct_answer, q.explanation || '',
            q.source_pdf || 'seed-questions', 0, ''
          );
        }
      }
    });

    seedAll();
    console.log('Seeded default questions.');
  }
}

module.exports = { db, initialize };
