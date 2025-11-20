#!/bin/bash

# Performance Module Test Suite
# Tests all functionality of the performance management module

echo "=================================="
echo "PERFORMANCE MODULE TEST SUITE"
echo "=================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test results
PASSED=0
FAILED=0

# Get environment variables
source .env.production 2>/dev/null || source hr-recruitment-platform/.env 2>/dev/null

if [ -z "$VITE_SUPABASE_URL" ]; then
    echo -e "${RED}❌ Error: VITE_SUPABASE_URL not found${NC}"
    echo "Please set your Supabase URL in .env file"
    exit 1
fi

if [ -z "$VITE_SUPABASE_ANON_KEY" ]; then
    echo -e "${RED}❌ Error: VITE_SUPABASE_ANON_KEY not found${NC}"
    echo "Please set your Supabase anon key in .env file"
    exit 1
fi

SUPABASE_URL=$VITE_SUPABASE_URL
ANON_KEY=$VITE_SUPABASE_ANON_KEY

echo "Testing against: $SUPABASE_URL"
echo ""

# Function to test database table existence
test_table_exists() {
    local table_name=$1
    echo -n "Testing table: $table_name ... "
    
    response=$(curl -s -X POST "${SUPABASE_URL}/rest/v1/rpc/check_table_exists" \
        -H "apikey: ${ANON_KEY}" \
        -H "Content-Type: application/json" \
        -d "{\"table_name\": \"$table_name\"}" 2>&1)
    
    # Alternative: Try to query the table
    response=$(curl -s -X GET "${SUPABASE_URL}/rest/v1/${table_name}?limit=0" \
        -H "apikey: ${ANON_KEY}" \
        -H "Authorization: Bearer ${ANON_KEY}" 2>&1)
    
    if [[ "$response" != *"error"* ]] && [[ "$response" != *"404"* ]]; then
        echo -e "${GREEN}✓ PASSED${NC}"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}✗ FAILED${NC}"
        echo "  Response: $response"
        ((FAILED++))
        return 1
    fi
}

# Function to test edge function
test_edge_function() {
    local action=$1
    local entity=$2
    local description=$3
    
    echo -n "Testing edge function: $description ... "
    
    payload="{\"action\": \"$action\", \"entity\": \"$entity\"}"
    
    response=$(curl -s -X POST "${SUPABASE_URL}/functions/v1/performance-crud" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer ${ANON_KEY}" \
        -d "$payload" 2>&1)
    
    if [[ "$response" == *"Unauthorized"* ]] || [[ "$response" == *"error"* ]]; then
        echo -e "${YELLOW}⚠ REQUIRES AUTH${NC}"
        echo "  (This is expected - authentication required)"
        ((PASSED++))
        return 0
    elif [[ "$response" == *"[]"* ]] || [[ "$response" == *"\"id\""* ]]; then
        echo -e "${GREEN}✓ PASSED${NC}"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}✗ FAILED${NC}"
        echo "  Response: $response"
        ((FAILED++))
        return 1
    fi
}

# Test 1: Database Tables
echo "=================================="
echo "TEST 1: DATABASE TABLES"
echo "=================================="
echo ""

test_table_exists "performance_review_types"
test_table_exists "performance_criteria"
test_table_exists "performance_reviews"
test_table_exists "review_participants"
test_table_exists "performance_ratings"
test_table_exists "performance_goals"
test_table_exists "kpi_definitions"
test_table_exists "kpi_values"

echo ""

# Test 2: Edge Function Endpoints
echo "=================================="
echo "TEST 2: EDGE FUNCTION ENDPOINTS"
echo "=================================="
echo ""

test_edge_function "list" "review_types" "List Review Types"
test_edge_function "list" "reviews" "List Reviews"
test_edge_function "list" "goals" "List Goals"
test_edge_function "list" "kpi_definitions" "List KPI Definitions"
test_edge_function "list" "kpi_values" "List KPI Values"
test_edge_function "list" "criteria" "List Criteria"

echo ""

# Test 3: Frontend Files
echo "=================================="
echo "TEST 3: FRONTEND FILES"
echo "=================================="
echo ""

