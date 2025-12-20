# Button Actions Analysis - NovumFlow & CareFlow

This document analyzes every button action in both applications and identifies which ones need:
- **Database Tables** (currently missing)
- **Edge Functions** (currently missing)
- **Backend Implementation** (mock data currently)

## Legend
- ✅ **DONE** - Has working database table/edge function
- ⚠️ **PARTIAL** - Has table but missing functionality
- ❌ **MISSING** - Needs table/edge function
- 🔄 **MOCK** - Uses mock data, needs real implementation

---

# NOVUMFLOW (HR Recruitment Platform)

## 1. Authentication Pages

### LoginPage.tsx
| Button Action | Status | Needs Table | Needs Edge Function | Notes |
|--------------|--------|-------------|---------------------|-------|
| Login Submit | ✅ DONE | `users_profiles` | `secure-login` | Working |
| Forgot Password | ✅ DONE | - | `password-reset-request` | Working |

### SignUpPage.tsx
| Button Action | Status | Needs Table | Needs Edge Function | Notes |
|--------------|--------|-------------|---------------------|-------|
| Sign Up Submit | ✅ DONE | `users_profiles`, `tenants` | - | Working via Supabase Auth |

### ResetPasswordPage.tsx
| Button Action | Status | Needs Table | Needs Edge Function | Notes |
|--------------|--------|-------------|---------------------|-------|
| Reset Password Submit | ✅ DONE | - | `password-reset-confirm` | Working |

---

## 2. Recruitment Module (RecruitmentPage.tsx)

### Job Postings Tab
| Button Action | Status | Needs Table | Needs Edge Function | Notes |
|--------------|--------|-------------|---------------------|-------|
| Add New Job | ✅ DONE | `job_postings` | `job-posting-crud` | Working |
| Edit Job | ✅ DONE | `job_postings` | `job-posting-crud` | Working |
| Delete Job | ✅ DONE | `job_postings` | - | Direct Supabase call |
| View Job Details | ✅ DONE | `job_postings` | - | Direct Supabase call |
| Publish/Close Job | ⚠️ PARTIAL | `job_postings` | - | Missing status history tracking |
| AI Generate Job Description | ✅ DONE | - | `generate-job-description` | Working |

### Applications Tab
| Button Action | Status | Needs Table | Needs Edge Function | Notes |
|--------------|--------|-------------|---------------------|-------|
| Add Application | ✅ DONE | `applications` | `application-crud` | Working |
| View Application Details | ✅ DONE | `applications` | - | Working |
| Delete Application | ✅ DONE | `applications` | - | Working |
| Move Application Stage (Drag & Drop) | ✅ DONE | `applications` | - | Working |
| AI Screen Resume | ✅ DONE | - | `ai-screen-resume` | Working |
| Convert to Employee | ✅ DONE | `employees` | `employee-crud` | Working |
| Generate Offer Letter | ⚠️ PARTIAL | `letter_templates` | - | Template system needs work |
| Add Application Note | ❌ MISSING | `application_notes` | - | **NEEDS TABLE** |

### Interviews Tab
| Button Action | Status | Needs Table | Needs Edge Function | Notes |
|--------------|--------|-------------|---------------------|-------|
| Schedule Interview | ✅ DONE | `interviews` | `interview-crud` | Working |
| Edit Interview | ✅ DONE | `interviews` | `interview-crud` | Working |
| Reschedule Interview | ⚠️ PARTIAL | `interviews` | - | Missing reschedule history |
| Leave Feedback | ⚠️ PARTIAL | `interviews` | - | Feedback field exists |
| Cancel Interview | ✅ DONE | `interviews` | - | Working |

---

## 3. Performance Module (PerformancePage.tsx)

