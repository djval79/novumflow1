Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, cache-control, x-requested-with, pragma',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Max-Age': '86400',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Supabase configuration missing');
    }

    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'apikey': serviceRoleKey
      }
    });

    if (!userResponse.ok) {
      throw new Error('Invalid token');
    }

    const userData = await userResponse.json();
    const userId = userData.id;

    const results = {
      employees: 0,
      jobPostings: 0,
      applications: 0,
      leaveRequests: 0,
      attendanceRecords: 0,
    };

    // Sample employees data
    const employees = [
      { first_name: 'John', last_name: 'Smith', email: 'john.smith@company.com', department: 'Engineering', position: 'Senior Developer', employment_type: 'full_time' },
      { first_name: 'Sarah', last_name: 'Johnson', email: 'sarah.johnson@company.com', department: 'HR', position: 'HR Manager', employment_type: 'full_time' },
      { first_name: 'Michael', last_name: 'Williams', email: 'michael.williams@company.com', department: 'Sales', position: 'Sales Director', employment_type: 'full_time' },
      { first_name: 'Emily', last_name: 'Brown', email: 'emily.brown@company.com', department: 'Marketing', position: 'Marketing Specialist', employment_type: 'full_time' },
      { first_name: 'David', last_name: 'Jones', email: 'david.jones@company.com', department: 'Engineering', position: 'Junior Developer', employment_type: 'full_time' },
      { first_name: 'Jessica', last_name: 'Miller', email: 'jessica.miller@company.com', department: 'Finance', position: 'Financial Analyst', employment_type: 'full_time' },
      { first_name: 'Daniel', last_name: 'Davis', email: 'daniel.davis@company.com', department: 'Operations', position: 'Operations Manager', employment_type: 'full_time' },
      { first_name: 'Lisa', last_name: 'Garcia', email: 'lisa.garcia@company.com', department: 'Engineering', position: 'DevOps Engineer', employment_type: 'full_time' },
      { first_name: 'Robert', last_name: 'Martinez', email: 'robert.martinez@company.com', department: 'Sales', position: 'Sales Representative', employment_type: 'part_time' },
      { first_name: 'Jennifer', last_name: 'Rodriguez', email: 'jennifer.rodriguez@company.com', department: 'Customer Support', position: 'Support Specialist', employment_type: 'full_time' },
      { first_name: 'William', last_name: 'Wilson', email: 'william.wilson@company.com', department: 'Engineering', position: 'Frontend Developer', employment_type: 'full_time' },
      { first_name: 'Amanda', last_name: 'Moore', email: 'amanda.moore@company.com', department: 'HR', position: 'Recruitment Coordinator', employment_type: 'full_time' },
      { first_name: 'James', last_name: 'Taylor', email: 'james.taylor@company.com', department: 'Engineering', position: 'Backend Developer', employment_type: 'full_time' },
      { first_name: 'Patricia', last_name: 'Anderson', email: 'patricia.anderson@company.com', department: 'Marketing', position: 'Content Manager', employment_type: 'contract' },
      { first_name: 'Christopher', last_name: 'Thomas', email: 'christopher.thomas@company.com', department: 'Finance', position: 'Accountant', employment_type: 'full_time' },
      { first_name: 'Linda', last_name: 'Jackson', email: 'linda.jackson@company.com', department: 'Operations', position: 'Project Coordinator', employment_type: 'full_time' },
      { first_name: 'Matthew', last_name: 'White', email: 'matthew.white@company.com', department: 'Engineering', position: 'QA Engineer', employment_type: 'full_time' },
      { first_name: 'Barbara', last_name: 'Harris', email: 'barbara.harris@company.com', department: 'Sales', position: 'Account Executive', employment_type: 'full_time' },
      { first_name: 'Joseph', last_name: 'Martin', email: 'joseph.martin@company.com', department: 'IT', position: 'System Administrator', employment_type: 'full_time' },
      { first_name: 'Susan', last_name: 'Thompson', email: 'susan.thompson@company.com', department: 'Customer Support', position: 'Support Team Lead', employment_type: 'full_time' },
    ];

    // Create employees
    for (const empData of employees) {
      const timestamp = Date.now().toString().slice(-6);
      const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      
      await fetch(`${supabaseUrl}/rest/v1/employees`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'apikey': serviceRoleKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...empData,
          employee_number: `EMP-${timestamp}${random}`,
          date_hired: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          status: 'active',
          created_by: userId,
        }),
      });
      
      results.employees++;
      await new Promise(resolve => setTimeout(resolve, 100)); // Small delay to avoid rate limits
    }

    // Sample job postings
    const jobPostings = [
      { job_title: 'Senior Full Stack Developer', department: 'Engineering', employment_type: 'full_time', salary_range_min: 90000, salary_range_max: 130000, positions_available: 2, status: 'published' },
      { job_title: 'Product Marketing Manager', department: 'Marketing', employment_type: 'full_time', salary_range_min: 80000, salary_range_max: 110000, positions_available: 1, status: 'published' },
      { job_title: 'Data Analyst', department: 'Finance', employment_type: 'full_time', salary_range_min: 70000, salary_range_max: 95000, positions_available: 1, status: 'published' },
      { job_title: 'HR Business Partner', department: 'HR', employment_type: 'full_time', salary_range_min: 75000, salary_range_max: 100000, positions_available: 1, status: 'published' },
      { job_title: 'Sales Manager', department: 'Sales', employment_type: 'full_time', salary_range_min: 85000, salary_range_max: 120000, positions_available: 1, status: 'published' },
      { job_title: 'UI/UX Designer', department: 'Engineering', employment_type: 'full_time', salary_range_min: 65000, salary_range_max: 90000, positions_available: 1, status: 'published' },
      { job_title: 'Customer Success Manager', department: 'Customer Support', employment_type: 'full_time', salary_range_min: 60000, salary_range_max: 85000, positions_available: 2, status: 'published' },
      { job_title: 'DevOps Engineer', department: 'Engineering', employment_type: 'full_time', salary_range_min: 95000, salary_range_max: 135000, positions_available: 1, status: 'draft' },
      { job_title: 'Business Analyst', department: 'Operations', employment_type: 'full_time', salary_range_min: 70000, salary_range_max: 95000, positions_available: 1, status: 'published' },
      { job_title: 'Content Strategist', department: 'Marketing', employment_type: 'contract', salary_range_min: 55000, salary_range_max: 75000, positions_available: 1, status: 'published' },
    ];

    const createdJobIds = [];
    for (const jobData of jobPostings) {
      const timestamp = Date.now().toString().slice(-6);
      const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      
      const response = await fetch(`${supabaseUrl}/rest/v1/job_postings`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'apikey': serviceRoleKey,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation',
        },
        body: JSON.stringify({
          ...jobData,
          job_code: `JOB-${timestamp}${random}`,
          job_description: `We are seeking a talented ${jobData.job_title} to join our ${jobData.department} team.`,
          requirements: 'Bachelor\'s degree and 3+ years of relevant experience',
          published_at: jobData.status === 'published' ? new Date().toISOString() : null,
          created_by: userId,
        }),
      });
      
      const newJob = await response.json();
      if (newJob && newJob[0]) {
        createdJobIds.push(newJob[0].id);
      }
      results.jobPostings++;
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Sample applications for the created job postings
    if (createdJobIds.length > 0) {
      const sampleApplicants = [
        { first_name: 'Alice', last_name: 'Cooper', email: 'alice.cooper@email.com', phone: '555-0101', status: 'screening' },
        { first_name: 'Bob', last_name: 'Dylan', email: 'bob.dylan@email.com', phone: '555-0102', status: 'shortlisted' },
        { first_name: 'Carol', last_name: 'King', email: 'carol.king@email.com', phone: '555-0103', status: 'interview_scheduled' },
        { first_name: 'Dave', last_name: 'Grohl', email: 'dave.grohl@email.com', phone: '555-0104', status: 'applied' },
        { first_name: 'Emma', last_name: 'Stone', email: 'emma.stone@email.com', phone: '555-0105', status: 'interviewed' },
        { first_name: 'Frank', last_name: 'Ocean', email: 'frank.ocean@email.com', phone: '555-0106', status: 'offer_extended' },
      ];

      for (let i = 0; i < Math.min(createdJobIds.length, 6); i++) {
        const applicant = sampleApplicants[i];
        
        await fetch(`${supabaseUrl}/rest/v1/applications`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            job_posting_id: createdJobIds[i],
            applicant_first_name: applicant.first_name,
            applicant_last_name: applicant.last_name,
            applicant_email: applicant.email,
            applicant_phone: applicant.phone,
            cv_url: 'https://example.com/cv-sample.pdf',
            status: applicant.status,
            score: Math.floor(Math.random() * 40) + 60,
          }),
        });
        
        results.applications++;
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return new Response(JSON.stringify({
      data: {
        message: 'Sample data populated successfully',
        results,
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Sample data population error:', error);

    return new Response(JSON.stringify({
      error: {
        code: 'SAMPLE_DATA_FAILED',
        message: error.message || 'An error occurred'
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
