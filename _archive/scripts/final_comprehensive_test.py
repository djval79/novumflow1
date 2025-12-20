import requests
import json

URL = "https://kvtdyttgthbeomyvtmbj.supabase.co"
ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt2dGR5dHRndGhiZW9teXZ0bWJqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4ODkwMjIsImV4cCI6MjA3ODQ2NTAyMn0.H2d19-9u0gqWea004sq4ZCWDzsIWv8iujRWW5ugmKXU"

print("=" * 70)
print("FINAL COMPREHENSIVE TEST - ALL 'ADD NEW' BUTTONS")
print("=" * 70)
print()

# Login
token_resp = requests.post(f"{URL}/auth/v1/token?grant_type=password",
    headers={"apikey": ANON, "Content-Type": "application/json"},
    json={"email": "yodkzlfx@minimax.com", "password": "cqRCDI0hU6"})
token = token_resp.json()["access_token"]
print("✅ Authentication successful\n")

results = {"passed": 0, "failed": 0}

# Test 1: Employee Creation
print("Test 1: Employee Creation (HR Module)")
print("-" * 70)
resp = requests.post(f"{URL}/functions/v1/employee-crud",
    headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
    json={"action": "create", "data": {
        "first_name": "Integration", "last_name": "TestFinal", 
        "email": f"test.final.{token[:8]}@company.com", "employee_number": f"INT{token[:6]}",
        "department": "QA", "position": "Tester", "employment_type": "full_time",
        "date_hired": "2025-02-01", "status": "active"}})
if resp.status_code == 200 and "data" in resp.json():
    print("✅ PASS - Employee created"); results["passed"] += 1
else:
    print(f"❌ FAIL"); results["failed"] += 1
print()

# Test 2: Job Posting
print("Test 2: Job Posting Creation (Recruitment Module)")
print("-" * 70)
resp = requests.post(f"{URL}/functions/v1/job-posting-crud",
    headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
    json={"action": "create", "data": {"job_title": "Test Position", "department": "Engineering",
        "location": "Remote", "employment_type": "full_time", "job_description": "Test",
        "requirements": "Test", "status": "published"}})
if resp.status_code == 200 and "data" in resp.json():
    job_id = resp.json()["data"]["id"]
    print("✅ PASS - Job posting created"); results["passed"] += 1
else:
    print(f"❌ FAIL"); results["failed"] += 1
    job_id = None
print()

# Test 3: Letter Template
print("Test 3: Letter Template Creation (Letters Module)")
print("-" * 70)
resp = requests.post(f"{URL}/functions/v1/letter-template-crud",
    headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
    json={"action": "create", "data": {"template_name": "Final Integration Test",
        "template_type": "offer_letter", "subject": "Test Offer", 
        "content": "Test content", "version": 1}})
if resp.status_code == 200 and "data" in resp.json():
    print("✅ PASS - Letter template created"); results["passed"] += 1
else:
    print(f"❌ FAIL"); results["failed"] += 1
print()

# Test 4: Leave Request
print("Test 4: Leave Request Creation (HR Module)")
print("-" * 70)
emp_resp = requests.get(f"{URL}/rest/v1/employees?select=id&limit=1",
    headers={"apikey": ANON, "Authorization": f"Bearer {token}"})
if emp_resp.status_code == 200 and len(emp_resp.json()) > 0:
    emp_id = emp_resp.json()[0]["id"]
    resp = requests.post(f"{URL}/functions/v1/leave-request-crud",
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
        json={"action": "create", "data": {"employee_id": emp_id, "leave_type": "annual",
            "start_date": "2025-08-01", "end_date": "2025-08-05", "total_days": 5,
            "reason": "Final test", "status": "pending"}})
    if resp.status_code == 200 and "data" in resp.json():
        print("✅ PASS - Leave request created"); results["passed"] += 1
    else:
        print(f"❌ FAIL"); results["failed"] += 1
else:
    print("⚠️  SKIP - No employees"); results["failed"] += 1
print()

# Test 5: Application
print("Test 5: Application Creation (Recruitment Module)")
print("-" * 70)
if job_id:
    resp = requests.post(f"{URL}/functions/v1/application-crud",
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
        json={"action": "create", "data": {"job_id": job_id, "candidate_name": "Test Applicant",
            "email": "applicant@test.com", "phone": "555-TEST",
            "resume_url": "https://example.com/resume.pdf", "status": "applied"}})
    if resp.status_code == 200 and "data" in resp.json():
        app_id = resp.json()["data"]["id"]
        print("✅ PASS - Application created"); results["passed"] += 1
    else:
        print(f"❌ FAIL"); results["failed"] += 1
        app_id = None
else:
    print("⚠️  SKIP"); results["failed"] += 1
    app_id = None
print()

# Test 6: Interview
print("Test 6: Interview Scheduling (Recruitment Module)")
print("-" * 70)
if app_id:
    resp = requests.post(f"{URL}/functions/v1/interview-crud",
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
        json={"action": "create", "data": {"application_id": app_id, "interview_type": "technical",
            "scheduled_date": "2025-04-01T10:00:00", "location": "Conference Room",
            "status": "scheduled"}})
    if resp.status_code == 200 and "data" in resp.json():
        print("✅ PASS - Interview scheduled"); results["passed"] += 1
    else:
        print(f"❌ FAIL"); results["failed"] += 1
else:
    print("⚠️  SKIP"); results["failed"] += 1
print()

print("=" * 70)
print(f"FINAL RESULTS: {results['passed']}/6 TESTS PASSED")
print("=" * 70)
