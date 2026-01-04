-- Migration: Expense Management & Mileage Tracking
-- For care workers to submit expenses and mileage claims

-- Expense Categories
CREATE TABLE IF NOT EXISTS expense_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    name TEXT NOT NULL,
    description TEXT,
    
    -- Limits
    requires_receipt BOOLEAN DEFAULT TRUE,
    max_amount DECIMAL(10,2), -- NULL = no limit
    
    -- Mileage rate (per mile if this is a mileage category)
    is_mileage BOOLEAN DEFAULT FALSE,
    mileage_rate DECIMAL(5,2) DEFAULT 0.45, -- £0.45 per mile UK HMRC rate
    
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Expense Claims
CREATE TABLE IF NOT EXISTS expense_claims (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Reference
    claim_reference TEXT, -- e.g., 'EXP-2024-0001'
    
    -- Who
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    
    -- Period
    claim_period_start DATE,
    claim_period_end DATE,
    
    -- Totals (calculated)
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    total_mileage DECIMAL(8,2) DEFAULT 0,
    
    -- Status
    status TEXT NOT NULL DEFAULT 'draft', -- 'draft', 'submitted', 'under_review', 'approved', 'rejected', 'paid'
    
    -- Submission
    submitted_at TIMESTAMPTZ,
    
    -- Approval
    reviewed_by UUID REFERENCES auth.users(id),
    reviewed_at TIMESTAMPTZ,
    review_notes TEXT,
    
    -- Payment
    paid_at TIMESTAMPTZ,
    payment_reference TEXT,
    
    notes TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Expense Items (individual expenses within a claim)
CREATE TABLE IF NOT EXISTS expense_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    claim_id UUID NOT NULL REFERENCES expense_claims(id) ON DELETE CASCADE,
    category_id UUID REFERENCES expense_categories(id) ON DELETE SET NULL,
    
    -- Date
    expense_date DATE NOT NULL,
    
    -- Description
    description TEXT NOT NULL,
    
    -- Amount
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'GBP',
    
    -- For mileage claims
    is_mileage BOOLEAN DEFAULT FALSE,
    mileage_from TEXT,
    mileage_to TEXT,
    miles DECIMAL(8,2),
    mileage_rate DECIMAL(5,2),
    
    -- Receipt
    receipt_url TEXT,
    receipt_verified BOOLEAN DEFAULT FALSE,
    
    -- Client/Visit association
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    visit_id UUID REFERENCES care_visits(id) ON DELETE SET NULL,
    
    notes TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Mileage Log (for quick mileage entries)
CREATE TABLE IF NOT EXISTS mileage_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    
    -- Journey
    journey_date DATE NOT NULL,
    from_location TEXT NOT NULL,
    to_location TEXT NOT NULL,
    
    -- Distance
    miles DECIMAL(8,2) NOT NULL,
    
    -- GPS data (optional)
    start_lat DECIMAL(10, 8),
    start_lng DECIMAL(11, 8),
    end_lat DECIMAL(10, 8),
    end_lng DECIMAL(11, 8),
    
    -- Purpose
    purpose TEXT,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    
    -- Linked to claim
    expense_item_id UUID REFERENCES expense_items(id) ON DELETE SET NULL,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Generate claim reference function
CREATE OR REPLACE FUNCTION generate_expense_claim_reference()
RETURNS TRIGGER AS $$
DECLARE
    year_part TEXT;
    seq_num INTEGER;
BEGIN
    year_part := to_char(CURRENT_DATE, 'YYYY');
    
    SELECT COALESCE(MAX(
        NULLIF(regexp_replace(claim_reference, '^EXP-' || year_part || '-', ''), '')::INTEGER
    ), 0) + 1
    INTO seq_num
    FROM expense_claims
    WHERE tenant_id = NEW.tenant_id
    AND claim_reference LIKE 'EXP-' || year_part || '-%';
    
    NEW.claim_reference := 'EXP-' || year_part || '-' || LPAD(seq_num::TEXT, 4, '0');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_generate_expense_claim_reference ON expense_claims;
CREATE TRIGGER trg_generate_expense_claim_reference
    BEFORE INSERT ON expense_claims
    FOR EACH ROW
    WHEN (NEW.claim_reference IS NULL)
    EXECUTE FUNCTION generate_expense_claim_reference();

-- Function to update claim totals
CREATE OR REPLACE FUNCTION update_expense_claim_totals()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE expense_claims
    SET 
        total_amount = (
            SELECT COALESCE(SUM(amount), 0) 
            FROM expense_items 
            WHERE claim_id = COALESCE(NEW.claim_id, OLD.claim_id)
        ),
        total_mileage = (
            SELECT COALESCE(SUM(miles), 0) 
            FROM expense_items 
            WHERE claim_id = COALESCE(NEW.claim_id, OLD.claim_id) AND is_mileage = TRUE
        ),
        updated_at = NOW()
    WHERE id = COALESCE(NEW.claim_id, OLD.claim_id);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_expense_claim_totals ON expense_items;
CREATE TRIGGER trg_update_expense_claim_totals
    AFTER INSERT OR UPDATE OR DELETE ON expense_items
    FOR EACH ROW
    EXECUTE FUNCTION update_expense_claim_totals();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_expense_categories_tenant ON expense_categories(tenant_id);
CREATE INDEX IF NOT EXISTS idx_expense_claims_tenant ON expense_claims(tenant_id);
CREATE INDEX IF NOT EXISTS idx_expense_claims_employee ON expense_claims(employee_id);
CREATE INDEX IF NOT EXISTS idx_expense_claims_status ON expense_claims(status);
CREATE INDEX IF NOT EXISTS idx_expense_items_claim ON expense_items(claim_id);
CREATE INDEX IF NOT EXISTS idx_mileage_log_employee ON mileage_log(employee_id);
CREATE INDEX IF NOT EXISTS idx_mileage_log_date ON mileage_log(journey_date);

-- RLS
ALTER TABLE expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE mileage_log ENABLE ROW LEVEL SECURITY;

-- Expense Categories policies
CREATE POLICY "Tenant users can view expense categories"
ON expense_categories FOR SELECT
USING (tenant_id IN (SELECT tenant_id FROM users_profiles WHERE id = auth.uid()));

CREATE POLICY "Tenant users can manage expense categories"
ON expense_categories FOR ALL
USING (tenant_id IN (SELECT tenant_id FROM users_profiles WHERE id = auth.uid()));

-- Expense Claims policies
CREATE POLICY "Tenant users can view expense claims"
ON expense_claims FOR SELECT
USING (tenant_id IN (SELECT tenant_id FROM users_profiles WHERE id = auth.uid()));

CREATE POLICY "Tenant users can manage expense claims"
ON expense_claims FOR ALL
USING (tenant_id IN (SELECT tenant_id FROM users_profiles WHERE id = auth.uid()));

-- Expense Items policies
CREATE POLICY "Users can view expense items"
ON expense_items FOR SELECT
USING (
    claim_id IN (
        SELECT id FROM expense_claims 
        WHERE tenant_id IN (SELECT tenant_id FROM users_profiles WHERE id = auth.uid())
    )
);

CREATE POLICY "Users can manage expense items"
ON expense_items FOR ALL
USING (
    claim_id IN (
        SELECT id FROM expense_claims 
        WHERE tenant_id IN (SELECT tenant_id FROM users_profiles WHERE id = auth.uid())
    )
);

-- Mileage Log policies
CREATE POLICY "Tenant users can view mileage log"
ON mileage_log FOR SELECT
USING (tenant_id IN (SELECT tenant_id FROM users_profiles WHERE id = auth.uid()));

CREATE POLICY "Tenant users can manage mileage log"
ON mileage_log FOR ALL
USING (tenant_id IN (SELECT tenant_id FROM users_profiles WHERE id = auth.uid()));

-- Insert default expense categories
INSERT INTO expense_categories (tenant_id, name, description, requires_receipt, is_mileage, mileage_rate)
SELECT 
    t.id,
    cat.name,
    cat.description,
    cat.requires_receipt,
    cat.is_mileage,
    cat.mileage_rate
FROM tenants t
CROSS JOIN (VALUES
    ('Business Mileage', 'Mileage for work-related travel', FALSE, TRUE, 0.45),
    ('Travel - Public Transport', 'Bus, train, taxi fares', TRUE, FALSE, NULL),
    ('Parking', 'Parking fees', TRUE, FALSE, NULL),
    ('Equipment', 'Work equipment and supplies', TRUE, FALSE, NULL),
    ('Training', 'Training courses and materials', TRUE, FALSE, NULL),
    ('Uniform', 'Work uniform and PPE', TRUE, FALSE, NULL),
    ('Phone/Internet', 'Work-related phone and internet costs', TRUE, FALSE, NULL),
    ('Other', 'Other work-related expenses', TRUE, FALSE, NULL)
) AS cat(name, description, requires_receipt, is_mileage, mileage_rate)
ON CONFLICT DO NOTHING;

-- Grants
GRANT ALL ON expense_categories TO service_role;
GRANT ALL ON expense_claims TO service_role;
GRANT ALL ON expense_items TO service_role;
GRANT ALL ON mileage_log TO service_role;
