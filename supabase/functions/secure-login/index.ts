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
    const { email, password, ipAddress, userAgent } = await req.json();

    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Supabase configuration missing');
    }

    // Check if account is locked
    const lockoutCheckResponse = await fetch(
      `${supabaseUrl}/rest/v1/account_lockouts?email=eq.${encodeURIComponent(email)}&is_active=eq.true&select=*`,
      {
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'apikey': serviceRoleKey,
          'Content-Type': 'application/json',
        },
      }
    );

    const lockouts = await lockoutCheckResponse.json();
    
    if (lockouts && lockouts.length > 0) {
      const activeLockout = lockouts[0];
      const unlockTime = new Date(activeLockout.unlock_at);
      const now = new Date();

      if (now < unlockTime) {
        // Account is still locked
        const minutesRemaining = Math.ceil((unlockTime.getTime() - now.getTime()) / 60000);
        
        // Log locked attempt
        await fetch(`${supabaseUrl}/rest/v1/login_attempts`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email,
            ip_address: ipAddress,
            user_agent: userAgent,
            attempt_status: 'locked',
            failure_reason: 'Account locked due to multiple failed attempts',
          }),
        });

        return new Response(JSON.stringify({
          error: {
            code: 'ACCOUNT_LOCKED',
            message: `Account is temporarily locked. Please try again in ${minutesRemaining} minutes.`,
            minutesRemaining,
          }
        }), {
          status: 423,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } else {
        // Lockout expired, deactivate it
        await fetch(`${supabaseUrl}/rest/v1/account_lockouts?id=eq.${activeLockout.id}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            is_active: false,
            unlocked_at: new Date().toISOString(),
            unlock_method: 'automatic',
          }),
        });
      }
    }

    // Attempt authentication
    const authResponse = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'apikey': serviceRoleKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
      }),
    });

    if (authResponse.ok) {
      const authData = await authResponse.json();
      
      // Log successful login
      await fetch(`${supabaseUrl}/rest/v1/login_attempts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'apikey': serviceRoleKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          ip_address: ipAddress,
          user_agent: userAgent,
          attempt_status: 'success',
        }),
      });

      // Log security event
      await fetch(`${supabaseUrl}/rest/v1/security_events`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'apikey': serviceRoleKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: authData.user?.id,
          email,
          event_type: 'login_success',
          event_category: 'authentication',
          severity: 'info',
          description: 'Successful login',
          ip_address: ipAddress,
          user_agent: userAgent,
        }),
      });

      return new Response(JSON.stringify({
        data: authData
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } else {
      // Login failed - check failed attempts count
      const failedAttemptsResponse = await fetch(
        `${supabaseUrl}/rest/v1/login_attempts?email=eq.${encodeURIComponent(email)}&attempt_status=eq.failed&attempted_at=gte.${new Date(Date.now() - 15 * 60000).toISOString()}&select=*`,
        {
          headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
          },
        }
      );

      const recentFailedAttempts = await failedAttemptsResponse.json();
      const failedCount = (recentFailedAttempts?.length || 0) + 1;

      // Log failed attempt
      await fetch(`${supabaseUrl}/rest/v1/login_attempts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'apikey': serviceRoleKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          ip_address: ipAddress,
          user_agent: userAgent,
          attempt_status: 'failed',
          failure_reason: 'Invalid credentials',
        }),
      });

      // Lock account if 5 or more failed attempts
      if (failedCount >= 5) {
        const unlockTime = new Date(Date.now() + 15 * 60000); // 15 minutes from now

        await fetch(`${supabaseUrl}/rest/v1/account_lockouts`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email,
            unlock_at: unlockTime.toISOString(),
            lock_reason: 'Multiple failed login attempts',
            locked_by_ip: ipAddress,
            is_active: true,
          }),
        });

        // Log security event
        await fetch(`${supabaseUrl}/rest/v1/security_events`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email,
            event_type: 'account_locked',
            event_category: 'authentication',
            severity: 'critical',
            description: `Account locked after ${failedCount} failed login attempts`,
            ip_address: ipAddress,
            user_agent: userAgent,
          }),
        });

        return new Response(JSON.stringify({
          error: {
            code: 'ACCOUNT_LOCKED',
            message: 'Account has been locked due to multiple failed login attempts. Please try again in 15 minutes or reset your password.',
            attemptsRemaining: 0,
          }
        }), {
          status: 423,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const attemptsRemaining = 5 - failedCount;

      return new Response(JSON.stringify({
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password',
          attemptsRemaining,
          showCaptcha: failedCount >= 3,
        }
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

  } catch (error) {
    console.error('Secure login error:', error);

    return new Response(JSON.stringify({
      error: {
        code: 'LOGIN_FAILED',
        message: error.message || 'An error occurred during login'
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
