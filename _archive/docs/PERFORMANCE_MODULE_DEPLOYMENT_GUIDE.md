# Performance Management Module - Deployment Guide

## 📋 Overview

This guide will help you deploy the **fully customizable Performance Management Module** to your NOVUMFLOW HR platform. The module supports:

- ✅ **Customizable Review Types** (Probation, Annual, 360°, PIP, etc.)
- ✅ **Automated Review Scheduling** (based on hire date, anniversaries, etc.)
- ✅ **Multi-Reviewer Support** (Self, Manager, Peer, Skip-level reviews)
- ✅ **Goals & Objectives Tracking** (SMART goals with progress tracking)
- ✅ **KPI Management** (Define and track key performance indicators)
- ✅ **Flexible Rating Scales** (1-5, 1-10, A-F, custom)
- ✅ **Automated Workflows** (Auto-schedule reviews, reminders, status updates)

---

## 🚀 Deployment Steps

### Step 1: Deploy Database Tables

#### Option A: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Execute each file in this order:

```sql
-- 1. Review Types (5-10 default types included)
-- Copy content from: supabase/tables/performance_review_types.sql

-- 2. Performance Criteria (Default criteria for Annual Review)
-- Copy content from: supabase/tables/performance_criteria.sql

-- 3. Performance Reviews
-- Copy content from: supabase/tables/performance_reviews.sql

-- 4. Review Participants
-- Copy content from: supabase/tables/review_participants.sql

-- 5. Performance Ratings
-- Copy content from: supabase/tables/performance_ratings.sql

-- 6. Performance Goals
-- Copy content from: supabase/tables/performance_goals.sql

-- 7. KPI Definitions (4 default KPIs included)
-- Copy content from: supabase/tables/kpi_definitions.sql

-- 8. KPI Values
-- Copy content from: supabase/tables/kpi_values.sql
```

#### Option B: Using Migration File

```bash
# From your project root
psql $DATABASE_URL -f supabase/migrations/0001_performance_module.sql
```

#### Verify Tables Created

Run this query in Supabase SQL Editor:

```sql
SELECT tablename, schemaname
FROM pg_tables 
WHERE tablename LIKE 'performance%' 
   OR tablename LIKE 'review%' 
   OR tablename LIKE 'kpi%'
ORDER BY tablename;
```

You should see 8 tables:
- `performance_review_types`
- `performance_criteria`
- `performance_reviews`
- `review_participants`
- `performance_ratings`
- `performance_goals`
- `kpi_definitions`
- `kpi_values`

---

### Step 2: Deploy Edge Function

1. Navigate to **Edge Functions** in Supabase Dashboard
2. Create new function named `performance-crud`
3. Copy content from `supabase/functions/performance-crud/index.ts`
4. Deploy the function

#### Using Supabase CLI:

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref YOUR_PROJECT_REF

# Deploy the function
supabase functions deploy performance-crud
```

#### Verify Function Deployed

Test the function with this curl command:

```bash
curl -X POST \
  'https://YOUR_PROJECT_REF.supabase.co/functions/v1/performance-crud' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"action": "list", "entity": "review_types"}'
```

---

### Step 3: Deploy Frontend Components

The following files have been created in your `hr-recruitment-platform` directory:

✅ **Main Page:**
- `src/pages/PerformancePage.tsx`

✅ **Modal Components:**
- `src/components/AddReviewTypeModal.tsx`
- *(Additional modals can be added as needed)*

✅ **Updated Files:**
- `src/App.tsx` - Route added
- `src/components/AppLayout.tsx` - Navigation added

#### Build and Deploy:

```bash
# Navigate to your frontend directory
cd hr-recruitment-platform

# Install dependencies (if needed)
npm install

# Build the application
npm run build

