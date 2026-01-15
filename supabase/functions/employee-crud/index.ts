Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, cache-control, x-requested-with, pragma',
    'Access-Control-Allow-Methods': 'POST, GET, PUT, DELETE, OPTIONS',
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

    // Get user from auth header
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
    const employeeId = url.searchParams.get('id');

    // CREATE Employee
    if (method === 'POST') {
      const requestBody = await req.json();
      
      // Handle different request formats from frontend
      let employeeData;
      if (requestBody.action === 'create' && requestBody.data) {
        employeeData = requestBody.data;
      } else if (requestBody.data) {
        employeeData = requestBody.data;
      } else {
        employeeData = requestBody;
      }

      // Generate unique employee number if not provided
      if (!employeeData.employee_number) {
        // Get existing employee count for sequence
        const countResponse = await fetch(`${supabaseUrl}/rest/v1/employees?select=count`, {
          method: 'HEAD',
          headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
          },
        });
        
        const count = countResponse.headers.get('content-range')?.split('/')[1] || '0';
        const nextNumber = (parseInt(count) + 1).toString().padStart(4, '0');
        const timestamp = Date.now().toString().slice(-4);
        employeeData.employee_number = `EMP${nextNumber}${timestamp}`;
      }

      employeeData.created_by = userId;

      const insertResponse = await fetch(`${supabaseUrl}/rest/v1/employees`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'apikey': serviceRoleKey,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation',
        },
        body: JSON.stringify(employeeData),
      });

      if (!insertResponse.ok) {
        const errorText = await insertResponse.text();
        throw new Error(`Failed to create employee: ${errorText}`);
      }

      const newEmployee = await insertResponse.json();

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
          entity_type: 'employee',
          entity_id: newEmployee[0].id,
          new_values: JSON.stringify(employeeData),
        }),
      });

      return new Response(JSON.stringify({ data: newEmployee[0] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // UPDATE Employee
    if (method === 'PUT' && employeeId) {
      const requestBody = await req.json();
      const updateData = requestBody.data || requestBody; // Handle both formats
      updateData.updated_at = new Date().toISOString();

      // Get old values for audit
      const oldValuesResponse = await fetch(
        `${supabaseUrl}/rest/v1/employees?id=eq.${employeeId}&select=*`,
        {
          headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
          },
        }
      );
      const oldValues = await oldValuesResponse.json();

      const updateResponse = await fetch(
        `${supabaseUrl}/rest/v1/employees?id=eq.${employeeId}`,
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
        throw new Error(`Failed to update employee: ${errorText}`);
      }

      const updatedEmployee = await updateResponse.json();

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
          entity_type: 'employee',
          entity_id: employeeId,
          old_values: JSON.stringify(oldValues[0]),
          new_values: JSON.stringify(updateData),
        }),
      });

      return new Response(JSON.stringify({ data: updatedEmployee[0] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // DELETE Employee
    if (method === 'DELETE' && employeeId) {
      // Get employee data before deletion for audit
      const employeeResponse = await fetch(
        `${supabaseUrl}/rest/v1/employees?id=eq.${employeeId}&select=*`,
        {
          headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
          },
        }
      );
      const employeeData = await employeeResponse.json();

      const deleteResponse = await fetch(
        `${supabaseUrl}/rest/v1/employees?id=eq.${employeeId}`,
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
        throw new Error(`Failed to delete employee: ${errorText}`);
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
          entity_type: 'employee',
          entity_id: employeeId,
          old_values: JSON.stringify(employeeData[0]),
        }),
      });

      return new Response(JSON.stringify({ data: { message: 'Employee deleted successfully' } }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // GET Employee(s)
    if (method === 'GET') {
      let query = `${supabaseUrl}/rest/v1/employees?select=*`;
      
      if (employeeId) {
        query += `&id=eq.${employeeId}`;
      }

      query += '&order=created_at.desc';

      const getResponse = await fetch(query, {
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'apikey': serviceRoleKey,
        },
      });

      if (!getResponse.ok) {
        const errorText = await getResponse.text();
        throw new Error(`Failed to get employees: ${errorText}`);
      }

      const employees = await getResponse.json();

      return new Response(JSON.stringify({ data: employees }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    throw new Error('Unsupported method');

  } catch (error) {
    console.error('Employee CRUD error:', error);

    return new Response(JSON.stringify({
      error: {
        code: 'EMPLOYEE_OPERATION_FAILED',
        message: error.message || 'An error occurred'
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
