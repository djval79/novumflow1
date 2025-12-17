CREATE TABLE leave_approval_rules (
    id bigserial PRIMARY KEY,
    rule_name text NOT NULL,
    priority integer DEFAULT 0,
    criteria jsonb NOT NULL,
    action text NOT NULL, -- 'approve' or 'reject'
    is_active boolean DEFAULT TRUE,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Trigger to automatically update 'updated_at' on row modification
CREATE TRIGGER set_timestamp
BEFORE UPDATE ON leave_approval_rules
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

-- Seed some initial rules (examples)
INSERT INTO leave_approval_rules (rule_name, priority, criteria, action) VALUES
('Auto-approve short sick leave', 10, '{"max_days": 3, "leave_type": "sick", "employee_status": "active"}', 'approve'),
('Auto-reject leave for terminated employees', 100, '{"employee_status": "terminated"}', 'reject'),
('Auto-approve vacation under 5 days', 20, '{"max_days": 5, "leave_type": "vacation"}', 'approve');
