-- ======================================================================
-- MISSING TABLES MIGRATION
-- This migration adds all tables needed for button actions to work
-- Run this after reviewing which features you want to enable
-- ======================================================================

-- ======================================================================
-- NOVUMFLOW MISSING TABLES
-- ======================================================================

-- 1. Application Notes (for recruitment notes on applications)
CREATE TABLE IF NOT EXISTS application_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    content TEXT NOT NULL,
    note_type VARCHAR(50) DEFAULT 'general', -- general, interview, reference, screening
    is_private BOOLEAN DEFAULT false, -- Only visible to creator
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.5. Form Templates (Required by Form Submissions)
CREATE TABLE IF NOT EXISTS form_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    form_type VARCHAR(100) NOT NULL,
    category VARCHAR(100) NOT NULL,
    folder VARCHAR(100) DEFAULT 'general',
    schema JSONB NOT NULL DEFAULT '[]',
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE form_templates ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Tenant isolation" ON form_templates
        FOR ALL USING (
            tenant_id IN (
                SELECT tenant_id FROM user_tenant_memberships 
                WHERE user_id = auth.uid() AND is_active = true
            )
        );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. Form Submissions (for completed form responses)
-- NOTE: This table may already exist in some deployments - skipping if exists
-- If the existing table has a different schema, you may need to migrate data
DO $$ 
BEGIN
    -- Check if tenant_id column exists, if not, the table has old schema
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'form_submissions' AND column_name = 'tenant_id'
    ) THEN
        -- Add tenant_id to existing table if missing
        ALTER TABLE form_submissions ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
    END IF;
EXCEPTION WHEN undefined_table THEN
    -- Table doesn't exist, create it
    CREATE TABLE form_submissions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        form_template_id UUID NOT NULL REFERENCES careflow_form_templates(id),
        submitted_by UUID NOT NULL REFERENCES auth.users(id),
        employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
        responses JSONB NOT NULL DEFAULT '{}',
        status VARCHAR(50) DEFAULT 'submitted',
        reviewed_by UUID REFERENCES auth.users(id),
        reviewed_at TIMESTAMPTZ,
        notes TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
    );
END $$;

-- 3. Announcement Comments
CREATE TABLE IF NOT EXISTS announcement_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    announcement_id UUID NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    content TEXT NOT NULL,
    parent_id UUID REFERENCES announcement_comments(id) ON DELETE CASCADE, -- For nested comments
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Announcement Acknowledgments
CREATE TABLE IF NOT EXISTS announcement_acknowledgments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    announcement_id UUID NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    acknowledged_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(announcement_id, user_id)
);

-- 5. Document Shares
CREATE TABLE IF NOT EXISTS document_shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    shared_with_user_id UUID REFERENCES auth.users(id),
    shared_with_role VARCHAR(50), -- Alternative: share with role instead of user
    permission VARCHAR(50) DEFAULT 'view', -- view, edit, download
    expires_at TIMESTAMPTZ,
    created_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Onboarding Tasks
CREATE TABLE IF NOT EXISTS onboarding_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100), -- paperwork, training, equipment, access
    due_date DATE,
    assigned_to UUID REFERENCES auth.users(id),
    status VARCHAR(50) DEFAULT 'pending', -- pending, in_progress, completed, skipped
    completed_at TIMESTAMPTZ,
    completed_by UUID REFERENCES auth.users(id),
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Tenant Subscriptions
CREATE TABLE IF NOT EXISTS tenant_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE UNIQUE,
    plan VARCHAR(50) NOT NULL DEFAULT 'free', -- free, starter, professional, enterprise
    status VARCHAR(50) NOT NULL DEFAULT 'active', -- active, cancelled, past_due, trialing
    billing_cycle VARCHAR(20) DEFAULT 'monthly', -- monthly, yearly
    price_per_month DECIMAL(10,2),
    max_employees INT,
    max_users INT,
    features JSONB DEFAULT '{}',
    stripe_customer_id VARCHAR(255),
    stripe_subscription_id VARCHAR(255),
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Scheduled Reports
CREATE TABLE IF NOT EXISTS scheduled_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    report_type VARCHAR(100) NOT NULL, -- compliance, attendance, recruitment, performance
    schedule VARCHAR(50) NOT NULL, -- daily, weekly, monthly
    day_of_week INT, -- 0-6 for weekly
    day_of_month INT, -- 1-31 for monthly
    time_of_day TIME DEFAULT '09:00',
    recipients TEXT[], -- Array of email addresses
    filters JSONB DEFAULT '{}',
    format VARCHAR(20) DEFAULT 'pdf', -- pdf, csv, excel
    is_active BOOLEAN DEFAULT true,
    last_run_at TIMESTAMPTZ,
    next_run_at TIMESTAMPTZ,
    created_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);


