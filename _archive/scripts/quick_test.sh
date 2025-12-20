#!/bin/bash
URL="https://kvtdyttgthbeomyvtmbj.supabase.co"
ANON="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt2dGR5dHRndGhiZW9teXZ0bWJqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4ODkwMjIsImV4cCI6MjA3ODQ2NTAyMn0.H2d19-9u0gqWea004sq4ZCWDzsIWv8iujRWW5ugmKXU"

# Login
TOKEN=$(curl -s -X POST "$URL/auth/v1/token?grant_type=password" \
  -H "apikey: $ANON" -H "Content-Type: application/json" \
  -d '{"email":"yodkzlfx@minimax.com","password":"cqRCDI0hU6"}' | jq -r '.access_token')

echo "=== Quick Edge Function Tests ==="
echo ""

# Test Letter Template
echo "1. Letter Template Creation:"
curl -s -X POST "$URL/functions/v1/letter-template-crud" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"action":"create","data":{"template_name":"Quick Test","template_type":"offer_letter","subject":"Test","content":"Test content","version":1}}' \
  | jq -r 'if .data then "✅ SUCCESS" else "❌ FAILED: " + (.error.message // "Unknown error") end'

# Get a job ID
JOB_ID=$(curl -s "$URL/rest/v1/job_postings?select=id&limit=1" \
  -H "apikey: $ANON" -H "Authorization: Bearer $TOKEN" | jq -r '.[0].id')

# Test Application
echo "2. Application Creation:"
curl -s -X POST "$URL/functions/v1/application-crud" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d "{\"action\":\"create\",\"data\":{\"job_id\":\"$JOB_ID\",\"candidate_name\":\"Test User\",\"email\":\"test@example.com\",\"resume_url\":\"https://example.com/resume.pdf\",\"status\":\"applied\"}}" \
  | jq -r 'if .data then "✅ SUCCESS" else "❌ FAILED: " + (.error.message // "Unknown error") end'

# Get an application ID  
APP_ID=$(curl -s "$URL/rest/v1/applications?select=id&limit=1" \
  -H "apikey: $ANON" -H "Authorization: Bearer $TOKEN" | jq -r '.[0].id')

# Test Interview
echo "3. Interview Scheduling:"
curl -s -X POST "$URL/functions/v1/interview-crud" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d "{\"action\":\"create\",\"data\":{\"application_id\":\"$APP_ID\",\"interview_type\":\"technical\",\"scheduled_date\":\"2025-03-15T10:00:00\",\"location\":\"Test Room\",\"status\":\"scheduled\"}}" \
  | jq -r 'if .data then "✅ SUCCESS" else "❌ FAILED: " + (.error.message // "Unknown error") end'

echo ""
echo "=== Tests Complete ==="
