# Performance Module - Manual Testing Guide

## 🧪 Complete Testing Workflow

This guide walks you through testing every feature of the Performance Management Module after deployment.

---

## Prerequisites

✅ Database tables deployed  
✅ Edge function deployed  
✅ Frontend built and deployed  
✅ You have an admin or hr_manager account  

---

## Test Suite 1: Review Types Management

### Test 1.1: View Default Review Types
**Steps:**
1. Navigate to `/performance`
2. Click "Review Settings" tab
3. Verify you see 5 default review types:
   - Probation Review
   - Annual Performance Review
   - Quarterly Check-in
   - 360-Degree Review
   - Performance Improvement Plan (PIP)

**Expected Result:** ✅ All 5 review types displayed with descriptions

---

### Test 1.2: Create Custom Review Type
**Steps:**
1. In "Review Settings" tab, click "Add New"
2. Fill in form:
   - Name: "Mid-Year Review"
   - Description: "Six-month performance check"
   - Frequency: "Semi-Annual"
   - Enable auto-schedule: YES
   - Trigger: "After Last Review"
   - Offset: 180 days
   - Duration: 14 days
   - Require self-assessment: YES
   - Require manager review: YES
   - Rating scale: "1-5"
3. Click "Create Review Type"

**Expected Result:** ✅ New review type appears in list

**Verification:**
```sql
SELECT * FROM performance_review_types WHERE name = 'Mid-Year Review';
```

---

### Test 1.3: Edit Review Type
**Steps:**
1. Find "Quarterly Check-in" review type
2. Click edit icon (pencil)
3. Change frequency to "Custom"
4. Save changes

**Expected Result:** ✅ Changes saved successfully

---

## Test Suite 2: Auto-Schedule Reviews

### Test 2.1: Auto-Schedule Feature
**Steps:**
1. Navigate to "Reviews" tab
2. Click "Auto-Schedule Reviews" button
3. Wait for completion message

**Expected Result:** ✅ Message shows "Successfully scheduled X review(s)"

**Verification:**
```sql
-- Check for new auto-generated reviews
SELECT * FROM performance_reviews 
WHERE is_auto_generated = TRUE 
ORDER BY created_at DESC LIMIT 10;
```

---

### Test 2.2: Verify Review Creation
**Steps:**
1. Check the reviews list
2. Look for newly created reviews
3. Verify review details:
   - Employee assigned
   - Review type matches
   - Due date is correct
   - Status is "pending"

**Expected Result:** ✅ Auto-scheduled reviews appear correctly

---

### Test 2.3: Check Participant Assignment
**Steps:**
1. Click "View" (eye icon) on an auto-scheduled review
2. Check participants section
3. Verify:
   - Employee listed as "self" participant
   - Manager listed as "manager" participant
   - All have "pending" status

**Expected Result:** ✅ Participants auto-assigned correctly

**Verification:**
```sql
-- Check participants for a review
SELECT rp.*, pr.employee_id, up.full_name
FROM review_participants rp
JOIN performance_reviews pr ON rp.review_id = pr.id
JOIN users_profiles up ON rp.participant_id = up.user_id
WHERE pr.id = 'REVIEW_ID';
```

---

## Test Suite 3: Conducting Reviews

### Test 3.1: Submit Self-Assessment (Employee)
**Steps:**
1. Log in as employee
2. Navigate to `/performance`
3. Find your pending review
4. Click star icon to rate
5. Rate each criterion (1-5)
6. Add comments for each
7. Submit

**Expected Result:** ✅ Self-assessment marked complete

**Verification:**
```sql
SELECT * FROM review_participants 
WHERE participant_type = 'self' 
AND status = 'completed';
```

---

### Test 3.2: Submit Manager Review (Manager)
**Steps:**
1. Log in as manager
2. Navigate to `/performance`
3. Find team member's review
4. Click star icon to rate
5. Rate all criteria
6. Add overall comments
7. Add strengths and areas for improvement
8. Define action items
9. Set next review date
10. Complete review

**Expected Result:** ✅ Manager review submitted, overall rating calculated

**Verification:**
```sql
-- Check if overall rating is calculated
SELECT id, overall_rating, status 
FROM performance_reviews 
WHERE overall_rating IS NOT NULL;
```

---

### Test 3.3: View Completed Review
**Steps:**
1. Click eye icon on completed review
2. Verify all ratings visible
3. Check overall score displayed
4. Review comments and action items

**Expected Result:** ✅ All review data displayed correctly

---

## Test Suite 4: Goals Management

### Test 4.1: Create Individual Goal
**Steps:**
1. Navigate to "Goals" tab
2. Click "Add New"
3. Fill in form:
   - Title: "Complete AWS Certification"
   - Description: "Obtain AWS Solutions Architect certification"
   - Goal Type: "Development"
   - Category: "Skill Development"
   - Target Date: [3 months from now]
   - Priority: "High"
   - Measurement: "Pass certification exam"
   - Target Value: "100%"
