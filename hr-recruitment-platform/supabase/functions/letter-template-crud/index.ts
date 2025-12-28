Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
    'Access-Control-Max-Age': '86400',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const token = authHeader.replace('Bearer ', '');

    // Verify token and get user
    const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'apikey': supabaseKey
      }
    });

    if (!userResponse.ok) {
      throw new Error('Invalid token');
    }

    const user = await userResponse.json();
    const userId = user.id;

    const requestBody = await req.json();
    const action = requestBody.action || 'create';
    const data = requestBody.data || requestBody;

    if (action === 'create') {
      // Create letter template
      const templateData = {
        template_name: data.template_name,
        template_type: data.template_type,
        subject: data.subject,
        content: data.content,
        category: data.category || null,
        version: data.version || 1,
        is_active: data.is_active !== undefined ? data.is_active : true,
        created_by: userId
      };

      const createResponse = await fetch(`${supabaseUrl}/rest/v1/letter_templates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(templateData)
      });

      if (!createResponse.ok) {
        const error = await createResponse.json();
        throw new Error(`Failed to create letter template: ${JSON.stringify(error)}`);
      }

      const createdTemplate = await createResponse.json();
      const template = Array.isArray(createdTemplate) ? createdTemplate[0] : createdTemplate;

      // Log audit
      await fetch(`${supabaseUrl}/rest/v1/audit_logs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        },
        body: JSON.stringify({
          user_id: userId,
          action: 'CREATE_TEMPLATE',
          entity_type: 'letter_templates',
          entity_id: template.id,
          timestamp: new Date().toISOString()
        })
      });

      return new Response(
        JSON.stringify({ data: template }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    } else if (action === 'update') {
      // Update letter template
      const updateData: any = {};
      if (data.template_name) updateData.template_name = data.template_name;
      if (data.template_type) updateData.template_type = data.template_type;
      if (data.subject !== undefined) updateData.subject = data.subject;
      if (data.content) updateData.content = data.content;
      if (data.category !== undefined) updateData.category = data.category;
      if (data.version !== undefined) updateData.version = data.version;
      if (data.is_active !== undefined) updateData.is_active = data.is_active;
      updateData.updated_at = new Date().toISOString();

      const updateResponse = await fetch(
        `${supabaseUrl}/rest/v1/letter_templates?id=eq.${data.id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Prefer': 'return=representation'
          },
          body: JSON.stringify(updateData)
        }
      );

      if (!updateResponse.ok) {
        const error = await updateResponse.json();
        throw new Error(`Failed to update letter template: ${JSON.stringify(error)}`);
      }

      const updatedTemplate = await updateResponse.json();
      const template = Array.isArray(updatedTemplate) ? updatedTemplate[0] : updatedTemplate;

      // Log audit
      await fetch(`${supabaseUrl}/rest/v1/audit_logs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        },
        body: JSON.stringify({
          user_id: userId,
          action: 'UPDATE_TEMPLATE',
          entity_type: 'letter_templates',
          entity_id: template.id,
          timestamp: new Date().toISOString()
        })
      });

      return new Response(
        JSON.stringify({ data: template }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    } else if (action === 'delete') {
      // Soft delete (set is_active to false)
      const deleteResponse = await fetch(
        `${supabaseUrl}/rest/v1/letter_templates?id=eq.${data.id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Prefer': 'return=representation'
          },
          body: JSON.stringify({ is_active: false })
        }
      );

      if (!deleteResponse.ok) {
        const error = await deleteResponse.json();
        throw new Error(`Failed to delete letter template: ${JSON.stringify(error)}`);
      }

      const deletedTemplate = await deleteResponse.json();
      const template = Array.isArray(deletedTemplate) ? deletedTemplate[0] : deletedTemplate;

      // Log audit
      await fetch(`${supabaseUrl}/rest/v1/audit_logs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        },
        body: JSON.stringify({
          user_id: userId,
          action: 'DELETE_TEMPLATE',
          entity_type: 'letter_templates',
          entity_id: template.id,
          timestamp: new Date().toISOString()
        })
      });

      return new Response(
        JSON.stringify({ data: template }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    } else if (action === 'generate') {
      // Generate letter from template
      const { template_id, employee_id, variables = {} } = data;

      if (!template_id || !employee_id) {
        throw new Error('template_id and employee_id are required for generation');
      }

      // 1. Fetch template
      const templateResponse = await fetch(`${supabaseUrl}/rest/v1/letter_templates?id=eq.${template_id}`, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        }
      });
      const templates = await templateResponse.json();
      const template = templates[0];
      if (!template) throw new Error('Template not found');

      // 2. Fetch employee
      const employeeResponse = await fetch(`${supabaseUrl}/rest/v1/employees?id=eq.${employee_id}`, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        }
      });
      const employees = await employeeResponse.json();
      const employee = employees[0];
      if (!employee) throw new Error('Employee not found');

      // 3. Prepare variables
      const mergedVariables = {
        employee_name: `${employee.first_name} ${employee.last_name}`,
        employee_first_name: employee.first_name,
        employee_last_name: employee.last_name,
        employee_email: employee.email,
        employee_number: employee.employee_number,
        position: employee.position,
        department: employee.department,
        current_date: new Date().toLocaleDateString(),
        ...variables
      };

      // 4. Replace variables in content and subject
      let contentContent = template.content || '';
      let subjectStr = template.subject || '';

      for (const [key, value] of Object.entries(mergedVariables)) {
        const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
        contentContent = contentContent.replace(regex, String(value));
        subjectStr = subjectStr.replace(regex, String(value));
      }

      // 5. Save generated letter
      const generateResponse = await fetch(`${supabaseUrl}/rest/v1/generated_letters`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          template_id,
          employee_id,
          letter_type: template.template_type,
          subject: subjectStr,
          content: contentContent,
          status: 'draft',
          generated_by: userId,
          generated_at: new Date().toISOString()
        })
      });

      if (!generateResponse.ok) {
        const genErr = await generateResponse.text();
        throw new Error(`Failed to save generated letter: ${genErr}`);
      }

      const generatedLetter = await generateResponse.json();

      // Log audit
      await fetch(`${supabaseUrl}/rest/v1/audit_logs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        },
        body: JSON.stringify({
          user_id: userId,
          action: 'GENERATE_LETTER',
          entity_type: 'generated_letters',
          entity_id: Array.isArray(generatedLetter) ? generatedLetter[0].id : generatedLetter.id,
          timestamp: new Date().toISOString()
        })
      });

      return new Response(
        JSON.stringify({ data: Array.isArray(generatedLetter) ? generatedLetter[0] : generatedLetter }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    } else {
      throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: {
          code: 'TEMPLATE_OPERATION_FAILED',
          message: error.message
        }
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
