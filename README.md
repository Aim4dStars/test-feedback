# NSW Selective Exam Practice

A full-stack web app for practising NSW Selective High School exam questions. Upload PDF question papers, take timed tests, and track your progress.

## Tech Stack

- **Frontend:** React 18 + Vite + Tailwind CSS + React Router
- **Backend:** Express.js + better-sqlite3
- **Deployment:** Fly.io (Docker)

## Local URLs

| Service  | URL                        |
| -------- | -------------------------- |
| Client   | http://localhost:5173      |
| Server   | http://localhost:3001      |
| Health   | http://localhost:3001/api/health |

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18+ installed

### 1. Install dependencies

```bash
npm run setup
```

This installs both server and client dependencies.

### 2. Run in development mode

```bash
npm run dev
```

This starts the Express server on port **3001** and the Vite dev server on port **5173** concurrently.

### 3. Build for production

```bash
npm run build
npm start
```

The built client is served by Express at http://localhost:3001.

## Project Structure

```
├── client/            # React frontend (Vite)
│   └── src/
│       ├── pages/     # Dashboard, Upload, TestSetup, TestScreen, Results, Progress
│       └── components/
├── server/            # Express backend
│   ├── index.js       # Entry point
│   ├── db.js          # SQLite setup & migrations
│   └── routes/        # questions, tests, progress, upload
├── data/              # SQLite database (auto-created)
├── uploads/           # Uploaded PDF files
├── sample-questions/  # Sample NSW exam PDFs
├── Dockerfile         # Multi-stage Docker build
└── fly.toml           # Fly.io deployment config
```

## Features

- **PDF Upload** — upload exam PDFs and extract questions
- **Timed Tests** — configurable subject and question count
- **Results Review** — see correct answers with explanations and source PDF pages
- **Progress Tracking** — view historical scores and performance

## Docker

```bash
docker build -t nsw-exam .
docker run -p 8080:8080 nsw-exam
```

App will be available at http://localhost:8080.
