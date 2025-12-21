# 🔐 CareFlow AI - Login Fix Guide

## ✅ **CareFlow is Now Running!**

**Your CareFlow AI app is live at**: http://localhost:3000

---

## 🎯 **Quick Login Options**

CareFlow has **demo credentials** built into the login page! Here's how to use them:

### **Method 1: Use Demo Credentials (Easiest!)**

1. **Open**: http://localhost:3000
2. **Click on one of the Demo Credential buttons**:
   - **Admin** - `admin@careflow.ai`
   - **Carer** - `carer@careflow.ai`
   - **Family** - `family@careflow.ai`
   - **Client** - `client@careflow.ai`
3. **Password is shown**: `password123`
4. **Click "Sign In"**

### **Method 2: Create New Account**

1. **Open**: http://localhost:3000
2. **Click "Create Account" tab**
3. **Fill in**:
   - Full Name: Your name
   - Select Role: Carer or Admin
   - Email: your@email.com
   - Password: (minimum 6 characters)
4. **Click "Create Account"**
5. **Auto-login** to dashboard

---

## 🐛 **Common CareFlow Login Issues**

### Problem 1: "Invalid login credentials"

**Causes**:
- Wrong email/password
- User doesn't exist in database
- Email not confirmed

**Solutions**:

**A. Try Demo Credentials**:
- Admin: `admin@careflow.ai` / `password123`
- Carer: `carer@careflow.ai` / `password123`

**B. Create New Account**:
- Use the "Create Account" tab
- Fill in your details
- Auto-login after creation

