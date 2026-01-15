Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, cache-control, x-requested-with, pragma',
    'Access-Control-Allow-Methods': 'POST, PUT, DELETE, OPTIONS',
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

    const method = req.method;
    const url = new URL(req.url);
    const jobId = url.searchParams.get('id');

    // CREATE Job Posting
    if (method === 'POST') {
      const requestBody = await req.json();
      
      // Handle different request formats from frontend
      let jobData;
      if (requestBody.action === 'create' && requestBody.data) {
        jobData = requestBody.data;
      } else if (requestBody.data) {
        jobData = requestBody.data;
      } else {
        jobData = requestBody;
      }

      // Generate job code if not provided
      if (!jobData.job_code) {
        const timestamp = Date.now().toString().slice(-6);
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        jobData.job_code = `JOB-${timestamp}${random}`;
      }

      jobData.created_by = userId;
      jobData.status = jobData.status || 'draft';

      if (jobData.status === 'published' && !jobData.published_at) {
        jobData.published_at = new Date().toISOString();
      }

      const insertResponse = await fetch(`${supabaseUrl}/rest/v1/job_postings`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'apikey': serviceRoleKey,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation',
        },
        body: JSON.stringify(jobData),
      });

      if (!insertResponse.ok) {
        const errorText = await insertResponse.text();
        throw new Error(`Failed to create job posting: ${errorText}`);
      }

      const newJob = await insertResponse.json();

      // Log audit trail
      await fetch(`${supabaseUrl}/rest/v1/audit_logs`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'apikey': serviceRoleKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          action: 'create',
          entity_type: 'job_posting',
          entity_id: newJob[0].id,
          new_values: JSON.stringify(jobData),
        }),
      });

      return new Response(JSON.stringify({ data: newJob[0] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // UPDATE Job Posting
    if (method === 'PUT' && jobId) {
      const updateData = await req.json();
      updateData.updated_at = new Date().toISOString();

      // If publishing, set published_at
      if (updateData.status === 'published' && !updateData.published_at) {
        updateData.published_at = new Date().toISOString();
      }

      // If closing, set closed_at
      if (updateData.status === 'closed' && !updateData.closed_at) {
        updateData.closed_at = new Date().toISOString();
      }

      // Get old values
      const oldValuesResponse = await fetch(
        `${supabaseUrl}/rest/v1/job_postings?id=eq.${jobId}&select=*`,
        {
          headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
          },
        }
      );
      const oldValues = await oldValuesResponse.json();

      const updateResponse = await fetch(
        `${supabaseUrl}/rest/v1/job_postings?id=eq.${jobId}`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation',
          },
          body: JSON.stringify(updateData),
        }
      );

      if (!updateResponse.ok) {
        const errorText = await updateResponse.text();
        throw new Error(`Failed to update job posting: ${errorText}`);
      }

      const updatedJob = await updateResponse.json();

      // Log audit trail
      await fetch(`${supabaseUrl}/rest/v1/audit_logs`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'apikey': serviceRoleKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          action: 'update',
          entity_type: 'job_posting',
          entity_id: jobId,
          old_values: JSON.stringify(oldValues[0]),
          new_values: JSON.stringify(updateData),
        }),
      });

      return new Response(JSON.stringify({ data: updatedJob[0] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // DELETE Job Posting
    if (method === 'DELETE' && jobId) {
      const jobResponse = await fetch(
        `${supabaseUrl}/rest/v1/job_postings?id=eq.${jobId}&select=*`,
        {
          headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
          },
        }
      );
      const jobData = await jobResponse.json();

      const deleteResponse = await fetch(
        `${supabaseUrl}/rest/v1/job_postings?id=eq.${jobId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
          },
        }
      );

      if (!deleteResponse.ok) {
        const errorText = await deleteResponse.text();
        throw new Error(`Failed to delete job posting: ${errorText}`);
      }

      // Log audit trail
      await fetch(`${supabaseUrl}/rest/v1/audit_logs`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'apikey': serviceRoleKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          action: 'delete',
          entity_type: 'job_posting',
          entity_id: jobId,
          old_values: JSON.stringify(jobData[0]),
        }),
      });

      return new Response(JSON.stringify({ data: { message: 'Job posting deleted successfully' } }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    throw new Error('Unsupported method');

  } catch (error) {
    console.error('Job posting CRUD error:', error);

    return new Response(JSON.stringify({
      error: {
        code: 'JOB_POSTING_OPERATION_FAILED',
        message: error.message || 'An error occurred'
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
