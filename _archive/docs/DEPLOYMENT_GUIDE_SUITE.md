# Deployment Guide: NovumFlow & CareFlow Suite

This guide outlines the steps to deploy the fully integrated suite to production (e.g., Vercel).

## 1. Database Migrations
You have a pending migration for the new "Digital Skills Tracker".
Run this in your **local terminal** (from the root or hr-recruitment-platform folder depending on your setup) to apply it to your linked Supabase project:
```bash
supabase db push
```

**If that fails due to history mismatch**, run the contents of `supabase/migrations/20251217003000_digital_skills.sql` directly in the [Supabase SQL Editor](https://supabase.com/dashboard/project/_/sql).

## 2. Environment Variables (Critical for Cross-App Sync)
For the applications to link to each other correctly in production, you must set these environment variables in your Vercel project settings.

### Project: NovumFlow (HR Platform)
- `VITE_SUPABASE_URL`: [Your Supabase Url]
- `VITE_SUPABASE_ANON_KEY`: [Your Anon Key]
- **`VITE_CAREFLOW_URL`**: `https://careflow-ai.vercel.app` (Deployed)

### Project: CareFlow AI (Care Delivery)
- `VITE_SUPABASE_URL`: [Your Supabase Url]
- `VITE_SUPABASE_ANON_KEY`: [Your Anon Key]
- **`VITE_NOVUMFLOW_URL`**: `https://hr-recruitment-platform.vercel.app` (Deployed)

## 4. Supabase Edge Functions
We have deployed `sync-to-careflow`. Ensure it has access to the service role key if it uses it (it creates its own client with `Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')`).
You can verify secrets with:
```bash
supabase secrets list
```
If `SUPABASE_SERVICE_ROLE_KEY` is missing (it's usually auto-injected but good to check), set it.

## 4. Build & Deploy
Both applications are standard Vite React apps.
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

## 5. Verification Checklist
After deployment:
1.  **Login** to NovumFlow.
2.  Go to **Training & Development** -> check if "Digital Skills" widget appears.
3.  Go to **HR Module** -> Sync an employee.
4.  Click **"Open CareFlow"** in the sidebar/header (this tests the `VITE_CAREFLOW_URL` env var).
5.  In **CareFlow**, try to create a shift for that employee.
