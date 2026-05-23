# TaskFlow — Team Task Manager

A full-stack team task management web app with role-based access control, project management, and real-time task tracking.

## 🚀 Features

- **Authentication** — JWT-based signup/login with secure password hashing
- **Role-Based Access Control** — Admin and Member roles with granular permissions
- **Project Management** — Create, manage, and archive projects with color coding
- **Task System** — Create tasks with status (Todo/In Progress/Review/Done), priority (Low/Medium/High/Urgent), assignees, and due dates
- **Kanban Board** — Drag-free visual board per project
- **Dashboard** — Stats overview, tasks assigned to you, overdue alerts
- **Team Management** — Admin can promote/demote members, remove users
- **Comments** — Per-task comment threads
- **Overdue Detection** — Automatic overdue flagging on tasks

## 🛠 Tech Stack

| Layer | Tech |
|-------|------|
| Backend | Node.js + Express |
| Database | SQLite (better-sqlite3) |
| Auth | JWT + bcryptjs |
| Frontend | React 18 + React Router v6 |
| Build | Vite |
| Deploy | Railway |

## ⚙️ Local Setup

```bash
# 1. Clone the repo
git clone <your-repo-url>
cd taskflow

# 2. Install all dependencies
npm run install:all

# 3. Set environment variables
cp .env.example .env
# Edit .env with your JWT_SECRET

# 4. Start development
# Terminal 1: Backend
npm run dev

# Terminal 2: Frontend
cd client && npm run dev
```

Open http://localhost:5173 (frontend) — proxied to backend on :5000

## 🌐 Deployment (Railway)

1. Push code to GitHub
2. Create new project on [Railway](https://railway.app)
3. Connect GitHub repo
4. Add environment variable: `JWT_SECRET=your-secret-key`
5. Railway auto-builds with `postinstall` (builds React) and runs `npm start`

## 👤 Role Permissions

| Permission | Admin | Member |
|---|---|---|
| Create/delete projects | ✅ | ❌ |
| Manage team members | ✅ | ❌ |
| Change user roles | ✅ | ❌ |
| Create & edit tasks | ✅ | ✅ |
| Comment on tasks | ✅ | ✅ |
| View project board | ✅ | ✅ |

> **First user to sign up is automatically Admin.**

## 📁 Project Structure

```
taskflow/
├── server/
│   ├── database/db.js      # SQLite schema + init
│   ├── middleware/auth.js  # JWT auth middleware
│   ├── routes/
│   │   ├── auth.js         # Signup, login, profile
│   │   ├── projects.js     # Project CRUD + members
│   │   ├── tasks.js        # Task CRUD + comments
│   │   └── users.js        # User management
│   └── index.js            # Express app entry
├── client/
│   └── src/
│       ├── pages/          # Dashboard, Projects, Tasks, Team
│       ├── components/     # TaskCard, TaskModal, Layout
│       ├── context/        # Auth context
│       └── utils/api.js    # API helper
├── railway.toml
└── package.json
```

## 🔌 API Endpoints

```
POST   /api/auth/signup
POST   /api/auth/login
GET    /api/auth/me

GET    /api/projects
POST   /api/projects
GET    /api/projects/:id
PATCH  /api/projects/:id
DELETE /api/projects/:id
POST   /api/projects/:id/members
DELETE /api/projects/:id/members/:userId

GET    /api/tasks
GET    /api/tasks/stats
GET    /api/tasks/my
GET    /api/tasks/project/:projectId
POST   /api/tasks
PATCH  /api/tasks/:id
DELETE /api/tasks/:id
GET    /api/tasks/:id/comments
POST   /api/tasks/:id/comments

GET    /api/users
PATCH  /api/users/:id/role
DELETE /api/users/:id
```
