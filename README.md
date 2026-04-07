# NSW Selective Exam Practice

A full-stack web app for practising NSW Selective High School exam questions. Upload PDF question papers, take timed tests, and track your progress.

## Tech Stack

- **Frontend:** React 18 + Vite + Tailwind CSS + React Router
- **Backend:** Express.js + better-sqlite3
- **Deployment:** Fly.io (Docker)

## Local URLs

| Service | URL                              |
| ------- | -------------------------------- |
| Client  | http://localhost:5173            |
| Server  | http://localhost:3001            |
| Health  | http://localhost:3001/api/health |

## Getting Started (Local Development)

### Prerequisites

- [Node.js](https://nodejs.org/) v18+

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

---

## Deploying to Fly.io

### Prerequisites

- [Fly.io CLI (`flyctl`)](https://fly.io/docs/flyctl/install/) installed
- Authenticated with Fly.io: `flyctl auth login`

### Step 1: Create a new Fly.io app

```bash
flyctl apps create test-feedback --org personal
```

### Step 2: Create a persistent volume for the SQLite database

```bash
flyctl volumes create exam_data --region syd --size 1 --app test-feedback --yes
```

> The volume name `exam_data` must match `[mounts] source` in `fly.toml`.

### Step 3: Deploy

```bash
flyctl deploy --no-cache
```

> Use `--no-cache` on the first deploy or when dependencies change to ensure a clean build.

Fly.io will:
1. Build the Docker image (installs deps from public npm registry, builds the React frontend)
2. Push the image to Fly.io's registry
3. Create a machine and start the app

### Step 4: Verify

Your app will be available at:

```
https://test-feedback.fly.dev/
```

Check the logs:

```bash
flyctl logs --app test-feedback
```

Check app status:

```bash
flyctl status --app test-feedback
```

### Subsequent deploys

After making code changes, simply run:

```bash
flyctl deploy
```

---

## Destroying / Undeploying from Fly.io

### Remove the app completely

```bash
flyctl apps destroy test-feedback --yes
```

> This destroys the app, all machines, volumes, and releases the hostname. **This is irreversible.**

### Remove just the machines (keep app config)

```bash
flyctl machines list --app test-feedback
flyctl machines destroy <machine-id> --force --app test-feedback
```

### Remove a volume

```bash
flyctl volumes list --app test-feedback
flyctl volumes destroy <volume-id> --app test-feedback
```

---

## Docker (standalone)

```bash
docker build -t test-feedback .
docker run -p 8080:8080 test-feedback
```

App will be available at http://localhost:8080.

---

## Project Structure

```
├── client/              # React frontend (Vite)
│   └── src/
│       ├── pages/       # Dashboard, Upload, TestSetup, TestScreen, Results, Progress
│       └── components/
├── server/              # Express backend
│   ├── index.js         # Entry point
│   ├── db.js            # SQLite setup & migrations
│   └── routes/          # questions, tests, progress, upload
├── data/                # SQLite database (auto-created)
├── uploads/             # Uploaded PDF files
├── sample-questions/    # Sample NSW exam PDFs
├── .npmrc               # Forces public npm registry
├── .dockerignore        # Excludes node_modules, lock files, data
├── Dockerfile           # Multi-stage Docker build
└── fly.toml             # Fly.io deployment config
```

## Features

- **PDF Upload** — upload exam PDFs and extract questions
- **Timed Tests** — configurable subject and question count
- **Results Review** — see correct answers with explanations and source PDF pages
- **Progress Tracking** — view historical scores and performance

## Notes

- The `.npmrc` file and Dockerfile both force `registry=https://registry.npmjs.org/` to ensure packages are always fetched from the public npm registry.
- `package-lock.json` files are excluded from the Docker build via `.dockerignore` so the container always generates fresh ones from the public registry.