# Deploy to Netlify (if using Netlify)
netlify deploy --prod
```

---

## 🎯 Default Review Types Included

The system comes pre-configured with 5 review types:

### 1. **Probation Review**
- ⏰ Auto-scheduled 85 days after hire
- 👤 Self-assessment + Manager review
- 📊 1-5 rating scale
- 🎯 Purpose: Evaluate new employee before probation ends

### 2. **Annual Performance Review**
- ⏰ Auto-scheduled on work anniversary
- 👥 Self + Manager + 3 Peer reviews
- 📊 1-5 rating scale
- 🎯 Purpose: Comprehensive yearly evaluation

### 3. **Quarterly Check-in**
- ⏰ Auto-scheduled every 90 days
- 👤 Self-assessment + Manager review
- 📊 1-5 rating scale
- 🎯 Purpose: Regular progress tracking

### 4. **360-Degree Review**
- 🔧 Manual scheduling
- 👥 Self + Manager + 5 Peers + Skip-level
- 📊 1-5 rating scale
- 🎯 Purpose: Multi-perspective feedback

### 5. **Performance Improvement Plan (PIP)**
- 🔧 Manual scheduling
- 👤 Manager review only
- 📊 1-5 rating scale
- 🎯 Purpose: Structured improvement tracking

---

## 🎨 Customization Guide

### Creating Custom Review Types

1. Navigate to **Performance > Review Settings**
2. Click **"Add New"**
3. Configure:
   - **Name & Description**
   - **Frequency** (One-time, Quarterly, Annual, Custom)
   - **Auto-Schedule Settings**
     - Trigger: Hire date / Anniversary / Last review / Manual
     - Offset days (when to schedule)
     - Duration (how long review stays open)
   - **Participants**
     - ☑️ Self-assessment
     - ☑️ Manager review
     - ☑️ Peer review (specify count)
     - ☑️ Skip-level review
   - **Rating Scale** (1-5, 1-10, A-F, Custom, None)

### Creating Custom Evaluation Criteria

1. Go to **Performance > Review Settings**
2. Select a review type
3. Click the **+** icon to add criteria
4. Define:
   - **Category** (e.g., "Technical Skills", "Leadership")
   - **Criterion Name** (e.g., "Code Quality")
   - **Description** (what to evaluate)
   - **Weight** (importance in overall score)
   - **Display Order** (sequence in review form)

### Defining Custom KPIs

1. Navigate to **Performance > KPIs**
2. Click **"Add New"**
3. Configure:
   - **Name** (e.g., "Customer Satisfaction Score")
   - **Category** (e.g., "Customer Service")
   - **Measurement Unit** (percentage, count, currency, hours)
   - **Target Type** (above, below, exact, range)
   - **Frequency** (daily, weekly, monthly, quarterly, annual)
   - **Applicable Roles** (which roles this KPI applies to)

---

## 🤖 Automation Features

### Auto-Scheduled Reviews

The system automatically creates reviews based on your configuration:

**Run Auto-Scheduler:**
1. Navigate to **Performance > Reviews**
2. Click **"Auto-Schedule Reviews"** button
3. System will:
   - Check all active review types with auto-schedule enabled
   - Calculate due dates based on trigger events
   - Create reviews for eligible employees
   - Assign participants automatically
   - Send notifications (if configured)

**Recommended:** Set up a cron job to run auto-scheduler daily/weekly.

### Automated Status Updates

The system automatically updates statuses:

- ⚠️ Reviews → **"Overdue"** when past due date
- ✅ Goals → **"Achieved"** when progress reaches 100%
- 📈 Goals → **"On Track"** / **"At Risk"** based on progress vs. time
- 📊 KPI Values → **"On Target"** / **"Below Target"** / **"Needs Attention"**

### Progress Tracking

- Goals automatically calculate status from progress percentage
- KPI variance and status auto-computed on save
- Review completion tracked per participant type

---

## 👥 User Roles & Permissions

### Admin / HR Manager
- ✅ Create/edit review types
- ✅ Define evaluation criteria
- ✅ Create/edit KPI definitions
- ✅ Schedule reviews for any employee
- ✅ View all reviews, goals, and KPIs
- ✅ Auto-schedule reviews
- ✅ Access all reports

### Manager
- ✅ View team member reviews
- ✅ Create goals for team members
- ✅ Submit manager reviews
- ✅ Track team KPIs
- ❌ Cannot modify review types or global settings

### Employee
- ✅ View own reviews
- ✅ Submit self-assessments
- ✅ Track own goals
- ✅ View own KPIs
- ✅ Submit peer reviews (when assigned)
- ❌ Cannot view other employees' data

---

## 📊 Using the Module

### Conducting a Performance Review

**For Employees (Self-Assessment):**
1. Navigate to **Performance > Reviews**
2. Find your pending review
3. Click the **⭐ Star icon** to start rating
4. Rate each criterion (with comments/examples)
5. Submit when complete

**For Managers:**
1. Navigate to **Performance > Reviews**
2. Filter by "Pending" or "In Progress"
3. Click **👁️ Eye icon** to view review details
4. Click **⭐ Star icon** to provide ratings
5. Add overall comments, strengths, areas for improvement
6. Define action items
7. Set next review date
8. Complete review

### Managing Goals

**Create a Goal:**
1. **Performance > Goals**
2. Click **"Add New"**
3. Fill in:
   - Title & Description
   - Goal Type (Individual, Team, Company, Development)
   - Category & Priority
   - Target Date
   - Measurement Criteria
   - Target Value
4. Assign to employee
5. Link to review (optional)

**Update Progress:**
1. Find goal in list
2. Click **✏️ Edit icon**
3. Update progress percentage
4. Update current value
5. Save - status auto-updates

### Tracking KPIs

**Record KPI Values:**
1. **Performance > KPIs**
2. Click **"Add New"**
3. Select:
   - KPI Definition
   - Employee or Department
   - Period (start and end dates)
   - Target Value
   - Actual Value
4. System auto-calculates:
   - Variance
   - Status (On Target, Below Target, Needs Attention)

---

## 📈 Reports & Analytics

Navigate to **Performance > Reports** to view:

- 📊 **Total Reviews** - All reviews in system
- ✅ **Completed Reviews** - Successfully finished
- ⚠️ **Overdue Reviews** - Past due date
- 🎯 **Active Goals** - Goals in progress
- 🚨 **Goals at Risk** - Behind schedule
- ⭐ **Average Rating** - Across all completed reviews

---

## 🔧 Troubleshooting

### Reviews Not Auto-Scheduling

**Check:**
1. Review type has `auto_schedule = true`
2. Trigger event is set correctly
3. Employees have required dates (hire_date, etc.)
4. No existing review for that period
5. Run the auto-scheduler manually first time

**Solution:**
```sql
-- Verify auto-schedule settings
SELECT id, name, auto_schedule, trigger_event, schedule_offset_days
FROM performance_review_types
WHERE is_active = true;