-- ======================================================================
-- CAREFLOW MISSING TABLES
-- ======================================================================

-- 9. Care Goals (for care plans)
CREATE TABLE IF NOT EXISTS careflow_care_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    care_plan_id UUID NOT NULL REFERENCES careflow_care_plans(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES careflow_clients(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    goal_type VARCHAR(50) DEFAULT 'reablement', -- reablement, maintenance, safety
    target_date DATE,
    baseline TEXT,
    target TEXT,
    progress_percentage INT DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    status VARCHAR(50) DEFAULT 'active', -- active, achieved, on_hold, discontinued
    priority VARCHAR(20) DEFAULT 'medium', -- low, medium, high
    notes TEXT,
    achieved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Stock Audits (medication)
CREATE TABLE IF NOT EXISTS careflow_stock_audits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    medication_id UUID NOT NULL, -- References careflow_medications when created
    audited_by UUID NOT NULL REFERENCES auth.users(id),
    expected_count INT NOT NULL,
    actual_count INT NOT NULL,
    variance INT GENERATED ALWAYS AS (actual_count - expected_count) STORED,
    discrepancy_reason TEXT,
    is_resolved BOOLEAN DEFAULT false,
    resolution_notes TEXT,
    resolved_by UUID REFERENCES auth.users(id),
    resolved_at TIMESTAMPTZ,
    audit_date TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Medication Orders (refill requests)
CREATE TABLE IF NOT EXISTS careflow_medication_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES careflow_clients(id) ON DELETE CASCADE,
    medication_id UUID NOT NULL,
    quantity_requested INT NOT NULL,
    requested_by UUID NOT NULL REFERENCES auth.users(id),
    status VARCHAR(50) DEFAULT 'pending', -- pending, ordered, received, cancelled
    urgency VARCHAR(20) DEFAULT 'normal', -- normal, urgent, critical
    notes TEXT,
    ordered_at TIMESTAMPTZ,
    received_at TIMESTAMPTZ,
    received_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Training Certificates
CREATE TABLE IF NOT EXISTS careflow_certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    staff_id UUID NOT NULL REFERENCES careflow_staff(id) ON DELETE CASCADE,
    training_name VARCHAR(255) NOT NULL,
    issuing_body VARCHAR(255),
    certificate_number VARCHAR(100),
    issue_date DATE NOT NULL,
    expiry_date DATE,
    score INT, -- If applicable
    document_url TEXT,
    status VARCHAR(50) DEFAULT 'valid', -- valid, expired, revoked
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. Open Shifts (shift marketplace)
CREATE TABLE IF NOT EXISTS careflow_open_shifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    visit_id UUID REFERENCES careflow_visits(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES careflow_clients(id) ON DELETE CASCADE,
    shift_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    pay_rate DECIMAL(10,2),
    required_skills TEXT[],
    urgency VARCHAR(20) DEFAULT 'normal', -- normal, urgent, critical
    reason TEXT, -- Why shift is open
    status VARCHAR(50) DEFAULT 'open', -- open, claimed, filled, cancelled
    posted_by UUID NOT NULL REFERENCES auth.users(id),
    posted_at TIMESTAMPTZ DEFAULT NOW(),
    filled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. Shift Claims
CREATE TABLE IF NOT EXISTS careflow_shift_claims (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    open_shift_id UUID NOT NULL REFERENCES careflow_open_shifts(id) ON DELETE CASCADE,
    staff_id UUID NOT NULL REFERENCES careflow_staff(id) ON DELETE CASCADE,
    claimed_at TIMESTAMPTZ DEFAULT NOW(),
    status VARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected, withdrawn
    notes TEXT,
    reviewed_by UUID REFERENCES auth.users(id),
    reviewed_at TIMESTAMPTZ,
    rejection_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(open_shift_id, staff_id)
);

-- 15. Form Submissions (CareFlow)
CREATE TABLE IF NOT EXISTS careflow_form_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    form_type VARCHAR(100) NOT NULL, -- daily_notes, medication_audit, health_safety, etc.
    form_name VARCHAR(255) NOT NULL,
    submitted_by UUID NOT NULL REFERENCES auth.users(id),
    client_id UUID REFERENCES careflow_clients(id),
    staff_id UUID REFERENCES careflow_staff(id),
    responses JSONB NOT NULL DEFAULT '{}',
    score DECIMAL(5,2), -- Overall score if applicable
    status VARCHAR(50) DEFAULT 'submitted', -- draft, submitted, reviewed, action_required
    reviewed_by UUID REFERENCES auth.users(id),
    reviewed_at TIMESTAMPTZ,
    follow_up_required BOOLEAN DEFAULT false,
    follow_up_notes TEXT,
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 16. Expenses
CREATE TABLE IF NOT EXISTS careflow_expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    staff_id UUID NOT NULL REFERENCES careflow_staff(id) ON DELETE CASCADE,
    expense_type VARCHAR(50) NOT NULL, -- mileage, training, equipment, other
    amount DECIMAL(10,2) NOT NULL,
    description TEXT NOT NULL,
    expense_date DATE NOT NULL,
    receipt_url TEXT,
    status VARCHAR(50) DEFAULT 'submitted', -- submitted, approved, rejected, paid
    mileage_km DECIMAL(10,2), -- If mileage expense
    from_location TEXT,
    to_location TEXT,
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    reviewed_by UUID REFERENCES auth.users(id),
    reviewed_at TIMESTAMPTZ,
    rejection_reason TEXT,
    paid_at TIMESTAMPTZ,
    payment_reference VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 17. Incidents
CREATE TABLE IF NOT EXISTS careflow_incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    client_id UUID REFERENCES careflow_clients(id) ON DELETE SET NULL,
    staff_id UUID REFERENCES careflow_staff(id) ON DELETE SET NULL,
    reported_by UUID NOT NULL REFERENCES auth.users(id),
    incident_type VARCHAR(100) NOT NULL, -- fall, medication_error, safeguarding, injury, etc.
    severity VARCHAR(20) NOT NULL DEFAULT 'low', -- low, medium, high, critical
    incident_date TIMESTAMPTZ NOT NULL,
    location TEXT,
    description TEXT NOT NULL,
    immediate_action TEXT,
    witnesses TEXT[],
    status VARCHAR(50) DEFAULT 'reported', -- reported, under_investigation, resolved, closed
    investigation_notes TEXT,
    root_cause TEXT,
    corrective_actions TEXT,
    investigated_by UUID REFERENCES auth.users(id),
    investigated_at TIMESTAMPTZ,
    closed_by UUID REFERENCES auth.users(id),
    closed_at TIMESTAMPTZ,
    regulatory_notified BOOLEAN DEFAULT false,
    family_notified BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 18. Documents (CareFlow)
CREATE TABLE IF NOT EXISTS careflow_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    client_id UUID REFERENCES careflow_clients(id) ON DELETE CASCADE,
    staff_id UUID REFERENCES careflow_staff(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    file_type VARCHAR(50) NOT NULL, -- pdf, image, word, etc.
    category VARCHAR(100) NOT NULL, -- care_plan, assessment, consent, policy, etc.
    file_url TEXT NOT NULL,
    file_size INT,
    description TEXT,
    tags TEXT[],
    ai_summary TEXT, -- AI-generated summary
    uploaded_by UUID NOT NULL REFERENCES auth.users(id),
    expires_at DATE,
    is_sensitive BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 19. CRM Enquiries
CREATE TABLE IF NOT EXISTS careflow_enquiries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    contact_name VARCHAR(255) NOT NULL,
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    relationship VARCHAR(100), -- self, family, social_worker, gp, etc.
    client_name VARCHAR(255),
    care_needs TEXT,
    area_postcode VARCHAR(20),
    funding_type VARCHAR(50), -- private, council, nhs, mixed
    urgency VARCHAR(20) DEFAULT 'normal', -- normal, urgent, immediate
    source VARCHAR(100), -- website, referral, phone, email, etc.
    status VARCHAR(50) DEFAULT 'new', -- new, contacted, assessment_booked, quoted, won, lost
    estimated_hours_per_week DECIMAL(5,2),
    estimated_value_monthly DECIMAL(10,2),
    ai_analysis JSONB, -- AI-generated analysis
    assigned_to UUID REFERENCES auth.users(id),
    notes TEXT,
    next_follow_up DATE,
    lost_reason TEXT,
    won_at TIMESTAMPTZ,
    lost_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 20. Enquiry Tasks
CREATE TABLE IF NOT EXISTS careflow_enquiry_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    enquiry_id UUID NOT NULL REFERENCES careflow_enquiries(id) ON DELETE CASCADE,
    task_type VARCHAR(100) NOT NULL, -- call, email, visit, assessment, follow_up
    title VARCHAR(255) NOT NULL,
    description TEXT,
    due_date TIMESTAMPTZ NOT NULL,
    assigned_to UUID REFERENCES auth.users(id),
    status VARCHAR(50) DEFAULT 'pending', -- pending, completed, cancelled
    completed_at TIMESTAMPTZ,
    completed_by UUID REFERENCES auth.users(id),
    outcome TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 21. Messages (CareFlow internal)
CREATE TABLE IF NOT EXISTS careflow_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    conversation_id UUID NOT NULL, -- Groups messages in a thread
    sender_id UUID NOT NULL REFERENCES auth.users(id),
    recipient_ids UUID[], -- Array for group messages
    content TEXT NOT NULL,
    message_type VARCHAR(50) DEFAULT 'text', -- text, image, file, system
    attachment_url TEXT,
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMPTZ,
    is_urgent BOOLEAN DEFAULT false,
    related_client_id UUID REFERENCES careflow_clients(id),
    related_visit_id UUID REFERENCES careflow_visits(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 22. Inventory
CREATE TABLE IF NOT EXISTS careflow_inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL, -- ppe, continence, mobility, consumables
    sku VARCHAR(100),
    current_stock INT NOT NULL DEFAULT 0,
    minimum_stock INT DEFAULT 10,
    unit VARCHAR(50) DEFAULT 'units', -- units, boxes, packs
    unit_cost DECIMAL(10,2),
    supplier VARCHAR(255),
    supplier_code VARCHAR(100),
    reorder_point INT DEFAULT 5,
    auto_reorder BOOLEAN DEFAULT false,
    last_ordered_at TIMESTAMPTZ,
    last_received_at TIMESTAMPTZ,
    location TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 23. Assets
CREATE TABLE IF NOT EXISTS careflow_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    asset_type VARCHAR(100) NOT NULL, -- mobile_device, vehicle, medical_equipment, it_equipment
    serial_number VARCHAR(100),
    purchase_date DATE,
    purchase_cost DECIMAL(10,2),
    current_value DECIMAL(10,2),
    assigned_to_staff UUID REFERENCES careflow_staff(id),
    assigned_to_location TEXT,
    status VARCHAR(50) DEFAULT 'active', -- active, maintenance, retired, lost
    warranty_expiry DATE,
    last_maintenance_date DATE,
    next_maintenance_date DATE,
    maintenance_notes TEXT,
    ai_predictions JSONB, -- AI maintenance predictions
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 24. Maintenance Logs
CREATE TABLE IF NOT EXISTS careflow_maintenance_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    asset_id UUID NOT NULL REFERENCES careflow_assets(id) ON DELETE CASCADE,
    maintenance_type VARCHAR(100) NOT NULL, -- routine, repair, upgrade, inspection
    description TEXT NOT NULL,
    performed_by VARCHAR(255), -- Can be external provider
    performed_at TIMESTAMPTZ NOT NULL,
    cost DECIMAL(10,2),
    invoice_reference VARCHAR(100),
    notes TEXT,
    next_due_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 25. Payroll Records
CREATE TABLE IF NOT EXISTS careflow_payroll (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    staff_id UUID NOT NULL REFERENCES careflow_staff(id) ON DELETE CASCADE,
    pay_period_start DATE NOT NULL,
    pay_period_end DATE NOT NULL,
    hours_worked DECIMAL(10,2) NOT NULL,
    hourly_rate DECIMAL(10,2) NOT NULL,
    gross_pay DECIMAL(10,2) NOT NULL,
    deductions DECIMAL(10,2) DEFAULT 0,
    net_pay DECIMAL(10,2) NOT NULL,
    overtime_hours DECIMAL(10,2) DEFAULT 0,
    overtime_rate DECIMAL(10,2),
    mileage_reimbursement DECIMAL(10,2) DEFAULT 0,
    expenses_reimbursement DECIMAL(10,2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'pending', -- pending, approved, processed, paid
    approved_by UUID REFERENCES auth.users(id),
    approved_at TIMESTAMPTZ,
    paid_at TIMESTAMPTZ,
    payment_reference VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 26. Invoices
CREATE TABLE IF NOT EXISTS careflow_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES careflow_clients(id) ON DELETE RESTRICT,
    invoice_number VARCHAR(50) NOT NULL,
    invoice_date DATE NOT NULL,
    due_date DATE NOT NULL,
    billing_period_start DATE,
    billing_period_end DATE,
    line_items JSONB NOT NULL DEFAULT '[]',
    subtotal DECIMAL(10,2) NOT NULL,
    vat_rate DECIMAL(5,2) DEFAULT 0,
    vat_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'draft', -- draft, sent, paid, overdue, cancelled
    sent_at TIMESTAMPTZ,
    paid_at TIMESTAMPTZ,
    payment_method VARCHAR(50),
    payment_reference VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(tenant_id, invoice_number)
);

-- 27. Scheduled Reports (CareFlow)
CREATE TABLE IF NOT EXISTS careflow_scheduled_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    report_type VARCHAR(100) NOT NULL, -- visits, compliance, incidents, finance
    schedule VARCHAR(50) NOT NULL, -- daily, weekly, monthly
    day_of_week INT,
    day_of_month INT,
    time_of_day TIME DEFAULT '09:00',
    recipients TEXT[],
    filters JSONB DEFAULT '{}',
    format VARCHAR(20) DEFAULT 'pdf',
    is_active BOOLEAN DEFAULT true,
    last_run_at TIMESTAMPTZ,
    next_run_at TIMESTAMPTZ,
    created_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 28. Compliance Settings
CREATE TABLE IF NOT EXISTS careflow_compliance_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    module_name VARCHAR(255) NOT NULL,
    category VARCHAR(100), -- training, documentation, checks
    is_required BOOLEAN DEFAULT true,
    expiry_days INT, -- Days before expiry to alert
    alert_days_before INT DEFAULT 30,
    is_active BOOLEAN DEFAULT true,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(tenant_id, module_name)
);

-- 29. Billing Rates
CREATE TABLE IF NOT EXISTS careflow_billing_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    rate_type VARCHAR(50) NOT NULL, -- hourly, visit, mileage, overnight
    funding_type VARCHAR(50), -- private, council, nhs
    amount DECIMAL(10,2) NOT NULL,
    applies_weekday BOOLEAN DEFAULT true,
    applies_weekend BOOLEAN DEFAULT true,
    applies_bank_holiday BOOLEAN DEFAULT true,
    weekend_multiplier DECIMAL(5,2) DEFAULT 1.0,
    bank_holiday_multiplier DECIMAL(5,2) DEFAULT 1.0,
    is_active BOOLEAN DEFAULT true,
    effective_from DATE,
    effective_to DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 30. Policies
CREATE TABLE IF NOT EXISTS careflow_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL, -- safeguarding, health_safety, hr, medication
    content TEXT NOT NULL,
    version VARCHAR(50) DEFAULT '1.0',
    status VARCHAR(50) DEFAULT 'draft', -- draft, active, archived
    requires_signature BOOLEAN DEFAULT false,
    effective_date DATE,
    review_date DATE,
    approved_by UUID REFERENCES auth.users(id),
    approved_at TIMESTAMPTZ,
    document_url TEXT, -- PDF version
    ai_generated BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 31. Policy Signatures
CREATE TABLE IF NOT EXISTS careflow_policy_signatures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    policy_id UUID NOT NULL REFERENCES careflow_policies(id) ON DELETE CASCADE,
    staff_id UUID NOT NULL REFERENCES careflow_staff(id) ON DELETE CASCADE,
    signed_at TIMESTAMPTZ DEFAULT NOW(),
    ip_address INET,
    
    UNIQUE(policy_id, staff_id)
);

-- 32. Leave Requests
CREATE TABLE IF NOT EXISTS careflow_leave_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    staff_id UUID NOT NULL REFERENCES careflow_staff(id) ON DELETE CASCADE,
    leave_type VARCHAR(50) NOT NULL, -- holiday, sick, compassionate, unpaid, maternity, paternity
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    days_requested DECIMAL(5,1) NOT NULL, -- Supports half days
    reason TEXT,
    status VARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected, cancelled
    reviewed_by UUID REFERENCES auth.users(id),
    reviewed_at TIMESTAMPTZ,
    rejection_reason TEXT,
    cancelled_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 33. Payslips
CREATE TABLE IF NOT EXISTS careflow_payslips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    staff_id UUID NOT NULL REFERENCES careflow_staff(id) ON DELETE CASCADE,
    payroll_id UUID REFERENCES careflow_payroll(id),
    pay_period VARCHAR(100) NOT NULL, -- e.g., "November 2024"
    pay_date DATE NOT NULL,
    gross_pay DECIMAL(10,2) NOT NULL,
    tax DECIMAL(10,2) DEFAULT 0,
    national_insurance DECIMAL(10,2) DEFAULT 0,
    pension DECIMAL(10,2) DEFAULT 0,
    other_deductions DECIMAL(10,2) DEFAULT 0,
    net_pay DECIMAL(10,2) NOT NULL,
    breakdown JSONB DEFAULT '{}', -- Detailed breakdown
    pdf_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 34. Hydration Logs
CREATE TABLE IF NOT EXISTS careflow_hydration_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES careflow_clients(id) ON DELETE CASCADE,
    recorded_by UUID NOT NULL REFERENCES auth.users(id),
    amount_ml INT NOT NULL,
    drink_type VARCHAR(50) DEFAULT 'water', -- water, tea, coffee, juice, other
    recorded_at TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT
);

-- 35. Dietary Profiles
CREATE TABLE IF NOT EXISTS careflow_dietary_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES careflow_clients(id) ON DELETE CASCADE UNIQUE,
    dietary_requirements TEXT[], -- vegetarian, halal, kosher, etc.
    allergies TEXT[],
    intolerances TEXT[],
    texture_requirements VARCHAR(100), -- normal, soft, pureed
    fluid_restrictions TEXT,
    preferred_foods TEXT[],
    disliked_foods TEXT[],
    feeding_assistance VARCHAR(100), -- independent, prompting, full_assistance
    notes TEXT,
    reviewed_at TIMESTAMPTZ,
    reviewed_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 36. Telehealth Sessions
CREATE TABLE IF NOT EXISTS careflow_telehealth_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES careflow_clients(id) ON DELETE CASCADE,
    staff_id UUID REFERENCES careflow_staff(id),
    session_type VARCHAR(100) NOT NULL, -- video_call, phone_call, remote_monitoring
    scheduled_at TIMESTAMPTZ NOT NULL,
    duration_minutes INT,
    actual_start TIMESTAMPTZ,
    actual_end TIMESTAMPTZ,
    status VARCHAR(50) DEFAULT 'scheduled', -- scheduled, in_progress, completed, cancelled, missed
    meeting_link TEXT,
    notes TEXT,
    vitals_recorded JSONB DEFAULT '{}',
    follow_up_required BOOLEAN DEFAULT false,
    follow_up_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 37. Vital Readings
CREATE TABLE IF NOT EXISTS careflow_vital_readings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES careflow_clients(id) ON DELETE CASCADE,
    recorded_by UUID NOT NULL REFERENCES auth.users(id),
    reading_type VARCHAR(50) NOT NULL, -- blood_pressure, pulse, temperature, oxygen, weight, blood_sugar
    value VARCHAR(100) NOT NULL, -- Flexible to allow different formats
    unit VARCHAR(50) NOT NULL,
    is_abnormal BOOLEAN DEFAULT false,
    alert_triggered BOOLEAN DEFAULT false,
    notes TEXT,
    recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- 38. Routes
CREATE TABLE IF NOT EXISTS careflow_routes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    route_date DATE NOT NULL,
    staff_id UUID REFERENCES careflow_staff(id),
    visit_ids UUID[], -- Ordered list of visit IDs
    total_distance_km DECIMAL(10,2),
    total_travel_time_minutes INT,
    optimized_at TIMESTAMPTZ,
    optimization_savings_km DECIMAL(10,2),
    optimization_savings_minutes INT,
    status VARCHAR(50) DEFAULT 'planned', -- planned, in_progress, completed
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);


-- ======================================================================
-- ROW LEVEL SECURITY POLICIES
-- ======================================================================

-- Enable RLS on all new tables
ALTER TABLE application_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcement_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcement_acknowledgments ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE careflow_care_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE careflow_stock_audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE careflow_medication_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE careflow_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE careflow_open_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE careflow_shift_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE careflow_form_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE careflow_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE careflow_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE careflow_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE careflow_enquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE careflow_enquiry_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE careflow_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE careflow_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE careflow_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE careflow_maintenance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE careflow_payroll ENABLE ROW LEVEL SECURITY;
ALTER TABLE careflow_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE careflow_scheduled_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE careflow_compliance_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE careflow_billing_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE careflow_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE careflow_policy_signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE careflow_leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE careflow_payslips ENABLE ROW LEVEL SECURITY;
ALTER TABLE careflow_hydration_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE careflow_dietary_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE careflow_telehealth_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE careflow_vital_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE careflow_routes ENABLE ROW LEVEL SECURITY;

-- Generic tenant-based RLS policy template (apply to all tables)
-- Note: Wrapped in DO blocks to handle cases where policies may already exist

-- NovumFlow tables RLS policies
DO $$ BEGIN
    CREATE POLICY "Tenant isolation" ON application_notes
        FOR ALL USING (
            tenant_id IN (
                SELECT tenant_id FROM user_tenant_memberships 
                WHERE user_id = auth.uid() AND is_active = true
            )
        );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    -- Only create policy if tenant_id column exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'form_submissions' AND column_name = 'tenant_id'
    ) THEN
        CREATE POLICY "Tenant isolation" ON form_submissions
            FOR ALL USING (
                tenant_id IN (
                    SELECT tenant_id FROM user_tenant_memberships 
                    WHERE user_id = auth.uid() AND is_active = true
                )
            );
    END IF;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- CareFlow tables RLS policies
DO $$ BEGIN
    CREATE POLICY "Tenant isolation" ON careflow_care_goals
        FOR ALL USING (
            tenant_id IN (
                SELECT tenant_id FROM user_tenant_memberships 
                WHERE user_id = auth.uid() AND is_active = true
            )
        );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE POLICY "Tenant isolation" ON careflow_incidents
        FOR ALL USING (
            tenant_id IN (
                SELECT tenant_id FROM user_tenant_memberships 
                WHERE user_id = auth.uid() AND is_active = true
            )
        );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE POLICY "Tenant isolation" ON careflow_expenses
        FOR ALL USING (
            tenant_id IN (
                SELECT tenant_id FROM user_tenant_memberships 
                WHERE user_id = auth.uid() AND is_active = true
            )
        );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Additional CareFlow RLS policies for all new tables
DO $$ BEGIN
    CREATE POLICY "Tenant isolation" ON careflow_form_submissions
        FOR ALL USING (tenant_id IN (SELECT tenant_id FROM user_tenant_memberships WHERE user_id = auth.uid() AND is_active = true));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE POLICY "Tenant isolation" ON careflow_open_shifts
        FOR ALL USING (tenant_id IN (SELECT tenant_id FROM user_tenant_memberships WHERE user_id = auth.uid() AND is_active = true));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE POLICY "Tenant isolation" ON careflow_shift_claims
        FOR ALL USING (tenant_id IN (SELECT tenant_id FROM user_tenant_memberships WHERE user_id = auth.uid() AND is_active = true));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE POLICY "Tenant isolation" ON careflow_leave_requests
        FOR ALL USING (tenant_id IN (SELECT tenant_id FROM user_tenant_memberships WHERE user_id = auth.uid() AND is_active = true));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE POLICY "Tenant isolation" ON careflow_enquiries
        FOR ALL USING (tenant_id IN (SELECT tenant_id FROM user_tenant_memberships WHERE user_id = auth.uid() AND is_active = true));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE POLICY "Tenant isolation" ON careflow_invoices
        FOR ALL USING (tenant_id IN (SELECT tenant_id FROM user_tenant_memberships WHERE user_id = auth.uid() AND is_active = true));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE POLICY "Tenant isolation" ON careflow_payroll
        FOR ALL USING (tenant_id IN (SELECT tenant_id FROM user_tenant_memberships WHERE user_id = auth.uid() AND is_active = true));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE POLICY "Tenant isolation" ON careflow_policies
        FOR ALL USING (tenant_id IN (SELECT tenant_id FROM user_tenant_memberships WHERE user_id = auth.uid() AND is_active = true));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE POLICY "Tenant isolation" ON careflow_messages
        FOR ALL USING (tenant_id IN (SELECT tenant_id FROM user_tenant_memberships WHERE user_id = auth.uid() AND is_active = true));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE POLICY "Tenant isolation" ON careflow_documents
        FOR ALL USING (tenant_id IN (SELECT tenant_id FROM user_tenant_memberships WHERE user_id = auth.uid() AND is_active = true));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE POLICY "Tenant isolation" ON careflow_inventory
        FOR ALL USING (tenant_id IN (SELECT tenant_id FROM user_tenant_memberships WHERE user_id = auth.uid() AND is_active = true));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE POLICY "Tenant isolation" ON careflow_assets
        FOR ALL USING (tenant_id IN (SELECT tenant_id FROM user_tenant_memberships WHERE user_id = auth.uid() AND is_active = true));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ======================================================================
-- INDEXES FOR PERFORMANCE
-- ======================================================================

-- NovumFlow Indexes
CREATE INDEX IF NOT EXISTS idx_application_notes_app ON application_notes(application_id);
CREATE INDEX IF NOT EXISTS idx_form_submissions_template ON form_submissions(form_template_id);
CREATE INDEX IF NOT EXISTS idx_announcement_comments_announcement ON announcement_comments(announcement_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_tasks_employee ON onboarding_tasks(employee_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_reports_next_run ON scheduled_reports(next_run_at) WHERE is_active = true;

-- CareFlow Indexes
CREATE INDEX IF NOT EXISTS idx_careflow_care_goals_care_plan ON careflow_care_goals(care_plan_id);
CREATE INDEX IF NOT EXISTS idx_careflow_open_shifts_date ON careflow_open_shifts(shift_date) WHERE status = 'open';
CREATE INDEX IF NOT EXISTS idx_careflow_shift_claims_shift ON careflow_shift_claims(open_shift_id);
CREATE INDEX IF NOT EXISTS idx_careflow_expenses_staff ON careflow_expenses(staff_id);
CREATE INDEX IF NOT EXISTS idx_careflow_incidents_date ON careflow_incidents(incident_date);
CREATE INDEX IF NOT EXISTS idx_careflow_enquiries_status ON careflow_enquiries(status);
CREATE INDEX IF NOT EXISTS idx_careflow_messages_conversation ON careflow_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_careflow_inventory_category ON careflow_inventory(category);
CREATE INDEX IF NOT EXISTS idx_careflow_invoices_client ON careflow_invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_careflow_leave_requests_staff ON careflow_leave_requests(staff_id);
CREATE INDEX IF NOT EXISTS idx_careflow_vital_readings_client ON careflow_vital_readings(client_id);

-- ======================================================================
-- DONE!
-- ======================================================================
