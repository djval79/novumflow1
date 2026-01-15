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
    const leaveId = url.searchParams.get('id');

    // CREATE Leave Request
    if (method === 'POST') {
      const requestBody = await req.json();
      const leaveData = requestBody.data || requestBody; // Handle both formats
      
      // Calculate total days
      const startDate = new Date(leaveData.start_date);
      const endDate = new Date(leaveData.end_date);
      const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      
      leaveData.total_days = diffDays;
      leaveData.status = 'pending';

      const insertResponse = await fetch(`${supabaseUrl}/rest/v1/leave_requests`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'apikey': serviceRoleKey,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation',
        },
        body: JSON.stringify(leaveData),
      });

      if (!insertResponse.ok) {
        const errorText = await insertResponse.text();
        throw new Error(`Failed to create leave request: ${errorText}`);
      }

      const newLeave = await insertResponse.json();

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
          entity_type: 'leave_request',
          entity_id: newLeave[0].id,
          new_values: JSON.stringify(leaveData),
        }),
      });

      return new Response(JSON.stringify({ data: newLeave[0] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // APPROVE/REJECT Leave Request
    if (method === 'PUT' && leaveId) {
      const { status, review_notes } = await req.json();

      if (!['approved', 'rejected'].includes(status)) {
        throw new Error('Invalid status. Must be approved or rejected');
      }

      // Get old values
      const oldValuesResponse = await fetch(
        `${supabaseUrl}/rest/v1/leave_requests?id=eq.${leaveId}&select=*`,
        {
          headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
          },
        }
      );
      const oldValues = await oldValuesResponse.json();

      const updateResponse = await fetch(
        `${supabaseUrl}/rest/v1/leave_requests?id=eq.${leaveId}`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation',
          },
          body: JSON.stringify({
            status,
            review_notes,
            reviewed_by: userId,
            reviewed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }),
        }
      );

      if (!updateResponse.ok) {
        const errorText = await updateResponse.text();
        throw new Error(`Failed to update leave request: ${errorText}`);
      }

      const updatedLeave = await updateResponse.json();

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
          entity_type: 'leave_request',
          entity_id: leaveId,
          old_values: JSON.stringify(oldValues[0]),
          new_values: JSON.stringify({ status, review_notes }),
        }),
      });

      return new Response(JSON.stringify({ data: updatedLeave[0] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // DELETE Leave Request
    if (method === 'DELETE' && leaveId) {
      const leaveResponse = await fetch(
        `${supabaseUrl}/rest/v1/leave_requests?id=eq.${leaveId}&select=*`,
        {
          headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
          },
        }
      );
      const leaveData = await leaveResponse.json();

      const deleteResponse = await fetch(
        `${supabaseUrl}/rest/v1/leave_requests?id=eq.${leaveId}`,
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
        throw new Error(`Failed to delete leave request: ${errorText}`);
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
          entity_type: 'leave_request',
          entity_id: leaveId,
          old_values: JSON.stringify(leaveData[0]),
        }),
      });

      return new Response(JSON.stringify({ data: { message: 'Leave request deleted successfully' } }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    throw new Error('Unsupported method');

  } catch (error) {
    console.error('Leave request CRUD error:', error);

    return new Response(JSON.stringify({
      error: {
        code: 'LEAVE_REQUEST_OPERATION_FAILED',
        message: error.message || 'An error occurred'
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