-- Check employee dates
SELECT id, first_name, last_name, hire_date
FROM employees
WHERE status = 'active';
```

### Permissions Issues

**Check:**
1. User role in `users_profiles` table
2. RLS policies are enabled on all tables
3. Edge function receives valid auth token

**Verify:**
```sql
-- Check user role
SELECT user_id, role FROM users_profiles WHERE user_id = 'USER_ID';

-- Check RLS enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename LIKE 'performance%';
```

### Edge Function Errors

**Common Issues:**
- Missing authorization header
- Invalid action/entity combination
- Database connection timeout

**Debug:**
- Check Supabase Edge Function logs
- Test with curl commands
- Verify environment variables set

---

## 🎓 Training Resources

### For Administrators

1. **Initial Setup:**
   - Review default review types
   - Customize evaluation criteria
   - Define company KPIs
   - Set up automation schedule

2. **Ongoing Management:**
   - Monitor overdue reviews
   - Review system analytics
   - Adjust criteria/KPIs as needed
   - Generate reports for leadership

### For Managers

1. **Review Management:**
   - Complete manager reviews on time
   - Provide constructive feedback
   - Define clear action items
   - Schedule follow-ups

2. **Goal Setting:**
   - Set SMART goals for team members
   - Link goals to reviews
   - Monitor progress regularly
   - Celebrate achievements

### For Employees

1. **Self-Assessment:**
   - Be honest and thorough
   - Provide specific examples
   - Highlight achievements
   - Identify development areas

2. **Goal Tracking:**
   - Update progress regularly
   - Document accomplishments
   - Seek help when at risk
   - Review alignment with company objectives

---

## 🆘 Support

For issues or questions:
1. Check this deployment guide
2. Review database schema files
3. Check Supabase logs
4. Test edge function endpoints
5. Verify RLS policies

---

## 📝 Next Steps

After deployment:

1. ✅ Test all review types
2. ✅ Create sample goals
3. ✅ Define your first KPIs
4. ✅ Customize evaluation criteria
5. ✅ Train managers and employees
6. ✅ Run first auto-schedule
7. ✅ Monitor and iterate

---

## 🎉 Success!

You now have a fully functional, highly customizable Performance Management system that:

- Automates review scheduling
- Supports multiple review types and occasions
- Tracks goals and KPIs
- Provides comprehensive reporting
- Scales with your organization

**Enjoy managing performance with NOVUMFLOW! 🚀**
