Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, cache-control, x-requested-with, pragma',
    'Access-Control-Allow-Methods': 'POST, DELETE, OPTIONS',
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

    if (req.method === 'POST') {
      const { employeeId, documentType, documentName, fileData, fileName, expiryDate } = await req.json();

      if (!employeeId || !fileData || !fileName) {
        throw new Error('Employee ID, file data, and filename are required');
      }

      // Extract base64 data
      const base64Data = fileData.split(',')[1];
      const mimeType = fileData.split(';')[0].split(':')[1];
      const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

      // Upload to storage
      const timestamp = Date.now();
      const storagePath = `${employeeId}/${timestamp}-${fileName}`;

      const uploadResponse = await fetch(
        `${supabaseUrl}/storage/v1/object/employee-documents/${storagePath}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'Content-Type': mimeType,
            'x-upsert': 'true'
          },
          body: binaryData
        }
      );

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        throw new Error(`Upload failed: ${errorText}`);
      }

      const publicUrl = `${supabaseUrl}/storage/v1/object/public/employee-documents/${storagePath}`;

      // Save document metadata
      const insertResponse = await fetch(`${supabaseUrl}/rest/v1/documents`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'apikey': serviceRoleKey,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation',
        },
        body: JSON.stringify({
          employee_id: employeeId,
          document_type: documentType || 'Other',
          document_name: documentName || fileName,
          file_url: publicUrl,
          file_size: binaryData.length,
          mime_type: mimeType,
          expiry_date: expiryDate || null,
          uploaded_by: userId,
        }),
      });

      if (!insertResponse.ok) {
        const errorText = await insertResponse.text();
        throw new Error(`Database insert failed: ${errorText}`);
      }

      const document = await insertResponse.json();

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
          entity_type: 'document',
          entity_id: document[0].id,
          new_values: JSON.stringify({ document_name: documentName, employee_id: employeeId }),
        }),
      });

      return new Response(JSON.stringify({ data: document[0] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (req.method === 'DELETE') {
      const url = new URL(req.url);
      const documentId = url.searchParams.get('id');

      if (!documentId) {
        throw new Error('Document ID required');
      }

      // Get document info
      const docResponse = await fetch(
        `${supabaseUrl}/rest/v1/documents?id=eq.${documentId}&select=*`,
        {
          headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
          },
        }
      );
      const docs = await docResponse.json();

      if (docs && docs.length > 0) {
        const doc = docs[0];
        
        // Delete from storage
        const pathMatch = doc.file_url.match(/employee-documents\/(.+)$/);
        if (pathMatch) {
          await fetch(
            `${supabaseUrl}/storage/v1/object/employee-documents/${pathMatch[1]}`,
            {
              method: 'DELETE',
              headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
              },
            }
          );
        }
      }

      // Delete from database
      const deleteResponse = await fetch(
        `${supabaseUrl}/rest/v1/documents?id=eq.${documentId}`,
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
        throw new Error(`Failed to delete document: ${errorText}`);
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
          entity_type: 'document',
          entity_id: documentId,
          old_values: JSON.stringify(docs[0]),
        }),
      });

      return new Response(JSON.stringify({ data: { message: 'Document deleted successfully' } }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

  } catch (error) {
    console.error('Document upload error:', error);

    return new Response(JSON.stringify({
      error: {
        code: 'DOCUMENT_OPERATION_FAILED',
        message: error.message || 'An error occurred'
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
