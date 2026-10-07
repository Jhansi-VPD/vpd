# VPD Technologies — FastAPI Backend

A production-ready Python/FastAPI + PostgreSQL backend powering the website, Admin Panel, Sales CRM, HR Portal, Project/Delivery Portal, Employee Portal, and Client Portal for VPD Technologies.

---

## 1. Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Python 3.12, FastAPI |
| Database | PostgreSQL (SQLAlchemy 2.0 async ORM + asyncpg) |
| Migrations | Alembic |
| Auth | **Fully VPD-owned** (`app/services/auth_service.py`) — opaque, database-backed session tokens (httpOnly cookies), Argon2id password hashing, refresh-token rotation with reuse detection, account lockout, CSRF protection. |
| Cache | Redis 7 — local container / managed Redis |
| Validation | Pydantic v2 |
| File uploads | Local disk by default, or S3-compatible storage |
| Email | Brevo transactional HTTP API (`app/services/email_service.py`) |
| Rate limiting | slowapi |
| Server | Uvicorn (dev) / Gunicorn + Uvicorn workers (prod) |
| Deployment | Docker, Docker Compose, Nginx, GitHub Actions |

---

## 2. Supported Portals & Roles

| Portal | Roles |
|---|---|
| **Public Website** | Visitors, Candidates (Unauthenticated) |
| **Admin / Super Admin Portal** | `super_admin`, `admin`, `finance`, `support` |
| **Sales / CRM Portal** | `sales` |
| **HR Portal** | `hr` |
| **Project / Delivery Portal** | `project_manager` |
| **Employee Portal** | `employee`, `developer`, `qa`, `support` |
| **Client Portal** | `client` |

---

## 3. Folder Structure

```
backend/
├── app/
│   ├── core/          # Config, database engine, password/token hashing, dependencies, logger, errors
│   ├── models/        # SQLAlchemy models (Async, UUID PKs, soft-delete) + enums
│   ├── schemas/       # Pydantic request/response models grouped by domain
│   ├── crud/          # CRUDBase — generic async list/get/create/update/delete
│   ├── routers/       # FastAPI routers mounted in routers/__init__.py
│   ├── services/      # auth_service, email_service, storage_service, lead_pipeline, project_provisioning
│   ├── utils/         # responses, pagination, router_factory, uploads
│   ├── seeders/       # seed.py — reference data & admin accounts
│   └── main.py       # FastAPI application entrypoint
├── alembic/            # Database migrations
├── docker/             # Dockerfile & Compose setup
├── tests/              # pytest test suite
└── requirements.txt
```

---

## 4. Setup & Running Locally

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

Interactive API Documentation is available at `http://localhost:8000/docs`.
