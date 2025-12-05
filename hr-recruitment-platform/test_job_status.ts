
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://niikshfoecitimepiifo.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5paWtzaGZvZWNpdGltZXBpaWZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMwNTIyMTUsImV4cCI6MjA3ODYyODIxNX0.4KzLoUez4xQ1_h-vpx1dOa1PrzvAbi65UC4Mf7JQAfc";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testStatus() {
    // Login
    const { data: { session }, error: loginError } = await supabase.auth.signInWithPassword({
        email: 'mrsonirie@gmail.com',
        password: 'phoneBobby1?'
    });

    if (loginError) {
        console.error('Login failed:', loginError);
        return;
    }

    console.log('Logged in user:', session?.user.id);

    const statuses = ['published', 'Published', 'open', 'Open', 'active', 'Active'];

    for (const status of statuses) {
        console.log(`Testing status: "${status}"...`);
        const { data, error } = await supabase
            .from('job_postings')
            .insert({
                job_title: `Status Test ${status}`,
                department: 'Test',
                employment_type: 'full_time',
                status: status,
                created_by: session?.user.id
            })
            .select();

        if (error) {
            console.error(`Failed for "${status}":`, error.message);
        } else {
            console.log(`SUCCESS for "${status}"!`);
            // Cleanup
            if (data && data[0]) {
                await supabase.from('job_postings').delete().eq('id', data[0].id);
            }
            return; // Stop after first success
        }
    }
}

testStatus();
