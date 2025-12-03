import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://niikshfoecitimepiifo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5paWtzaGZvZWNpdGltZXBpaWZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMwNTIyMTUsImV4cCI6MjA3ODYyODIxNX0.4KzLoUez4xQ1_h-vpx1dOa1PrzvAbi65UC4Mf7JQAfc';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSeededData() {
    console.log('🔍 Checking for seeded data...');

    // Check Workflow
    const { data: workflows, error: wfError } = await supabase
        .from('recruitment_workflows')
        .select('*')
        .eq('name', 'Standard Hiring Pipeline');

    if (wfError) {
        console.log('❌ Error fetching workflows (likely RLS):', wfError.message);
    } else if (workflows && workflows.length > 0) {
        console.log(`✅ Found Workflow: ${workflows[0].name} (${workflows[0].id})`);
    } else {
        console.log('⚠️ Workflow not found.');
    }

    // Check Employees
    const { data: employees, error: empError } = await supabase
        .from('employees')
        .select('email')
        .in('email', ['john.doe@example.com', 'jane.smith@example.com']);

    if (empError) {
        console.log('❌ Error fetching employees (likely RLS):', empError.message);
    } else if (employees && employees.length > 0) {
        console.log(`✅ Found ${employees.length} seeded employees.`);
    } else {
        console.log('⚠️ Seeded employees not found.');
    }
}

checkSeededData();
