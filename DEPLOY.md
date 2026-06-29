# Deploying staff-hub to Render

1. Push `staff-hub` to GitHub (`flaus44/staff-hub` suggested).
2. Render Dashboard → New Blueprint → point at repo root `render.yaml`.
3. Set env vars before first deploy:
   - `NEXT_PUBLIC_SERVER_URL` = `https://www.flaus.com.au/staff` (public URL users see via marketing site rewrites)
   - `SEED_ADMIN_PASSWORD` = strong password for first admin seed
4. Staff Hub is served at `https://www.flaus.com.au/staff` (and `https://flaus.com.au/staff`) via Vercel rewrites on the marketing site — set `STAFF_HUB_ORIGIN` on Vercel to this Render service URL (e.g. `https://staff-hub-xxx.onrender.com`). No separate staff subdomain.
5. If Payload admin CORS issues appear when using the public URL, add `https://www.flaus.com.au` and `https://flaus.com.au` to `cors` in `payload.config.ts` (already included alongside `NEXT_PUBLIC_SERVER_URL`).
6. First deploy runs Docker build + Payload migrations via `docker-entrypoint.sh`.
7. Seed admin (one-time): set `PAYLOAD_SEED=true` for one deploy, then remove.

Local production test:

```powershell
cd apps/staff
$env:PAYLOAD_SECRET="..."
$env:DATABASE_URL="..."
npm run build
npm start
```

Marketing site: set `STAFF_HUB_ORIGIN` on Vercel to the Render service origin. Staff sign-in: `https://www.flaus.com.au/staff/login`.