### Reviews Tab
| Button Action | Status | Needs Table | Needs Edge Function | Notes |
|--------------|--------|-------------|---------------------|-------|
| Create Review | ✅ DONE | `performance_reviews` | `performance-crud` | Working |
| View Review | ✅ DONE | `performance_reviews` | - | Working |
| Edit Review | 🔄 MOCK | `performance_reviews` | - | Handler commented out |
| Delete Review | 🔄 MOCK | `performance_reviews` | - | Handler commented out |
| Auto-Schedule Reviews | ✅ DONE | `performance_reviews` | - | Working |
| Rate Employee | ✅ DONE | `performance_reviews` | - | Working |

### Goals Tab
| Button Action | Status | Needs Table | Needs Edge Function | Notes |
|--------------|--------|-------------|---------------------|-------|
| Add Goal | ✅ DONE | `employee_goals` | `performance-crud` | Working |
| Edit Goal | 🔄 MOCK | `employee_goals` | - | Handler commented out |
| Delete Goal | 🔄 MOCK | `employee_goals` | - | Handler commented out |
| Update Progress | 🔄 MOCK | `employee_goals` | - | **NEEDS IMPLEMENTATION** |

### KPIs Tab  
| Button Action | Status | Needs Table | Needs Edge Function | Notes |
|--------------|--------|-------------|---------------------|-------|
| Add KPI | ✅ DONE | `kpi_definitions`, `kpi_values` | - | Working |
| Edit KPI | 🔄 MOCK | `kpi_values` | - | Handler commented out |
| Delete KPI | 🔄 MOCK | `kpi_values` | - | Handler commented out |

### Review Types Tab
| Button Action | Status | Needs Table | Needs Edge Function | Notes |
|--------------|--------|-------------|---------------------|-------|
| Add Review Type | ✅ DONE | `review_types` | - | Working |
| Edit Review Type | 🔄 MOCK | `review_types` | - | **NEEDS IMPLEMENTATION** |
| Delete Review Type | 🔄 MOCK | `review_types` | - | **NEEDS IMPLEMENTATION** |

---

## 4. Compliance Hub (ComplianceHubPage.tsx)

| Button Action | Status | Needs Table | Needs Edge Function | Notes |
|--------------|--------|-------------|---------------------|-------|
| Send Reminder | ❌ MISSING | - | `send-email` | **Handler empty** |
| Verify Document | ⚠️ PARTIAL | `compliance_records` | - | Handler exists but minimal |
| Complete Task | ⚠️ PARTIAL | `compliance_tasks` | - | Handler exists |
| Export Report | ❌ MISSING | - | - | **Handler empty** |
| Sync to CareFlow | ✅ DONE | - | `sync-to-careflow` | Working |
| View Stage Details | ✅ DONE | - | - | Working |

---

## 5. Forms Page (FormsPage.tsx)

| Button Action | Status | Needs Table | Needs Edge Function | Notes |
|--------------|--------|-------------|---------------------|-------|
| Create New Form | ✅ DONE | `form_templates` | - | Working |
| Edit Form | ✅ DONE | `form_templates` | - | Working |
| Delete Form | ✅ DONE | `form_templates` | - | Working |
| Preview Form | ✅ DONE | - | - | Working |
| Upload Form Template | ✅ DONE | - | - | Working |
| Save Form Schema | ✅ DONE | `form_templates` | - | Working |
| Submit Form Response | ❌ MISSING | `form_submissions` | - | **NEEDS TABLE** |

---

## 6. Messaging Page (MessagingPage.tsx)

| Button Action | Status | Needs Table | Needs Edge Function | Notes |
|--------------|--------|-------------|---------------------|-------|
| Send Message | ✅ DONE | `messages` | - | Working |
| Reply to Message | ✅ DONE | `messages` | - | Working |
| Mark as Read | ⚠️ PARTIAL | `messages` | - | Partial implementation |
| Delete Message | ❌ MISSING | `messages` | - | **NOT IMPLEMENTED** |
| Compose New | ✅ DONE | `messages` | - | Working |

---

## 7. Notice Board Page (NoticeBoardPage.tsx)

