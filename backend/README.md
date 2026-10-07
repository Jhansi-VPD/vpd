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

<<<<<<< HEAD
### Migrations: local vs. staging
`backend/scripts/migrate.sh` runs Alembic against either environment's `.env`
file, via the `ENV_FILE` mechanism in `app/core/config.py` (not bash
`source`-ing, which breaks on values containing bash-special characters like
`BREVO_SENDER_NAME`'s spaces or a `Name <email>`-shaped value):
```bash
bash scripts/migrate.sh local              # local Postgres container
bash scripts/migrate.sh staging            # staging Postgres (.env.staging)
bash scripts/migrate.sh both               # both, in sequence — use after generating a new revision
bash scripts/migrate.sh local downgrade -1 # extra args pass through to alembic
```

Interactive API docs: `http://localhost:8000/docs` (Swagger) or `/redoc`.

Default seeded accounts — these six are the only logins accepted by
`POST /api/v1/auth/login` (see `LOGIN_ALLOWLIST` in `app/routers/auth.py` and
`../docs/credentials.md` for details):
```
Admin:          admin@vpdtechnologies.com          / Password123!
Manager (PM):   pm@vpdtechnologies.com             / Password123!
HR:             hr@vpdtechnologies.com             / Password123!
Sales:          sales@vpdtechnologies.com          / Password123!
Client:         client@vpdtechnologies.com         / Password123!
Employee:       employee@vpdtechnologies.com       / Password123!
```

### Running with Docker

The compose files live at the repo root (`F:\ADP\corefusion\CF-main`), not
under `backend/`, so this stack can bring up `backend` + `frontend` + `redis`
+ a local `postgres` + a local `minio` together.

**Local dev** (default — `docker-compose.yml` + the auto-loaded
`docker-compose.override.yml`, which adds the local Postgres and MinIO
containers):
```bash
cp backend/.env.example backend/.env
docker compose up -d postgres redis minio
docker compose run --rm backend alembic upgrade head   # first-time schema setup
docker compose up -d backend frontend
```
API available at `http://localhost:8000`.

**Staging** (explicit `-f`, uses `backend/.env.staging` — optionally a
Supabase-hosted Postgres as the database layer only, no local `postgres`
service):
```bash
cp backend/.env.staging.example backend/.env.staging   # fill in staging DB_* values
docker compose -f docker-compose.yml -f docker-compose.staging.yml run --rm backend alembic upgrade head
docker compose -f docker-compose.yml -f docker-compose.staging.yml up -d backend frontend
```

### Pairing with the CoreFusion frontend

This backend is designed to pair with the CoreFusion frontend (Vite/React).
If you're using the combined `corefusion-platform` monorepo, it's the sibling
`../frontend` folder and its dev server proxies straight to `uvicorn` on
`:8000` — no CORS setup is needed for local dev. Just run both:

```bash
# terminal 1
uvicorn app.main:app --reload

# terminal 2 (in ../frontend/)
npm run dev
```

`app/main.py`'s CORS middleware also explicitly allows `http://localhost:5173`
(Vite's default port) as a fallback for non-proxied requests. See the
frontend's README ("Connecting to the Backend") for the full picture.

---

## 6. API Conventions

- Base URL: `/api/v1`
- Auth: httpOnly `cf_access_token` / `cf_refresh_token` cookies, set by
  `POST /api/v1/auth/login`. State-changing requests also require the
  `X-CSRF-Token` header to match the non-httpOnly `cf_csrf_token` cookie
  (double-submit CSRF pattern, `CSRFMiddleware`).
- Responses: `{ success, status_code, message, data, meta? }`
- Pagination: `?page=1&limit=20&sort=-created_at&search=keyword`
- Errors: `{ success: false, status_code, message, errors?: [{field, message}] }`

### Key endpoints
```
POST   /api/v1/auth/register
POST   /api/v1/auth/login
POST   /api/v1/auth/refresh
POST   /api/v1/auth/logout
POST   /api/v1/auth/logout-all
GET    /api/v1/auth/me
POST   /api/v1/auth/forgot-password
POST   /api/v1/auth/reset-password
POST   /api/v1/auth/verify-email
POST   /api/v1/auth/resend-verification
POST   /api/v1/auth/change-password
GET    /api/v1/auth/sessions
DELETE /api/v1/auth/sessions/{session_id}

# MFA/2FA — 404 unless MFA_ENABLED=true (see .env.example)
GET    /api/v1/auth/mfa/status
POST   /api/v1/auth/mfa/setup
POST   /api/v1/auth/mfa/enable
POST   /api/v1/auth/mfa/disable
POST   /api/v1/auth/mfa/verify-login
POST   /api/v1/auth/mfa/backup-codes/regenerate

# OAuth — 404 unless OAUTH_ENABLED=true AND that provider's credentials are set
GET    /api/v1/auth/oauth/{provider}/login       (provider: google | github)
GET    /api/v1/auth/oauth/{provider}/callback

GET    /api/v1/projects                    (public: published only)
GET    /api/v1/services
GET    /api/v1/careers
POST   /api/v1/careers/{career_id}/apply    (multipart/form-data, field "resume")
POST   /api/v1/contact

GET    /api/v1/employees/me/profile         (Employee Portal, auth required)
GET    /api/v1/clients/me/projects          (Client Portal, auth required)
GET    /api/v1/dashboard/overview           (Admin Panel, admin/PM/finance/sales only)
```

---

## 7. Security Notes for Production
- Put the API behind HTTPS (terminate TLS at Nginx/load balancer) — cookies are marked `Secure` and rely on this.
- Swap local disk uploads (`app/utils/uploads.py`) for S3/GCS.
- Run `alembic upgrade head` on deploy instead of relying on ad-hoc table creation.
- Rotate the default seeded admin password immediately.
- MFA/2FA and OAuth are implemented but off by default — turn on with `MFA_ENABLED`/`OAUTH_ENABLED` in `.env` when the product is ready for them; `MFA_ENCRYPTION_KEY` must be a real Fernet key before `MFA_ENABLED=true` (see `.env.example`).
- Gunicorn worker count in `docker/Dockerfile` should scale with CPU cores (`2 * cores + 1`).
=======
Interactive API Documentation is available at `http://localhost:8000/docs`.
>>>>>>> 4207aae36edb798bb789d2eb0814ea1ced2a944b
