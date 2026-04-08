# NSW Exam Practice

A full-stack web app for practising NSW Selective High School (Year 6) and OC Test (Year 5) exam questions. Upload PDF question papers, take timed tests, and track your progress.

**Live App:** https://test-feedback.fly.dev/

## Features

- **Exam Type Switching** — toggle between Selective (Year 6) and OC (Year 5) with separate question banks and progress
- **User Authentication** — login/register with JWT-based auth
- **Admin-Only Uploads** — only admin users can upload PDF question papers
- **Subscription Tiers** — Free, Basic, and Premium tiers
- **PDF Upload** — upload exam PDFs and extract questions (admin only)
- **Timed Tests** — configurable subject and question count
- **Results Review** — see correct answers with explanations and source PDF pages
- **Progress Tracking** — view historical scores and performance

## Tech Stack

- **Frontend:** React 18 + Vite + Tailwind CSS + React Router
- **Backend:** Express.js + better-sqlite3 + JWT (jsonwebtoken + bcryptjs)
- **Deployment:** Fly.io (Docker)

## Local URLs

| Service | URL                              |
| ------- | -------------------------------- |
| Client  | http://localhost:5173            |
| Server  | http://localhost:3001            |
| Health  | http://localhost:3001/api/health |

---

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

## User Roles & Authentication

### How it works

- Users register and log in with username/password
- JWT tokens are stored in the browser (localStorage)
- The header shows the logged-in user, subscription badge, and logout button
- The exam type toggle (Selective/OC) is in the header

### Roles

| Role    | Can take tests | Can view progress | Can upload PDFs |
| ------- | -------------- | ----------------- | --------------- |
| User    | ✅             | ✅                | ❌              |
| Admin   | ✅             | ✅                | ✅              |

### Making a user an admin

There is no admin UI — set it directly in the SQLite database.

**Locally (using Node — no sqlite3 CLI needed):**

```bash
# List all users
node -e "const {db}=require('./server/db'); console.log(db.prepare('SELECT id,username,is_admin FROM users').all());"

# Make a user admin
node -e "const {db}=require('./server/db'); db.prepare('UPDATE users SET is_admin=1 WHERE username=?').run('admin');"

# Remove admin
node -e "const {db}=require('./server/db'); db.prepare('UPDATE users SET is_admin=0 WHERE username=?').run('admin');"
```

**On Fly.io:**

```bash
flyctl ssh console --app test-feedback
sqlite3 /data/exam.db "UPDATE users SET is_admin = 1 WHERE username = 'your_username';"
exit
```

> After updating, the user must **log out and log back in** to get a new JWT token with admin privileges.

### Subscription tiers

| Tier    | Badge              |
| ------- | ------------------ |
| Free    | Gray "Free"        |
| Basic   | Blue "Basic"       |
| Premium | Amber "Premium ⭐" |

Subscriptions can be updated via the API:

```bash
curl -X PUT http://localhost:3001/api/auth/subscription \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"subscriptionType": "premium"}'
```

---

## Deploying to Fly.io

### Step 1: Install the Fly.io CLI (`flyctl`)

**macOS (Homebrew):**
```bash
brew install flyctl
```

**macOS / Linux:**
```bash
curl -L https://fly.io/install.sh | sh
```

**Windows (PowerShell):**
```powershell
pwsh -Command "iwr https://fly.io/install.ps1 -useb | iex"
```

> If `pwsh` is not found, use `powershell` instead of `pwsh`.

**Windows (WinGet):**
```powershell
winget install Fly-io.flyctl
```

Verify installation:
```bash
flyctl version
```

### Step 2: Sign up / Log in

```bash
flyctl auth signup    # first time only
flyctl auth login     # opens browser to authenticate
```

### Step 3: Create a new Fly.io app

```bash
flyctl apps create test-feedback --org personal
```

### Step 4: Create a persistent volume for the SQLite database

```bash
flyctl volumes create exam_data --region syd --size 1 --app test-feedback --yes
```

> The volume name `exam_data` must match `[mounts] source` in `fly.toml`.
> 1GB volume is within the free tier.

### Step 5: Set a JWT secret (recommended for production)

```bash
flyctl secrets set JWT_SECRET="your-random-secret-here" --app test-feedback
```

### Step 6: Deploy

```bash
flyctl deploy --no-cache
```

> Use `--no-cache` on the first deploy or when dependencies change to ensure a clean build.

Fly.io will:
1. Build the Docker image (installs deps from public npm registry, builds the React frontend)
2. Push the image to Fly.io's registry
3. Create a machine and start the app

### Step 7: Verify and set up admin

Your app will be available at:
```
https://test-feedback.fly.dev/
```

1. Register a user account in the app
2. Make yourself admin:
   ```bash
   flyctl ssh console --app test-feedback
   sqlite3 /data/exam.db "UPDATE users SET is_admin = 1 WHERE username = 'your_username';"
   exit
   ```
3. Log out and log back in — you'll now see the "Upload PDFs" option

Check status and logs:
```bash
flyctl status --app test-feedback
flyctl logs --app test-feedback
```

### Subsequent deploys

After making code changes, simply run:
```bash
flyctl deploy
```

---

