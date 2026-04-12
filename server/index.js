const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const db = require('./db');
const questionsRouter = require('./routes/questions');
const testsRouter = require('./routes/tests');
const progressRouter = require('./routes/progress');
const uploadRouter = require('./routes/upload');
const authRouter = require('./routes/auth');
const settingsRouter = require('./routes/settings');

const app = express();
const PORT = process.env.PORT || 3001;

// Ensure uploads folder exists
const uploadsDir = process.env.UPLOADS_DIR || path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(uploadsDir));

// API routes
app.use('/api/auth', authRouter);
app.use('/api/questions', questionsRouter);
app.use('/api/tests', testsRouter);
app.use('/api/progress', progressRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/settings', settingsRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Serve built frontend in production
const clientDist = path.join(__dirname, '..', 'client', 'dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

// Initialize database tables
db.initialize();

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
