import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { user_id, new_password, new_pin } = await req.json();

    if (!user_id || !new_password) {
      return new Response(JSON.stringify({ error: 'user_id and new_password required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Admin client with service role — bypasses RLS, uses Supabase Auth Admin API
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Update password via Admin API (proper Supabase format, not raw SQL crypt)
    const { data, error } = await adminClient.auth.admin.updateUserById(user_id, {
      password: new_password,
      email_confirm: true,
    });

    if (error) throw error;

    // Also update the admin PIN hash if a new PIN is provided
    if (new_pin) {
      const { error: pinErr } = await adminClient.rpc('set_admin_pin', { p_pin: new_pin });
      // set_admin_pin uses auth.uid() — so we do it via a direct update instead
      const pinHash = await adminClient.rpc('hash_admin_pin', { pin: new_pin });
      if (!pinErr && pinHash.data) {
        await adminClient
          .from('profiles')
          .update({ admin_pin: pinHash.data })
          .eq('id', user_id);
      }
    }

    return new Response(JSON.stringify({ success: true, email: data.user?.email }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