| Button Action | Status | Needs Table | Needs Edge Function | Notes |
|--------------|--------|-------------|---------------------|-------|
| Create Announcement | ✅ DONE | `announcements` | - | Working |
| Edit Announcement | ✅ DONE | `announcements` | - | Working |
| Delete Announcement | ✅ DONE | `announcements` | - | Working |
| Pin/Unpin | ⚠️ PARTIAL | `announcements` | - | Field exists |
| Add Comment | ❌ MISSING | `announcement_comments` | - | **NEEDS TABLE** |
| Acknowledge | ❌ MISSING | `announcement_acknowledgments` | - | **NEEDS TABLE** |

---

## 8. Letters Page (LettersPage.tsx)

| Button Action | Status | Needs Table | Needs Edge Function | Notes |
|--------------|--------|-------------|---------------------|-------|
| Add Template | ✅ DONE | `letter_templates` | `letter-template-crud` | Working |
| Edit Template | ⚠️ PARTIAL | `letter_templates` | - | Partial |
| Delete Template | ✅ DONE | `letter_templates` | - | Working |
| Generate Letter | ⚠️ PARTIAL | `generated_letters` | - | Needs improvement |
| Download Letter | ❌ MISSING | - | - | **NEEDS IMPLEMENTATION** |
| Email Letter | ❌ MISSING | - | `send-email` | **NEEDS IMPLEMENTATION** |

---

## 9. Documents Page (DocumentsPage.tsx)

| Button Action | Status | Needs Table | Needs Edge Function | Notes |
|--------------|--------|-------------|---------------------|-------|
| Upload Document | ✅ DONE | `documents` | `document-upload` | Working |
| Download Document | ⚠️ PARTIAL | `documents` | - | Uses Storage |
| Delete Document | ⚠️ PARTIAL | `documents` | - | Partial |
| Preview Document | ⚠️ PARTIAL | - | - | Partial implementation |
| Share Document | ❌ MISSING | `document_shares` | - | **NEEDS TABLE** |
| Move to Folder | ❌ MISSING | `documents` | - | Folder support limited |

---

## 10. Settings Page (SettingsPage.tsx)

| Button Action | Status | Needs Table | Needs Edge Function | Notes |
|--------------|--------|-------------|---------------------|-------|
| Save Company Settings | ✅ DONE | `tenants` | - | Working |
| Upload Logo | ⚠️ PARTIAL | `tenants` | - | Storage integration |
| Save Email Templates | ✅ DONE | `email_templates` | - | Working |

---

## 11. Integrations Page (IntegrationsPage.tsx)

| Button Action | Status | Needs Table | Needs Edge Function | Notes |
|--------------|--------|-------------|---------------------|-------|
| Enable/Disable Integration | ✅ DONE | `tenant_integrations` | - | Working |
| Test Connection | ⚠️ PARTIAL | `integration_logs` | - | Partial |
| View Logs | ✅ DONE | `integration_logs` | - | Working |
| Configure Integration | 🔄 MOCK | `tenant_integrations` | - | Modal exists |

---

## 12. Onboarding Page (OnboardingPage.tsx)

| Button Action | Status | Needs Table | Needs Edge Function | Notes |
|--------------|--------|-------------|---------------------|-------|
| View New Hire | 🔄 MOCK | `onboarding_checklists` | - | Using mock data |
| Complete Task | ❌ MISSING | `onboarding_tasks` | - | **NEEDS TABLE** |
| Assign Task | ❌ MISSING | `onboarding_tasks` | - | **NEEDS TABLE** |
| Send Welcome Email | ❌ MISSING | - | `send-email` | **NEEDS EDGE FUNCTION** |

---

## 13. Biometric Page (BiometricPage.tsx)

| Button Action | Status | Needs Table | Needs Edge Function | Notes |
|--------------|--------|-------------|---------------------|-------|
| Register Employee | ✅ DONE | `biometric_records` | - | Working |
| Clock In/Out | ✅ DONE | `attendance_records` | - | Working |
| View History | ✅ DONE | `attendance_records` | - | Working |
| Export Timesheet | ❌ MISSING | - | - | **NEEDS IMPLEMENTATION** |

---

## 14. Tenant Management (TenantManagementPage.tsx)

