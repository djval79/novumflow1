# 🔐 CareFlow/NovumFlow Login Troubleshooting Guide

## 🎯 Quick Start - Create Admin Account

### Option 1: Use Quick Admin Setup (Easiest!)

1. **Go to the login page**: http://localhost:5173
2. **Look for the "Quick Admin Setup" box** in the bottom right corner
3. **Enter your email and password**:
   - Email: `admin@ringsteadcare.com` (or your preferred email)
   - Password: Minimum 6 characters (e.g., `Admin123!`)
4. **Click "Create Admin Account"**
5. **Wait for success message** and automatic redirect to dashboard

### Option 2: Use SQL Script (For existing users)

If you already have users in Supabase but can't log in:

```sql
-- Run this in Supabase Dashboard → SQL Editor

-- 1. Check if user exists
SELECT * FROM auth.users WHERE email = 'your@email.com';

-- 2. Grant admin access to existing user
UPDATE users_profiles 
SET role = 'Admin', 
    is_active = true,
    is_super_admin = true
WHERE email = 'your@email.com';

-- 3. If no profile exists, create one (replace USER_ID with actual ID from step 1)
INSERT INTO users_profiles (
  user_id, 
  email, 
  full_name, 
  role, 
  is_active
) VALUES (
  'USER_ID_FROM_AUTH_USERS',
  'your@email.com',
  'Administrator',
  'Admin',
  true
);
```

### Option 3: Create via Supabase Dashboard

1. Go to your Supabase project: https://supabase.com/dashboard
2. Navigate to **Authentication** → **Users**
3. Click **Add user** → **Create new user**
4. Enter email and password
5. Go to **Table Editor** → **users_profiles**
6. Click **Insert** → **Insert row**
7. Fill in:
   - `user_id`: Copy from auth.users table
   - `email`: Same as step 4
   - `full_name`: Your name
   - `role`: `Admin`
   - `is_active`: `true`

---

## 🐛 Common Login Problems & Solutions

### Problem 1: "Invalid email or password"

**Possible Causes**:
- Email/password typo
- User doesn't exist
- Email not confirmed

**Solutions**:

1. **Check Email Confirmation**:
   ```sql
   -- In Supabase SQL Editor
   SELECT email, email_confirmed_at, confirmed_at 
   FROM auth.users 
   WHERE email = 'your@email.com';
   ```
   
   If `email_confirmed_at` is NULL:
   ```sql
   -- Manually confirm email
   UPDATE auth.users 
   SET email_confirmed_at = NOW(), 
       confirmed_at = NOW()
   WHERE email = 'your@email.com';
   ```

2. **Reset Password**:
   - Go to http://localhost:5173/forgot-password
   - Or use Supabase Dashboard → Authentication → Users → ⋮ → Send password recovery

