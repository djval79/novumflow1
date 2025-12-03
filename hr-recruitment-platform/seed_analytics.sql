DO $$
DECLARE
    wf_id uuid;
    stage_applied_id uuid;
    stage_interview_id uuid;
    stage_hired_id uuid;
    job_id uuid;
    emp_john_id uuid;
    emp_jane_id uuid;
BEGIN
    -- 1. Seed Recruitment Workflow
    SELECT id INTO wf_id FROM recruitment_workflows WHERE name = 'Standard Hiring Pipeline' LIMIT 1;
    
    IF wf_id IS NULL THEN
        INSERT INTO recruitment_workflows (name, description, is_active, is_default)
        VALUES ('Standard Hiring Pipeline', 'Default pipeline for general hiring', true, true)
        RETURNING id INTO wf_id;
    END IF;

    -- 2. Seed Stages
    INSERT INTO workflow_stages (name, stage_type, stage_order, is_system_stage, workflow_id)
    SELECT 'Applied', 'applied', 1, true, wf_id
    WHERE NOT EXISTS (SELECT 1 FROM workflow_stages WHERE workflow_id = wf_id AND name = 'Applied');

    INSERT INTO workflow_stages (name, stage_type, stage_order, is_system_stage, workflow_id)
    SELECT 'Screening', 'screening', 2, false, wf_id
    WHERE NOT EXISTS (SELECT 1 FROM workflow_stages WHERE workflow_id = wf_id AND name = 'Screening');

    INSERT INTO workflow_stages (name, stage_type, stage_order, is_system_stage, workflow_id)
    SELECT 'Interview', 'interview', 3, false, wf_id
    WHERE NOT EXISTS (SELECT 1 FROM workflow_stages WHERE workflow_id = wf_id AND name = 'Interview');

    INSERT INTO workflow_stages (name, stage_type, stage_order, is_system_stage, workflow_id)
    SELECT 'Offer', 'offer', 4, false, wf_id
    WHERE NOT EXISTS (SELECT 1 FROM workflow_stages WHERE workflow_id = wf_id AND name = 'Offer');

    INSERT INTO workflow_stages (name, stage_type, stage_order, is_system_stage, workflow_id)
    SELECT 'Hired', 'hired', 5, true, wf_id
    WHERE NOT EXISTS (SELECT 1 FROM workflow_stages WHERE workflow_id = wf_id AND name = 'Hired');

    INSERT INTO workflow_stages (name, stage_type, stage_order, is_system_stage, workflow_id)
    SELECT 'Rejected', 'rejected', 6, true, wf_id
    WHERE NOT EXISTS (SELECT 1 FROM workflow_stages WHERE workflow_id = wf_id AND name = 'Rejected');

    -- Get Stage IDs
    SELECT id INTO stage_applied_id FROM workflow_stages WHERE workflow_id = wf_id AND name = 'Applied' LIMIT 1;
    SELECT id INTO stage_interview_id FROM workflow_stages WHERE workflow_id = wf_id AND name = 'Interview' LIMIT 1;
    SELECT id INTO stage_hired_id FROM workflow_stages WHERE workflow_id = wf_id AND name = 'Hired' LIMIT 1;

    -- 3. Seed Job Posting (Required for Applications)
    SELECT id INTO job_id FROM job_postings WHERE job_title = 'Senior Care Assistant' LIMIT 1;
    
    IF job_id IS NULL THEN
        INSERT INTO job_postings (job_title, department, employment_type, description, status, workflow_id, location)
        VALUES ('Senior Care Assistant', 'Care', 'full_time', 'Experienced carer needed.', 'active', wf_id, 'London')
        RETURNING id INTO job_id;
    END IF;

    -- 4. Seed Employees
    -- John Doe
    SELECT id INTO emp_john_id FROM employees WHERE email = 'john.doe@example.com' LIMIT 1;
    IF emp_john_id IS NULL THEN
        INSERT INTO employees (first_name, last_name, email, role, department, status, date_hired, employee_number, position)
        VALUES ('John', 'Doe', 'john.doe@example.com', 'hr_manager', 'HR', 'active', '2023-01-15', 'EMP001', 'HR Manager')
        RETURNING id INTO emp_john_id;
    END IF;

    -- Jane Smith
    SELECT id INTO emp_jane_id FROM employees WHERE email = 'jane.smith@example.com' LIMIT 1;
    IF emp_jane_id IS NULL THEN
        INSERT INTO employees (first_name, last_name, email, role, department, status, date_hired, employee_number, position)
        VALUES ('Jane', 'Smith', 'jane.smith@example.com', 'carer', 'Care', 'active', '2023-03-10', 'EMP002', 'Senior Carer')
        RETURNING id INTO emp_jane_id;
    END IF;

    -- Mike Johnson
    IF NOT EXISTS (SELECT 1 FROM employees WHERE email = 'mike.j@example.com') THEN
        INSERT INTO employees (first_name, last_name, email, role, department, status, date_hired, employee_number, position)
        VALUES ('Mike', 'Johnson', 'mike.j@example.com', 'staff', 'Operations', 'active', '2023-06-01', 'EMP003', 'Ops Staff');
    END IF;

    -- 5. Seed Applications
    IF stage_applied_id IS NOT NULL AND job_id IS NOT NULL THEN
        INSERT INTO applications (applicant_first_name, applicant_last_name, applicant_email, current_stage_id, status, job_posting_id)
        SELECT 'Alice', 'Brown', 'alice@test.com', stage_applied_id, 'applied', job_id
        WHERE NOT EXISTS (SELECT 1 FROM applications WHERE applicant_email = 'alice@test.com');
        
        INSERT INTO applications (applicant_first_name, applicant_last_name, applicant_email, current_stage_id, status, job_posting_id)
        SELECT 'Bob', 'Wilson', 'bob@test.com', stage_interview_id, 'interview_scheduled', job_id
        WHERE NOT EXISTS (SELECT 1 FROM applications WHERE applicant_email = 'bob@test.com');
        
        INSERT INTO applications (applicant_first_name, applicant_last_name, applicant_email, current_stage_id, status, job_posting_id)
        SELECT 'Charlie', 'Davis', 'charlie@test.com', stage_hired_id, 'hired', job_id
        WHERE NOT EXISTS (SELECT 1 FROM applications WHERE applicant_email = 'charlie@test.com');
    END IF;

    -- 6. Seed Leave Requests
    IF emp_john_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM leave_requests WHERE employee_id = emp_john_id AND start_date = '2024-01-10') THEN
            INSERT INTO leave_requests (employee_id, leave_type, start_date, end_date, status, total_days)
            VALUES (emp_john_id, 'annual', '2024-01-10', '2024-01-15', 'approved', 5);
        END IF;
    END IF;

    IF emp_jane_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM leave_requests WHERE employee_id = emp_jane_id AND start_date = '2024-02-01') THEN
            INSERT INTO leave_requests (employee_id, leave_type, start_date, end_date, status, total_days)
            VALUES (emp_jane_id, 'sick', '2024-02-01', '2024-02-02', 'approved', 2);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM leave_requests WHERE employee_id = emp_jane_id AND start_date = '2024-03-20') THEN
            INSERT INTO leave_requests (employee_id, leave_type, start_date, end_date, status, total_days)
            VALUES (emp_jane_id, 'annual', '2024-03-20', '2024-03-25', 'pending', 5);
        END IF;
    END IF;
END $$;