| Button Action | Status | Needs Table | Needs Edge Function | Notes |
|--------------|--------|-------------|---------------------|-------|
| Create Tenant | ✅ DONE | `tenants` | - | Working |
| Invite User | ⚠️ PARTIAL | `tenant_invitations` | `send-email` | Partial |
| Update User Role | ✅ DONE | `user_tenant_memberships` | - | Working |
| Remove User | ✅ DONE | `user_tenant_memberships` | - | Working |
| Update Subscription | ❌ MISSING | `tenant_subscriptions` | - | **NEEDS TABLE** |

---

## 15. Reports Page (ReportsPage.tsx)

| Button Action | Status | Needs Table | Needs Edge Function | Notes |
|--------------|--------|-------------|---------------------|-------|
| Generate Report | 🔄 MOCK | - | - | Using mock data |
| Export CSV | ❌ MISSING | - | - | **NEEDS IMPLEMENTATION** |
| Export PDF | ❌ MISSING | - | - | **NEEDS IMPLEMENTATION** |
| Schedule Report | ❌ MISSING | `scheduled_reports` | - | **NEEDS TABLE** |

---

# CAREFLOW (Care Management Platform)

## 16. Dashboard (Dashboard.tsx)

| Button Action | Status | Needs Table | Needs Edge Function | Notes |
|--------------|--------|-------------|---------------------|-------|
| View Stats | ✅ DONE | `careflow_*` tables | - | Working |
| Quick Actions | ⚠️ PARTIAL | Various | - | Navigation only |

---

## 17. People Page (People.tsx)

### Clients Tab
| Button Action | Status | Needs Table | Needs Edge Function | Notes |
|--------------|--------|-------------|---------------------|-------|
| Add Client | ⚠️ PARTIAL | `careflow_clients` | - | Form exists |
| View Client | ✅ DONE | `careflow_clients` | - | Working |
| Edit Client | 🔄 MOCK | `careflow_clients` | - | **NEEDS IMPLEMENTATION** |
| Delete Client | ❌ MISSING | `careflow_clients` | - | **NEEDS IMPLEMENTATION** |

### Staff Tab
| Button Action | Status | Needs Table | Needs Edge Function | Notes |
|--------------|--------|-------------|---------------------|-------|
| View Staff | ✅ DONE | `careflow_staff` | - | Working |
| Edit Staff | 🔄 MOCK | `careflow_staff` | - | **NEEDS IMPLEMENTATION** |
| Add Staff | 🔄 MOCK | `careflow_staff` | - | Should use sync |
| View Compliance | ⚠️ PARTIAL | `careflow_compliance` | - | Basic view |

---

## 18. Rostering Page (Rostering.tsx)

| Button Action | Status | Needs Table | Needs Edge Function | Notes |
|--------------|--------|-------------|---------------------|-------|
| Create Visit | ✅ DONE | `careflow_visits` | - | Working |
| Assign Staff to Visit (Drag) | ✅ DONE | `careflow_visits` | - | Working |
| Unassign Staff | ⚠️ PARTIAL | `careflow_visits` | - | Partial |
| View Visit Details | ✅ DONE | `careflow_visits` | - | Working |
| Edit Visit | 🔄 MOCK | `careflow_visits` | - | **NEEDS IMPLEMENTATION** |
| Cancel Visit | ❌ MISSING | `careflow_visits` | - | **NEEDS IMPLEMENTATION** |
| Copy Week | ❌ MISSING | `careflow_visits` | - | **NEEDS IMPLEMENTATION** |

---

## 19. Medication Page (Medication.tsx)

### eMAR Tab
| Button Action | Status | Needs Table | Needs Edge Function | Notes |
|--------------|--------|-------------|---------------------|-------|
| Sign MAR (Taken/Refused/Missed) | ✅ DONE | `careflow_mar_records` | - | Working |
| View History | ❌ MISSING | `careflow_mar_records` | - | **NEEDS IMPLEMENTATION** |

