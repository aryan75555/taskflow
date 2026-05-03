# Taskflow — Project Management App

A full-stack project management application with role-based access control, task tracking, and real-time dashboards.

## Live Demo
🔗 **Live URL:** [Your Railway URL here]  
📁 **GitHub Repo:** [Your GitHub URL here]

---

## Features

### Authentication
- JWT-based signup & login
- Persistent sessions with automatic token refresh
- Role-based accounts: **Admin** and **Member**

### Project Management
- Create, update, delete projects (Admin)
- Project status tracking: Active / On Hold / Completed
- Progress visualization with task completion bars
- Per-project role assignment

### Task Tracking
- Kanban board with three columns: To Do / In Progress / Done
- One-click status cycling
- Priority levels: Low / Medium / High (color-coded)
- Due dates with overdue detection
- Task assignment to project members
- Admin: full CRUD on tasks
- Member: can update status of assigned tasks only

### Dashboard
- Personalized greeting + date
- Stats: total projects, open tasks, in-progress, overdue
- My tasks panel (assigned + not done)
- Overdue alerts panel
- Project progress cards

### Role-Based Access Control
| Feature | Admin | Member |
|---|---|---|
| Create project | ✅ | ✅ |
| Edit/delete project | ✅ (own projects) | ❌ |
| Add/remove members | ✅ | ❌ |
| Create/delete tasks | ✅ | ❌ |
| Update any task | ✅ | ❌ |
| Update assigned task status | ✅ | ✅ |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, React Router v6, Axios, Vite |
| Backend | Node.js, Express.js |
| Database | PostgreSQL (pg) |
| Auth | JWT + bcryptjs |
| Validation | express-validator |
| Deployment | Railway |

---

## Local Development

### Prerequisites
- Node.js 18+
- PostgreSQL database (local or [Neon](https://neon.tech) free tier)

### Setup

```bash
# Clone the repo
git clone <your-repo-url>
cd project-manager

# Install dependencies
npm run install:all

# Configure environment
cp .env.example backend/.env
# Edit backend/.env with your DATABASE_URL and JWT_SECRET

# Start both servers
npm run dev
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

### Demo accounts (after seeding)
Create these accounts via the signup page:
- `admin@demo.com` / `demo123` (role: admin)
- `member@demo.com` / `demo123` (role: member)

---

## Deployment on Railway

### Step 1: Create Railway Project
1. Go to [railway.app](https://railway.app) and sign in
2. Click **New Project** → **Deploy from GitHub Repo**
3. Connect your GitHub account and select this repository

### Step 2: Add PostgreSQL Database
1. In your Railway project, click **+ New**
2. Select **Database** → **Add PostgreSQL**
3. Railway automatically sets `DATABASE_URL` in your environment

### Step 3: Set Environment Variables
In Railway project settings → Variables, add:
```
JWT_SECRET=your-very-long-random-secret-here
NODE_ENV=production
```

### Step 4: Deploy
Railway auto-detects the `railway.toml` config and:
1. Runs `npm run build` (installs deps + builds React)
2. Starts with `npm start` (runs Express server)

### Step 5: Get Your URL
Railway provides a public URL in the format: `https://your-app.railway.app`

---

## API Reference

### Auth
```
POST   /api/auth/register   — Create account
POST   /api/auth/login      — Login, returns JWT
GET    /api/auth/me         — Get current user
GET    /api/auth/users      — List all users (for member search)
```

### Projects
```
GET    /api/projects           — List my projects
POST   /api/projects           — Create project
GET    /api/projects/:id       — Get project details
PUT    /api/projects/:id       — Update project (admin)
DELETE /api/projects/:id       — Delete project (admin)
GET    /api/projects/:id/members      — List members
POST   /api/projects/:id/members      — Add member (admin)
DELETE /api/projects/:id/members/:uid — Remove member (admin)
GET    /api/projects/:id/tasks        — List tasks
POST   /api/projects/:id/tasks        — Create task (admin)
```

### Tasks
```
GET    /api/tasks/:id   — Get task
PUT    /api/tasks/:id   — Update task (admin: all fields; member: status only if assigned)
DELETE /api/tasks/:id   — Delete task (admin)
```

### Dashboard
```
GET    /api/dashboard   — Aggregated stats, my tasks, overdue tasks, project progress
```

---

## Database Schema

```sql
users          — id, name, email, password, role, created_at
projects       — id, name, description, status, owner_id, created_at, updated_at
project_members— id, project_id, user_id, role (admin/member), joined_at
tasks          — id, project_id, title, description, status, priority,
                 assigned_to, due_date, created_by, created_at, updated_at
```

---

## Project Structure

```
project-manager/
├── package.json         # Root: build + start scripts
├── railway.toml         # Railway deployment config
├── backend/
│   ├── server.js        # Express entry point
│   ├── db.js            # PostgreSQL pool + schema init
│   ├── middleware/
│   │   └── auth.js      # JWT + role middleware
│   └── routes/
│       ├── auth.js      # /api/auth/*
│       ├── projects.js  # /api/projects/*
│       ├── tasks.js     # /api/tasks/*
│       └── dashboard.js # /api/dashboard
└── frontend/
    ├── vite.config.js
    └── src/
        ├── App.jsx
        ├── api/client.js      # Axios + interceptors
        ├── contexts/AuthContext.jsx
        ├── components/
        │   ├── Layout.jsx, Sidebar.jsx
        │   ├── Modal.jsx, TaskCard.jsx
        │   └── ProtectedRoute.jsx
        └── pages/
            ├── Login.jsx, Signup.jsx
            ├── Dashboard.jsx
            ├── Projects.jsx
            └── ProjectDetail.jsx
```
