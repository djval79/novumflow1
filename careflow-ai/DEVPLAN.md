# CareFlow AI - Development Plan (Multi-Tenant & Integration)

## 🎯 Objective
To establish CareFlow AI as a robust, multi-tenant SaaS application that can operate independently or seamlessly integrated with NovumFlow. This plan specifically addresses the needs of tenants like **Ringstead Care**, who use both platforms, while supporting tenants who use only one.

---

## 🏗️ Core Architecture Principles

1.  **Strict Multi-Tenancy**: Every data record MUST belong to a `tenant_id`.
2.  **Shared Identity**: Users have one login (Supabase Auth) across both apps.
3.  **Context-Aware Access**: Application behavior adapts based on the active tenant and enabled features.
4.  **Data Sovereignty**: Tenant data is logically isolated via Row Level Security (RLS).

---

## 📅 Phased Implementation Plan

### Phase 1: Foundation Verification (Immediate)
*Ensure the current multi-tenant implementation is secure and functional.*

- [ ] **Verify RLS Policies**: Audit all tables (`clients`, `visits`, `care_plans`, etc.) to ensure `tenant_id` is enforced.
- [ ] **Test Tenant Context**: Verify `TenantContext.tsx` correctly loads tenants and switches `currentTenant`.
- [ ] **Validate `user_has_tenant_access`**: Ensure the database function correctly validates user membership.
- [ ] **Manual Test**: Create two test tenants (e.g., "Ringstead" and "TestCare") and verify data leakage is impossible.

### Phase 2: NovumFlow Integration (High Priority)
*Enable seamless operation for tenants using both apps.*

#### 2.1 Shared User Profile
- [ ] **Unified Profile Table**: Ensure `users_profiles` is the single source of truth for user details across both apps.
- [ ] **Role Mapping**: Map NovumFlow roles (e.g., "Recruiter", "HR Manager") and CareFlow roles (e.g., "Carer", "Care Manager") to the same user entity.

#### 2.2 Employee Sync (One-Way: NovumFlow -> CareFlow)
*Avoid double-entry of staff data.*
- [ ] **Trigger/Edge Function**: When an employee is "Hired" in NovumFlow:
    -   Automatically create/update the corresponding `employee` record in CareFlow.
    -   Sync basic details (Name, Email, Role).
- [ ] **Manual Sync Button**: Add a "Sync from NovumFlow" button in CareFlow Staff settings for manual overrides.

#### 2.3 Shared Training & Compliance (Home Office & CQC)
*Strict adherence to UK Employment and Care regulations.*

- [ ] **Right to Work (Home Office)**:
    -   Sync "Right to Work" document status and expiry from NovumFlow.
    -   **HARD BLOCK**: Prevent assigning visits in CareFlow if Right to Work is missing or expired in NovumFlow.
- [ ] **DBS & Safeguarding (CQC)**:
    -   Sync DBS Enhanced Check status.
    -   **Alert**: Notify Care Manager immediately if a staff member's DBS status changes or expires.
- [ ] **Training Compliance (CQC)**:
    -   Sync mandatory training (Manual Handling, Fire Safety, Medication).
    -   **Rostering Guard**: Warn scheduler if staff member is non-compliant with mandatory training.

### Phase 3: Tenant Management & Onboarding
*Allow scalable growth of the platform.*

- [ ] **Tenant Creation Flow**:
    -   Self-service signup form.
    -   Automatic seeding of initial data (default settings, example client).
- [ ] **Tenant Settings Page**:
    -   Configure "Integration Mode" (Standalone vs. Integrated with NovumFlow).
    -   Manage subscription tiers.
- [ ] **User Invitation System**:
    -   Invite users to a specific tenant via email.
    -   Handle "Accept Invitation" flow.

### Phase 4: Cross-App Experience
*Polish the user experience for dual-app users.*

- [ ] **App Switcher**: Add a global navigation element to easily switch between NovumFlow and CareFlow (passing the current `tenant_id`).
- [ ] **Shared Document Storage**:
    -   Ensure `storage.buckets` policies allow access from both apps based on tenant.
    -   View employee documents (uploaded in NovumFlow) within CareFlow.

---

## 🛠️ Technical Specifications

### Database Schema Updates
Ensure the following shared structures exist:

```sql
-- Shared Employees Table (Simplified)
CREATE TABLE IF NOT EXISTS employees (
    id UUID PRIMARY KEY,
    tenant_id UUID REFERENCES tenants(id),
    user_id UUID REFERENCES auth.users, -- Link to auth user if they have login access
    novumflow_employee_id UUID, -- Link back to source record in NovumFlow
    full_name TEXT,
    role TEXT,
    status TEXT
);
```

### Integration Logic (Pseudo-code)

```typescript
// In CareFlow: Check if NovumFlow integration is active
const { currentTenant } = useTenant();
const isIntegrated = currentTenant.features.novumflow_enabled;

if (isIntegrated) {
  // Fetch staff from shared/synced source
  const staff = await supabase.from('employees').select('*').eq('tenant_id', currentTenant.id);
} else {
  // Allow manual creation of staff in CareFlow
}
```

---

## 🚨 Risk Management

| Risk | Mitigation |
|------|------------|
| **Data Leakage** | Strict RLS policies; extensive testing of cross-tenant access. |
| **Sync Conflicts** | Define NovumFlow as the "Master" for employee data; CareFlow is "Read-Only" for core staff details. |
| **Performance** | Use `tenant_id` indexes on all major tables; optimize RLS functions. |

---

## ✅ Success Criteria for Ringstead
1.  Ringstead admin can log in and see **only** Ringstead data.
2.  Staff hired in NovumFlow appear in CareFlow automatically (or via sync).
3.  CareFlow can be used for rostering/care planning without affecting NovumFlow's recruitment data.
4.  **Compliance**: System prevents illegal working (Home Office) and unsafe care (CQC) by enforcing checks across both apps.