3. **Create User** (if doesn't exist):
   - Use Quick Admin Setup box on login page

---

### Problem 2: "User logged in but redirected back to login"

**Possible Causes**:
- Missing user profile in `users_profiles` table
- RLS (Row Level Security) policies blocking access

**Solutions**:

1. **Check if profile exists**:
   ```sql
   SELECT * FROM users_profiles 
   WHERE email = 'your@email.com';
   ```

2. **Create profile if missing**:
   ```sql
   -- First, get user_id from auth.users
   SELECT id FROM auth.users WHERE email = 'your@email.com';
   
   -- Then create profile
   INSERT INTO users_profiles (
     user_id,
     email,
     full_name,
     role,
     is_active
   ) VALUES (
     'USER_ID_HERE',
     'your@email.com',
     'Your Name',
     'Admin',
     true
   );
   ```

3. **Check RLS policies**:
   ```sql
   -- Temporarily disable RLS for testing (CAUTION!)
   ALTER TABLE users_profiles DISABLE ROW LEVEL SECURITY;
   
   -- Try logging in again
   -- If successful, re-enable RLS and fix policies:
   ALTER TABLE users_profiles ENABLE ROW LEVEL SECURITY;
   ```

---

### Problem 3: "Network Error" or "Failed to fetch"

**Possible Causes**:
- Supabase project is paused
- Internet connection issues
- CORS issues

**Solutions**:

1. **Check Supabase project status**:
   - Go to https://supabase.com/dashboard
   - Ensure project is active (not paused)

2. **Verify Supabase URL**:
   - Check `src/lib/supabase.ts`:
     ```typescript
     export const supabaseUrl = "https://niikshfoecitimepiifo.supabase.co";
     ```
   - Ensure this matches your project URL in Supabase Dashboard

3. **Check browser console** (F12):
   - Look for specific error messages
   - Check Network tab for failed requests

---

### Problem 4: "Email already registered" when creating account

**Solutions**:

1. **Try logging in** instead of signing up
2. **Reset password** if you forgot it
3. **Check if account is disabled**:
   ```sql
   SELECT is_active FROM users_profiles 
   WHERE email = 'your@email.com';
   
   -- Enable if disabled
   UPDATE users_profiles 
   SET is_active = true 
   WHERE email = 'your@email.com';
   ```

---

### Problem 5: Loading spinner never stops

**Possible Causes**:
- AuthContext stuck in loading state
- Race condition in authentication flow

**Solutions**:

1. **Clear browser cache**:
   - Open DevTools (F12)
   - Right-click Refresh button
   - Select "Empty Cache and Hard Reload"

2. **Clear Supabase session**:
   ```javascript
   // In browser console (F12)
   localStorage.clear();
   sessionStorage.clear();
   location.reload();
   ```

3. **Restart dev server**:
   ```bash
   # Stop current server (Ctrl+C)
   # Restart
   npm run dev
   ```

---

## 🔍 Diagnostic Checklist

Run through this checklist to identify the issue:

### [ ] 1. Dev Server Running
```bash
npm run dev
```
Should see: `Local: http://localhost:5173/`

### [ ] 2. Supabase Connection
Open browser console (F12) and run:
```javascript
fetch('https://niikshfoecitimepiifo.supabase.co/')
  .then(res => console.log('Supabase reachable:', res.status))
  .catch(err => console.error('Supabase unreachable:', err));
```

### [ ] 3. Test User Exists
In Supabase Dashboard → SQL Editor:
```sql
SELECT 
  u.email,
  u.email_confirmed_at,
  p.role,
  p.is_active
FROM auth.users u
LEFT JOIN users_profiles p ON u.id = p.user_id
WHERE u.email = 'your@email.com';
```

### [ ] 4. RLS Policies Active
```sql
SELECT * FROM pg_policies WHERE tablename = 'users_profiles';
```

### [ ] 5. Browser Console Errors
- Open DevTools (F12)
- Go to Console tab
- Look for red error messages
- Share these for debugging

---

## 🚀 Quick Fix Scripts

### Create Test Admin User
```sql
-- Run in Supabase SQL Editor

-- Create auth user (if doesn't exist)
-- Note: Password reset will be needed, or create via Dashboard

-- Create profile with admin access
INSERT INTO users_profiles (
  user_id,
  email,
  full_name,
  role,
  is_active,
  is_super_admin
) 
SELECT 
  id,
  email,
  'Test Administrator',
  'Admin',
  true,
  true
FROM auth.users 
WHERE email = 'admin@ringsteadcare.com'
ON CONFLICT (user_id) DO UPDATE
SET role = 'Admin',
    is_active = true,
    is_super_admin = true;
```

### Reset All User Permissions
```sql
-- Grant admin access to all active users (use with caution!)
UPDATE users_profiles
SET role = 'Admin',
    is_active = true
WHERE email LIKE '%@ringsteadcare.com';
```

### Verify Email for All Users
```sql
-- Confirm all emails (for development only!)
UPDATE auth.users
SET email_confirmed_at = NOW(),
    confirmed_at = NOW()
WHERE email_confirmed_at IS NULL;
```

---

## 🎛️ Environment Variables Check

Make sure you don't have `.env` file conflicts. Your Supabase config is in `src/lib/supabase.ts`:

```typescript
export const supabaseUrl = "https://niikshfoecitimepiifo.supabase.co";
export const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";
```

**Note**: These are hardcoded, so no `.env` file needed for Supabase.

---

## 📞 Still Having Issues?

### Step 1: Collect Debug Info

Run in browser console (F12):
```javascript
// Check current auth state
supabase.auth.getSession().then(data => console.log('Session:', data));
supabase.auth.getUser().then(data => console.log('User:', data));

// Check profile
supabase
  .from('users_profiles')
  .select('*')
  .then(data => console.log('Profiles:', data));
```

### Step 2: Check Supabase Logs

1. Go to Supabase Dashboard
2. Navigate to **Logs** → **Auth logs**
3. Look for failed login attempts
4. Check error messages

### Step 3: Test with Curl

```bash
# Test Supabase connection
curl -X POST 'https://niikshfoecitimepiifo.supabase.co/auth/v1/token?grant_type=password' \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email":"your@email.com","password":"yourpassword"}'
```

---

## 🎯 Recommended Login Flow

For the best experience:

1. **First Time Setup**:
   - Use Quick Admin Setup on login page
   - Creates user + profile with admin privileges
   - Automatic login after creation

2. **Subsequent Logins**:
   - Use email/password on login page
   - Automatic redirect to dashboard
   - Session persists across page refreshes

3. **Forgot Password**:
   - Click "Forgot password?" link
   - Enter email
   - Check email for reset link
   - Set new password
   - Login with new password

---

## 🔧 Developer Tools

### Useful Browser Extensions
- **React Developer Tools** - View component state
- **Redux DevTools** - If using Redux (not currently used)

### Quick Console Commands

```javascript
// Force logout
await supabase.auth.signOut();
localStorage.clear();
location.href = '/';

// Test login
await supabase.auth.signInWithPassword({
  email: 'your@email.com',
  password: 'yourpassword'
});

// Check current user
const { data } = await supabase.auth.getUser();
console.log(data);
```

---

**Last Updated**: 2025-11-26  
**App**: NovumFlow / CareFlow  
**Status**: ✅ Ready for Testing