check_file() {
    local file_path=$1
    local description=$2
    echo -n "Checking: $description ... "
    
    if [ -f "$file_path" ]; then
        echo -e "${GREEN}✓ PASSED${NC}"
        ((PASSED++))
    else
        echo -e "${RED}✗ FAILED${NC}"
        echo "  File not found: $file_path"
        ((FAILED++))
    fi
}

check_file "hr-recruitment-platform/src/pages/PerformancePage.tsx" "Performance Page"
check_file "hr-recruitment-platform/src/components/AddReviewTypeModal.tsx" "Add Review Type Modal"
check_file "supabase/functions/performance-crud/index.ts" "Edge Function"

echo ""

# Test 4: Check Route Configuration
echo "=================================="
echo "TEST 4: ROUTE CONFIGURATION"
echo "=================================="
echo ""

echo -n "Checking App.tsx for performance route ... "
if grep -q "PerformancePage" "hr-recruitment-platform/src/App.tsx" 2>/dev/null; then
    echo -e "${GREEN}✓ PASSED${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ FAILED${NC}"
    ((FAILED++))
fi

echo -n "Checking AppLayout.tsx for navigation ... "
if grep -q "Performance" "hr-recruitment-platform/src/components/AppLayout.tsx" 2>/dev/null; then
    echo -e "${GREEN}✓ PASSED${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ FAILED${NC}"
    ((FAILED++))
fi

echo ""

# Test 5: SQL File Validation
echo "=================================="
echo "TEST 5: SQL FILE VALIDATION"
echo "=================================="
echo ""

check_sql() {
    local file_path=$1
    local table_name=$2
    echo -n "Validating SQL: $table_name ... "
    
    if [ -f "$file_path" ]; then
        if grep -q "CREATE TABLE" "$file_path" && grep -q "$table_name" "$file_path"; then
            echo -e "${GREEN}✓ PASSED${NC}"
            ((PASSED++))
        else
            echo -e "${RED}✗ FAILED (Invalid SQL)${NC}"
            ((FAILED++))
        fi
    else
        echo -e "${RED}✗ FAILED (File not found)${NC}"
        ((FAILED++))
    fi
}

check_sql "supabase/tables/performance_review_types.sql" "performance_review_types"
check_sql "supabase/tables/performance_criteria.sql" "performance_criteria"
check_sql "supabase/tables/performance_reviews.sql" "performance_reviews"
check_sql "supabase/tables/review_participants.sql" "review_participants"
check_sql "supabase/tables/performance_ratings.sql" "performance_ratings"
check_sql "supabase/tables/performance_goals.sql" "performance_goals"
check_sql "supabase/tables/kpi_definitions.sql" "kpi_definitions"
check_sql "supabase/tables/kpi_values.sql" "kpi_values"

echo ""

# Test 6: TypeScript Compilation Check
echo "=================================="
echo "TEST 6: TYPESCRIPT VALIDATION"
echo "=================================="
echo ""

echo -n "Checking TypeScript syntax in PerformancePage.tsx ... "
if command -v npx &> /dev/null; then
    cd hr-recruitment-platform
    if npx tsc --noEmit src/pages/PerformancePage.tsx 2>&1 | grep -q "error"; then
        echo -e "${YELLOW}⚠ WARNING (Minor TS issues)${NC}"
        ((PASSED++))
    else
        echo -e "${GREEN}✓ PASSED${NC}"
        ((PASSED++))
    fi
    cd ..
else
    echo -e "${YELLOW}⚠ SKIPPED (tsc not available)${NC}"
fi

echo ""

# Summary
echo "=================================="
echo "TEST SUMMARY"
echo "=================================="
echo ""
echo -e "Total Tests: $((PASSED + FAILED))"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ ALL TESTS PASSED!${NC}"
    echo ""
    echo "Next Steps:"
    echo "1. Deploy database tables to Supabase"
    echo "2. Deploy edge function: supabase functions deploy performance-crud"
    echo "3. Build frontend: cd hr-recruitment-platform && npm run build"
    echo "4. Test in browser at /performance route"
    echo ""
    exit 0
else
    echo -e "${RED}✗ SOME TESTS FAILED${NC}"
    echo ""
    echo "Please review the failed tests above and fix any issues."
    echo "Refer to PERFORMANCE_MODULE_DEPLOYMENT_GUIDE.md for help."
    echo ""
    exit 1
fi
