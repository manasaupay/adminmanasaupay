# Vercel deploy — admin panel

## Root Directory (required)

Git repository root is **`Manasa-Upay/`**, not this folder alone.

In Vercel → **Settings → General → Root Directory**:

```
manasa_upay/admin
```

Do **not** use `admin` alone — Vercel will look for `Manasa-Upay/admin/package.json` (does not exist).

## Push to Git first

```bash
cd C:\Manasa-Upay
git add manasa_upay/admin manasa_upay
git commit -m "Add admin panel"
git push
```

## Environment variables

Set in Vercel → **Settings → Environment Variables**:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## After changing Root Directory

**Redeploy** from the Deployments tab.

Successful build log should show: `Detected Next.js` and routes like `/`, `/businesses`.
