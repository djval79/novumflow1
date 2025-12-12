# 🔧 LOGIN TROUBLESHOOTING GUIDE
## "Failed to fetch" Error Resolution

**Email Attempted**: MRSONIRIE@GMAIL.COM  
**Error**: "Failed to fetch"  
**Date**: December 12, 2024

---

## 🎯 QUICK DIAGNOSIS

The "Failed to fetch" error indicates one of these issues:

1. ❌ **Missing environment variables** (most common)
2. ❌ **Supabase service is down**
3. ❌ **Network connectivity issues**
4. ❌ **CORS configuration problems**
5. ❌ **Invalid Supabase credentials**

---

## 🔍 STEP 1: CHECK BROWSER CONSOLE

### Open Developer Tools
1. Press **F12** (Windows/Linux) or **Cmd+Option+I** (Mac)
2. Click the **Console** tab
3. Look for error messages

### Common Error Messages:

#### A. Missing Environment Variables
```
❌ Missing Supabase configuration. 
Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.
```
**Solution**: Go to Step 2

#### B. Network Error
```
Failed to fetch
TypeError: NetworkError when attempting to fetch resource
```
**Solution**: Go to Step 3

#### C. CORS Error
```
Access to fetch has been blocked by CORS policy
```
**Solution**: Go to Step 4

#### D. 401 Unauthorized
```
{ message: "Invalid API key", code: "invalid_api_key" }
```
**Solution**: Go to Step 5

---

## 🔧 STEP 2: SET ENVIRONMENT VARIABLES

### For Local Development

#### 2.1 Check if .env.local exists
```bash
cd /path/to/hr-recruitment-platform
ls -la .env.local
```

#### 2.2 If missing, create from template
```bash
cp .env.example .env.local
```

#### 2.3 Edit .env.local with your Supabase credentials
```bash
# Required - Get from https://app.supabase.com
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here

# Optional
VITE_ENVIRONMENT=development
```

#### 2.4 Get your Supabase credentials

**Visit**: https://app.supabase.com
1. Select your project: **novumflow1** (or your project name)
2. Go to **Settings** → **API**
3. Copy:
   - **Project URL** → VITE_SUPABASE_URL
   - **anon public key** → VITE_SUPABASE_ANON_KEY

#### 2.5 Restart the development server
```bash
npm run dev
```

---

### For Production/Deployed App

#### If using Netlify:
1. Go to: https://app.netlify.com
2. Select your site
3. Go to **Site settings** → **Environment variables**
4. Add:
   ```
   VITE_SUPABASE_URL = https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY = your_anon_key_here
   ```
5. Trigger a new deployment

#### If using Vercel:
1. Go to: https://vercel.com
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add the same variables
5. Redeploy

---

## 🌐 STEP 3: CHECK NETWORK CONNECTIVITY

### 3.1 Test Supabase Directly
Open a new browser tab and visit:
```
https://your-project.supabase.co/rest/v1/
```

**Expected Result**: JSON response or 401 error  
**If fails**: Supabase might be down or URL is wrong

### 3.2 Check Supabase Status
Visit: https://status.supabase.com

### 3.3 Test from Browser Console
```javascript
// Open browser console (F12) and run:
fetch('https://your-project.supabase.co/rest/v1/')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error);
```

---

## 🔐 STEP 4: FIX CORS ISSUES

### 4.1 Check Supabase CORS Settings
1. Go to https://app.supabase.com
2. Select your project
3. Go to **Settings** → **API**
4. Scroll to **CORS Settings**

### 4.2 Add Your Domain
Add these origins:
```
http://localhost:3000
http://localhost:5173
https://your-production-domain.com
https://your-netlify-domain.netlify.app
```

### 4.3 Common CORS Patterns
```
# Local Development
http://localhost:*

# Production (replace with your domain)
https://*.netlify.app
https://your-domain.com
```

---

## 🔑 STEP 5: VERIFY CREDENTIALS

### 5.1 Check API Key is Valid
1. Go to https://app.supabase.com
2. Select your project
3. Go to **Settings** → **API**
4. Verify the **anon public** key matches your .env.local

### 5.2 Check Project URL
Make sure URL format is:
```
https://[project-ref].supabase.co
```

Not:
```
❌ https://supabase.co/dashboard/project/[project-ref]
❌ https://[project-ref].supabase.com (wrong TLD)
```

### 5.3 Test Connection
```javascript
// In browser console
const url = 'https://your-project.supabase.co';
const key = 'your-anon-key';

fetch(`${url}/rest/v1/`, {
  headers: {
    'apikey': key,
    'Authorization': `Bearer ${key}`
  }
})
.then(r => console.log('Status:', r.status))
.catch(e => console.error('Error:', e));
```

**Expected**: Status 200 or 401  
**If fails**: Check URL and key

---

## 📧 STEP 6: CHECK USER EXISTS

### 6.1 Verify Email in Supabase
1. Go to https://app.supabase.com
2. Select your project
3. Go to **Authentication** → **Users**
4. Search for: **MRSONIRIE@GMAIL.COM**

