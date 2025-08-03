# Noto Backend

A Node.js/Express backend for the Noto productivity app, providing authentication, user, and task management APIs. This backend is designed to work seamlessly with the Noto frontend.

---

## 🚀 Technologies Used

- **Node.js** (v18+)
- **Express.js**
- **TypeScript**
- **PostgreSQL** (via `pg`)
- **Docker & Docker Compose**
- **JWT Authentication**
- **CORS**
- **Cookie-based Auth**
- **Rate Limiting**
- **Nginx** (for production reverse proxy)

---

## 📁 Project Structure

```
/ (root)
│
├── AuthMiddleware.ts         # JWT authentication middleware
├── Dockerfile                # Docker build instructions
├── docker-compose.yml        # Multi-service orchestration
├── package.json              # Node.js dependencies and scripts
├── server.ts                 # Main Express server entry point
├── tsconfig.json             # TypeScript configuration
├── .env                      # Environment variables (not committed)
│
├── db/
│   └── dbConnection.ts       # PostgreSQL connection pool setup
│
├── routes/
│   ├── authRoutes.ts         # Auth endpoints (register, login, etc.)
│   ├── taskRoutes.ts         # Task CRUD endpoints
│   └── userRoutes.ts         # User profile endpoints
│
├── types/
│   └── express/
│       └── index.d.ts        # Express type extensions
│
└── .github/
    └── workflows/
        └── deploy.yml        # GitHub Actions CI/CD pipeline
```

---

## ⚙️ Setup & Development

1. **Clone the repository:**
   ```sh
   git clone https://github.com/Sizimon/noto-backend.git
   cd noto-backend
   ```

2. **Install dependencies:**
   ```sh
   npm install
   ```

3. **Configure environment variables:**
   - Copy `.env.example` to `.env` and fill in your values (Postgres, JWT secret, etc).

4. **Run locally (with Docker):**
   ```sh
   docker-compose up --build
   ```
   Or run with Node.js:
   ```sh
   npm run dev
   ```

5. **API Endpoints:**
   - All endpoints are prefixed with `/noto-backend/api/` (e.g., `/noto-backend/api/auth/login`).

---

## 🗄️ Environment Variables

- `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT`, `DB_NAME` (or `NOTO_DB_*` for Noto DB)
- `JWT_SECRET`, `SECRET_KEY`
- `NODE_ENV`

---

## 🐳 Docker & Deployment

- Production deployments use Docker and Nginx as a reverse proxy.
- See `docker-compose.yml` and `Dockerfile` for details.
- CI/CD is handled via GitHub Actions (`.github/workflows/deploy.yml`).

---

## 📚 API Overview

- **Auth:** `/noto-backend/api/auth/register`, `/login`, `/me`, etc.
- **Tasks:** `/noto-backend/api/tasks/...`
- **Users:** `/noto-backend/api/users/...`

---

## 📦 Folder/Service Structure

- `noto-backend` (this repo): Express API
- `noto-database`: PostgreSQL (via Docker)
- `noto-frontend`: React/Next.js frontend ([see below](#frontend-link))

---

## 🔗 Frontend

The frontend for this project can be found here:

[https://github.com/Sizimon/noto-frontend](https://github.com/Sizimon/noto-frontend/blob/main/README.md)

---
