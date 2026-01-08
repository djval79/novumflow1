#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixUser() {
    const email = 'qa-test-2026@example.com';

    const { data: profile, error: profileError } = await supabase
        .from('users_profiles')
        .select('*')
        .eq('email', email)
        .single();

    if (profileError) {
        console.error('❌ Profile Error:', profileError.message);
        return;
    }

    console.log('Current role:', profile.role);

    // Update role to 'Admin'
    const { error: updateError } = await supabase
        .from('users_profiles')
        .update({ role: 'Admin', full_name: 'QA Test Admin' })
        .eq('email', email);

    if (updateError) {
        console.error('❌ Update Error:', updateError.message);
    } else {
        console.log('✅ Updated role to Admin and name to QA Test Admin');
    }

    // Ensure they are an admin in the organization_members table too if it exists
    const { data: members, error: memberError } = await supabase
        .from('organization_members')
        .select('*')
        .eq('user_id', profile.id);

    if (!memberError && members.length > 0) {
        const { error: memberUpdateError } = await supabase
            .from('organization_members')
            .update({ role: 'admin' })
            .eq('user_id', profile.id);

        if (memberUpdateError) {
            console.error('❌ Member Update Error:', memberUpdateError.message);
        } else {
            console.log('✅ Updated organization membership role to admin');
        }
    }
}

fixUser().catch(console.error);
