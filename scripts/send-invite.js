#!/usr/bin/env node
/*
Usage (PowerShell):

# Basic
npm run send-invite -- --email "user@example.com" --name "User Name" --role "Staff"

# With redirect URL after they click the email link
npm run send-invite -- --email "user@example.com" --name "User Name" --role "Teacher" --redirect "https://your-site.com/finish-signup"

Requires .env in project root with:
  SUPABASE_URL=... (project URL)
  SUPABASE_SERVICE_ROLE_KEY=... (service role key)

If invite fails (e.g., user already exists), script will generate a recovery link and print it.
*/

const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
const { createClient } = require('@supabase/supabase-js');

function parseArgs() {
  const args = process.argv.slice(2);
  const out = {};
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a.startsWith('--')) {
      const key = a.replace(/^--/, '');
      const val = args[i + 1] && !args[i + 1].startsWith('--') ? args[++i] : true;
      out[key] = val;
    }
  }
  return out;
}

(async () => {
  const { email, name, role = 'Staff', redirect: redirectTo } = parseArgs();
  if (!email) {
    console.error('Missing --email');
    process.exit(1);
  }

  const SUPABASE_URL = process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL;
  const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !SERVICE_ROLE) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);
  const finalRedirect = redirectTo || process.env.SUPABASE_REDIRECT_TO || undefined;

  console.log('Inviting user...', { email, name, role, redirectTo: finalRedirect });
  const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
    data: { name, role, must_change_password: true },
    redirectTo: finalRedirect,
  });

  if (error) {
    console.error('Invite error:', { message: error.message, status: error.status, code: error.code });
    // Try recovery link fallback (useful if user already exists)
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: { redirectTo: finalRedirect },
    });
    if (!linkError && linkData?.properties?.action_link) {
      console.log('Recovery link (share with user):');
      console.log(linkData.properties.action_link);
      process.exit(0);
    }
    if (linkError) {
      console.error('Also failed to generate recovery link:', { message: linkError.message, status: linkError.status, code: linkError.code });
    }
    // Fallback 2: generate an INVITE link without sending email (admin-only)
    try {
      const { data: inviteLinkData, error: inviteLinkError } = await supabase.auth.admin.generateLink({
        type: 'invite',
        email,
        options: { redirectTo: finalRedirect },
      });
      if (!inviteLinkError && inviteLinkData?.properties?.action_link) {
        console.log('Invite link (email sending failed). Share this link with the user:');
        console.log(inviteLinkData.properties.action_link);
        process.exit(0);
      }
      if (inviteLinkError) {
        console.error('Also failed to generate invite link:', { message: inviteLinkError.message, status: inviteLinkError.status, code: inviteLinkError.code });
      }
    } catch (e) {
      console.error('Exception generating invite link:', e);
    }
    process.exit(2);
  }

  console.log('Invite sent successfully.', { userId: data?.user?.id || null });
  process.exit(0);
})();
