# NovumFlow Suite - Complete Analysis

## 🎯 Overview

The NovumFlow Suite consists of **two integrated applications** that together provide a comprehensive solution for UK care providers who need both **HR/recruitment management** and **care delivery management**.

---

## 🏢 Application 1: NovumFlow HR Platform

**Location**: `/hr-recruitment-platform`
**Port**: 5173
**Purpose**: Human Resources & Recruitment Management

### Tech Stack
- **Frontend**: React + TypeScript + Vite
- **Styling**: Vanilla CSS (not Tailwind)
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **Charts**: Recharts

### Core Features (37 Pages)

| Category | Features |
|----------|----------|
| **Recruitment** | Job posting, applications, pipeline, interviews, offer letters |
| **HR Module** | Employee management, leave requests, attendance |
| **Performance** | Reviews, 360 feedback, goals, competencies, PIP |
| **Compliance** | DBS checks, Right to Work, training records, document expiry |
| **Documents** | Upload, preview, categorization, expiry tracking |
| **Onboarding** | Checklists, progress tracking, task management |
| **Training** | Course tracking, compliance rate, certifications |
| **Attendance** | Time clock, calendar, schedules |
| **Reports** | CSV/PDF export, multiple report types |
| **Settings** | Email templates, tenant config, feature flags |
| **Admin** | Tenant management, audit logs, security dashboard |

### Context Providers
- `AuthContext` - User authentication & profile
- `TenantContext` - Multi-tenant isolation

### Key Components (Created This Session)
- `NotificationCenter` - Real-time notifications
- `GlobalSearch` - ⌘K search modal
- `DashboardAnalytics` - Charts and metrics
- `ExportButton` - CSV/Excel/PDF export
- `EmailTemplateEditor` - Template management
- `TimeClock` - Clock in/out
- `EventCalendar` - Interactive calendar
- `OnboardingChecklist` - New hire tasks
- `QuickActions` - Floating action button
- `TeamDirectory` - Employee directory
- `DocumentPreview` - File preview modal
- `ActivityTimeline` - Activity feed
- `LeaveRequestForm` - Leave requests
- `AnnouncementsWidget` - Company announcements
- `GoalsTracker` - OKR management
- `TrainingTracker` - Course tracking
- `WelcomeDashboard` - Personalized welcome
- `InterviewFeedbackForm` - Interview evaluation
- `BulkActions` - Table bulk selection

---

## 💙 Application 2: CareFlow AI

**Location**: `/careflow-ai`
**Port**: 5174
**Purpose**: Care Management & Delivery (Domiciliary/Home Care)

### Tech Stack
- **Frontend**: React + TypeScript + Vite
- **Styling**: TailwindCSS
- **Database**: Supabase (SHARED with NovumFlow!)
- **Auth**: Supabase Auth (SHARED!)
- **AI**: Google Gemini API for intelligent features
- **Charts**: Recharts

### Core Features (37 Pages)

| Category | Features |
|----------|----------|
| **Care Delivery** | Care plans, visit management, daily schedules |
| **Medication** | eMAR (electronic medication records), stock, safety checks |
| **Rostering** | Shift management, open shifts marketplace, route optimization |
| **Client Management** | Client profiles, family portal, care levels |
| **Staff Management** | Staff hub, compliance, training, documents |
| **Finance** | Invoicing, payroll, expenses, mileage claims |
| **Quality** | Incidents/safeguarding, feedback, CQC compliance |
| **Communications** | Messages, telehealth video calls |
| **Operations** | Tasks, assets, inventory, data import |
| **AI Features** | Care plan generation, risk analysis, smart replies |

### User Roles
```typescript
enum UserRole {
  ADMIN = 'Admin',    // Full access
  CARER = 'Carer',    // Care staff
  FAMILY = 'Family',  // Family members of clients
  CLIENT = 'Client'   // Care recipients
}
```

### AI-Powered Features (Gemini Service)
| Function | Purpose |
|----------|---------|
| `generateCarePlanAI` | Auto-generate care plans from client details |
| `analyzeMedicationSafety` | Check for drug interactions |
| `generateRosterSuggestions` | AI shift assignments |
| `optimizeRouteSequence` | Efficient visit routing |
| `generateIncidentInvestigation` | Root cause analysis |
| `analyzeCandidateProfile` | Recruitment matching |
| `analyzeEnquiry` | Lead qualification |
| `generateSmartReplies` | Message suggestions |
| `predictShiftFillChance` | Staffing predictions |
| `generateWeeklyMenu` | Nutrition planning |
| `predictStockDepletion` | Inventory forecasting |
| ... and 15+ more AI functions |

### Context Providers
- `AuthContext` - Same as NovumFlow but with carer roles
- `TenantContext` - Multi-tenant with CareFlow/NovumFlow feature flags

---

