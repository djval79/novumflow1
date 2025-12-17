CREATE TABLE role_mappings (
    id bigserial PRIMARY KEY,
    novumflow_role text UNIQUE NOT NULL,
    careflow_role text NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Seed initial data
INSERT INTO role_mappings (novumflow_role, careflow_role) VALUES
('Recruiter', 'Manager'),
('HR Manager', 'Manager'),
('Care Worker', 'Carer'),
('Senior Care Worker', 'Senior Carer'),
('Nurse', 'Nurse'),
('Admin', 'Manager');

-- Trigger for updated_at
CREATE TRIGGER set_timestamp
BEFORE UPDATE ON role_mappings
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();
