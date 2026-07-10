import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    // ── 1. List and delete ALL existing auth users ──────────────────────────
    const { data: { users }, error: listErr } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
    if (listErr) throw listErr;

    const deleteResults: string[] = [];
    for (const u of users ?? []) {
      const { error } = await supabaseAdmin.auth.admin.deleteUser(u.id);
      deleteResults.push(error ? `FAIL ${u.email}: ${error.message}` : `OK ${u.email}`);
    }

    // ── 2. Create the 2 platform administrators ─────────────────────────────
    const ADMINS = [
      { email: 'reinholdshilongo@atustoka.com', full_name: 'Reinhold Shilongo', temp_password: 'AtuAdmin@2026' },
      { email: 'jhiskiel@gmail.com',            full_name: 'Jacob Hiskiel',     temp_password: 'AtuAdmin@2026' },
    ];

    const created: { email: string; temp_password: string; id: string }[] = [];

    for (const admin of ADMINS) {
      // Create auth user
      const { data: newUser, error: createErr } = await supabaseAdmin.auth.admin.createUser({
        email: admin.email,
        password: admin.temp_password,
        email_confirm: true,          // bypass email verification
        user_metadata: {
          full_name: admin.full_name,
          ownerName: admin.full_name,
        },
      });
      if (createErr) throw new Error(`Failed to create ${admin.email}: ${createErr.message}`);

      // Upsert profile with superadmin role
      const { error: profErr } = await supabaseAdmin.from('profiles').upsert({
        id:        newUser.user.id,
        email:     admin.email,
        full_name: admin.full_name,
        role:      'superadmin',
      });
      if (profErr) throw new Error(`Profile upsert failed for ${admin.email}: ${profErr.message}`);

      created.push({ email: admin.email, temp_password: admin.temp_password, id: newUser.user.id });
    }

    return new Response(
      JSON.stringify({ success: true, deleted: deleteResults, created }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: String(err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