4. Assign to employee
5. Submit

**Expected Result:** ✅ Goal created and displayed in list

**Verification:**
```sql
SELECT * FROM performance_goals 
WHERE title LIKE '%AWS%';
```

---

### Test 4.2: Update Goal Progress
**Steps:**
1. Find the AWS certification goal
2. Click edit icon
3. Update progress: 50%
4. Update current value: "Completed 3 of 6 modules"
5. Save

**Expected Result:** 
✅ Progress bar updates to 50%  
✅ Status auto-updates to "on_track"

**Verification:**
```sql
SELECT title, progress_percentage, status 
FROM performance_goals 
WHERE title LIKE '%AWS%';
```

---

### Test 4.3: Complete Goal
**Steps:**
1. Edit the goal again
2. Set progress to 100%
3. Set current value: "Passed exam"
4. Save

**Expected Result:** 
✅ Status auto-updates to "achieved"  
✅ Progress bar shows 100% in green

---

### Test 4.4: Create Cascading Goals
**Steps:**
1. Create company goal: "Increase Revenue by 20%"
2. Create department goal: "Acquire 50 New Clients"
   - Set parent_goal_id to company goal
3. Create individual goal: "Close 10 Deals"
   - Set parent_goal_id to department goal

**Expected Result:** ✅ Goal hierarchy created

**Verification:**
```sql
-- Check goal hierarchy
SELECT id, title, parent_goal_id 
FROM performance_goals 
WHERE parent_goal_id IS NOT NULL;
```

---

## Test Suite 5: KPI Management

### Test 5.1: View Default KPIs
**Steps:**
1. Navigate to "KPIs" tab
2. Filter by category

**Expected Result:** ✅ See 4 default KPI definitions:
- Employee Retention Rate
- Time to Hire
- Training Hours per Employee
- Goal Achievement Rate

---

### Test 5.2: Create Custom KPI Definition
**Steps:**
1. Click "Add New" in KPIs tab
2. Fill form:
   - Name: "Customer Satisfaction Score"
   - Category: "Quality"
   - Measurement Unit: "percentage"
   - Target Type: "above"
   - Frequency: "monthly"
   - Applicable Roles: ["employee"]
3. Submit

**Expected Result:** ✅ New KPI definition created

---

### Test 5.3: Record KPI Value
**Steps:**
1. Click "Add New" in KPI values
2. Select KPI: "Customer Satisfaction Score"
3. Select employee or department
4. Set period: [current month]
5. Target Value: 90
6. Actual Value: 92
7. Submit

**Expected Result:** 
✅ KPI value saved  
✅ Variance auto-calculated: +2  
✅ Status auto-set: "on_target"

**Verification:**
```sql
SELECT kv.*, kd.name 
FROM kpi_values kv
JOIN kpi_definitions kd ON kv.kpi_definition_id = kd.id
WHERE kd.name = 'Customer Satisfaction Score';
```

---

### Test 5.4: Test KPI Status Auto-Calculation
**Steps:**
1. Create KPI value with actual below target
2. Verify status = "below_target"
3. Create another with actual far below
4. Verify status = "needs_attention"

**Expected Result:** ✅ Status auto-calculated correctly

---

## Test Suite 6: Reports & Analytics

### Test 6.1: View Dashboard Metrics
**Steps:**
1. Navigate to "Reports" tab
2. Check all metric cards display correctly:
   - Total Reviews
   - Active Goals
   - Completed Reviews
   - Overdue Reviews
   - Goals at Risk
   - Average Rating

**Expected Result:** ✅ All metrics show accurate counts

---

### Test 6.2: Filter Reviews by Status
**Steps:**
1. Navigate to "Reviews" tab
2. Use status filter dropdown
3. Select "Pending"
4. Verify only pending reviews shown
5. Try other statuses: "In Progress", "Completed", "Overdue"

**Expected Result:** ✅ Filtering works correctly

---

### Test 6.3: Search Functionality
**Steps:**
1. In any tab, use search box
2. Search for employee name
3. Search for review type name
4. Search for goal title

**Expected Result:** ✅ Search filters results correctly

---

## Test Suite 7: Automated Workflows

### Test 7.1: Status Auto-Update (Overdue)
**Steps:**
1. Create a review with due date in the past
2. Wait or manually trigger status check
3. Check review status

**Expected Result:** ✅ Status auto-updates to "overdue"

**Manual Trigger:**
```sql
SELECT update_overdue_reviews();
```

---