### Stock Tab
| Button Action | Status | Needs Table | Needs Edge Function | Notes |
|--------------|--------|-------------|---------------------|-------|
| Add Medication | ✅ DONE | `careflow_medications` | - | Working |
| Audit Count | ❌ MISSING | `careflow_stock_audits` | - | **NEEDS TABLE** |
| Request Refill | ❌ MISSING | `careflow_medication_orders` | - | **NEEDS TABLE** |

### Safety Tab
| Button Action | Status | Needs Table | Needs Edge Function | Notes |
|--------------|--------|-------------|---------------------|-------|
| Run Safety Check (AI) | ✅ DONE | - | - | Uses Gemini API |

---

## 20. Care Planning Page (CarePlanning.tsx)

| Button Action | Status | Needs Table | Needs Edge Function | Notes |
|--------------|--------|-------------|---------------------|-------|
| Generate Care Plan (AI) | ✅ DONE | - | - | Uses Gemini API |
| Save Care Plan | ⚠️ PARTIAL | `careflow_care_plans` | - | Table exists |
| Add Goal | ❌ MISSING | `careflow_care_goals` | - | **NEEDS TABLE** |
| Update Goal Progress | ❌ MISSING | `careflow_care_goals` | - | **NEEDS IMPLEMENTATION** |
| Analyze Progress (AI) | ✅ DONE | - | - | Uses Gemini API |
| Generate Reablement Plan (AI) | ✅ DONE | - | - | Uses Gemini API |

---

## 21. Training Page (Training.tsx)

| Button Action | Status | Needs Table | Needs Edge Function | Notes |
|--------------|--------|-------------|---------------------|-------|
| Start Training Module | 🔄 MOCK | `careflow_training_records` | - | Mock data |
| Complete Training | ⚠️ PARTIAL | `careflow_training_records` | - | Partial |
| Generate Quiz (AI) | ✅ DONE | - | - | Uses Gemini API |
| Submit Quiz | ⚠️ PARTIAL | `careflow_training_records` | - | Saves to DB |
| View Certificates | ❌ MISSING | `careflow_certificates` | - | **NEEDS TABLE** |

---

## 22. Shift Market Page (ShiftMarket.tsx)

| Button Action | Status | Needs Table | Needs Edge Function | Notes |
|--------------|--------|-------------|---------------------|-------|
| Claim Shift | 🔄 MOCK | `careflow_shift_claims` | - | **NEEDS TABLE** |
| Approve Claim | 🔄 MOCK | `careflow_shift_claims` | - | **NEEDS TABLE** |
| Post Shift | ❌ MISSING | `careflow_open_shifts` | - | **NEEDS TABLE** |
| Predict Fill (AI) | ✅ DONE | - | - | Uses Gemini API |
| View Predictions | ✅ DONE | - | - | Uses Gemini API |

---

## 23. Forms Page (Forms.tsx)

| Button Action | Status | Needs Table | Needs Edge Function | Notes |
|--------------|--------|-------------|---------------------|-------|
| Generate Form (AI) | ✅ DONE | - | - | Uses Gemini API |
| Start Audit | 🔄 MOCK | `careflow_form_submissions` | - | **NEEDS TABLE** |
| Submit Audit | 🔄 MOCK | `careflow_form_submissions` | - | **NEEDS TABLE** |
| View Submissions | 🔄 MOCK | `careflow_form_submissions` | - | **NEEDS TABLE** |

---

## 24. Expenses Page (Expenses.tsx)

| Button Action | Status | Needs Table | Needs Edge Function | Notes |
|--------------|--------|-------------|---------------------|-------|
| Scan Receipt (AI) | ✅ DONE | - | - | Uses Gemini API |
| Submit Claim | 🔄 MOCK | `careflow_expenses` | - | **NEEDS TABLE** |
| Approve Claim | 🔄 MOCK | `careflow_expenses` | - | **NEEDS TABLE** |
| Reject Claim | 🔄 MOCK | `careflow_expenses` | - | **NEEDS TABLE** |
| Export Claims | ❌ MISSING | - | - | **NEEDS IMPLEMENTATION** |

---

