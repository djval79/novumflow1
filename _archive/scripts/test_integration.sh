#!/bin/bash

SUPABASE_URL="https://kvtdyttgthbeomyvtmbj.supabase.co"
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt2dGR5dHRndGhiZW9teXZ0bWJqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4ODkwMjIsImV4cCI6MjA3ODQ2NTAyMn0.H2d19-9u0gqWea004sq4ZCWDzsIWv8iujRWW5ugmKXU"

echo "=== HR Platform Integration Testing ==="
echo ""

# Step 1: Login and get session token
echo "Test 1: User Login"
LOGIN_RESPONSE=$(curl -s -X POST "${SUPABASE_URL}/auth/v1/token?grant_type=password" \
  -H "apikey: ${ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "yodkzlfx@minimax.com",
    "password": "cqRCDI0hU6"
  }')

ACCESS_TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$ACCESS_TOKEN" ]; then
    echo "❌ Login failed"
    echo "$LOGIN_RESPONSE"
    exit 1
fi

echo "✅ Login successful - Token obtained"
echo ""

# Step 2: Test Employee Creation
echo "Test 2: Create Employee"
EMP_RESPONSE=$(curl -s -X POST "${SUPABASE_URL}/functions/v1/employee-crud" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "create",
    "data": {
      "first_name": "Integration",
      "last_name": "Test",
      "email": "integration.test@company.com",
      "phone": "555-TEST",
      "employee_number": "INT001",
      "department": "Testing",
      "position": "Test Engineer",
      "employment_type": "full_time",
      "hire_date": "2025-01-20",
      "status": "active"
    }
  }')

if echo "$EMP_RESPONSE" | grep -q '"data"'; then
    echo "✅ Employee created successfully"
    echo "$EMP_RESPONSE" | grep -o '"first_name":"[^"]*"' | head -1
else
    echo "❌ Employee creation failed"
    echo "$EMP_RESPONSE"
fi
echo ""

# Step 3: Test Job Posting Creation
echo "Test 3: Create Job Posting"
JOB_RESPONSE=$(curl -s -X POST "${SUPABASE_URL}/functions/v1/job-posting-crud" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "create",
    "data": {
      "job_title": "Integration Test Position",
      "department": "Engineering",
      "location": "Remote",
      "employment_type": "full_time",
      "job_description": "Testing the integration of job posting functionality",
      "requirements": "Testing experience required",
      "status": "draft"
    }
  }')

if echo "$JOB_RESPONSE" | grep -q '"data"'; then
    echo "✅ Job posting created successfully"
    echo "$JOB_RESPONSE" | grep -o '"job_title":"[^"]*"' | head -1
else
    echo "❌ Job posting creation failed"
    echo "$JOB_RESPONSE"
fi
echo ""

# Step 4: Test Leave Request Creation
echo "Test 4: Create Leave Request"
# First get an employee ID
EMP_ID=$(curl -s "${SUPABASE_URL}/rest/v1/employees?select=id&limit=1" \
  -H "apikey: ${ANON_KEY}" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ ! -z "$EMP_ID" ]; then
    LEAVE_RESPONSE=$(curl -s -X POST "${SUPABASE_URL}/functions/v1/leave-request-crud" \
      -H "Authorization: Bearer ${ACCESS_TOKEN}" \
      -H "Content-Type: application/json" \
      -d "{
        \"action\": \"create\",
        \"data\": {
          \"employee_id\": \"${EMP_ID}\",
          \"leave_type\": \"annual\",
          \"start_date\": \"2025-06-01\",
          \"end_date\": \"2025-06-05\",
          \"total_days\": 5,
          \"reason\": \"Integration test leave request\",
          \"status\": \"pending\"
        }
      }")
    
    if echo "$LEAVE_RESPONSE" | grep -q '"data"'; then
        echo "✅ Leave request created successfully"
    else
        echo "❌ Leave request creation failed"
        echo "$LEAVE_RESPONSE"
    fi
else
    echo "⚠️  No employees found, skipping leave request test"
fi
echo ""

# Step 5: Test Letter Template Creation  
echo "Test 5: Create Letter Template"
TEMPLATE_RESPONSE=$(curl -s -X POST "${SUPABASE_URL}/rest/v1/letter_templates" \
  -H "apikey: ${ANON_KEY}" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{
    "template_name": "Integration Test Template",
    "template_type": "offer_letter",
    "subject_line": "Test Subject Line",
    "body_template": "Integration test template body",
    "version": 1.0,
    "is_active": true
  }')

if echo "$TEMPLATE_RESPONSE" | grep -q '"template_name"'; then
    echo "✅ Letter template created successfully"
    echo "$TEMPLATE_RESPONSE" | grep -o '"template_name":"[^"]*"' | head -1
else
    echo "❌ Letter template creation failed"
    echo "$TEMPLATE_RESPONSE"
fi
echo ""

echo "=== Integration Testing Complete ==="
