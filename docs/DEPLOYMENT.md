# Deployment — ReconcileIQ

## Live demo (Vercel)

Current production demo (project `reconcile-iq`):

- https://reconcile-iq-eight.vercel.app

Deploy from `apps/web`:

```bash
cd apps/web
vercel --prod
```

Notes:
- Browser matching engine needs **no** backend env vars.
- Optional: set `NEXT_PUBLIC_API_URL` only if a public FastAPI is available.
- Root `vercel.json` documents monorepo intent; primary deploy root used historically is `apps/web`.
- Alias `reconcile-iq.vercel.app` may already be occupied by another project on the account — use the assigned `*.vercel.app` URL.

## Local full stack

```bash
# from repo root (Windows)
start.bat

# or manually
cd apps/api
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

cd ../web
npm install
# optional API binding
# set NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
npm run dev
```

## Environment

See `.env.example`:

- `NEXT_PUBLIC_API_URL` — optional FastAPI base URL
- `CORS_ORIGINS` / `API_HOST` / `API_PORT` — local API settings

Never commit real `.env` files.

## Backend hosting (optional Phase 2)

FastAPI can be hosted on Render/Fly/Railway. Point `NEXT_PUBLIC_API_URL` at that service and keep CORS restricted to the Vercel domain.
