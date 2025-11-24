import requests
import json

SUPABASE_URL = "https://kvtdyttgthbeomyvtmbj.supabase.co"
ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt2dGR5dHRndGhiZW9teXZ0bWJqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4ODkwMjIsImV4cCI6MjA3ODQ2NTAyMn0.H2d19-9u0gqWea004sq4ZCWDzsIWv8iujRWW5ugmKXU"

print("=" * 60)
print("HR PLATFORM FINAL INTEGRATION TESTS")
print("=" * 60)
print()

# Step 1: Login
print("Test 1: User Authentication")
print("-" * 60)
login_response = requests.post(
    f"{SUPABASE_URL}/auth/v1/token?grant_type=password",
    headers={"apikey": ANON_KEY, "Content-Type": "application/json"},
    json={"email": "yodkzlfx@minimax.com", "password": "cqRCDI0hU6"}
)

if login_response.status_code != 200:
    print(f"❌ Login failed: {login_response.status_code}")
    print(login_response.text)
    exit(1)

token = login_response.json()["access_token"]
print("✅ Authentication successful")
print()

# Step 2: Test Employee Creation
print("Test 2: Employee Creation")
print("-" * 60)
emp_response = requests.post(
    f"{SUPABASE_URL}/functions/v1/employee-crud",
    headers={
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    },
    json={
        "action": "create",
        "data": {
            "first_name": "Final",
            "last_name": "TestUser",
            "email": "final.testuser@company.com",
            "phone": "555-FINAL",
            "employee_number": "FINAL999",
            "department": "Quality Assurance",
            "position": "Senior QA Engineer",
            "employment_type": "full_time",
            "date_hired": "2025-02-01",
            "status": "active"
        }
    }
)

if emp_response.status_code == 200 and "data" in emp_response.json():
    emp_data = emp_response.json()["data"]
    print(f"✅ Employee created successfully")
    print(f"   Name: {emp_data['first_name']} {emp_data['last_name']}")
    print(f"   Employee #: {emp_data['employee_number']}")
    print(f"   Department: {emp_data['department']}")
else:
    print(f"❌ Employee creation failed: {emp_response.status_code}")
    print(json.dumps(emp_response.json(), indent=2))
print()

# Step 3: Test Job Posting Creation
print("Test 3: Job Posting Creation")
print("-" * 60)
job_response = requests.post(
    f"{SUPABASE_URL}/functions/v1/job-posting-crud",
    headers={
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    },
    json={
        "action": "create",
        "data": {
            "job_title": "Full Stack Developer",
            "department": "Engineering",
            "location": "Remote",
            "employment_type": "full_time",
            "job_description": "Build amazing applications",
            "requirements": "5+ years experience",
            "status": "published"
        }
    }
)

if job_response.status_code == 200 and "data" in job_response.json():
    job_data = job_response.json()["data"]
    print(f"✅ Job posting created successfully")
    print(f"   Title: {job_data['job_title']}")
    print(f"   Department: {job_data['department']}")
    print(f"   Status: {job_data['status']}")
else:
    print(f"❌ Job posting creation failed: {job_response.status_code}")
    print(json.dumps(job_response.json(), indent=2))
print()

# Step 4: Test Letter Template Creation
print("Test 4: Letter Template Creation")
print("-" * 60)
template_response = requests.post(
    f"{SUPABASE_URL}/functions/v1/letter-template-crud",
    headers={
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    },
    json={
        "action": "create",
        "data": {
            "template_name": "Final Test Template",
            "template_type": "offer_letter",
            "subject": "Job Offer - Final Test",
            "content": "Dear [employee_name],\n\nWe are pleased to offer you the position.\n\nBest regards",
            "version": 1
        }
    }
)

if template_response.status_code == 200 and "data" in template_response.json():
    template_data = template_response.json()["data"]
    print(f"✅ Letter template created successfully")
    print(f"   Name: {template_data['template_name']}")
    print(f"   Type: {template_data['template_type']}")
else:
    print(f"❌ Letter template creation failed: {template_response.status_code}")
    print(json.dumps(template_response.json(), indent=2))
print()

