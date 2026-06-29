# Deploying staff-hub to Render

1. Push `staff-hub` to GitHub (`flaus44/staff-hub` suggested).
2. Render Dashboard → New Blueprint → point at repo root `render.yaml`.
3. Set env vars before first deploy:
   - `NEXT_PUBLIC_SERVER_URL` = `https://staff.flaus.com.au` (or Render URL initially)
   - `SEED_ADMIN_PASSWORD` = strong password for first admin seed
4. Add custom domain `staff.flaus.com.au` in Render service settings.
5. First deploy runs Docker build + Payload migrations via `docker-entrypoint.sh`.
6. Seed admin (one-time): set `PAYLOAD_SEED=true` for one deploy, then remove.

Local production test:

```powershell
cd apps/staff
$env:PAYLOAD_SECRET="..."
$env:DATABASE_URL="..."
npm run build
npm start
```

Marketing site staff link: `website/site` uses `STAFF_LOGIN_URL` (default `https://staff.flaus.com.au/login`).
