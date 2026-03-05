# CollabNotes 📝

> A collaborative rich-text note-taking app built with the **MERN stack** and **Tailwind CSS**.

![CollabNotes Banner](https://placehold.co/1200x400/221f1a/fbbf24?text=CollabNotes)

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🔐 JWT Auth | Short-lived access tokens (15 min) + rotating refresh tokens (7 days) |
| ✏️ Rich Text Editor | Quill 2 with headings, lists, code blocks, blockquotes, inline colors |
| 🔍 Full-text Search | MongoDB `$text` index across title, body, and tags — debounced live search |
| 👥 Collaborator Management | Invite by email, assign `editor` or `viewer` role, remove at any time |
| 📌 Pin & Archive | Pin important notes to the top; archive to declutter |
| 🎨 Note Colors | Per-note background colors for visual organisation |
| 🏷️ Tags | Add freeform tags; inline tag management inside the editor |
| 💾 Auto-save | 1.2 s debounced auto-save with visual status indicator |
| 🛡️ Security | Helmet, mongo-sanitize, rate limiting (100 req / 15 min per IP), bcrypt-12 |
| 🐳 Docker | `docker-compose up` spins up Mongo + API + Nginx-served SPA |

---

## 🗂️ Project Structure

```
collabnotes/
├── server/                  # Express + Mongoose API
│   ├── config/              # DB connection, Winston logger
│   ├── controllers/         # auth, notes, users
│   ├── middleware/           # JWT protect, error handler, validator
│   ├── models/              # User, Note (Mongoose schemas)
│   ├── routes/              # auth, notes, users
│   ├── utils/               # JWT sign/verify helpers
│   ├── .env.example         # ← copy to .env
│   ├── Dockerfile
│   └── index.js
│
├── client/                  # React + Vite SPA
│   ├── src/
│   │   ├── components/
│   │   │   ├── editor/      # RichTextEditor, CollaboratorPanel
│   │   │   ├── layout/      # AppShell (sidebar + topbar)
│   │   │   └── notes/       # NoteCard, SearchBar
│   │   ├── contexts/        # AuthContext, NotesContext
│   │   ├── pages/           # Login, Register, Dashboard, Editor, Profile
│   │   ├── services/        # Axios instance with interceptors
│   │   └── App.jsx          # Router + protected routes
│   ├── .env.example         # ← copy to .env
│   ├── Dockerfile
│   └── vite.config.js
│
├── docker-compose.yml
├── package.json             # Root: concurrently dev script
└── README.md
```

---

## 🚀 Quick Start (Local Development)

### Prerequisites

- **Node.js** ≥ 18
- **npm** ≥ 9
- **MongoDB** running locally _or_ a [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) connection string

### 1 — Clone

```bash
git clone https://github.com/<your-username>/collabnotes.git
cd collabnotes
```

### 2 — Configure environment variables

```bash
# Server
cp server/.env.example server/.env
# Edit server/.env → set MONGODB_URI, JWT_SECRET, JWT_REFRESH_SECRET, CLIENT_URL

# Client
cp client/.env.example client/.env
# Edit client/.env → set VITE_API_URL (default: http://localhost:5000/api)
```

See [Environment Variables](#-environment-variables) below for full reference.

### 3 — Install dependencies

```bash
npm run install:all
# or separately:
# cd server && npm install
# cd client && npm install
```

### 4 — Run both servers

```bash
npm run dev
# API → http://localhost:5000
# SPA → http://localhost:5173
```

---

## 🐳 Docker Compose (Full Stack)

```bash
# Copy and configure env files first (step 2 above)
docker-compose up --build

# SPA → http://localhost:5173
# API → http://localhost:5000
# MongoDB → localhost:27017
```

---

## 🌐 API Endpoints

### Auth — `/api/auth`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/register` | ✗ | Create account |
| POST | `/login` | ✗ | Sign in, returns tokens |
| POST | `/refresh` | ✗ | Rotate access + refresh token |
| POST | `/logout` | ✓ | Invalidate refresh token |
| GET | `/me` | ✓ | Current user |

### Notes — `/api/notes`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | ✓ | List owned + collaborated notes |
| POST | `/` | ✓ | Create note |
| GET | `/search?q=…` | ✓ | Full-text search |
| GET | `/:id` | ✓ | Get note (owner or collaborator) |
| PUT | `/:id` | ✓ | Update note (editor role required) |
| DELETE | `/:id` | ✓ | Delete note (owner only) |
| POST | `/:id/collaborators` | ✓ | Add collaborator (owner only) |
| PUT | `/:id/collaborators/:cId` | ✓ | Update collaborator role |
| DELETE | `/:id/collaborators/:cId` | ✓ | Remove collaborator |

### Users — `/api/users`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/search?email=…` | ✓ | Find user by email |
| PUT | `/profile` | ✓ | Update name / avatar |
| PUT | `/password` | ✓ | Change password |

---

## 🔑 Environment Variables

### Server (`server/.env`)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | ✗ | `development` | `development` \| `production` \| `test` |
| `PORT` | ✗ | `5000` | TCP port for Express |
| `MONGODB_URI` | ✅ | — | Full MongoDB connection string |
| `JWT_SECRET` | ✅ | — | Secret for signing **access** tokens (32+ random chars) |
| `JWT_REFRESH_SECRET` | ✅ | — | Secret for signing **refresh** tokens (32+ random chars) |
| `JWT_EXPIRES_IN` | ✗ | `15m` | Access token lifetime (ms string) |
| `JWT_REFRESH_EXPIRES_IN` | ✗ | `7d` | Refresh token lifetime |
| `CLIENT_URL` | ✗ | `http://localhost:5173` | Allowed CORS origin |
| `LOG_LEVEL` | ✗ | `info` | Winston log level |

### Client (`client/.env`)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VITE_API_URL` | ✗ | `/api` | Base URL of the Express API |

> **⚠️ Never commit `.env` files.** They are listed in `.gitignore`.

---

## 🧪 Running Tests

```bash
# Server unit + integration tests
cd server && npm test

# (Client tests can be added with Vitest — scaffold is included)
```

---

## 📁 Git Commit Convention

This project follows [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add collaborator role management
fix: prevent duplicate collaborator entries
chore: update dependencies
docs: add API endpoint table to README
refactor: extract JWT helpers to utils/jwt.js
test: add auth controller integration tests
```

---

## 🛡️ Security Highlights

- Passwords hashed with **bcrypt** (cost factor 12)
- Access tokens expire in **15 minutes**; refresh tokens are single-use (rotation on every refresh)
- All routes protected by the `protect` middleware; access-control checked at controller level
- **Helmet** sets security headers
- **express-mongo-sanitize** strips `$` / `.` from user input to prevent NoSQL injection
- Global **rate limiter** (100 req / 15 min per IP)
- `.env` is git-ignored; only `.env.example` is committed

---

## 📄 License

MIT © 2026 CollabNotes Contributors
