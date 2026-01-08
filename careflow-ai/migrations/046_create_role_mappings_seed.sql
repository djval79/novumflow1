-- Seed role_mappings table with default mappings
-- This maps NovumFlow HR roles to CareFlow roles

INSERT INTO role_mappings (novumflow_role, careflow_role) VALUES
    ('Recruiter', 'admin'),
    ('HR Manager', 'admin'),
    ('HR Assistant', 'manager'),
    ('Care Manager', 'manager'),
    ('Senior Care Worker', 'senior_carer'),
    ('Care Worker', 'carer'),
    ('Nurse', 'nurse'),
    ('Administrator', 'admin'),
    ('Support Worker', 'carer')
ON CONFLICT (novumflow_role) DO UPDATE 
SET careflow_role = EXCLUDED.careflow_role,
    updated_at = NOW();
