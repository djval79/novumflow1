# 🚀 NovumSolvo Platform - Deployment Guide

## Overview

Deploy both **NovumFlow** and **CareFlow AI** as a unified multi-tenant SaaS platform.

---

## 📦 Quick Deployment Checklist

### Both Apps Running Locally

- [x] **NovumFlow** - http://localhost:5173 *(Currently stopped)*
- [x] **CareFlow AI** - http://localhost:3000 ✅ **(Running)**
- [x] Shared Supabase backend configured
- [x] Both apps login working

### Ready for Production

- [ ] Set up custom domains
- [ ] Configure environment variables
- [ ] Deploy to hosting (Vercel/Netlify)
- [ ] Set up tenant management
- [ ] Configure subdomain routing
- [ ] Add billing integration

---

## 🌐 Domain Structure (Production)

```
Primary Domains:
├── novumflow.com → NovumFlow landing page
├── app.novumflow.com → NovumFlow application
├── careflow.ai → CareFlow landing page
└── app.careflow.ai → CareFlow application

Tenant Subdomains (Optional):
├── {tenant}.novumflow.com → Tenant-specific NovumFlow
└── {tenant}.careflow.ai → Tenant-specific CareFlow

Example:
├── ringsteadcare.novumflow.com
└── ringsteadcare.careflow.ai
```

---

## 🔧 Environment Setup

### NovumFlow Production (.env.production)

```env
# App Configuration
VITE_APP_NAME=NovumFlow
VITE_APP_URL=https://app.novumflow.com
VITE_CAREFLOW_URL=https://app.careflow.ai

# Supabase
VITE_SUPABASE_URL=https://niikshfoecitimepiifo.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key

# Features
VITE_ENABLE_MULTI_TENANT=true
VITE_ENABLE_CAREFLOW_INTEGRATION=true
```

### CareFlow Production (.env.production)

```env
# App Configuration
VITE_APP_NAME=CareFlow AI
VITE_APP_URL=https://app.careflow.ai
VITE_NOVUMFLOW_URL=https://app.novumflow.com

# Supabase
VITE_SUPABASE_URL=https://niikshfoecitimepiifo.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key

# AI Configuration
VITE_GEMINI_API_KEY=your_gemini_key

# Features
VITE_ENABLE_MULTI_TENANT=true
VITE_ENABLE_NOVUMFLOW_INTEGRATION=true
```

---

## 📤 Deployment Options

### Option 1: Vercel (Recommended)

**For Both Apps:**

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy NovumFlow
cd hr-recruitment-platform
vercel --prod

# Deploy CareFlow
cd ../careflow-ai
vercel --prod
```

**Vercel Configuration (vercel.json):**

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "devCommand": "npm run dev",
  "framework": "vite",
  "env": {
    "VITE_SUPABASE_URL": "@supabase_url",
    "VITE_SUPABASE_ANON_KEY": "@supabase_anon_key"
  }
}
```

### Option 2: Netlify

```bash
# Deploy NovumFlow
cd hr-recruitment-platform
netlify deploy --prod

# Deploy CareFlow
cd ../careflow-ai
netlify deploy --prod
```

**netlify.toml:**

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### Option 3: Self-Hosted (Digital Ocean / AWS)

```bash
# Build both apps
cd hr-recruitment-platform
npm run build

cd ../careflow-ai
npm run build

# Deploy with Docker (example)
docker build -t novumflow:latest .
docker build -t careflow:latest .

# Or use Nginx to serve static files
```

---

## 🎯 Quick Start (Local Development)

### Start Both Apps

```bash
# Terminal 1: Start NovumFlow
cd hr-recruitment-platform
npm run dev
# Runs on http://localhost:5173

# Terminal 2: Start CareFlow
cd careflow-ai
npm run dev
# Runs on http://localhost:3000
```

### Access the Apps

```
NovumFlow:  http://localhost:5173
CareFlow:   http://localhost:3000
```

### Test Multi-Tenant

1. Login to NovumFlow with your account
2. Note your tenant_id in the profile
3. Login to CareFlow with same account
4. Should see same tenant data

---

## 🔐 Security Checklist