## Minimizing Fly.io Costs

### Free tier includes

| Resource          | Free Allowance             | This App Uses          |
| ----------------- | -------------------------- | ---------------------- |
| Shared CPU VMs    | Up to 3 shared-cpu-1x VMs | 1 VM (auto-stops idle) |
| RAM               | 256MB per VM               | 512MB (small overage)  |
| Persistent Volume | 1GB                        | 1GB                    |
| Bandwidth         | 100GB/month outbound       | Minimal                |
| Shared IPv4       | Free                       | ✅ Using shared        |
| Dedicated IPv4    | $2/month each              | ❌ Not allocated       |

### What keeps costs low

The `fly.toml` is already configured to minimize costs:

```toml
auto_stop_machines = 'stop'      # Machine stops when no traffic (no compute charges)
auto_start_machines = true       # Restarts automatically on next request
min_machines_running = 0         # Allows all machines to stop
```

### To reduce RAM to stay fully free

Edit `fly.toml` and change the VM size:

```toml
[[vm]]
  size = 'shared-cpu-1x'
  memory = '256mb'              # Change from 512mb to 256mb for free tier
```

Then redeploy:
```bash
flyctl deploy
```

### Check what you're being charged

```bash
flyctl billing view
```

### Stop machines manually (keep app, stop charges)

```bash
flyctl machines list --app test-feedback
flyctl machines stop <machine-id> --app test-feedback
```

### Scale to zero machines (keep app config, no charges)

```bash
flyctl scale count 0 --app test-feedback
```

To bring it back:
```bash
flyctl scale count 1 --app test-feedback
```

---

## Destroying / Undeploying from Fly.io

### Remove the app completely (irreversible)

```bash
flyctl apps destroy test-feedback --yes
```

> ⚠️ This destroys the app, all machines, volumes, and releases the hostname. **Data is permanently deleted.**

### Redeploying after destroying

After destroying, run these commands to get the app back up:

```bash
# 1. Create the app again
flyctl apps create test-feedback --org personal

# 2. Recreate the persistent volume (old data is gone)
flyctl volumes create exam_data --region syd --size 1 --app test-feedback --yes

# 3. Set JWT secret
flyctl secrets set JWT_SECRET="your-random-secret-here" --app test-feedback

# 4. Deploy
flyctl deploy --no-cache
```

The app will be live again at https://test-feedback.fly.dev/

> **Note:** The SQLite database starts fresh — you'll need to register again, set admin, and re-upload question PDFs.

### Remove just a specific machine (keep app)

```bash
flyctl machines list --app test-feedback
flyctl machines destroy <machine-id> --force --app test-feedback
```

### Remove a specific volume

```bash
flyctl volumes list --app test-feedback
flyctl volumes destroy <volume-id> --app test-feedback
```

---

## Docker (standalone)

```bash
docker build -t test-feedback .
docker run -p 8080:8080 -e JWT_SECRET="your-secret" test-feedback
```

App will be available at http://localhost:8080.

---

## Project Structure

```
├── client/              # React frontend (Vite)
│   └── src/
│       ├── pages/       # Login, Dashboard, Upload, TestSetup, TestScreen, Results, Progress
│       └── components/  # Layout, PdfPageViewer, Timer
├── server/              # Express backend
│   ├── index.js         # Entry point
│   ├── db.js            # SQLite setup & migrations
│   ├── middleware/       # auth.js (JWT auth, admin check)
│   └── routes/          # auth, questions, tests, progress, upload
├── data/                # SQLite database (auto-created)
├── uploads/             # Uploaded PDF files
├── sample-questions/    # Sample NSW exam PDFs
├── .npmrc               # Forces public npm registry
├── .dockerignore        # Excludes node_modules, lock files, data
├── Dockerfile           # Multi-stage Docker build
└── fly.toml             # Fly.io deployment config
```

## API Endpoints

| Method | Endpoint                        | Auth     | Description                  |
| ------ | ------------------------------- | -------- | ---------------------------- |
| POST   | `/api/auth/register`            | None     | Create account               |
| POST   | `/api/auth/login`               | None     | Login                        |
| GET    | `/api/auth/me`                  | Required | Get current user             |
| PUT    | `/api/auth/subscription`        | Required | Update subscription          |
| GET    | `/api/questions/counts`         | None     | Question counts by subject   |
| POST   | `/api/upload`                   | Admin    | Upload PDF questions         |
| POST   | `/api/tests/start`              | None     | Start a test session         |
| POST   | `/api/tests/:id/answer`         | None     | Submit an answer             |
| POST   | `/api/tests/:id/complete`       | None     | Complete a test              |
| GET    | `/api/tests/:id/results`        | None     | Get test results             |
| GET    | `/api/progress`                 | None     | Get progress stats           |

## Notes

- The `.npmrc` file and Dockerfile both force `registry=https://registry.npmjs.org/` to ensure packages are always fetched from the public npm registry (not corporate Artifactory).
- `package-lock.json` files are excluded from the Docker build via `.dockerignore` so the container always generates fresh ones from the public registry.
- Set `JWT_SECRET` environment variable in production. The default is only for development.
- The first registered user is not automatically admin — you must set `is_admin = 1` in the database manually.
