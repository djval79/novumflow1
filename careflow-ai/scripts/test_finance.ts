
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://niikshfoecitimepiifo.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_ROLE_KEY) {
    console.error("❌ SUPABASE_SERVICE_ROLE_KEY is required!");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function main() {
    console.log('🚀 Starting Finance Verification...');

    // 1. Setup
    const { data: tenant } = await supabase.from('tenants').select('id').limit(1).single();
    if (!tenant) { console.error('❌ No tenant found'); return; }

    // Ensure Client with Rate
    let { data: client } = await supabase.from('clients').select('id').eq('tenant_id', tenant.id).limit(1).single();
    if (!client) {
        console.log('⚠️ Creating dummy client...');
        const { data: newClient } = await supabase.from('clients').insert({
            tenant_id: tenant.id,
            first_name: 'Finance',
            last_name: 'Client',
            status: 'Active',
            hourly_charge: 25.00
        }).select().single();
        client = newClient;
    } else {
        // Update rate just in case
        await supabase.from('clients').update({ hourly_charge: 25.00 }).eq('id', client.id);
    }

    // Ensure Staff with Rate
    let { data: staff } = await supabase.from('employees').select('id').eq('tenant_id', tenant.id).limit(1).single();
    if (!staff) {
        console.log('⚠️ Creating dummy staff...');
        const { data: newStaff } = await supabase.from('employees').insert({
            tenant_id: tenant.id,
            first_name: 'Finance',
            last_name: 'Staff',
            status: 'active',
            email: `finance.staff.${Date.now()}@example.com`,
            hourly_rate: 15.00
        }).select().single();
        staff = newStaff;
    } else {
        // Update rate
        await supabase.from('employees').update({ hourly_rate: 15.00 }).eq('id', staff.id);
    }

    console.log(`📋 Using Tenant: ${tenant.id}, Client: ${client.id} ($25/hr), Staff: ${staff.id} ($15/hr)`);

    // 2. Create Completed Visit (2 Hours)
    const date = new Date().toISOString().split('T')[0];
    console.log('\n1️⃣ Creating Completed Visit (2 Hours)...');

    const { data: visit, error: createError } = await supabase
        .from('visits')
        .insert({
            tenant_id: tenant.id,
            client_id: client.id,
            staff_id: staff.id,
            visit_date: date,
            start_time: '10:00',
            end_time: '12:00', // 2 Hours
            visit_type: 'Personal Care',
            status: 'Completed'
        })
        .select()
        .single();

    if (createError) {
        console.error('❌ Failed to create visit:', createError);
        return;
    }
    console.log('✅ Visit Created:', visit.id);

    // 3. Verify Payroll Report
    console.log('\n2️⃣ Verifying Payroll Report...');
    const { data: payroll, error: payrollError } = await supabase.rpc('get_payroll_report', {
        p_tenant_id: tenant.id,
        p_start_date: date,
        p_end_date: date
    });

    if (payrollError) console.error('❌ Payroll RPC Failed:', payrollError);
    else {
        const entry = payroll.find((p: any) => p.staff_id === staff.id);
        if (entry && parseFloat(entry.total_pay) === 30.00) {
            console.log(`✅ Payroll Correct: £${entry.total_pay} (Expected £30.00)`);
        } else {
            console.error(`❌ Payroll Incorrect: Got £${entry?.total_pay}, Expected £30.00`);
        }
    }

    // 4. Verify Invoice Report
    console.log('\n3️⃣ Verifying Invoice Report...');
    const { data: invoice, error: invoiceError } = await supabase.rpc('get_invoice_report', {
        p_tenant_id: tenant.id,
        p_start_date: date,
        p_end_date: date
    });

    if (invoiceError) console.error('❌ Invoice RPC Failed:', invoiceError);
    else {
        const entry = invoice.find((i: any) => i.client_id === client.id);
        if (entry && parseFloat(entry.total_charge) === 50.00) {
            console.log(`✅ Invoice Correct: £${entry.total_charge} (Expected £50.00)`);
        } else {
            console.error(`❌ Invoice Incorrect: Got £${entry?.total_charge}, Expected £50.00`);
        }
    }

    // Cleanup
    await supabase.from('visits').delete().eq('id', visit.id);
}

main();
