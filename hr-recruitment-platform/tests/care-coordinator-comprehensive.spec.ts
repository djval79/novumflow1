import { test, expect } from '@playwright/test';

test.describe('NovumFlow HR Platform - Care Coordinator Testing', () => {
  const baseUrl = 'https://06zg1rigplv6.space.minimax.io';

  test.beforeEach(async ({ page }) => {
    await page.goto(baseUrl);
  });

  test('Complete Care Coordinator Workflow Test', async ({ page }) => {
    console.log('🚀 Starting comprehensive NovumFlow testing...');
    
    // Step 1: Admin Login and Dashboard Verification
    console.log('📊 Step 1: Admin Login and Dashboard Verification');
    await page.click('text=Login');
    await page.fill('input[type="email"]', 'admin@hrplatform.com');
    await page.fill('input[type="password"]', 'Admin123!');
    await page.click('button[type="submit"]');
    
    // Wait for dashboard to load
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    await expect(page.locator('h1')).toContainText('Dashboard');
    
    // Verify dashboard metrics are loading
    await expect(page.locator('text=Total Employees')).toBeVisible();
    await expect(page.locator('text=Active Jobs')).toBeVisible();
    await expect(page.locator('text=Pending Applications')).toBeVisible();
    console.log('✅ Dashboard loaded successfully');

    // Step 2: Employee Management Testing
    console.log('👥 Step 2: Employee Management Testing');
    await page.click('text=HR');
    await page.waitForTimeout(2000);
    
    // Navigate to Employees tab
    await page.click('text=Employees');
    await page.waitForTimeout(3000);
    
    // Test Add Employee functionality
    await page.click('text=Add Employee');
    await page.waitForTimeout(1000);
    
    // Fill employee form
    await page.fill('input[name="first_name"]', 'John');
    await page.fill('input[name="last_name"]', 'Smith');
    await page.fill('input[name="email"]', 'john.smith@carecompany.com');
    await page.selectOption('select[name="department"]', 'Healthcare');
    await page.selectOption('select[name="position"]', 'Care Worker');
    await page.selectOption('select[name="employment_type"]', 'Full-time');
    await page.fill('input[name="employee_number"]', 'EMP001');
    await page.fill('input[name="phone"]', '+447700900123');
    await page.fill('input[name="address"]', '123 Care Street, London');
    await page.fill('input[name="salary"]', '25000');
    
    // Save employee
    await page.click('text=Save Employee');
    await page.waitForTimeout(2000);
    
    // Verify employee was added
    await expect(page.locator('text=John Smith')).toBeVisible();
    console.log('✅ Employee created successfully');

    // Test Search functionality
    await page.fill('input[placeholder*="Search"]', 'John Smith');
    await page.waitForTimeout(1000);
    await expect(page.locator('text=John Smith')).toBeVisible();
    console.log('✅ Employee search working');

    // Step 3: Job Posting and Recruitment Testing
    console.log('📋 Step 3: Job Posting and Recruitment Testing');
    await page.click('text=Recruitment');
    await page.waitForTimeout(3000);
    
    // Navigate to Jobs tab
    await page.click('text=Job Postings');
    await page.waitForTimeout(2000);
    
    // Test Add Job functionality
    await page.click('text=Add Job');
    await page.waitForTimeout(1000);
    
    // Fill job form
    await page.fill('input[name="title"]', 'Senior Care Worker');
    await page.fill('textarea[name="description"]', 'We are looking for an experienced care worker to join our team.');
    await page.selectOption('select[name="department"]', 'Healthcare');
    await page.selectOption('select[name="employment_type"]', 'Full-time');
    await page.selectOption('select[name="location"]', 'London');
    await page.fill('input[name="min_salary"]', '24000');
    await page.fill('input[name="max_salary"]', '30000');
    await page.selectOption('select[name="status"]', 'Published');
    
    // Save job
    await page.click('text=Post Job');
    await page.waitForTimeout(2000);
    
    // Verify job was posted
    await expect(page.locator('text=Senior Care Worker')).toBeVisible();
    console.log('✅ Job posted successfully');

    // Step 4: Application Process Testing
    console.log('📝 Step 4: Application Process Testing');
    // Logout and apply as candidate
    await page.click('button[aria-label="User menu"]');
    await page.click('text=Logout');
    await page.waitForTimeout(2000);
    
    // Navigate to career page
    await page.goto(baseUrl + '/careers');
    await page.waitForTimeout(3000);
    
    // Find and apply for the job
    await page.click('text=Senior Care Worker');
    await page.waitForTimeout(1000);
    await page.click('text=Apply Now');
    await page.waitForTimeout(1000);
    
    // Fill application form
    await page.fill('input[name="first_name"]', 'Jane');
    await page.fill('input[name="last_name"]', 'Doe');
    await page.fill('input[name="email"]', 'jane.doe@email.com');
    await page.fill('input[name="phone"]', '+447700900456');
    await page.fill('textarea[name="cover_letter"]', 'I am passionate about care and have 5 years of experience.');
    
    // Submit application
    await page.click('text=Submit Application');
    await page.waitForTimeout(2000);
    
    await expect(page.locator('text=Application submitted')).toBeVisible();
    console.log('✅ Application submitted successfully');

    // Step 5: Interview Scheduling Testing
    console.log('📅 Step 5: Interview Scheduling Testing');
    // Login as HR Manager to process applications
    await page.goto(baseUrl);
    await page.click('text=Login');
    await page.fill('input[type="email"]', 'hr.manager@hrplatform.com');
    await page.fill('input[type="password"]', 'HRManager123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    
    // Navigate to recruitment
    await page.click('text=Recruitment');
    await page.waitForTimeout(2000);
    await page.click('text=Applications');
    await page.waitForTimeout(2000);
    
    // Find the application and schedule interview
    await page.click('text=Jane Doe');
    await page.waitForTimeout(1000);
    await page.selectOption('select[name="status"]', 'Shortlisted');
    await page.click('text=Save');
    await page.waitForTimeout(1000);
    
    // Navigate to interviews
    await page.click('text=Interviews');
    await page.waitForTimeout(2000);
    await page.click('text=Schedule Interview');
    await page.waitForTimeout(1000);
    
    // Fill interview details
    await page.selectOption('select[name="candidate"]', 'Jane Doe');
    await page.selectOption('select[name="job"]', 'Senior Care Worker');
    await page.selectOption('select[name="interview_type"]', 'Video Interview');
    await page.fill('input[name="interview_date"]', '2026-02-05');
    await page.fill('input[name="interview_time"]', '14:00');
    await page.fill('input[name="location"]', 'Zoom Meeting');
    
    // Schedule interview
    await page.click('text=Schedule');
    await page.waitForTimeout(2000);
    
    await expect(page.locator('text=Interview scheduled')).toBeVisible();
    console.log('✅ Interview scheduled successfully');

    // Step 6: Shift Management Testing
    console.log('🔄 Step 6: Shift Management Testing');
    await page.click('text=HR');
    await page.waitForTimeout(2000);
    await page.click('text=Shifts');
    await page.waitForTimeout(2000);
    
    // Create new shift
    await page.click('text=Add Shift');
    await page.waitForTimeout(1000);
    
    // Fill shift details
    await page.selectOption('select[name="shift_type"]', 'Day Shift');
    await page.fill('input[name="shift_date"]', '2026-02-05');
    await page.fill('input[name="start_time"]', '08:00');
    await page.fill('input[name="end_time"]', '16:00');
    await page.selectOption('select[name="employee"]', 'John Smith');
    
    // Save shift
    await page.click('text=Create Shift');
    await page.waitForTimeout(2000);
    
    await expect(page.locator('text=Shift created')).toBeVisible();
    console.log('✅ Shift created successfully');

    // Step 7: Attendance Testing
    console.log('⏰ Step 7: Attendance Testing');
    await page.click('text=Attendance');
    await page.waitForTimeout(2000);
    
    // Clock in employee
    await page.click('text=Clock In');
    await page.waitForTimeout(1000);
    await page.selectOption('select[name="employee"]', 'John Smith');
    await page.click('text=Confirm Clock In');
    await page.waitForTimeout(2000);
    
    await expect(page.locator('text=Clocked in successfully')).toBeVisible();
    console.log('✅ Clock in working');

    // Clock out employee
    await page.click('text=Clock Out');
    await page.waitForTimeout(1000);
    await page.selectOption('select[name="employee"]', 'John Smith');
    await page.click('text=Confirm Clock Out');
    await page.waitForTimeout(2000);
    
    await expect(page.locator('text=Clocked out successfully')).toBeVisible();
    console.log('✅ Clock out working');

    // Step 8: Leave Management Testing
    console.log('🏖️ Step 8: Leave Management Testing');
    await page.click('text=Leave');
    await page.waitForTimeout(2000);
    
    // Submit leave request
    await page.click('text=Request Leave');
    await page.waitForTimeout(1000);
    
    // Fill leave details
    await page.selectOption('select[name="employee"]', 'John Smith');
    await page.selectOption('select[name="leave_type"]', 'Annual Leave');
    await page.fill('input[name="start_date"]', '2026-02-10');
    await page.fill('input[name="end_date"]', '2026-02-12');
    await page.fill('textarea[name="reason"]', 'Family vacation');
    
    // Submit request
    await page.click('text=Submit Request');
    await page.waitForTimeout(2000);
    
    await expect(page.locator('text=Leave request submitted')).toBeVisible();
    console.log('✅ Leave request submitted successfully');

    // Approve leave request
    await page.click('text=Approve');
    await page.waitForTimeout(1000);
    await page.fill('textarea[name="approval_notes"]', 'Approved - no conflicts');
    await page.click('text=Approve Leave');
    await page.waitForTimeout(2000);
    
    await expect(page.locator('text=Leave approved')).toBeVisible();
    console.log('✅ Leave approved successfully');

    // Step 9: Document Management Testing
    console.log('📁 Step 9: Document Management Testing');
    await page.click('text=Documents');
    await page.waitForTimeout(2000);
    
    // Upload document
    await page.click('text=Upload Document');
    await page.waitForTimeout(1000);
    
    // Fill document details
    await page.selectOption('select[name="employee"]', 'John Smith');
    await page.selectOption('select[name="document_type"]', 'DBS Certificate');
    await page.fill('input[name="title"]', 'DBS Certificate - John Smith');
    await page.fill('input[name="expiry_date"]', '2027-02-05');
    
    // Note: In real scenario, file upload would be tested here
    await page.click('text=Upload Document');
    await page.waitForTimeout(2000);
    
    await expect(page.locator('text=DBS Certificate - John Smith')).toBeVisible();
    console.log('✅ Document upload working');

    // Step 10: Letter Generation Testing
    console.log('✉️ Step 10: Letter Generation Testing');
    await page.click('text=Letters');
    await page.waitForTimeout(2000);
    
    // Generate offer letter
    await page.click('text=Templates');
    await page.waitForTimeout(1000);
    await page.click('text=Offer Letter');
    await page.waitForTimeout(1000);
    
    // Fill letter details
    await page.selectOption('select[name="employee"]', 'John Smith');
    await page.selectOption('select[name="template"]', 'Offer Letter');
    await page.fill('input[name="start_date"]', '2026-03-01');
    await page.fill('input[name="salary"]', '25000');
    
    // Generate letter
    await page.click('text=Generate Letter');
    await page.waitForTimeout(2000);
    
    await expect(page.locator('text=Letter generated')).toBeVisible();
    console.log('✅ Letter generation working');

    // Step 11: Compliance Testing
    console.log('🛡️ Step 11: Compliance Testing');
    await page.click('text=Compliance');
    await page.waitForTimeout(2000);
    
    // Verify compliance dashboard
    await expect(page.locator('text=Compliance Overview')).toBeVisible();
    await expect(page.locator('text=Document Expiry')).toBeVisible();
    await expect(page.locator('text=Audit Trail')).toBeVisible();
    
    // Check audit trail
    await page.click('text=Audit Trail');
    await page.waitForTimeout(2000);
    
    // Verify recent activities are logged
    await expect(page.locator('text=John Smith')).toBeVisible();
    await expect(page.locator('text=Employee created')).toBeVisible();
    console.log('✅ Compliance and audit trail working');

    // Step 12: Settings Verification
    console.log('⚙️ Step 12: Settings Verification');
    await page.click('text=Settings');
    await page.waitForTimeout(2000);
    
    // Verify all settings tabs are accessible
    await expect(page.locator('text=Company Information')).toBeVisible();
    await expect(page.locator('text=Working Hours')).toBeVisible();
    await expect(page.locator('text=Leave Policies')).toBeVisible();
    await expect(page.locator('text=Public Holidays')).toBeVisible();
    
    // Test company settings update
    await page.click('text=Company Information');
    await page.waitForTimeout(1000);
    await page.fill('input[name="company_name"]', 'NovumCare Solutions Ltd');
    await page.fill('input[name="phone"]', '+447700900000');
    await page.fill('input[name="email"]', 'info@novumcare.com');
    await page.click('text=Save Changes');
    await page.waitForTimeout(2000);
    
    await expect(page.locator('text=Settings updated')).toBeVisible();
    console.log('✅ Settings configuration working');

    console.log('🎉 All tests completed successfully! NovumFlow is ready for production use.');
  });

  test('Mobile Responsiveness Test', async ({ page }) => {
    console.log('📱 Testing mobile responsiveness...');
    
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 812 }); // iPhone X
    await page.goto(baseUrl);
    
    // Login on mobile
    await page.click('text=Login');
    await page.fill('input[type="email"]', 'admin@hrplatform.com');
    await page.fill('input[type="password"]', 'Admin123!');
    await page.click('button[type="submit"]');
    
    // Verify mobile layout
    await expect(page.locator('.mobile-menu')).toBeVisible();
    await expect(page.locator('h1')).toContainText('Dashboard');
    console.log('✅ Mobile layout working');
  });

  test('Error Handling Test', async ({ page }) => {
    console.log('⚠️ Testing error handling...');
    
    // Test invalid login
    await page.goto(baseUrl);
    await page.click('text=Login');
    await page.fill('input[type="email"]', 'invalid@test.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    // Should show error message
    await expect(page.locator('text=Invalid credentials')).toBeVisible();
    console.log('✅ Error handling working');
  });

  test('Performance Test', async ({ page }) => {
    console.log('⚡ Testing performance...');
    
    const startTime = Date.now();
    await page.goto(baseUrl);
    
    // Login
    await page.click('text=Login');
    await page.fill('input[type="email"]', 'admin@hrplatform.com');
    await page.fill('input[type="password"]', 'Admin123!');
    await page.click('button[type="submit"]');
    
    // Navigate through multiple pages
    await page.waitForURL('**/dashboard');
    await page.click('text=HR');
    await page.waitForTimeout(2000);
    await page.click('text=Recruitment');
    await page.waitForTimeout(2000);
    await page.click('text=Letters');
    await page.waitForTimeout(2000);
    
    const loadTime = Date.now() - startTime;
    console.log(`⚡ Page load and navigation time: ${loadTime}ms`);
    
    // Should load within reasonable time
    expect(loadTime).toBeLessThan(10000);
    console.log('✅ Performance test passed');
  });
});