## 25. Incidents Page (Incidents.tsx)

| Button Action | Status | Needs Table | Needs Edge Function | Notes |
|--------------|--------|-------------|---------------------|-------|
| Report Incident | 🔄 MOCK | `careflow_incidents` | - | **NEEDS TABLE** |
| Investigate (AI) | ✅ DONE | - | - | Uses Gemini API |
| Close Incident | 🔄 MOCK | `careflow_incidents` | - | **NEEDS TABLE** |
| View Investigation | 🔄 MOCK | `careflow_incidents` | - | **NEEDS TABLE** |

---

## 26. Documents Page (Documents.tsx - CareFlow)

| Button Action | Status | Needs Table | Needs Edge Function | Notes |
|--------------|--------|-------------|---------------------|-------|
| Upload Document | 🔄 MOCK | `careflow_documents` | - | **NEEDS TABLE** |
| Analyze Document (AI) | ✅ DONE | - | - | Uses Gemini API |
| Download Document | ❌ MISSING | | - | **NEEDS IMPLEMENTATION** |
| Delete Document | 🔄 MOCK | `careflow_documents` | - | **NEEDS TABLE** |

---

## 27. CRM Page (CRM.tsx)

| Button Action | Status | Needs Table | Needs Edge Function | Notes |
|--------------|--------|-------------|---------------------|-------|
| Add Enquiry | 🔄 MOCK | `careflow_enquiries` | - | **NEEDS TABLE** |
| Move Stage | 🔄 MOCK | `careflow_enquiries` | - | **NEEDS TABLE** |
| Analyze Enquiry (AI) | ✅ DONE | - | - | Uses Gemini API |
| Convert to Client | ❌ MISSING | `careflow_clients` | - | **NEEDS IMPLEMENTATION** |
| Schedule Follow-up | ❌ MISSING | `careflow_enquiry_tasks` | - | **NEEDS TABLE** |

---

## 28. Messages Page (Messages.tsx - CareFlow)

| Button Action | Status | Needs Table | Needs Edge Function | Notes |
|--------------|--------|-------------|---------------------|-------|
| Send Message | 🔄 MOCK | `careflow_messages` | - | **NEEDS TABLE** |
| Generate Smart Replies (AI) | ✅ DONE | - | - | Uses Gemini API |
| Use AI Reply | 🔄 MOCK | `careflow_messages` | - | **NEEDS TABLE** |

---

## 29. Inventory Page (Inventory.tsx)

| Button Action | Status | Needs Table | Needs Edge Function | Notes |
|--------------|--------|-------------|---------------------|-------|
| Add Item | 🔄 MOCK | `careflow_inventory` | - | **NEEDS TABLE** |
| Restock Item | 🔄 MOCK | `careflow_inventory` | - | **NEEDS TABLE** |
| Predict Depletion (AI) | ✅ DONE | - | - | Uses Gemini API |
| Low Stock Alert | ❌ MISSING | - | - | **NEEDS IMPLEMENTATION** |

---

## 30. Assets Page (Assets.tsx)

| Button Action | Status | Needs Table | Needs Edge Function | Notes |
|--------------|--------|-------------|---------------------|-------|
| Add Asset | 🔄 MOCK | `careflow_assets` | - | **NEEDS TABLE** |
| Predict Maintenance (AI) | ✅ DONE | - | - | Uses Gemini API |
| Schedule Maintenance | ❌ MISSING | `careflow_maintenance` | - | **NEEDS TABLE** |
| Log Maintenance | ❌ MISSING | `careflow_maintenance` | - | **NEEDS TABLE** |

---

## 31. Finance Page (Finance.tsx)

### Payroll Tab
| Button Action | Status | Needs Table | Needs Edge Function | Notes |
|--------------|--------|-------------|---------------------|-------|
| Approve Payroll | 🔄 MOCK | `careflow_payroll` | - | **NEEDS TABLE** |
| Mark as Paid | 🔄 MOCK | `careflow_payroll` | - | **NEEDS TABLE** |
| Export Payroll | ❌ MISSING | - | - | **NEEDS IMPLEMENTATION** |

