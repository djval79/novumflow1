
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://niikshfoecitimepiifo.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5paWtzaGZvZWNpdGltZXBpaWZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMwNTIyMTUsImV4cCI6MjA3ODYyODIxNX0.4KzLoUez4xQ1_h-vpx1dOa1PrzvAbi65UC4Mf7JQAfc";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkWorkflow() {
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

    // Check default workflow
    const { data: workflows, error } = await supabase
        .from('recruitment_workflows')
        .select('*')
        .eq('is_default', true);

    if (error) {
        console.error('Error checking workflows:', error);
        return;
    }

    console.log('Default workflows found:', workflows?.length);

    if (!workflows || workflows.length === 0) {
        console.log('Creating default workflow...');
        const { data: newWorkflow, error: createError } = await supabase
            .from('recruitment_workflows')
            .insert({
                name: 'Standard Recruitment Process',
                description: 'Default workflow',
                is_default: true,
                created_by: session?.user.id
            })
            .select()
            .single();

        if (createError) {
            console.error('Failed to create workflow:', createError);
            return;
        }

        console.log('Created workflow:', newWorkflow.id);

        // Create stages
        const stages = [
            { name: 'Applied', order: 1, type: 'applied', is_system: true },
            { name: 'Screening', order: 2, type: 'screening', is_system: false },
            { name: 'Interview', order: 3, type: 'interview', is_system: false },
            { name: 'Offer', order: 4, type: 'offer', is_system: false },
            { name: 'Hired', order: 5, type: 'hired', is_system: true },
            { name: 'Rejected', order: 6, type: 'rejected', is_system: true }
        ];

        for (const stage of stages) {
            const { error: stageError } = await supabase
                .from('workflow_stages')
                .insert({
                    workflow_id: newWorkflow.id,
                    name: stage.name,
                    stage_order: stage.order,
                    stage_type: stage.type,
                    is_system_stage: stage.is_system
                });

            if (stageError) console.error(`Failed to create stage ${stage.name}:`, stageError);
            else console.log(`Created stage ${stage.name}`);
        }
    } else {
        console.log('Default workflow exists:', workflows[0].id);
        // Check stages
        const { data: stages } = await supabase
            .from('workflow_stages')
            .select('*')
            .eq('workflow_id', workflows[0].id);
        console.log('Stages found:', stages?.length);
        stages?.forEach(s => console.log(`- ${s.name} (${s.stage_type})`));
    }
}

checkWorkflow();
