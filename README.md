# FLAUS Staff Hub

Internal staff and contractor portal for timesheets, surveys, contracts, training, and incident reporting.

## Stack

- Next.js 16 + Payload CMS 3.x (single `apps/staff` app)
- PostgreSQL 16
- `@flaus/ui-forms` — ported form/signature components

## Local development

```bash
docker compose up -d
cd apps/staff
cp .env.example .env
npm install
npm run dev
```

Open http://localhost:3000 — admin at `/admin`, portal at `/dashboard`.

Default local DB: `postgresql://staff:staff_dev@localhost:5433/staff_hub`

## Deploy

Render blueprint: `render.yaml` at repo root. Set `NEXT_PUBLIC_SERVER_URL` and `SEED_ADMIN_PASSWORD` in dashboard.

Production URL: https://staff.flaus.com.au
