#!/bin/bash

# Supabase credentials
SUPABASE_URL="https://niikshfoecitimepiifo.supabase.co"
SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5paWtzaGZvZWNpdGltZXBpaWZvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzA1MjIxNSwiZXhwIjoyMDc4NjI4MjE1fQ.sPu18Bb90PKUL_rTDLK6MPvgpS1FfduWq4H0xoNWlA8"
TENANT_ID="00000000-0000-0000-0000-000000000001"

echo "=============================================="
echo "🧪 COMPLIANCE API ENDPOINT TESTS"
echo "=============================================="

# Test 1: GET compliance_persons
echo ""
echo "📋 Test 1: GET compliance_persons"
PERSONS=$(curl -s "$SUPABASE_URL/rest/v1/compliance_persons?tenant_id=eq.$TENANT_ID&select=id,full_name,person_type,compliance_status" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY")
echo "$PERSONS" | python3 -m json.tool 2>/dev/null || echo "$PERSONS"
PERSON_COUNT=$(echo "$PERSONS" | python3 -c "import sys,json; print(len(json.load(sys.stdin)))" 2>/dev/null || echo "0")
echo "✅ Found $PERSON_COUNT persons"

# Test 2: GET compliance_documents
echo ""
echo "📄 Test 2: GET compliance_documents"
DOCS=$(curl -s "$SUPABASE_URL/rest/v1/compliance_documents?tenant_id=eq.$TENANT_ID&select=id,file_name,status,authority&limit=5" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY")
echo "$DOCS" | python3 -m json.tool 2>/dev/null || echo "$DOCS"
DOC_COUNT=$(echo "$DOCS" | python3 -c "import sys,json; print(len(json.load(sys.stdin)))" 2>/dev/null || echo "0")
echo "✅ Found $DOC_COUNT documents (showing 5)"

# Test 3: GET compliance_tasks
echo ""
echo "📝 Test 3: GET compliance_tasks"
TASKS=$(curl -s "$SUPABASE_URL/rest/v1/compliance_tasks?tenant_id=eq.$TENANT_ID&select=id,title,urgency,status" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY")
echo "$TASKS" | python3 -m json.tool 2>/dev/null || echo "$TASKS"
TASK_COUNT=$(echo "$TASKS" | python3 -c "import sys,json; print(len(json.load(sys.stdin)))" 2>/dev/null || echo "0")
echo "✅ Found $TASK_COUNT tasks"

# Test 4: GET compliance_folders
echo ""
echo "📁 Test 4: GET compliance_folders"
FOLDERS=$(curl -s "$SUPABASE_URL/rest/v1/compliance_folders?tenant_id=eq.$TENANT_ID&select=id,name,authority,is_system_folder" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY")
echo "$FOLDERS" | python3 -m json.tool 2>/dev/null || echo "$FOLDERS"
FOLDER_COUNT=$(echo "$FOLDERS" | python3 -c "import sys,json; print(len(json.load(sys.stdin)))" 2>/dev/null || echo "0")
echo "✅ Found $FOLDER_COUNT folders"

# Test 5: GET v_expiring_documents VIEW
echo ""
echo "⏰ Test 5: GET v_expiring_documents (VIEW)"
EXPIRING=$(curl -s "$SUPABASE_URL/rest/v1/v_expiring_documents?tenant_id=eq.$TENANT_ID&select=*" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY")
echo "$EXPIRING" | python3 -m json.tool 2>/dev/null || echo "$EXPIRING"
EXPIRING_COUNT=$(echo "$EXPIRING" | python3 -c "import sys,json; print(len(json.load(sys.stdin)))" 2>/dev/null || echo "0")
echo "✅ Found $EXPIRING_COUNT expiring documents"

# Test 6: GET v_compliance_status VIEW
echo ""
echo "📊 Test 6: GET v_compliance_status (VIEW)"
STATUS=$(curl -s "$SUPABASE_URL/rest/v1/v_compliance_status?tenant_id=eq.$TENANT_ID&select=full_name,compliance_status,overall_compliance_score,total_documents,verified_documents" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY")
echo "$STATUS" | python3 -m json.tool 2>/dev/null || echo "$STATUS"

# Test 7: GET compliance_notifications
echo ""
echo "🔔 Test 7: GET compliance_notifications"
NOTIFS=$(curl -s "$SUPABASE_URL/rest/v1/compliance_notifications?tenant_id=eq.$TENANT_ID&select=id,title,urgency,notification_type" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY")
echo "$NOTIFS" | python3 -m json.tool 2>/dev/null || echo "$NOTIFS"

# Test 8: GET compliance_document_types (master data)
echo ""
echo "📑 Test 8: GET compliance_document_types"
TYPES=$(curl -s "$SUPABASE_URL/rest/v1/compliance_document_types?select=id,name,authority&limit=10" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY")
echo "$TYPES" | python3 -m json.tool 2>/dev/null || echo "$TYPES"

echo ""
echo "=============================================="
echo "✅ ALL API TESTS COMPLETED"
echo "=============================================="