### Test 7.2: Goal Status from Progress
**Steps:**
1. Create goal with 30-day target
2. Set progress to 75%
3. Verify status = "on_track"
4. Change progress to 25%
5. Verify status changes to "at_risk"

**Expected Result:** ✅ Status updates automatically on save

---

### Test 7.3: Participant Auto-Complete
**Steps:**
1. Start a review requiring 3 criteria ratings
2. Rate criterion 1
3. Rate criterion 2
4. Rate criterion 3
5. Check participant status

**Expected Result:** ✅ Participant status auto-updates to "completed"

---

## Test Suite 8: Role-Based Access

### Test 8.1: Employee Permissions
**Steps:**
1. Log in as regular employee
2. Try to access Performance module
3. Verify can see:
   - Own reviews only
   - Own goals only
   - Own KPIs only
4. Verify cannot:
   - See other employees' data
   - Create review types
   - Auto-schedule reviews

**Expected Result:** ✅ Access restricted correctly

---

### Test 8.2: Manager Permissions
**Steps:**
1. Log in as manager
2. Verify can see:
   - Team members' reviews
   - Team goals
   - Team KPIs
3. Verify can:
   - Create goals for team
   - Submit manager reviews
4. Verify cannot:
   - Edit review types
   - See other teams' data

**Expected Result:** ✅ Manager access works correctly

---

### Test 8.3: Admin Permissions
**Steps:**
1. Log in as admin
2. Verify full access to:
   - All employees' data
   - Review type management
   - Auto-schedule feature
   - All settings

**Expected Result:** ✅ Admin has complete access

---

## Test Suite 9: Data Integrity

### Test 9.1: Foreign Key Constraints
**Test invalid data:**
```sql
-- Try to create review with invalid review_type_id
INSERT INTO performance_reviews (
  review_type_id, 
  employee_id, 
  review_period_start, 
  review_period_end, 
  review_due_date, 
  created_by
) VALUES (
  'invalid-uuid', 
  'valid-employee-id', 
  '2025-01-01', 
  '2025-06-30', 
  '2025-07-14', 
  'valid-user-id'
);
```

**Expected Result:** ❌ Error: foreign key constraint violation

---

### Test 9.2: Weighted Scoring
**Steps:**
1. Create review type with custom criteria
2. Set different weights (1.0, 1.5, 0.5)
3. Rate all criteria
4. Verify overall rating calculation

**Formula:**
```
Overall Rating = SUM(rating × weight) / SUM(weights)
```

**Expected Result:** ✅ Weighted average calculated correctly

---

### Test 9.3: Audit Logging
**Verification:**
```sql
-- Check audit logs for performance actions
SELECT * FROM audit_logs 
WHERE entity_type LIKE 'performance%' 
ORDER BY timestamp DESC 
LIMIT 20;
```

**Expected Result:** ✅ All CRUD operations logged

---

## Test Suite 10: Edge Cases

### Test 10.1: Empty States
**Steps:**
1. Log in as new employee with no data
2. Check each tab shows appropriate empty state messages

**Expected Result:** ✅ User-friendly "No data" messages

---

### Test 10.2: Multiple Review Types Same Employee
**Steps:**
1. Create Probation review for employee
2. Also create Quarterly review for same employee
3. Both should be schedulable simultaneously

**Expected Result:** ✅ Multiple active reviews per employee allowed

---

### Test 10.3: Past Due Date Handling
**Steps:**
1. Try to create review with due date in past
2. Verify status immediately set to "overdue"

**Expected Result:** ✅ Past due dates handled correctly

---

## ✅ Final Checklist

After completing all tests, verify:

- [ ] All 5 tabs accessible
- [ ] Auto-schedule creates reviews correctly
- [ ] Self-assessment works
- [ ] Manager reviews work
- [ ] Goals track progress
- [ ] KPIs calculate variance
- [ ] Reports show metrics
- [ ] Filters work
- [ ] Search works
- [ ] Role-based access enforced
- [ ] Audit logs captured
- [ ] No console errors
- [ ] Mobile responsive
- [ ] Performance acceptable (<3s page load)

---

## 🐛 Bug Reporting Template

If you find issues, document as:

```
**Bug:** [Brief description]
**Steps to Reproduce:**
1. 
2. 
3. 

**Expected:** [What should happen]
**Actual:** [What actually happens]
**Browser:** [Chrome/Safari/Firefox]
**Role:** [admin/hr_manager/manager/employee]
**Screenshots:** [If applicable]
```

---

## 🎉 Success Criteria

Module is fully functional when:

✅ All 10 test suites pass  
✅ No critical bugs found  
✅ Performance acceptable  
✅ All roles can access appropriate features  
✅ Data integrity maintained  
✅ Audit trail complete  

---

*Estimated testing time: 2-3 hours for complete coverage*
