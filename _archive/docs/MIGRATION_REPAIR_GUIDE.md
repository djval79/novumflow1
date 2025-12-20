# 🛠️ Supabase Migration Repair Guide

## Issue
You recently consolidated your database migrations into the root `supabase/migrations` folder. Your remote database history might still reference the old folder structure or be missing entries for the older migrations that are now in the root.

## Solution
You need to align the remote migration history with your new local folder.

### Step 1: Check Status
Run this command to see the difference:
```bash
npx supabase migration list
```

### Step 2: Repair History
If you see migrations listed as "Local" (unapplied) that you know are already in the database (e.g., the `1762...` files), you should mark them as applied without running them again.

**Run this for EACH migration file that is already in these DB but shows as unapplied:**
```bash
npx supabase migration repair <version_number> --status applied
```
*Example:* `npx supabase migration repair 1762940000 --status applied`

### Step 3: Verify
Run `npx supabase migration list` again. It should show all migrations as "Synced".

### Step 4: Push Future Changes
Once synced, you can safely run:
```bash
npx supabase db push
```
