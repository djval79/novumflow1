Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, cache-control, x-requested-with, pragma',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Max-Age': '86400',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { email, ipAddress, userAgent } = await req.json();

    if (!email) {
      throw new Error('Email is required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Supabase configuration missing');
    }

    // Check if user exists
    const userResponse = await fetch(
      `${supabaseUrl}/auth/v1/admin/users`,
      {
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'apikey': serviceRoleKey,
        },
      }
    );

    const usersData = await userResponse.json();
    const user = usersData.users?.find((u: any) => u.email === email);

    if (!user) {
      // Don't reveal if user exists or not - always return success
      return new Response(JSON.stringify({
        data: {
          message: 'If an account exists with this email, you will receive a password reset link shortly.',
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Generate secure reset token
    const tokenArray = new Uint8Array(32);
    crypto.getRandomValues(tokenArray);
    const token = Array.from(tokenArray, byte => byte.toString(16).padStart(2, '0')).join('');
    
    const expiresAt = new Date(Date.now() + 60 * 60000); // 1 hour from now

    // Save reset token
    const insertResponse = await fetch(`${supabaseUrl}/rest/v1/password_reset_tokens`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
      body: JSON.stringify({
        user_id: user.id,
        email,
        token,
        expires_at: expiresAt.toISOString(),
        ip_address: ipAddress,
        user_agent: userAgent,
        is_valid: true,
      }),
    });

    if (!insertResponse.ok) {
      const errorText = await insertResponse.text();
      throw new Error(`Failed to create reset token: ${errorText}`);
    }

    // Log security event
    await fetch(`${supabaseUrl}/rest/v1/security_events`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: user.id,
        email,
        event_type: 'password_reset_requested',
        event_category: 'password',
        severity: 'warning',
        description: 'Password reset requested',
        ip_address: ipAddress,
        user_agent: userAgent,
      }),
    });

    // In production, send email with reset link
    // For now, return the token (in production, this should only be sent via email)
    const origin = req.headers.get('origin') || req.headers.get('referer')?.split('/').slice(0, 3).join('/') || 'https://yej530tja8rx.space.minimax.io';
    const resetLink = `${origin}/reset-password?token=${token}`;

    console.log('Password reset link:', resetLink);

    return new Response(JSON.stringify({
      data: {
        message: 'If an account exists with this email, you will receive a password reset link shortly.',
        // Remove this in production - only for testing
        resetLink,
        token,
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Password reset request error:', error);

    return new Response(JSON.stringify({
      error: {
        code: 'RESET_REQUEST_FAILED',
        message: error.message || 'An error occurred while processing your request'
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
