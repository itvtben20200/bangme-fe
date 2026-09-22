# BangMe Setup Guide for Another Computer

This guide is for a developer or AI assistant setting up BangMe on a fresh computer. The frontend and backend are separate Git repositories, so clone both repos side by side.

## 1. Repositories

| Repo | URL | Local folder |
| --- | --- | --- |
| Frontend | `https://github.com/itvtben20200/bangme-fe.git` | `soundfan/dev/bangme-fe` |
| Backend | `https://github.com/itvtben20200/bangme-be.git` | `soundfan/dev/bengme-be` |

Recommended local layout:

```text
soundfan/
  dev/
    bangme-fe/
    bengme-be/
```

## 2. Required software

Install these first:

- Git
- Node.js 20 or newer
- npm, included with Node.js
- PostgreSQL 16 or newer. PostgreSQL 18 also works.
- Optional: Redis, only if testing multi-instance Socket.IO scaling
- Optional: Stripe CLI, only if testing Stripe webhooks locally

Check versions:

```powershell
git --version
node --version
npm --version
psql --version
```

## 3. Clone both repos

```powershell
mkdir soundfan
cd soundfan
mkdir dev
cd dev

git clone https://github.com/itvtben20200/bangme-be.git bengme-be
git clone https://github.com/itvtben20200/bangme-fe.git bangme-fe
```

Use the branch requested by the project owner. At the time this guide was written, both repos use:

```powershell
git checkout 2024-06-first-version
```

Run that command inside each repo if Git did not already check out that branch.

## 4. Install dependencies

Backend:

```powershell
cd soundfan\dev\bengme-be
npm install
```

Frontend:

```powershell
cd ..\bangme-fe
npm install
```

## 5. Create environment files

Never commit real `.env` files.

Backend:

```powershell
cd soundfan\dev\bengme-be
Copy-Item .env.example .env
```

Frontend:

```powershell
cd ..\bangme-fe
Copy-Item .env.example .env.local
```

### Backend `.env`

Use these local values to start:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/bangme_db"
PORT=4002
NODE_ENV="development"
CORS_ORIGIN="http://localhost:3002"
USE_LOCAL_UPLOAD="true"
```

If you are not using Redis locally, remove or comment out `REDIS_URL` in `bengme-be/.env`. Do not leave it as `REDIS_URL=`, because the backend validates it as a URL when the variable exists.

Generate unique secrets for every computer/environment:

```powershell
node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"
```

Then fill:

```env
JWT_ACCESS_SECRET="REPLACE_WITH_64_BYTE_RANDOM_STRING"
JWT_REFRESH_SECRET="REPLACE_WITH_DIFFERENT_64_BYTE_RANDOM_STRING"
ADMIN_SECRET="REPLACE_WITH_STRONG_RANDOM_STRING"
```

For basic local work, these can stay as test placeholders until the related feature is needed:

```env
STRIPE_SECRET_KEY="sk_test_REPLACE_ME"
STRIPE_WEBHOOK_SECRET="whsec_REPLACE_ME"
STRIPE_CONNECT_WEBHOOK_SECRET="whsec_REPLACE_ME"
AGORA_APP_ID="REPLACE_ME"
AGORA_APP_CERTIFICATE="REPLACE_ME"
RESEND_API_KEY="re_REPLACE_ME"
```

Use local uploads unless production S3 credentials are available:

```env
USE_LOCAL_UPLOAD="true"
```

### Frontend `.env.local`

Use:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3002
NEXT_PUBLIC_API_URL=http://localhost:4002/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:4002
NEXT_PUBLIC_USE_LOCAL_UPLOAD=true
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_REPLACE_ME
NEXT_PUBLIC_AGORA_APP_ID=REPLACE_ME
NODE_ENV=development
```

## 6. Create PostgreSQL database

If `psql` is available in PATH:

```powershell
psql -U postgres -c "CREATE DATABASE bangme_db;"
```

If `psql` is not in PATH on Windows:

```powershell
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -c "CREATE DATABASE bangme_db;"
```

The expected local database connection is:

```text
host: localhost
port: 5432
database: bangme_db
user: postgres
password: postgres
```

If the password is different, update `DATABASE_URL` in `bengme-be/.env`.

## 7. Apply database migrations

From the backend folder:

```powershell
cd soundfan\dev\bengme-be
npm run db:generate
npm run db:migrate
```

