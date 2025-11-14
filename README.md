# Alter Analytics Backend (Cleaned)

Minimal, ready-to-run Node.js + Express backend for the analytics project.

## What's included
- Express app with health route and simple endpoints
- PostgreSQL SQL migration (migrations/001_init.sql)
- Docker & docker-compose for local dev (Postgres + Redis)
- .env.example
- ESLint + Prettier configs
- GitHub Actions CI template
- Swagger (openapi.json) and served at `/api/docs`

## Quick start (local)
1. Copy `.env.example` -> `.env` and set values.
2. Create the database (if using local Postgres):
   ```
   psql -U postgres -c "CREATE DATABASE analyticsdb;"
   ```
3. Apply SQL migration:
   ```
   psql -U postgres -d analyticsdb -f migrations/001_init.sql
   ```
4. Install deps:
   ```
   npm install
   ```
5. Run dev server:
   ```
   npm run dev
   ```
6. Open Swagger UI: http://localhost:5000/api/docs

## Docker (recommended)
```
docker compose up --build
```

## Notes
- This project uses plain SQL migrations (migrations/001_init.sql). If you prefer Prisma/TypeORM let me know and I can regenerate.
- JWT and OAuth placeholders in `.env.example` — fill with your secrets.
