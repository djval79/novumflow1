# Project TODO List

## Unresolved Issues

- [x] **Fix Migration History Mismatch**:
    - **Resolution**: Archived sub-repo migrations `hr-recruitment-platform/supabase/migrations_archived`. Created `MIGRATION_REPAIR_GUIDE.md` for manual history sync.
    - **Status**: Consolidated. Repair guide available.

## Resolved (Waiting Verification)
- [x] **Fix Persistent CORS Error in `sync-to-careflow`**:
    - **Resolution**: Identified that the `supabase` CLI was using the root `supabase/functions` directory instead of the subfolder. Overwrote the root function with the fixed code (Deno.serve + robust CORS) and redeployed.
    - **Status**: Verified by user (2025-12-16).
- [x] **Complete Tenant Isolation (Migration 015)**:
    - **Resolution**: Added `tenant_id` and RLS policies to `attendance_records`, `leave_requests`, `shifts`, and `biometric` tables. Backfilled existing data from employees.
    - **Status**: Migration 015 created. 2026-01-04.
- [x] **PWA & Mobile Optimization**:
    - **Resolution**: Implemented card-based layouts for mobile list views, added a bottom navigation bar, and created a custom PWA install nudge.
    - **Status**: Fully implemented. 2026-01-04.
- [x] **Daily Compliance Automation (CRON)**:
    - **Resolution**: Created Migration 016 with pg_cron job to trigger daily compliance checks at 6:00 AM UTC. Enhanced automation-engine to detect both RTW and document expiries.
    - **Status**: Migration 016 created. 2026-01-04.

## Pending (Production Ready)
- [x] **Code Splitting**: Reduced main JS bundle from 2.2MB to 544KB (75% reduction) using React.lazy(). Pages now load on demand.
- [x] **Run Migrations 015 + 016**: Executed in Supabase SQL Editor. Tenant isolation and daily automation enabled. 2026-01-04.
- [x] **Testing Phase 1**: 328 unit/integration tests passing. Fixed RecruitSettingsPage tests. 2026-01-04.
- [x] **E2E Test Suite**: Created comprehensive Playwright tests for auth, dashboard, HR, compliance, and mobile responsiveness. 2026-01-04.

---

## 🚀 Phase: Documentation & Knowledge Base (Current)
Goal: Create comprehensive user and admin documentation to support the SaaS launch.

- [x] **User Guide - Recruitment**: Detailed guide on job posting, candidate tracking, and AI screening. - *Completed w/ Help Center*
- [x] **User Guide - Compliance**: Instructions for DBS checks, RTW checks, and training matrix. - *Completed w/ Help Center*
- [x] **User Guide - HR & Employee Management**: Managing staff profiles, leave requests, and documents. - *Completed w/ Help Center*
- [x] **In-App Help Widget**: Integrate a help button/widget linking to these guides. - *Implemented Context-Aware Help Center*
- [x] **Admin Manual**: Tenant settings, billing management, and access control. - *Completed w/ Help Center*

---

## ✅ Phase Complete
All documentation goals achieved. Help Center is live with 4 comprehensive manuals.
*Tech Debt Resolved (2026-01-04)*: Fixed E2E test credentials, resolved TS config issues, and added missing type definitions.


---

## ✅ Phase Complete
All previous phases resolved. Platform is production-ready.

---

## 📈 Phase: Market Readiness & Launch Assets (Current)
Goal: Align the product with market pain points and create high-converting sales assets.

- [x] **Market-Driven Analysis**: Identified core pain points (Staff Churn, Compliance Gaps, Fragmented Tools) and mapped them to product strengths.
- [x] **Premium One-Pager**: Created `marketing/one-pager.html` as a standalone high-fidelity sales document.
- [x] **Compliance Checklist**: Created `marketing/compliance-checklist.html` to serve as a high-value lead magnet.
- [x] **Landing Page Upgrades**: Redesigned `careflow-ai` and `hr-recruitment-platform` landing pages with interactive dashboard previews and market-centric copy.
- [x] **Sales CTAs**: Integrated "Request Demo" and asset download links across all landing pages.
- [x] **Automated Email Capture**: Implemented `demo_requests` table in Supabase and a premium `DemoRequestModal` across both apps to capture leads directly into the database.
- [x] **Pitch Deck Insights**: Integrated Liverpool-specific and UK-wide funding strategy data into the product narrative. (Reference: `FUNDING_AND_PITCH_DECK.md`)
- [x] **Cloud Deployment**: Linked and deployed `hr-recruitment-platform` and `careflow-ai` to Vercel production environments.
- [x] **Integrated Marketing Assets**: Synchronized sales one-pager and compliance checklist across both production apps for instant access.

