# Vercel Environment Variables Not Applied - Troubleshooting

## Issue
The E2E test is still failing with "Invalid login credentials" after updating Vercel environment variables and redeploying.

## Evidence
- Asset bundle changed: `index-C8bTnhvH.js` → `index-9UTu39Fx.js` (deployment happened)
- Still getting "Invalid login credentials" (old Supabase config still active)

## Possible Causes
1. Environment variables set for wrong environment (Production vs Preview vs Development)
2. Build cache not cleared
3. Variables need to be set for all environments

---

## Solution Steps

### Step 1: Verify Environment Variable Settings

In Vercel Dashboard → Settings → Environment Variables:

**Make sure BOTH variables are set for ALL environments:**

| Variable Name | Value | Environments |
|--------------|-------|--------------|
| `VITE_SUPABASE_URL` | `https://niikshfoecitimepiifo.supabase.co` | ✅ Production<br>✅ Preview<br>✅ Development |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | ✅ Production<br>✅ Preview<br>✅ Development |

### Step 2: Force Clean Redeploy

1. Go to **Deployments** tab
2. Find the latest deployment
3. Click the **three dots (...)** menu
4. Select **"Redeploy"**
5. ✅ **Check "Use existing Build Cache"** → **UNCHECK IT** (force fresh build)
6. Click **"Redeploy"**

### Step 3: Wait for Deployment

Wait for the deployment to complete (usually 1-2 minutes)

### Step 4: Verify in Browser

Before running tests, manually verify:

1. Open `https://bgffggjfgcfnjgcj.vercel.app/login` in browser
2. Open Developer Tools (F12) → Console
3. Try logging in with:
   - Email: `e2e.test@novumflow.com`
   - Password: `TestPassword123!`
4. Check console for errors - should see connection to `niikshfoecitimepiifo.supabase.co`

### Step 5: Run E2E Test

```bash
cd hr-recruitment-platform
npx playwright test tests/recruitment_flow.spec.ts --project=chromium
```

---

## Alternative: Test Locally (Guaranteed to Work)

If Vercel continues to have issues, test against your working local dev server:

### 1. Update Test URLs

Edit `tests/recruitment_flow.spec.ts`:

```typescript
// Change line 8:
await page.goto('http://localhost:5173/login');

// Change line 32:
await page.goto('http://localhost:5173/recruitment');
```

### 2. Start Dev Server

```bash
cd hr-recruitment-platform
npm run dev
```

### 3. Run Tests (in another terminal)

```bash
cd hr-recruitment-platform
npx playwright test tests/recruitment_flow.spec.ts
```

This will work because:
- ✅ Local dev server uses correct Supabase config
- ✅ Test user exists in that database
- ✅ No deployment/caching issues

---

## Quick Verification Command

To check if Vercel picked up the new config, inspect the page source:

```bash
curl -s https://bgffggjfgcfnjgcj.vercel.app | grep -i supabase
```

You should see references to `niikshfoecitimepiifo.supabase.co` in the output.

---

## Summary

**Recommended Path:**
1. Verify env vars are set for ALL environments (Production, Preview, Development)
2. Redeploy WITHOUT build cache
3. Wait for completion
4. Test manually in browser first
5. Run E2E tests

**Fallback Path:**
- Test locally (guaranteed to work immediately)
