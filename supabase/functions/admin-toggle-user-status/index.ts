import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Payload {
  user_id: string;
  action: 'activate' | 'deactivate';
  pin?: string; // required for deactivate; verified server-side
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    // Verify the caller is an authenticated superadmin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Missing authorization header');

    const callerClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: { user: caller }, error: callerErr } = await callerClient.auth.getUser();
    if (callerErr || !caller) throw new Error('Not authenticated');

    const { data: callerProfile, error: profErr } = await callerClient
      .from('profiles')
      .select('role, admin_pin')
      .eq('id', caller.id)
      .maybeSingle();
    if (profErr || callerProfile?.role !== 'superadmin') throw new Error('Unauthorized — admins only');

    const payload: Payload = await req.json();
    const { user_id, action, pin } = payload;

    if (!user_id || !action) throw new Error('Missing user_id or action');
    if (action !== 'activate' && action !== 'deactivate') throw new Error('Invalid action');

    // Deactivate requires PIN verification
    if (action === 'deactivate') {
      if (!pin) throw new Error('PIN is required to deactivate an account');
      const { data: verified } = await callerClient.rpc('verify_admin_pin', {
        p_user_id: caller.id,
        p_pin: pin,
      });
      if (!verified) throw new Error('Incorrect PIN');
    }

    // Use service role for admin operations
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    if (action === 'deactivate') {
      // Ban in auth (876000h ≈ 100 years)
      const { error: banErr } = await adminClient.auth.admin.updateUserById(user_id, {
        ban_duration: '876000h',
      });
      if (banErr) throw new Error(`Failed to ban user: ${banErr.message}`);

      // Mark inactive in profiles
      const { error: dbErr } = await adminClient
        .from('profiles')
        .update({ is_active: false })
        .eq('id', user_id);
      if (dbErr) throw new Error(`Failed to update profile: ${dbErr.message}`);
    } else {
      // Unban in auth
      const { error: unbanErr } = await adminClient.auth.admin.updateUserById(user_id, {
        ban_duration: 'none',
      });
      if (unbanErr) throw new Error(`Failed to unban user: ${unbanErr.message}`);

      // Mark active in profiles
      const { error: dbErr } = await adminClient
        .from('profiles')
        .update({ is_active: true })
        .eq('id', user_id);
      if (dbErr) throw new Error(`Failed to update profile: ${dbErr.message}`);
    }

    return new Response(
      JSON.stringify({ success: true, action, user_id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: String(err).replace('Error: ', '') }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