# Step 5: Get Employee ID for Leave Request
print("Test 5: Leave Request Creation")
print("-" * 60)
employees_response = requests.get(
    f"{SUPABASE_URL}/rest/v1/employees?select=id&limit=1",
    headers={
        "apikey": ANON_KEY,
        "Authorization": f"Bearer {token}"
    }
)

if employees_response.status_code == 200 and len(employees_response.json()) > 0:
    employee_id = employees_response.json()[0]["id"]
    
    leave_response = requests.post(
        f"{SUPABASE_URL}/functions/v1/leave-request-crud",
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        },
        json={
            "action": "create",
            "data": {
                "employee_id": employee_id,
                "leave_type": "annual",
                "start_date": "2025-07-01",
                "end_date": "2025-07-05",
                "total_days": 5,
                "reason": "Summer vacation - Final test",
                "status": "pending"
            }
        }
    )
    
    if leave_response.status_code == 200 and "data" in leave_response.json():
        leave_data = leave_response.json()["data"]
        print(f"✅ Leave request created successfully")
        print(f"   Type: {leave_data['leave_type']}")
        print(f"   Days: {leave_data['total_days']}")
        print(f"   Status: {leave_data['status']}")
    else:
        print(f"❌ Leave request creation failed: {leave_response.status_code}")
        print(json.dumps(leave_response.json(), indent=2))
else:
    print("⚠️  No employees found, skipping leave request test")
print()

# Step 6: Test Application Creation
print("Test 6: Application Creation")
print("-" * 60)
jobs_response = requests.get(
    f"{SUPABASE_URL}/rest/v1/job_postings?select=id&limit=1",
    headers={
        "apikey": ANON_KEY,
        "Authorization": f"Bearer {token}"
    }
)

if jobs_response.status_code == 200 and len(jobs_response.json()) > 0:
    job_id = jobs_response.json()[0]["id"]
    
    app_response = requests.post(
        f"{SUPABASE_URL}/functions/v1/application-crud",
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        },
        json={
            "action": "create",
            "data": {
                "job_id": job_id,
                "candidate_name": "Jane Doe",
                "email": "jane.doe@example.com",
                "phone": "555-APPLICATION",
                "resume_url": "https://example.com/resume.pdf",
                "cover_letter": "I am very interested in this position",
                "status": "applied"
            }
        }
    )
    
    if app_response.status_code == 200 and "data" in app_response.json():
        app_data = app_response.json()["data"]
        print(f"✅ Application created successfully")
        print(f"   Candidate: {app_data.get('applicant_first_name', 'N/A')} {app_data.get('applicant_last_name', '')}")
        print(f"   Email: {app_data.get('applicant_email', 'N/A')}")
        print(f"   Status: {app_data['status']}")
    else:
        print(f"❌ Application creation failed: {app_response.status_code}")
        print(json.dumps(app_response.json(), indent=2))
else:
    print("⚠️  No jobs found, skipping application test")
print()

# Step 7: Test Interview Scheduling
print("Test 7: Interview Scheduling")
print("-" * 60)
apps_response = requests.get(
    f"{SUPABASE_URL}/rest/v1/applications?select=id&limit=1",
    headers={
        "apikey": ANON_KEY,
        "Authorization": f"Bearer {token}"
    }
)

if apps_response.status_code == 200 and len(apps_response.json()) > 0:
    application_id = apps_response.json()[0]["id"]
    
    interview_response = requests.post(
        f"{SUPABASE_URL}/functions/v1/interview-crud",
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        },
        json={
            "action": "create",
            "data": {
                "application_id": application_id,
                "interview_type": "technical",
                "scheduled_date": "2025-03-15T10:00:00",
                "location": "Conference Room A",
                "status": "scheduled"
            }
        }
    )
    
    if interview_response.status_code == 200 and "data" in interview_response.json():
        interview_data = interview_response.json()["data"]
        print(f"✅ Interview scheduled successfully")
        print(f"   Type: {interview_data['interview_type']}")
        print(f"   Interviewer: {interview_data.get('interviewer', 'N/A')}")
        print(f"   Status: {interview_data['status']}")
    else:
        print(f"❌ Interview scheduling failed: {interview_response.status_code}")
        print(json.dumps(interview_response.json(), indent=2))
else:
    print("⚠️  No applications found, skipping interview test")
print()

print("=" * 60)
print("INTEGRATION TESTS COMPLETE")
print("=" * 60)
