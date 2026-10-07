# VPD Technologies — Full-Stack Enterprise Platform

Combined monorepo: **React/Vite Frontend** and **FastAPI + PostgreSQL Backend**, supporting the **7 Core Enterprise Portals** of VPD Technologies.

```
vpd-platform/
├── frontend/            # Vite + React (see frontend/README.md)
│   └── docker/          # Production Dockerfile + Nginx configuration
├── backend/             # FastAPI + SQLAlchemy + PostgreSQL + Redis (see backend/README.md)
│   └── docker/          # Production Dockerfile & Compose setup
├── docker-compose.yml   # Multi-container orchestration (Frontend + Backend + Redis)
└── .github/workflows/   # Path-scoped CI/CD pipelines
```

---

## 1. The 7 Core Portals & Ecosystem

| Portal | Main Users | Purpose |
|---|---|---|
| **Public Website** | Visitors, Candidates | Corporate website, services, careers, blog, enquiries, tech partners |
| **Admin / Super Admin Portal** | Super Admin, Admin, Finance, Support | Organization-wide administration, users, audit logs, settings |
| **Sales / CRM Portal** | Sales | Lead pipeline, requirements gathering, proposals, contracts & conversion |
| **HR Portal** | HR | Recruitment, onboarding, attendance, leaves, employee lifecycle |
| **Project / Delivery Portal** | Project Manager | Projects, milestones, deliverables, task tracking |
| **Employee Portal** | Employee, Developer, QA, Support staff | Daily work dashboard, check-in/out, leaves, timesheets |
| **Client Portal** | Clients | Project tracking, contracts, invoices, support tickets, reports |

---

## 2. Quick Start: Local Development

### Running with Docker Compose

```bash
docker compose up -d --build
docker compose exec backend alembic upgrade head
docker compose exec backend python -m app.seeders.seed
```

- **Frontend**: `http://localhost` (Nginx port 80 - proxies `/api/*` to FastAPI)
- **Backend API Docs**: `http://localhost:8000/docs` (FastAPI Swagger UI)

### Running Locally without Docker

**Terminal 1 — Backend (FastAPI)**:
```bash
cd backend
python -m venv .venv
# On Windows PowerShell:
.\.venv\Scripts\Activate.ps1
# On Linux/macOS:
source .venv/bin/activate

pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload
```

**Terminal 2 — Frontend (React/Vite)**:
```bash
cd frontend
npm install
npm run dev
```

---

## 3. Technology Stack

- **Backend**: Python 3.12, FastAPI, SQLAlchemy 2.0 (Async), Alembic, Pydantic v2
- **Database**: PostgreSQL (Asyncpg) + Redis 7 (Caching & Rate Limiting)
- **Auth**: VPD-owned Cookie-based Session Tokens, Argon2id hashing, CSRF protection & account lockout
- **Frontend**: React, Vite
- **Deployment**: Docker, Nginx, GitHub Actions CI/CD