### Invoices Tab
| Button Action | Status | Needs Table | Needs Edge Function | Notes |
|--------------|--------|-------------|---------------------|-------|
| Create Invoice | 🔄 MOCK | `careflow_invoices` | - | **NEEDS TABLE** |
| Send Invoice | 🔄 MOCK | `careflow_invoices` | `send-email` | **NEEDS TABLE** |
| Mark as Paid | 🔄 MOCK | `careflow_invoices` | - | **NEEDS TABLE** |
| Download PDF | ❌ MISSING | - | - | **NEEDS IMPLEMENTATION** |

---

## 32. Reports Page (Reports.tsx - CareFlow)

| Button Action | Status | Needs Table | Needs Edge Function | Notes |
|--------------|--------|-------------|---------------------|-------|
| Generate Insight (AI) | ✅ DONE | - | - | Uses Gemini API |
| Export Report | ❌ MISSING | - | - | **NEEDS IMPLEMENTATION** |
| Schedule Report | ❌ MISSING | `careflow_scheduled_reports` | - | **NEEDS TABLE** |

---

## 33. Settings Page (Settings.tsx - CareFlow)

### Compliance Tab
| Button Action | Status | Needs Table | Needs Edge Function | Notes |
|--------------|--------|-------------|---------------------|-------|
| Toggle Required Module | 🔄 MOCK | `careflow_compliance_settings` | - | **NEEDS TABLE** |
| Delete Module | 🔄 MOCK | `careflow_compliance_settings` | - | **NEEDS TABLE** |
| Add Module | 🔄 MOCK | `careflow_compliance_settings` | - | **NEEDS TABLE** |

### Finance Tab
| Button Action | Status | Needs Table | Needs Edge Function | Notes |
|--------------|--------|-------------|---------------------|-------|
| Save Rates | ❌ MISSING | `careflow_billing_rates` | - | **NEEDS TABLE** |
| Configure Mileage | ❌ MISSING | `careflow_billing_rates` | - | **NEEDS TABLE** |

### Policies Tab
| Button Action | Status | Needs Table | Needs Edge Function | Notes |
|--------------|--------|-------------|---------------------|-------|
| Generate Policy (AI) | ✅ DONE | - | - | Uses Gemini API |
| Save Policy | ❌ MISSING | `careflow_policies` | - | **NEEDS TABLE** |
| Download Policy | ❌ MISSING | - | - | **NEEDS IMPLEMENTATION** |

---

## 34. Staff Portal (StaffPortal.tsx - CareFlow)

| Button Action | Status | Needs Table | Needs Edge Function | Notes |
|--------------|--------|-------------|---------------------|-------|
| View All Policies | 🔄 MOCK | `careflow_policies` | - | Uses mock data |
| Request Leave | 🔄 MOCK | `careflow_leave_requests` | - | **NEEDS TABLE** |
| Sign Policy | 🔄 MOCK | `careflow_policy_signatures` | - | **NEEDS TABLE** |
| View Payslips | 🔄 MOCK | `careflow_payslips` | - | **NEEDS TABLE** |
| Download Payslip | ❌ MISSING | - | - | **NEEDS IMPLEMENTATION** |

---

## 35. Nutrition Page (Nutrition.tsx)

| Button Action | Status | Needs Table | Needs Edge Function | Notes |
|--------------|--------|-------------|---------------------|-------|
| Generate Menu (AI) | ✅ DONE | - | - | Uses Gemini API |
| Log Hydration | 🔄 MOCK | `careflow_hydration_logs` | - | **NEEDS TABLE** |
| Update Preferences | 🔄 MOCK | `careflow_dietary_profiles` | - | **NEEDS TABLE** |

---

## 36. Telehealth Page (Telehealth.tsx)