Use `npm run db:migrate` for setup because it runs committed Prisma migrations with `prisma migrate deploy`.

Only use this when creating new migrations during development:

```powershell
npm run db:migrate:dev
```

Do not run `prisma migrate reset` unless you intentionally want to delete local data.

## 8. Load starter data or restore real data

Starter seed data:

```powershell
cd soundfan\dev\bengme-be
npm run db:seed
```

Seeded creator login details:

```text
Password for seeded creators: Creator@1234
aria.kim@bangme.dev
mia.russo@bangme.dev
sofia.vega@bangme.dev
leila.nour@bangme.dev
luna.park@bangme.dev
```

If real development data is needed, ask the project owner for a PostgreSQL dump. Real user data should not be committed to Git.

Restore a plain SQL dump:

```powershell
psql -U postgres -d bangme_db -f path\to\backup.sql
```

Restore a custom-format dump:

```powershell
pg_restore -U postgres -d bangme_db --clean --if-exists path\to\backup.dump
```

After restoring a backup:

```powershell
cd soundfan\dev\bengme-be
npm run db:generate
```

If local uploaded media must be preserved, also copy the old `bengme-be/uploads` folder into the new backend repo.

## 9. Run the backend

Terminal 1:

```powershell
cd soundfan\dev\bengme-be
npm run dev
```

Expected URLs:

```text
Backend: http://localhost:4002
API:     http://localhost:4002/api
Health:  http://localhost:4002/api/health
```

## 10. Run the frontend

Terminal 2:

```powershell
cd soundfan\dev\bangme-fe
npm run dev
```

Open:

```text
http://localhost:3002
```

## 11. Prisma Studio

Optional database UI:

```powershell
cd soundfan\dev\bengme-be
npm run db:studio
```

Open:

```text
http://localhost:5557
```

## 12. Verify setup

Backend:

```powershell
cd soundfan\dev\bengme-be
npm run typecheck
npm run build
```

Frontend:

```powershell
cd soundfan\dev\bangme-fe
npm run type-check
npm run build
```

Optional tests:

```powershell
cd soundfan\dev\bengme-be
npm test

cd ..\bangme-fe
npm test
```

Optional Playwright setup:

```powershell
cd soundfan\dev\bangme-fe
npm run playwright:install
npm run test:e2e
```

## 13. Common issues

### Backend cannot connect to database

Check `DATABASE_URL` and confirm PostgreSQL is running:

```powershell
psql -U postgres -d bangme_db -c "SELECT 1;"
```

### Frontend cannot reach backend

Confirm the backend is running on port `4002` and frontend `.env.local` has:

```env
NEXT_PUBLIC_API_URL=http://localhost:4002/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:4002
```

Restart `npm run dev` after changing `.env.local`.

### Port already in use

Default ports:

```text
frontend: 3002
backend: 4002
prisma studio: 5557
postgres: 5432
```

Find the process using a port:

```powershell
netstat -ano | findstr :4002
```

### Uploads do not work locally

Use local uploads:

```env
USE_LOCAL_UPLOAD="true"
NEXT_PUBLIC_USE_LOCAL_UPLOAD=true
```

### Stripe, Agora, email, or S3 features fail

Those features need real service credentials. Basic app setup can run with placeholders, but payments, live streaming, email delivery, and production uploads require valid keys.

## 14. Handoff checklist

Ask the project owner for:

- Correct frontend and backend branches
- Backend `.env` values, excluding secrets that should be regenerated locally
- Frontend `.env.local` values
- PostgreSQL dump, if real development data is needed
- `uploads` folder copy, if local uploaded media must be preserved
- Stripe test keys and webhook secrets
- Agora app ID and certificate
- Resend API key and verified sender domain
- AWS S3 bucket, region, access key, secret key, and CloudFront domain if not using local uploads
- Render, Vercel, or other hosting access if deploying instead of running locally

## 15. Quick start summary

Terminal 1:

```powershell
mkdir soundfan
cd soundfan
mkdir dev
cd dev
git clone https://github.com/itvtben20200/bangme-be.git bengme-be
git clone https://github.com/itvtben20200/bangme-fe.git bangme-fe

cd bengme-be
npm install
Copy-Item .env.example .env
psql -U postgres -c "CREATE DATABASE bangme_db;"
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

Terminal 2:

```powershell
cd soundfan\dev\bangme-fe
npm install
Copy-Item .env.example .env.local
npm run dev
```

Open `http://localhost:3002`.
