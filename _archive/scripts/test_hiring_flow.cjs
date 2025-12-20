
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://niikshfoecitimepiifo.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5paWtzaGZvZWNpdGltZXBpaWZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMwNTIyMTUsImV4cCI6MjA3ODYyODIxNX0.4KzLoUez4xQ1_h-vpx1dOa1PrzvAbi65UC4Mf7JQAfc";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function runTest() {
    console.log('Starting Hiring Flow Test...');

    // 1. Authenticate
    const email = 'manual_user@example.com';
    const password = 'password123';

    console.log(`Authenticating test user: ${email}`);
    let { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
    });

    if (authError) {
        console.error('Auth Error:', authError);
        return;
    }

    const user = authData.user;
    if (!user) {
        console.error('User creation failed');
        return;
    }
    console.log('User created:', user.id);

    // 2. Get a Job
    const { data: jobs } = await supabase.from('job_postings').select('id').limit(1);
    if (!jobs || jobs.length === 0) {
        console.error('No jobs found. Run seed script first.');
        return;
    }
    const jobId = jobs[0].id;
    console.log('Using Job ID:', jobId);

    // 3. Create Application (Hired)
    const appData = {
        job_posting_id: jobId,
        applicant_first_name: 'Test',
        applicant_last_name: 'Candidate',
        applicant_email: `candidate_${Date.now()}@test.com`,
        applicant_phone: '1234567890',
        status: 'Hired',
        resume_url: 'https://example.com/resume.pdf'
    };

    const { data: app, error: appError } = await supabase
        .from('applications')
        .insert(appData)
        .select()
        .single();

    if (appError) {
        console.error('Application Create Error:', appError);
        return;
    }
    console.log('Application created:', app.id);

    // 4. Convert to Employee (Invoke Edge Function)
    console.log('Invoking employee-crud to convert...');

    // Note: In the real app, this is called with specific payload structure
    const payload = {
        action: 'create',
        data: {
            first_name: app.applicant_first_name,
            last_name: app.applicant_last_name,
            email: app.applicant_email,
            phone: app.applicant_phone,
            department: 'Care', // Default
            position: 'Carer', // Default
            status: 'active',
            date_hired: new Date().toISOString().split('T')[0],
            application_id: app.id
        }
    };

    const { data: funcData, error: funcError } = await supabase.functions.invoke('employee-crud', {
        body: payload
    });

    if (funcError) {
        console.error('Function Invoke Error:', funcError);
        // Fallback: Check if we can see the error details
        try {
            const { data: logs } = await supabase.from('edge_function_logs').select('*').order('created_at', { ascending: false }).limit(1);
            console.log('Latest Function Log:', logs);
        } catch (e) { }
    } else {
        console.log('Function Response:', funcData);
    }

    // 5. Verify Employee
    console.log('Verifying employee creation...');
    // Wait a bit for async processing if any
    await new Promise(r => setTimeout(r, 2000));

    const { data: emp, error: empError } = await supabase
        .from('employees')
        .select('*')
        .eq('email', app.applicant_email)
        .single();

    if (empError) {
        console.error('Employee Verification Failed:', empError);
    } else {
        console.log('SUCCESS: Employee created:', emp.id);
        console.log('Employee Details:', emp);
    }
}

runTest().catch(console.error);
