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
    const interviewId = url.searchParams.get('id');

    // CREATE Interview
    if (method === 'POST') {
      const requestBody = await req.json();
      const interviewData = requestBody.data || requestBody; // Handle both formats
      interviewData.created_by = userId;
      interviewData.status = interviewData.status || 'scheduled';

      const insertResponse = await fetch(`${supabaseUrl}/rest/v1/interviews`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'apikey': serviceRoleKey,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation',
        },
        body: JSON.stringify(interviewData),
      });

      if (!insertResponse.ok) {
        const errorText = await insertResponse.text();
        throw new Error(`Failed to create interview: ${errorText}`);
      }

      const newInterview = await insertResponse.json();

      // Update application status to 'interview_scheduled'
      if (interviewData.application_id) {
        await fetch(`${supabaseUrl}/rest/v1/applications?id=eq.${interviewData.application_id}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status: 'interview_scheduled',
            last_updated_by: userId,
            updated_at: new Date().toISOString(),
          }),
        });
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
          action: 'create',
          entity_type: 'interview',
          entity_id: newInterview[0].id,
          new_values: JSON.stringify(interviewData),
        }),
      });

      return new Response(JSON.stringify({ data: newInterview[0] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // UPDATE Interview (feedback, status, rating, recommendation)
    if (method === 'PUT' && interviewId) {
      const updateData = await req.json();
      updateData.updated_at = new Date().toISOString();

      // Get old values
      const oldValuesResponse = await fetch(
        `${supabaseUrl}/rest/v1/interviews?id=eq.${interviewId}&select=*`,
        {
          headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
          },
        }
      );
      const oldValues = await oldValuesResponse.json();

      const updateResponse = await fetch(
        `${supabaseUrl}/rest/v1/interviews?id=eq.${interviewId}`,
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
        throw new Error(`Failed to update interview: ${errorText}`);
      }

      const updatedInterview = await updateResponse.json();

      // If interview is completed, update application status
      if (updateData.status === 'completed' && oldValues[0]?.application_id) {
        await fetch(`${supabaseUrl}/rest/v1/applications?id=eq.${oldValues[0].application_id}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status: 'interviewed',
            last_updated_by: userId,
            updated_at: new Date().toISOString(),
          }),
        });
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
          action: 'update',
          entity_type: 'interview',
          entity_id: interviewId,
          old_values: JSON.stringify(oldValues[0]),
          new_values: JSON.stringify(updateData),
        }),
      });

      return new Response(JSON.stringify({ data: updatedInterview[0] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // DELETE Interview
    if (method === 'DELETE' && interviewId) {
      const interviewResponse = await fetch(
        `${supabaseUrl}/rest/v1/interviews?id=eq.${interviewId}&select=*`,
        {
          headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
          },
        }
      );
      const interviewData = await interviewResponse.json();

      const deleteResponse = await fetch(
        `${supabaseUrl}/rest/v1/interviews?id=eq.${interviewId}`,
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
        throw new Error(`Failed to delete interview: ${errorText}`);
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
          entity_type: 'interview',
          entity_id: interviewId,
          old_values: JSON.stringify(interviewData[0]),
        }),
      });

      return new Response(JSON.stringify({ data: { message: 'Interview deleted successfully' } }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    throw new Error('Unsupported method');

  } catch (error) {
    console.error('Interview CRUD error:', error);

    return new Response(JSON.stringify({
      error: {
        code: 'INTERVIEW_OPERATION_FAILED',
        message: error.message || 'An error occurred'
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