**C. Run SQL Fix** (if demo accounts don't work):
```sql
-- In Supabase Dashboard → SQL Editor

-- 1. Check if users exist
SELECT email, email_confirmed_at FROM auth.users;

-- 2. Confirm all emails (for development)
UPDATE auth.users 
SET email_confirmed_at = NOW(),
    confirmed_at = NOW()
WHERE email_confirmed_at IS NULL;

-- 3. Create profiles for users without them
INSERT INTO users_profiles (
    user_id, 
    email, 
    full_name, 
    role, 
    is_active
)
SELECT 
    id,
    email,
    'System User',
    'admin',
    true
FROM auth.users u
WHERE NOT EXISTS (
    SELECT 1 FROM users_profiles p WHERE p.user_id = u.id
);
```

---

### Problem 2: Logged in but redirected back to login

**Cause**: Missing user profile in `users_profiles` table

**Solution**:

```sql
-- Run in Supabase Dashboard → SQL Editor

-- Get your user_id first
SELECT id, email FROM auth.users WHERE email = 'your@email.com';

-- Create profile (replace USER_ID_HERE)
INSERT INTO users_profiles (
    user_id,
    email,
    full_name,
    role,
    is_active,
    is_super_admin
) VALUES (
    'USER_ID_HERE',
    'your@email.com',
    'Your Name',
    'admin',
    true,
    true
);
```

---

### Problem 3: "Network error" / Can't connect

**Causes**:
- Supabase project paused
- Internet connection issue
- Wrong Supabase URL

**Solutions**:

1. **Check Supabase URL** in `lib/supabase.ts`:
   ```typescript
   export const supabaseUrl = "https://niikshfoecitimepiifo.supabase.co";
   ```

2. **Verify Project is Active**:
   - Go to https://supabase.com/dashboard
   - Check project status
   - Unpause if needed

3. **Test Connection**:
   ```bash
   curl https://niikshfoecitimepiifo.supabase.co
   ```

---

## 🔧 **SQL Diagnostic Scripts**

### Check All Users & Profiles

```sql
-- Run in Supabase Dashboard → SQL Editor

SELECT 
    u.email,
    u.email_confirmed_at,
    p.full_name,
    p.role,
    p.is_active,
    CASE 
        WHEN u.email_confirmed_at IS NULL THEN '❌ Email not confirmed'
        WHEN p.id IS NULL THEN '❌ No profile'
        WHEN p.is_active = false THEN '❌ Inactive'
        ELSE '✅ Ready to login'
    END as status
FROM auth.users u
LEFT JOIN users_profiles p ON u.id = p.user_id
ORDER BY u.created_at DESC;
```

### Create Test Admin User

```sql
-- Step 1: Create auth user via Supabase Dashboard → Authentication → Users
-- Email: admin@careflow.com, Password: Admin123!

-- Step 2: Run this to create profile
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
    'CareFlow Administrator',
    'admin',
    true,
    true
FROM auth.users
WHERE email = 'admin@careflow.com'
ON CONFLICT (user_id) DO UPDATE
SET role = 'admin', is_active = true, is_super_admin = true;
```

### Fix Missing Profiles

```sql
-- Creates profiles for all users who don't have them
INSERT INTO users_profiles (
    user_id,
    email,
    full_name,
    role,
    is_active
)
SELECT 
    u.id,
    u.email,
    COALESCE(u.raw_user_meta_data->>'full_name', 'User'),
    COALESCE(u.raw_user_meta_data->>'role', 'carer'),
    true
FROM auth.users u
LEFT JOIN users_profiles p ON u.id = p.user_id
WHERE p.id IS NULL;
```

---

## 🧪 **Testing Your CareFlow Login**

### Step 1: Access the App
```
http://localhost:3000
```

### Step 2: Try Demo Login
- Click **"Admin"** demo button
- Password auto-fills: `password123`
- Click **"Sign In"**

### Step 3: Check Browser Console (F12)
Look for:
- ✅ "Auth State Change: SIGNED_IN"
- ✅ "Profile Loaded: {role: 'admin'}"
- ❌ Any error messages

### Step 4: Verify Dashboard Access
- Should redirect to `/`
- Should see your name/role
- Should see dashboard content

---

## 📊 **CareFlow User Roles**

| Role | Access Level | Use Case |
|------|--------------|----------|
| **Admin** | Full access | System administrators |
| **Carer** | Care management | Care staff |
| **Family** | Limited view | Family members |
| **Client** | Personal data | Care recipients |

---

## 🔍 **Troubleshooting Checklist**

- [ ] CareFlow is running at http://localhost:3000
- [ ] Tried demo credentials (Admin/Carer)
- [ ] Checked Supabase project is active
- [ ] Verified email is confirmed (SQL query)
- [ ] Created user profile if missing (SQL query)
- [ ] Checked browser console for errors (F12)
- [ ] Cleared browser cache if needed

---

## 🆘 **Still Having Issues?**

### 1. Check Supabase Auth Logs
- Go to Supabase Dashboard
- Navigate to **Logs** → **Auth logs**
- Look for failed login attempts
- Check error messages

### 2. Test with Browser Console

Open browser console (F12) and run:

```javascript
// Check current auth state
const { data: { session } } = await supabase.auth.getSession();
console.log('Session:', session);

// Check user
const { data: { user } } = await supabase.auth.getUser();
console.log('User:', user);

// Check profile
const { data: profile } = await supabase
  .from('users_profiles')
  .select('*')
  .eq('user_id', user?.id)
  .single();
console.log('Profile:', profile);
```

### 3. Reset Everything

```javascript
// In browser console (F12)
localStorage.clear();
sessionStorage.clear();
location.reload();
```

---

## ✨ **What Makes CareFlow Different**

Unlike NovumFlow (HR platform), CareFlow is designed for:

- 🏥 **Care Management** - Track care plans and visits
- 👤 **Multiple User Types** - Admin, Carer, Family, Client
- 🤖 **AI Integration** - Google Gemini AI assistance
- 📊 **Care Analytics** - Monitor care quality
- 🔔 **Real-time Updates** - Instant notifications

---

## 📚 **Related Documentation**

For more detailed troubleshooting, refer to the NovumFlow login guides (same Supabase configuration):

- `../hr-recruitment-platform/LOGIN_TROUBLESHOOTING.md`
- `../hr-recruitment-platform/migrations/diagnose_login_issues.sql`
- `../hr-recruitment-platform/migrations/fix_login_issues.sql`

---

## 🎯 **Quick Start Summary**

1. **Open**: http://localhost:3000
2. **Click**: "Admin" demo button
3. **Password**: `password123`
4. **Sign In**: Access dashboard!

**That's it! You're ready to use CareFlow AI! 🚀**

---

**CareFlow AI is running on**: http://localhost:3000  
**Supabase Project**: niikshfoecitimepiifo.supabase.co  
**Status**: ✅ Ready to Use
