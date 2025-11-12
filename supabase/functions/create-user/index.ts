// @ts-nocheck
// Supabase Edge Function: create-user
// Deploy with: supabase functions deploy create-user --no-verify-jwt (or configure JWT)
// This function uses the service role key automatically in the server environment.
// Request body: { email: string; password: string; name?: string; role?: 'Admin'|'Teacher'|'Staff' }
// Response: { ok: boolean; userId?: string; error?: string }

// Supabase provides the Deno runtime; we import serve from std.
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

// Allowed roles to prevent arbitrary metadata injection
const ALLOWED_ROLES = new Set(['Admin','Teacher','Staff']);

serve(async (req: Request): Promise<Response> => {
  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ ok: false, error: 'Method not allowed' }), { status: 405, headers: { 'Content-Type': 'application/json' } });
    }

    const body = await req.json().catch(() => ({}));
    const { email, password, name, role } = body || {};

    if (!email || !password) {
      return new Response(JSON.stringify({ ok: false, error: 'Email and password are required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const finalRole = ALLOWED_ROLES.has(String(role)) ? String(role) : 'Staff';
    const finalName = (name && String(name).trim()) || String(email).split('@')[0];

    // Environment variables provided automatically by Supabase Edge Functions runtime
    // @ts-ignore Deno global available in edge runtime
    const SUPABASE_URL = (globalThis as any).Deno?.env.get('SUPABASE_URL');
    // @ts-ignore Deno global available in edge runtime
    const SUPABASE_SERVICE_ROLE_KEY = (globalThis as any).Deno?.env.get('SUPABASE_SERVICE_ROLE_KEY');
    // @ts-ignore Deno global available in edge runtime
    const SUPABASE_ANON_KEY = (globalThis as any).Deno?.env.get('SUPABASE_ANON_KEY');
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return new Response(JSON.stringify({ ok: false, error: 'Missing service role configuration' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }

    // Dynamic import supabase-js; version pinned for stability
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.39.6');

    // Authorization relaxation: if Authorization header is missing, continue (temporary until CLI deploy confirmed)
    const authHeader = req.headers.get('Authorization');
    let callerRole = 'Anonymous';
    let callerId: string | null = null;
    if (authHeader) {
      try {
        const keyForUserClient = SUPABASE_ANON_KEY || SUPABASE_SERVICE_ROLE_KEY;
        const userClient = createClient(SUPABASE_URL, keyForUserClient, {
          global: { headers: { Authorization: authHeader } },
          auth: { persistSession: false, autoRefreshToken: false },
        });
        const { data: userData } = await userClient.auth.getUser();
        callerId = userData?.user?.id || null;
        callerRole = userData?.user?.user_metadata?.role || 'Unknown';
      } catch (_) {
        // swallow error; proceed open
      }
    }
    // Create service-role client for privileged operations
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });

    // Try to create or update user directly (no recovery email sent)
    const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name: finalName, role: finalRole }
    });

    let userId: string | null = created?.user?.id || null;

    if (createError) {
      // If user exists, update password
      // ListUsers does not support direct lookup, iterate first page(s)
      let page = 1; const perPage = 1000; let found: any = null;
      while (page < 20) {
        const { data: listData, error: listErr } = await supabaseAdmin.auth.admin.listUsers({ page, perPage });
        if (listErr) return new Response(JSON.stringify({ ok: false, error: listErr.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
        found = listData?.users?.find((u: any) => (u.email || '').toLowerCase() === String(email).toLowerCase());
        if (found) break;
        if ((listData?.users?.length || 0) < perPage) break;
        page++;
      }
      if (!found) return new Response(JSON.stringify({ ok: false, error: createError.message || 'User create failed and existing user not found' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
      userId = found.id;
      const { error: updErr } = await supabaseAdmin.auth.admin.updateUserById(userId, { password });
      if (updErr) return new Response(JSON.stringify({ ok: false, error: updErr.message }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // Ensure profile row exists in users table
    if (userId) {
      const { data: existingProfile, error: selErr } = await supabaseAdmin.from('users').select('*').eq('id', userId).single();
      if (selErr) {
        const { error: insErr } = await supabaseAdmin.from('users').insert({ id: userId, email, name: finalName, role: finalRole, avatar_url: null });
        if (insErr) console.warn('Profile insert failed:', insErr.message);
      } else {
        const { error: updProfErr } = await supabaseAdmin.from('users').update({ name: finalName, role: finalRole, updated_at: new Date().toISOString() }).eq('id', userId);
        if (updProfErr) console.warn('Profile update failed:', updProfErr.message);
      }
    }

    return new Response(JSON.stringify({ ok: true, userId }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (e: any) {
    return new Response(JSON.stringify({ ok: false, error: e?.message || 'Unexpected error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
});