## 🔗 Integration Architecture

### Shared Infrastructure
```
┌─────────────────────────────────────────────────────────────┐
│                     SUPABASE BACKEND                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │   auth.users │  │   tenants   │  │  users_profiles     │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
│  ┌─────────────────────────────────────────────────────────┐│
│  │            user_tenant_memberships (RLS)                 ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
          ▲                                    ▲
          │                                    │
    ┌─────┴─────┐                        ┌────┴─────┐
    │ NovumFlow │  ←── Cross-App Nav ──→ │ CareFlow │
    │  (HR/ATS) │       tenant_id        │  (Care)  │
    └───────────┘                        └──────────┘
       :5173                                :5174
```

### Shared Database Tables
| Table | Purpose | Shared? |
|-------|---------|---------|
| `tenants` | Organization/company | ✅ Yes |
| `users_profiles` | User details | ✅ Yes |
| `user_tenant_memberships` | Access control | ✅ Yes |
| `employees` | Staff records | ✅ Sync planned |
| `dbs_checks` | Compliance | ✅ Sync planned |
| `training_records` | Training | ✅ Sync planned |

### Tenant Features Flag
```typescript
features: {
  novumflow_enabled: boolean;  // Can access HR platform
  careflow_enabled: boolean;   // Can access Care platform
  ai_enabled: boolean;         // Can use AI features
}
```

### Cross-App Navigation
Both apps have `CrossAppNavigation` component:
- Quick switcher in header
- Passes `tenant_id` via URL parameter
- Respects feature flags

---

## 🎨 Styling Differences

| Aspect | NovumFlow | CareFlow |
|--------|-----------|----------|
| CSS Framework | Vanilla CSS | TailwindCSS |
| Color Theme | Indigo/Purple | Slate/Cyan |
| Sidebar | Light (gray-100) | Dark (slate-900) |
| Typography | System fonts | Tailwind defaults |

---

## 🔄 Planned Integrations (from DEVPLAN.md)

### Phase 2: Employee Sync
- Hired employees in NovumFlow → Auto-create in CareFlow
- One-way sync (NovumFlow is master)
- Manual sync button fallback

### Phase 2: Compliance Sync
| Document | Source | Action |
|----------|--------|--------|
| Right to Work | NovumFlow | **BLOCK** CareFlow visits if expired |
| DBS Check | NovumFlow | **ALERT** Care Manager if expiring |
| Training | NovumFlow | **WARN** scheduler if non-compliant |

### Phase 4: Shared Documents
- Employee documents visible in both apps
- Same Supabase storage bucket
- RLS policies for tenant isolation

---

## 📊 Feature Comparison

| Feature | NovumFlow | CareFlow |
|---------|-----------|----------|
| Employee Records | ✅ Master | ✅ Read (sync) |
| Job Posting | ✅ | ✅ (simplified) |
| Interviews | ✅ Full ATS | ❌ |
| Care Plans | ❌ | ✅ AI-powered |
| Medication | ❌ | ✅ eMAR |
| Rostering | ❌ | ✅ Full |
| Route Optimization | ❌ | ✅ AI-powered |
| Client Portal | ❌ | ✅ Family access |
| Telehealth | ❌ | ✅ Video calls |
| Performance Reviews | ✅ Full | ❌ |
| 360 Feedback | ✅ | ❌ |
| Audit Logs | ✅ | ❌ |
| Biometric System | ✅ Placeholder | ❌ |

---

## 🎯 Target Users

### NovumFlow
- HR Managers
- Recruiters
- Hiring Managers
- Office Administrators

### CareFlow
- Registered Managers (Admin)
- Care Coordinators
- Carers (field staff)
- Family Members
- Clients (service users)

---

## 🔧 Development Notes

### Running Both Apps
```bash
# Terminal 1 - NovumFlow
cd hr-recruitment-platform
npm run dev  # Port 5173

# Terminal 2 - CareFlow
cd careflow-ai
npm run dev  # Port 5174
```

### Shared Super Admin
- Email: `mrsonirie@gmail.com`
- Has bypass in both apps for testing

### Database Migrations
- NovumFlow: `/hr-recruitment-platform/supabase/migrations/`
- CareFlow: `/careflow-ai/migrations/`
- Some tables are shared, migrations must be coordinated!

---

## ✅ Recommendations

1. **Unify Styling**: Consider migrating NovumFlow to TailwindCSS for consistency
2. **Shared Components Library**: Extract common components (auth, tenant, etc.)
3. **Complete Employee Sync**: Implement the planned integration
4. **Compliance Gateway**: Build the BLOCK/ALERT/WARN system
5. **Unified Notifications**: Share real-time notifications across apps
6. **SSO Integration**: Single login, seamless app switching
7. **Mobile App**: React Native for carers in the field

---

*Last Updated: 2025-12-16*
