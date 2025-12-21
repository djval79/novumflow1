
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://niikshfoecitimepiifo.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5paWtzaGZvZWNpdGltZXBpaWZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMwNTIyMTUsImV4cCI6MjA3ODYyODIxNX0.4KzLoUez4xQ1_h-vpx1dOa1PrzvAbi65UC4Mf7JQAfc';

// Note: Using anon key for demo seeding might fail due to RLS if we don't have an auth session.
// However, I will try to perform the inserts. If it fails, I'll need the service role key.
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const v_tenant_id = '57680f2b-881f-4063-abb5-c1791b626852';

async function seed() {
    console.log('Seeding data for tenant:', v_tenant_id);

    try {
        // Staff
        const { data: staff, error: staffError } = await supabase.from('careflow_staff').upsert([
            { tenant_id: v_tenant_id, full_name: 'Sarah Jenkins', role: 'Senior Nurse', status: 'Active', email: 'sarah.j@novumsolvo.co.uk' },
            { tenant_id: v_tenant_id, full_name: 'Michael Chen', role: 'Care Assistant', status: 'Active', email: 'm.chen@novumsolvo.co.uk' }
        ]).select();

        if (staffError) throw staffError;
        const v_staff_id_1 = staff[0].id;
        const v_staff_id_2 = staff[1].id;
        console.log('Seeded staff');

        // Clients
        const { data: clients, error: clientsError } = await supabase.from('careflow_clients').upsert([
            { tenant_id: v_tenant_id, name: 'James Robertson', care_level: 'High', status: 'Active', address: '12 High Street, Liverpool' },
            { tenant_id: v_tenant_id, name: 'Alice Thompson', care_level: 'Medium', status: 'Active', address: '45 Park Lane, Liverpool' }
        ]).select();

        if (clientsError) throw clientsError;
        const v_client_id_1 = clients[0].id;
        const v_client_id_2 = clients[1].id;
        console.log('Seeded clients');

        // Visits
        const today = new Date().toISOString().split('T')[0];
        const { error: visitsError } = await supabase.from('careflow_visits').upsert([
            { tenant_id: v_tenant_id, client_id: v_client_id_1, staff_id: v_staff_id_1, scheduled_date: today, scheduled_start: '08:00:00', scheduled_end: '09:00:00', visit_type: 'Medication', status: 'Scheduled' },
            { tenant_id: v_tenant_id, client_id: v_client_id_2, staff_id: v_staff_id_2, scheduled_date: today, scheduled_start: '09:30:00', scheduled_end: '10:30:00', visit_type: 'Personal Care', status: 'Scheduled' },
            { tenant_id: v_tenant_id, client_id: v_client_id_1, staff_id: v_staff_id_2, scheduled_date: today, scheduled_start: '13:00:00', scheduled_end: '14:00:00', visit_type: 'Social', status: 'Scheduled' }
        ]);

        if (visitsError) throw visitsError;
        console.log('Seeded visits');

        // Incidents
        const { error: incidentsError } = await supabase.from('careflow_incidents').upsert([
            { tenant_id: v_tenant_id, date: new Date().toISOString(), type: 'Fall', description: 'Client found on floor in lounge. No injuries.', severity: 'Medium', status: 'reported', client_id: v_client_id_1 }
        ]);

        if (incidentsError) throw incidentsError;
        console.log('Seeded incidents');

        console.log('Demo data successfully seeded for Novum Solvo Ltd');
    } catch (err) {
        console.error('Seeding failed:', err.message);
        if (err.message.includes('permission denied')) {
            console.error('RLS Blocked the request. Please ensure you are using a key with sufficient permissions or run the SQL script via the Supabase Dashboard.');
        }
    }
}

seed();
