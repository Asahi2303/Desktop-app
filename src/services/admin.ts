import { supabaseClient } from '../lib/supabase';

// Helper to ensure we always throw readable error messages
const asMessage = (e: any, fallback: string): string => {
  if (!e) return fallback;
  if (typeof e === 'string') return e;
  if (e?.message) return String(e.message);
  if (e?.error) return typeof e.error === 'string' ? e.error : JSON.stringify(e.error);
  try { return JSON.stringify(e); } catch { return fallback; }
};

// Create staff user securely via Electron main (recommended)
export async function createStaffUser(params: { name: string; email: string; role: 'Admin' | 'Staff' | 'Teacher'; redirectTo?: string }) {
  const { name, email, role, redirectTo } = params;
  const anyWindow = window as any;
  if (anyWindow?.electronAPI?.admin?.createStaffUser) {
  const res = await anyWindow.electronAPI.admin.createStaffUser(name, email, role, redirectTo);
  if (!res?.ok) throw new Error(asMessage(res?.error, 'Failed to create staff user'));
    // Pass through invited status and optional recovery link if present
    return {
      userId: (res.userId as string) || null,
      invited: !!res.invited,
      recoveryLink: (res.recoveryLink as string) || undefined,
    };
  }
  // Fallback: Not running under Electron main bridge. Prevent leaking service-role actions from renderer.
  throw new Error('Admin user creation is only available in the desktop app environment.');
}

// Optional: force password change check can be implemented at login using user metadata
export function mustChangePassword(user: { user_metadata?: any } | null | undefined) {
  return !!user?.user_metadata?.must_change_password;
}

// Generate an invite link without sending email (admin-only, desktop environment)
export async function generateInviteLink(params: { email: string; redirectTo?: string | null }) {
  const { email, redirectTo } = params;
  const anyWindow = window as any;
  if (anyWindow?.electronAPI?.admin?.generateInviteLink) {
  const res = await anyWindow.electronAPI.admin.generateInviteLink(email, redirectTo);
  if (!res?.ok) throw new Error(asMessage(res?.error, 'Failed to generate invite link'));
    return res.link as string;
  }
  throw new Error('Invite link generation is only available in the desktop app environment.');
}

// Generate a password reset (recovery) link (admin-only, desktop environment)
export async function generateRecoveryLink(params: { email: string; redirectTo?: string | null }) {
  const { email, redirectTo } = params;
  const anyWindow = window as any;
  if (anyWindow?.electronAPI?.admin?.generateRecoveryLink) {
  const res = await anyWindow.electronAPI.admin.generateRecoveryLink(email, redirectTo);
  if (!res?.ok) throw new Error(asMessage(res?.error, 'Failed to generate recovery link'));
    return res.link as string;
  }
  throw new Error('Recovery link generation is only available in the desktop app environment.');
}

// Directly set a user's password by email (admin-only)
export async function setUserPassword(params: { email: string; newPassword: string }) {
  const { email, newPassword } = params;
  const anyWindow = window as any;
  if (anyWindow?.electronAPI?.admin?.setUserPassword) {
  const res = await anyWindow.electronAPI.admin.setUserPassword(email, newPassword);
  if (!res?.ok) throw new Error(asMessage(res?.error, 'Failed to set user password'));
    return res.userId as string;
  }
  throw new Error('Password update is only available in the desktop app environment.');
}

// Create or update an auth user with a password (no email flow)
export async function createOrUpdateUserWithPassword(params: { email: string; password: string; name?: string; role?: 'Admin' | 'Staff' | 'Teacher' }) {
  const { email, password, name, role } = params;
  const anyWindow = window as any;
  if (anyWindow?.electronAPI?.admin?.createOrUpdateUserWithPassword) {
  const res = await anyWindow.electronAPI.admin.createOrUpdateUserWithPassword(email, password, name, role);
  if (!res?.ok) throw new Error(asMessage(res?.error, 'Failed to create/update user credentials'));
    return res.userId as string;
  }
  // Web fallback: call Supabase Edge Function (secured, server-side service role)
  try {
    const { data, error } = await supabaseClient.functions.invoke('create-user', {
      body: { email, password, name, role },
    });
    if (error) throw new Error(asMessage(error, 'Failed to create/update user credentials'));
    if (!data?.ok) throw new Error(asMessage(data?.error, 'Failed to create/update user credentials'));
    return (data.userId as string) || '';
  } catch (e: any) {
    throw new Error(asMessage(e, 'Failed to create/update user credentials'));
  }
}