| Button Action | Status | Needs Table | Needs Edge Function | Notes |
|--------------|--------|-------------|---------------------|-------|
| Start Video Call | 🔄 MOCK | `careflow_telehealth_sessions` | - | **NEEDS TABLE** |
| Send Note to GP | ❌ MISSING | - | `send-email` | **NEEDS IMPLEMENTATION** |
| Log Vitals | ❌ MISSING | `careflow_vital_readings` | - | **NEEDS TABLE** |

---

## 37. Route Optimizer (RouteOptimizer.tsx)

| Button Action | Status | Needs Table | Needs Edge Function | Notes |
|--------------|--------|-------------|---------------------|-------|
| Optimize Routes (AI) | 🔄 MOCK | - | - | Uses Gemini API |
| Apply Optimized Route | ❌ MISSING | `careflow_visits` | - | **NEEDS IMPLEMENTATION** |
| Save Route | ❌ MISSING | `careflow_routes` | - | **NEEDS TABLE** |

---

# SUMMARY OF MISSING TABLES

## NovumFlow Tables Needed:
1. `application_notes` - Store notes on job applications
2. `form_submissions` - Store form submission responses
3. `announcement_comments` - Store comments on announcements
4. `announcement_acknowledgments` - Track who has read announcements
5. `document_shares` - Document sharing permissions
6. `onboarding_tasks` - Onboarding task tracking
7. `tenant_subscriptions` - Subscription/billing management
8. `scheduled_reports` - Automated report scheduling

## CareFlow Tables Needed:
1. `careflow_care_goals` - Care plan goals and progress
2. `careflow_stock_audits` - Medication stock audit logs
3. `careflow_medication_orders` - Refill requests
4. `careflow_certificates` - Training certificates
5. `careflow_shift_claims` - Staff shift claims
6. `careflow_open_shifts` - Available shifts to claim
7. `careflow_form_submissions` - Audit/form submissions
8. `careflow_expenses` - Expense claims
9. `careflow_incidents` - Incident reports
10. `careflow_documents` - Document storage
11. `careflow_enquiries` - CRM enquiries
12. `careflow_enquiry_tasks` - Follow-up tasks
13. `careflow_messages` - Internal messaging
14. `careflow_inventory` - Stock inventory
15. `careflow_assets` - Asset tracking
16. `careflow_maintenance` - Maintenance logs
17. `careflow_payroll` - Payroll records
18. `careflow_invoices` - Client invoices
19. `careflow_scheduled_reports` - Report automation
20. `careflow_compliance_settings` - Compliance config
21. `careflow_billing_rates` - Billing configuration
22. `careflow_policies` - Policy documents
23. `careflow_leave_requests` - Staff leave requests
24. `careflow_policy_signatures` - Policy acknowledgments
25. `careflow_payslips` - Payslip records
26. `careflow_hydration_logs` - Hydration tracking
27. `careflow_dietary_profiles` - Dietary preferences
28. `careflow_telehealth_sessions` - Video call records
29. `careflow_vital_readings` - Health vitals
30. `careflow_routes` - Saved routes

---

# SUMMARY OF MISSING EDGE FUNCTIONS

## New Edge Functions Needed:
1. `send-welcome-email` - New employee welcome emails
2. `export-report` - Generate PDF/CSV reports
3. `send-reminder` - Compliance reminder emails
4. `generate-payslip-pdf` - Generate payslip PDFs
5. `generate-invoice-pdf` - Generate invoice PDFs
6. `process-expense-claim` - Process expense submissions
7. `incident-notification` - Notify managers of incidents

---

# PRIORITY IMPLEMENTATION ORDER

## High Priority (Core Functionality):
1. CareFlow form submissions table
2. CareFlow leave requests table
3. CareFlow incidents table
4. CareFlow expenses table
5. Application notes table (NovumFlow)
6. Send reminder edge function

## Medium Priority (Enhanced Features):
1. CareFlow shift market tables
2. CareFlow payroll/invoice tables
3. CareFlow inventory/asset tables
4. NovumFlow scheduled reports
5. Export/PDF generation functions

## Lower Priority (Nice to Have):
1. CareFlow telehealth tables
2. CareFlow nutrition tracking
3. NovumFlow document sharing
4. Route optimization persistence