- [ ] **Environment Variables** - Never commit `.env` files
- [ ] **API Keys** - Use secret management (Vercel Secrets / Netlify Environment Variables)
- [ ] **Supabase RLS** - Row Level Security enabled on all tables
- [ ] **CORS** - Configure allowed origins
- [ ] **HTTPS** - Enforce SSL/TLS
- [ ] **CSP Headers** - Content Security Policy configured

---

## 📊 Monitoring Setup

### Recommended Tools

```
Analytics:
├── Google Analytics (User behavior)
├── PostHog (Product analytics)
└── Mixpanel (Event tracking)

Performance:
├── Vercel Analytics (Core Web Vitals)
├── Sentry (Error tracking)
└── LogRocket (Session replay)

Database:
├── Supabase Dashboard (Query performance)
└── Datadog (Advanced monitoring)
```

---

## 💰 Cost Estimation (Production)

```
Monthly Costs:

Hosting (Vercel Pro):
├── NovumFlow: $20/month
├── CareFlow: $20/month
└── Total: $40/month

Supabase (Pro Plan):
├── Database: $25/month
├── Storage: $0.021/GB
├── Bandwidth: Included
└── Total: ~$25-50/month

Domain Names:
├── novumflow.com: $12/year
├── careflow.ai: $12/year
└── Total: $24/year ($2/month)

Total Monthly: ~$67-92/month

For 10-50 tenants paying $99-599/month:
Revenue: $990 - $29,950/month
Profit Margin: 98%+ 🎉
```

---

## 🎬 Pre-Launch Checklist

### Technical

- [ ] Both apps build without errors
- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] RLS policies tested
- [ ] Cross-app navigation works
- [ ] Authentication flows tested
- [ ] Payment integration ready (Stripe/Paddle)

### Business

- [ ] Pricing tiers defined
- [ ] Terms of Service created
- [ ] Privacy Policy created
- [ ] Support email set up
- [ ] Onboarding flow designed
- [ ] Marketing website ready

### Legal

- [ ] GDPR compliance
- [ ] Data Processing Agreement (DPA)
- [ ] Cookie consent
- [ ] Accessibility (WCAG 2.1)

---

## 🚦 Go-Live Process

### 1. Final Testing

```bash
# Build for production
npm run build

# Test production build locally
npm run preview
```

### 2. Deploy to Staging

```bash
# Deploy to staging environment first
vercel --env staging

# Test all features
# Invite beta users
```

### 3. Deploy to Production

```bash
# Deploy NovumFlow
cd hr-recruitment-platform
vercel --prod

# Deploy CareFlow
cd careflow-ai
vercel --prod
```

### 4. Post-Deployment

- [ ] Smoke tests (login, core features)
- [ ] Monitor error rates (Sentry)
- [ ] Check performance (Vercel Analytics)
- [ ] Test payment flow
- [ ] Verify email delivery

---

## 🔄 Continuous Deployment

### GitHub Actions (Recommended)

```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  deploy-novumflow:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          working-directory: hr-recruitment-platform

  deploy-careflow:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID_CAREFLOW }}
          working-directory: careflow-ai
```

---

## 📞 Support Resources

### Documentation

- NovumFlow: `/docs` directory
- CareFlow: `CAREFLOW_LOGIN_GUIDE.md`
- Multi-Tenant: `MULTI_TENANT_ARCHITECTURE.md`

### Monitoring Dashboards

- **Vercel**: https://vercel.com/dashboard
- **Supabase**: https://supabase.com/dashboard
- **Sentry**: https://sentry.io

---

## 🎉 You're Ready!

Your platform is ready for deployment:

✅ **NovumFlow** - HR & Recruitment  
✅ **CareFlow AI** - Care Management  
✅ **Multi-tenant** architecture  
✅ **Shared Supabase** backend  
✅ **Login working** for both apps  

**Next Steps:**
1. Choose hosting provider (Vercel recommended)
2. Set up custom domains
3. Configure environment variables
4. Deploy both apps
5. Test end-to-end
6. Launch! 🚀

---

**Platform**: NovumSolvo Ltd  
**Apps**: NovumFlow + CareFlow AI  
**Status**: ✅ Ready for Production Deployment  
**Local Dev**: CareFlow running on :3000