### 6.2 If User Not Found
**Option A**: Create user via Supabase Dashboard
1. Click **Add User**
2. Enter email: MRSONIRIE@GMAIL.COM
3. Set password
4. Confirm user

**Option B**: Use Sign Up page
1. Go to `/signup` route
2. Register new account
3. Check email for confirmation

### 6.3 Check Email Confirmation
- User must confirm email before login
- Check inbox/spam for confirmation email
- Resend if needed from Supabase dashboard

---

## 🔍 STEP 7: ADVANCED DEBUGGING

### 7.1 Enable Detailed Logging
Add to .env.local:
```bash
VITE_ENABLE_DEBUG_LOGGING=true
```

### 7.2 Check Network Tab
1. Open DevTools → **Network** tab
2. Try logging in again
3. Look for failed requests (red color)
4. Click failed request
5. Check **Response** tab for error details

### 7.3 Common Network Errors

| Status Code | Meaning | Solution |
|-------------|---------|----------|
| 401 | Invalid credentials | Check API key |
| 403 | Forbidden | Check user permissions |
| 404 | Endpoint not found | Check Supabase URL |
| 422 | Validation error | Check email format |
| 500 | Server error | Check Supabase logs |
| 503 | Service unavailable | Supabase might be down |

---

## 🚀 STEP 8: QUICK FIXES

### Fix 1: Clear Browser Cache
1. Open DevTools (F12)
2. Right-click refresh button
3. Select **Empty Cache and Hard Reload**

### Fix 2: Try Incognito/Private Mode
- Rules out extension conflicts
- Tests with fresh cookies/cache

### Fix 3: Try Different Browser
- Chrome
- Firefox
- Safari
- Edge

### Fix 4: Check Internet Connection
```bash
# Test connectivity
ping google.com
ping supabase.com
```

---

## 📋 COMPLETE CHECKLIST

### Environment Setup
- [ ] .env.local file exists
- [ ] VITE_SUPABASE_URL is set
- [ ] VITE_SUPABASE_ANON_KEY is set
- [ ] Development server restarted after env changes

### Supabase Configuration
- [ ] Project exists and is active
- [ ] API credentials are correct
- [ ] CORS origins include your domain
- [ ] User authentication is enabled

### User Account
- [ ] User exists in Supabase Auth
- [ ] Email is confirmed
- [ ] Password is correct
- [ ] User is not disabled

### Network & Browser
- [ ] Internet connection works
- [ ] Browser cache cleared
- [ ] No CORS errors in console
- [ ] Supabase service is online

---

## 💡 MOST COMMON SOLUTIONS

### 🥇 #1: Missing Environment Variables (80% of cases)
```bash
# Create .env.local
cp .env.example .env.local

# Add your credentials
VITE_SUPABASE_URL=https://niikshfoecitimepiifo.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...

# Restart server
npm run dev
```

### 🥈 #2: User Doesn't Exist (10% of cases)
- Go to Supabase Dashboard → Authentication → Users
- Add user manually OR use Sign Up page

### 🥉 #3: Email Not Confirmed (5% of cases)
- Check email inbox for confirmation link
- OR disable email confirmation in Supabase settings (dev only)

---

## 🆘 STILL NOT WORKING?

### Get More Help

#### 1. Check Application Logs
```bash
cd /home/user/webapp/hr-recruitment-platform
npm run dev
# Watch console output for errors
```

#### 2. Check Supabase Logs
1. Go to https://app.supabase.com
2. Select your project
3. Go to **Logs** → **Auth Logs**
4. Look for failed login attempts

#### 3. Test Authentication Directly
```bash
curl -X POST 'https://your-project.supabase.co/auth/v1/token?grant_type=password' \
-H "apikey: your-anon-key" \
-H "Content-Type: application/json" \
-d '{
  "email": "MRSONIRIE@GMAIL.COM",
  "password": "your-password"
}'
```

#### 4. Contact Information
- **Supabase Support**: https://supabase.com/support
- **Documentation**: https://supabase.com/docs
- **Community**: https://github.com/supabase/supabase/discussions

---

## 📚 HELPFUL RESOURCES

### Documentation
- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Environment Variables Guide](https://vitejs.dev/guide/env-and-mode.html)
- [CORS Troubleshooting](https://supabase.com/docs/guides/api/cors)

### Common Issues
- [Authentication Errors](https://supabase.com/docs/guides/auth/troubleshooting)
- [Network Issues](https://supabase.com/docs/guides/api#network-issues)
- [CORS Problems](https://supabase.com/docs/guides/api/cors)

---

## ✅ SUCCESS INDICATORS

You'll know it's working when:
- ✅ No errors in browser console
- ✅ Login button shows loading state
- ✅ Redirects to dashboard after login
- ✅ User profile loads successfully

---

**Last Updated**: December 12, 2024  
**Version**: 1.0  
**For**: NOVUMFLOW HR Platform
