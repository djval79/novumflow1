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
    const { token, newPassword, ipAddress, userAgent } = await req.json();

    if (!token || !newPassword) {
      throw new Error('Token and new password are required');
    }

    // Validate password strength
    if (newPassword.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Supabase configuration missing');
    }

    // Verify reset token
    const tokenResponse = await fetch(
      `${supabaseUrl}/rest/v1/password_reset_tokens?token=eq.${token}&is_valid=eq.true&select=*`,
      {
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'apikey': serviceRoleKey,
        },
      }
    );

    const tokens = await tokenResponse.json();

    if (!tokens || tokens.length === 0) {
      return new Response(JSON.stringify({
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid or expired reset token',
        }
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const resetToken = tokens[0];

    // Check if token has expired
    const expiresAt = new Date(resetToken.expires_at);
    const now = new Date();

    if (now > expiresAt) {
      // Invalidate token
      await fetch(`${supabaseUrl}/rest/v1/password_reset_tokens?id=eq.${resetToken.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'apikey': serviceRoleKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          is_valid: false,
        }),
      });

      return new Response(JSON.stringify({
        error: {
          code: 'TOKEN_EXPIRED',
          message: 'Reset token has expired. Please request a new one.',
        }
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check if token has already been used
    if (resetToken.used_at) {
      return new Response(JSON.stringify({
        error: {
          code: 'TOKEN_ALREADY_USED',
          message: 'This reset token has already been used',
        }
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Update user password using Supabase Admin API
    const updatePasswordResponse = await fetch(
      `${supabaseUrl}/auth/v1/admin/users/${resetToken.user_id}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'apikey': serviceRoleKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          password: newPassword,
        }),
      }
    );

    if (!updatePasswordResponse.ok) {
      const errorText = await updatePasswordResponse.text();
      throw new Error(`Failed to update password: ${errorText}`);
    }

    // Mark token as used
    await fetch(`${supabaseUrl}/rest/v1/password_reset_tokens?id=eq.${resetToken.id}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        used_at: new Date().toISOString(),
        is_valid: false,
      }),
    });

    // Unlock account if locked (password reset unlocks the account)
    await fetch(
      `${supabaseUrl}/rest/v1/account_lockouts?email=eq.${encodeURIComponent(resetToken.email)}&is_active=eq.true`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'apikey': serviceRoleKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          is_active: false,
          unlocked_at: new Date().toISOString(),
          unlock_method: 'password_reset',
        }),
      }
    );

    // Log security event
    await fetch(`${supabaseUrl}/rest/v1/security_events`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: resetToken.user_id,
        email: resetToken.email,
        event_type: 'password_reset_completed',
        event_category: 'password',
        severity: 'info',
        description: 'Password successfully reset',
        ip_address: ipAddress,
        user_agent: userAgent,
      }),
    });

    return new Response(JSON.stringify({
      data: {
        message: 'Password successfully reset. You can now log in with your new password.',
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Password reset confirm error:', error);

    return new Response(JSON.stringify({
      error: {
        code: 'RESET_CONFIRM_FAILED',
        message: error.message || 'An error occurred while resetting your password'
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
