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
    const applicationId = url.searchParams.get('id');

    // CREATE Application
    if (method === 'POST') {
      const requestBody = await req.json();

      // Handle different request formats from frontend
      let applicationData;
      if (requestBody.action === 'create' && requestBody.data) {
        applicationData = requestBody.data;
      } else if (requestBody.data) {
        applicationData = requestBody.data;
      } else {
        applicationData = requestBody;
      }



      applicationData.status = applicationData.status || 'applied';
      applicationData.applied_at = new Date().toISOString();

      const insertResponse = await fetch(`${supabaseUrl}/rest/v1/applications`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'apikey': serviceRoleKey,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation',
        },
        body: JSON.stringify(applicationData),
      });

      if (!insertResponse.ok) {
        const errorText = await insertResponse.text();
        throw new Error(`Failed to create application: ${errorText}`);
      }

      const newApplication = await insertResponse.json();

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
          action: 'CREATE_APPLICATION',
          entity_type: 'applications',
          entity_id: newApplication[0].id,
          timestamp: new Date().toISOString()
        }),
      });

      return new Response(JSON.stringify({ data: newApplication[0] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // UPDATE Application (status, score, notes, pipeline stage)
    if (method === 'PUT' && applicationId) {
      const updateData = await req.json();
      updateData.updated_at = new Date().toISOString();
      updateData.last_updated_by = userId;

      // Get old values
      const oldValuesResponse = await fetch(
        `${supabaseUrl}/rest/v1/applications?id=eq.${applicationId}&select=*`,
        {
          headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
          },
        }
      );
      const oldValues = await oldValuesResponse.json();

      const updateResponse = await fetch(
        `${supabaseUrl}/rest/v1/applications?id=eq.${applicationId}`,
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
        throw new Error(`Failed to update application: ${errorText}`);
      }

      const updatedApplication = await updateResponse.json();

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
          entity_type: 'application',
          entity_id: applicationId,
          old_values: JSON.stringify(oldValues[0]),
          new_values: JSON.stringify(updateData),
        }),
      });

      return new Response(JSON.stringify({ data: updatedApplication[0] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Convert Application to Employee
    if (method === 'POST') {
      const { applicationId: appId, additionalData } = await req.json();

      if (!appId) {
        throw new Error('Application ID is required');
      }

      // Get application data
      const appResponse = await fetch(
        `${supabaseUrl}/rest/v1/applications?id=eq.${appId}&select=*`,
        {
          headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
          },
        }
      );
      const applications = await appResponse.json();

      if (!applications || applications.length === 0) {
        throw new Error('Application not found');
      }

      const application = applications[0];

      // Get job posting details
      const jobResponse = await fetch(
        `${supabaseUrl}/rest/v1/job_postings?id=eq.${application.job_posting_id}&select=*`,
        {
          headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
          },
        }
      );
      const jobs = await jobResponse.json();
      const job = jobs && jobs.length > 0 ? jobs[0] : null;

      // Generate employee number
      const timestamp = Date.now().toString().slice(-6);
      const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      const employeeNumber = `EMP-${timestamp}${random}`;

      // Create employee record
      const employeeData = {
        employee_number: employeeNumber,
        first_name: application.applicant_first_name,
        last_name: application.applicant_last_name,
        email: application.applicant_email,
        phone: application.applicant_phone,
        department: job?.department || additionalData?.department,
        position: job?.job_title || additionalData?.position,
        employment_type: job?.employment_type || 'full_time',
        date_hired: new Date().toISOString().split('T')[0],
        status: 'active',
        created_by: userId,
        ...additionalData,
      };

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

      // Update application status to 'hired'
      await fetch(`${supabaseUrl}/rest/v1/applications?id=eq.${appId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'apikey': serviceRoleKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'hired',
          last_updated_by: userId,
          updated_at: new Date().toISOString(),
        }),
      });

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
          new_values: JSON.stringify({ converted_from_application: appId }),
        }),
      });

      return new Response(JSON.stringify({
        data: {
          employee: newEmployee[0],
          message: 'Application converted to employee successfully'
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // DELETE Application
    if (method === 'DELETE' && applicationId) {
      const appResponse = await fetch(
        `${supabaseUrl}/rest/v1/applications?id=eq.${applicationId}&select=*`,
        {
          headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
          },
        }
      );
      const appData = await appResponse.json();

      const deleteResponse = await fetch(
        `${supabaseUrl}/rest/v1/applications?id=eq.${applicationId}`,
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
        throw new Error(`Failed to delete application: ${errorText}`);
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
          entity_type: 'application',
          entity_id: applicationId,
          old_values: JSON.stringify(appData[0]),
        }),
      });

      return new Response(JSON.stringify({ data: { message: 'Application deleted successfully' } }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    throw new Error('Unsupported method');

  } catch (error) {
    console.error('Application CRUD error:', error);

    return new Response(JSON.stringify({
      error: {
        code: 'APPLICATION_OPERATION_FAILED',
        message: error.message || 'An error occurred'
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
