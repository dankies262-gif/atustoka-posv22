import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ── PIN generation ────────────────────────────────────────────────────────────
// Generates a random 5-digit string (10000–99999) and checks uniqueness.
// Uniqueness comparison uses bcrypt: try_pin compared against each stored hash.
// If the DB has fewer than 90,000 admin entries the collision rate is negligible.
async function generateUniquePin(
  adminClient: ReturnType<typeof createClient>,
): Promise<{ pin: string; hash: string }> {
  for (let i = 0; i < 50; i++) {
    const pin = String(Math.floor(Math.random() * 90000) + 10000);
    // Hash via Postgres crypt() — call via RPC
    const { data: hash } = await adminClient.rpc('hash_admin_pin', { p_pin: pin });
    if (!hash) continue;
    // Check collision: any existing admin whose PIN verifies against this candidate
    const { data: collision } = await adminClient.rpc('verify_admin_pin_by_hash', {
      p_candidate_hash: hash,
    });
    if (!collision) return { pin, hash };
  }
  throw new Error('Could not generate unique PIN — try again');
}

interface CreateAdminPayload {
  type: 'admin';
  full_name: string;
  email: string;
  password: string;
  avatar_url?: string;
}

interface CreateOwnerPayload {
  type: 'owner';
  full_name: string;
  email: string;
  phone: string;
  password: string;
  business_name: string;
  business_type: string;
  region: string;
  town?: string;
}

type Payload = CreateAdminPayload | CreateOwnerPayload;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    // ── Service-role client ──────────────────────────────────────────────────
    const adminDb = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    // ── Caller verification (skip only for self-registration: no Auth header) ─
    const authHeader = req.headers.get('Authorization');
    let callerIsAdmin = false;
    if (authHeader) {
      const callerClient = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_ANON_KEY')!,
        { global: { headers: { Authorization: authHeader } } },
      );
      const { data: { user: caller } } = await callerClient.auth.getUser();
      if (caller) {
        const { data: profile } = await adminDb
          .from('profiles')
          .select('role')
          .eq('id', caller.id)
          .maybeSingle();
        callerIsAdmin = profile?.role === 'superadmin';
      }
    }

    const body: Payload = await req.json();

    // ── Admin account creation ───────────────────────────────────────────────
    if (body.type === 'admin') {
      // Validate email domain: only Gmail or @atustoka.com
      const emailLc = body.email.trim().toLowerCase();
      const isGmail = emailLc.endsWith('@gmail.com');
      const isAtustoka = emailLc.endsWith('@atustoka.com');
      if (!isGmail && !isAtustoka) {
        throw new Error('Administrator accounts require a Gmail or @atustoka.com email address');
      }

      // Check email uniqueness
      const { data: existing } = await adminDb
        .from('profiles')
        .select('id')
        .eq('email', emailLc)
        .maybeSingle();
      if (existing) throw new Error('An account with this email already exists');

      // Create auth user
      const { data: newUser, error: createErr } = await adminDb.auth.admin.createUser({
        email: emailLc,
        password: body.password,
        email_confirm: true,
        user_metadata: { full_name: body.full_name, ownerName: body.full_name },
      });
      if (createErr) throw new Error(createErr.message);

      // Auto-generate unique PIN
      const { pin, hash } = await generateUniquePin(adminDb);

      // Upsert profile with superadmin role + hashed PIN + avatar
      const { error: profErr } = await adminDb.from('profiles').upsert({
        id: newUser.user.id,
        email: emailLc,
        full_name: body.full_name,
        role: 'superadmin',
        admin_pin: hash,
        avatar_url: body.avatar_url ?? null,
      });
      if (profErr) throw new Error(profErr.message);

      return new Response(
        JSON.stringify({ success: true, user_id: newUser.user.id, email: emailLc, generated_pin: pin }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // ── Owner account creation ───────────────────────────────────────────────
    if (body.type === 'owner') {
      // Only admins can create owner accounts via this function
      if (!callerIsAdmin) {
        return new Response(JSON.stringify({ error: 'Forbidden — superadmin required' }), {
          status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data: newUser, error: createErr } = await adminDb.auth.admin.createUser({
        email: body.email || `user_${Date.now()}@placeholder.atustoka`,
        password: body.password,
        email_confirm: true,
        user_metadata: {
          full_name: body.full_name,
          ownerName: body.full_name,
          businessName: body.business_name,
        },
      });
      if (createErr) throw new Error(createErr.message);

      const uid = newUser.user.id;

      const { error: profErr } = await adminDb.from('profiles').upsert({
        id: uid,
        email: body.email || null,
        phone: body.phone || null,
        full_name: body.full_name,
        role: 'owner',
        subscription_expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
      });
      if (profErr) throw new Error(profErr.message);

      const { data: storeData, error: storeErr } = await adminDb
        .from('stores')
        .insert({
          owner_id: uid,
          business_name: body.business_name,
          business_type: body.business_type,
          region: body.region,
          town: body.town ?? null,
          phone: body.phone ?? null,
        })
        .select('id')
        .maybeSingle();
      if (storeErr) throw new Error(storeErr.message);

      if (storeData?.id) {
        await adminDb.from('profiles').update({ active_store_id: storeData.id }).eq('id', uid);
      }

      return new Response(
        JSON.stringify({ success: true, user_id: uid, store_id: storeData?.id }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    return new Response(JSON.stringify({ error: 'Invalid type' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err).replace('Error: ', '') }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
