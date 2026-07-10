import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Runs auto-deactivation for all expired owner subscriptions.
// Called by a pg_cron job daily, or manually triggered.
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    // 1. Find all owner profiles whose subscription has expired but are still active
    const { data: expired, error: fetchErr } = await adminClient
      .from('profiles')
      .select('id, email, full_name, subscription_expires_at')
      .eq('role', 'owner')
      .eq('is_active', true)
      .lt('subscription_expires_at', new Date().toISOString())
      .not('subscription_expires_at', 'is', null);

    if (fetchErr) throw new Error(fetchErr.message);
    if (!expired || expired.length === 0) {
      return new Response(
        JSON.stringify({ success: true, deactivated: 0, message: 'No expired subscriptions found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    let deactivatedCount = 0;
    const errors: string[] = [];

    for (const profile of expired) {
      try {
        // Ban in Supabase Auth (876000h ≈ 100 years)
        const { error: banErr } = await adminClient.auth.admin.updateUserById(profile.id, {
          ban_duration: '876000h',
        });
        if (banErr) throw new Error(`Auth ban failed: ${banErr.message}`);

        // Mark inactive in profiles
        const { error: dbErr } = await adminClient
          .from('profiles')
          .update({ is_active: false })
          .eq('id', profile.id);
        if (dbErr) throw new Error(`Profile update failed: ${dbErr.message}`);

        deactivatedCount++;
        console.log(`Deactivated expired account: ${profile.email} (expired: ${profile.subscription_expires_at})`);
      } catch (err) {
        const msg = String(err).replace('Error: ', '');
        errors.push(`${profile.email}: ${msg}`);
        console.error(`Failed to deactivate ${profile.email}:`, msg);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        deactivated: deactivatedCount,
        errors: errors.length > 0 ? errors : undefined,
        total_expired: expired.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: String(err).replace('Error: ', '') }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
